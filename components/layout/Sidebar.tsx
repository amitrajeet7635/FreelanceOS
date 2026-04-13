"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Target, GitBranch, FolderKanban,
  BookOpen, Calendar, Settings,
} from "lucide-react";
import { motion } from "framer-motion";

const NAV = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/leads",     label: "Leads",      icon: Target           },
  { href: "/pipeline",  label: "Pipeline",   icon: GitBranch        },
  { href: "/projects",  label: "Projects",   icon: FolderKanban     },
  { href: "/strategy",  label: "Strategy",   icon: BookOpen         },
  { href: "/planner",   label: "Planner",    icon: Calendar         },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div>
            <div className="sidebar-logo-title">FreelanceOS</div>
            <div className="sidebar-logo-sub">Client Acquisition</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Workspace</div>
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link key={href} href={href} className={`nav-link${active ? " active" : ""}`}>
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: "absolute",
                    left: 0, top: "50%",
                    transform: "translateY(-50%)",
                    width: 3, height: "60%",
                    borderRadius: "0 4px 4px 0",
                    background: "var(--accent)",
                  }}
                />
              )}
              <Icon size={16} strokeWidth={1.8} />
              <span>{label}</span>
            </Link>
          );
        })}

        <div className="nav-section-label" style={{ marginTop: 16 }}>System</div>
        <Link
          href="/settings"
          className={`nav-link${pathname === "/settings" ? " active" : ""}`}
        >
          <Settings size={16} strokeWidth={1.8} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Footer badge */}
      <div style={{
        padding: "12px 12px",
        borderTop: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "var(--accent-subtle)",
          border: "1px solid var(--accent-glow)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, color: "var(--accent)",
        }}>A</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>Your Studio</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Web Dev Freelancer</div>
        </div>
      </div>
    </aside>
  );
}
