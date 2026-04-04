// member_link.go implements the logic for linking an existing Member record
// to a registered User account, including invitation and confirmation flows.
package services

import (
	"context"
	"fmt"
	"sort"
	"strings"

	"github.com/google/uuid"
	fuzzy "github.com/lithammer/fuzzysearch/fuzzy"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
)

type MemberLinkService struct {
	memberRepo *repository.MemberRepository
	matchRepo  *repository.MatchSuggestionRepository
	audit      *AuditService
}

// LinkMemberOnJoin attempts to link a newly joined user to an unlinked member
// in their clan via email match or fuzzy name match.
func (s *MemberLinkService) LinkMemberOnJoin(ctx context.Context, newUser *models.User, clanID string) error {
	unlinked, err := s.memberRepo.ListUnlinkedMembersByClan(ctx, clanID)
	if err != nil {
		return fmt.Errorf("services.MemberLinkService.LinkMemberOnJoin: %w", err)
	}

	for _, member := range unlinked {
		// Step 1 — exact email match.
		if member.Email != nil && strings.EqualFold(*member.Email, newUser.Email) {
			if err := s.memberRepo.LinkMemberToUser(ctx, member.ID, newUser.ID); err != nil {
				return fmt.Errorf("services.MemberLinkService.LinkMemberOnJoin: link by email: %w", err)
			}
			_ = s.audit.Log(ctx, newUser.ID, "member_linked_by_email", "member", member.ID, nil)
			return nil
		}

		// Step 2 — fuzzy name match. RankMatchNormalized returns int 0–100, or -1 for no match.
		score := fuzzy.RankMatchNormalized(normaliseName(member.FullName), normaliseName(newUser.FullName))

		switch {
		case score >= 85:
			if err := s.memberRepo.LinkMemberToUser(ctx, member.ID, newUser.ID); err != nil {
				return fmt.Errorf("services.MemberLinkService.LinkMemberOnJoin: link by name: %w", err)
			}
			_ = s.audit.Log(ctx, newUser.ID, "member_linked_by_name", "member", member.ID,
				map[string]interface{}{"score": score})

		case score >= 70:
			suggestion := &models.MatchSuggestion{
				ID:         uuid.New().String(),
				UserID:     newUser.ID,
				MemberID:   member.ID,
				Confidence: score,
				Status:     "pending",
			}
			if err := s.matchRepo.CreateMatchSuggestion(ctx, suggestion); err != nil {
				return fmt.Errorf("services.MemberLinkService.LinkMemberOnJoin: create suggestion: %w", err)
			}
			_ = s.audit.Log(ctx, newUser.ID, "member_match_pending", "member", member.ID,
				map[string]interface{}{"score": score})

		default:
			_ = s.audit.Log(ctx, newUser.ID, "member_no_match", "member", member.ID,
				map[string]interface{}{"score": score})
		}
	}

	return nil
}

// normaliseName lowercases, trims, and sorts name tokens so that
// "John Doe" and "Doe John" produce the same normalised form.
func normaliseName(s string) string {
	tokens := strings.Fields(strings.ToLower(strings.TrimSpace(s)))
	sort.Strings(tokens)
	return strings.Join(tokens, " ")
}
