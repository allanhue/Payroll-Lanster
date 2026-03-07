export type UserRole = "system_admin" | "org_admin";

export type UserSession = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  orgId?: string;
  orgName?: string;
};

const SESSION_KEY = "payroll_session";

export function readSession(): UserSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as UserSession;
  } catch {
    return null;
  }
}

export function writeSession(session: UserSession): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.removeItem(SESSION_KEY);
}
