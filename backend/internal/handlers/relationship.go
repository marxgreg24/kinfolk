// relationship.go contains HTTP handlers for managing family tree relationships.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/repository"
	"github.com/kinfolk/backend/internal/services"
)

// RelationshipHandler handles relationship HTTP requests.
type RelationshipHandler struct {
	relSvc     *services.RelationshipService
	memberRepo *repository.MemberRepository
}

func NewRelationshipHandler(
	relSvc *services.RelationshipService,
	memberRepo *repository.MemberRepository,
) *RelationshipHandler {
	return &RelationshipHandler{relSvc: relSvc, memberRepo: memberRepo}
}

// Submit creates a new relationship between two members.
//
// POST /api/v1/relationships
func (h *RelationshipHandler) Submit(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	var body struct {
		ToMemberID       string `json:"to_member_id" binding:"required"`
		ClanID           string `json:"clan_id" binding:"required"`
		RelationshipType string `json:"relationship_type" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	rel, conflicted, err := h.relSvc.SubmitRelationship(
		c.Request.Context(),
		clerkID,
		body.ToMemberID,
		body.ClanID,
		body.RelationshipType,
	)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{"data": rel, "conflicted": conflicted})
}

// ListByClan returns all relationships for a clan.
//
// GET /api/v1/clans/:id/relationships
func (h *RelationshipHandler) ListByClan(c *gin.Context) {
	rels, err := h.relSvc.ListByClan(c.Request.Context(), c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, rels)
}

// GetTreeData returns the full tree (members + active relationships) for a clan.
//
// GET /api/v1/clans/:id/tree
func (h *RelationshipHandler) GetTreeData(c *gin.Context) {
	tree, err := h.relSvc.GetTreeData(c.Request.Context(), c.Param("id"), h.memberRepo)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, tree)
}
