// conflict.go contains HTTP handlers for viewing and resolving family-tree conflicts.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/services"
)

// ConflictHandler handles conflict HTTP requests.
type ConflictHandler struct {
	conflictSvc *services.ConflictService
	userSvc     *services.UserService
}

func NewConflictHandler(conflictSvc *services.ConflictService, userSvc *services.UserService) *ConflictHandler {
	return &ConflictHandler{conflictSvc: conflictSvc, userSvc: userSvc}
}

// ListConflicts returns open conflicts for the authenticated leader's clan.
//
// GET /clan-leader/conflicts?clan_id=<id>
func (h *ConflictHandler) ListConflicts(c *gin.Context) {
	clanID := c.Query("clan_id")
	if clanID == "" {
		errorResponse(c, http.StatusBadRequest, "clan_id query param required")
		return
	}

	conflicts, err := h.conflictSvc.ListConflicts(c.Request.Context(), clanID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, conflicts)
}

// ResolveConflict applies a resolution to a conflict.
//
// POST /clan-leader/conflicts/:id/resolve
func (h *ConflictHandler) ResolveConflict(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	// Look up the internal user ID from the clerk ID.
	user, err := h.userSvc.GetUserByClerkID(c.Request.Context(), clerkID)
	if err != nil || user == nil {
		errorResponse(c, http.StatusInternalServerError, "could not resolve user")
		return
	}

	var body struct {
		Resolution string `json:"resolution" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	if err := h.conflictSvc.ResolveConflict(
		c.Request.Context(),
		c.Param("id"),
		user.ID,
		body.Resolution,
	); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Status(http.StatusNoContent)
}
