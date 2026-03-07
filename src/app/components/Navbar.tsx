"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, type UserSession } from "@/app/lib/session";

type NavbarProps = {
  session: UserSession;
};

export default function Navbar({ session }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const orgLinks = [
    { href: "/pages/Dashboard", label: "Dashboard" },
    { href: "/pages/Employee", label: "Employees" },
    { href: "/pages/Settings", label: "Payroll Setup" },
    { href: "/pages/Profile", label: "Profile" },
  ];

  const systemLinks = [
    { href: "/system_admin/Dasboard", label: "Overview" },
    { href: "/system_admin/Analytics", label: "Analytics" },
    { href: "/system_admin/Configuration", label: "Configuration" },
  ];

  const links = session.role === "system_admin" ? systemLinks : orgLinks;

  return (
    <nav className="navbar">
      <div className="brand">
        <span className="dot" />
        <span>Payroll Lanster</span>
      </div>

      <div className="nav-links">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link key={link.href} className={active ? "active" : ""} href={link.href}>
              {link.label}
            </Link>
          );
        })}
      </div>

      <div className="nav-user">
        <div>
          <p>{session.name}</p>
          <small>{session.role === "system_admin" ? "Owner" : session.orgName}</small>
        </div>
        <button
          onClick={() => {
            clearSession();
            router.push("/auth/login");
          }}
          type="button"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
