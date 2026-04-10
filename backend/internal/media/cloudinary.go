package media

import (
	"bytes"
	"context"
	"crypto/sha1" //nolint:gosec // Cloudinary signed uploads require SHA-1
	"encoding/json"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/kinfolk/backend/internal/config"
)

type CloudinaryUploader struct {
	cfg    *config.Config
	client *http.Client
}

func NewCloudinaryUploader(cfg *config.Config) *CloudinaryUploader {
	return &CloudinaryUploader{
		cfg:    cfg,
		client: http.DefaultClient,
	}
}

func (u *CloudinaryUploader) UploadImage(ctx context.Context, filename string, contents []byte, folder string) (string, error) {
	if !u.cfg.HasCloudinaryConfig() {
		return "", fmt.Errorf("Cloudinary is not configured")
	}

	ts := strconv.FormatInt(time.Now().Unix(), 10)
	params := map[string]string{
		"folder":    folder,
		"timestamp": ts,
	}
	signature := signUploadParams(params, u.cfg.CloudinaryAPISecret)

	var buf bytes.Buffer
	mw := multipart.NewWriter(&buf)

	for _, key := range sortedKeys(params) {
		fieldWriter, err := mw.CreateFormField(key)
		if err != nil {
			return "", fmt.Errorf("create Cloudinary form field %s: %w", key, err)
		}
		if _, err := io.WriteString(fieldWriter, params[key]); err != nil {
			return "", fmt.Errorf("write Cloudinary form field %s: %w", key, err)
		}
	}

	for _, field := range []struct {
		name  string
		value string
	}{
		{name: "api_key", value: u.cfg.CloudinaryAPIKey},
		{name: "signature", value: signature},
	} {
		fieldWriter, err := mw.CreateFormField(field.name)
		if err != nil {
			return "", fmt.Errorf("create Cloudinary form field %s: %w", field.name, err)
		}
		if _, err := io.WriteString(fieldWriter, field.value); err != nil {
			return "", fmt.Errorf("write Cloudinary form field %s: %w", field.name, err)
		}
	}

	fileWriter, err := mw.CreateFormFile("file", filename)
	if err != nil {
		return "", fmt.Errorf("create Cloudinary file field: %w", err)
	}
	if _, err := fileWriter.Write(contents); err != nil {
		return "", fmt.Errorf("write Cloudinary file contents: %w", err)
	}
	if err := mw.Close(); err != nil {
		return "", fmt.Errorf("close Cloudinary multipart writer: %w", err)
	}

	cloudURL := fmt.Sprintf("https://api.cloudinary.com/v1_1/%s/image/upload", u.cfg.CloudinaryCloudName)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, cloudURL, &buf)
	if err != nil {
		return "", fmt.Errorf("create Cloudinary request: %w", err)
	}
	req.Header.Set("Content-Type", mw.FormDataContentType())

	resp, err := u.client.Do(req)
	if err != nil {
		return "", fmt.Errorf("perform Cloudinary request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("read Cloudinary response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("Cloudinary error: %s", strings.TrimSpace(string(body)))
	}

	var payload struct {
		SecureURL string `json:"secure_url"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		return "", fmt.Errorf("decode Cloudinary response: %w", err)
	}
	if payload.SecureURL == "" {
		return "", fmt.Errorf("Cloudinary response missing secure_url")
	}

	return payload.SecureURL, nil
}

func signUploadParams(params map[string]string, apiSecret string) string {
	parts := make([]string, 0, len(params))
	for _, key := range sortedKeys(params) {
		parts = append(parts, fmt.Sprintf("%s=%s", key, params[key]))
	}
	payload := strings.Join(parts, "&") + apiSecret
	//nolint:gosec
	sum := sha1.Sum([]byte(payload))
	return fmt.Sprintf("%x", sum)
}

func sortedKeys(values map[string]string) []string {
	keys := make([]string, 0, len(values))
	for key := range values {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	return keys
}
