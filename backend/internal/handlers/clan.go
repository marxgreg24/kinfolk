// clan.go contains HTTP handlers for clan lifecycle management.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/services"
)

// ClanHandler handles clan-related HTTP requests.
type ClanHandler struct {
	clanSvc *services.ClanService
}

func NewClanHandler(clanSvc *services.ClanService) *ClanHandler {
	return &ClanHandler{clanSvc: clanSvc}
}

// ValidateName checks whether a clan name is already taken.
//
// GET /api/v1/clans/validate?name=<name>
func (h *ClanHandler) ValidateName(c *gin.Context) {
	name := c.Query("name")
	if name == "" {
		errorResponse(c, http.StatusBadRequest, "name query param required")
		return
	}

	clan, err := h.clanSvc.ValidateClanExists(c.Request.Context(), name)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	if clan != nil {
		successResponse(c, gin.H{"available": true, "clan_id": clan.ID})
	} else {
		successResponse(c, gin.H{"available": false})
	}
}

// GetByID returns a single clan by its UUID.
//
// GET /api/v1/clans/:id
func (h *ClanHandler) GetByID(c *gin.Context) {
	clan, err := h.clanSvc.GetClanByID(c.Request.Context(), c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	if clan == nil {
		errorResponse(c, http.StatusNotFound, "clan not found")
		return
	}

	successResponse(c, clan)
}

// GetMembers returns the clan and its full member list.
//
// GET /api/v1/clans/:id/members
func (h *ClanHandler) GetMembers(c *gin.Context) {
	clan, members, err := h.clanSvc.GetClanWithMembers(c.Request.Context(), c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, gin.H{"clan": clan, "members": members})
}

// Create creates a new clan with the authenticated user as leader.
//
// POST /clan-leader/clans
func (h *ClanHandler) Create(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	var body struct {
		Name string `json:"name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	clan, err := h.clanSvc.CreateClan(c.Request.Context(), clerkID, body.Name)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	createdResponse(c, clan)
}

// ListPublic returns all clans for public display on the landing page (name + id only).
//
// GET /api/v1/clans
func (h *ClanHandler) ListPublic(c *gin.Context) {
	clans, err := h.clanSvc.ListAll(c.Request.Context())
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	successResponse(c, clans)
}

// ListAll returns all clans. Used by admin to display clan names alongside leader accounts.
//
// GET /admin/clans
func (h *ClanHandler) ListAll(c *gin.Context) {
	clans, err := h.clanSvc.ListAll(c.Request.Context())
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	successResponse(c, clans)
}

// CreateForAdmin creates a new clan on behalf of a specified clan leader.
// Used by admins who can assign any existing clan_leader user as the owner.
//
// POST /admin/clans
func (h *ClanHandler) CreateForAdmin(c *gin.Context) {
	var body struct {
		Name     string `json:"name" binding:"required"`
		LeaderID string `json:"leader_id" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	clan, err := h.clanSvc.CreateClanByLeaderID(c.Request.Context(), body.LeaderID, body.Name)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	createdResponse(c, clan)
}
