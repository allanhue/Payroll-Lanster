"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";
import { writeSession } from "@/app/lib/session";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await api.login({ email, password });
      writeSession(user);

      if (user.role === "system_admin") {
        router.push("/system_admin/Dasboard");
      } else {
        router.push("/pages/Dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Sign In</h1>
        <p>Access payroll as system admin or organization admin.</p>

        <label htmlFor="email">Email</label>
        <input id="email" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          value={password}
        />

        {error && <div className="error-text">{error}</div>}

        <button disabled={loading} type="submit">
          {loading ? "Signing in..." : "Login"}
        </button>

        <p>
          New tenant admin? <Link href="/auth/Signup">Create account</Link>
        </p>
      </form>
    </main>
  );
}
