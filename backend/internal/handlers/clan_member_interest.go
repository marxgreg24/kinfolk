// clan_member_interest.go handles expressions of interest in joining a specific clan.
package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
	"github.com/kinfolk/backend/internal/services"
)

// ClanMemberInterestHandler handles clan member interest HTTP requests.
type ClanMemberInterestHandler struct {
	repo     *repository.ClanMemberInterestRepository
	clanRepo *repository.ClanRepository
	userRepo *repository.UserRepository
	emailSvc *services.EmailService
}

func NewClanMemberInterestHandler(
	repo *repository.ClanMemberInterestRepository,
	clanRepo *repository.ClanRepository,
	userRepo *repository.UserRepository,
	emailSvc *services.EmailService,
) *ClanMemberInterestHandler {
	return &ClanMemberInterestHandler{
		repo:     repo,
		clanRepo: clanRepo,
		userRepo: userRepo,
		emailSvc: emailSvc,
	}
}

// Submit stores a public interest form for joining an existing clan.
//
// POST /api/v1/clan-member-interests
func (h *ClanMemberInterestHandler) Submit(c *gin.Context) {
	var body struct {
		ClanID   string `json:"clan_id"   binding:"required"`
		FullName string `json:"full_name" binding:"required"`
		Email    string `json:"email"     binding:"required,email"`
		Phone    string `json:"phone"     binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	ctx := c.Request.Context()

	clan, err := h.clanRepo.GetClanByID(ctx, body.ClanID)
	if err != nil || clan == nil {
		errorResponse(c, http.StatusNotFound, "clan not found")
		return
	}

	interest := &models.ClanMemberInterest{
		ID:       uuid.New().String(),
		ClanID:   body.ClanID,
		FullName: body.FullName,
		Email:    strings.ToLower(strings.TrimSpace(body.Email)),
		Phone:    body.Phone,
	}

	if err := h.repo.Create(ctx, interest); err != nil {
		// Unique constraint violation → duplicate submission.
		if strings.Contains(err.Error(), "duplicate") || strings.Contains(err.Error(), "unique") {
			errorResponse(c, http.StatusConflict, "You have already expressed interest in this clan. The clan leader will be in touch.")
			return
		}
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Best-effort confirmation email to the submitter.
	_ = h.emailSvc.SendClanInterestConfirmation(ctx, body.Email, body.FullName, clan.Name)

	createdResponse(c, interest)
}

// List returns all pending interest forms for the clan leader's clan.
//
// GET /api/v1/clan-leader/member-interests
func (h *ClanMemberInterestHandler) List(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	ctx := c.Request.Context()

	leader, err := h.userRepo.GetUserByClerkID(ctx, clerkID)
	if err != nil || leader == nil {
		errorResponse(c, http.StatusInternalServerError, "could not resolve clan leader")
		return
	}
	if leader.ClanID == nil {
		successResponse(c, []*models.ClanMemberInterest{})
		return
	}

	items, err := h.repo.ListByClan(ctx, *leader.ClanID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, items)
}

// Archive marks an interest form as archived (after the leader has acted on it).
//
// POST /api/v1/clan-leader/member-interests/:id/archive
func (h *ClanMemberInterestHandler) Archive(c *gin.Context) {
	if err := h.repo.Archive(c.Request.Context(), c.Param("id")); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}
