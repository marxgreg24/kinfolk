// auth.go provides Gin middleware for authenticating requests via Clerk JWT tokens.
// It validates the Authorization header, extracts claims and attaches the
// verified session to the request context.
package middleware

import (
	"database/sql"
	"net/http"
	"strings"

	"github.com/clerk/clerk-sdk-go/v2"
	"github.com/clerk/clerk-sdk-go/v2/jwt"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/kinfolk/backend/internal/config"
)

// RequireAuth validates the Bearer JWT in the Authorization header using the Clerk SDK.
// On success it sets "clerk_user_id" in the Gin context for downstream handlers.
func RequireAuth(cfg *config.Config) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "missing or invalid authorization header",
			})
			return
		}

		token := strings.TrimPrefix(authHeader, "Bearer ")

		clerk.SetKey(cfg.ClerkSecretKey)

		claims, err := jwt.Verify(c.Request.Context(), &jwt.VerifyParams{
			Token: token,
		})
		if err != nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "invalid or expired token",
			})
			return
		}

		c.Set("clerk_user_id", claims.Subject)
		c.Next()
	}
}

// GetClerkUserID retrieves the verified Clerk user ID from the Gin context.
// Returns the ID and true if present, empty string and false otherwise.
func GetClerkUserID(c *gin.Context) (string, bool) {
	val, exists := c.Get("clerk_user_id")
	if !exists {
		return "", false
	}
	id, ok := val.(string)
	return id, ok
}

// RequireRole verifies that the authenticated user has one of the allowed roles.
// It also blocks suspended accounts. The user's role is set in context as "user_role".
func RequireRole(db *sqlx.DB, roles ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		clerkUserID, ok := GetClerkUserID(c)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "user not found",
			})
			return
		}

		var role string
		var isSuspended bool
		err := db.QueryRowContext(
			c.Request.Context(),
			`SELECT role, is_suspended FROM users WHERE clerk_user_id = $1`,
			clerkUserID,
		).Scan(&role, &isSuspended)
		if err == sql.ErrNoRows {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{
				"error": "user not found",
			})
			return
		}
		if err != nil {
			c.AbortWithStatusJSON(http.StatusInternalServerError, gin.H{
				"error": "internal server error",
			})
			return
		}

		if isSuspended {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "account suspended",
			})
			return
		}

		allowed := false
		for _, r := range roles {
			if r == role {
				allowed = true
				break
			}
		}
		if !allowed {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{
				"error": "insufficient permissions",
			})
			return
		}

		c.Set("user_role", role)
		c.Next()
	}
}
