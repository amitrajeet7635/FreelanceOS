import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { mapLead } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const stage  = searchParams.get("stage");
  const niche  = searchParams.get("niche");
  const search = searchParams.get("search");

  const supabase = createSupabaseServer();
  let query = supabase
    .from("leads")
    .select("*")
    .order("updated_at", { ascending: false });

  if (stage  && stage  !== "all") query = query.eq("stage", stage);
  if (niche  && niche  !== "all") query = query.eq("niche", niche);
  if (search && search.trim()) {
    query = query.or(
      `username.ilike.%${search.trim()}%,notes.ilike.%${search.trim()}%`
    );
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json((data ?? []).map(mapLead));
}

export async function POST(req: Request) {
  const body = await req.json();

  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("leads")
    .insert([{
      username:      body.username?.trim(),
      niche:         body.niche,
      followers:     body.followers || null,
      has_website:   body.hasWebsite || "no",
      notes:         body.notes || null,
      ig_link:       body.igLink || null,
      stage:         body.stage || "found",
      stage_history: [{ stage: body.stage || "found", changed_at: new Date().toISOString() }],
      dm_sent_at:    body.stage === "dm_sent" ? new Date().toISOString() : null,
      priority:      body.priority || null,
      on_bench:      body.on_bench || false,
      follow_up_due: body.follow_up_due || null,
      tags:          body.tags || null,
      ai_score:      body.ai_score || null,
      ai_score_reason: body.ai_score_reason || null,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapLead(data), { status: 201 });
}
