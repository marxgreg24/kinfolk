// main.go is the entry point for the Kinfolk backend server.
// It loads configuration, initialises the database connection,
// sets up the Gin router and starts the HTTP server.
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/config"
	"github.com/kinfolk/backend/internal/db"
	"github.com/kinfolk/backend/internal/handlers"
	"github.com/kinfolk/backend/internal/repository"
	"github.com/kinfolk/backend/internal/router"
	"github.com/kinfolk/backend/internal/services"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	database, err := db.Connect(cfg)
	if err != nil {
		log.Fatalf("failed to connect to database: %v", err)
	}
	defer database.Close()

	if err := seedAdmin(database, cfg); err != nil {
		log.Fatalf("failed to seed admin user: %v", err)
	}

	// ── Repositories ────────────────────────────────────────────────────────
	userRepo := repository.NewUserRepository(database)
	clanRepo := repository.NewClanRepository(database)
	memberRepo := repository.NewMemberRepository(database)
	familyRepo := repository.NewFamilyRepository(database)
	clanMemberInterestRepo := repository.NewClanMemberInterestRepository(database)
	relationshipRepo := repository.NewRelationshipRepository(database)
	conflictRepo := repository.NewConflictRepository(database)
	interestFormRepo := repository.NewInterestFormRepository(database)
	auditRepo := repository.NewAuditLogRepository(database)
	matchRepo := repository.NewMatchSuggestionRepository(database)

	// ── Services ─────────────────────────────────────────────────────────────
	svcs := services.NewServices(
		database,
		cfg,
		userRepo,
		clanRepo,
		memberRepo,
		relationshipRepo,
		conflictRepo,
		interestFormRepo,
		auditRepo,
		matchRepo,
	)

	// ── Handlers ─────────────────────────────────────────────────────────────
	h := &router.Handlers{
		Auth:               handlers.NewAuthHandler(svcs.User, svcs.MemberLink, userRepo),
		User:               handlers.NewUserHandler(svcs.User, svcs.MemberLink, cfg),
		Upload:             handlers.NewUploadHandler(cfg),
		Clan:               handlers.NewClanHandler(svcs.Clan),
		Member:             handlers.NewMemberHandler(svcs.Member, svcs.Relationship, userRepo, clanRepo, svcs.Email, cfg),
		Family:             handlers.NewFamilyHandler(familyRepo, userRepo, memberRepo),
		ClanMemberInterest: handlers.NewClanMemberInterestHandler(clanMemberInterestRepo, clanRepo, userRepo, svcs.Email),
		Relationship:       handlers.NewRelationshipHandler(svcs.Relationship, memberRepo),
		Conflict:           handlers.NewConflictHandler(svcs.Conflict, svcs.User),
		Admin:              handlers.NewAdminHandler(userRepo, interestFormRepo, svcs.User, svcs.Email, svcs.Audit, cfg),
		InterestForm:       handlers.NewInterestFormHandler(interestFormRepo),
		Chat:               handlers.NewChatHandler(cfg, svcs.User, userRepo),
		Export:             handlers.NewExportHandler(svcs.Gedcom),
		MatchSuggestion:    handlers.NewMatchSuggestionHandler(matchRepo, svcs.MemberLink, svcs.Audit, userRepo),
	}

	r := router.SetupRouter(h, cfg, database)

	srv := &http.Server{
		Addr:    fmt.Sprintf(":%s", cfg.Port),
		Handler: r,
	}

	go func() {
		log.Printf("Kinfolk API running on port %s", cfg.Port)
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("server error: %v", err)
		}
	}()

	// Keep the Neon compute warm by pinging the DB every 4 minutes.
	// Without this, the free-tier compute suspends after ~5 minutes of inactivity
	// and the first subsequent query times out, returning a 500 to the client.
	go func() {
		ticker := time.NewTicker(4 * time.Minute)
		defer ticker.Stop()
		for range ticker.C {
			if err := database.Ping(); err != nil {
				log.Printf("DB keepalive ping failed: %v", err)
			}
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("shutting down server...")

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := srv.Shutdown(ctx); err != nil {
		log.Fatalf("forced shutdown: %v", err)
	}

	log.Println("server exited cleanly")
}

// seedAdmin inserts the admin user if it does not already exist.
func seedAdmin(database *sqlx.DB, cfg *config.Config) error {
	var exists bool
	err := database.QueryRow(
		`SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)`,
		cfg.AdminEmail,
	).Scan(&exists)
	if err != nil {
		return fmt.Errorf("seedAdmin: failed to check for admin user: %w", err)
	}

	if exists {
		log.Println("Admin user already exists")
		return nil
	}

	_, err = database.Exec(`
		INSERT INTO users (
			clerk_user_id,
			full_name,
			email,
			role,
			is_suspended,
			password_reset_required,
			created_at,
			updated_at
		) VALUES (
			'admin-seeded',
			'Kinfolk Admin',
			$1,
			'admin',
			FALSE,
			FALSE,
			NOW(),
			NOW()
		)
	`, cfg.AdminEmail)
	if err != nil {
		return fmt.Errorf("seedAdmin: failed to insert admin user: %w", err)
	}

	log.Println("Admin user seeded")
	return nil
}
