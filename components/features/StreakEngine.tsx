import { motion } from 'framer-motion';
import { useStreak } from '@/hooks/useStreak';
import { DailyLog } from '@/lib/types';
import { Flame } from 'lucide-react';

export function StreakEngine({ dailyLogs, streakMinDMs = 10, todayDMs = 0 }: { dailyLogs: DailyLog[], streakMinDMs?: number, todayDMs?: number }) {
  const streak = useStreak(dailyLogs, streakMinDMs);
  
  const goal = streak.inRecoveryMode ? streak.recoveryGoal : streakMinDMs;
  const progress = Math.min((todayDMs / goal) * 100, 100);
  const isGoalMet = todayDMs >= goal;

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
