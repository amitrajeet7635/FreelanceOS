"use client";

import useSWR, { mutate } from "swr";
import { todayISO } from "@/lib/utils";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(payload?.error || "Failed to fetch daily logs");
  }
  return res.json();
};

export interface DailyLogEntry {
  id: string;
  user_id: string;
  log_date: string;
  dms: number;
  replies: number;
  leads_qualified: number;
  calls_booked: number;
  clients_closed: number;
  revenue_earned: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export function useDailyLog(date = todayISO()) {
  const key = `/api/daily-logs?date=${date}`;
  const { data, error, isLoading } = useSWR<DailyLogEntry | null>(key, fetcher);

  return {
    log: data,
    isLoading,
    isError: !!error,
  };
}

export function useDailyLogs(days = 30) {
  const key = `/api/daily-logs?days=${days}`;
  const { data, error, isLoading } = useSWR<DailyLogEntry[]>(key, fetcher);

  return {
    logs: data || [],
    isLoading,
    isError: !!error,
  };
}

export async function saveDailyLog(
  date: string,
  payload: Partial<
    Pick<
      DailyLogEntry,
      | "dms"
      | "replies"
      | "leads_qualified"
      | "calls_booked"
      | "clients_closed"
      | "revenue_earned"
      | "note"
    >
  >
) {
  const res = await fetch("/api/daily-logs", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ log_date: date, ...payload }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error || "Failed to save daily log");
  }

  mutate(`/api/daily-logs?date=${date}`);
  mutate((key: string) => key.startsWith("/api/daily-logs?days="), undefined, { revalidate: true });

  return res.json();
}
