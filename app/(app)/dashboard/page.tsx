"use client";

import { motion } from "framer-motion";
import { useLeads } from "@/hooks/useLeads";
import { useProjects } from "@/hooks/useProjects";
import { useDaily, useSettings, useNotes, bumpDaily, setDaily, saveNotes } from "@/hooks/useDaily";
import { todayISO, weekStartISO, formatCurrency, pct } from "@/lib/utils";
import { STAGES, DEFAULT_GOALS } from "@/lib/constants";
import {
  Send, MessageSquare, Users, Briefcase,
  Plus, Minus, RotateCcw, TrendingUp, BarChart2,
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";

// ── Animated counter ──────────────────────────────────────────────────────────
function AnimCounter({ value, color }: { value: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplayed(0); return; }
    const step = Math.ceil(end / 24);
    const timer = setInterval(() => {
      start = Math.min(start + step, end);
      setDisplayed(start);
      if (start >= end) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span style={{ color }}>{displayed}</span>;
}

// ── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({
  label, value, goal, color, icon: Icon, delay = 0,
}: {
  label: string; value: number; goal: number; color: string;
  icon: React.ElementType; delay?: number;
}) {
  const progress = pct(value, goal);
  return (
    <motion.div
      className="metric-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="metric-label">{label}</span>
        <Icon size={15} color="var(--text-muted)" strokeWidth={1.8} />
      </div>
      <div className="metric-value">
        <AnimCounter value={value} color={color} />
      </div>
      <div className="progress-track">
        <motion.div
          className="progress-bar"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ delay: delay + 0.2, duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
        />
      </div>
      <div className="metric-goal">Goal: {goal} · {progress}% complete</div>
    </motion.div>
  );
}

// ── Quick Notes ───────────────────────────────────────────────────────────────
function QuickNotes() {
  const { data } = useNotes();
  const [content, setContent] = useState(data?.content || "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (data?.content !== undefined) setContent(data.content);
  }, [data?.content]);

  const handleChange = useCallback((v: string) => {
    setContent(v);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => saveNotes(v), 800);
  }, []);

  return (
    <div className="card" style={{ marginTop: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
        Quick Notes
      </div>
      <textarea
        className="form-control"
        value={content}
        onChange={e => handleChange(e.target.value)}
        placeholder="Jot observations, follow-up reminders, ideas..."
        style={{ minHeight: 90 }}
      />
    </div>
  );
}

// ── Daily Tracker ─────────────────────────────────────────────────────────────
function DailyTracker({ goals }: { goals: typeof DEFAULT_GOALS }) {
  const { entries } = useDaily();
  const today = todayISO();
  const todayEntry = entries.find(e => e.date === today);

  const items = [
    { key: "dms",     label: "DMs Sent",          target: goals.dailyDMs,     color: "#10b981", icon: Send          },
    { key: "replies", label: "Replies Received",   target: goals.dailyReplies, color: "#8b5cf6", icon: MessageSquare },
    { key: "leads",   label: "Leads Qualified",    target: goals.dailyLeads,   color: "#f59e0b", icon: Users         },
    { key: "calls",   label: "Calls Booked",       target: goals.dailyCalls,   color: "#3b82f6", icon: Briefcase     },
  ] as const;

  const handleBump = (field: string) => bumpDaily(today, field);
  const handleReset = () => {
    ["dms","replies","leads","calls"].forEach(f => setDaily(today, f, 0));
  };

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Today&apos;s Tracker</div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })}
          </span>
          <button className="btn btn-sm btn-ghost" onClick={handleReset} title="Reset today">
            <RotateCcw size={12} /> Reset
          </button>
        </div>
      </div>

      {items.map(({ key, label, target, color, icon: Icon }) => {
        const val = (todayEntry as Record<string, number> | undefined)?.[key] || 0;
        const p = pct(val, target);
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <Icon size={14} color={color} strokeWidth={2} style={{ flexShrink: 0 }} />
            <div style={{ width: 140, fontSize: 12.5, color: "var(--text-secondary)", flexShrink: 0 }}>{label}</div>
            <div style={{ flex: 1 }}>
              <div className="progress-track">
                <motion.div
                  className="progress-bar"
                  style={{ background: color }}
                  animate={{ width: `${p}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
            <span style={{ fontSize: 12, color: "var(--text-muted)", minWidth: 36, textAlign: "right" }}>{val}/{target}</span>
            <div style={{ display: "flex", gap: 2 }}>
              <button
                className="btn-icon"
                style={{ width: 22, height: 22, borderRadius: 6 }}
                onClick={() => setDaily(today, key, Math.max(0, val - 1))}
              >
                <Minus size={11} />
              </button>
              <motion.button
                whileTap={{ scale: 0.88 }}
                style={{
                  width: 24, height: 24, borderRadius: 6, border: "none",
                  background: color, color: "#fff", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
                onClick={() => handleBump(key)}
              >
                <Plus size={12} />
              </motion.button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Pipeline Overview bar chart ───────────────────────────────────────────────
function PipelineOverview({ onStageClick }: { onStageClick: (stage: string) => void }) {
  const { leads } = useLeads();
  const maxCount = Math.max(1, ...STAGES.map(s => leads.filter(l => l.stage === s.id).length));

  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
        <BarChart2 size={15} color="var(--text-muted)" />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>Pipeline Overview</span>
      </div>
      {STAGES.filter(s => s.id !== "lost").map((s, i) => {
        const cnt = leads.filter(l => l.stage === s.id).length;
        const w = Math.max(4, Math.round((cnt / maxCount) * 100));
        return (
          <div
            key={s.id}
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, cursor: "pointer" }}
            onClick={() => onStageClick(s.id)}
          >
            <div style={{ width: 80, fontSize: 11, color: "var(--text-muted)", textAlign: "right", flexShrink: 0 }}>{s.label}</div>
            <div style={{ flex: 1, height: 22, background: "var(--bg-overlay)", borderRadius: 5, overflow: "hidden" }}>
              {cnt > 0 && (
                <motion.div
                  style={{ height: "100%", background: s.bg, borderRadius: 5, display: "flex", alignItems: "center", paddingLeft: 8 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${w}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: [0.4,0,0.2,1] }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{cnt}</span>
                </motion.div>
              )}
            </div>
            <span style={{ fontSize: 11, color: "var(--text-muted)", minWidth: 16, textAlign: "right" }}>{cnt}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dashboard Page ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const { leads } = useLeads();
  const { projects } = useProjects();
  const { entries } = useDaily();
  const { settings } = useSettings();
  const goals = settings || DEFAULT_GOALS;

  const ws = weekStartISO();
  const today = todayISO();
  const todayEntry = entries.find(e => e.date === today);

  const weekEntries = entries.filter(e => e.date >= ws);
  const wkDMs      = weekEntries.reduce((s, e) => s + (e.dms || 0), 0);
  const wkReplies  = weekEntries.reduce((s, e) => s + (e.replies || 0), 0);
  const wkLeads    = leads.filter(l => l.createdAt >= ws).length;
  const wkClients  = leads.filter(l => l.stage === "client" && l.updatedAt >= ws).length;

  const earned     = projects.filter(p => p.status === "paid").reduce((s, p) => s + (p.budget || 0), 0);
  const pipeline   = projects.filter(p => p.status !== "paid").reduce((s, p) => s + (p.budget || 0), 0);

  const metrics = [
    { label: "DMs Sent",    value: wkDMs,     goal: goals.weeklyDMs,     color: "#10b981", icon: Send          },
    { label: "Replies",     value: wkReplies, goal: goals.weeklyReplies, color: "#8b5cf6", icon: MessageSquare },
    { label: "New Leads",   value: wkLeads,   goal: goals.weeklyLeads,   color: "#f59e0b", icon: Users         },
    { label: "Clients Won", value: wkClients, goal: goals.weeklyClients, color: "#3b82f6", icon: Briefcase     },
  ];

  return (
    <div style={{ paddingTop: 24 }}>
      {/* Weekly summary sub label */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <div className="page-title">This Week&apos;s Performance</div>
          <div className="page-sub">Week of {new Date(ws).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Total Earned</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--success)" }}>{formatCurrency(earned)}</div>
          </div>
          <div style={{ width: 1, background: "var(--border-subtle)" }} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Active Pipeline</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "var(--accent)" }}>{formatCurrency(pipeline)}</div>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        {metrics.map((m, i) => (
          <MetricCard key={m.label} {...m} delay={i * 0.08} />
        ))}
      </div>

      {/* Tracker + Pipeline */}
      <div className="grid-2" style={{ marginBottom: 0 }}>
        <DailyTracker goals={goals} />
        <PipelineOverview onStageClick={() => {}} />
      </div>

      {/* Quick notes */}
      <QuickNotes />

      {/* Summary row */}
      <motion.div
        className="card"
        style={{ marginTop: 14, display: "flex", gap: 20, flexWrap: "wrap" }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <TrendingUp size={15} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ flex: 1, fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.7 }}>
          <strong style={{ color: "var(--text-primary)" }}>Outreach math: </strong>
          Send 15 personalized DMs/day × 7 days = 105 total → ~18 replies (17%) → ~8 qualified leads → 2–3 clients.
          You&apos;ve sent <strong style={{ color: "var(--success)" }}>{wkDMs}</strong> DMs this week — {Math.round((wkDMs/goals.weeklyDMs)*100)}% of goal.
          {todayEntry && todayEntry.dms > 0 && ` Today: ${todayEntry.dms} DMs sent.`}
        </div>
      </motion.div>
    </div>
  );
}
