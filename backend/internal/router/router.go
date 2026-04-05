// router.go configures and returns the Gin engine with all middleware attached
// and all route groups registered from the handlers package.
package router

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/config"
	"github.com/kinfolk/backend/internal/handlers"
	"github.com/kinfolk/backend/internal/middleware"
)

// Handlers bundles all HTTP handler instances.
type Handlers struct {
	Auth            *handlers.AuthHandler
	User            *handlers.UserHandler
	Upload          *handlers.UploadHandler
	Clan            *handlers.ClanHandler
	Member          *handlers.MemberHandler
	Relationship    *handlers.RelationshipHandler
	Conflict        *handlers.ConflictHandler
	Admin           *handlers.AdminHandler
	InterestForm    *handlers.InterestFormHandler
	Chat            *handlers.ChatHandler
	Export          *handlers.ExportHandler
	MatchSuggestion *handlers.MatchSuggestionHandler
}

// SetupRouter creates the Gin engine with global middleware and all route groups.
func SetupRouter(h *Handlers, cfg *config.Config, db *sqlx.DB) *gin.Engine {
	r := gin.New()
	r.Use(gin.Recovery())
	r.Use(middleware.Logger())
	r.Use(middleware.CORS(cfg))
	r.Static("/uploads", "./uploads")

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"service": "kinfolk-api",
		})
	})

	api := r.Group("/api/v1")

	// ── Public routes ──────────────────────────────────────────────────────────
	api.GET("/clans/validate", h.Clan.ValidateName)
	api.POST("/interest-forms", h.InterestForm.Submit)

	// ── Protected routes (Clerk JWT required) ─────────────────────────────────
	protected := api.Group("/")
	protected.Use(middleware.RequireAuth(cfg))

	protected.POST("auth/sync", h.Auth.Sync)
	protected.GET("users/me", h.User.GetMe)
	protected.PUT("users/me", h.User.UpdateMe)
	protected.DELETE("users/me", h.User.DeleteMe)
	protected.POST("users/me/profile", h.User.CompleteProfile)
	protected.POST("users/me/set-password", h.User.SetPassword)
	protected.POST("users/me/clear-password-reset", h.User.ClearPasswordReset)
	protected.POST("upload/photo", h.Upload.UploadPhoto)

	protected.GET("clans/:id", h.Clan.GetByID)
	protected.GET("clans/:id/members", h.Clan.GetMembers)

	protected.POST("relationships", h.Relationship.Submit)
	protected.GET("clans/:id/relationships", h.Relationship.ListByClan)
	protected.GET("clans/:id/tree", h.Relationship.GetTreeData)

	protected.GET("clans/:id/export", h.Export.Export)
	protected.GET("chat/token", h.Chat.GetToken)

	// ── Clan Leader routes ─────────────────────────────────────────────────────
	leader := api.Group("/clan-leader")
	leader.Use(middleware.RequireAuth(cfg))
	leader.Use(middleware.RequireRole(db, "clan_leader"))

	leader.POST("/clans", h.Clan.Create)
	leader.POST("/clans/:id/members", h.Member.AddMember)
	leader.GET("/conflicts", h.Conflict.ListConflicts)
	leader.POST("/conflicts/:id/resolve", h.Conflict.ResolveConflict)
	leader.GET("/match-suggestions", h.MatchSuggestion.ListSuggestions)
	leader.POST("/match-suggestions/:id/approve", h.MatchSuggestion.ApproveSuggestion)
	leader.POST("/match-suggestions/:id/reject", h.MatchSuggestion.RejectSuggestion)

	// ── Admin routes ───────────────────────────────────────────────────────────
	admin := api.Group("/admin")
	admin.Use(middleware.RequireAuth(cfg))
	admin.Use(middleware.RequireRole(db, "admin"))

	admin.GET("/users", h.Admin.ListUsers)
	admin.GET("/clans", h.Clan.ListAll)
	admin.POST("/clans", h.Clan.CreateForAdmin)
	admin.POST("/clan-leaders", h.Admin.CreateClanLeader)
	admin.PATCH("/users/:id/suspend", h.Admin.SuspendUser)
	admin.DELETE("/users/:id", h.Admin.DeleteUser)
	admin.GET("/audit-logs", h.Admin.ListAuditLogs)
	admin.GET("/interest-forms", h.Admin.ListInterestForms)
	admin.PATCH("/interest-forms/:id", h.Admin.UpdateInterestFormStatus)

	return r
}
