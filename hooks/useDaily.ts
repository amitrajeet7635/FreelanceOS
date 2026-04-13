"use client";

import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface DailyEntry {
  _id: string;
  date: string;
  dms: number;
  replies: number;
  leads: number;
  calls: number;
}

export interface Settings {
  _id: string;
  weeklyDMs: number;
  weeklyReplies: number;
  weeklyLeads: number;
  weeklyClients: number;
  dailyDMs: number;
  dailyReplies: number;
  dailyLeads: number;
  dailyCalls: number;
  currency: string;
}

export function useDaily() {
  const { data, error, isLoading } = useSWR<DailyEntry[]>("/api/daily", fetcher);
  return {
    entries: data || [],
    isLoading,
    isError: !!error,
  };
}

export async function bumpDaily(date: string, field: string) {
  await fetch("/api/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, field }),
  });
  mutate("/api/daily");
}

export async function setDaily(date: string, field: string, value: number) {
  await fetch("/api/daily", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ date, field, value }),
  });
  mutate("/api/daily");
}

export function useSettings() {
  const { data, error, isLoading } = useSWR<Settings>("/api/settings", fetcher);
  return {
    settings: data,
    isLoading,
    isError: !!error,
  };
}

export async function saveSettings(data: Partial<Settings>) {
  await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  mutate("/api/settings");
}

export function useNotes() {
  return useSWR<{ content: string }>("/api/notes", fetcher);
}

export async function saveNotes(content: string) {
  await fetch("/api/notes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  mutate("/api/notes");
}
