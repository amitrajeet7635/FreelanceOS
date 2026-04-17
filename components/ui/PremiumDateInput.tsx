"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

type PremiumDateInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  id?: string;
  variant?: "input" | "compact";
  compactLabel?: string;
  allowClear?: boolean;
};

export function PremiumDateInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  id,
  variant = "input",
  compactLabel = "Pick date",
  allowClear = true,
}: PremiumDateInputProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedDate = value ? parseISO(value) : null;
  const [isOpen, setIsOpen] = useState(false);
  const [viewDate, setViewDate] = useState<Date>(selectedDate ?? new Date());

  const minDate = useMemo(() => (min ? startOfDay(parseISO(min)) : null), [min]);
  const maxDate = useMemo(() => (max ? startOfDay(parseISO(max)) : null), [max]);

  useEffect(() => {
    if (!selectedDate) return;
    setViewDate(selectedDate);
  }, [value]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const isDisabledDay = (date: Date) => {
    const day = startOfDay(date);
    if (minDate && isBefore(day, minDate)) return true;
    if (maxDate && isAfter(day, maxDate)) return true;
    return false;
  };

  const handlePickDate = (date: Date) => {
    if (isDisabledDay(date)) return;
    onChange(format(date, "yyyy-MM-dd"));
    setIsOpen(false);
  };

  const displayLabel = selectedDate
    ? format(selectedDate, "EEE, dd MMM yyyy")
    : placeholder || "Select date";

  const toggleOpen = () => {
    if (!isOpen && selectedDate) setViewDate(selectedDate);
    setIsOpen(prev => !prev);
  };

  return (
    <div ref={rootRef} style={{ position: "relative", width: "100%" }}>
      <button
        id={id}
        type="button"
        onClick={toggleOpen}
        className={variant === "compact" ? "btn btn-sm btn-ghost" : "form-control"}
        style={
          variant === "compact"
            ? {
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                borderRadius: 10,
                border: "1px solid var(--border-default)",
                background: "linear-gradient(180deg, var(--bg-elevated), var(--bg-surface))",
                color: "var(--text-secondary)",
              }
            : {
                width: "100%",
                height: 40,
                borderRadius: 10,
                border: `1px solid ${isOpen ? "var(--accent)" : "var(--border-default)"}`,
                background: "linear-gradient(180deg, var(--bg-elevated), var(--bg-surface))",
                boxShadow: isOpen ? "0 0 0 3px var(--accent-glow)" : "var(--shadow-sm)",
                color: selectedDate ? "var(--text-primary)" : "var(--text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 10px",
                textAlign: "left",
                fontSize: 13.5,
              }
        }
      >
        {variant === "compact" ? (
          <>
            <CalendarDays size={12} />
            {compactLabel}
          </>
        ) : (
          <>
            <span>{displayLabel}</span>
            <CalendarDays size={14} />
          </>
        )}
      </button>

      {isOpen && (
        <div
          style={{
            position: "absolute",
            top: variant === "compact" ? "calc(100% + 8px)" : "calc(100% + 6px)",
            left: 0,
            zIndex: 12000,
            width: 308,
            borderRadius: 16,
            border: "1px solid var(--border-default)",
            background: "linear-gradient(180deg, #15161A 0%, #0F1014 100%)",
            boxShadow: "0 20px 46px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03) inset",
            color: "#EAECEF",
            padding: 12,
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <button
              type="button"
              className="btn-icon"
              onClick={() => setViewDate(prev => subMonths(prev, 1))}
              style={{ color: "#D4D7DE", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
              aria-label="Previous month"
            >
              <ChevronLeft size={14} />
            </button>

            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "0.02em", color: "#F5F7FA" }}>
              {format(viewDate, "MMMM yyyy")}
            </div>

            <button
              type="button"
              className="btn-icon"
              onClick={() => setViewDate(prev => addMonths(prev, 1))}
              style={{ color: "#D4D7DE", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
              aria-label="Next month"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, marginBottom: 6 }}>
            {["S", "M", "T", "W", "T", "F", "S"].map(day => (
              <div key={day} style={{ textAlign: "center", fontSize: 11, color: "#9AA1AE", fontWeight: 600, padding: "4px 0" }}>
                {day}
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
            {days.map(date => {
              const inMonth = isSameMonth(date, viewDate);
              const selected = selectedDate ? isSameDay(date, selectedDate) : false;
              const today = isToday(date);
              const disabled = isDisabledDay(date);

              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  onClick={() => handlePickDate(date)}
                  disabled={disabled}
                  style={{
                    height: 34,
                    borderRadius: 10,
                    border: selected
                      ? "1px solid rgba(255,255,255,0.38)"
                      : today
                        ? "1px solid rgba(255,255,255,0.24)"
                        : "1px solid transparent",
                    background: selected
                      ? "linear-gradient(180deg, rgba(62,66,74,0.96), rgba(36,39,45,0.96))"
                      : "transparent",
                    color: disabled
                      ? "#5E6470"
                      : inMonth
                        ? "#E6EAF1"
                        : "#7B818D",
                    fontSize: 13,
                    fontWeight: selected ? 700 : 500,
                    cursor: disabled ? "not-allowed" : "pointer",
                    transition: "all 0.16s ease",
                  }}
                >
                  {format(date, "d")}
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10 }}>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setIsOpen(false);
              }}
              disabled={!allowClear || !value}
              className="btn btn-ghost btn-sm"
              style={{
                opacity: !allowClear || !value ? 0.45 : 1,
                pointerEvents: !allowClear || !value ? "none" : "auto",
                color: "#A8AFBC",
              }}
            >
              <X size={12} /> Clear
            </button>

            <button
              type="button"
              onClick={() => {
                handlePickDate(new Date());
              }}
              className="btn btn-sm"
              style={{
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.26)",
                background: "rgba(255,255,255,0.08)",
                color: "#E5E7EB",
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
