import { useMemo } from 'react';
import { DailyLog } from '@/lib/types';

export function useStreak(dailyLogs: DailyLog[], streakMinDMs: number) {
  return useMemo(() => {
    // Sort descending by date
    const sorted = [...dailyLogs].sort((a, b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());
    
    let currentStreak = 0;
    let longestStreak = 0;
    let inRecoveryMode = false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const todayLog = sorted.find(l => l.log_date === todayStr);
    const yesterdayLog = sorted.find(l => l.log_date === yesterdayStr);

    let tempStreak = 0;
    for (const log of sorted.slice().reverse()) {
      if (log.dms >= streakMinDMs) {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Now calculate current consecutive days backward from today
    let checkDate = new Date(today);
    let keepChecking = true;
    while (keepChecking) {
      const dateStr = checkDate.toISOString().split('T')[0];
      const log = sorted.find(l => l.log_date === dateStr);
      
      if (log && log.dms >= streakMinDMs) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateStr === todayStr) {
        // tolerate today not being hit yet
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        keepChecking = false;
      }
    }

    if (currentStreak === 0 && yesterdayLog && yesterdayLog.dms < streakMinDMs) {
      // Check if day before yesterday had a streak
      const dayBefore = new Date(yesterday);
      dayBefore.setDate(dayBefore.getDate() - 1);
      const dbStr = dayBefore.toISOString().split('T')[0];
      const dbLog = sorted.find(l => l.log_date === dbStr);
      if (dbLog && dbLog.dms >= streakMinDMs) {
         inRecoveryMode = true;
      }
    }

    return {
      currentStreak,
      longestStreak,
      isActiveToday: !!(todayLog && todayLog.dms >= streakMinDMs),
      inRecoveryMode,
      recoveryGoal: Math.ceil(streakMinDMs * 0.4)
    };
  }, [dailyLogs, streakMinDMs]);
}
