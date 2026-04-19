"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects, createProject, updateProject, deleteProject, Project } from "@/hooks/useProjects";
import type { ProjectMilestone } from "@/lib/types";
import { PROJECT_STATUS, SERVICES } from "@/lib/constants";
import { formatCurrency, daysUntil, formatDate } from "@/lib/utils";
import { PremiumDateInput } from "@/components/ui/PremiumDateInput";
import { Plus, Trash2, Edit3, Check, Clock, AlertTriangle, Loader2, X, Milestone, Landmark, CalendarClock, ChevronDown, ListChecks } from "lucide-react";

function StatusBadge({ statusId }: { statusId: string }) {
  const s = PROJECT_STATUS.find(p => p.id === statusId) || PROJECT_STATUS[0];
  return (
    <span className="badge" style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>
      {s.label}
    </span>
  );
}

// ── Deadline ring (SVG) ───────────────────────────────────────────────────────
function DeadlineRing({ deadline }: { deadline?: string }) {
  if (!deadline) return null;
  const days = daysUntil(deadline);
  const total = 30;
  const clampedDays = Math.max(0, Math.min(days, total));
  const pct = clampedDays / total;
  const r = 14;
  const circ = 2 * Math.PI * r;
  const dash = pct * circ;
  const color = days < 0 ? "#ef4444" : days <= 3 ? "#f59e0b" : "#10b981";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <svg width={34} height={34}>
        <circle cx={17} cy={17} r={r} fill="none" stroke="var(--bg-overlay)" strokeWidth={3} />
        <circle
          cx={17} cy={17} r={r} fill="none"
          stroke={color} strokeWidth={3}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 17 17)"
        />
      </svg>
      <span style={{ fontSize: 12, fontWeight: 600, color }}>
        {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
      </span>
    </div>
  );
}

const createEmptyMilestone = (idx: number): ProjectMilestone => ({
  id: `ms-${Date.now()}-${idx}`,
  title: "",
  price: 0,
  dueDate: "",
  done: false,
});

function toPaymentMode(paymentStructure?: Project["payment_structure"]) {
  return paymentStructure === "milestone" ? "milestone" : "one_time";
}

