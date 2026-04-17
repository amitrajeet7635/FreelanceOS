"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Target, GitBranch, FolderKanban,
  BookOpen, Calendar as CalendarIcon, Settings,
  CalendarDays, Sparkles
} from "lucide-react";
import { ListTodo } from "lucide-react";
import { motion } from "framer-motion";
import { useLeads } from "@/hooks/useLeads";

const NAV = [
  { href: "/dashboard", label: "Dashboard",  icon: LayoutDashboard },
  { href: "/leads",     label: "Leads",      icon: Target           },
  { href: "/pipeline",  label: "Pipeline",   icon: GitBranch        },
  { href: "/projects",  label: "Projects",   icon: FolderKanban     },
  { href: "/todos",     label: "Todos",      icon: ListTodo         },
  { href: "/calendar",  label: "Calendar",   icon: CalendarDays     },
  { href: "/ai-studio", label: "AI Studio",  icon: Sparkles         },
  { href: "/strategy",  label: "Strategy",   icon: BookOpen         },
  { href: "/planner",   label: "Planner",    icon: CalendarIcon     },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { leads } = useLeads();

  const p0Count = leads.filter(l => l.priority === 'P0').length;
  const staleCount = leads.filter(l => {
    if (l.stage === 'client' || l.stage === 'lost' || l.on_bench) return false;
    const daysSince = Math.floor((Date.now() - new Date(l.updatedAt).getTime()) / 86400000);
    return daysSince > 7;
  }).length;

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
              <span style={{ flex: 1 }}>{label}</span>
              {href === '/leads' && (
                <div style={{ display: 'flex', gap: 4 }}>
                  {p0Count > 0 && <span style={{ background: 'var(--danger)', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 12, fontWeight: 700 }}>{p0Count}</span>}
                  {staleCount > 0 && <span style={{ background: '#f59e0b', color: '#fff', fontSize: 10, padding: '2px 6px', borderRadius: 12, fontWeight: 700 }}>{staleCount}</span>}
                </div>
              )}
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
