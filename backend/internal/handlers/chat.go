// chat.go contains HTTP handlers for GetStream Chat token generation.
package handlers

import (
	"context"
	"net/http"
	"time"

	streamchat "github.com/GetStream/stream-chat-go/v6"
	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/config"
	"github.com/kinfolk/backend/internal/middleware"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
	"github.com/kinfolk/backend/internal/services"
)

// ChatHandler handles chat-related HTTP requests.
type ChatHandler struct {
	cfg      *config.Config
	userSvc  *services.UserService
	userRepo *repository.UserRepository
}

func NewChatHandler(cfg *config.Config, userSvc *services.UserService, userRepo *repository.UserRepository) *ChatHandler {
	return &ChatHandler{cfg: cfg, userSvc: userSvc, userRepo: userRepo}
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

	if user.ClanID != nil {
		if err := h.ensureClanChannel(c.Request.Context(), user, *user.ClanID); err != nil {
			errorResponse(c, http.StatusInternalServerError, "failed to provision clan chat")
			return
		}
	}

	token, err := generateStreamToken(h.cfg.StreamAPIKey, h.cfg.StreamAPISecret, user.ID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, "failed to generate chat token")
		return
	}

	successResponse(c, gin.H{"token": token, "user_id": user.ID})
}

func (h *ChatHandler) ensureClanChannel(ctx context.Context, currentUser *models.User, clanID string) error {
	client, err := streamchat.NewClient(h.cfg.StreamAPIKey, h.cfg.StreamAPISecret)
	if err != nil {
		return err
	}

	clanUsers, err := h.userRepo.ListUsersByClan(ctx, clanID)
	if err != nil {
		return err
	}

	memberIDs := make([]string, 0, len(clanUsers))
	streamUsers := make([]*streamchat.User, 0, len(clanUsers))
	for _, clanUser := range clanUsers {
		memberIDs = append(memberIDs, clanUser.ID)
		streamUser := &streamchat.User{
			ID:   clanUser.ID,
			Name: clanUser.FullName,
		}
		if clanUser.ProfilePictureURL != nil {
			streamUser.Image = *clanUser.ProfilePictureURL
		}
		streamUsers = append(streamUsers, streamUser)
	}

	if len(streamUsers) > 0 {
		if _, err := client.UpsertUsers(ctx, streamUsers...); err != nil {
			return err
		}
	}

	if len(memberIDs) == 0 {
		memberIDs = append(memberIDs, currentUser.ID)
	}

	_, err = client.CreateChannel(ctx, "messaging", clanID, currentUser.ID, &streamchat.ChannelRequest{
		Members: memberIDs,
	})
	if err != nil {
		channel := client.Channel("messaging", clanID)
		if _, addErr := channel.AddMembers(ctx, memberIDs); addErr != nil {
			return err
		}
	}

	return nil
}

// generateStreamToken builds a GetStream JWT for a single user_id.
func generateStreamToken(apiKey, secret, userID string) (string, error) {
	client, err := streamchat.NewClient(apiKey, secret)
	if err != nil {
		return "", err
	}
	return client.CreateToken(userID, time.Now().Add(time.Hour))
}
