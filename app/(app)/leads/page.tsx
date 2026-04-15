"use client";

import { useState, useMemo, useEffect, Suspense, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams, useRouter } from "next/navigation";
import { useLeads, createLead, updateLead, deleteLead, Lead } from "@/hooks/useLeads";
import { createProject } from "@/hooks/useProjects";
import { useFocusTimer } from "@/components/features/FocusContext";
import { STAGES, NICHES, NEXT_STAGE } from "@/lib/constants";
import { formatDate, formatRelative, todayISO } from "@/lib/utils";
import { parseLeadNoteKeywords } from "@/lib/keywordParser";
import { PriorityBadge } from "@/components/features/PriorityBadge";
import { TheBench } from "@/components/features/TheBench";
import { SmartTextarea } from "@/components/features/SmartTextarea";
import {
  Plus, Search, Filter, ExternalLink, ChevronRight, Trash2,
  Edit3, X, Check, Instagram, Globe, Loader2, Download, Archive
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
  const { isActive: focusSessionActive, sessionStats, setSessionStats } = useFocusTimer();
  const blank = { username: "", niche: "Pet/Grooming", followers: "", hasWebsite: "no" as const, notes: "", igLink: "" };
  const [form, setForm] = useState(lead ? {
    username: lead.username, niche: lead.niche, followers: lead.followers || "",
    hasWebsite: lead.hasWebsite as any, notes: lead.notes || "", igLink: lead.igLink || "",
  } : blank);
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleSave = async () => {
    if (!form.username.trim()) return;
    setSaving(true);

    const parsed = parseLeadNoteKeywords(form.notes);
    const finalForm = {
      ...form,
      notes: parsed.cleanedNotes,
      ...(parsed.priority && { priority: parsed.priority }),
      ...(parsed.benchFlag && { on_bench: parsed.benchFlag }),
      ...(parsed.dmFlag && { stage: "dm_sent", dmSentAt: new Date().toISOString() }),
      ...(parsed.followUpDate && { follow_up_due: parsed.followUpDate }),
      ...(parsed.tags && { tags: parsed.tags })
    };

    if (lead) {
      await updateLead(lead._id, finalForm);
    } else {
      // Track lead addition in focus session
      if (focusSessionActive) {
        setSessionStats(s => ({ ...s, leads: s.leads + 1 }));
      }
      await createLead(finalForm);
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
          <label className="form-label">Bio / Notes (from Instagram or your notes)</label>
          <SmartTextarea 
            value={form.notes} 
            onChange={v => set("notes", v)}
            placeholder="e.g., their Instagram bio, or notes like: p1 tod bench..." 
          />
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
const LeadCard = forwardRef<HTMLDivElement, { lead: Lead; onEdit: (l: Lead) => void }>(
  ({ lead, onEdit }, ref) => {
    const [confirming, setConfirming] = useState(false);
  const currentPriority = lead.priority || 'P3';
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
    await createProject({
      client: lead.username,
      service: "Landing Page",
      budget: 0,
      status: "in_progress",
      notes: `Converted from lead. Niche: ${lead.niche}`,
      leadId: lead._id,
    });
  };

  const handleBench = async () => {
    await updateLead(lead._id, { on_bench: true });
  }

  const daysSinceUpdate = Math.floor((Date.now() - new Date(lead.updatedAt).getTime()) / 86400000);
  const isStale = Object.keys(lead).includes('on_bench') ? !lead.on_bench && lead.stage !== 'client' && lead.stage !== 'lost' && daysSinceUpdate > 7 
                                                         : lead.stage !== 'client' && lead.stage !== 'lost' && daysSinceUpdate > 7;
  const isOverdue = lead.stage === 'dm_sent' && lead.follow_up_due && new Date(lead.follow_up_due) <= new Date();
  const followUpLabel = lead.follow_up_due
    ? new Date(lead.follow_up_due).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
    : "";

  return (
    <motion.div
      ref={ref}
      className="card"
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{ marginBottom: 8, ...(isStale ? { borderLeft: '4px solid #f59e0b' } : {}) }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", display: 'flex', alignItems: 'center', gap: 6 }}>
              {currentPriority === 'P0' && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#E24B4A', display: 'inline-block' }} className="animate-pulse" />}
              {lead.username.startsWith("@") ? "" : "@"}{lead.username}
            </span>
            <PriorityBadge priority={currentPriority} size="sm" onClick={() => {
              const order: any[] = ['P0', 'P1', 'P2', 'P3'];
              const idx = order.indexOf(currentPriority);
              updateLead(lead._id, { priority: order[(idx + 1) % 4] });
            }} />
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
            {lead.hasWebsite === "yes" && (
              <span className="badge" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
                <Globe size={10} /> Has site
              </span>
            )}
            {lead.hasWebsite === "bad" && (
              <span className="badge" style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}>
                <Globe size={10} /> Bad site
              </span>
            )}
            {lead.ai_score !== undefined && (
              <span className="badge" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', border: '1px solid rgba(139,92,246,0.2)' }} title={lead.ai_score_reason}>
                AI Score: {lead.ai_score}
              </span>
            )}
            {lead.follow_up_due && !isOverdue && (
              <span className="badge" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.2)' }}>
                Follow-up: {followUpLabel}
              </span>
            )}
            {isOverdue && (
              <span className="badge" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                Overdue follow-up
              </span>
            )}
          </div>
          {lead.notes && (
            <div style={{ marginBottom: 8, padding: "8px 10px", background: "var(--bg-overlay)", borderRadius: 6, borderLeft: "3px solid var(--accent)" }}>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, color: "var(--text-muted)", marginBottom: 4 }}>
                Bio / Description
              </div>
              <p style={{ fontSize: 12.5, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>
                {lead.notes}
              </p>
            </div>
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
          <button className="btn-icon" onClick={handleBench} title="Move to Bench">
            <Archive size={14} />
          </button>
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
);
LeadCard.displayName = 'LeadCard';

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
function LeadsPageContent() {
  const [filterStage, setFilterStage] = useState("all");
  const [filterNiche, setFilterNiche] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | undefined>();

  const { leads, isLoading } = useLeads({ stage: filterStage, niche: filterNiche, search });
  
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams?.get("new") === "true") {
      setShowModal(true);
      router.replace("/leads");
    }
  }, [searchParams, router]);

  const handleEdit = (lead: Lead) => { setEditingLead(lead); setShowModal(true); };
  const handleClose = () => { setShowModal(false); setEditingLead(undefined); };

  const sortedFilteredLeads = useMemo(() => {
    let list = leads;
    if (filterPriority !== 'all') {
      list = list.filter(l => (l.priority || 'P3') === filterPriority);
    }
    
    // exclude bench from main list if we are not explicitly searching or something? 
    // actually just exclude bench since they are shown in bench
    list = list.filter(l => !l.on_bench);

    // Sort: P0 > P1 > P2 > P3 > updatedAt desc
    const pWeight: Record<string, number> = { 'P0': 4, 'P1': 3, 'P2': 2, 'P3': 1 };
    list.sort((a, b) => {
      const wa = pWeight[a.priority || 'P3'] || 1;
      const wb = pWeight[b.priority || 'P3'] || 1;
      if (wa !== wb) return wb - wa;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return list;
  }, [leads, filterPriority]);

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
          
          <select className="form-control" style={{ width: "auto" }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
            <option value="all">All Priorities</option>
            <option value="P0">P0 (Critical)</option>
            <option value="P1">P1 (Hot)</option>
            <option value="P2">P2 (Warm)</option>
            <option value="P3">P3 (Cold)</option>
          </select>

          <select className="form-control" style={{ width: "auto" }} value={filterStage} onChange={e => setFilterStage(e.target.value)}>
            <option value="all">All stages</option>
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>

          <select className="form-control" style={{ width: "auto" }} value={filterNiche} onChange={e => setFilterNiche(e.target.value)}>
            <option value="all">All niches</option>
            {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        {(filterStage !== "all" || filterNiche !== "all" || filterPriority !== "all" || search) && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setFilterStage("all"); setFilterNiche("all"); setFilterPriority("all"); setSearch(""); }}>
            <X size={12} /> Clear
          </button>
        )}
      </div>

      {/* Lead list */}
      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
          <Loader2 size={24} className="spinner" color="var(--text-muted)" />
        </div>
      ) : sortedFilteredLeads.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><ExternalLink size={32} /></div>
          <div className="empty-state-title">No leads yet</div>
          <div className="empty-state-sub">Adjust your filters or add a new lead.</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={14} /> Add your first lead
          </button>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          {sortedFilteredLeads.map(lead => (
            <LeadCard key={lead._id} lead={lead} onEdit={handleEdit} />
          ))}
        </AnimatePresence>
      )}

      {/* The Bench */}
      <TheBench leads={leads} />

      {/* Modal */}
      <AnimatePresence>
        {showModal && <LeadModal lead={editingLead} onClose={handleClose} />}
      </AnimatePresence>
    </div>
  );
}

export default function LeadsPage() {
  return (
    <Suspense
      fallback={
        <div style={{ paddingTop: 24 }}>
          <div className="card">Loading leads...</div>
        </div>
      }
    >
      <LeadsPageContent />
    </Suspense>
  );
}
