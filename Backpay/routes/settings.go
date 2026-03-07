package routes

import (
  "encoding/json"
  "net/http"
  "strings"
)

func (a *App) settingsHandler(w http.ResponseWriter, r *http.Request) {
  switch r.Method {
  case http.MethodGet:
    a.getSettings(w, r)
  case http.MethodPost:
    a.saveSettings(w, r)
  default:
    writeError(w, http.StatusMethodNotAllowed, "method not allowed")
  }
}

func (a *App) getSettings(w http.ResponseWriter, r *http.Request) {
  orgID := strings.TrimSpace(r.URL.Query().Get("orgId"))
  if orgID == "" {
    writeError(w, http.StatusBadRequest, "orgId is required")
    return
  }

  a.mu.RLock()
  setting, exists := a.settings[orgID]
  a.mu.RUnlock()
  if !exists {
    writeError(w, http.StatusNotFound, "settings not found")
    return
  }

  writeJSON(w, http.StatusOK, setting)
}

func (a *App) saveSettings(w http.ResponseWriter, r *http.Request) {
  var req OrgSettings
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    writeError(w, http.StatusBadRequest, "invalid request body")
    return
  }

  if req.OrgID == "" {
    writeError(w, http.StatusBadRequest, "orgId is required")
    return
  }

  if req.PayCycle == "" {
    req.PayCycle = "monthly"
  }
  if req.Currency == "" {
    req.Currency = "USD"
  }

  a.mu.Lock()
  a.settings[req.OrgID] = req
  a.mu.Unlock()

  writeJSON(w, http.StatusOK, req)
}