// ── Project Modal ─────────────────────────────────────────────────────────────
function ProjectModal({ project, onClose }: { project?: Project; onClose: () => void }) {
  const initialPaymentMode = toPaymentMode(project?.payment_structure);
  const initialMilestones: ProjectMilestone[] = Array.isArray(project?.milestones)
    ? project!.milestones.map((m, idx) => ({
      id: m.id || `ms-${idx}`,
      title: m.title || "",
      price: Number(m.price) || 0,
      dueDate: m.dueDate || "",
      done: Boolean(m.done),
    }))
    : [];

  const blank = {
    client: "",
    service: "Landing Page",
    budget: 0,
    deadline: "",
    status: "in_progress",
    notes: "",
    paymentMode: "one_time" as "one_time" | "milestone",
    milestones: [createEmptyMilestone(0)],
  };

  const [form, setForm] = useState(project ? {
    client: project.client, service: project.service,
    budget: project.budget, deadline: project.deadline?.split("T")[0] || "",
    status: project.status, notes: project.notes || "",
    paymentMode: initialPaymentMode,
    milestones: initialMilestones.length > 0 ? initialMilestones : [createEmptyMilestone(0)],
  } : blank);

  const [milestoneCount, setMilestoneCount] = useState(
    Math.max(form.milestones.length, 1)
  );
  const [milestoneCountInput, setMilestoneCountInput] = useState(
    String(Math.max(form.milestones.length, 1))
  );
  const [saving, setSaving] = useState(false);
  const [validationError, setValidationError] = useState("");
  const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));

  const milestoneTotal = useMemo(
    () => form.milestones.reduce((sum, m) => sum + (Number(m.price) || 0), 0),
    [form.milestones]
  );

  const syncMilestoneCount = (count: number) => {
    const safeCount = Math.max(1, Math.min(12, count || 1));
    setMilestoneCount(safeCount);
    setMilestoneCountInput(String(safeCount));
    setForm(prev => {
      const current = prev.milestones || [];
      if (current.length === safeCount) return prev;
      if (current.length > safeCount) {
        return { ...prev, milestones: current.slice(0, safeCount) };
      }
      const next = [...current];
      while (next.length < safeCount) {
        next.push(createEmptyMilestone(next.length));
      }
      return { ...prev, milestones: next };
    });
  };

  const updateMilestone = (index: number, patch: Partial<ProjectMilestone>) => {
    setForm(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, idx) => idx === index ? { ...m, ...patch } : m),
    }));
  };

  const handleMilestoneCountInputChange = (rawValue: string) => {
    if (!/^\d*$/.test(rawValue)) return;
    setMilestoneCountInput(rawValue);

    if (!rawValue) return;
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    syncMilestoneCount(parsed);
  };

  const handleMilestoneCountBlur = () => {
    const parsed = Number(milestoneCountInput);
    syncMilestoneCount(Number.isFinite(parsed) && parsed > 0 ? parsed : 1);
  };

  const handleSave = async () => {
    if (!form.client.trim()) return;
    setValidationError("");

    const isMilestone = form.paymentMode === "milestone";
    const milestoneRows = form.milestones.slice(0, milestoneCount);

    if (isMilestone) {
      const invalidMilestone = milestoneRows.find(
        m => !m.title.trim() || !m.dueDate || (Number(m.price) || 0) <= 0
      );
      if (invalidMilestone) {
        setValidationError("Each milestone needs a title, positive price, and deadline.");
        return;
      }
    }

    setSaving(true);
    const payload = {
      client: form.client,
      service: form.service,
      budget: isMilestone ? milestoneTotal : form.budget,
      deadline: isMilestone
        ? milestoneRows
            .map(m => m.dueDate)
            .filter(Boolean)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            .at(-1) || ""
        : form.deadline,
      status: form.status,
      notes: form.notes,
      paymentStructure: isMilestone ? "milestone" : "100_upfront",
      milestones: isMilestone ? milestoneRows : [],
    };

    if (project) await updateProject(project._id, payload);
    else await createProject(payload);
    setSaving(false);
    onClose();
  };

  return (
    <motion.div className="modal-overlay"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div className="modal-sheet"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        <div className="modal-handle" />
        <div className="modal-title">{project ? "Edit Project" : "New Project"}</div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Payment Type</label>
          <div className="payment-option-grid">
            <button
              type="button"
              className={`payment-option-card ${form.paymentMode === "one_time" ? "active" : ""}`}
              onClick={() => setForm(prev => ({ ...prev, paymentMode: "one_time" }))}
            >
              <Landmark size={16} />
              <div>
                <div className="payment-option-title">One Time</div>
                <div className="payment-option-sub">Single payment for the whole project</div>
              </div>
            </button>
            <button
              type="button"
              className={`payment-option-card ${form.paymentMode === "milestone" ? "active" : ""}`}
              onClick={() => {
                setForm(prev => ({
                  ...prev,
                  paymentMode: "milestone",
                  milestones: prev.milestones.length ? prev.milestones : [createEmptyMilestone(0)],
                }));
                if (!milestoneCount) syncMilestoneCount(1);
              }}
            >
              <Milestone size={16} />
              <div>
                <div className="payment-option-title">Milestone</div>
                <div className="payment-option-sub">Split payment across delivery checkpoints</div>
              </div>
            </button>
          </div>
        </div>

        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Client / Business Name *</label>
            <input className="form-control" placeholder="Client name" value={form.client} onChange={e => set("client", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Service Type</label>
            <select className="form-control" value={form.service} onChange={e => set("service", e.target.value)}>
              {SERVICES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {form.paymentMode === "one_time" ? (
            <>
              <div className="form-group">
                <label className="form-label">Budget (₹)</label>
                <input className="form-control" type="number" placeholder="15000" value={form.budget || ""}
                  onChange={e => set("budget", parseInt(e.target.value) || 0)} />
              </div>
              <div className="form-group">
                <label className="form-label">Deadline</label>
                <PremiumDateInput value={form.deadline} onChange={v => set("deadline", v)} />
              </div>
            </>
          ) : (
            <>
              <div className="form-group">
                <label className="form-label">No. of Milestones</label>
                <input
                  className="form-control"
                  type="number"
                  min={1}
                  max={12}
                  value={milestoneCountInput}
                  onChange={e => handleMilestoneCountInputChange(e.target.value)}
                  onBlur={handleMilestoneCountBlur}
                />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Recommended: keep it between 2–6 milestones.
                </span>
              </div>
              <div className="form-group">
                <label className="form-label">Milestone Total</label>
                <div className="milestone-total-pill">
                  <CalendarClock size={14} />
                  {formatCurrency(milestoneTotal)}
                </div>
              </div>
            </>
          )}
        </div>

        <AnimatePresence initial={false}>
          {form.paymentMode === "milestone" && (
            <motion.div
              key="milestone-editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              style={{ marginBottom: 14 }}
            >
              <div className="section-label" style={{ marginBottom: 8 }}>Milestone Breakdown</div>
              <div className="milestone-stack">
                {form.milestones.slice(0, milestoneCount).map((milestone, idx) => (
                  <motion.div
                    key={milestone.id}
                    className="milestone-row"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="milestone-row-index">M{idx + 1}</div>
                    <div className="milestone-row-fields">
                      <input
                        className="form-control"
                        placeholder={`Milestone ${idx + 1} title`}
                        value={milestone.title}
                        onChange={e => updateMilestone(idx, { title: e.target.value })}
                      />
                      <input
                        className="form-control"
                        type="number"
                        placeholder="Price (₹)"
                        value={milestone.price || ""}
                        onChange={e => updateMilestone(idx, { price: parseInt(e.target.value) || 0 })}
                      />
                      <PremiumDateInput
                        value={milestone.dueDate}
                        onChange={v => updateMilestone(idx, { dueDate: v })}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="form-group" style={{ marginBottom: 18 }}>
          <label className="form-label">Notes / Scope</label>
          <textarea className="form-control" value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Pages needed, features, special requirements..." />
        </div>

        {validationError && (
          <div className="badge" style={{ marginBottom: 12, background: "var(--danger-subtle)", color: "var(--danger)", border: "1px solid rgba(239,68,68,0.25)" }}>
            {validationError}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.client.trim()}>
            {saving ? <Loader2 size={14} className="spinner" /> : <Check size={14} />}
            {project ? "Save Changes" : "Add Project"}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Project Card ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onEdit }: { project: Project; onEdit: (p: Project) => void }) {
  const [confirming, setConfirming] = useState(false);
  const [milestoneSaving, setMilestoneSaving] = useState(false);
  const [showMilestoneTracker, setShowMilestoneTracker] = useState(false);
  const isMilestone = project.payment_structure === "milestone";
  const milestones = Array.isArray(project.milestones) ? project.milestones : [];
  const milestoneDoneCount = milestones.filter(m => m.done).length;
  const nextMilestoneIndex = milestones.findIndex(m => !m.done);

  const paidFromMilestones = milestones
    .filter(m => m.done)
    .reduce((sum, m) => sum + (Number(m.price) || 0), 0);
  const paidAmount = Math.max(Number(project.paid_amount) || 0, paidFromMilestones);
  const outstandingAmount = Math.max((project.budget || 0) - paidAmount, 0);
  const milestoneProgressPct = milestones.length > 0
    ? Math.round((milestoneDoneCount / milestones.length) * 100)
    : 0;

  const updateMilestonesProgress = async (nextMilestones: ProjectMilestone[]) => {
    const nextPaidAmount = nextMilestones
      .filter(m => m.done)
      .reduce((sum, m) => sum + (Number(m.price) || 0), 0);
    const allDone = nextMilestones.length > 0 && nextMilestones.every(m => m.done);

    setMilestoneSaving(true);
    await updateProject(project._id, {
      milestones: nextMilestones,
      paid_amount: nextPaidAmount,
      ...(allDone && project.status === "in_progress" ? { status: "delivered" } : {}),
      ...(!allDone && project.status === "delivered" ? { status: "in_progress" } : {}),
    });
    setMilestoneSaving(false);
  };

  const markNextMilestonePaid = async () => {
    if (nextMilestoneIndex < 0 || milestoneSaving) return;
    const next = milestones.map((m, idx) => idx === nextMilestoneIndex ? { ...m, done: true } : m);
    await updateMilestonesProgress(next);
  };

  const undoLastPaidMilestone = async () => {
    if (milestoneSaving) return;
    const lastDoneIndex = [...milestones].map((m, idx) => ({ ...m, idx })).reverse().find(m => m.done)?.idx;
    if (lastDoneIndex === undefined) return;
    const next = milestones.map((m, idx) => idx === lastDoneIndex ? { ...m, done: false } : m);
    await updateMilestonesProgress(next);
  };

  return (
    <motion.div className="card" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{project.client}</span>
            <span className="badge" style={{ background: "var(--info-subtle)", color: "var(--info)", border: "1px solid rgba(59,130,246,0.2)" }}>
              {project.service}
            </span>
            <span className="badge" style={{ background: "var(--accent-subtle)", color: "var(--accent)", border: "1px solid var(--border-default)" }}>
              {isMilestone ? "Milestone" : "One Time"}
            </span>
            <StatusBadge statusId={project.status} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
              {formatCurrency(project.budget)}
            </span>
            {project.deadline && <DeadlineRing deadline={project.deadline} />}
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Added {formatDate(project.createdAt)}</span>
          </div>
          {project.notes && (
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", fontStyle: "italic", lineHeight: 1.6, marginTop: 4 }}>
              &ldquo;{project.notes}&rdquo;
            </p>
          )}
          {isMilestone && milestones.length > 0 && (
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span className="badge" style={{ background: "var(--warning-subtle)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.2)" }}>
                    {milestoneDoneCount}/{milestones.length} milestones paid
                  </span>
                  <span className="badge" style={{ background: "var(--success-subtle)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)" }}>
                    Received {formatCurrency(paidAmount)}
                  </span>
                  <span className="badge" style={{ background: "var(--bg-overlay)", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                    Outstanding {formatCurrency(outstandingAmount)}
                  </span>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {showMilestoneTracker && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: "auto", marginTop: 10 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ overflow: "hidden", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 10, background: "var(--bg-base)" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--text-secondary)" }}>{milestoneProgressPct}% complete</span>
                    </div>

                    <div className="progress-track" style={{ marginBottom: 10 }}>
                      <div className="progress-bar" style={{ width: `${milestoneProgressPct}%`, background: "var(--success)" }} />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 7, marginBottom: 10 }}>
                      {milestones.map((m, idx) => (
                        <div
                          key={m.id || `${project._id}-m-${idx}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 8,
                            padding: "7px 9px",
                            borderRadius: 8,
                            border: "1px solid var(--border-subtle)",
                            background: m.done ? "var(--success-subtle)" : "var(--bg-surface)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                            <span
                              style={{
                                width: 7,
                                height: 7,
                                borderRadius: 99,
                                background: m.done ? "var(--success)" : "var(--text-muted)",
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 500 }}>
                              {m.title || `Milestone ${idx + 1}`}
                            </span>
                          </div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                            <span style={{ fontSize: 11.5, color: "var(--text-secondary)", fontWeight: 600 }}>{formatCurrency(Number(m.price) || 0)}</span>
                            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Due {m.dueDate ? formatDate(m.dueDate) : "-"}</span>
                            <span className="badge" style={{ background: m.done ? "var(--success-subtle)" : "var(--bg-overlay)", color: m.done ? "var(--success)" : "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
                              {m.done ? "Paid" : "Pending"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <button className="btn btn-sm btn-primary" onClick={markNextMilestonePaid} disabled={milestoneSaving || nextMilestoneIndex < 0}>
                        {milestoneSaving ? <Loader2 size={13} className="spinner" /> : <Check size={13} />}
                        {nextMilestoneIndex < 0 ? "All Milestones Paid" : `Mark Milestone ${nextMilestoneIndex + 1} Paid`}
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={undoLastPaidMilestone} disabled={milestoneSaving || milestoneDoneCount === 0}>
                        Undo Last
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          {isMilestone && milestones.length > 0 && (
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => setShowMilestoneTracker(v => !v)}
              style={{ minWidth: 92, justifyContent: "space-between" }}
            >
              <ListChecks size={13} />
              Track
              <ChevronDown
                size={13}
                style={{ transform: showMilestoneTracker ? "rotate(180deg)" : "rotate(0deg)", transition: "transform var(--transition)" }}
              />
            </button>
          )}
          <button className="btn-icon" onClick={() => onEdit(project)}><Edit3 size={14} /></button>
          <button
            className="btn-icon"
            onClick={async () => {
              if (!confirming) { setConfirming(true); return; }
              await deleteProject(project._id);
            }}
            onBlur={() => setConfirming(false)}
            style={confirming ? { background: "var(--danger)", color: "#fff", border: "none", borderRadius: 6 } : {}}
          >
            {confirming ? <X size={14} /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Status selector */}
      <div style={{ display: "flex", gap: 5, marginTop: 12, flexWrap: "wrap" }}>
        {PROJECT_STATUS.map(s => (
          <button
            key={s.id}
            className="stage-pill"
            style={{
              background: project.status === s.id ? s.bg : "transparent",
              color: project.status === s.id ? s.color : "var(--text-muted)",
              border: `1px solid ${project.status === s.id ? s.border : "var(--border-subtle)"}`,
            }}
            onClick={() => updateProject(project._id, { status: s.id })}
          >
            {s.id === "paid" && project.status === "paid" && <Check size={10} />}
            {s.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Main Projects Page ────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { projects, isLoading } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | undefined>();

  const totalPipeline = projects.reduce((s, p) => s + (p.budget || 0), 0);
  const earned = projects.filter(p => p.status === "paid").reduce((s, p) => s + (p.budget || 0), 0);
  const active = projects.filter(p => p.status !== "paid").length;
  const overdue = projects.filter(p => p.deadline && daysUntil(p.deadline) < 0 && p.status !== "paid").length;

  const handleEdit = (p: Project) => { setEditingProject(p); setShowModal(true); };

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <div>
          <div className="page-title">Projects</div>
          <div className="page-sub">Track client work, deadlines, and payments</div>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingProject(undefined); setShowModal(true); }}>
          <Plus size={15} /> New Project
        </button>
      </div>

      {/* Summary row */}
      <div className="grid-4" style={{ marginBottom: 16 }}>
        {[
          { label: "Total Pipeline", value: formatCurrency(totalPipeline), color: "var(--accent)", icon: Clock },
          { label: "Earned",         value: formatCurrency(earned),        color: "var(--success)", icon: Check },
          { label: "Active Projects",value: String(active),                color: "var(--warning)", icon: Edit3 },
          { label: "Overdue",        value: String(overdue),               color: overdue > 0 ? "var(--danger)" : "var(--text-muted)", icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <motion.div key={label} className="metric-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span className="metric-label">{label}</span>
              <Icon size={14} color="var(--text-muted)" />
            </div>
            <div style={{ fontSize: 22, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</div>
          </motion.div>
        ))}
      </div>

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} className="spinner" color="var(--text-muted)" />
        </div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Edit3 size={32} /></div>
          <div className="empty-state-title">No projects yet</div>
          <div className="empty-state-sub">Close your first lead as a client, then track the project here.</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={14} /> Add Project</button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {projects.map(p => <ProjectCard key={p._id} project={p} onEdit={handleEdit} />)}
        </AnimatePresence>
      )}

      <AnimatePresence>
        {showModal && <ProjectModal project={editingProject} onClose={() => { setShowModal(false); setEditingProject(undefined); }} />}
      </AnimatePresence>
    </div>
  );
}
