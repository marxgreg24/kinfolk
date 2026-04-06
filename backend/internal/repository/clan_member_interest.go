// clan_member_interest.go implements database access for the clan_member_interests table.
package repository

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/models"
)

type ClanMemberInterestRepository struct {
	db *sqlx.DB
}

func NewClanMemberInterestRepository(db *sqlx.DB) *ClanMemberInterestRepository {
	return &ClanMemberInterestRepository{db: db}
}

// Create inserts a new interest record. Returns an error (with a duplicate hint)
// if the same email already has a pending entry for this clan.
func (r *ClanMemberInterestRepository) Create(ctx context.Context, interest *models.ClanMemberInterest) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO clan_member_interests (id, clan_id, full_name, email, phone, status, created_at)
		VALUES ($1, $2, $3, $4, $5, 'pending', NOW())`,
		interest.ID, interest.ClanID, interest.FullName, interest.Email, interest.Phone,
	)
	if err != nil {
		return fmt.Errorf("repository.ClanMemberInterest.Create: %w", err)
	}
	return nil
}

func (r *ClanMemberInterestRepository) ListByClan(ctx context.Context, clanID string) ([]*models.ClanMemberInterest, error) {
	var items []*models.ClanMemberInterest
	if err := r.db.SelectContext(ctx, &items,
		`SELECT * FROM clan_member_interests WHERE clan_id = $1 AND status = 'pending' ORDER BY created_at DESC`,
		clanID,
	); err != nil {
		return nil, fmt.Errorf("repository.ClanMemberInterest.ListByClan: %w", err)
	}
	return items, nil
}

func (r *ClanMemberInterestRepository) Archive(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE clan_member_interests SET status = 'archived' WHERE id = $1`,
		id,
	)
	if err != nil {
		return fmt.Errorf("repository.ClanMemberInterest.Archive: %w", err)
	}
	return nil
}
