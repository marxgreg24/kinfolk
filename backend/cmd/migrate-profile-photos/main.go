package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/config"
	"github.com/kinfolk/backend/internal/media"
	_ "github.com/lib/pq"
)

type profileRef struct {
	ID                string         `db:"id"`
	ProfilePictureURL sql.NullString `db:"profile_picture_url"`
}

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("load config: %v", err)
	}
	if !cfg.HasCloudinaryConfig() {
		log.Fatal("Cloudinary is not configured")
	}

	db, err := connectDatabase(cfg)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}
	defer db.Close()

	uploader := media.NewCloudinaryUploader(cfg)
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Minute)
	defer cancel()

	userCount, err := migrateTable(ctx, db, uploader, "users")
	if err != nil {
		log.Fatalf("migrate users: %v", err)
	}
	memberCount, err := migrateTable(ctx, db, uploader, "members")
	if err != nil {
		log.Fatalf("migrate members: %v", err)
	}

	log.Printf("Migrated %d user profile images and %d member profile images to Cloudinary", userCount, memberCount)
}

func connectDatabase(cfg *config.Config) (*sqlx.DB, error) {
	databaseURL := cfg.DatabaseDirectURL
	if databaseURL == "" {
		databaseURL = cfg.DatabaseURL
	}
	if databaseURL == "" {
		return nil, fmt.Errorf("no database URL configured")
	}

	db, err := sqlx.Open("postgres", databaseURL)
	if err != nil {
		return nil, fmt.Errorf("open database: %w", err)
	}
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("ping database: %w", err)
	}
	return db, nil
}

func migrateTable(ctx context.Context, db *sqlx.DB, uploader *media.CloudinaryUploader, table string) (int, error) {
	query := fmt.Sprintf(`SELECT id, profile_picture_url FROM %s WHERE profile_picture_url LIKE '%%/uploads/profiles/%%'`, table)
	var refs []profileRef
	if err := db.SelectContext(ctx, &refs, query); err != nil {
		return 0, fmt.Errorf("select %s refs: %w", table, err)
	}

	uploaded := make(map[string]string)
	migrated := 0
	for _, ref := range refs {
		if !ref.ProfilePictureURL.Valid || ref.ProfilePictureURL.String == "" {
			continue
		}

		filename, err := extractFilename(ref.ProfilePictureURL.String)
		if err != nil {
			return migrated, fmt.Errorf("%s %s: %w", table, ref.ID, err)
		}

		secureURL, ok := uploaded[filename]
		if !ok {
			contents, err := os.ReadFile(filepath.Join("uploads", "profiles", filename))
			if err != nil {
				return migrated, fmt.Errorf("read local file %s: %w", filename, err)
			}
			secureURL, err = uploader.UploadImage(ctx, filename, contents, "profiles")
			if err != nil {
				return migrated, fmt.Errorf("upload %s to Cloudinary: %w", filename, err)
			}
			uploaded[filename] = secureURL
		}

		update := fmt.Sprintf(`UPDATE %s SET profile_picture_url = $1, updated_at = NOW() WHERE id = $2`, table)
		if _, err := db.ExecContext(ctx, update, secureURL, ref.ID); err != nil {
			return migrated, fmt.Errorf("update %s %s: %w", table, ref.ID, err)
		}
		migrated++
		log.Printf("Migrated %s %s -> %s", table, ref.ID, filename)
	}

	return migrated, nil
}

func extractFilename(rawURL string) (string, error) {
	const marker = "/uploads/profiles/"
	parsed, err := url.Parse(rawURL)
	if err != nil {
		return "", fmt.Errorf("parse URL %q: %w", rawURL, err)
	}

	pathValue := parsed.Path
	if pathValue == "" {
		pathValue = rawURL
	}
	idx := strings.Index(pathValue, marker)
	if idx == -1 {
		return "", fmt.Errorf("URL does not point to a local profile upload: %s", rawURL)
	}

	filename := filepath.Base(pathValue[idx+len(marker):])
	if filename == "" || filename == "." || filename == string(filepath.Separator) {
		return "", fmt.Errorf("could not extract filename from URL: %s", rawURL)
	}
	return filename, nil
}
