import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { mapProject } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};
  if (body.client   !== undefined) update.client   = body.client;
  if (body.service  !== undefined) update.service  = body.service;
  if (body.budget   !== undefined) update.budget   = Number(body.budget) || 0;
  if (body.deadline !== undefined) update.deadline = body.deadline || null;
  if (body.status   !== undefined) update.status   = body.status;
  if (body.notes    !== undefined) update.notes    = body.notes || null;
  if (body.leadId   !== undefined) update.lead_id  = body.leadId || null;

  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .update(update)
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapProject(data));
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServer();
  const { error } = await supabase.from("projects").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
