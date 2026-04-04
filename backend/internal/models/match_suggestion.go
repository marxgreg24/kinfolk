// match_suggestion.go defines the MatchSuggestion model representing a
// system-generated suggestion that two Members across clans may be the same person.
package models

import "time"

type MatchSuggestion struct {
	ID         string    `db:"id" json:"id"`
	UserID     string    `db:"user_id" json:"user_id"`
	MemberID   string    `db:"member_id" json:"member_id"`
	Confidence int       `db:"confidence" json:"confidence"`
	Status     string    `db:"status" json:"status"`
	CreatedAt  time.Time `db:"created_at" json:"created_at"`
}
