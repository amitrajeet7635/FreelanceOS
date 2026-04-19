import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

import { mapProject } from "@/lib/supabase";
import { createSupabaseServer } from "@/lib/supabase-server";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const body = await req.json();

  const isMilestonePayment = body.paymentStructure === "milestone";
  const normalizedMilestones = Array.isArray(body.milestones)
    ? body.milestones
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((m: any) => ({
          id: m.id,
          title: String(m.title || "").trim(),
          price: Number(m.price) || 0,
          dueDate: m.dueDate || "",
          done: Boolean(m.done),
        }))
    : undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {};
  if (body.client   !== undefined) update.client   = body.client;
  if (body.service  !== undefined) update.service  = body.service;
  if (body.budget   !== undefined) update.budget   = Number(body.budget) || 0;
  if (body.deadline !== undefined) update.deadline = body.deadline || null;
  if (body.status   !== undefined) update.status   = body.status;
  if (body.notes    !== undefined) update.notes    = body.notes || null;
  if (body.leadId   !== undefined) update.lead_id  = body.leadId || null;
  if (body.paid_amount !== undefined || body.paidAmount !== undefined) {
    update.paid_amount = Math.max(0, Number(body.paid_amount ?? body.paidAmount) || 0);
  }
  if (body.paymentStructure !== undefined) update.payment_structure = body.paymentStructure;
  if (normalizedMilestones !== undefined) update.milestones = normalizedMilestones;

  if (isMilestonePayment && normalizedMilestones) {
    update.budget = normalizedMilestones.reduce(
      (sum: number, m: { price: number }) => sum + (m.price || 0),
      0
    );
    if (update.paid_amount === undefined) {
      update.paid_amount = normalizedMilestones
        .filter((m: { done?: boolean }) => m.done)
        .reduce((sum: number, m: { price: number }) => sum + (m.price || 0), 0);
    }
  }

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
