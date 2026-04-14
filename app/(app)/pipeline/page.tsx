"use client";

import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { motion } from "framer-motion";
import { useLeads, updateLead, Lead } from "@/hooks/useLeads";
import { STAGES, NEXT_STAGE } from "@/lib/constants";
import { ChevronRight, GripVertical, Instagram, Globe, Loader2 } from "lucide-react";
import { useState } from "react";
import { PriorityBadge } from "@/components/features/PriorityBadge";

function KanbanCard({
  lead,
  index,
}: {
  lead: Lead;
  index: number;
}) {
  const stage = STAGES.find(s => s.id === lead.stage)!;
  const nextId = NEXT_STAGE[lead.stage];
  const nextStage = nextId ? STAGES.find(s => s.id === nextId) : null;
  const pColors: Record<string, string> = { P0: '#E24B4A', P1: '#EF9F27', P2: '#378ADD', P3: 'transparent' };
  const borderColor = pColors[lead.priority || 'P3'] || 'transparent';

  return (
    <Draggable draggableId={lead._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          style={{
            ...provided.draggableProps.style,
            boxShadow: snapshot.isDragging ? "var(--shadow-lg)" : undefined,
            opacity: snapshot.isDragging ? 0.9 : 1,
          }}
        >
          <div className="kanban-card" style={borderColor !== 'transparent' ? { borderLeft: `4px solid ${borderColor}` } : {}}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
              <span
                {...provided.dragHandleProps}
                style={{ color: "var(--text-muted)", flexShrink: 0, marginTop: 1, cursor: "grab" }}
              >
                <GripVertical size={13} />
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="truncate">
                  <span>{lead.username.startsWith("@") ? "" : "@"}{lead.username}</span>
                  {(lead.priority && lead.priority !== 'P3') && <PriorityBadge priority={lead.priority} size="sm" />}
                </div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                  {lead.niche}
                  {lead.followers ? ` · ${lead.followers}` : ""}
                </div>
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {lead.hasWebsite === "no" && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, color: "#10b981" }}>
                      <Globe size={9} /> No site
                    </span>
                  )}
                  {lead.igLink && (
                    <a href={lead.igLink} target="_blank" rel="noreferrer"
                      style={{ color: "var(--text-muted)", display: "inline-flex", alignItems: "center" }}>
                      <Instagram size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
            {nextStage && (
              <button
                onClick={() => updateLead(lead._id, { stage: nextId! })}
                style={{
                  marginTop: 8, width: "100%", padding: "4px 0", borderRadius: 6,
                  border: `1px solid ${nextStage.border}`, background: nextStage.bg,
                  color: nextStage.color, fontSize: 11, fontWeight: 600,
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 3,
                }}
              >
                <ChevronRight size={11} /> {nextStage.label}
              </button>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}

export default function PipelinePage() {
  const { leads, isLoading } = useLeads();
  const [dragging, setDragging] = useState(false);

  const onDragEnd = async (result: DropResult) => {
    setDragging(false);
    const { draggableId, destination } = result;
    if (!destination) return;
    const newStage = destination.droppableId;
    const lead = leads.find(l => l._id === draggableId);
    if (!lead || lead.stage === newStage) return;
    await updateLead(draggableId, { stage: newStage });
  };

  const lostLeads = leads.filter(l => l.stage === "lost");

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}>
        <Loader2 size={24} className="spinner" color="var(--text-muted)" />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div className="page-title">Pipeline</div>
        <div className="page-sub">Drag and drop to move leads between stages</div>
      </div>

      <DragDropContext onDragStart={() => setDragging(true)} onDragEnd={onDragEnd}>
        <div className="kanban-board">
          {STAGES.filter(s => s.id !== "lost").map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage.id);
            return (
              <div key={stage.id} className="kanban-col">
                <div
                  className="kanban-col-header"
                  style={{ background: stage.bg, color: stage.color, border: `1px solid ${stage.border}` }}
                >
                  <span>{stage.label}</span>
                  <span style={{ opacity: 0.7, fontWeight: 400 }}>{stageLeads.length}</span>
                </div>

                <Droppable droppableId={stage.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1,
                        minHeight: 80,
                        padding: 2,
                        borderRadius: 10,
                        transition: "background 0.15s",
                        background: snapshot.isDraggingOver
                          ? stage.bg.replace("0.12", "0.2")
                          : "transparent",
                      }}
                    >
                      {stageLeads.map((lead, i) => (
                        <KanbanCard key={lead._id} lead={lead} index={i} />
                      ))}
                      {provided.placeholder}
                      {stageLeads.length === 0 && !dragging && (
                        <div className="kanban-empty">Empty</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {/* Lost leads */}
      {lostLeads.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginTop: 16 }}>
          <div className="section-label">Lost / Archived ({lostLeads.length})</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {lostLeads.map(l => (
              <span key={l._id} className="badge" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                @{l.username.replace("@", "")}
              </span>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
