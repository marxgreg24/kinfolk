// conflict.go implements database access methods for the conflicts table,
// including listing open conflicts and marking them as resolved.
package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/models"
)

type ConflictRepository struct {
	db *sqlx.DB
}

func NewConflictRepository(db *sqlx.DB) *ConflictRepository {
	return &ConflictRepository{db: db}
}

func (r *ConflictRepository) CreateConflict(ctx context.Context, c *models.Conflict) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO conflicts (
			id, clan_id, original_relationship_id,
			conflicting_relationship_id, created_at
		) VALUES ($1, $2, $3, $4, NOW())`,
		c.ID, c.ClanID, c.OriginalRelationshipID, c.ConflictingRelationshipID,
	)
	if err != nil {
		return fmt.Errorf("repository.CreateConflict: %w", err)
	}
	return nil
}

func (r *ConflictRepository) GetConflictByID(ctx context.Context, id string) (*models.Conflict, error) {
	var c models.Conflict
	err := r.db.GetContext(ctx, &c, `SELECT * FROM conflicts WHERE id = $1`, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetConflictByID: %w", err)
	}
	return &c, nil
}

func (r *ConflictRepository) ListConflictsByClan(ctx context.Context, clanID string) ([]*models.Conflict, error) {
	var conflicts []*models.Conflict
	if err := r.db.SelectContext(ctx, &conflicts,
		`SELECT * FROM conflicts WHERE clan_id = $1 AND resolved_at IS NULL ORDER BY created_at DESC`, clanID,
	); err != nil {
		return nil, fmt.Errorf("repository.ListConflictsByClan: %w", err)
	}
	return conflicts, nil
}

func (r *ConflictRepository) ResolveConflict(ctx context.Context, id, resolvedBy, resolution string) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE conflicts
		SET resolved_by = $1, resolution = $2, resolved_at = NOW()
		WHERE id = $3`,
		resolvedBy, resolution, id,
	)
	if err != nil {
		return fmt.Errorf("repository.ResolveConflict: %w", err)
	}
	return nil
}
