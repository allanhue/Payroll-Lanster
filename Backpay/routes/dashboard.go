package routes

import (
  "net/http"
  "strings"
)

func (a *App) orgDashboard(w http.ResponseWriter, r *http.Request) {
  if r.Method != http.MethodGet {
    writeError(w, http.StatusMethodNotAllowed, "method not allowed")
    return
  }

  orgID := strings.TrimSpace(r.URL.Query().Get("orgId"))
  if orgID == "" {
    writeError(w, http.StatusBadRequest, "orgId is required")
    return
  }

  a.mu.RLock()
  list := a.employees[orgID]
  a.mu.RUnlock()

  total := len(list)
  active := 0
  monthlyPayroll := 0.0
  for _, employee := range list {
    if employee.Status == "active" {
      active++
    }
    monthlyPayroll += employee.Salary / 12
  }

  avgSalary := 0.0
  if total > 0 {
    avgSalary = monthlyPayroll * 12 / float64(total)
  }

  writeJSON(w, http.StatusOK, map[string]any{
    "totalEmployees": total,
    "activeEmployees": active,
    "monthlyPayroll": monthlyPayroll,
    "avgSalary": avgSalary,
  })
}

func (a *App) systemDashboard(w http.ResponseWriter, r *http.Request) {
  if r.Method != http.MethodGet {
    writeError(w, http.StatusMethodNotAllowed, "method not allowed")
    return
  }

  a.mu.RLock()
  defer a.mu.RUnlock()

  employees := 0
  payroll := 0.0
  for _, list := range a.employees {
    employees += len(list)
    for _, employee := range list {
      payroll += employee.Salary / 12
    }
  }

  writeJSON(w, http.StatusOK, map[string]any{
    "tenants":   len(a.orgNames),
    "employees": employees,
    "payroll":   payroll,
  })
}

func (a *App) tenantAnalytics(w http.ResponseWriter, r *http.Request) {
  if r.Method != http.MethodGet {
    writeError(w, http.StatusMethodNotAllowed, "method not allowed")
    return
  }

  a.mu.RLock()
  defer a.mu.RUnlock()

  stats := make([]tenantStat, 0, len(a.orgNames))
  for orgID, orgName := range a.orgNames {
    list := a.employees[orgID]
    monthlyPayroll := 0.0
    for _, employee := range list {
      monthlyPayroll += employee.Salary / 12
    }
    stats = append(stats, tenantStat{
      OrgID:          orgID,
      OrgName:        orgName,
      Employees:      len(list),
      MonthlyPayroll: monthlyPayroll,
    })
  }

  writeJSON(w, http.StatusOK, stats)
}
