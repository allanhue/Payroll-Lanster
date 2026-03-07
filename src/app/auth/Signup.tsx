"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/app/lib/api";
import { writeSession } from "@/app/lib/session";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [orgName, setOrgName] = useState("");
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
      const user = await api.signup({ name, email, password, orgName });
      writeSession(user);
      router.push("/pages/Dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-shell">
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>Create Tenant Admin</h1>
        <p>Register an organization and start payroll setup.</p>

        <label htmlFor="name">Admin Name</label>
        <input id="name" onChange={(e) => setName(e.target.value)} required value={name} />

        <label htmlFor="org">Organization</label>
        <input id="org" onChange={(e) => setOrgName(e.target.value)} required value={orgName} />

        <label htmlFor="email">Email</label>
        <input id="email" onChange={(e) => setEmail(e.target.value)} required type="email" value={email} />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          minLength={6}
          onChange={(e) => setPassword(e.target.value)}
          required
          type="password"
          value={password}
        />

        {error && <div className="error-text">{error}</div>}

        <button disabled={loading} type="submit">
          {loading ? "Creating..." : "Sign Up"}
        </button>

        <p>
          Already registered? <Link href="/auth/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
