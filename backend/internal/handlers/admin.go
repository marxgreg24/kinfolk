// admin.go contains HTTP handlers for admin-only operations.
package handlers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
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
}

func NewAdminHandler(
	userRepo *repository.UserRepository,
	interestFormRepo *repository.InterestFormRepository,
	userSvc *services.UserService,
	emailSvc *services.EmailService,
	auditSvc *services.AuditService,
) *AdminHandler {
	return &AdminHandler{
		userRepo:         userRepo,
		interestFormRepo: interestFormRepo,
		userSvc:          userSvc,
		emailSvc:         emailSvc,
		auditSvc:         auditSvc,
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
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	user := &models.User{
		ID:          uuid.New().String(),
		ClerkUserID: "pending-" + uuid.New().String(),
		FullName:    body.FullName,
		Email:       body.Email,
		Role:        "clan_leader",
	}

	if err := h.userRepo.CreateUser(c.Request.Context(), user); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	_ = h.emailSvc.SendWelcomeClanLeader(c.Request.Context(), body.Email, body.FullName, "")

	createdResponse(c, user)
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

	if err := h.interestFormRepo.UpdateInterestFormStatus(
		c.Request.Context(),
		c.Param("id"),
		body.Status,
	); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}
