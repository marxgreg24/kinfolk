// match_suggestion.go implements database access methods for the match_suggestions table,
// including insert on detection, listing pending suggestions and recording user decisions.
package repository

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/models"
)

type MatchSuggestionRepository struct {
	db *sqlx.DB
}

func NewMatchSuggestionRepository(db *sqlx.DB) *MatchSuggestionRepository {
	return &MatchSuggestionRepository{db: db}
}

func (r *MatchSuggestionRepository) CreateMatchSuggestion(ctx context.Context, s *models.MatchSuggestion) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO member_match_suggestions (id, user_id, member_id, confidence, status, created_at)
		VALUES ($1, $2, $3, $4, 'pending', NOW())
		ON CONFLICT (user_id, member_id) DO NOTHING`,
		s.ID, s.UserID, s.MemberID, s.Confidence,
	)
	if err != nil {
		return fmt.Errorf("repository.CreateMatchSuggestion: %w", err)
	}
	return nil
}

func (r *MatchSuggestionRepository) ListMatchSuggestionsByClan(ctx context.Context, clanID string) ([]*models.MatchSuggestion, error) {
	var suggestions []*models.MatchSuggestion
	if err := r.db.SelectContext(ctx, &suggestions, `
		SELECT s.*
		FROM member_match_suggestions s
		JOIN members m ON s.member_id = m.id
		WHERE m.clan_id = $1 AND s.status = 'pending'
		ORDER BY s.created_at DESC`,
		clanID,
	); err != nil {
		return nil, fmt.Errorf("repository.ListMatchSuggestionsByClan: %w", err)
	}
	return suggestions, nil
}

func (r *MatchSuggestionRepository) UpdateMatchSuggestionStatus(ctx context.Context, id, status string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE member_match_suggestions SET status = $1 WHERE id = $2`,
		status, id,
	)
	if err != nil {
		return fmt.Errorf("repository.UpdateMatchSuggestionStatus: %w", err)
	}
	return nil
}

func (r *MatchSuggestionRepository) ApproveMatchSuggestion(ctx context.Context, suggestionID string) error {
	tx, err := r.db.BeginTxx(ctx, nil)
	if err != nil {
		return fmt.Errorf("repository.ApproveMatchSuggestion: begin tx: %w", err)
	}
	defer tx.Rollback()

	var userID, memberID string
	if err := tx.QueryRowContext(ctx,
		`SELECT user_id, member_id FROM member_match_suggestions WHERE id = $1`,
		suggestionID,
	).Scan(&userID, &memberID); err != nil {
		return fmt.Errorf("repository.ApproveMatchSuggestion: fetch suggestion: %w", err)
	}

	if _, err := tx.ExecContext(ctx,
		`UPDATE members SET user_id = $1, updated_at = NOW() WHERE id = $2`,
		userID, memberID,
	); err != nil {
		return fmt.Errorf("repository.ApproveMatchSuggestion: link member: %w", err)
	}

	if _, err := tx.ExecContext(ctx,
		`UPDATE member_match_suggestions SET status = 'approved' WHERE id = $1`,
		suggestionID,
	); err != nil {
		return fmt.Errorf("repository.ApproveMatchSuggestion: approve suggestion: %w", err)
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("repository.ApproveMatchSuggestion: commit: %w", err)
	}
	return nil
}
