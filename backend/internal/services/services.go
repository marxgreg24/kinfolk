// services.go wires together all service instances and exposes them as a
// single Services bundle to be injected into handlers.
package services

import (
	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/config"
	"github.com/kinfolk/backend/internal/repository"
)

// Services is the top-level dependency bundle for all business logic.
type Services struct {
	User         *UserService
	Clan         *ClanService
	Member       *MemberService
	Relationship *RelationshipService
	Conflict     *ConflictService
	Inference    *InferenceService
	MemberLink   *MemberLinkService
	Gedcom       *GedcomService
	Email        *EmailService
	Audit        *AuditService
}

// NewServices constructs all services in dependency order.
func NewServices(
	db *sqlx.DB,
	cfg *config.Config,
	userRepo *repository.UserRepository,
	clanRepo *repository.ClanRepository,
	memberRepo *repository.MemberRepository,
	relationshipRepo *repository.RelationshipRepository,
	conflictRepo *repository.ConflictRepository,
	interestFormRepo *repository.InterestFormRepository,
	auditRepo *repository.AuditLogRepository,
	matchRepo *repository.MatchSuggestionRepository,
) *Services {
	audit := &AuditService{repo: auditRepo}
	email := newEmailService(cfg)
	inference := &InferenceService{
		relationshipRepo: relationshipRepo,
		userRepo:         userRepo,
		audit:            audit,
	}

	return &Services{
		Audit:     audit,
		Email:     email,
		Inference: inference,
		User: &UserService{
			repo:     userRepo,
			clanRepo: clanRepo,
			audit:    audit,
		},
		Clan: &ClanService{
			repo:       clanRepo,
			userRepo:   userRepo,
			memberRepo: memberRepo,
			audit:      audit,
		},
		Member: &MemberService{
			repo:     memberRepo,
			clanRepo: clanRepo,
			userRepo: userRepo,
			email:    email,
			audit:    audit,
		},
		Relationship: &RelationshipService{
			repo:      relationshipRepo,
			conflict:  conflictRepo,
			userRepo:  userRepo,
			inference: inference,
			audit:     audit,
		},
		Conflict: &ConflictService{
			repo:             conflictRepo,
			relationshipRepo: relationshipRepo,
			audit:            audit,
		},
		MemberLink: &MemberLinkService{
			memberRepo: memberRepo,
			clanRepo:   clanRepo,
			matchRepo:  matchRepo,
			audit:      audit,
		},
		Gedcom: &GedcomService{
			memberRepo:       memberRepo,
			relationshipRepo: relationshipRepo,
			clanRepo:         clanRepo,
			userRepo:         userRepo,
		},
	}
}
