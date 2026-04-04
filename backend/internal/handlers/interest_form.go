// interest_form.go contains HTTP handlers for interest form submission.
package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/kinfolk/backend/internal/models"
	"github.com/kinfolk/backend/internal/repository"
)

// InterestFormHandler handles interest form HTTP requests.
type InterestFormHandler struct {
	repo *repository.InterestFormRepository
}

func NewInterestFormHandler(repo *repository.InterestFormRepository) *InterestFormHandler {
	return &InterestFormHandler{repo: repo}
}

// Submit stores a new interest form submitted by a visitor.
//
// POST /api/v1/interest-forms
func (h *InterestFormHandler) Submit(c *gin.Context) {
	var body struct {
		FullName        string  `json:"full_name" binding:"required"`
		ClanName        string  `json:"clan_name" binding:"required"`
		Email           string  `json:"email" binding:"required,email"`
		Phone           string  `json:"phone"`
		Region          *string `json:"region"`
		ExpectedMembers *int    `json:"expected_members"`
		Message         *string `json:"message"`
	}
	if err := c.ShouldBindJSON(&body); err != nil {
		errorResponse(c, http.StatusBadRequest, err.Error())
		return
	}

	form := &models.InterestForm{
		ID:              uuid.New().String(),
		FullName:        body.FullName,
		ClanName:        body.ClanName,
		Email:           body.Email,
		Phone:           body.Phone,
		Region:          body.Region,
		ExpectedMembers: body.ExpectedMembers,
		Message:         body.Message,
	}

	if err := h.repo.CreateInterestForm(context.Background(), form); err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	createdResponse(c, form)
}
