// upload.go handles authenticated file uploads proxied to Cloudinary.
package handlers

import (
	"bytes"
	"crypto/sha1" //nolint:gosec // Cloudinary API requires SHA-1
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/config"
)

// UploadHandler proxies photo uploads to Cloudinary using signed authentication.
type UploadHandler struct {
	cfg *config.Config
}

func NewUploadHandler(cfg *config.Config) *UploadHandler {
	return &UploadHandler{cfg: cfg}
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

	// Build the Cloudinary signed upload params.
	ts := strconv.FormatInt(time.Now().Unix(), 10)
	folder := "profiles"

	// Signature covers all upload params except file, api_key, resource_type.
	// Params must be sorted alphabetically: folder, timestamp.
	sigPayload := fmt.Sprintf("folder=%s&timestamp=%s%s", folder, ts, h.cfg.CloudinaryAPISecret)
	//nolint:gosec
	sum := sha1.Sum([]byte(sigPayload))
	signature := fmt.Sprintf("%x", sum)

	// Multipart body to Cloudinary.
	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)

	addField := func(name, value string) {
		fw, _ := mw.CreateFormField(name)
		_, _ = io.WriteString(fw, value)
	}
	addField("api_key", h.cfg.CloudinaryAPIKey)
	addField("timestamp", ts)
	addField("folder", folder)
	addField("signature", signature)

	fw, err := mw.CreateFormFile("file", header.Filename)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "failed to build upload request")
		return
	}
	if _, err = fw.Write(fileBytes); err != nil {
		errorResponse(c, http.StatusInternalServerError, "failed to read uploaded file")
		return
	}
	mw.Close()

	cloudURL := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", h.cfg.CloudinaryCloudName)
	req, err := http.NewRequestWithContext(c.Request.Context(), http.MethodPost, cloudURL, &buf)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "failed to create Cloudinary request")
		return
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		localURL, localErr := saveUploadLocally(c, header.Filename, fileBytes)
		if localErr != nil {
			errorResponse(c, http.StatusBadGateway, "Cloudinary request failed: "+err.Error())
			return
		}

		c.JSON(http.StatusOK, gin.H{"url": localURL})
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		localURL, localErr := saveUploadLocally(c, header.Filename, fileBytes)
		if localErr != nil {
			errorResponse(c, http.StatusBadGateway, "Cloudinary error: "+string(body))
			return
		}

		c.JSON(http.StatusOK, gin.H{"url": localURL})
		return
	}

	var cloudinaryResp struct {
		SecureURL string `json:"secure_url"`
	}
	if err := json.Unmarshal(body, &cloudinaryResp); err != nil {
		localURL, localErr := saveUploadLocally(c, header.Filename, fileBytes)
		if localErr != nil {
			errorResponse(c, http.StatusBadGateway, "unexpected Cloudinary response")
			return
		}

		c.JSON(http.StatusOK, gin.H{"url": localURL})
		return
	}

	secureURL := cloudinaryResp.SecureURL
	if secureURL == "" {
		localURL, localErr := saveUploadLocally(c, header.Filename, fileBytes)
		if localErr != nil {
			errorResponse(c, http.StatusBadGateway, "unexpected Cloudinary response")
			return
		}

		c.JSON(http.StatusOK, gin.H{"url": localURL})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": secureURL})
}

func saveUploadLocally(c *gin.Context, originalName string, contents []byte) (string, error) {
	ext := strings.ToLower(filepath.Ext(originalName))
	switch ext {
	case ".jpg", ".jpeg", ".png", ".webp":
	default:
		ext = ".jpg"
	}

	filename := uuid.NewString() + ext
	relDir := filepath.Join("uploads", "profiles")
	if err := os.MkdirAll(relDir, 0o755); err != nil {
		return "", err
	}

	relPath := filepath.Join(relDir, filename)
	if err := os.WriteFile(relPath, contents, 0o644); err != nil {
		return "", err
	}

	scheme := "http"
	if c.Request.TLS != nil {
		scheme = "https"
	}

	return fmt.Sprintf("%s://%s/uploads/profiles/%s", scheme, c.Request.Host, filename), nil
}
