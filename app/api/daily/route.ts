import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { createSupabaseServer } from "@/lib/supabase-server";

export async function GET() {
  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("daily_entries")
    .select("*")
    .order("date", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Map to camelCase-friendly shape (field names already match, just remap _id)
  return NextResponse.json(
    (data ?? []).map(r => ({ ...r, _id: r.id }))
  );
}

export async function POST(req: Request) {
  const { date, field, value } = await req.json();

  // Valid counter fields
  const VALID_FIELDS = ["dms", "replies", "leads", "calls"] as const;
  if (!VALID_FIELDS.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const supabase = createSupabaseServer();

  if (value !== undefined) {
    // SET mode — upsert with explicit value
    const { data, error } = await supabase
      .from("daily_entries")
      .upsert({ date, [field]: value }, { onConflict: "date" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ...data, _id: data.id });
  } else {
    // INCREMENT mode — fetch current, then update
    const { data: existing } = await supabase
      .from("daily_entries")
      .select("*")
      .eq("date", date)
      .single();

    const current = (existing as Record<string, number> | null)?.[field] ?? 0;

    const { data, error } = await supabase
      .from("daily_entries")
      .upsert({ date, [field]: current + 1 }, { onConflict: "date" })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ...data, _id: data.id });
  }
}
