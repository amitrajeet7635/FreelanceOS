import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("notes")
    .select("content")
    .eq("id", "singleton")
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = row not found (singleton may not exist yet)
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ content: data?.content ?? "" });
}

export async function PUT(req: Request) {
  const { content } = await req.json();

  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("notes")
    .upsert({ id: "singleton", content, updated_at: new Date().toISOString() }, { onConflict: "id" })
    .select("content")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ content: data.content });
}
