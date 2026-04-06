// chat.go contains HTTP handlers for GetStream Chat token generation.
package handlers

import (
	"context"
	"fmt"
	"log"
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

	// Build de-duplicated member and Stream user lists.
	// Always include currentUser even if ListUsersByClan doesn't return them yet
	// (e.g. clan_id was just set and hasn't propagated).
	seen := make(map[string]bool)
	memberIDs := make([]string, 0, len(clanUsers)+1)
	streamUsers := make([]*streamchat.User, 0, len(clanUsers)+1)

	addStreamUser := func(u *models.User) {
		if seen[u.ID] {
			return
		}
		seen[u.ID] = true
		memberIDs = append(memberIDs, u.ID)
		su := &streamchat.User{ID: u.ID, Name: u.FullName}
		if u.ProfilePictureURL != nil {
			su.Image = *u.ProfilePictureURL
		}
		streamUsers = append(streamUsers, su)
	}

	for _, u := range clanUsers {
		addStreamUser(u)
	}
	addStreamUser(currentUser) // always ensure the calling user is present

	// Upsert all users so Stream knows about them before we add them to the channel.
	if len(streamUsers) > 0 {
		if _, err := client.UpsertUsers(ctx, streamUsers...); err != nil {
			return fmt.Errorf("upsert stream users: %w", err)
		}
	}

	// Get-or-create the channel.
	// We use the first member as the creator (stable across calls); if the channel
	// already exists Stream simply returns it — the creator field is ignored.
	creatorID := currentUser.ID
	if len(memberIDs) > 0 {
		creatorID = memberIDs[0]
	}
	if _, err := client.CreateChannel(ctx, "messaging", clanID, creatorID, &streamchat.ChannelRequest{}); err != nil {
		return fmt.Errorf("get or create channel: %w", err)
	}

	// Always call AddMembers — it is idempotent and is the only reliable way to
	// add users to an existing channel. Passing Members in ChannelRequest only
	// works during initial creation; it is silently ignored for existing channels.
	channel := client.Channel("messaging", clanID)
	if _, err := channel.AddMembers(ctx, memberIDs); err != nil {
		return fmt.Errorf("add members to channel: %w", err)
	}

	log.Printf("ensureClanChannel: clan=%s members=%v", clanID, memberIDs)
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
