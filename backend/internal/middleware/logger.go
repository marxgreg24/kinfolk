// logger.go provides a structured request-logging middleware for Gin.
// It records method, path, status code, latency and client IP for every request.
package middleware

import (
	"fmt"
	"log"
	"time"

	"github.com/gin-gonic/gin"
)

// Logger returns a Gin middleware that logs each request in the format:
// [KINFOLK] METHOD /path | STATUS | latency | client_ip
func Logger() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		c.Next()

		latency := time.Since(start)
		status := c.Writer.Status()
		method := c.Request.Method
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}
		clientIP := c.ClientIP()

		log.Printf("[KINFOLK] %s %s | %d | %s | %s",
			method,
			path,
			status,
			formatLatency(latency),
			clientIP,
		)
	}
}

func formatLatency(d time.Duration) string {
	if d < time.Millisecond {
		return fmt.Sprintf("%dµs", d.Microseconds())
	}
	if d < time.Second {
		return fmt.Sprintf("%.2fms", float64(d.Microseconds())/1000)
	}
	return fmt.Sprintf("%.2fs", d.Seconds())
}
