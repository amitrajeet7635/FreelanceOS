"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useLeads } from '@/hooks/useLeads';
import { Sparkles, Check, Copy } from 'lucide-react';

export default function AIStudioPage() {
  const [tab, setTab] = useState<'dm' | 'scorer' | 'niche' | 'weekly'>('dm');
  const { leads } = useLeads();
  const [selectedLead, setSelectedLead] = useState('');
  const [dmType, setDmType] = useState('opening');
  const [extraContext, setExtraContext] = useState('');
  const [generatedDM, setGeneratedDM] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerateDM = async () => {
    if (!selectedLead) return alert("Select a lead");
    setLoading(true);
    const res = await fetch('/api/ai/generate-dm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ leadId: selectedLead, dmType, extraContext })
    });
    const data = await res.json();
    setLoading(false);
    if (data.error) alert(data.error);
    else setGeneratedDM(data.dm);
  };

  const copy = () => {
    navigator.clipboard.writeText(generatedDM);
    alert('Copied to clipboard!');
  };

  return (
    <div style={{ padding: '24px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={20} color="#8b5cf6" />
        </div>
        <div>
          <h1 className="page-title">AI Studio</h1>
          <div className="page-sub">Powered by Claude 3</div>
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: 16, borderBottom: '1px solid var(--border-subtle)', marginBottom: 24 }}>
        {(['dm', 'scorer', 'niche', 'weekly'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '8px 4px', background: 'none', border: 'none', outline: 'none',
              cursor: 'pointer', fontSize: 14, fontWeight: 500,
              color: tab === t ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: tab === t ? '2px solid #8b5cf6' : '2px solid transparent'
            }}
          >
            {t === 'dm' ? 'DM Generator' : t === 'scorer' ? 'Lead Scorer' : t === 'niche' ? 'Niche Analyzer' : 'Weekly Report'}
          </button>
        ))}
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={tab}>
        {tab === 'dm' && (
          <div className="grid-2">
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Configure Prompt</h3>
              
              <div className="form-group">
                <label className="form-label">Select Lead</label>
                <select className="form-control" value={selectedLead} onChange={e => setSelectedLead(e.target.value)}>
                  <option value="">-- Choose lead --</option>
                  {leads.map(l => <option key={l._id} value={l._id}>@{l.username}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">DM Type</label>
                <select className="form-control" value={dmType} onChange={e => setDmType(e.target.value)}>
                  <option value="opening">Opening</option>
                  <option value="followup_d3">Follow-up Day 3</option>
                  <option value="followup_d7">Follow-up Day 7</option>
                  <option value="closing">Closing (Breakup)</option>
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Extra Context (Optional)</label>
                <textarea className="form-control" placeholder="e.g. they sell modern furniture, based in NY..." value={extraContext} onChange={e => setExtraContext(e.target.value)} />
              </div>

              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleGenerateDM} disabled={loading || !selectedLead}>
                {loading ? 'Generating...' : 'Generate DM ✨'}
              </button>
            </div>

            <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Generated Output</h3>
              {generatedDM ? (
                <>
                  <div style={{ flex: 1, background: 'var(--bg-overlay)', padding: 16, borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.6, border: '1px solid var(--border-subtle)', marginBottom: 16 }}>
                    {generatedDM}
                  </div>
                  <button className="btn btn-secondary" onClick={copy}>
                    <Copy size={14} /> Copy to Clipboard
                  </button>
                </>
              ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
                  Select a lead and generate...
                </div>
              )}
            </div>
          </div>
        )}

        {/* Similar stubs for other tabs would be here */}
        {tab !== 'dm' && (
          <div className="card">
            <div className="empty-state">
              <div className="empty-state-title">{tab} feature coming soon</div>
              <div className="empty-state-sub">Part of the AI Studio expansion.</div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
