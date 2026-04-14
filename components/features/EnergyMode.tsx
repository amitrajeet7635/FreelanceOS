import { useState } from 'react';
import { motion } from 'framer-motion';
import { ActionQueue } from './ActionQueue';
import { StreakEngine } from './StreakEngine';
import { Lead } from '@/hooks/useLeads';
import { Project } from '@/hooks/useProjects';
import { DailyLog } from '@/lib/types';
import { X, Play, Pause, Square } from 'lucide-react';
import { todayISO } from '@/lib/utils';
import { mutate } from 'swr';

export function EnergyMode({
  onClose,
  leads,
  projects,
  dailyLog,
  timeLeft,
  isRunning,
  onToggleRunning,
  onEndSession,
  sessionStats,
  setSessionStats,
}: {
  onClose: () => void;
  leads: Lead[];
  projects: Project[];
  dailyLog?: DailyLog;
  timeLeft: number;
  isRunning: boolean;
  onToggleRunning: () => void;
  onEndSession: () => void;
  sessionStats: { dms: number; replies: number };
  setSessionStats: React.Dispatch<React.SetStateAction<{ dms: number; replies: number }>>;
}) {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  const handleLog = async (field: 'dms' | 'replies') => {
    // update session stats
    setSessionStats(s => ({ ...s, [field]: s[field] + 1 }));

    // POST to /api/daily-logs
    await fetch('/api/daily-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'increment', field })
    });
    mutate('/api/daily-logs?date=' + todayISO());
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{ 
        position: 'fixed', inset: 0, zIndex: 9999, 
        background: 'rgba(0, 0, 0, 0.55)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24
      }}
    >
      <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button className="btn btn-secondary" onClick={onToggleRunning} style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
          {isRunning ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}
        </button>
        <button className="btn btn-secondary" onClick={onEndSession} style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
          <Square size={14} /> End Session
        </button>
        <button className="btn-icon" onClick={onClose} style={{ background: 'var(--bg)', border: '1px solid var(--border-subtle)' }}>
          <X size={20} />
        </button>
      </div>

      <motion.div 
        initial={{ y: 20, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        style={{ 
          width: '100%', maxWidth: 840, 
          background: 'var(--bg)', 
          borderRadius: 24, 
          padding: 48, 
          boxShadow: '0 32px 64px rgba(0,0,0,0.4)',
          border: '1px solid var(--border-subtle)',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 96, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {timeStr}
          </div>
          <div style={{ fontSize: 16, color: 'var(--text-muted)', marginTop: 8 }}>Deep Focus Mode</div>
        </div>

        <div className="grid-2" style={{ gap: 24 }}>
          <div>
            <ActionQueue leads={leads} projects={projects} dailyLog={dailyLog} />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick Log</h3>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleLog('dms')}>+ DM</button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => handleLog('replies')}>+ Reply</button>
                <button className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
                  onClose();
                  window.location.href = '/leads?new=true';
                }}>+ Lead</button>
              </div>
            </div>

            {dailyLog && (
              <StreakEngine dailyLogs={[dailyLog]} streakMinDMs={10} todayDMs={dailyLog.dms + sessionStats.dms} />
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
