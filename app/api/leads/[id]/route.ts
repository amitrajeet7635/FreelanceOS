import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { mapLead } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer();
  const body = await req.json();

  // Build the DB update payload (snake_case)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};

  if (body.username    !== undefined) update.username     = body.username;
  if (body.niche       !== undefined) update.niche        = body.niche;
  if (body.followers   !== undefined) update.followers    = body.followers || null;
  if (body.hasWebsite  !== undefined) update.has_website  = body.hasWebsite;
  if (body.notes       !== undefined) update.notes        = body.notes || null;
  if (body.igLink      !== undefined) update.ig_link      = body.igLink || null;
  if (body.priority      !== undefined) update.priority       = body.priority;
  if (body.on_bench      !== undefined) update.on_bench       = body.on_bench;
  if (body.follow_up_due !== undefined) update.follow_up_due  = body.follow_up_due;
  if (body.tags          !== undefined) update.tags           = body.tags;
  if (body.ai_score      !== undefined) update.ai_score       = body.ai_score;
  if (body.ai_score_reason !== undefined) update.ai_score_reason = body.ai_score_reason;

  // Stage change — append history entry
  if (body.stage !== undefined) {
    update.stage = body.stage;

    if (body.stage === "dm_sent") {
      update.dm_sent_at = new Date().toISOString();
    }

    // Fetch current stage_history and append
    const { data: existing } = await supabase
      .from("leads")
      .select("stage_history")
      .eq("id", params.id)
      .single();

    const history: Array<Record<string, string>> = existing?.stage_history ?? [];
    update.stage_history = [
      ...history,
      { stage: body.stage, changed_at: new Date().toISOString() },
    ];
  }

  const { data, error } = await supabase
    .from("leads")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapLead(data));
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer();
  const { error } = await supabase.from("leads").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
