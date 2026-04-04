// relationship.go implements business logic for creating and validating
// relationships between members, preventing cycles and duplicate edges.
package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
)

type RelationshipService struct {
	repo      *repository.RelationshipRepository
	conflict  *repository.ConflictRepository
	userRepo  *repository.UserRepository
	inference *InferenceService
	audit     *AuditService
}

// SubmitRelationship creates a relationship. Returns the relationship, a conflict flag,
// and any error. conflicted=true means a conflict record was also created.
func (s *RelationshipService) SubmitRelationship(
	ctx context.Context,
	fromClerkID, toMemberID, clanID, relType string,
) (*models.Relationship, bool, error) {
	user, err := s.userRepo.GetUserByClerkID(ctx, fromClerkID)
	if err != nil {
		return nil, false, fmt.Errorf("services.RelationshipService.SubmitRelationship: resolve user: %w", err)
	}
	if user == nil {
		return nil, false, fmt.Errorf("services.RelationshipService.SubmitRelationship: user not found")
	}
	fromUserID := user.ID

	existing, err := s.repo.GetRelationshipBetween(ctx, fromUserID, toMemberID)
	if err != nil {
		return nil, false, fmt.Errorf("services.RelationshipService.SubmitRelationship: %w", err)
	}

	newRel := &models.Relationship{
		ID:               uuid.New().String(),
		ClanID:           clanID,
		FromUserID:       fromUserID,
		ToMemberID:       toMemberID,
		RelationshipType: relType,
		IsInferred:       false,
		SubmittedBy:      &fromUserID,
	}

	if existing == nil {
		newRel.Status = "active"
		if err := s.repo.CreateRelationship(ctx, newRel); err != nil {
			return nil, false, fmt.Errorf("services.RelationshipService.SubmitRelationship: %w", err)
		}

		_ = s.inference.RunInference(ctx, clanID, fromUserID, toMemberID, relType)
		_ = s.audit.Log(ctx, fromUserID, "relationship_submitted", "relationship", newRel.ID, nil)

		return newRel, false, nil
	}

	// Conflict path.
	newRel.Status = "conflicted"
	if err := s.repo.CreateRelationship(ctx, newRel); err != nil {
		return nil, false, fmt.Errorf("services.RelationshipService.SubmitRelationship (conflict): %w", err)
	}

	conflict := &models.Conflict{
		ID:                        uuid.New().String(),
		ClanID:                    clanID,
		OriginalRelationshipID:    existing.ID,
		ConflictingRelationshipID: newRel.ID,
	}
	if err := s.conflict.CreateConflict(ctx, conflict); err != nil {
		return nil, false, fmt.Errorf("services.RelationshipService.SubmitRelationship: create conflict: %w", err)
	}

	_ = s.audit.Log(ctx, fromUserID, "relationship_conflict_created", "conflict", conflict.ID, nil)

	return newRel, true, nil
}

// ListByClan returns all relationships for a clan.
func (s *RelationshipService) ListByClan(ctx context.Context, clanID string) ([]*models.Relationship, error) {
	rels, err := s.repo.ListRelationshipsByClan(ctx, clanID)
	if err != nil {
		return nil, fmt.Errorf("services.RelationshipService.ListByClan: %w", err)
	}
	return rels, nil
}

// GetTreeData returns a map suitable for rendering the family tree.
func (s *RelationshipService) GetTreeData(
	ctx context.Context,
	clanID string,
	memberRepo *repository.MemberRepository,
) (map[string]interface{}, error) {
	members, err := memberRepo.ListMembersByClan(ctx, clanID)
	if err != nil {
		return nil, fmt.Errorf("services.RelationshipService.GetTreeData: %w", err)
	}

	rels, err := s.repo.ListActiveRelationshipsByClan(ctx, clanID)
	if err != nil {
		return nil, fmt.Errorf("services.RelationshipService.GetTreeData: %w", err)
	}

	return map[string]interface{}{
		"members":       members,
		"relationships": rels,
	}, nil
}
