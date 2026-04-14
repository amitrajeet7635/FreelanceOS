import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lead, updateLead } from '@/hooks/useLeads';
import { formatRelative } from '@/lib/utils';
import { ArchiveRestore, Trash2, Clock, ChevronDown, ChevronUp } from 'lucide-react';

export function TheBench({ leads }: { leads: Lead[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const benchedLeads = leads.filter(l => l.on_bench);

  if (benchedLeads.length === 0) return null;

  const handleRevive = (lead: Lead) => {
    updateLead(lead._id, { on_bench: false });
  };

  const handleDiscard = (lead: Lead) => {
    updateLead(lead._id, { stage: 'lost', on_bench: false });
  };

  const handleSnooze = (lead: Lead) => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    updateLead(lead._id, { bench_review_at: d.toISOString().split('T')[0] });
  };

  return (
    <div style={{ marginTop: 32, borderTop: '1px solid var(--border-subtle)', paddingTop: 16 }}>
      <button 
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        Show Bench ({benchedLeads.length})
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden', marginTop: 16 }}
          >
            <div className="grid-3" style={{ gap: 12 }}>
              {benchedLeads.map(lead => (
                <div key={lead._id} className="card" style={{ opacity: 0.8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>@{lead.username}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.niche}</div>
                    </div>
                    <div style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'var(--bg-overlay)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}>
                      {lead.stage}
                    </div>
                  </div>
                  
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 12 }}>
                    Benched {formatRelative(lead.updatedAt)}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm btn-primary" style={{ flex: 1 }} onClick={() => handleRevive(lead)}>
                      <ArchiveRestore size={12} /> Revive
                    </button>
                    <button className="btn btn-sm btn-secondary" onClick={() => handleSnooze(lead)} title="Snooze 30 days">
                      <Clock size={12} />
                    </button>
                    <button className="btn btn-sm btn-secondary" style={{ color: 'var(--danger)' }} onClick={() => handleDiscard(lead)} title="Discard (Lost)">
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
