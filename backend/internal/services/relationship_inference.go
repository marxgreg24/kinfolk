// relationship_inference.go implements graph traversal logic to infer
// indirect relationships (e.g. cousins, in-laws) from the stored edge set.
package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
)

type InferenceService struct {
	relationshipRepo *repository.RelationshipRepository
	userRepo         *repository.UserRepository
	audit            *AuditService
}

var inverseRelType = map[string]string{
	"parent":      "child",
	"child":       "parent",
	"grandparent": "grandchild",
	"grandchild":  "grandparent",
	"sibling":     "sibling",
	"uncle":       "nephew",
	"nephew":      "uncle",
	"aunt":        "niece",
	"niece":       "aunt",
	"step_parent": "step_child",
	"step_child":  "step_parent",
	"in_law":      "in_law",
	"spouse":      "spouse",
	"co_wife":     "co_wife",
}

type inferredEdge struct {
	fromID  string
	toID    string
	relType string
}

// RunInference derives implicit relationships from the newly submitted edge.
// It does NOT recurse — only one hop of inference is applied per call.
func (s *InferenceService) RunInference(
	ctx context.Context,
	clanID, newFromUserID, newToMemberID, newRelType string,
) error {
	allRels, err := s.relationshipRepo.ListActiveRelationshipsByClan(ctx, clanID)
	if err != nil {
		return fmt.Errorf("services.InferenceService.RunInference: load edges: %w", err)
	}

	var toWrite []inferredEdge

	switch newRelType {
	case "parent":
		// newFromUserID is parent of newToMemberID.
		// Rule 1: newToMemberID is parent of X → newFromUserID is grandparent of X.
		for _, r := range allRels {
			if r.FromUserID == newToMemberID && r.RelationshipType == "parent" {
				toWrite = append(toWrite, inferredEdge{newFromUserID, r.ToMemberID, "grandparent"})
			}
		}
		// Rule 2: newFromUserID is parent of Y (other children) → newToMemberID is sibling of Y.
		for _, r := range allRels {
			if r.FromUserID == newFromUserID && r.RelationshipType == "parent" && r.ToMemberID != newToMemberID {
				toWrite = append(toWrite, inferredEdge{newToMemberID, r.ToMemberID, "sibling"})
				toWrite = append(toWrite, inferredEdge{r.ToMemberID, newToMemberID, "sibling"})
			}
		}

	case "child":
		// newFromUserID is child of newToMemberID.
		// Rule 1: newFromUserID is parent of X → newToMemberID is grandparent of X.
		for _, r := range allRels {
			if r.FromUserID == newFromUserID && r.RelationshipType == "parent" {
				toWrite = append(toWrite, inferredEdge{newToMemberID, r.ToMemberID, "grandparent"})
			}
		}
		// Rule 2: newToMemberID is parent of Y (siblings) → newFromUserID is sibling of Y.
		for _, r := range allRels {
			if r.FromUserID == newToMemberID && r.RelationshipType == "parent" && r.ToMemberID != newFromUserID {
				toWrite = append(toWrite, inferredEdge{newFromUserID, r.ToMemberID, "sibling"})
				toWrite = append(toWrite, inferredEdge{r.ToMemberID, newFromUserID, "sibling"})
			}
		}

	case "sibling":
		// newFromUserID is sibling of newToMemberID.
		// newToMemberID is parent of X → get gender of newFromUserID to determine uncle/aunt.
		user, err := s.userRepo.GetUserByID(ctx, newFromUserID)
		if err != nil {
			return fmt.Errorf("services.InferenceService.RunInference: get user gender: %w", err)
		}
		auntOrUncle := "uncle"
		if user != nil && user.Gender != nil && *user.Gender == "female" {
			auntOrUncle = "aunt"
		}
		for _, r := range allRels {
			if r.FromUserID == newToMemberID && r.RelationshipType == "parent" {
				toWrite = append(toWrite, inferredEdge{newFromUserID, r.ToMemberID, auntOrUncle})
			}
		}

	case "spouse":
		// newFromUserID is spouse of newToMemberID.
		// newToMemberID is parent of X → if newFromUserID not already parent of X → step_parent.
		for _, r := range allRels {
			if r.FromUserID == newToMemberID && r.RelationshipType == "parent" {
				existing, err := s.relationshipRepo.GetRelationshipBetween(ctx, newFromUserID, r.ToMemberID)
				if err != nil {
					return fmt.Errorf("services.InferenceService.RunInference: check existing: %w", err)
				}
				if existing == nil {
					toWrite = append(toWrite, inferredEdge{newFromUserID, r.ToMemberID, "step_parent"})
				}
			}
		}
	}

	for _, e := range toWrite {
		if err := s.writeInferredPair(ctx, clanID, e.fromID, e.toID, e.relType); err != nil {
			// Non-fatal: log and continue.
			_ = s.audit.Log(ctx, "", "relationship_inference_error", "relationship", "",
				map[string]interface{}{"error": err.Error(), "from": e.fromID, "to": e.toID, "type": e.relType})
		}
	}
	return nil
}

func (s *InferenceService) writeInferredPair(ctx context.Context, clanID, fromID, toID, relType string) error {
	existing, err := s.relationshipRepo.GetRelationshipBetween(ctx, fromID, toID)
	if err != nil {
		return fmt.Errorf("writeInferredPair: check forward: %w", err)
	}
	if existing == nil {
		fwd := &models.Relationship{
			ID:               uuid.New().String(),
			ClanID:           clanID,
			FromUserID:       fromID,
			ToMemberID:       toID,
			RelationshipType: relType,
			IsInferred:       true,
			Status:           "active",
		}
		if err := s.relationshipRepo.CreateRelationship(ctx, fwd); err != nil {
			return fmt.Errorf("writeInferredPair: create forward: %w", err)
		}
		_ = s.audit.Log(ctx, "", "relationship_inferred", "relationship", fwd.ID,
			map[string]interface{}{"type": relType, "from": fromID, "to": toID})
	}

	inv, ok := inverseRelType[relType]
	if !ok {
		return nil
	}
	existingInv, err := s.relationshipRepo.GetRelationshipBetween(ctx, toID, fromID)
	if err != nil {
		return fmt.Errorf("writeInferredPair: check inverse: %w", err)
	}
	if existingInv == nil {
		bwd := &models.Relationship{
			ID:               uuid.New().String(),
			ClanID:           clanID,
			FromUserID:       toID,
			ToMemberID:       fromID,
			RelationshipType: inv,
			IsInferred:       true,
			Status:           "active",
		}
		if err := s.relationshipRepo.CreateRelationship(ctx, bwd); err != nil {
			return fmt.Errorf("writeInferredPair: create inverse: %w", err)
		}
		_ = s.audit.Log(ctx, "", "relationship_inferred", "relationship", bwd.ID,
			map[string]interface{}{"type": inv, "from": toID, "to": fromID})
	}
	return nil
}
