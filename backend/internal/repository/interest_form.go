// interest_form.go implements database access methods for the interest_forms table,
// including insert on submission and listing pending forms for clan admins.
package repository

import (
	"context"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/models"
)

type InterestFormRepository struct {
	db *sqlx.DB
}

func NewInterestFormRepository(db *sqlx.DB) *InterestFormRepository {
	return &InterestFormRepository{db: db}
}

func (r *InterestFormRepository) CreateInterestForm(ctx context.Context, form *models.InterestForm) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO interest_forms (
			id, full_name, clan_name, email, phone,
			region, expected_members, message, status, created_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', NOW())`,
		form.ID, form.FullName, form.ClanName, form.Email, form.Phone,
		form.Region, form.ExpectedMembers, form.Message,
	)
	if err != nil {
		return fmt.Errorf("repository.CreateInterestForm: %w", err)
	}
	return nil
}

func (r *InterestFormRepository) ListInterestForms(ctx context.Context, status string) ([]*models.InterestForm, error) {
	var forms []*models.InterestForm
	var err error

	if status == "" {
		err = r.db.SelectContext(ctx, &forms,
			`SELECT * FROM interest_forms ORDER BY created_at DESC`,
		)
	} else {
		err = r.db.SelectContext(ctx, &forms,
			`SELECT * FROM interest_forms WHERE status = $1 ORDER BY created_at DESC`, status,
		)
	}
	if err != nil {
		return nil, fmt.Errorf("repository.ListInterestForms: %w", err)
	}
	return forms, nil
}

func (r *InterestFormRepository) UpdateInterestFormStatus(ctx context.Context, id, status string) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE interest_forms SET status = $1 WHERE id = $2`,
		status, id,
	)
	if err != nil {
		return fmt.Errorf("repository.UpdateInterestFormStatus: %w", err)
	}
	return nil
}
