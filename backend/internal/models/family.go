// family.go defines the Family model representing a nuclear/extended family
// group within a clan. A clan can have many families.
package models

import "time"

type Family struct {
	ID        string    `db:"id"         json:"id"`
	ClanID    string    `db:"clan_id"    json:"clan_id"`
	Name      string    `db:"name"       json:"name"`
	CreatedBy string    `db:"created_by" json:"created_by"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
}
