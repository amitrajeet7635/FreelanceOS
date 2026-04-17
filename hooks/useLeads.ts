"use client";

import useSWR, { mutate } from "swr";

const fetcher = (url: string) => fetch(url).then(r => r.json());

import { LeadV2Extensions } from "@/lib/types";

export interface Lead extends Partial<LeadV2Extensions> {
  _id: string;
  username: string;
  niche: string;
  followers?: string;
  hasWebsite: "no" | "yes" | "bad";
  notes?: string;
  igLink?: string;
  stage: string;
  dmSentAt?: string;
  stageHistory?: Array<{ stage: string; changedAt: string }>;
  createdAt: string;
  updatedAt: string;
}

export function useLeads(params?: { stage?: string; niche?: string; search?: string; refreshInterval?: number }) {
  const qs = new URLSearchParams();
  if (params?.stage  && params.stage  !== "all") qs.set("stage",  params.stage);
  if (params?.niche  && params.niche  !== "all") qs.set("niche",  params.niche);
  if (params?.search && params.search.trim())    qs.set("search", params.search.trim());

  const key = `/api/leads${qs.toString() ? "?" + qs.toString() : ""}`;
  const { data, error, isLoading } = useSWR<Lead[]>(key, fetcher, {
    refreshInterval: params?.refreshInterval ?? 0,
    revalidateOnFocus: true,
  });

  return {
    leads: data || [],
    isLoading,
    isError: !!error,
    mutate: () => mutate(key),
  };
}

export async function createLead(data: Partial<Lead>) {
  await fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  mutate("/api/leads");
}

export async function updateLead(id: string, data: Partial<Lead>) {
  await fetch(`/api/leads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  mutate("/api/leads");
}

export async function deleteLead(id: string) {
  await fetch(`/api/leads/${id}`, { method: "DELETE" });
  mutate("/api/leads");
}
