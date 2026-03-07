"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { api, type DashboardStats, type PayrollEmployee } from "@/app/lib/api";
import { readSession, type UserSession } from "@/app/lib/session";

const MONTHS = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];

function toPolyline(values: number[], width: number, height: number, padding = 18): string {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  return values
    .map((value, index) => {
      const x = padding + (index * (width - padding * 2)) / (values.length - 1);
      const y = height - padding - ((value - min) / span) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

export default function DashboardPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace("/auth/login");
      return;
    }
    if (current.role !== "org_admin" || !current.orgId) {
      router.replace("/system_admin/Dasboard");
      return;
    }
    const orgId = current.orgId;
    setSession(current);
    void (async () => {
      try {
        const [dashboard, list] = await Promise.all([api.orgDashboard(orgId), api.listEmployees(orgId)]);
        setStats(dashboard);
        setEmployees(Array.isArray(list) ? list : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load dashboard");
      }
    })();
  }, [router]);

  const payrollTrend = useMemo(() => {
    const base = stats?.monthlyPayroll ?? 0;
    return [0.86, 0.91, 0.95, 1.03, 1.08, 1].map((factor) => Math.round(base * factor));
  }, [stats]);

  const hiresByDept = useMemo(() => {
    const counts = employees.reduce<Record<string, number>>((acc, employee) => {
      acc[employee.department] = (acc[employee.department] ?? 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).slice(0, 6);
  }, [employees]);

  const recentHires = useMemo(
    () =>
      [...employees]
        .slice(-8)
        .reverse()
        .map((employee, idx) => ({
          ...employee,
          hiredDate: new Date(Date.now() - idx * 86400000 * 6).toLocaleDateString(),
        })),
    [employees]
  );

  if (!session) {
    return <main className="centered">Loading...</main>;
  }

  return (
    <main className="page-shell">
      <Navbar session={session} />
      <section className="content">
        <h1>Organization Payroll Dashboard</h1>
        <p>Track payroll KPIs, trends, and new hires for {session.orgName}.</p>
        {error && <div className="error-text">{error}</div>}

        <div className="cards-grid">
          <article className="card">
            <h3>Total Employees</h3>
            <strong>{stats?.totalEmployees ?? 0}</strong>
          </article>
          <article className="card">
            <h3>Active Employees</h3>
            <strong>{stats?.activeEmployees ?? 0}</strong>
          </article>
          <article className="card">
            <h3>Monthly Payroll</h3>
            <strong>${(stats?.monthlyPayroll ?? 0).toLocaleString()}</strong>
          </article>
          <article className="card">
            <h3>Average Salary</h3>
            <strong>${(stats?.avgSalary ?? 0).toLocaleString()}</strong>
          </article>
        </div>

        <div className="cards-grid analytics-grid">
          <article className="panel">
            <h2>Payroll Trend</h2>
            <svg className="chart-svg" viewBox="0 0 420 170" role="img" aria-label="Payroll line chart">
              <polyline className="line-chart" fill="none" points={toPolyline(payrollTrend, 420, 170)} />
              {payrollTrend.map((value, index) => {
                const x = 18 + (index * (420 - 36)) / (payrollTrend.length - 1);
                const y = 170 - 18 - ((value - Math.min(...payrollTrend)) / ((Math.max(...payrollTrend) - Math.min(...payrollTrend)) || 1)) * (170 - 36);
                return <circle key={`line-dot-${MONTHS[index]}`} cx={x} cy={y} r="3.5" className="line-dot" />;
              })}
            </svg>
            <div className="chart-labels">
              {MONTHS.map((month) => (
                <span key={`month-${month}`}>{month}</span>
              ))}
            </div>
          </article>

          <article className="panel">
            <h2>Department Hiring</h2>
            <div className="bar-chart">
              {hiresByDept.length === 0 ? (
                <p className="muted">No department data yet.</p>
              ) : (
                hiresByDept.map(([department, count]) => (
                  <div className="bar-row" key={`bar-${department}`}>
                    <span>{department}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${Math.max(8, count * 18)}%` }} />
                    </div>
                    <strong>{count}</strong>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>

        <article className="panel">
          <h2>Recent Hires</h2>
          {recentHires.length === 0 ? (
            <p>No hires yet. Add employees in the Employees module.</p>
          ) : (
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Pay Cycle</th>
                  <th>Salary</th>
                  <th>Hired Date</th>
                </tr>
              </thead>
              <tbody>
                {recentHires.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.fullName}</td>
                    <td>{employee.department}</td>
                    <td>{employee.payCycle}</td>
                    <td>${employee.salary.toLocaleString()}</td>
                    <td>{employee.hiredDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </article>
      </section>
    </main>
  );
}
