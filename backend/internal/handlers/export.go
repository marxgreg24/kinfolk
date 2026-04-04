// export.go contains HTTP handlers for exporting clan data as GEDCOM.
package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/kinfolk/backend/internal/services"
)

// ExportHandler handles data export HTTP requests.
type ExportHandler struct {
	gedcomSvc *services.GedcomService
}

func NewExportHandler(gedcomSvc *services.GedcomService) *ExportHandler {
	return &ExportHandler{gedcomSvc: gedcomSvc}
}

// Export streams a GEDCOM 5.5.1 file for the requested clan.
//
// GET /api/v1/clans/:id/export
func (h *ExportHandler) Export(c *gin.Context) {
	clanID := c.Param("id")

	data, err := h.gedcomSvc.ExportClanGEDCOM(c.Request.Context(), clanID)
	if err != nil {
		errorResponse(c, http.StatusInternalServerError, err.Error())
		return
	}

	c.Header("Content-Disposition", `attachment; filename="clan-`+clanID+`.ged"`)
	c.Data(http.StatusOK, "text/x-gedcom; charset=utf-8", data)
}
