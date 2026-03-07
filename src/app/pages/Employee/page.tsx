"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { api, type PayrollEmployee } from "@/app/lib/api";
import { readSession, type UserSession } from "@/app/lib/session";

export default function EmployeePage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [employees, setEmployees] = useState<PayrollEmployee[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [salary, setSalary] = useState("");
  const [payCycle, setPayCycle] = useState<"monthly" | "biweekly">("monthly");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const refresh = async (orgId: string) => {
    const list = await api.listEmployees(orgId);
    setEmployees(Array.isArray(list) ? list : []);
  };

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

    setSession(current);
    void refresh(current.orgId).catch((err) => {
      setError(err instanceof Error ? err.message : "Could not load employees");
    });
  }, [router]);

  const onAdd = async (event: FormEvent) => {
    event.preventDefault();
    if (!session?.orgId) {
      return;
    }

    setError("");
    setSaving(true);
    try {
      await api.addEmployee({
        orgId: session.orgId,
        fullName,
        email,
        department,
        salary: Number(salary),
        payCycle,
      });

      setFullName("");
      setEmail("");
      setDepartment("");
      setSalary("");
      setPayCycle("monthly");
      await refresh(session.orgId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add employee");
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return <main className="centered">Loading...</main>;
  }

  return (
    <main className="page-shell">
      <Navbar session={session} />
      <section className="content">
        <h1>Employees</h1>
        <p>Add employees and attach them to payroll cycles.</p>

        {error && <div className="error-text">{error}</div>}

        <article className="panel">
          <h2>Add Employee</h2>
          <form className="form-grid form-two-col" onSubmit={onAdd}>
            <div>
              <label htmlFor="employeeName">Full name</label>
              <input id="employeeName" onChange={(e) => setFullName(e.target.value)} placeholder="Full name" required value={fullName} />
            </div>
            <div>
              <label htmlFor="employeeEmail">Email</label>
              <input id="employeeEmail" onChange={(e) => setEmail(e.target.value)} placeholder="Email" required type="email" value={email} />
            </div>
            <div>
              <label htmlFor="employeeDepartment">Department</label>
              <input
                id="employeeDepartment"
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="Department"
                required
                value={department}
              />
            </div>
            <div>
              <label htmlFor="employeeSalary">Annual salary</label>
              <input
                id="employeeSalary"
                min={1}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="Annual salary"
                required
                type="number"
                value={salary}
              />
            </div>
            <div>
              <label htmlFor="employeeCycle">Pay cycle</label>
              <select id="employeeCycle" onChange={(e) => setPayCycle(e.target.value as "monthly" | "biweekly")} value={payCycle}>
                <option value="monthly">Monthly</option>
                <option value="biweekly">Biweekly</option>
              </select>
            </div>
            <button className={saving ? "btn-loading" : ""} disabled={saving} type="submit">
              {saving && <span className="btn-spinner" />}
              {saving ? "Saving..." : "Add Employee"}
            </button>
          </form>
        </article>

        <article className="panel">
          <h2>Employee List</h2>
          {(!Array.isArray(employees) || employees.length === 0) ? (
            <p>No employees added yet.</p>
          ) : (
            <table className="loan-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Cycle</th>
                  <th>Salary</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id}>
                    <td>{employee.fullName}</td>
                    <td>{employee.email}</td>
                    <td>{employee.department}</td>
                    <td>{employee.payCycle}</td>
                    <td>${employee.salary.toLocaleString()}</td>
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
