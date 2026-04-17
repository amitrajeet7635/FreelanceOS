"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useInterval } from "@/hooks/useInterval";
import { useLeads } from "@/hooks/useLeads";
import { useProjects } from "@/hooks/useProjects";
import { useDaily } from "@/hooks/useDaily";
import { todayISO } from "@/lib/utils";
import { EnergyMode } from "@/components/features/EnergyMode";
import { Play, Pause, Maximize2, Square, X } from "lucide-react";
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
  const { leads = [] } = useLeads({ refreshInterval: isActive ? 4000 : 0 });
  const { projects = [] } = useProjects();
  const { entries = [] } = useDaily();
  const previousLeadsCountRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      previousLeadsCountRef.current = null;
      return;
    }

    if (previousLeadsCountRef.current === null) {
      previousLeadsCountRef.current = leads.length;
      return;
    }

    const delta = leads.length - previousLeadsCountRef.current;
    if (delta > 0) {
      setSessionStats(prev => ({ ...prev, leads: prev.leads + delta }));
    }

    previousLeadsCountRef.current = leads.length;
  }, [isActive, leads.length, setSessionStats]);

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
    { label: "DMs", value: sessionStats.dms, color: "var(--info)" },
    { label: "Replies", value: sessionStats.replies, color: "var(--success)" },
    { label: "Leads", value: sessionStats.leads, color: "var(--warning)" },
  ];
  
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      style={{ 
        position: 'fixed', inset: 0, zIndex: 10000, 
        background: 'rgba(0, 0, 0, 0.45)', 
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
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
          maxWidth: 680,
          background: 'linear-gradient(180deg, var(--bg-elevated), var(--bg-surface))',
          borderRadius: 24,
          padding: 34,
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border-default)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'var(--accent-subtle)',
            filter: 'blur(24px)',
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            position: 'absolute',
            bottom: -120,
            left: -120,
            width: 220,
            height: 220,
            borderRadius: '50%',
            background: 'var(--bg-overlay)',
            filter: 'blur(22px)',
            pointerEvents: 'none'
          }}
        />

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid var(--border-default)',
            background: 'var(--bg-overlay)',
            color: 'var(--text-secondary)',
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            fontWeight: 700,
            marginBottom: 14
          }}
        >
          Focus Session
        </div>
        
        <h2 style={{ fontSize: 46, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, letterSpacing: '-0.03em', lineHeight: 1.05 }}>
          Session Complete!
        </h2>
        
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 30, lineHeight: 1.6, maxWidth: 540, marginInline: 'auto' }}>
          Solid execution — here’s your focus session performance snapshot.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14, marginBottom: 20 }}>
          {statCards.map(card => (
            <div
              key={card.label}
              style={{
                background: 'var(--bg-overlay)',
                borderRadius: 14,
                padding: '16px 12px 14px',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <div style={{ fontSize: 54, fontWeight: 800, color: card.color, marginBottom: 4, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {card.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-overlay)', borderRadius: 14, padding: 18, marginBottom: 24, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Total Actions</div>
          <div style={{ fontSize: 64, fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>
            {totalActions}
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn"
          style={{
            width: '100%',
            height: 54,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            borderRadius: 12,
            border: '1px solid var(--border-default)',
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            boxShadow: 'var(--shadow-md)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10
          }}
        >
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: '1px solid var(--border-default)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'var(--bg-overlay)'
            }}
          >
            <X size={12} />
          </span>
          Close Focus Summary
        </button>
      </motion.div>
    </motion.div>
  );
}
