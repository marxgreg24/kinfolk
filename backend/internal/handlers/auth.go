// auth.go contains HTTP handlers for authentication flows including
// Clerk user sync on first sign-in.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/repository"
	"github.com/kinfolk/backend/internal/services"
)

// AuthHandler handles authentication-related HTTP requests.
type AuthHandler struct {
	userSvc  *services.UserService
	userRepo *repository.UserRepository
}

func NewAuthHandler(
	userSvc *services.UserService,
	userRepo *repository.UserRepository,
) *AuthHandler {
	return &AuthHandler{
		userSvc:  userSvc,
		userRepo: userRepo,
	}
}

// Sync upserts the authenticated Clerk user into our users table and runs
// the member-link heuristic for first-time sign-ins.
//
// POST /api/v1/auth/sync
func (h *AuthHandler) Sync(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	var body struct {
		Email    string `json:"email" binding:"required,email"`
		FullName string `json:"full_name" binding:"required"`
		ClanID   string `json:"clan_id"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	user, err := h.userSvc.SyncUser(c.Request.Context(), clerkID, body.Email, body.FullName, body.ClanID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, user)
}
