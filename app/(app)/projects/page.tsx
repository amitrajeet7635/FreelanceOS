"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProjects, createProject, updateProject, deleteProject, Project } from "@/hooks/useProjects";
import { PROJECT_STATUS, SERVICES } from "@/lib/constants";
import { formatCurrency, daysUntil, formatDate } from "@/lib/utils";
import { Plus, Trash2, Edit3, Check, Clock, AlertTriangle, Loader2, X } from "lucide-react";

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

// ── Project Modal ─────────────────────────────────────────────────────────────
function ProjectModal({ project, onClose }: { project?: Project; onClose: () => void }) {
  const blank = { client: "", service: "Landing Page", budget: 0, deadline: "", status: "in_progress", notes: "" };
  const [form, setForm] = useState(project ? {
    client: project.client, service: project.service,
    budget: project.budget, deadline: project.deadline?.split("T")[0] || "",
    status: project.status, notes: project.notes || "",
  } : blank);
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: string | number) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.client.trim()) return;
    setSaving(true);
    if (project) await updateProject(project._id, form);
    else await createProject(form);
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
          <div className="form-group">
            <label className="form-label">Budget (₹)</label>
            <input className="form-control" type="number" placeholder="15000" value={form.budget || ""}
              onChange={e => set("budget", parseInt(e.target.value) || 0)} />
          </div>
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input className="form-control" type="date" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
          </div>
        </div>
        <div className="form-group" style={{ marginBottom: 18 }}>
          <label className="form-label">Notes / Scope</label>
          <textarea className="form-control" value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="Pages needed, features, special requirements..." />
        </div>

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

  return (
    <motion.div className="card" layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{project.client}</span>
            <span className="badge" style={{ background: "var(--info-subtle)", color: "var(--info)", border: "1px solid rgba(59,130,246,0.2)" }}>
              {project.service}
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
        </div>

        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
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
