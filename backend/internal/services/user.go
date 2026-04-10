// user.go implements business logic for user account management including
// upserting users on first Clerk sign-in and profile updates.
package services

import (
	"context"
	"fmt"

	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
)

type UserService struct {
	repo     *repository.UserRepository
	clanRepo *repository.ClanRepository
	audit    *AuditService
}

// SyncUser upserts a user record on Clerk sign-in. Idempotent.
// If an admin pre-created the account (e.g. a clan leader with a pending clerk_user_id),
// the existing row is claimed by updating its clerk_user_id instead of inserting a duplicate.
func (s *UserService) SyncUser(ctx context.Context, clerkUserID, email, fullName, clanID string) (*models.User, error) {
	// 1. Happy path — user already fully synced.
	existing, err := s.repo.GetUserByClerkID(ctx, clerkUserID)
	if err != nil {
		return nil, fmt.Errorf("services.UserService.SyncUser: %w", err)
	}
	if existing != nil {
		return existing, nil
	}

	// 2. Admin may have pre-created the account (clan leader). Claim it.
	byEmail, err := s.repo.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, fmt.Errorf("services.UserService.SyncUser: %w", err)
	}
	if byEmail != nil {
		if err := s.repo.UpdateClerkID(ctx, byEmail.ID, clerkUserID); err != nil {
			return nil, fmt.Errorf("services.UserService.SyncUser: %w", err)
		}
		byEmail.ClerkUserID = clerkUserID
		return byEmail, nil
	}

	// 3. Brand-new user — create a fresh record.
	user := &models.User{
		ID:          uuid.New().String(),
		ClerkUserID: clerkUserID,
		Email:       email,
		FullName:    fullName,
		Role:        "general_user",
	}
	if clanID != "" {
		user.ClanID = &clanID
	}
	if err := s.repo.CreateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("services.UserService.SyncUser: %w", err)
	}
	return user, nil
}

// GetUserByClerkID returns the user associated with the given Clerk user ID.
func (s *UserService) GetUserByClerkID(ctx context.Context, clerkUserID string) (*models.User, error) {
	user, err := s.repo.GetUserByClerkID(ctx, clerkUserID)
	if err != nil {
		return nil, fmt.Errorf("services.UserService.GetUserByClerkID: %w", err)
	}
	return user, nil
}

// CompleteProfile sets optional profile fields for an existing user.
func (s *UserService) CompleteProfile(ctx context.Context, clerkUserID string, birthYear int, gender, profilePicURL, phone string) error {
	user, err := s.repo.GetUserByClerkID(ctx, clerkUserID)
	if err != nil {
		return fmt.Errorf("services.UserService.CompleteProfile: %w", err)
	}
	if user == nil {
		return fmt.Errorf("services.UserService.CompleteProfile: user not found")
	}

	user.BirthYear = &birthYear
	user.Gender = &gender
	user.ProfilePictureURL = &profilePicURL
	user.Phone = &phone

	if err := s.repo.UpdateUser(ctx, user); err != nil {
		return fmt.Errorf("services.UserService.CompleteProfile: %w", err)
	}
	return nil
}

// UpdateProfile updates a user's display name, phone number, and optional profile picture.
func (s *UserService) UpdateProfile(ctx context.Context, clerkUserID, fullName, phone, profilePicURL string) error {
	user, err := s.repo.GetUserByClerkID(ctx, clerkUserID)
	if err != nil {
		return fmt.Errorf("services.UserService.UpdateProfile: %w", err)
	}
	if user == nil {
		return fmt.Errorf("services.UserService.UpdateProfile: user not found")
	}

	user.FullName = fullName
	user.Phone = &phone
	if profilePicURL != "" {
		user.ProfilePictureURL = &profilePicURL
	}

	if err := s.repo.UpdateUser(ctx, user); err != nil {
		return fmt.Errorf("services.UserService.UpdateProfile: %w", err)
	}
	return nil
}

// ClearPasswordReset clears the password_reset_required flag after a user sets their own password.
func (s *UserService) ClearPasswordReset(ctx context.Context, clerkUserID string) error {
	user, err := s.repo.GetUserByClerkID(ctx, clerkUserID)
	if err != nil {
		return fmt.Errorf("services.UserService.ClearPasswordReset: %w", err)
	}
	if user == nil {
		return fmt.Errorf("services.UserService.ClearPasswordReset: user not found")
	}
	if err := s.repo.SetPasswordResetRequired(ctx, user.ID, false); err != nil {
		return fmt.Errorf("services.UserService.ClearPasswordReset: %w", err)
	}
	return nil
}

// DeleteProfile permanently removes a user by their Clerk ID.
func (s *UserService) DeleteProfile(ctx context.Context, clerkUserID string) error {
	user, err := s.repo.GetUserByClerkID(ctx, clerkUserID)
	if err != nil {
		return fmt.Errorf("services.UserService.DeleteProfile: %w", err)
	}
	if user == nil {
		return fmt.Errorf("services.UserService.DeleteProfile: user not found")
	}
	if err := s.repo.DeleteUser(ctx, user.ID); err != nil {
		return fmt.Errorf("services.UserService.DeleteProfile: %w", err)
	}
	return nil
}
