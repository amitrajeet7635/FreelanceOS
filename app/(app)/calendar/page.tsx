"use client";

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { CalendarGrid } from '@/components/features/CalendarGrid';
import { useLeads } from '@/hooks/useLeads';
import { useProjects } from '@/hooks/useProjects';
import { daysUntil, formatCurrency, formatDate } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CalendarPage() {
  const [tab, setTab] = useState<'outreach' | 'deadlines' | 'revenue'>('outreach');
  const { data: dbEvents, mutate } = useSWR('/api/calendar', fetcher);
  const { leads } = useLeads();
  const { projects, isLoading: projectsLoading } = useProjects();

  const events = [
    ...(dbEvents || []),
    ...leads.filter(l => l.follow_up_due).map(l => ({
      id: `lead-${l._id}`,
      title: `Follow up: @${l.username}`,
      event_date: l.follow_up_due,
      type: 'followup',
      priority: l.priority
    }))
  ];

  const handleAddEvent = async (date: Date) => {
    const title = prompt("Event title:");
    if (!title) return;
    await fetch('/api/calendar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, event_date: date.toISOString().split('T')[0], type: 'custom' })
    });
    mutate();
  };

  const deadlinesData = useMemo(() => {
    const withDeadlines = projects
      .filter(p => p.deadline)
      .map(p => {
        const dueInDays = daysUntil(p.deadline!);
        return { ...p, dueInDays };
      })
      .sort((a, b) => a.dueInDays - b.dueInDays);

    return {
      overdue: withDeadlines.filter(p => p.dueInDays < 0 && p.status !== 'paid'),
      upcoming: withDeadlines.filter(p => p.dueInDays >= 0 && p.status !== 'paid'),
      completed: withDeadlines.filter(p => p.status === 'paid'),
    };
  }, [projects]);

  const revenueTimeline = useMemo(() => {
    const monthlyMap = new Map<string, { monthKey: string; monthLabel: string; expected: number; realized: number }>();

    const getMonthKey = (isoDate: string) => format(parseISO(isoDate), 'yyyy-MM');
    const getMonthLabel = (isoDate: string) => format(parseISO(isoDate), 'MMM yyyy');

    projects.forEach(project => {
      const sourceDate = project.deadline || project.updatedAt || project.createdAt;
      const monthKey = getMonthKey(sourceDate);
      const monthLabel = getMonthLabel(sourceDate);

      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, { monthKey, monthLabel, expected: 0, realized: 0 });
      }

      const bucket = monthlyMap.get(monthKey)!;
      const budget = project.budget || 0;

      if (project.status === 'paid') bucket.realized += budget;
      else bucket.expected += budget;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [projects]);

  return (
    <div style={{ padding: '24px 0' }}>
      <h1 className="page-title" style={{ marginBottom: 24 }}>Calendar</h1>
      
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        {(['outreach', 'deadlines', 'revenue'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 4px', background: 'none', border: 'none', outline: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid var(--text-primary)' : '2px solid transparent'
            }}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={tab}>
        {tab === 'outreach' && (
          <CalendarGrid events={events || []} onAddEvent={handleAddEvent} />
        )}
        {tab === 'deadlines' && (
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Upcoming Deadlines</h3>
            {projectsLoading ? (
              <p className="empty-state-sub" style={{ textAlign: 'left' }}>Loading deadlines...</p>
            ) : deadlinesData.overdue.length === 0 && deadlinesData.upcoming.length === 0 && deadlinesData.completed.length === 0 ? (
              <p className="empty-state-sub" style={{ textAlign: 'left' }}>No project deadlines found yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {deadlinesData.overdue.length > 0 && (
                  <div>
                    <div className="section-label" style={{ color: 'var(--danger)', marginBottom: 8 }}>Overdue</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {deadlinesData.overdue.map(p => (
                        <div key={p._id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(229,62,62,0.3)', background: 'rgba(229,62,62,0.08)', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.client}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.service} • Due {formatDate(p.deadline!)}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--danger)' }}>{Math.abs(p.dueInDays)}d overdue</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {deadlinesData.upcoming.length > 0 && (
                  <div>
                    <div className="section-label" style={{ marginBottom: 8 }}>Upcoming</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {deadlinesData.upcoming.slice(0, 12).map(p => (
                        <div key={p._id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border-subtle)', background: 'var(--bg-overlay)', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.client}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.service} • Due {formatDate(p.deadline!)}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: p.dueInDays <= 3 ? 'var(--warning)' : 'var(--text-secondary)' }}>
                            {p.dueInDays === 0 ? 'Due today' : `${p.dueInDays}d left`}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {deadlinesData.completed.length > 0 && (
                  <div>
                    <div className="section-label" style={{ color: 'var(--success)', marginBottom: 8 }}>Completed / Paid</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {deadlinesData.completed.slice(0, 6).map(p => (
                        <div key={p._id} style={{ padding: '10px 12px', borderRadius: 10, border: '1px solid rgba(56,161,105,0.25)', background: 'rgba(56,161,105,0.08)', display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.client}</div>
                            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.service}</div>
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(p.budget || 0)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        {tab === 'revenue' && (
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Revenue Timeline</h3>
            {projectsLoading ? (
              <p className="empty-state-sub" style={{ textAlign: 'left' }}>Loading revenue timeline...</p>
            ) : revenueTimeline.length === 0 ? (
              <p className="empty-state-sub" style={{ textAlign: 'left' }}>No project revenue data available yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {revenueTimeline.map(row => {
                  const total = row.expected + row.realized;
                  const realizedPct = total > 0 ? Math.round((row.realized / total) * 100) : 0;
                  return (
                    <div key={row.monthKey} style={{ border: '1px solid var(--border-subtle)', borderRadius: 10, padding: 12, background: 'var(--bg-overlay)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, gap: 10, flexWrap: 'wrap' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{row.monthLabel}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                          Realized {formatCurrency(row.realized)} • Expected {formatCurrency(row.expected)}
                        </div>
                      </div>
                      <div style={{ height: 8, borderRadius: 99, background: 'var(--bg-base)', overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
                        <div style={{ width: `${realizedPct}%`, height: '100%', background: 'linear-gradient(90deg, rgba(56,161,105,0.9), rgba(56,161,105,0.55))' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
