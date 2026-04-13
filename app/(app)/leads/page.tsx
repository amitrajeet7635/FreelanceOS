"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLeads, createLead, updateLead, deleteLead, Lead } from "@/hooks/useLeads";
import { createProject } from "@/hooks/useProjects";
import { STAGES, NICHES, NEXT_STAGE } from "@/lib/constants";
import { formatDate, formatRelative, todayISO } from "@/lib/utils";
import {
  Plus, Search, Filter, ExternalLink, ChevronRight, Trash2,
  Edit3, X, Check, Instagram, Globe, Loader2, Download,
} from "lucide-react";

// ── Stage Badge ───────────────────────────────────────────────────────────────
function StageBadge({ stageId }: { stageId: string }) {
  const stage = STAGES.find(s => s.id === stageId) || STAGES[0];
  return (
    <span className="badge" style={{ background: stage.bg, color: stage.color, border: `1px solid ${stage.border}` }}>
      {stage.label}
    </span>
  );
}

// ── Lead Form Modal ───────────────────────────────────────────────────────────
function LeadModal({
  lead,
  onClose,
}: {
  lead?: Lead;
  onClose: () => void;
}) {
  const blank = { username: "", niche: "Pet/Grooming", followers: "", hasWebsite: "no" as const, notes: "", igLink: "" };
  const [form, setForm] = useState(lead ? {
    username: lead.username, niche: lead.niche, followers: lead.followers || "",
    hasWebsite: lead.hasWebsite, notes: lead.notes || "", igLink: lead.igLink || "",
  } : blank);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.username.trim()) return;
    setSaving(true);
    if (lead) {
      await updateLead(lead._id, form);
    } else {
      await createLead(form);
    }
    setSaving(false);
    onClose();
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        className="modal-sheet"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        <div className="modal-handle" />
        <div className="modal-title">{lead ? "Edit Lead" : "Add New Lead"}</div>

        <div className="grid-2" style={{ marginBottom: 14 }}>
          <div className="form-group">
            <label className="form-label">Instagram Username *</label>
            <input className="form-control" placeholder="@username" value={form.username}
              onChange={e => set("username", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Niche</label>
            <select className="form-control" value={form.niche} onChange={e => set("niche", e.target.value)}>
              {NICHES.map(n => <option key={n}>{n}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Followers (approx)</label>
            <input className="form-control" placeholder="e.g. 5k or 12000" value={form.followers}
              onChange={e => set("followers", e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Has Website?</label>
            <select className="form-control" value={form.hasWebsite} onChange={e => set("hasWebsite", e.target.value)}>
              <option value="no">No website (hot lead)</option>
              <option value="yes">Has a website</option>
              <option value="bad">Has bad website</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginBottom: 14 }}>
          <label className="form-label">Instagram Profile Link</label>
          <input className="form-control" placeholder="https://instagram.com/username" value={form.igLink}
            onChange={e => set("igLink", e.target.value)} />
        </div>

        <div className="form-group" style={{ marginBottom: 18 }}>
          <label className="form-label">Notes / Observations</label>
          <textarea className="form-control" value={form.notes} onChange={e => set("notes", e.target.value)}
            placeholder="What did you notice? Orders via DMs? Engagement level? Product type?" />
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.username.trim()}>
            {saving ? <Loader2 size={14} className="spinner" /> : <Check size={14} />}
            {lead ? "Save Changes" : "Add Lead"}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Lead Card ─────────────────────────────────────────────────────────────────
function LeadCard({ lead, onEdit }: { lead: Lead; onEdit: (l: Lead) => void }) {
  const [confirming, setConfirming] = useState(false);
  const nextStageId = NEXT_STAGE[lead.stage];
  const nextStage = nextStageId ? STAGES.find(s => s.id === nextStageId) : null;

  const handleAdvance = async () => {
    if (!nextStageId) return;
    await updateLead(lead._id, { stage: nextStageId });
  };

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return; }
    await deleteLead(lead._id);
  };

  const handleConvertToClient = async () => {
    await updateLead(lead._id, { stage: "client" });
    // Auto-create a project
    await createProject({
      client: lead.username,
      service: "Landing Page",
      budget: 0,
      status: "in_progress",
      notes: `Converted from lead. Niche: ${lead.niche}`,
      leadId: lead._id,
    });
  };

  return (
    <motion.div
      className="card"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ marginBottom: 8 }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
              {lead.username.startsWith("@") ? "" : "@"}{lead.username}
            </span>
            <StageBadge stageId={lead.stage} />
            <span className="badge" style={{ background: "var(--bg-overlay)", color: "var(--text-muted)", border: "1px solid var(--border-subtle)" }}>
              {lead.niche}
            </span>
            {lead.followers && (
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{lead.followers} followers</span>
            )}
            {lead.hasWebsite === "no" && (
              <span className="badge" style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}>
                <Globe size={10} /> No site
              </span>
            )}
          </div>
          {lead.notes && (
            <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 4, fontStyle: "italic" }}>
              &ldquo;{lead.notes}&rdquo;
            </p>
          )}
          <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)" }}>
            <span>Added {formatDate(lead.createdAt)}</span>
            <span>·</span>
            <span>Updated {formatRelative(lead.updatedAt)}</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", flexShrink: 0 }}>
          {lead.igLink && (
            <a href={lead.igLink} target="_blank" rel="noreferrer" className="btn-icon" title="Open Instagram">
              <Instagram size={14} />
            </a>
          )}
          {nextStage && lead.stage !== "call" && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="btn btn-sm"
              style={{ background: nextStage.bg, color: nextStage.color, border: `1px solid ${nextStage.border}` }}
              onClick={handleAdvance}
            >
              <ChevronRight size={13} /> {nextStage.label}
            </motion.button>
          )}
          {lead.stage === "call" && (
            <button className="btn btn-sm btn-primary" onClick={handleConvertToClient}>
              <Check size={13} /> Close as Client
            </button>
          )}
          <button className="btn-icon" onClick={() => onEdit(lead)} title="Edit"><Edit3 size={14} /></button>
          <button
            className={`btn-icon${confirming ? " btn-danger" : ""}`}
            onClick={handleDelete}
            title={confirming ? "Click again to confirm delete" : "Delete"}
            onBlur={() => setConfirming(false)}
            style={confirming ? { background: "var(--danger)", color: "#fff", border: "none" } : {}}
          >
            {confirming ? <X size={14} /> : <Trash2 size={14} />}
          </button>
        </div>
      </div>

      {/* Stage pills */}
      <div style={{ display: "flex", gap: 4, marginTop: 10, flexWrap: "wrap" }}>
        {STAGES.map(s => (
          <button
            key={s.id}
            className="stage-pill"
            style={{
              background: lead.stage === s.id ? s.bg : "transparent",
              color: lead.stage === s.id ? s.color : "var(--text-muted)",
              border: `1px solid ${lead.stage === s.id ? s.border : "var(--border-subtle)"}`,
            }}
            onClick={() => updateLead(lead._id, { stage: s.id })}
          >
            {s.label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(leads: Lead[]) {
  const headers = ["Username","Niche","Followers","Has Website","Stage","Notes","Instagram Link","Created","Updated"];
  const rows = leads.map(l => [
    l.username, l.niche, l.followers || "", l.hasWebsite, l.stage,
    (l.notes || "").replace(/,/g, ";"), l.igLink || "",
    formatDate(l.createdAt), formatDate(l.updatedAt),
  ]);
  const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `leads-${todayISO()}.csv`; a.click();
}

// ── Main Leads Page ───────────────────────────────────────────────────────────
export default function LeadsPage() {
  const [filterStage, setFilterStage] = useState("all");
  const [filterNiche, setFilterNiche] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();

  const { leads, isLoading } = useLeads({ stage: filterStage, niche: filterNiche, search });

  const handleEdit = (lead: Lead) => { setEditingLead(lead); setShowModal(true); };
  const handleClose = () => { setShowModal(false); setEditingLead(undefined); };

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16, gap: 12 }}>
        <div>
          <div className="page-title">Leads</div>
          <div className="page-sub">{leads.length} leads tracked</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={() => exportCSV(leads)}>
            <Download size={13} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={() => { setEditingLead(undefined); setShowModal(true); }}>
            <Plus size={15} /> Add Lead
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 300 }}>
          <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input
            className="form-control"
            style={{ paddingLeft: 32 }}
            placeholder="Search username or notes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <Filter size={13} color="var(--text-muted)" />
          <select className="form-control" style={{ width: "auto" }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="all">All stages</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <select className="form-control" style={{ width: "auto" }} value={filterNiche} onChange={e => setFilterNiche(e.target.value)}>
            <option value="all">All niches</option>
            {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        {(filterStage !== "all" || filterNiche !== "all" || search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStage("all"); setFilterNiche("all"); setSearch(""); }}>
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Stage filter chips */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        <button className={`chip${filterStage === "all" ? " active" : ""}`} onClick={() => setFilterStage("all")}>
          All
        </button>
        {STAGES.map(s => (
          <button key={s.id} className={`chip${filterStage === s.id ? " active" : ""}`} onClick={() => setFilterStage(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {/* Lead list */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} className="spinner" color="var(--text-muted)" />
        </div>
      ) : leads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ExternalLink size={32} /></div>
          <div className="empty-state-title">No leads yet</div>
          <div className="empty-state-sub">Start prospecting on Instagram using the Strategy tab, then add leads here.</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add your first lead
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {leads.map(lead => (
            <LeadCard key={lead._id} lead={lead} onEdit={handleEdit} />
          ))}
        </AnimatePresence>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && <LeadModal lead={editingLead} onClose={handleClose} />}
      </AnimatePresence>
    </div>
  );
}
