// admin.go contains HTTP handlers for admin-only operations.
package handlers

import (
	"net/http"
	"strings"
	"time"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkuser "github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/config"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
	"github.com/kinfolk/backend/internal/services"
)

// AdminHandler handles admin HTTP requests.
type AdminHandler struct {
	userRepo         *repository.UserRepository
	interestFormRepo *repository.InterestFormRepository
	userSvc          *services.UserService
	emailSvc         *services.EmailService
	auditSvc         *services.AuditService
	cfg              *config.Config
}

func NewAdminHandler(
	userRepo *repository.UserRepository,
	interestFormRepo *repository.InterestFormRepository,
	userSvc *services.UserService,
	emailSvc *services.EmailService,
	auditSvc *services.AuditService,
	cfg *config.Config,
) *AdminHandler {
	return &AdminHandler{
		userRepo:         userRepo,
		interestFormRepo: interestFormRepo,
		userSvc:          userSvc,
		emailSvc:         emailSvc,
		auditSvc:         auditSvc,
		cfg:              cfg,
	}
}

// ListUsers returns all non-admin users, with optional role/suspended filters.
//
// GET /admin/users?role=<role>&suspended=<true|false>
func (h *AdminHandler) ListUsers(c *gin.Context) {
	role := c.Query("role")
	var suspended *bool
	if s := c.Query("suspended"); s == "true" {
		t := true
		suspended = &t
	} else if s == "false" {
		f := false
		suspended = &f
	}

	users, err := h.userRepo.ListUsers(c.Request.Context(), role, suspended)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, users)
}

// CreateClanLeader provisions a new user with the clan_leader role and sends a welcome email.
//
// POST /admin/clan-leaders
func (h *AdminHandler) CreateClanLeader(c *gin.Context) {
	var body struct {
		Email    string `json:"email" binding:"required,email"`
		FullName string `json:"full_name" binding:"required"`
		Phone    string `json:"phone" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	ctx := c.Request.Context()
	existingUser, err := h.userRepo.GetUserByEmail(ctx, body.Email)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	if existingUser != nil {
		errorResponse(c, http.StatusConflict, "A user with this email already exists.")
		return
	}

	tempPassword := h.cfg.TempClanLeaderPassword

	// Split full name into first / last for Clerk.
	firstName, lastName := splitName(body.FullName)

	// Create the actual Clerk account so the user can sign in immediately.
	clerk.SetKey(h.cfg.ClerkSecretKey)
	skipChecks := true
	emails := []string{body.Email}
	clerkCreated, err := clerkuser.Create(ctx, &clerkuser.CreateParams{
		EmailAddresses:     &emails,
		Password:           &tempPassword,
		FirstName:          &firstName,
		LastName:           &lastName,
		SkipPasswordChecks: &skipChecks,
	})
	if err != nil {
		if strings.Contains(err.Error(), "form_identifier_exists") {
			errorResponse(c, http.StatusConflict, "That email address is already registered. Use a different email address.")
			return
		}

		errorResponse(c, http.StatusInternalServerError, "Failed to create Clerk account: "+err.Error())
		return
	}

	phone := body.Phone

	user := &models.User{
		ID:                    uuid.New().String(),
		ClerkUserID:           clerkCreated.ID,
		FullName:              body.FullName,
		Email:                 body.Email,
		Phone:                 &phone,
		Role:                  "clan_leader",
		PasswordResetRequired: true,
	}

	if err := h.userRepo.CreateUser(ctx, user); err != nil {
		// Best-effort: delete the Clerk user to avoid an orphaned account.
		_, _ = clerkuser.Delete(ctx, clerkCreated.ID)
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	_ = h.emailSvc.SendWelcomeClanLeader(ctx, body.Email, body.FullName, tempPassword)

	// Return the temp password so the admin can share it if needed.
	createdResponse(c, gin.H{
		"user":          user,
		"temp_password": tempPassword,
	})
}

// SuspendUser toggles the suspended flag on a user account.
//
// PATCH /admin/users/:id/suspend
func (h *AdminHandler) SuspendUser(c *gin.Context) {
	var body struct {
		Suspend bool `json:"suspend"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.userRepo.SuspendUser(c.Request.Context(), c.Param("id"), body.Suspend); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// DeleteUser permanently removes a user account.
//
// DELETE /admin/users/:id
func (h *AdminHandler) DeleteUser(c *gin.Context) {
	if err := h.userRepo.DeleteUser(c.Request.Context(), c.Param("id")); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// ListAuditLogs returns paginated audit log entries with optional filters.
//
// GET /admin/audit-logs?actor_id=&action=&target_type=&from=&to=
func (h *AdminHandler) ListAuditLogs(c *gin.Context) {
	actorID := c.Query("actor_id")
	action := c.Query("action")
	targetType := c.Query("target_type")

	var from, to *time.Time
	if s := c.Query("from"); s != "" {
		t, err := time.Parse(time.RFC3339, s)
		if err != nil {
			errorResponse(c, http.StatusBadRequest, "invalid from date (use RFC3339)")
			return
		}
		from = &t
	}
	if s := c.Query("to"); s != "" {
		t, err := time.Parse(time.RFC3339, s)
		if err != nil {
			errorResponse(c, http.StatusBadRequest, "invalid to date (use RFC3339)")
			return
		}
		to = &t
	}

	logs, err := h.auditSvc.List(c.Request.Context(), actorID, action, targetType, from, to)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, logs)
}

// ListInterestForms returns interest forms with an optional status filter.
//
// GET /admin/interest-forms?status=<pending|approved|rejected>
func (h *AdminHandler) ListInterestForms(c *gin.Context) {
	forms, err := h.interestFormRepo.ListInterestForms(c.Request.Context(), c.Query("status"))
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, forms)
}

// UpdateInterestFormStatus updates the status of an interest form.
//
// PATCH /admin/interest-forms/:id
func (h *AdminHandler) UpdateInterestFormStatus(c *gin.Context) {
	var body struct {
		Status string `json:"status" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	ctx := c.Request.Context()
	id := c.Param("id")

	// Fetch form before updating so we can email the submitter on approval.
	form, err := h.interestFormRepo.GetInterestForm(ctx, id)
	if err != nil {
		errorResponse(c, http.StatusNotFound, "interest form not found")
		return
	}

	if err := h.interestFormRepo.UpdateInterestFormStatus(ctx, id, body.Status); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Send approval email only when transitioning to approved.
	if body.Status == "approved" && form.Status != "approved" {
		if emailErr := h.emailSvc.SendInterestFormApproved(ctx, form.Email, form.FullName, form.ClanName); emailErr != nil {
			// Log but don't fail the request — the status was already updated.
			c.Header("X-Email-Warning", "approval email could not be sent")
		}
	}

	c.Status(http.StatusNoContent)
}

// splitName splits "First Last Name" into first name and everything else as last name.
// If there is only one word it becomes the first name with an empty last name.
func splitName(full string) (string, string) {
	parts := strings.SplitN(strings.TrimSpace(full), " ", 2)
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], parts[1]
}
