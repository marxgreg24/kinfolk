// user.go contains HTTP handlers for user profile management.
package handlers

import (
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkuser "github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/config"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/services"
)

// UserHandler handles user profile HTTP requests.
type UserHandler struct {
	userSvc    *services.UserService
	memberLink *services.MemberLinkService
	cfg        *config.Config
}

func NewUserHandler(userSvc *services.UserService, memberLink *services.MemberLinkService, cfg *config.Config) *UserHandler {
	return &UserHandler{userSvc: userSvc, memberLink: memberLink, cfg: cfg}
}

// GetMe returns the authenticated user's profile.
//
// GET /api/v1/users/me
func (h *UserHandler) GetMe(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	user, err := h.ensureCurrentUser(c, clerkID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	if user == nil {
		errorResponse(c, http.StatusNotFound, "user not found")
		return
	}
	if user.ClanID != nil {
		if err := h.memberLink.LinkMemberOnJoin(c.Request.Context(), user, *user.ClanID); err != nil {
			errorResponse(c, http.StatusInternalServerError, err.Error())
			return
		}
	}

	successResponse(c, user)
}

func (h *UserHandler) ensureCurrentUser(c *gin.Context, clerkID string) (*models.User, error) {
	user, err := h.userSvc.GetUserByClerkID(c.Request.Context(), clerkID)
	if err != nil {
		return nil, err
	}
	if user != nil {
		return user, nil
	}

	clerk.SetKey(h.cfg.ClerkSecretKey)
	clerkAccount, err := clerkuser.Get(c.Request.Context(), clerkID)
	if err != nil {
		return nil, err
	}

	email := ""
	if clerkAccount.PrimaryEmailAddressID != nil {
		for _, address := range clerkAccount.EmailAddresses {
			if address != nil && address.ID == *clerkAccount.PrimaryEmailAddressID {
				email = address.EmailAddress
				break
			}
		}
	}
	if email == "" {
		for _, address := range clerkAccount.EmailAddresses {
			if address != nil && address.EmailAddress != "" {
				email = address.EmailAddress
				break
			}
		}
	}
	if email == "" {
		return nil, nil
	}

	fullName := strings.TrimSpace(strings.Join([]string{
		stringValue(clerkAccount.FirstName),
		stringValue(clerkAccount.LastName),
	}, " "))
	if fullName == "" {
		fullName = email
	}

	return h.userSvc.SyncUser(c.Request.Context(), clerkID, email, fullName, "")
}

func stringValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

// UpdateMe updates the authenticated user's display name and phone.
//
// PUT /api/v1/users/me
func (h *UserHandler) UpdateMe(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	var body struct {
		FullName string `json:"full_name" binding:"required"`
		Phone    string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.userSvc.UpdateProfile(c.Request.Context(), clerkID, body.FullName, body.Phone); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// DeleteMe permanently deletes the authenticated user's account.
//
// DELETE /api/v1/users/me
func (h *UserHandler) DeleteMe(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	if err := h.userSvc.DeleteProfile(c.Request.Context(), clerkID); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// SetPassword updates the user's password via the Clerk Admin API (server-side, no session
// elevation needed) and clears the password_reset_required flag atomically.
//
// POST /api/v1/users/me/set-password
func (h *UserHandler) SetPassword(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	var body struct {
		NewPassword string `json:"new_password" binding:"required,min=8"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	// Update password via Clerk Admin API — no current-password or session elevation required.
	clerk.SetKey(h.cfg.ClerkSecretKey)
	skipChecks := false
	if _, err := clerkuser.Update(c.Request.Context(), clerkID, &clerkuser.UpdateParams{
		Password:           &body.NewPassword,
		SkipPasswordChecks: &skipChecks,
	}); err != nil {
		errorResponse(c, http.StatusInternalServerError, "Failed to update password: "+err.Error())
		return
	}

	// Clear the forced-reset flag.
	if err := h.userSvc.ClearPasswordReset(c.Request.Context(), clerkID); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}

// ClearPasswordReset marks the authenticated user's password_reset_required flag as false.
// Called by the clan leader immediately after they set their own password.
//
// POST /api/v1/users/me/clear-password-reset
func (h *UserHandler) ClearPasswordReset(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}
	if err := h.userSvc.ClearPasswordReset(c.Request.Context(), clerkID); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.Status(http.StatusNoContent)
}

// CompleteProfile sets optional profile fields (birth year, gender, photo, phone).
//
// POST /api/v1/users/me/profile
func (h *UserHandler) CompleteProfile(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	var body struct {
		BirthYear     int    `json:"birth_year"`
		Gender        string `json:"gender"`
		ProfilePicURL string `json:"profile_picture_url"`
		Phone         string `json:"phone"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.userSvc.CompleteProfile(
		c.Request.Context(),
		clerkID,
		body.BirthYear,
		body.Gender,
		body.ProfilePicURL,
		body.Phone,
	); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}
