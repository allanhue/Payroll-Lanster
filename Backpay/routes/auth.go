package routes

import (
  "encoding/json"
  "net/http"
  "strings"
)

func (a *App) signup(w http.ResponseWriter, r *http.Request) {
  if r.Method != http.MethodPost {
    writeError(w, http.StatusMethodNotAllowed, "method not allowed")
    return
  }

  var req signupRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    writeError(w, http.StatusBadRequest, "invalid request body")
    return
  }

  req.Email = strings.ToLower(strings.TrimSpace(req.Email))
  if req.Name == "" || req.Email == "" || req.Password == "" || req.OrgName == "" {
    writeError(w, http.StatusBadRequest, "all signup fields are required")
    return
  }

  a.mu.Lock()
  defer a.mu.Unlock()

  if _, exists := a.userByMail[req.Email]; exists {
    writeError(w, http.StatusConflict, "email already exists")
    return
  }

  orgID := a.nextID("org")
  userID := a.nextID("usr")
  user := User{
    ID:       userID,
    Name:     req.Name,
    Email:    req.Email,
    Password: req.Password,
    Role:     RoleOrgAdmin,
    OrgID:    orgID,
    OrgName:  req.OrgName,
  }

  a.users[userID] = user
  a.userByMail[user.Email] = userID
  a.orgNames[orgID] = req.OrgName
  a.settings[orgID] = OrgSettings{
    OrgID:       orgID,
    PayCycle:    "monthly",
    Currency:    "USD",
    TaxRate:     20,
    PensionRate: 5,
  }

  writeJSON(w, http.StatusCreated, user)
}

func (a *App) login(w http.ResponseWriter, r *http.Request) {
  if r.Method != http.MethodPost {
    writeError(w, http.StatusMethodNotAllowed, "method not allowed")
    return
  }

  var req loginRequest
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    writeError(w, http.StatusBadRequest, "invalid request body")
    return
  }

  email := strings.ToLower(strings.TrimSpace(req.Email))
  a.mu.RLock()
  defer a.mu.RUnlock()

  userID, exists := a.userByMail[email]
  if !exists {
    writeError(w, http.StatusUnauthorized, "invalid credentials")
    return
  }

  user := a.users[userID]
  if user.Password != req.Password {
    writeError(w, http.StatusUnauthorized, "invalid credentials")
    return
  }

  writeJSON(w, http.StatusOK, user)
}
