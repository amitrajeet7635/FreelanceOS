"use client";

import { useMemo, useState } from "react";
import { CalendarDays, Check, Loader2, MessageSquare, Send, TrendingUp, Users, PhoneCall, IndianRupee, Database } from "lucide-react";
import { todayISO, formatDate, formatCurrency } from "@/lib/utils";
import { useDailyLog, useDailyLogs } from "@/hooks/useDailyLogs";

const METRICS = [
  { key: "dms", label: "DM Sent", icon: Send, color: "#10b981" },
  { key: "replies", label: "Reply Sent / Received", icon: MessageSquare, color: "#8b5cf6" },
  { key: "leads_qualified", label: "Leads Added", icon: Users, color: "#f59e0b" },
  { key: "calls_booked", label: "Calls Booked", icon: PhoneCall, color: "#3b82f6" },
  { key: "clients_closed", label: "Clients Replied / Closed", icon: Check, color: "#06b6d4" },
  { key: "revenue_earned", label: "Revenue Earned", icon: IndianRupee, color: "#16a34a" },
] as const;

export default function DailyLogsPage() {
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [weekView, setWeekView] = useState<"this" | "last">("this");

  const { log, isLoading: isLogLoading } = useDailyLog(selectedDate);
  const { logs, isLoading: isListLoading } = useDailyLogs(14);

  const logsMap = useMemo(() => {
    const map = new Map<string, (typeof logs)[number]>();
    logs.forEach(row => map.set(row.log_date, row));
    return map;
  }, [logs]);

  const weeklyRows = useMemo(() => {
    const now = new Date();
    const currentWeekStart = new Date(now);
    currentWeekStart.setHours(0, 0, 0, 0);
    currentWeekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday start

    const weekStart = new Date(currentWeekStart);
    if (weekView === "last") {
      weekStart.setDate(currentWeekStart.getDate() - 7);
    }

    const rows: Array<{
      log_date: string;
      dms: number;
      replies: number;
      leads_qualified: number;
      calls_booked: number;
      clients_closed: number;
      revenue_earned: number;
      id: string;
    }> = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const iso = d.toISOString().split("T")[0];
      const existing = logsMap.get(iso);

      rows.push({
        id: existing?.id || `derived-${iso}`,
        log_date: iso,
        dms: existing?.dms || 0,
        replies: existing?.replies || 0,
        leads_qualified: existing?.leads_qualified || 0,
        calls_booked: existing?.calls_booked || 0,
        clients_closed: existing?.clients_closed || 0,
        revenue_earned: existing?.revenue_earned || 0,
      });
    }

    return rows.sort((a, b) => b.log_date.localeCompare(a.log_date));
  }, [logsMap, weekView]);

  const weekLabel = useMemo(() => {
    const newest = weeklyRows[0]?.log_date;
    const oldest = weeklyRows[weeklyRows.length - 1]?.log_date;
    if (!newest || !oldest) return "";
    return `${formatDate(oldest)} → ${formatDate(newest)}`;
  }, [weeklyRows]);

  const weeklyTotals = useMemo(() => {
    return weeklyRows.reduce(
      (acc, row) => {
        acc.dms += row.dms || 0;
        acc.replies += row.replies || 0;
        acc.leads_qualified += row.leads_qualified || 0;
        acc.calls_booked += row.calls_booked || 0;
        acc.clients_closed += row.clients_closed || 0;
        acc.revenue_earned += row.revenue_earned || 0;
        return acc;
      },
      {
        dms: 0,
        replies: 0,
        leads_qualified: 0,
        calls_booked: 0,
        clients_closed: 0,
        revenue_earned: 0,
      }
    );
  }, [weeklyRows]);

  const totals = useMemo(() => {
    return logs.reduce(
      (acc, row) => {
        acc.dms += row.dms || 0;
        acc.replies += row.replies || 0;
        acc.leads_qualified += row.leads_qualified || 0;
        acc.calls_booked += row.calls_booked || 0;
        acc.clients_closed += row.clients_closed || 0;
        acc.revenue_earned += row.revenue_earned || 0;
        return acc;
      },
      {
        dms: 0,
        replies: 0,
        leads_qualified: 0,
        calls_booked: 0,
        clients_closed: 0,
        revenue_earned: 0,
      }
    );
  }, [logs]);

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
        <div>
          <div className="page-title">Daily Logs</div>
          <div className="page-sub">Auto-tracked from database activity (leads, stages, DMs, replies, and paid projects).</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="badge" style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--border-default)" }}>
            <Database size={11} /> Auto
          </span>
          <CalendarDays size={14} color="var(--text-muted)" />
          <input
            className="form-control"
            style={{ width: 180 }}
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 14, alignItems: "stretch" }}>
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 10 }}>
            Activity on {formatDate(selectedDate)}
          </div>

          {isLogLoading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)" }}>
              <Loader2 size={14} className="spinner" /> Loading...
            </div>
          ) : (
            <div className="grid-2" style={{ gap: 10 }}>
              {METRICS.map(metric => {
                const Icon = metric.icon;
                const value = Number(log?.[metric.key] || 0);
                return (
                  <div key={metric.key} className="metric-card" style={{ padding: 12 }}>
                    <div className="form-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon size={13} color={metric.color} />
                      {metric.label}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 700, color: metric.color }}>
                      {metric.key === "revenue_earned" ? formatCurrency(value) : value}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <TrendingUp size={14} color="var(--text-muted)" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>Last 30 Days Snapshot</span>
          </div>
          <div className="grid-3" style={{ gap: 8 }}>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-label">DM Sent</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#10b981" }}>{totals.dms}</div>
            </div>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-label">Replies</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#8b5cf6" }}>{totals.replies}</div>
            </div>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-label">Leads Added</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#f59e0b" }}>{totals.leads_qualified}</div>
            </div>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-label">Calls</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#3b82f6" }}>{totals.calls_booked}</div>
            </div>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-label">Clients</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#06b6d4" }}>{totals.clients_closed}</div>
            </div>
            <div className="metric-card" style={{ padding: 12 }}>
              <div className="metric-label">Revenue</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>{formatCurrency(totals.revenue_earned)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>
            Weekly Logs
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setWeekView("last")}
              style={weekView === "last" ? { background: "var(--accent-subtle)", color: "var(--accent)", borderColor: "var(--border-strong)" } : {}}
            >
              Last Week
            </button>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setWeekView("this")}
              style={weekView === "this" ? { background: "var(--accent-subtle)", color: "var(--accent)", borderColor: "var(--border-strong)" } : {}}
            >
              This Week
            </button>
          </div>
        </div>

        <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginBottom: 10 }}>
          Viewing {weekView === "this" ? "This Week" : "Last Week"} · {weekLabel || "No week selected"}
        </div>

        <div className="grid-4" style={{ marginBottom: 12 }}>
          {[
            { label: "DM", value: weeklyTotals.dms, color: "#10b981" },
            { label: "Replies", value: weeklyTotals.replies, color: "#8b5cf6" },
            { label: "Leads", value: weeklyTotals.leads_qualified, color: "#f59e0b" },
            { label: "Revenue", value: formatCurrency(weeklyTotals.revenue_earned), color: "#16a34a" },
          ].map(item => (
            <div key={item.label} className="metric-card" style={{ padding: 10 }}>
              <div className="metric-label">{item.label}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          ))}
        </div>

        {isListLoading ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-muted)" }}>
            <Loader2 size={14} className="spinner" /> Loading weekly logs...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ textAlign: "left", color: "var(--text-muted)", borderBottom: "1px solid var(--border-subtle)" }}>
                  <th style={{ padding: "8px 6px" }}>Date</th>
                  <th style={{ padding: "8px 6px" }}>DM</th>
                  <th style={{ padding: "8px 6px" }}>Replies</th>
                  <th style={{ padding: "8px 6px" }}>Leads</th>
                  <th style={{ padding: "8px 6px" }}>Calls</th>
                  <th style={{ padding: "8px 6px" }}>Clients</th>
                  <th style={{ padding: "8px 6px" }}>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {weeklyRows.map(row => (
                  <tr key={`weekly-${row.id}-${row.log_date}`} style={{ borderBottom: "1px solid var(--border-subtle)", color: "var(--text-secondary)" }}>
                    <td style={{ padding: "8px 6px", color: "var(--text-primary)", fontWeight: 600 }}>{formatDate(row.log_date)}</td>
                    <td style={{ padding: "8px 6px" }}>{row.dms || 0}</td>
                    <td style={{ padding: "8px 6px" }}>{row.replies || 0}</td>
                    <td style={{ padding: "8px 6px" }}>{row.leads_qualified || 0}</td>
                    <td style={{ padding: "8px 6px" }}>{row.calls_booked || 0}</td>
                    <td style={{ padding: "8px 6px" }}>{row.clients_closed || 0}</td>
                    <td style={{ padding: "8px 6px", fontWeight: 600 }}>{formatCurrency(row.revenue_earned || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
