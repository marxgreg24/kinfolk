// upload.go handles authenticated file uploads proxied to Cloudinary.
package handlers

import (
	"io"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/config"
	"github.com/kinfolk/backend/internal/media"
)

// UploadHandler proxies photo uploads to Cloudinary using signed authentication.
type UploadHandler struct {
	uploader *media.CloudinaryUploader
}

func NewUploadHandler(cfg *config.Config) *UploadHandler {
	return &UploadHandler{uploader: media.NewCloudinaryUploader(cfg)}
}

// UploadPhoto accepts a multipart file, signs it, and forwards it to Cloudinary.
//
// POST /api/v1/upload/photo  (multipart/form-data, field: "file")
// Returns: { "url": "<secure_url>" }
func (h *UploadHandler) UploadPhoto(c *gin.Context) {
	file, header, err := c.Request.FormFile("file")
	if err != nil {
		errorResponse(c, http.StatusBadRequest, "file field is required")
		return
	}
	defer file.Close()

	// Reject files larger than 10 MB.
	const maxSize = 10 << 20
	if header.Size > maxSize {
		errorResponse(c, http.StatusBadRequest, "file is too large (max 10 MB)")
		return
	}

	fileBytes, err := io.ReadAll(file)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "failed to read uploaded file")
		return
	}

	secureURL, err := h.uploader.UploadImage(c.Request.Context(), header.Filename, fileBytes, "profiles")
	if err != nil {
		errorResponse(c, http.StatusBadGateway, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": secureURL})
}
