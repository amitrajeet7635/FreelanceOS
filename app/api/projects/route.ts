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
  const isMilestonePayment = body.paymentStructure === "milestone";

  const milestones = Array.isArray(body.milestones)
    ? body.milestones
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((m: any) => ({
          id: m.id,
          title: String(m.title || "").trim(),
          price: Number(m.price) || 0,
          dueDate: m.dueDate || "",
          done: Boolean(m.done),
        }))
        .filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (m: any) => m.title && m.price > 0 && m.dueDate
        )
    : [];

  const budgetFromMilestones = milestones.reduce(
    (sum: number, m: { price: number }) => sum + m.price,
    0
  );

  const paidFromMilestones = milestones
    .filter((m: { done: boolean }) => m.done)
    .reduce((sum: number, m: { price: number }) => sum + m.price, 0);
  const paidAmount = Number(body.paid_amount ?? body.paidAmount);

  const supabase = createSupabaseServer();
  const { data, error } = await supabase
    .from("projects")
    .insert([{
      client:   body.client?.trim(),
      service:  body.service,
      budget:   isMilestonePayment ? budgetFromMilestones : Number(body.budget) || 0,
      deadline: body.deadline || null,
      status:   body.status || "in_progress",
      notes:    body.notes || null,
      lead_id:  body.leadId || null,
      payment_structure: body.paymentStructure || "100_upfront",
      milestones,
      paid_amount: Number.isFinite(paidAmount)
        ? Math.max(0, paidAmount)
        : (isMilestonePayment ? paidFromMilestones : 0),
    }])
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(mapProject(data), { status: 201 });
}
