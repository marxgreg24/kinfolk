// cors.go provides CORS middleware for Gin.
// It configures allowed origins, methods and headers based on application config.
package middleware

import (
	"net/http"
	"net/url"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/config"
)

const (
	productionOrigin    = "https://kinfolkapp.me"
	productionWWWOrigin = "https://www.kinfolkapp.me"
)

// CORS returns a Gin middleware that sets CORS headers on every response.
// Preflight OPTIONS requests are short-circuited with a 204 No Content.
func CORS(cfg *config.Config) gin.HandlerFunc {
	allowed := allowedOrigins(cfg)

	return func(c *gin.Context) {
		origin := normalizeOrigin(c.Request.Header.Get("Origin"))
		if origin != "" {
			c.Header("Vary", "Origin")
		}

		_, ok := allowed[origin]
		if ok {
			c.Header("Access-Control-Allow-Origin", origin)
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

func allowedOrigins(cfg *config.Config) map[string]struct{} {
	allowed := make(map[string]struct{}, 3+len(cfg.ExtraAllowedOrigins))
	add := func(origin string) {
		normalized := normalizeOrigin(origin)
		if normalized == "" {
			return
		}
		allowed[normalized] = struct{}{}
	}

	add(cfg.FrontendURL)
	for _, origin := range cfg.ExtraAllowedOrigins {
		add(origin)
	}

	// Keep production web origins working even if a deployment is missing one env var.
	add(productionOrigin)
	add(productionWWWOrigin)

	return allowed
}

func normalizeOrigin(origin string) string {
	origin = strings.TrimSpace(origin)
	if origin == "" {
		return ""
	}

	parsed, err := url.Parse(origin)
	if err != nil || parsed.Scheme == "" || parsed.Host == "" {
		return strings.TrimRight(origin, "/")
	}

	host := parsed.Hostname()
	port := parsed.Port()
	if port != "" && !isDefaultPort(parsed.Scheme, port) {
		host += ":" + port
	}

	return parsed.Scheme + "://" + host
}

func isDefaultPort(scheme, port string) bool {
	return (scheme == "http" && port == "80") || (scheme == "https" && port == "443")
}
