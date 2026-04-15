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
  sessionStats: { dms: number; replies: number; leads: number };
  setSessionStats: React.Dispatch<React.SetStateAction<{ dms: number; replies: number; leads: number }>>;
  showSummary: boolean;
  setShowSummary: (v: boolean) => void;
}

const FocusContext = createContext<FocusContextType>({} as any);

export function FocusProvider({ children }: { children: React.ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [isMinimized, setMinimized] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStats, setSessionStats] = useState({ dms: 0, replies: 0, leads: 0 });
  const [showSummary, setShowSummary] = useState(false);

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
    setShowSummary(false);
    setTimeLeft(90 * 60);
    setIsRunning(true);
    setSessionStats({ dms: 0, replies: 0, leads: 0 });
  };

  const endSession = () => {
    setIsActive(false);
    setMinimized(false);
    setIsRunning(false);
    setShowSummary(true);
  };

  return (
    <FocusContext.Provider value={{
      isActive, isMinimized, startSession, endSession, setMinimized, 
      timeLeft, isRunning, setIsRunning, setTimeLeft, sessionStats, setSessionStats,
      showSummary, setShowSummary
    }}>
      {children}
      {(isActive || showSummary) && <GlobalFocusRenderer />}
    </FocusContext.Provider>
  );
}

export const useFocusTimer = () => useContext(FocusContext);

function GlobalFocusRenderer() {
  const { isActive, isMinimized, setMinimized, endSession, timeLeft, isRunning, setIsRunning, sessionStats, setSessionStats, showSummary, setShowSummary } = useFocusTimer();
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
    <>
      {showSummary && (
        <SessionSummary 
          sessionStats={sessionStats}
          onClose={() => setShowSummary(false)}
        />
      )}
      {isActive && (
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
      )}
    </>
  );
}

function SessionSummary({ sessionStats, onClose }: { sessionStats: { dms: number; replies: number; leads: number }, onClose: () => void }) {
  const totalActions = sessionStats.dms + sessionStats.replies + sessionStats.leads;
  const statCards = [
    { label: "DMs", value: sessionStats.dms, color: "#3B82F6" },
    { label: "Replies", value: sessionStats.replies, color: "#10B981" },
    { label: "Leads", value: sessionStats.leads, color: "#F59E0B" },
  ];
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{ 
        position: 'fixed', inset: 0, zIndex: 10000, 
        background: 'rgba(0, 0, 0, 0.6)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24
      }}
      onClick={onClose}
    >
      <motion.div 
        initial={{ scale: 0.92, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: '100%',
          maxWidth: 620,
          background: 'linear-gradient(165deg, rgba(15,23,42,0.95), rgba(2,6,23,0.95))',
          borderRadius: 28,
          padding: 36,
          boxShadow: '0 28px 70px rgba(0,0,0,0.55)',
          border: '1px solid rgba(148,163,184,0.18)',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)'
        }}
      >
        <div style={{ fontSize: 40, fontWeight: 800, color: 'var(--accent)', marginBottom: 12, lineHeight: 1 }}>
          🎯
        </div>
        
        <h2 style={{ fontSize: 40, fontWeight: 800, color: '#E2E8F0', marginBottom: 8, letterSpacing: '-0.02em' }}>
          Session Complete!
        </h2>
        
        <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 28, lineHeight: 1.5, maxWidth: 520, marginInline: 'auto' }}>
          Great work on your focused session! Here's what you accomplished:
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 22 }}>
          {statCards.map(card => (
            <div
              key={card.label}
              style={{
                background: 'rgba(15,23,42,0.7)',
                borderRadius: 14,
                padding: '16px 12px',
                border: '1px solid rgba(148,163,184,0.2)'
              }}
            >
              <div style={{ fontSize: 46, fontWeight: 800, color: card.color, marginBottom: 4, lineHeight: 1 }}>
                {card.value}
              </div>
              <div style={{ fontSize: 12, color: '#94A3B8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'rgba(15,23,42,0.78)', borderRadius: 14, padding: 18, marginBottom: 24, border: '1px solid rgba(148,163,184,0.2)' }}>
          <div style={{ fontSize: 14, color: '#94A3B8', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Total Actions</div>
          <div style={{ fontSize: 52, fontWeight: 800, color: '#E2E8F0', lineHeight: 1 }}>
            {totalActions}
          </div>
        </div>

        <button 
          onClick={onClose}
          className="btn btn-primary"
          style={{ width: '100%', height: 52, fontSize: 16, fontWeight: 700, borderRadius: 12 }}
        >
          Close Summary
        </button>
      </motion.div>
    </motion.div>
  );
}
