// audit_log.go implements database access methods for the audit_logs table,
// including append-only inserts and paginated reads for admin audit views.
package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/models"
)

type AuditLogRepository struct {
	db *sqlx.DB
}

func NewAuditLogRepository(db *sqlx.DB) *AuditLogRepository {
	return &AuditLogRepository{db: db}
}

func (r *AuditLogRepository) CreateAuditLog(ctx context.Context, entry *models.AuditLog) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO audit_logs (id, actor_id, action, target_type, target_id, metadata, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
		entry.ID, entry.ActorID, entry.Action, entry.TargetType, entry.TargetID, entry.Metadata,
	)
	if err != nil {
		return fmt.Errorf("repository.CreateAuditLog: %w", err)
	}
	return nil
}

func (r *AuditLogRepository) ListAuditLogs(
	ctx context.Context,
	actorID, action, targetType string,
	from, to *time.Time,
) ([]*models.AuditLog, error) {
	query := `SELECT * FROM audit_logs WHERE 1=1`
	args := []interface{}{}
	idx := 1

	if actorID != "" {
		query += fmt.Sprintf(" AND actor_id = $%d", idx)
		args = append(args, actorID)
		idx++
	}
	if action != "" {
		query += fmt.Sprintf(" AND action = $%d", idx)
		args = append(args, action)
		idx++
	}
	if targetType != "" {
		query += fmt.Sprintf(" AND target_type = $%d", idx)
		args = append(args, targetType)
		idx++
	}
	if from != nil {
		query += fmt.Sprintf(" AND created_at >= $%d", idx)
		args = append(args, *from)
		idx++
	}
	if to != nil {
		query += fmt.Sprintf(" AND created_at <= $%d", idx)
		args = append(args, *to)
		idx++
	}
	query += " ORDER BY created_at DESC"

	var logs []*models.AuditLog
	if err := r.db.SelectContext(ctx, &logs, query, args...); err != nil {
		return nil, fmt.Errorf("repository.ListAuditLogs: %w", err)
	}
	return logs, nil
}
