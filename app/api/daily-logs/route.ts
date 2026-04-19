import { NextResponse } from "next/server";
import { createSupabaseServer } from "@/lib/supabase-server";

const ALLOWED_FIELDS = [
  "dms",
  "replies",
  "leads_qualified",
  "calls_booked",
  "clients_closed",
  "revenue_earned",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

type DerivedDailyLog = {
  id: string;
  log_date: string;
  dms: number;
  replies: number;
  leads_qualified: number;
  calls_booked: number;
  clients_closed: number;
  revenue_earned: number;
};

function sanitizeNumeric(input: unknown) {
  const n = Number(input);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function toISODate(input?: string | null): string | null {
  if (!input) return null;
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split("T")[0];
}

function dateRange(startISO: string, endISO: string) {
  const out: string[] = [];
  const d = new Date(`${startISO}T00:00:00.000Z`);
  const end = new Date(`${endISO}T00:00:00.000Z`);

  while (d <= end) {
    out.push(d.toISOString().split("T")[0]);
    d.setUTCDate(d.getUTCDate() + 1);
  }

  return out;
}

function ensureRow(store: Map<string, DerivedDailyLog>, date: string) {
  if (!store.has(date)) {
    store.set(date, {
      id: `derived-${date}`,
      log_date: date,
      dms: 0,
      replies: 0,
      leads_qualified: 0,
      calls_booked: 0,
      clients_closed: 0,
      revenue_earned: 0,
    });
  }
  return store.get(date)!;
}

function incrementForDate(
  store: Map<string, DerivedDailyLog>,
  date: string | null,
  key: keyof Omit<DerivedDailyLog, "id" | "log_date">,
  amount = 1
) {
  if (!date || !store.has(date)) return;
  const row = ensureRow(store, date);
  row[key] += amount;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { field } = body as { field?: AllowedField };

  if (!field || !ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }
  
  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const logDate = body.date || new Date().toISOString().split("T")[0];

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
  const dateStr = searchParams.get("date");
  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const days = Number(searchParams.get("days") || 30);

  const supabase = createSupabaseServer();
  const backDays = Number.isFinite(days) ? Math.max(1, Math.min(180, days)) : 30;
  const resolvedEnd = end || new Date().toISOString().split("T")[0];
  const resolvedStart =
    start || (() => {
      const d = new Date();
      d.setDate(d.getDate() - (backDays - 1));
      return d.toISOString().split("T")[0];
    })();

  const rangeDates = dateRange(resolvedStart, resolvedEnd);
  const store = new Map<string, DerivedDailyLog>();
  rangeDates.forEach(d => ensureRow(store, d));

  const { data: leads, error: leadsError } = await supabase
    .from("leads")
    .select("created_at, dm_sent_at, replied_at, stage_history");

  if (leadsError) return NextResponse.json({ error: leadsError.message }, { status: 500 });

  for (const lead of leads ?? []) {
    incrementForDate(store, toISODate(lead.created_at), "leads_qualified", 1);

    const dmDate = toISODate(lead.dm_sent_at);
    if (dmDate) {
      incrementForDate(store, dmDate, "dms", 1);
    }

    const repliedDate = toISODate(lead.replied_at);
    if (repliedDate) {
      incrementForDate(store, repliedDate, "replies", 1);
    }

    const history = Array.isArray(lead.stage_history) ? lead.stage_history : [];
    history.forEach((h: { stage?: string; changed_at?: string }) => {
      const hDate = toISODate(h.changed_at);
      if (!hDate) return;

      if (!dmDate && h.stage === "dm_sent") incrementForDate(store, hDate, "dms", 1);
      if (!repliedDate && h.stage === "replied") incrementForDate(store, hDate, "replies", 1);
      if (h.stage === "call") incrementForDate(store, hDate, "calls_booked", 1);
      if (h.stage === "client") incrementForDate(store, hDate, "clients_closed", 1);
    });
  }

  const { data: projects, error: projectsError } = await supabase
    .from("projects")
    .select("status, budget, paid_amount, updated_at")
    .gte("updated_at", `${resolvedStart}T00:00:00.000Z`)
    .lte("updated_at", `${resolvedEnd}T23:59:59.999Z`);

  if (projectsError) return NextResponse.json({ error: projectsError.message }, { status: 500 });

  for (const project of projects ?? []) {
    if (project.status !== "paid") continue;
    const paidDate = toISODate(project.updated_at);
    const amount = Math.max(0, Number(project.paid_amount) || Number(project.budget) || 0);
    incrementForDate(store, paidDate, "revenue_earned", amount);
  }

  const rows = Array.from(store.values()).sort((a, b) => b.log_date.localeCompare(a.log_date));

  if (dateStr) {
    return NextResponse.json(rows.find(r => r.log_date === dateStr) || null);
  }

  return NextResponse.json(rows);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const logDate = String(body.log_date || body.date || "").trim();

  if (!logDate) {
    return NextResponse.json({ error: "log_date is required" }, { status: 400 });
  }

  const supabase = createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = {
    user_id: user.id,
    log_date: logDate,
    dms: sanitizeNumeric(body.dms),
    replies: sanitizeNumeric(body.replies),
    leads_qualified: sanitizeNumeric(body.leads_qualified),
    calls_booked: sanitizeNumeric(body.calls_booked),
    clients_closed: sanitizeNumeric(body.clients_closed),
    revenue_earned: sanitizeNumeric(body.revenue_earned),
    note: String(body.note || "").trim(),
  };

  const { data, error } = await supabase
    .from("daily_logs")
    .upsert(payload, { onConflict: "user_id,log_date" })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
