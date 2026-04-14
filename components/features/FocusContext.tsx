"use client";

import React, { createContext, useContext, useState } from "react";
import { useInterval } from "@/hooks/useInterval";
import { useLeads } from "@/hooks/useLeads";
import { useProjects } from "@/hooks/useProjects";
import { useDaily } from "@/hooks/useDaily";
import { todayISO } from "@/lib/utils";
import { EnergyMode } from "@/components/features/EnergyMode";
import { Play, Pause, Maximize2, Square } from "lucide-react";
import { motion } from "framer-motion";

interface FocusContextType {
  isActive: boolean;
  isMinimized: boolean;
  startSession: () => void;
  endSession: () => void;
  setMinimized: (v: boolean) => void;
  timeLeft: number;
  isRunning: boolean;
  setIsRunning: (v: boolean) => void;
  setTimeLeft: React.Dispatch<React.SetStateAction<number>>;
  sessionStats: { dms: number; replies: number };
  setSessionStats: React.Dispatch<React.SetStateAction<{ dms: number; replies: number }>>;
}

const FocusContext = createContext<FocusContextType>({} as any);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setMinimized] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStats, setSessionStats] = useState({ dms: 0, replies: 0 });

  useInterval(() => {
    if (isRunning && timeLeft > 0) {
      setTimeLeft(t => t - 1);
      if (timeLeft - 1 === 0) {
        setIsRunning(false);
        setMinimized(false);
      }
    }
  }, 1000);

  const startSession = () => {
    if (isActive) {
      setMinimized(false);
      setIsRunning(true);
      return;
    }

    setIsActive(true);
    setMinimized(false);
    setTimeLeft(90 * 60);
    setIsRunning(true);
    setSessionStats({ dms: 0, replies: 0 });
  };

  const endSession = () => {
    setIsActive(false);
    setMinimized(false);
    setIsRunning(false);
  };

  return (
    <FocusContext.Provider value={{
      isActive, isMinimized, startSession, endSession, setMinimized, 
      timeLeft, isRunning, setIsRunning, setTimeLeft, sessionStats, setSessionStats
    }}>
      {children}
      {isActive && <GlobalFocusRenderer />}
    </FocusContext.Provider>
  );
}

export const useFocusTimer = () => useContext(FocusContext);

function GlobalFocusRenderer() {
  const { isMinimized, setMinimized, endSession, timeLeft, isRunning, setIsRunning, sessionStats, setSessionStats } = useFocusTimer();
  const { leads = [] } = useLeads();
  const { projects = [] } = useProjects();
  const { entries = [] } = useDaily();

  const todayIso = todayISO();
  let dailyLog = entries.find(e => e.date === todayIso);
  // Adapt to EnergyMode DailyLog shape
  const adaptedLog = dailyLog ? {
    id: dailyLog.date,
    log_date: dailyLog.date,
    dms: dailyLog.dms || 0,
    replies: dailyLog.replies || 0,
    leads_qualified: dailyLog.leads || 0,
    calls_booked: dailyLog.calls || 0,
    clients_closed: 0,
    revenue_earned: 0,
    user_id: "",
    note: "",
    created_at: dailyLog.date,
    updated_at: dailyLog.date
  } : undefined;

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const timeStr = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

  if (isMinimized) {
    return (
      <motion.div 
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          background: "var(--bg-surface)",
          border: "1px solid var(--accent)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 2px var(--accent-glow)",
          borderRadius: 99,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "8px 16px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: isRunning ? "#E24B4A" : "var(--text-muted)", animation: isRunning ? "pulse 2s infinite" : "none" }} />
          <span style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums", color: "var(--text-primary)" }}>{timeStr}</span>
        </div>
        <div style={{ width: 1, height: 24, background: "var(--border-subtle)" }} />
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn-icon" style={{ padding: 6, color: "var(--text-primary)" }} onClick={() => setIsRunning(!isRunning)}>
            {isRunning ? <Pause size={15} /> : <Play size={15} />}
          </button>
          <button className="btn-icon" style={{ padding: 6, color: "var(--text-primary)" }} onClick={() => setMinimized(false)}>
            <Maximize2 size={15} />
          </button>
          <button className="btn-icon" style={{ padding: 6, color: "var(--danger)" }} onClick={endSession}>
            <Square size={15} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <EnergyMode 
      onClose={() => setMinimized(true)}
      leads={leads}
      projects={projects}
      dailyLog={adaptedLog}
      timeLeft={timeLeft}
      isRunning={isRunning}
      onToggleRunning={() => setIsRunning(!isRunning)}
      onEndSession={endSession}
      sessionStats={sessionStats}
      setSessionStats={setSessionStats}
    />
  );
}
