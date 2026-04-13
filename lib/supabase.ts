import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error(
    "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local"
  );
}

// Singleton client — safe for both server-side (API routes) and client-side
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── Row → camelCase mappers ────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapLead(row: Record<string, any>) {
  return {
    _id:          row.id,
    username:     row.username,
    niche:        row.niche,
    followers:    row.followers ?? undefined,
    hasWebsite:   row.has_website,
    notes:        row.notes ?? undefined,
    igLink:       row.ig_link ?? undefined,
    stage:        row.stage,
    dmSentAt:     row.dm_sent_at ?? undefined,
    stageHistory: (row.stage_history ?? []).map((h: Record<string, string>) => ({
      stage:     h.stage,
      changedAt: h.changed_at,
    })),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapProject(row: Record<string, any>) {
  return {
    _id:       row.id,
    client:    row.client,
    service:   row.service,
    budget:    row.budget ?? 0,
    deadline:  row.deadline ?? undefined,
    status:    row.status,
    notes:     row.notes ?? undefined,
    leadId:    row.lead_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapSettings(row: Record<string, any>) {
  return {
    _id:           row.id,
    weeklyDMs:     row.weekly_dms,
    weeklyReplies: row.weekly_replies,
    weeklyLeads:   row.weekly_leads,
    weeklyClients: row.weekly_clients,
    dailyDMs:      row.daily_dms,
    dailyReplies:  row.daily_replies,
    dailyLeads:    row.daily_leads,
    dailyCalls:    row.daily_calls,
    currency:      row.currency,
  };
}
