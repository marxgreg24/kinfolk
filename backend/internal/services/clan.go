// clan.go implements business logic for clan lifecycle management:
// creation, updates, soft-deletion and transferring ownership.
package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
)

type ClanService struct {
	repo       *repository.ClanRepository
	userRepo   *repository.UserRepository
	memberRepo *repository.MemberRepository
	audit      *AuditService
}

// ValidateClanExists returns the clan with the given name if it exists, or nil if not found.
func (s *ClanService) ValidateClanExists(ctx context.Context, name string) (*models.Clan, error) {
	clan, err := s.repo.GetClanByName(ctx, name)
	if err != nil {
		return nil, fmt.Errorf("services.ClanService.ValidateClanExists: %w", err)
	}
	return clan, nil
}

// CreateClan creates a new clan, assigns the leader, and logs the event.
func (s *ClanService) CreateClan(ctx context.Context, leaderClerkID, clanName string) (*models.Clan, error) {
	leader, err := s.userRepo.GetUserByClerkID(ctx, leaderClerkID)
	if err != nil {
		return nil, fmt.Errorf("services.ClanService.CreateClan: %w", err)
	}
	if leader == nil {
		return nil, fmt.Errorf("services.ClanService.CreateClan: leader not found")
	}

	existing, err := s.ValidateClanExists(ctx, clanName)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, fmt.Errorf("services.ClanService.CreateClan: clan name already taken")
	}

	clan := &models.Clan{
		ID:       uuid.New().String(),
		Name:     clanName,
		LeaderID: leader.ID,
	}
	if err := s.repo.CreateClan(ctx, clan); err != nil {
		return nil, fmt.Errorf("services.ClanService.CreateClan: %w", err)
	}

	leader.ClanID = &clan.ID
	if err := s.userRepo.UpdateUser(ctx, leader); err != nil {
		return nil, fmt.Errorf("services.ClanService.CreateClan: update leader clan_id: %w", err)
	}

	_ = s.audit.Log(ctx, leader.ID, "clan_created", "clan", clan.ID, nil)

	return clan, nil
}

// CreateClanByLeaderID creates a clan on behalf of an existing clan_leader user.
// Used by admins who specify the leader by internal user UUID.
func (s *ClanService) CreateClanByLeaderID(ctx context.Context, leaderUserID, clanName string) (*models.Clan, error) {
	leader, err := s.userRepo.GetUserByID(ctx, leaderUserID)
	if err != nil {
		return nil, fmt.Errorf("services.ClanService.CreateClanByLeaderID: %w", err)
	}
	if leader == nil {
		return nil, fmt.Errorf("services.ClanService.CreateClanByLeaderID: leader not found")
	}

	existing, err := s.ValidateClanExists(ctx, clanName)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, fmt.Errorf("services.ClanService.CreateClanByLeaderID: clan name already taken")
	}

	clan := &models.Clan{
		ID:       uuid.New().String(),
		Name:     clanName,
		LeaderID: leader.ID,
	}
	if err := s.repo.CreateClan(ctx, clan); err != nil {
		return nil, fmt.Errorf("services.ClanService.CreateClanByLeaderID: %w", err)
	}

	leader.ClanID = &clan.ID
	if err := s.userRepo.UpdateUser(ctx, leader); err != nil {
		return nil, fmt.Errorf("services.ClanService.CreateClanByLeaderID: update leader clan_id: %w", err)
	}

	_ = s.audit.Log(ctx, leader.ID, "clan_created", "clan", clan.ID, nil)

	return clan, nil
}

// GetClanByID returns a single clan by its UUID.
func (s *ClanService) GetClanByID(ctx context.Context, id string) (*models.Clan, error) {
	clan, err := s.repo.GetClanByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("services.ClanService.GetClanByID: %w", err)
	}
	return clan, nil
}

// GetClanWithMembers returns the clan and all its members in one call.
func (s *ClanService) GetClanWithMembers(ctx context.Context, clanID string) (*models.Clan, []*models.Member, error) {
	clan, err := s.repo.GetClanByID(ctx, clanID)
	if err != nil {
		return nil, nil, fmt.Errorf("services.ClanService.GetClanWithMembers: %w", err)
	}
	if clan == nil {
		return nil, nil, fmt.Errorf("services.ClanService.GetClanWithMembers: clan not found")
	}

	members, err := s.memberRepo.ListMembersByClan(ctx, clanID)
	if err != nil {
		return nil, nil, fmt.Errorf("services.ClanService.GetClanWithMembers: %w", err)
	}

	return clan, members, nil
}
