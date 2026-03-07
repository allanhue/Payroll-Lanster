package routes

import (
  "encoding/json"
  "net/http"
)

type sendMailRequest struct {
  OrgID   string `json:"orgId"`
  Subject string `json:"subject"`
  Body    string `json:"body"`
}

func (a *App) sendMailTest(w http.ResponseWriter, r *http.Request) {
  if r.Method != http.MethodPost {
    writeError(w, http.StatusMethodNotAllowed, "method not allowed")
    return
  }

  var req sendMailRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    writeError(w, http.StatusBadRequest, "invalid request body")
    return
  }

  if req.OrgID == "" || req.Subject == "" || req.Body == "" {
    writeError(w, http.StatusBadRequest, "orgId, subject and body are required")
    return
  }

  writeJSON(w, http.StatusOK, map[string]any{
    "sent":    true,
    "message": "email request accepted",
  })
}
