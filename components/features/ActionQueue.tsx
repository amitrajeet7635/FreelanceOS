import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useActionQueue } from '@/hooks/useActionQueue';
import { Lead } from '@/hooks/useLeads';
import { Project } from '@/hooks/useProjects';
import { DailyLog } from '@/lib/types';
import { Check, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function ActionQueue({ leads, projects, dailyLog }: { leads: Lead[], projects: Project[], dailyLog?: DailyLog }) {
  const allItems = useActionQueue(leads, projects, dailyLog);
  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Clear dismissed keys on mount if this is a new session? The prompt asks for React state to track dismisses for the current session.
  // Using pure state covers that.

  const items = allItems.filter(item => !dismissedKeys.has(item.doneKey));

  if (items.length === 0) {
    return (
      <div className="card" style={{ marginBottom: 24, textAlign: 'center', padding: '24px' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>All clear! No actions needed right now 🎉</p>
      </div>
    );
  }

  return (
    <div className="card" style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: 'var(--text-primary)' }}>Today's Action Queue</h3>
      <AnimatePresence>
        {items.map(item => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-subtle)', overflow: 'hidden' }}
          >
            <button
              className="btn-icon"
              style={{ width: 24, height: 24, borderRadius: '50%', border: '1px solid var(--border-subtle)' }}
              onClick={() => setDismissedKeys(prev => new Set(prev).add(item.doneKey))}
            >
              <Check size={12} color="var(--text-muted)" />
            </button>
            <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => {
              if (item.linkedLeadId) router.push('/leads');
              else if (item.linkedProjectId) router.push('/projects');
            }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{item.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.description}</div>
            </div>
            {item.urgency === 'critical' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--danger)' }} />}
            <button className="btn-icon" onClick={() => {
              if (item.linkedLeadId) router.push('/leads');
              else if (item.linkedProjectId) router.push('/projects');
            }}>
              <ArrowRight size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
