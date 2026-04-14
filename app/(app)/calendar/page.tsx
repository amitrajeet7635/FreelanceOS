"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import useSWR from 'swr';
import { CalendarGrid } from '@/components/features/CalendarGrid';
import { useLeads } from '@/hooks/useLeads';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function CalendarPage() {
  const [tab, setTab] = useState<'outreach' | 'deadlines' | 'revenue'>('outreach');
  const { data: dbEvents, mutate } = useSWR('/api/calendar', fetcher);
  const { leads } = useLeads();

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
            <p className="empty-state-sub" style={{ textAlign: 'left' }}>List view goes here.</p>
          </div>
        )}
        {tab === 'revenue' && (
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Revenue Timeline</h3>
            <p className="empty-state-sub" style={{ textAlign: 'left' }}>Revenue expectation timeline based on projects.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
