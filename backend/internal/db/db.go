// db.go initialises and returns the sqlx database connection pool.
// It also exposes helpers for running health checks against the database.
package db

import (
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/config"
	_ "github.com/lib/pq"
)

// Connect opens a connection pool to the Postgres database specified in cfg.DatabaseURL,
// configures pool limits and verifies reachability via Ping.
func Connect(cfg *config.Config) (*sqlx.DB, error) {
	db, err := sqlx.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		return nil, fmt.Errorf("db: failed to open connection: %w", err)
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("db: failed to ping database: %w", err)
	}

	return db, nil
}
