// member.go implements database access methods for the members table,
// including full-text and fuzzy search queries using pg_trgm and fuzzysearch.
package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/models"
)

type MemberRepository struct {
	db *sqlx.DB
}

func NewMemberRepository(db *sqlx.DB) *MemberRepository {
	return &MemberRepository{db: db}
}

func (r *MemberRepository) CreateMember(ctx context.Context, member *models.Member) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO members (id, clan_id, full_name, email, profile_picture_url, user_id, invited_by, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
		ON CONFLICT (id) DO UPDATE SET
			clan_id = EXCLUDED.clan_id,
			full_name = EXCLUDED.full_name,
			email = EXCLUDED.email,
			profile_picture_url = EXCLUDED.profile_picture_url,
			user_id = EXCLUDED.user_id,
			invited_by = EXCLUDED.invited_by,
			updated_at = NOW()`,
		member.ID, member.ClanID, member.FullName, member.Email,
		member.ProfilePictureURL, member.UserID, member.InvitedBy,
	)
	if err != nil {
		return fmt.Errorf("repository.CreateMember: %w", err)
	}
	return nil
}

func (r *MemberRepository) GetMemberByID(ctx context.Context, id string) (*models.Member, error) {
	var m models.Member
	err := r.db.GetContext(ctx, &m, `SELECT * FROM members WHERE id = $1`, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetMemberByID: %w", err)
	}
	return &m, nil
}

func (r *MemberRepository) GetMemberByUserID(ctx context.Context, userID string) (*models.Member, error) {
	var m models.Member
	err := r.db.GetContext(ctx, &m, `SELECT * FROM members WHERE user_id = $1 LIMIT 1`, userID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetMemberByUserID: %w", err)
	}
	return &m, nil
}

func (r *MemberRepository) ListMembersByClan(ctx context.Context, clanID string) ([]*models.Member, error) {
	var members []*models.Member
	if err := r.db.SelectContext(ctx, &members,
		`SELECT * FROM members WHERE clan_id = $1 ORDER BY full_name`, clanID,
	); err != nil {
		return nil, fmt.Errorf("repository.ListMembersByClan: %w", err)
	}
	return members, nil
}

func (r *MemberRepository) UpdateMember(ctx context.Context, member *models.Member) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE members SET
			full_name           = $1,
			email               = $2,
			profile_picture_url = $3,
			updated_at          = NOW()
		WHERE id = $4`,
		member.FullName, member.Email, member.ProfilePictureURL, member.ID,
	)
	if err != nil {
		return fmt.Errorf("repository.UpdateMember: %w", err)
	}
	return nil
}

func (r *MemberRepository) LinkMemberToUser(ctx context.Context, memberID, userID string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE members SET user_id = $1, updated_at = NOW() WHERE id = $2`,
		userID, memberID,
	)
	if err != nil {
		return fmt.Errorf("repository.LinkMemberToUser: %w", err)
	}
	return nil
}

func (r *MemberRepository) ListUnlinkedMembersByClan(ctx context.Context, clanID string) ([]*models.Member, error) {
	var members []*models.Member
	if err := r.db.SelectContext(ctx, &members,
		`SELECT * FROM members WHERE clan_id = $1 AND user_id IS NULL ORDER BY full_name`, clanID,
	); err != nil {
		return nil, fmt.Errorf("repository.ListUnlinkedMembersByClan: %w", err)
	}
	return members, nil
}
