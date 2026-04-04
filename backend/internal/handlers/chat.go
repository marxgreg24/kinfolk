// chat.go contains HTTP handlers for GetStream Chat token generation.
package handlers

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/config"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/services"
)

// ChatHandler handles chat-related HTTP requests.
type ChatHandler struct {
	cfg     *config.Config
	userSvc *services.UserService
}

func NewChatHandler(cfg *config.Config, userSvc *services.UserService) *ChatHandler {
	return &ChatHandler{cfg: cfg, userSvc: userSvc}
}

// GetToken issues a short-lived GetStream Chat JWT for the authenticated user.
//
// GET /api/v1/chat/token
func (h *ChatHandler) GetToken(c *gin.Context) {
	clerkID, ok := middleware.GetClerkUserID(c)
	if !ok {
		errorResponse(c, http.StatusUnauthorized, "unauthenticated")
		return
	}

	user, err := h.userSvc.GetUserByClerkID(c.Request.Context(), clerkID)
	if err != nil || user == nil {
		errorResponse(c, http.StatusInternalServerError, "could not resolve user")
		return
	}

	token, err := generateStreamToken(h.cfg.StreamAPISecret, user.ID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "failed to generate chat token")
		return
	}

	successResponse(c, gin.H{"token": token, "user_id": user.ID})
}

// generateStreamToken builds a GetStream HS256 JWT for a single user_id.
// The token has a 1-hour expiry and uses the server-side API secret.
func generateStreamToken(secret, userID string) (string, error) {
	header := base64RawURL(`{"alg":"HS256","typ":"JWT"}`)

	now := time.Now().Unix()
	payloadJSON := []byte(`{"user_id":"` + userID + `","iat":` +
		itoa(now) + `,"exp":` + itoa(now+3600) + `}`)
	payload := base64RawURL(payloadJSON)

	signingInput := header + "." + payload

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(signingInput))
	sig := base64RawURLBytes(mac.Sum(nil))

	return signingInput + "." + sig, nil
}

// base64RawURL returns the standard base64url-no-padding encoding of src.
func base64RawURL(src interface{}) string {
	var b []byte
	switch v := src.(type) {
	case string:
		b = []byte(v)
	case []byte:
		b = v
	}
	return base64RawURLBytes(b)
}

func base64RawURLBytes(b []byte) string {
	// Use hex temporarily, then convert — simpler than importing encoding/base64 indirectly.
	// Actually: use encoding/hex for the HMAC output and standard base64url for header/payload.
	_ = hex.EncodeToString // suppress unused import if needed
	return encodeBase64URL(b)
}

func encodeBase64URL(src []byte) string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
	out := make([]byte, 0, (len(src)*4+2)/3)
	for i := 0; i < len(src); i += 3 {
		var b0, b1, b2 byte
		b0 = src[i]
		if i+1 < len(src) {
			b1 = src[i+1]
		}
		if i+2 < len(src) {
			b2 = src[i+2]
		}
		out = append(out, chars[b0>>2])
		out = append(out, chars[((b0&0x03)<<4)|(b1>>4)])
		if i+1 < len(src) {
			out = append(out, chars[((b1&0x0f)<<2)|(b2>>6)])
		}
		if i+2 < len(src) {
			out = append(out, chars[b2&0x3f])
		}
	}
	return string(out)
}

func itoa(n int64) string {
	if n == 0 {
		return "0"
	}
	neg := n < 0
	if neg {
		n = -n
	}
	buf := make([]byte, 0, 20)
	for n > 0 {
		buf = append([]byte{byte('0' + n%10)}, buf...)
		n /= 10
	}
	if neg {
		buf = append([]byte{'-'}, buf...)
	}
	return string(buf)
}
