import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json();
  const { action, field } = body;
  // action = 'increment', field = 'dms' | 'replies' etc
  
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const logDate = new Date().toISOString().split('T')[0];

  // Try to query existing
  let { data: existing } = await supabase
    .from("daily_logs")
    .select(field)
    .eq("user_id", user.id)
    .eq("log_date", logDate)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from("daily_logs")
      .update({ [field]: (existing[field] || 0) + 1 })
      .eq("user_id", user.id)
      .eq("log_date", logDate)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } else {
    // Insert new
    const payload = { user_id: user.id, log_date: logDate, [field]: 1 };
    const { data, error } = await supabase
      .from("daily_logs")
      .insert([payload])
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const dateStr = searchParams.get("date") || new Date().toISOString().split('T')[0];

  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from("daily_logs")
    .select("*")
    .eq("user_id", user.id)
    .eq("log_date", dateStr)
    .single();

  if (error && error.code !== "PGRST116") return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || null);
}
