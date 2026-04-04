// conflict.go implements business logic for detecting, recording and
// resolving data conflicts within a clan's family tree.
package services

import (
	"context"
	"fmt"

	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
)

type ConflictService struct {
	repo             *repository.ConflictRepository
	relationshipRepo *repository.RelationshipRepository
	audit            *AuditService
}

// ListConflicts returns all conflicts for a clan.
func (s *ConflictService) ListConflicts(ctx context.Context, clanID string) ([]*models.Conflict, error) {
	conflicts, err := s.repo.ListConflictsByClan(ctx, clanID)
	if err != nil {
		return nil, fmt.Errorf("services.ConflictService.ListConflicts: %w", err)
	}
	return conflicts, nil
}

// ResolveConflict applies the chosen resolution to both relationships and closes the conflict.
func (s *ConflictService) ResolveConflict(ctx context.Context, conflictID, leaderUserID, resolution string) error {
	switch resolution {
	case "approve_original", "approve_conflicting", "reject_both":
	default:
		return fmt.Errorf("services.ConflictService.ResolveConflict: invalid resolution %q", resolution)
	}

	conflict, err := s.repo.GetConflictByID(ctx, conflictID)
	if err != nil {
		return fmt.Errorf("services.ConflictService.ResolveConflict: %w", err)
	}
	if conflict == nil {
		return fmt.Errorf("services.ConflictService.ResolveConflict: conflict not found")
	}

	switch resolution {
	case "approve_original":
		if err := s.relationshipRepo.UpdateRelationshipStatus(ctx, conflict.OriginalRelationshipID, "active"); err != nil {
			return fmt.Errorf("services.ConflictService.ResolveConflict: %w", err)
		}
		if err := s.relationshipRepo.UpdateRelationshipStatus(ctx, conflict.ConflictingRelationshipID, "active"); err != nil {
			return fmt.Errorf("services.ConflictService.ResolveConflict: %w", err)
		}
	case "approve_conflicting":
		if err := s.relationshipRepo.UpdateRelationshipStatus(ctx, conflict.ConflictingRelationshipID, "active"); err != nil {
			return fmt.Errorf("services.ConflictService.ResolveConflict: %w", err)
		}
	case "reject_both":
		if err := s.relationshipRepo.UpdateRelationshipStatus(ctx, conflict.OriginalRelationshipID, "pending"); err != nil {
			return fmt.Errorf("services.ConflictService.ResolveConflict: %w", err)
		}
		if err := s.relationshipRepo.UpdateRelationshipStatus(ctx, conflict.ConflictingRelationshipID, "pending"); err != nil {
			return fmt.Errorf("services.ConflictService.ResolveConflict: %w", err)
		}
	}

	if err := s.repo.ResolveConflict(ctx, conflictID, leaderUserID, resolution); err != nil {
		return fmt.Errorf("services.ConflictService.ResolveConflict: %w", err)
	}

	_ = s.audit.Log(ctx, leaderUserID, "conflict_resolved", "conflict", conflictID,
		map[string]interface{}{"resolution": resolution})

	return nil
}
