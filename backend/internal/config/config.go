// config.go loads and exposes application configuration from environment variables.
// It uses godotenv to read .env files and provides a typed Config struct
// consumed by all other packages.
package config

import (
	"errors"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

// Config holds all application configuration values sourced from the environment.
// It is created once at startup via Load() and injected into all subsystems.
type Config struct {
	DatabaseURL            string
	DatabaseDirectURL      string
	Port                   string
	ClerkSecretKey         string
	ResendAPIKey           string
	CloudinaryCloudName    string
	CloudinaryAPIKey       string
	CloudinaryAPISecret    string
	StreamAPIKey           string
	StreamAPISecret        string
	AdminEmail             string
	AdminPassword          string
	TempClanLeaderPassword string
	FrontendURL            string
	// ExtraAllowedOrigins holds additional CORS origins (comma-separated) beyond FrontendURL.
	// Set via EXTRA_ALLOWED_ORIGINS in the environment.
	ExtraAllowedOrigins []string
	AppEnv              string
}

// Load reads the .env file (if present) then populates a Config from the environment.
// If .env is missing the error is silently ignored — values may be injected via Docker
// or the host environment. Returns an error if required fields are missing in production.
func Load() (*Config, error) {
	// Best-effort load; ignore file-not-found so Docker / CI can inject vars directly.
	_ = godotenv.Load()

	cfg := &Config{
		DatabaseURL:            os.Getenv("DATABASE_URL"),
		DatabaseDirectURL:      os.Getenv("DATABASE_DIRECT_URL"),
		Port:                   os.Getenv("PORT"),
		ClerkSecretKey:         os.Getenv("CLERK_SECRET_KEY"),
		ResendAPIKey:           os.Getenv("RESEND_API_KEY"),
		CloudinaryCloudName:    os.Getenv("CLOUDINARY_CLOUD_NAME"),
		CloudinaryAPIKey:       os.Getenv("CLOUDINARY_API_KEY"),
		CloudinaryAPISecret:    os.Getenv("CLOUDINARY_API_SECRET"),
		StreamAPIKey:           os.Getenv("STREAM_API_KEY"),
		StreamAPISecret:        os.Getenv("STREAM_API_SECRET"),
		AdminEmail:             os.Getenv("ADMIN_EMAIL"),
		AdminPassword:          os.Getenv("ADMIN_PASSWORD"),
		TempClanLeaderPassword: os.Getenv("TEMP_CLAN_LEADER_PASSWORD"),
		FrontendURL:            os.Getenv("FRONTEND_URL"),
		ExtraAllowedOrigins:    parseOrigins(os.Getenv("EXTRA_ALLOWED_ORIGINS")),
		AppEnv:                 os.Getenv("APP_ENV"),
	}

	if cfg.Port == "" {
		cfg.Port = "8081"
	}

	if cfg.AppEnv == "" {
		cfg.AppEnv = "development"
	}

	if err := cfg.validate(); err != nil {
		return nil, err
	}

	return cfg, nil
}

// validate checks that all required fields are populated.
// The Clerk secret key check is skipped in development so local dev works
// before a Clerk project has been wired up.
func (c *Config) validate() error {
	if c.DatabaseURL == "" {
		return errors.New("config: DATABASE_URL is required")
	}

	if !c.IsDevelopment() && c.ClerkSecretKey == "" {
		return errors.New("config: CLERK_SECRET_KEY is required in non-development environments")
	}

	return nil
}

// IsDevelopment reports whether the application is running in development mode.
func (c *Config) IsDevelopment() bool {
	return c.AppEnv == "development"
}

// parseOrigins splits a comma-separated origins string into a trimmed slice,
// discarding any empty entries.
func parseOrigins(s string) []string {
	if s == "" {
		return nil
	}
	var out []string
	for _, raw := range strings.Split(s, ",") {
		if trimmed := strings.TrimSpace(raw); trimmed != "" {
			out = append(out, trimmed)
		}
	}
	return out
}
