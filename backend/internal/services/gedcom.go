// gedcom.go implements GEDCOM 5.5 import and export logic, converting between
// the internal member/relationship models and the GEDCOM file format.
package services

import (
	"context"
	"fmt"
	"strings"

	"github.com/kinfolk/backend/internal/repository"
)

type GedcomService struct {
	memberRepo       *repository.MemberRepository
	relationshipRepo *repository.RelationshipRepository
	clanRepo         *repository.ClanRepository
	userRepo         *repository.UserRepository
}

// ExportClanGEDCOM generates a GEDCOM 5.5.1 byte slice for all members and
// active relationships in the given clan.
func (s *GedcomService) ExportClanGEDCOM(ctx context.Context, clanID string) ([]byte, error) {
	clan, err := s.clanRepo.GetClanByID(ctx, clanID)
	if err != nil {
		return nil, fmt.Errorf("services.GedcomService.ExportClanGEDCOM: %w", err)
	}
	if clan == nil {
		return nil, fmt.Errorf("services.GedcomService.ExportClanGEDCOM: clan not found")
	}

	members, err := s.memberRepo.ListMembersByClan(ctx, clanID)
	if err != nil {
		return nil, fmt.Errorf("services.GedcomService.ExportClanGEDCOM: %w", err)
	}

	rels, err := s.relationshipRepo.ListActiveRelationshipsByClan(ctx, clanID)
	if err != nil {
		return nil, fmt.Errorf("services.GedcomService.ExportClanGEDCOM: %w", err)
	}

	// Assign a stable numeric index to each member ID.
	memberIndex := make(map[string]int, len(members))
	for i, m := range members {
		memberIndex[m.ID] = i + 1
	}

	var b strings.Builder

	// Header.
	b.WriteString("0 HEAD\n")
	b.WriteString("1 SOUR KINFOLK\n")
	b.WriteString("1 VERS 1.0\n")
	b.WriteString("1 GEDC\n")
	b.WriteString("2 VERS 5.5.1\n")
	b.WriteString("1 CHAR UTF-8\n")

	// INDI records.
	for _, m := range members {
		idx := memberIndex[m.ID]
		fmt.Fprintf(&b, "0 @I%d@ INDI\n", idx)
		fmt.Fprintf(&b, "1 NAME %s\n", m.FullName)

		sex := "U"
		// Members don't store gender directly; attempt lookup via linked user.
		if m.UserID != nil {
			u, _ := s.userRepo.GetUserByID(ctx, *m.UserID)
			if u != nil && u.Gender != nil {
				switch *u.Gender {
				case "male":
					sex = "M"
				case "female":
					sex = "F"
				}
			}
		}
		fmt.Fprintf(&b, "1 SEX %s\n", sex)
	}

	// FAM records — one per spouse pair, with children attached.
	type famKey struct{ husb, wife int }
	written := make(map[famKey]bool)

	for _, r := range rels {
		if r.RelationshipType != "spouse" || r.IsInferred {
			continue
		}
		fromIdx, fromOK := memberIndex[r.FromUserID]
		toIdx, toOK := memberIndex[r.ToMemberID]
		if !fromOK || !toOK {
			continue
		}

		key := famKey{fromIdx, toIdx}
		if fromIdx > toIdx {
			key = famKey{toIdx, fromIdx}
		}
		if written[key] {
			continue
		}
		written[key] = true

		fmt.Fprintf(&b, "0 @F%d_%d@ FAM\n", key.husb, key.wife)
		fmt.Fprintf(&b, "1 HUSB @I%d@\n", key.husb)
		fmt.Fprintf(&b, "1 WIFE @I%d@\n", key.wife)

		// Add children: members where either spouse has a parent relationship.
		for _, cr := range rels {
			if cr.RelationshipType != "parent" {
				continue
			}
			if cr.FromUserID == r.FromUserID || cr.FromUserID == r.ToMemberID {
				childIdx, ok := memberIndex[cr.ToMemberID]
				if ok {
					fmt.Fprintf(&b, "1 CHIL @I%d@\n", childIdx)
				}
			}
		}
	}

	b.WriteString("0 TRLR\n")

	return []byte(b.String()), nil
}
