"use client";

import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Clock, Flame } from "lucide-react";
import { useFocusTimer } from "@/components/features/FocusContext";
import { useLeads } from "@/hooks/useLeads";
import { useProjects } from "@/hooks/useProjects";
import { useDaily, useSettings } from "@/hooks/useDaily";
import { todayISO, weekStartISO, pct } from "@/lib/utils";
import { DEFAULT_GOALS } from "@/lib/constants";

const SCHEDULE = [
  { day: "Mon", focus: "Lead Discovery", dms: 0, tasks: ["Build list of 30 target accounts", "Like 3 posts on each account", "Log all accounts with notes"], peak: false },
  { day: "Tue", focus: "Warm Up",        dms: 0, tasks: ["Leave genuine comments on Monday batch", "Find 30 new accounts for tomorrow", "Like posts on new batch"], peak: false },
  { day: "Wed", focus: "First DMs",      dms: 30, tasks: ["Send opening DMs to Monday batch (30)", "Like 30 more new accounts", "Log all DMs with timestamp"], peak: true  },
  { day: "Thu", focus: "More DMs",       dms: 30, tasks: ["DM Tuesday batch (30 messages)", "Follow-up on non-replies from Wednesday", "Handle all incoming replies"], peak: true  },
  { day: "Fri", focus: "Follow-ups",     dms: 20, tasks: ["Send follow-up DMs (Day 3 sequence)", "Book discovery calls with interested leads", "Convert warm convos to calls"], peak: false },
  { day: "Sat", focus: "Close & Review", dms: 0,  tasks: ["Send closing DMs (Day 7) to non-replies", "Review week metrics against goals", "Prepare next week's lead list"], peak: false },
  { day: "Sun", focus: "Content Day",    dms: 0,  tasks: ["Post 1 portfolio reel (before/after)", "Engage on past posts to boost visibility", "Outline strategy for upcoming week"], peak: false },
];

const WEEKLY_TARGETS = [
  { text: "110+ DMs sent total across the week", color: "#10b981" },
  { text: "~18 replies received (17% rate)", color: "#8b5cf6" },
  { text: "6–8 qualified leads via conversation", color: "#f59e0b" },
  { text: "2+ clients locked in by Friday", color: "#3b82f6" },
  { text: "1 portfolio reel posted to Instagram", color: "#f97316" },
];

const SAFETY_RULES = [
  "Keep DMs under 50/hour. Spread them across morning, afternoon, and evening sessions.",
  "Never send the exact same message to multiple accounts in the same session — paraphrase.",
  "Don't DM accounts you've never liked or interacted with (that's what the 3-day warm-up prevents).",
  "If you get an 'action blocked' warning, stop and wait 24 hours before continuing.",
  "Use the same account consistently — switching or logging in/out frequently triggers flags.",
];

export default function PlannerPage() {
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long" }).slice(0, 3);
  const { startSession } = useFocusTimer();

  const { entries } = useDaily();
  const { settings } = useSettings();
  const goals = settings || DEFAULT_GOALS;

  const ws = weekStartISO();
  const weekEntries = entries.filter(e => e.date >= ws);
  const wkDMs = weekEntries.reduce((s, e) => s + (e.dms || 0), 0);
  const goalDMs = goals.weeklyDMs;
  const progress = pct(wkDMs, goalDMs);

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
        <div>
          <div className="page-title">Weekly Planner</div>
          <div className="page-sub">7-day execution schedule · 90 mins/day · {goalDMs}+ DMs/week</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <button className="btn btn-primary" onClick={startSession} style={{ background: '#f97316' }}>
            <Flame size={14} /> Start Focus Session
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 100, height: 6, borderRadius: 3, background: 'var(--border-subtle)', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: '#10b981' }} />
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{wkDMs} / {goalDMs} DMs</span>
          </div>
        </div>
      </div>

      {/* Week strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, marginBottom: 20 }}>
        {SCHEDULE.map((s, i) => {
          const isToday = s.day === today;
          return (
            <motion.div
              key={s.day}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              style={{
                background: isToday ? "var(--accent)" : s.peak ? "var(--accent-subtle)" : "var(--bg-surface)",
                border: `1px solid ${isToday ? "var(--accent)" : s.peak ? "var(--accent-glow)" : "var(--border-subtle)"}`,
                borderRadius: 12,
                padding: "12px 8px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: isToday ? "var(--text-inverse)" : s.peak ? "var(--accent)" : "var(--text-muted)", marginBottom: 4, opacity: isToday ? 0.7 : 1 }}>
                {s.day}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: isToday ? "var(--text-inverse)" : "var(--text-primary)", marginBottom: 4, lineHeight: 1.2 }}>
                {s.focus}
              </div>
              {s.dms > 0 ? (
                <div style={{ fontSize: 20, fontWeight: 800, color: isToday ? "var(--text-inverse)" : "var(--accent)", lineHeight: 1 }}>
                  {s.dms}<span style={{ fontSize: 9, fontWeight: 400, color: isToday ? "var(--text-inverse)" : "var(--text-muted)", marginLeft: 2, opacity: isToday ? 0.8 : 1 }}>DMs</span>
                </div>
              ) : (
                <div style={{ fontSize: 10, color: isToday ? "var(--text-inverse)" : "var(--text-muted)", opacity: isToday ? 0.7 : 1 }}>No DMs</div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Day detail cards */}
      <div className="grid-2" style={{ marginBottom: 14 }}>
        {SCHEDULE.map((s, i) => (
          <motion.div
            key={s.day}
            className="card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{s.day}</span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>—</span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>{s.focus}</span>
              {s.dms > 0 && (
                <span className="badge" style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--accent-glow)", marginLeft: "auto" }}>
                  {s.dms} DMs
                </span>
              )}
            </div>
            {s.tasks.map((t, j) => (
              <div key={j} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "flex-start" }}>
                <CheckCircle size={13} color="var(--success)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{t}</span>
              </div>
            ))}
          </motion.div>
        ))}

        {/* Weekly targets */}
        <div className="card" style={{ background: "var(--bg-overlay)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Clock size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Weekly Targets</span>
          </div>
          {WEEKLY_TARGETS.map((g, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "flex-start" }}>
              <div className="dot" style={{ background: g.color, marginTop: 5 }} />
              <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.5 }}>{g.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instagram safety rules */}
      <div className="card" style={{ borderLeft: "3px solid var(--warning)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
          <AlertTriangle size={15} color="var(--warning)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Instagram Safety Rules — Avoid Action Blocks</span>
        </div>
        {SAFETY_RULES.map((r, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
            <AlertTriangle size={13} color="var(--warning)" style={{ flexShrink: 0, marginTop: 2 }} />
            <span style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6 }}>{r}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
