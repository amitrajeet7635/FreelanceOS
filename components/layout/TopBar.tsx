"use client";

import { usePathname, useRouter } from "next/navigation";
import { Sun, Moon, Users, TrendingUp, LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import useSWR from "swr";
import { useState } from "react";

const fetcher = (url: string) => fetch(url).then(r => r.json());

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/leads":     "Leads",
  "/pipeline":  "Pipeline",
  "/projects":  "Projects",
  "/strategy":  "Strategy",
  "/planner":   "Weekly Planner",
  "/settings":  "Settings",
};

export default function TopBar() {
  const pathname    = usePathname();
  const router      = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [loggingOut, setLoggingOut] = useState(false);

  const { data: leads    = [] } = useSWR<Array<{ stage: string }>>("/api/leads", fetcher, { refreshInterval: 30000 });
  const { data: projects = [] } = useSWR<Array<{ budget: number; status: string }>>("/api/projects", fetcher, { refreshInterval: 30000 });

  const activeLeads  = leads.filter(l => !["client", "lost"].includes(l.stage)).length;
  const totalClients = leads.filter(l => l.stage === "client").length;
  const pipeline     = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const title        = PAGE_TITLES[pathname] || "FreelanceOS";

  const handleLogout = async () => {
    setLoggingOut(true);
    const supabase = createSupabaseBrowser();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>

      <div className="topbar-right">
        {/* Live stats */}
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Users size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              <span style={{ fontWeight: 600, color: "var(--success)" }}>{totalClients}</span>
              <span style={{ color: "var(--text-muted)" }}> clients · </span>
              <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{activeLeads}</span>
              <span style={{ color: "var(--text-muted)" }}> active</span>
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <TrendingUp size={13} color="var(--text-muted)" />
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              <span style={{ fontWeight: 600, color: "var(--accent)" }}>
                ₹{pipeline.toLocaleString("en-IN")}
              </span>
              <span style={{ color: "var(--text-muted)" }}> pipeline</span>
            </span>
          </div>
        </div>

        <div style={{ width: 1, height: 16, background: "var(--border-default)" }} />

        {/* Theme toggle */}
        <button
          className="btn-icon"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
        </button>

        {/* Logout */}
        <button
          className="btn-icon"
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Sign out"
          title="Sign out"
          style={{ color: "var(--text-muted)", opacity: loggingOut ? 0.5 : 1 }}
        >
          <LogOut size={15} strokeWidth={1.8} />
        </button>
      </div>
    </header>
  );
}
