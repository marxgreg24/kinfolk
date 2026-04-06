// clan_member_interest.go defines the ClanMemberInterest model representing a
// public expression of interest in joining a specific, already-existing clan.
package models

import "time"

type ClanMemberInterest struct {
	ID        string    `db:"id"         json:"id"`
	ClanID    string    `db:"clan_id"    json:"clan_id"`
	FullName  string    `db:"full_name"  json:"full_name"`
	Email     string    `db:"email"      json:"email"`
	Phone     string    `db:"phone"      json:"phone"`
	Status    string    `db:"status"     json:"status"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
