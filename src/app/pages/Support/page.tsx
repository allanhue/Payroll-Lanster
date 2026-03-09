"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/app/components/Navbar";
import { api } from "@/app/lib/api";
import { readSession, type UserSession } from "@/app/lib/session";

export default function SupportPage() {
  const [session, setSession] = useState<UserSession | null>(null);
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const current = readSession();
    if (!current) {
      router.replace("/auth/login");
      return;
    }
    setSession(current);
    setName(current.name || "");
    setEmail(current.email || "");
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await api.sendSupport({ name, email, subject, message });
      setSuccess("Your message has been sent! We'll get back to you within 24-48 hours.");
      setSubject("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return <main className="centered">Loading...</main>;
  }

  return (
    <main className="page-shell">
      <Navbar session={session} />
      <section className="content">
        <div className="page-header">
          <h1>Support Center</h1>
          <p>Need help with payroll? Contact our team and we'll get back to you within 24-48 hours.</p>
        </div>

        {success && <div className="alert alert-success">{success}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="cards-grid two-col">
          <div className="panel panel-elevated">
            <div className="panel-header">
              <h2>Contact Support</h2>
              <p>Send us a message and we'll respond via email</p>
            </div>
            <form onSubmit={onSubmit} className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="subject">Subject</label>
                <select
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                >
                  <option value="">Select a topic</option>
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Payroll Issue">Payroll Issue</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Billing Question">Billing Question</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question in detail..."
                  required
                />
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className={`btn btn-primary ${loading ? "btn-loading" : ""}`}
                  disabled={loading}
                >
                  {loading && <span className="btn-spinner" />}
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </div>
            </form>
          </div>

          <div>
            <div className="panel panel-info">
              <div className="info-header">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M12 16v-4M12 8h.01" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <h3>Response Time</h3>
              </div>
              <p>We typically respond within <strong>24-48 hours</strong> during business days. For urgent payroll issues, please select "Payroll Issue" as the subject.</p>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Quick Links</h3>
              </div>
              <ul className="simple-list">
                <li>
                  <a href="/pages/Settings" className="link">Payroll Setup Guide</a>
                </li>
                <li>
                  <a href="/pages/Employee" className="link">Managing Employees</a>
                </li>
                <li>
                  <a href="/pages/Payrun" className="link">Running Payroll</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
