import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { mapProject } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(mapProject));
}

export async function POST(req: Request) {
  const body = await req.json();

  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .insert([{
      client:   body.client?.trim(),
      service:  body.service,
      budget:   Number(body.budget) || 0,
      deadline: body.deadline || null,
      status:   body.status || "in_progress",
      notes:    body.notes || null,
      lead_id:  body.leadId || null,
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapProject(data), { status: 201 });
}
