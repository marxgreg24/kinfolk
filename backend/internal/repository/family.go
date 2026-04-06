// family.go implements database access methods for the families table.
package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/models"
)

type FamilyRepository struct {
	db *sqlx.DB
}

func NewFamilyRepository(db *sqlx.DB) *FamilyRepository {
	return &FamilyRepository{db: db}
}

func (r *FamilyRepository) CreateFamily(ctx context.Context, family *models.Family) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO families (id, clan_id, name, created_by, created_at)
		VALUES ($1, $2, $3, $4, NOW())`,
		family.ID, family.ClanID, family.Name, family.CreatedBy,
	)
	if err != nil {
		return fmt.Errorf("repository.CreateFamily: %w", err)
	}
	return nil
}

func (r *FamilyRepository) GetFamilyByID(ctx context.Context, id string) (*models.Family, error) {
	var f models.Family
	err := r.db.GetContext(ctx, &f, `SELECT * FROM families WHERE id = $1`, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetFamilyByID: %w", err)
	}
	return &f, nil
}

func (r *FamilyRepository) ListFamiliesByClan(ctx context.Context, clanID string) ([]*models.Family, error) {
	var families []*models.Family
	if err := r.db.SelectContext(ctx, &families,
		`SELECT * FROM families WHERE clan_id = $1 ORDER BY name`, clanID,
	); err != nil {
		return nil, fmt.Errorf("repository.ListFamiliesByClan: %w", err)
	}
	return families, nil
}
