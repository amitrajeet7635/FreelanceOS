import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { mapSettings } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase-server";

const DEFAULTS = {
  id:            "singleton",
  weekly_dms:     105,
  weekly_replies: 18,
  weekly_leads:   50,
  weekly_clients: 2,
  daily_dms:      15,
  daily_replies:  3,
  daily_leads:    2,
  daily_calls:    1,
  currency:       "₹",
};

export async function GET() {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", "singleton")
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(mapSettings(data ?? DEFAULTS));
}

export async function PUT(req: Request) {
  const body = await req.json();

  // Build snake_case update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: Record<string, any> = { id: "singleton", updated_at: new Date().toISOString() };

  if (body.weeklyDMs     !== undefined) payload.weekly_dms     = body.weeklyDMs;
  if (body.weeklyReplies !== undefined) payload.weekly_replies = body.weeklyReplies;
  if (body.weeklyLeads   !== undefined) payload.weekly_leads   = body.weeklyLeads;
  if (body.weeklyClients !== undefined) payload.weekly_clients = body.weeklyClients;
  if (body.dailyDMs      !== undefined) payload.daily_dms      = body.dailyDMs;
  if (body.dailyReplies  !== undefined) payload.daily_replies  = body.dailyReplies;
  if (body.dailyLeads    !== undefined) payload.daily_leads    = body.dailyLeads;
  if (body.dailyCalls    !== undefined) payload.daily_calls    = body.dailyCalls;
  if (body.currency      !== undefined) payload.currency       = body.currency;

  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("settings")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapSettings(data));
}
