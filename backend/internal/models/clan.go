// clan.go defines the Clan model representing a family group or surname project.
// A clan owns a set of members, relationships and associated media.
package models

import "time"

type Clan struct {
	ID        string    `db:"id" json:"id"`
	Name      string    `db:"name" json:"name"`
	LeaderID  string    `db:"leader_id" json:"leader_id"`
	CreatedAt time.Time `db:"created_at" json:"created_at"`
	UpdatedAt time.Time `db:"updated_at" json:"updated_at"`
}
