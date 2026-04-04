// match_suggestion.go contains HTTP handlers for listing, reviewing and
// acting on system-generated suggestions that members across clans may match.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/repository"
	"github.com/kinfolk/backend/internal/services"
)

// MatchSuggestionHandler handles match suggestion HTTP requests.
type MatchSuggestionHandler struct {
	matchRepo  *repository.MatchSuggestionRepository
	memberLink *services.MemberLinkService
	audit      *services.AuditService
	userRepo   *repository.UserRepository
}

// NewMatchSuggestionHandler constructs a MatchSuggestionHandler.
func NewMatchSuggestionHandler(
	matchRepo *repository.MatchSuggestionRepository,
	memberLink *services.MemberLinkService,
	audit *services.AuditService,
	userRepo *repository.UserRepository,
) *MatchSuggestionHandler {
	return &MatchSuggestionHandler{
		matchRepo:  matchRepo,
		memberLink: memberLink,
		audit:      audit,
		userRepo:   userRepo,
	}
}

// ListSuggestions returns pending match suggestions for a given clan.
// GET /clan-leader/match-suggestions?clan_id=<uuid>
func (h *MatchSuggestionHandler) ListSuggestions(c *gin.Context) {
	clanID := c.Query("clan_id")
	if clanID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "clan_id is required"})
		return
	}

	suggestions, err := h.matchRepo.ListMatchSuggestionsByClan(c.Request.Context(), clanID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"data":    suggestions,
		"message": "match suggestions retrieved",
	})
}

// ApproveSuggestion links the matched member to the user and marks the suggestion approved.
// POST /clan-leader/match-suggestions/:id/approve
func (h *MatchSuggestionHandler) ApproveSuggestion(c *gin.Context) {
	id := c.Param("id")

	if err := h.matchRepo.ApproveMatchSuggestion(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	clerkUserID, _ := middleware.GetClerkUserID(c)
	user, _ := h.userRepo.GetUserByClerkID(c.Request.Context(), clerkUserID)
	if user != nil {
		_ = h.audit.Log(c.Request.Context(), user.ID, "match_suggestion_approved", "match_suggestion", id, nil)
	}

	c.JSON(http.StatusOK, gin.H{"message": "suggestion approved"})
}

// RejectSuggestion marks a match suggestion as rejected.
// POST /clan-leader/match-suggestions/:id/reject
func (h *MatchSuggestionHandler) RejectSuggestion(c *gin.Context) {
	id := c.Param("id")

	if err := h.matchRepo.UpdateMatchSuggestionStatus(c.Request.Context(), id, "rejected"); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "suggestion rejected"})
}
