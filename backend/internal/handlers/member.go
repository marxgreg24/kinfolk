// member.go contains HTTP handlers for clan member management.
package handlers

import (
	"net/http"

	"github.com/clerk/clerk-sdk-go/v2"
	clerkuser "github.com/clerk/clerk-sdk-go/v2/user"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/config"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
	"github.com/kinfolk/backend/internal/services"
)

// MemberHandler handles member-related HTTP requests.
type MemberHandler struct {
	memberSvc *services.MemberService
	relSvc    *services.RelationshipService
	userRepo  *repository.UserRepository
	clanRepo  *repository.ClanRepository
	emailSvc  *services.EmailService
	cfg       *config.Config
}

func NewMemberHandler(
	memberSvc *services.MemberService,
	relSvc *services.RelationshipService,
	userRepo *repository.UserRepository,
	clanRepo *repository.ClanRepository,
	emailSvc *services.EmailService,
	cfg *config.Config,
) *MemberHandler {
	return &MemberHandler{
		memberSvc: memberSvc,
		relSvc:    relSvc,
		userRepo:  userRepo,
		clanRepo:  clanRepo,
		emailSvc:  emailSvc,
		cfg:       cfg,
	}
}

// AddMember provisions a full Kinfolk account for a new clan member.
//
// The handler:
//  1. Creates a Clerk account with a temporary password.
//  2. Creates a DB user record (general_user, password_reset_required=true).
//  3. Creates a member record linked to the new user.
//  4. Records the clan leader's relationship to this member.
//  5. Sends a welcome email with login credentials.
//
// POST /api/v1/clan-leader/clans/:id/members
func (h *MemberHandler) AddMember(c *gin.Context) {
	leaderClerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	clanID := c.Param("id")

	var body struct {
		FullName         string  `json:"full_name"          binding:"required"`
		Email            string  `json:"email"              binding:"required,email"`
		RelationshipType string  `json:"relationship_type"`
		FamilyID         string  `json:"family_id"          binding:"required"`
		ProfilePicURL    *string `json:"profile_picture_url"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	ctx := c.Request.Context()

	// ── 1. Resolve the clan leader ───────────────────────────────────────────
	leader, err := h.userRepo.GetUserByClerkID(ctx, leaderClerkID)
	if err != nil || leader == nil {
		errorResponse(c, http.StatusInternalServerError, "could not resolve clan leader")
		return
	}

	// ── 2. Resolve the clan (for the welcome email) ──────────────────────────
	clan, err := h.clanRepo.GetClanByID(ctx, clanID)
	if err != nil || clan == nil {
		errorResponse(c, http.StatusNotFound, "clan not found")
		return
	}

	// ── 3. Create Clerk account with the shared temporary password ───────────
	tempPassword := h.cfg.TempClanLeaderPassword
	firstName, lastName := splitName(body.FullName)

	clerk.SetKey(h.cfg.ClerkSecretKey)
	skipChecks := true
	emails := []string{body.Email}
	clerkCreated, err := clerkuser.Create(ctx, &clerkuser.CreateParams{
		EmailAddresses:     &emails,
		Password:           &tempPassword,
		FirstName:          &firstName,
		LastName:           &lastName,
		SkipPasswordChecks: &skipChecks,
	})
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "failed to create Clerk account: "+err.Error())
		return
	}

	// ── 4. Create DB user record ─────────────────────────────────────────────
	newUserID := uuid.New().String()
	newUser := &models.User{
		ID:                    newUserID,
		ClerkUserID:           clerkCreated.ID,
		FullName:              body.FullName,
		Email:                 body.Email,
		Role:                  "general_user",
		ClanID:                &clanID,
		PasswordResetRequired: true,
	}
	if body.ProfilePicURL != nil {
		newUser.ProfilePictureURL = body.ProfilePicURL
	}

	if err := h.userRepo.CreateUser(ctx, newUser); err != nil {
		// Roll back the Clerk account to avoid orphans.
		_, _ = clerkuser.Delete(ctx, clerkCreated.ID)
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// ── 5. Create member record linked to the new user ───────────────────────
	memberID := uuid.New().String()
	email := body.Email
	member, err := h.memberSvc.AddMemberDirect(ctx, memberID, clanID, body.FamilyID, body.FullName, &email, body.ProfilePicURL, &newUserID, leader.ID)
	if err != nil {
		_, _ = clerkuser.Delete(ctx, clerkCreated.ID)
		_ = h.userRepo.DeleteUser(ctx, newUserID)
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	// ── 6. Record the clan leader's relationship to this member ──────────────
	// Skip if the leader indicated "not_related" or left the field blank.
	if body.RelationshipType != "" && body.RelationshipType != "not_related" {
		if _, _, err := h.relSvc.SubmitRelationship(ctx, leaderClerkID, memberID, clanID, body.RelationshipType); err != nil {
			// Non-fatal: member + user already created; log but continue.
			_ = err
		}
	}

	// ── 7. Send welcome email with credentials ───────────────────────────────
	_ = h.emailSvc.SendWelcomeGeneralUser(ctx, body.Email, body.FullName, clan.Name, tempPassword)

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
