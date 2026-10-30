import { useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  ArrowLeftRight,
  ArrowUpRight,
  Bell,
  ChartNoAxesCombined,
  ChevronDown,
  ChevronsUpDown,
  CircleHelp,
  LayoutDashboard,
  Search,
  Settings2,
  Wallet,
} from "lucide-react";
import { euro, openingBalance } from "../lib/finance";
import { useFinance } from "../lib/store";
import { Logo, Modal } from "./UI";

export function Shell() {
  const { transactions, toast } = useFinance();
  const [panel, setPanel] = useState("");
  const [search, setSearch] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const page =
    location.pathname === "/transactions"
      ? "Transactions"
      : location.pathname === "/analytics"
        ? "Analytics"
        : "Overview";
  const nav = [
    { to: "/", label: "Overview", mobile: "Overview", icon: LayoutDashboard },
    {
      to: "/transactions",
      label: "Transactions",
      mobile: "Activity",
      icon: ArrowLeftRight,
    },
    {
      to: "/analytics",
      label: "Analytics",
      mobile: "Analytics",
      icon: ChartNoAxesCombined,
    },
  ];
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="sidebar" aria-label="Workspace sidebar">
        <NavLink to="/" className="brand-link" aria-label="Northstar overview">
          <Logo />
        </NavLink>
        <div className="workspace">
          <span className="eyebrow">WORKSPACE</span>
          <button
            className="workspace-button"
            onClick={() => setPanel("workspace")}
          >
            <span className="workspace-avatar">A</span>
            <span>Personal</span>
            <ChevronsUpDown size={13} />
          </button>
        </div>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end>
              <Icon size={18} strokeWidth={1.4} />
              <span>{label}</span>
            </NavLink>
          ))}
          <button onClick={() => setPanel("accounts")}>
            <Wallet size={18} strokeWidth={1.4} />
            Accounts
          </button>
          <button onClick={() => setPanel("settings")}>
            <Settings2 size={18} strokeWidth={1.4} />
            Settings
          </button>
        </nav>
        <div className="sidebar-bottom">
          <div className="sync-card">
            <p>
              <span className="sync-dot" />
              All accounts synced
            </p>
            <small>Last updated today, 09:41</small>
            <button onClick={() => setPanel("accounts")}>
              Manage accounts <ArrowUpRight size={12} />
            </button>
          </div>
          <button className="help-button" onClick={() => setPanel("help")}>
            <CircleHelp size={17} strokeWidth={1.4} />
            Help & resources
          </button>
          <button
            className="profile-button"
            onClick={() => setPanel("profile")}
          >
            <span className="avatar">AM</span>
            <span>
              <strong>Alex Morgan</strong>
              <small>Personal account</small>
            </span>
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="greeting">
            <span className="mobile-logo">
              <Logo compact />
            </span>
            <div>
              <p>Good morning, Alex</p>
              <span className="desktop-date">Saturday, October 31, 2026</span>
              <h1 className="mobile-title">{page}</h1>
            </div>
          </div>
          <div className="topbar-actions">
            <form
              className="global-search search-field"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(
                  `/transactions?q=${encodeURIComponent(search.trim())}`,
                  { state: { search: Date.now() } },
                );
              }}
            >
              <Search size={17} strokeWidth={1.4} />
              <input
                aria-label="Search anything"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search anything..."
              />
            </form>
            <button
              className="icon-button notification-button"
              aria-label="Notifications"
              onClick={() => setPanel("notifications")}
            >
              <Bell size={20} strokeWidth={1.3} />
              <span />
            </button>
            <span className="topbar-divider" />
            <button
              className="avatar"
              aria-label="Alex Morgan account"
              onClick={() => setPanel("profile")}
            >
              AM
            </button>
          </div>
        </header>
        <main id="main-content" className="page">
          <Outlet />
          <p className="demo-note">
            Portfolio demonstration · Fictional EUR data · No banking connection
          </p>
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Mobile navigation">
        {nav.map(({ to, mobile, icon: Icon }) => (
          <NavLink key={to} to={to} end>
            <Icon size={19} strokeWidth={1.3} />
            <span>{mobile}</span>
          </NavLink>
        ))}
        <button onClick={() => setPanel("accounts")}>
          <Wallet size={19} strokeWidth={1.3} />
          <span>Accounts</span>
        </button>
      </nav>
      <div
        className={`toast ${toast ? "visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
      {panel && (
        <Modal
          title={
            {
              workspace: "Personal workspace",
              accounts: "Your demo accounts",
              settings: "Demo settings",
              help: "About PixelPerfect",
              profile: "Alex Morgan",
              notifications: "Notifications",
            }[panel] ?? "Northstar"
          }
          onClose={() => setPanel("")}
        >
          <p className="demo-badge">Portfolio demonstration</p>
          {panel === "accounts" ? (
            <div className="account-detail">
              <Wallet size={24} />
              <div>
                <strong>Personal · EUR</strong>
                <p>Demo account •• 4291</p>
              </div>
              <strong>
                {euro(
                  openingBalance +
                    transactions.reduce((sum, t) => sum + t.amount, 0),
                )}
              </strong>
            </div>
          ) : panel === "notifications" ? (
            <p>
              You're up to date. This demonstration has no live bank
              notifications.
            </p>
          ) : panel === "settings" ? (
            <>
              <p>Currency: EUR (€)</p>
              <p>
                Demo transactions are stored only in this browser. No sign-in or
                bank connection is used.
              </p>
            </>
          ) : panel === "workspace" ? (
            <p>
              Personal is the available demo workspace. All balances and
              transactions are fictional.
            </p>
          ) : panel === "profile" ? (
            <p>
              Alex Morgan is a fictional account holder used to reproduce the
              supplied Figma design.
            </p>
          ) : (
            <>
              <p>
                Northstar Finance is Project 02 — PixelPerfect: a Figma-to-React
                portfolio implementation.
              </p>
              <p>
                Explore the charts, filter transactions, or add your own demo
                entries. Your changes stay in this browser.
              </p>
            </>
          )}
          <div className="modal-actions">
            <button className="button primary" onClick={() => setPanel("")}>
              Got it <ChevronDown className="hidden" size={12} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
