import { motion } from 'framer-motion';
import { useStreak } from '@/hooks/useStreak';
import { DailyLog } from '@/lib/types';
import { Flame } from 'lucide-react';

export function StreakEngine({
  dailyLogs,
  streakMinDMs = 10,
  todayDMs = 0,
  compact = false,
}: {
  dailyLogs: DailyLog[];
  streakMinDMs?: number;
  todayDMs?: number;
  compact?: boolean;
}) {
  const streak = useStreak(dailyLogs, streakMinDMs);
  
  const goal = streak.inRecoveryMode ? streak.recoveryGoal : streakMinDMs;
  const progress = Math.min((todayDMs / goal) * 100, 100);
  const isGoalMet = todayDMs >= goal;

  if (compact) {
    return (
      <div
        className="card"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '14px 14px',
          minHeight: 76,
          minWidth: 260,
          maxWidth: 320,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 32,
            borderRadius: '50%',
            background: streak.currentStreak > 0 ? 'rgba(249,115,22,0.12)' : 'var(--bg-overlay)',
            flexShrink: 0,
          }}
        >
          <Flame size={16} color={streak.currentStreak > 0 ? '#f97316' : 'var(--text-muted)'} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              {streak.currentStreak} day streak
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {todayDMs}/{goal}
            </div>
          </div>
          <div style={{ marginTop: 6, height: 5, borderRadius: 999, background: 'var(--border-subtle)', overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.45 }}
              style={{ height: '100%', background: '#f97316' }}
            />
          </div>
          {streak.inRecoveryMode && !isGoalMet && (
            <div style={{ marginTop: 5, fontSize: 10.5, color: '#f59e0b', fontWeight: 600 }}>
              Recovery goal: {goal}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: streak.currentStreak > 0 ? 'rgba(249,115,22,0.1)' : 'var(--bg-overlay)' }}>
        <Flame size={20} color={streak.currentStreak > 0 ? '#f97316' : 'var(--text-muted)'} />
      </div>
      
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
            {streak.currentStreak} day streak
          </div>
          {streak.inRecoveryMode && !isGoalMet && (
            <div style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', fontWeight: 600 }}>
              Recovery Mode — Goal: {goal}
            </div>
          )}
        </div>
        
        <div style={{ height: 4, borderRadius: 2, background: 'var(--border-subtle)', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
            style={{ height: '100%', background: '#f97316' }}
          />
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: 'var(--text-muted)', textAlign: 'right' }}>
          {todayDMs} / {goal} DMs today
        </div>
      </div>
    </div>
  );
}
