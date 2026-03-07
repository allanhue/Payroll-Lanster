package routes

import (
  "encoding/json"
  "net/http"
  "strings"
)

func (a *App) employeesHandler(w http.ResponseWriter, r *http.Request) {
  switch r.Method {
  case http.MethodGet:
    a.listEmployees(w, r)
  case http.MethodPost:
    a.createEmployee(w, r)
  default:
    writeError(w, http.StatusMethodNotAllowed, "method not allowed")
  }
}

func (a *App) listEmployees(w http.ResponseWriter, r *http.Request) {
  orgID := strings.TrimSpace(r.URL.Query().Get("orgId"))
  if orgID == "" {
    writeError(w, http.StatusBadRequest, "orgId is required")
    return
  }

  a.mu.RLock()
  list := append([]Employee(nil), a.employees[orgID]...)
  a.mu.RUnlock()

  writeJSON(w, http.StatusOK, list)
}

func (a *App) createEmployee(w http.ResponseWriter, r *http.Request) {
  var req Employee
  if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
    writeError(w, http.StatusBadRequest, "invalid request body")
    return
  }

  if req.OrgID == "" || req.FullName == "" || req.Email == "" || req.Department == "" || req.Salary <= 0 {
    writeError(w, http.StatusBadRequest, "missing required employee fields")
    return
  }

  if req.PayCycle == "" {
    req.PayCycle = "monthly"
  }

  a.mu.Lock()
  req.ID = a.nextID("emp")
  req.Status = "active"
  a.employees[req.OrgID] = append(a.employees[req.OrgID], req)
  a.mu.Unlock()

  writeJSON(w, http.StatusCreated, req)
}
