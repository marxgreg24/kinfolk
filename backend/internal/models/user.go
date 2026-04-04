// user.go defines the User model representing an authenticated Kinfolk account.
// A user is backed by a Clerk identity and may belong to one or more clans.
package models

import "time"

type User struct {
	ID                    string     `db:"id" json:"id"`
	ClerkUserID           string     `db:"clerk_user_id" json:"clerk_user_id"`
	FullName              string     `db:"full_name" json:"full_name"`
	Email                 string     `db:"email" json:"email"`
	Phone                 *string    `db:"phone" json:"phone,omitempty"`
	BirthYear             *int       `db:"birth_year" json:"birth_year,omitempty"`
	Gender                *string    `db:"gender" json:"gender,omitempty"`
	ProfilePictureURL     *string    `db:"profile_picture_url" json:"profile_picture_url,omitempty"`
	Role                  string     `db:"role" json:"role"`
	ClanID                *string    `db:"clan_id" json:"clan_id,omitempty"`
	IsSuspended           bool       `db:"is_suspended" json:"is_suspended"`
	PasswordResetRequired bool       `db:"password_reset_required" json:"password_reset_required"`
	CreatedAt             time.Time  `db:"created_at" json:"created_at"`
	UpdatedAt             time.Time  `db:"updated_at" json:"updated_at"`
}
