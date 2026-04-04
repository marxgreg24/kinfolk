// response.go provides shared JSON response helpers used across all handlers.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func successResponse(c *gin.Context, data interface{}) {
	c.JSON(http.StatusOK, gin.H{"data": data})
}

func createdResponse(c *gin.Context, data interface{}) {
	c.JSON(http.StatusCreated, gin.H{"data": data})
}

func errorResponse(c *gin.Context, status int, msg string) {
	c.JSON(status, gin.H{"error": msg})
}
