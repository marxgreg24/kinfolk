// family.go contains HTTP handlers for family management within a clan.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
)

// FamilyHandler handles family-related HTTP requests.
type FamilyHandler struct {
	familyRepo *repository.FamilyRepository
	userRepo   *repository.UserRepository
	memberRepo *repository.MemberRepository
}

func NewFamilyHandler(
	familyRepo *repository.FamilyRepository,
	userRepo *repository.UserRepository,
	memberRepo *repository.MemberRepository,
) *FamilyHandler {
	return &FamilyHandler{
		familyRepo: familyRepo,
		userRepo:   userRepo,
		memberRepo: memberRepo,
	}
}

// CreateFamily creates a new family within the clan leader's clan.
// Optionally adds the clan leader as the first member of that family
// (controlled by the add_leader_as_member boolean flag in the body).
//
// POST /api/v1/clan-leader/families
func (h *FamilyHandler) CreateFamily(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	var body struct {
		Name              string `json:"name" binding:"required"`
		AddLeaderAsMember bool   `json:"add_leader_as_member"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	ctx := c.Request.Context()

	leader, err := h.userRepo.GetUserByClerkID(ctx, clerkID)
	if err != nil || leader == nil {
		errorResponse(c, http.StatusInternalServerError, "could not resolve clan leader")
		return
	}
	if leader.ClanID == nil {
		errorResponse(c, http.StatusBadRequest, "you must create a clan before creating a family")
		return
	}

	family := &models.Family{
		ID:        uuid.New().String(),
		ClanID:    *leader.ClanID,
		Name:      body.Name,
		CreatedBy: leader.ID,
	}

	if err := h.familyRepo.CreateFamily(ctx, family); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// Optionally place the clan leader into this family as a member.
	if body.AddLeaderAsMember {
		leaderMember, err := h.memberRepo.GetMemberByUserID(ctx, leader.ID)
		if err != nil {
			errorResponse(c, http.StatusInternalServerError, "failed to fetch leader member record: "+err.Error())
			return
		}
		if leaderMember == nil {
			// Create a member record for the clan leader.
			familyID := family.ID
			leaderMember = &models.Member{
				ID:        uuid.New().String(),
				ClanID:    *leader.ClanID,
				FamilyID:  &familyID,
				FullName:  leader.FullName,
				Email:     &leader.Email,
				UserID:    &leader.ID,
				InvitedBy: leader.ID,
			}
			if leader.ProfilePictureURL != nil {
				leaderMember.ProfilePictureURL = leader.ProfilePictureURL
			}
			if err := h.memberRepo.CreateMember(ctx, leaderMember); err != nil {
				errorResponse(c, http.StatusInternalServerError, "failed to create leader member record: "+err.Error())
				return
			}
		} else if leaderMember.FamilyID == nil {
			// Only assign to this family if the leader has no family yet.
			// Once assigned (e.g. to the first family they created), we
			// leave the assignment unchanged on subsequent family creations.
			if err := h.memberRepo.SetMemberFamilyID(ctx, leaderMember.ID, family.ID); err != nil {
				errorResponse(c, http.StatusInternalServerError, "failed to update leader member record: "+err.Error())
				return
			}
		}
	}

	createdResponse(c, family)
}

// ListFamilyMembers returns all members belonging to a specific family.
//
// GET /api/v1/families/:id/members
func (h *FamilyHandler) ListFamilyMembers(c *gin.Context) {
	members, err := h.memberRepo.ListMembersByFamily(c.Request.Context(), c.Param("id"))
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}
	successResponse(c, members)
}

// ListFamilies returns all families for the clan leader's clan.
//
// GET /api/v1/clan-leader/families
func (h *FamilyHandler) ListFamilies(c *gin.Context) {
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
		successResponse(c, []*models.Family{})
		return
	}

	families, err := h.familyRepo.ListFamiliesByClan(ctx, *leader.ClanID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	successResponse(c, families)
}
