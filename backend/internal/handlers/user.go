// user.go contains HTTP handlers for user profile management.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/services"
)

// UserHandler handles user profile HTTP requests.
type UserHandler struct {
	userSvc *services.UserService
}

func NewUserHandler(userSvc *services.UserService) *UserHandler {
	return &UserHandler{userSvc: userSvc}
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

	user, err := h.userSvc.GetUserByClerkID(c.Request.Context(), clerkID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	if user == nil {
		errorResponse(c, http.StatusNotFound, "user not found")
		return
	}

	successResponse(c, user)
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
