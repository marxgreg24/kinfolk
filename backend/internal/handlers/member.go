// member.go contains HTTP handlers for clan member management.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/services"
)

// MemberHandler handles member-related HTTP requests.
type MemberHandler struct {
	memberSvc *services.MemberService
}

func NewMemberHandler(memberSvc *services.MemberService) *MemberHandler {
	return &MemberHandler{memberSvc: memberSvc}
}

// AddMember adds a new member to a clan.
//
// POST /clan-leader/clans/:id/members
func (h *MemberHandler) AddMember(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	clanID := c.Param("id")

	var body struct {
		FullName      string  `json:"full_name" binding:"required"`
		Email         *string `json:"email"`
		ProfilePicURL *string `json:"profile_picture_url"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	member, err := h.memberSvc.AddMember(
		c.Request.Context(),
		clerkID,
		clanID,
		body.FullName,
		body.Email,
		body.ProfilePicURL,
	)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	createdResponse(c, member)
}

// ListMembers returns all members of a clan.
//
// GET /api/v1/clans/:id/members
func (h *MemberHandler) ListMembers(c *gin.Context) {
	members, err := h.memberSvc.ListMembers(c.Request.Context(), c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, members)
}
