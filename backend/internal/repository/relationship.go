// relationship.go implements database access methods for the relationships table,
// including adjacency queries needed for graph traversal in the inference service.
package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/models"
)

type RelationshipRepository struct {
	db *sqlx.DB
}

func NewRelationshipRepository(db *sqlx.DB) *RelationshipRepository {
	return &RelationshipRepository{db: db}
}

func (r *RelationshipRepository) CreateRelationship(ctx context.Context, rel *models.Relationship) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO relationships (
			id, clan_id, from_user_id, to_member_id,
			relationship_type, is_inferred, status, submitted_by, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
		rel.ID, rel.ClanID, rel.FromUserID, rel.ToMemberID,
		rel.RelationshipType, rel.IsInferred, rel.Status, rel.SubmittedBy,
	)
	if err != nil {
		return fmt.Errorf("repository.CreateRelationship: %w", err)
	}
	return nil
}

func (r *RelationshipRepository) GetRelationshipByID(ctx context.Context, id string) (*models.Relationship, error) {
	var rel models.Relationship
	err := r.db.GetContext(ctx, &rel, `SELECT * FROM relationships WHERE id = $1`, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetRelationshipByID: %w", err)
	}
	return &rel, nil
}

func (r *RelationshipRepository) ListRelationshipsByClan(ctx context.Context, clanID string) ([]*models.Relationship, error) {
	var rels []*models.Relationship
	if err := r.db.SelectContext(ctx, &rels,
		`SELECT * FROM relationships WHERE clan_id = $1 ORDER BY created_at DESC`, clanID,
	); err != nil {
		return nil, fmt.Errorf("repository.ListRelationshipsByClan: %w", err)
	}
	return rels, nil
}

func (r *RelationshipRepository) GetRelationshipBetween(ctx context.Context, fromUserID, toMemberID string) (*models.Relationship, error) {
	var rel models.Relationship
	err := r.db.GetContext(ctx, &rel, `
		SELECT * FROM relationships
		WHERE from_user_id = $1 AND to_member_id = $2 AND status != 'conflicted'
		LIMIT 1`,
		fromUserID, toMemberID,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetRelationshipBetween: %w", err)
	}
	return &rel, nil
}

func (r *RelationshipRepository) UpdateRelationshipStatus(ctx context.Context, id, status string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE relationships SET status = $1, updated_at = NOW() WHERE id = $2`,
		status, id,
	)
	if err != nil {
		return fmt.Errorf("repository.UpdateRelationshipStatus: %w", err)
	}
	return nil
}

func (r *RelationshipRepository) ListActiveRelationshipsByClan(ctx context.Context, clanID string) ([]*models.Relationship, error) {
	var rels []*models.Relationship
	if err := r.db.SelectContext(ctx, &rels,
		`SELECT * FROM relationships WHERE clan_id = $1 AND status = 'active' ORDER BY created_at DESC`, clanID,
	); err != nil {
		return nil, fmt.Errorf("repository.ListActiveRelationshipsByClan: %w", err)
	}
	return rels, nil
}
