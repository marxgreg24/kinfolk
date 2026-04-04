// relationship.go defines the Relationship model representing a directed edge
// between two Members (e.g. parent-child, spouse). It stores relationship type
// and optional metadata such as marriage date.
package models

import "time"

type Relationship struct {
	ID               string    `db:"id" json:"id"`
	ClanID           string    `db:"clan_id" json:"clan_id"`
	FromUserID       string    `db:"from_user_id" json:"from_user_id"`
	ToMemberID       string    `db:"to_member_id" json:"to_member_id"`
	RelationshipType string    `db:"relationship_type" json:"relationship_type"`
	IsInferred       bool      `db:"is_inferred" json:"is_inferred"`
	Status           string    `db:"status" json:"status"`
	SubmittedBy      *string   `db:"submitted_by" json:"submitted_by,omitempty"`
	CreatedAt        time.Time `db:"created_at" json:"created_at"`
	UpdatedAt        time.Time `db:"updated_at" json:"updated_at"`
}
