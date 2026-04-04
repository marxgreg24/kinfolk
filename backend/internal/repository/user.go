// user.go implements database access methods for the users table using sqlx,
// including upsert on Clerk ID, lookup by ID and soft-delete.
package repository

import (
	"context"
	"database/sql"
	"fmt"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/models"
)

type UserRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) *UserRepository {
	return &UserRepository{db: db}
}

func (r *UserRepository) CreateUser(ctx context.Context, user *models.User) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO users (
			id, clerk_user_id, full_name, email, role,
			is_suspended, password_reset_required, created_at, updated_at
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
		)`,
		user.ID, user.ClerkUserID, user.FullName, user.Email, user.Role,
		user.IsSuspended, user.PasswordResetRequired,
	)
	if err != nil {
		return fmt.Errorf("repository.CreateUser: %w", err)
	}
	return nil
}

func (r *UserRepository) GetUserByClerkID(ctx context.Context, clerkID string) (*models.User, error) {
	var u models.User
	err := r.db.GetContext(ctx, &u, `SELECT * FROM users WHERE clerk_user_id = $1`, clerkID)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetUserByClerkID: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) GetUserByEmail(ctx context.Context, email string) (*models.User, error) {
	var u models.User
	err := r.db.GetContext(ctx, &u, `SELECT * FROM users WHERE email = $1`, email)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetUserByEmail: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) GetUserByID(ctx context.Context, id string) (*models.User, error) {
	var u models.User
	err := r.db.GetContext(ctx, &u, `SELECT * FROM users WHERE id = $1`, id)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, fmt.Errorf("repository.GetUserByID: %w", err)
	}
	return &u, nil
}

func (r *UserRepository) UpdateUser(ctx context.Context, user *models.User) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE users SET
			full_name              = $1,
			phone                  = $2,
			birth_year             = $3,
			gender                 = $4,
			profile_picture_url    = $5,
			clan_id                = $6,
			password_reset_required = $7,
			updated_at             = NOW()
		WHERE id = $8`,
		user.FullName, user.Phone, user.BirthYear, user.Gender,
		user.ProfilePictureURL, user.ClanID, user.PasswordResetRequired, user.ID,
	)
	if err != nil {
		return fmt.Errorf("repository.UpdateUser: %w", err)
	}
	return nil
}

func (r *UserRepository) ListUsers(ctx context.Context, role string, isSuspended *bool) ([]*models.User, error) {
	query := `SELECT * FROM users WHERE role != 'admin'`
	args := []interface{}{}
	idx := 1

	if role != "" {
		query += fmt.Sprintf(" AND role = $%d", idx)
		args = append(args, role)
		idx++
	}
	if isSuspended != nil {
		query += fmt.Sprintf(" AND is_suspended = $%d", idx)
		args = append(args, *isSuspended)
		idx++
	}
	query += " ORDER BY created_at DESC"

	var users []*models.User
	if err := r.db.SelectContext(ctx, &users, query, args...); err != nil {
		return nil, fmt.Errorf("repository.ListUsers: %w", err)
	}
	return users, nil
}

func (r *UserRepository) SuspendUser(ctx context.Context, id string, suspend bool) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE users SET is_suspended = $1, updated_at = NOW() WHERE id = $2`,
		suspend, id,
	)
	if err != nil {
		return fmt.Errorf("repository.SuspendUser: %w", err)
	}
	return nil
}

func (r *UserRepository) DeleteUser(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return fmt.Errorf("repository.DeleteUser: %w", err)
	}
	return nil
}

func (r *UserRepository) SetPasswordResetRequired(ctx context.Context, id string, required bool) error {
	_, err := r.db.ExecContext(ctx,
		`UPDATE users SET password_reset_required = $1, updated_at = NOW() WHERE id = $2`,
		required, id,
	)
	if err != nil {
		return fmt.Errorf("repository.SetPasswordResetRequired: %w", err)
	}
	return nil
}
