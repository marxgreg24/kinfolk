// audit_log.go defines the AuditLog model used to record all write operations
// performed within a clan for compliance and history purposes.
package models

import (
	"encoding/json"
	"time"
)

type AuditLog struct {
	ID         string          `db:"id" json:"id"`
	ActorID    *string         `db:"actor_id" json:"actor_id,omitempty"`
	Action     string          `db:"action" json:"action"`
	TargetType *string         `db:"target_type" json:"target_type,omitempty"`
	TargetID   *string         `db:"target_id" json:"target_id,omitempty"`
	Metadata   json.RawMessage `db:"metadata" json:"metadata,omitempty"`
	CreatedAt  time.Time       `db:"created_at" json:"created_at"`
}
