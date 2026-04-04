// audit.go implements the audit logging service, writing structured records
// of all clan write operations to the audit_logs table for accountability.
package services

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
)

type AuditService struct {
	repo *repository.AuditLogRepository
}

// Log records a single auditable event. metadata may be nil.
func (s *AuditService) Log(
	ctx context.Context,
	actorID, action, targetType, targetID string,
	metadata map[string]interface{},
) error {
	var raw json.RawMessage
	if metadata != nil {
		b, err := json.Marshal(metadata)
		if err != nil {
			return fmt.Errorf("services.AuditService.Log: marshal metadata: %w", err)
		}
		raw = json.RawMessage(b)
	}

	var actor, tt, tid *string
	if actorID != "" {
		actor = &actorID
	}
	if targetType != "" {
		tt = &targetType
	}
	if targetID != "" {
		tid = &targetID
	}

	entry := &models.AuditLog{
		ID:         uuid.New().String(),
		ActorID:    actor,
		Action:     action,
		TargetType: tt,
		TargetID:   tid,
		Metadata:   raw,
	}
	if err := s.repo.CreateAuditLog(ctx, entry); err != nil {
		return fmt.Errorf("services.AuditService.Log: %w", err)
	}
	return nil
}

// List delegates to the repository with optional filters.
func (s *AuditService) List(
	ctx context.Context,
	actorID, action, targetType string,
	from, to *time.Time,
) ([]*models.AuditLog, error) {
	logs, err := s.repo.ListAuditLogs(ctx, actorID, action, targetType, from, to)
	if err != nil {
		return nil, fmt.Errorf("services.AuditService.List: %w", err)
	}
	return logs, nil
}
