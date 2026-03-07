"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { api, type SettingsPayload } from "@/app/lib/api";
import { readSession, type UserSession } from "@/app/lib/session";

const DEFAULT_SETTINGS: Omit<SettingsPayload, "orgId"> = {
  payCycle: "monthly",
  currency: "USD",
  taxRate: 20,
  pensionRate: 5,
};

export default function SettingsPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace("/auth/login");
      return;
    }
    if (current.role !== "org_admin" || !current.orgId) {
      router.replace("/system_admin/Configuration");
      return;
    }

    setSession(current);
    void api
      .getSettings(current.orgId)
      .then((saved) => {
        setSettings({
          payCycle: saved.payCycle,
          currency: saved.currency,
          taxRate: saved.taxRate,
          pensionRate: saved.pensionRate,
        });
      })
      .catch(() => {
        // Keep defaults for a new tenant.
      });
  }, [router]);

  const onSave = async () => {
    if (!session?.orgId) {
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.saveSettings({
        orgId: session.orgId,
        ...settings,
      });
      setMessage("Payroll setup saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save settings");
    }
  };

  if (!session) {
    return <main className="centered">Loading...</main>;
  }

  return (
    <main className="page-shell">
      <Navbar session={session} />
      <section className="content">
        <h1>Payroll Settings</h1>
        <p>Configure payroll defaults for {session.orgName}.</p>

        {message && <div className="success-text">{message}</div>}
        {error && <div className="error-text">{error}</div>}

        <article className="panel form-grid">
          <label htmlFor="payCycle">Pay cycle</label>
          <select
            id="payCycle"
            onChange={(e) => setSettings((prev) => ({ ...prev, payCycle: e.target.value as "monthly" | "biweekly" }))}
            value={settings.payCycle}
          >
            <option value="monthly">Monthly</option>
            <option value="biweekly">Biweekly</option>
          </select>

          <label htmlFor="currency">Currency</label>
          <input
            id="currency"
            onChange={(e) => setSettings((prev) => ({ ...prev, currency: e.target.value.toUpperCase() }))}
            value={settings.currency}
          />

          <label htmlFor="tax">Tax Rate (%)</label>
          <input
            id="tax"
            onChange={(e) => setSettings((prev) => ({ ...prev, taxRate: Number(e.target.value) }))}
            type="number"
            value={settings.taxRate}
          />

          <label htmlFor="pension">Pension Rate (%)</label>
          <input
            id="pension"
            onChange={(e) => setSettings((prev) => ({ ...prev, pensionRate: Number(e.target.value) }))}
            type="number"
            value={settings.pensionRate}
          />

          <button onClick={onSave} type="button">
            Save Payroll Setup
          </button>
        </article>
      </section>
    </main>
  );
}
