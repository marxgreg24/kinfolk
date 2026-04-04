// conflict.go defines the Conflict model used to track data discrepancies
// between members or relationships that require manual resolution by clan admins.
package models

import "time"

type Conflict struct {
	ID                        string     `db:"id" json:"id"`
	ClanID                    string     `db:"clan_id" json:"clan_id"`
	OriginalRelationshipID    string     `db:"original_relationship_id" json:"original_relationship_id"`
	ConflictingRelationshipID string     `db:"conflicting_relationship_id" json:"conflicting_relationship_id"`
	ResolvedBy                *string    `db:"resolved_by" json:"resolved_by,omitempty"`
	Resolution                *string    `db:"resolution" json:"resolution,omitempty"`
	ResolvedAt                *time.Time `db:"resolved_at" json:"resolved_at,omitempty"`
	CreatedAt                 time.Time  `db:"created_at" json:"created_at"`
}
