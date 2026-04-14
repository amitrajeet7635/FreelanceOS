import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.json();
  const { field } = body;
  // field = 'dms' | 'replies' | 'leads_qualified' | 'calls_booked' | 'clients_closed' | 'revenue_earned'

  const ALLOWED_FIELDS = [
    "dms",
    "replies",
    "leads_qualified",
    "calls_booked",
    "clients_closed",
    "revenue_earned",
  ] as const;

  if (!ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }
  
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
    const currentValue = Number(((existing as unknown as Record<string, unknown>)[field]) ?? 0);

    const { data, error } = await supabase
      .from("daily_logs")
      .update({ [field]: currentValue + 1 })
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
