// interest_form.go defines the InterestForm model representing a submission
// from an unauthenticated visitor who wishes to connect with a clan.
package models

import "time"

type InterestForm struct {
	ID              string    `db:"id" json:"id"`
	FullName        string    `db:"full_name" json:"full_name"`
	ClanName        string    `db:"clan_name" json:"clan_name"`
	Email           string    `db:"email" json:"email"`
	Phone           string    `db:"phone" json:"phone"`
	Region          *string   `db:"region" json:"region,omitempty"`
	ExpectedMembers *int      `db:"expected_members" json:"expected_members,omitempty"`
	Message         *string   `db:"message" json:"message,omitempty"`
	Status          string    `db:"status" json:"status"`
	CreatedAt       time.Time `db:"created_at" json:"created_at"`
}
