// member.go implements business logic for member management including
// validation, photo upload orchestration via Cloudinary and linking to users.
package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
)

type MemberService struct {
	repo     *repository.MemberRepository
	clanRepo *repository.ClanRepository
	userRepo *repository.UserRepository
	email    *EmailService
	audit    *AuditService
}

// AddMember creates a new member in a clan and optionally sends an invitation email.
func (s *MemberService) AddMember(
	ctx context.Context,
	leaderClerkID, clanID, fullName string,
	memberEmail *string,
	profilePicURL *string,
) (*models.Member, error) {
	leader, err := s.userRepo.GetUserByClerkID(ctx, leaderClerkID)
	if err != nil {
		return nil, fmt.Errorf("services.MemberService.AddMember: resolve leader: %w", err)
	}
	if leader == nil {
		return nil, fmt.Errorf("services.MemberService.AddMember: leader not found")
	}

	member := &models.Member{
		ID:                uuid.New().String(),
		ClanID:            clanID,
		FullName:          fullName,
		Email:             memberEmail,
		ProfilePictureURL: profilePicURL,
		InvitedBy:         leader.ID,
	}

	if err := s.repo.CreateMember(ctx, member); err != nil {
		return nil, fmt.Errorf("services.MemberService.AddMember: %w", err)
	}

	if memberEmail != nil && *memberEmail != "" {
		clanName := clanID // fallback to ID if lookup fails
		if clan, err := s.clanRepo.GetClanByID(ctx, clanID); err == nil && clan != nil {
			clanName = clan.Name
		}
		if err := s.email.SendClanInvitation(ctx, *memberEmail, fullName, clanName); err != nil {
			// Log but do not fail — email delivery is best-effort.
			_ = s.audit.Log(ctx, leaderClerkID, "member_invitation_email_failed", "member", member.ID,
				map[string]interface{}{"error": err.Error()})
		}
	}

	_ = s.audit.Log(ctx, leaderClerkID, "member_added", "member", member.ID, nil)

	return member, nil
}

// ListMembers returns all members belonging to a clan.
func (s *MemberService) ListMembers(ctx context.Context, clanID string) ([]*models.Member, error) {
	members, err := s.repo.ListMembersByClan(ctx, clanID)
	if err != nil {
		return nil, fmt.Errorf("services.MemberService.ListMembers: %w", err)
	}
	return members, nil
}

// GetMember returns a single member by ID.
func (s *MemberService) GetMember(ctx context.Context, id string) (*models.Member, error) {
	member, err := s.repo.GetMemberByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("services.MemberService.GetMember: %w", err)
	}
	return member, nil
}
