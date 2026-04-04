// clan.go implements database access methods for the clans table,
// including CRUD operations and membership join queries.
package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/models"
)

type ClanRepository struct {
	db *sqlx.DB
}

func NewClanRepository(db *sqlx.DB) *ClanRepository {
	return &ClanRepository{db: db}
}

func (r *ClanRepository) CreateClan(ctx context.Context, clan *models.Clan) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO clans (id, name, leader_id, created_at, updated_at)
		VALUES ($1, $2, $3, NOW(), NOW())`,
		clan.ID, clan.Name, clan.LeaderID,
	)
	if err != nil {
		return fmt.Errorf("repository.CreateClan: %w", err)
	}
	return nil
}

func (r *ClanRepository) GetClanByID(ctx context.Context, id string) (*models.Clan, error) {
	var c models.Clan
	err := r.db.GetContext(ctx, &c, `SELECT * FROM clans WHERE id = $1`, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetClanByID: %w", err)
	}
	return &c, nil
}

func (r *ClanRepository) GetClanByName(ctx context.Context, name string) (*models.Clan, error) {
	var c models.Clan
	err := r.db.GetContext(ctx, &c, `SELECT * FROM clans WHERE LOWER(name) = LOWER($1) LIMIT 1`, name)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetClanByName: %w", err)
	}
	return &c, nil
}

func (r *ClanRepository) ListClans(ctx context.Context) ([]*models.Clan, error) {
	var clans []*models.Clan
	if err := r.db.SelectContext(ctx, &clans, `SELECT * FROM clans ORDER BY name`); err != nil {
		return nil, fmt.Errorf("repository.ListClans: %w", err)
	}
	return clans, nil
}
