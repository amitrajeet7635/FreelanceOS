import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const SHORTCUTS = [
  { key: 'D', label: 'Dashboard' },
  { key: 'L', label: 'Leads' },
  { key: 'P', label: 'Pipeline' },
  { key: 'J', label: 'Projects' },
  { key: 'C', label: 'Calendar' },
  { key: 'A', label: 'AI Studio' },
  { key: 'E', label: 'Toggle Energy Mode' },
  { key: 'N', label: 'Add Lead (on leads pages)' },
  { key: 'F', label: 'Focus Search' },
  { key: '?', label: 'Show this menu' },
  { key: 'Esc', label: 'Close modals/search' },
];

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="modal-overlay"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ zIndex: 9999, position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 20, opacity: 0, scale: 0.95 }}
        className="card"
        style={{ width: '100%', maxWidth: 400, position: 'relative' }}
      >
        <button className="btn-icon" onClick={onClose} style={{ position: 'absolute', top: 16, right: 16 }}>
          <X size={16} />
        </button>
        
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Keyboard Shortcuts</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SHORTCUTS.map(sc => (
            <div key={sc.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-subtle)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>{sc.label}</span>
              <kbd style={{ background: 'var(--bg-overlay)', padding: '2px 6px', borderRadius: 4, border: '1px solid var(--border-subtle)', fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
