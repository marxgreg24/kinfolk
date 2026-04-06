// member.go defines the Member model representing an individual within a clan's
// family tree. Members may or may not be linked to a registered User account.
package models

import "time"

type Member struct {
	ID                string    `db:"id" json:"id"`
	ClanID            string    `db:"clan_id" json:"clan_id"`
	FamilyID          *string   `db:"family_id" json:"family_id,omitempty"`
	FullName          string    `db:"full_name" json:"full_name"`
	Email             *string   `db:"email" json:"email,omitempty"`
	ProfilePictureURL *string   `db:"profile_picture_url" json:"profile_picture_url,omitempty"`
	UserID            *string   `db:"user_id" json:"user_id,omitempty"`
	InvitedBy         string    `db:"invited_by" json:"invited_by"`
	CreatedAt         time.Time `db:"created_at" json:"created_at"`
	UpdatedAt         time.Time `db:"updated_at" json:"updated_at"`
}
