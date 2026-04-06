// cors.go provides CORS middleware for Gin.
// It configures allowed origins, methods and headers based on application config.
package middleware

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/config"
)

// CORS returns a Gin middleware that sets CORS headers on every response.
// Preflight OPTIONS requests are short-circuited with a 204 No Content.
func CORS(cfg *config.Config) gin.HandlerFunc {
	// Build the set of allowed origins once at startup.
	allowed := make(map[string]struct{}, 1+len(cfg.ExtraAllowedOrigins))
	if cfg.FrontendURL != "" {
		allowed[cfg.FrontendURL] = struct{}{}
	}
	for _, o := range cfg.ExtraAllowedOrigins {
		allowed[o] = struct{}{}
	}

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		_, ok := allowed[origin]
		if ok {
			c.Header("Access-Control-Allow-Origin", origin)
			c.Header("Vary", "Origin")
		}

		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type, Accept")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == http.MethodOptions {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
