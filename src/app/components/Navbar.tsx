"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession, type UserSession } from "@/app/lib/session";
import Sidebar from "@/app/components/Sidebar";

type NavbarProps = {
  session: UserSession;
};

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  tag: "payrun" | "payslip" | "approval" | "system";
};

const defaultNotifications: NotificationItem[] = [
  { id: "ntf-1", title: "Payrun pending approval", detail: "April payrun PR-0426 is awaiting approval.", tag: "payrun" },
  { id: "ntf-2", title: "Payslip batch ready", detail: "12 payslips were generated for review.", tag: "payslip" },
  { id: "ntf-3", title: "Approval reminder", detail: "2 items in approval queue are older than 24h.", tag: "approval" },
];

export default function Navbar({ session }: NavbarProps) {
  const router = useRouter();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(defaultNotifications);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchHref = session.role === "system_admin" ? "/system_admin/Analytics" : "/pages/Reports";
  const settingsHref = session.role === "system_admin" ? "/system_admin/Configuration" : "/pages/Settings";

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      // Simulate search - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 300));
      setSearchResults([
        { type: "employee", name: "John Doe", id: "1" },
        { type: "payrun", name: "April 2026 Payroll", id: "PR-0426" },
      ]);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      setIsSearchOpen(true);
    } else {
      setIsSearchOpen(false);
      setSearchResults([]);
    }
  };

  return (
    <>
      <Sidebar session={session} />
      <header className="navbar">
        <div className="top-right">
          {/* Search Section */}
          <div className={`search-container ${isSearchOpen ? "open" : ""}`}>
            <form onSubmit={handleSearch} className="search-form">
              <input
                type="text"
                placeholder="Search employees, payruns, reports..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="search-input"
                autoComplete="off"
              />
              <button type="submit" className="search-submit" aria-label="Search" disabled={isSearching}>
                {isSearching ? (
                  <svg aria-hidden="true" viewBox="0 0 24 24" className="search-spinner">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="31.416" strokeDashoffset="31.416" />
                  </svg>
                ) : (
                  <svg aria-hidden="true" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" fill="none" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                  </svg>
                )}
              </button>
            </form>
            {!isSearchOpen && (
              <button 
                aria-label="Open search" 
                className="top-icon-link search-toggle" 
                onClick={() => setIsSearchOpen(true)} 
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" fill="none" r="6.5" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M16 16l5 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
                </svg>
              </button>
            )}
            {isSearchOpen && (
              <button 
                aria-label="Close search" 
                className="top-icon-link search-close" 
                onClick={() => {setIsSearchOpen(false); setSearchQuery(""); setSearchResults([]);}} 
                type="button"
              >
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M18 6L6 18M6 6l12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            )}
            
            {/* Search Results Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="search-results">
                <div className="search-results-header">
                  <span>Search Results</span>
                </div>
                <ul className="search-results-list">
                  {searchResults.map((result) => (
                    <li key={result.id} className="search-result-item">
                      <button 
                        className="search-result-link"
                        onClick={() => {
                          router.push(`${searchHref}?q=${encodeURIComponent(searchQuery)}&type=${result.type}&id=${result.id}`);
                          setIsSearchOpen(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }}
                      >
                        <div className="search-result-icon">
                          {result.type === "employee" ? (
                            <svg viewBox="0 0 24 24">
                              <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
                              <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24">
                              <rect x="3" y="4" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5" />
                              <line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" strokeWidth="1.5" />
                              <line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" />
                              <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                          )}
                        </div>
                        <div className="search-result-content">
                          <span className="search-result-title">{result.name}</span>
                          <span className="search-result-type">{result.type}</span>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="search-results-footer">
                  <button 
                    className="view-all-results"
                    onClick={() => {
                      router.push(`${searchHref}?q=${encodeURIComponent(searchQuery)}`);
                      setIsSearchOpen(false);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                  >
                    View all results
                  </button>
                </div>
              </div>
            )}
          </div>

          <Link aria-label="Settings" className="top-icon-link" href={settingsHref}>
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 8.8A3.2 3.2 0 1112 15.2 3.2 3.2 0 0112 8.8z" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M19.4 13.1l1.2-1.1-1.2-1.1-.2-1.6-1.5-.5-.9-1.3-1.6.3-1.4-.8-1.4.8-1.6-.3-.9 1.3-1.5.5-.2 1.6L3.4 12l1.2 1.1.2 1.6 1.5.5.9 1.3 1.6-.3 1.4.8 1.4-.8 1.6.3.9-1.3 1.5-.5.2-1.6z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.2" />
            </svg>
          </Link>

          <button aria-label="Notifications" className="top-icon-link" onClick={() => setOpenDrawer(true)} type="button">
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <path d="M12 4a5 5 0 00-5 5v2.2l-1.3 2.2A1 1 0 006.6 15h10.8a1 1 0 00.9-1.6L17 11.2V9a5 5 0 00-5-5z" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M10 17a2 2 0 004 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
            </svg>
            {notifications.length > 0 && <span className="notif-dot" />}
          </button>

          <div className="nav-user">
            <p>{session.name}</p>
            <small>{session.role === "system_admin" ? "Owner" : "Org Admin"}</small>
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
      </header>

      <aside className={`notif-drawer ${openDrawer ? "open" : ""}`}>
        <div className="notif-header">
          <h3>Notifications</h3>
          <button className="drawer-close" onClick={() => setOpenDrawer(false)} type="button">
            x
          </button>
        </div>
        {notifications.length === 0 ? (
          <p className="muted">No notifications.</p>
        ) : (
          <ul className="notif-list">
            {notifications.map((item) => (
              <li className="notif-item" key={item.id}>
                <div className="notif-meta">
                  <span className={`notif-tag tag-${item.tag}`}>{item.tag}</span>
                  <button className="notif-remove" onClick={() => removeNotification(item.id)} type="button">
                    x
                  </button>
                </div>
                <strong>{item.title}</strong>
                <p>{item.detail}</p>
              </li>
            ))}
          </ul>
        )}
      </aside>
      {openDrawer && <button className="drawer-backdrop" onClick={() => setOpenDrawer(false)} type="button" />}
    </>
  );
}
