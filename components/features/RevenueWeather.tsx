import { Lead } from '@/hooks/useLeads';
import { Project } from '@/hooks/useProjects';
import { useRevenueWeather } from '@/hooks/useRevenueWeather';
import { formatCurrency } from '@/lib/utils';
import { Cloud, CloudSun, Sun, Info } from 'lucide-react';

export function RevenueWeather({ leads, projects }: { leads: Lead[], projects: Project[] }) {
  const weather = useRevenueWeather(leads, projects);

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Revenue Weather</h3>
        <div title="Based on lead probability and confirmed pipeline" style={{ cursor: 'help', color: 'var(--text-muted)' }}>
          <Info size={14} />
        </div>
      </div>
      
      <div className="grid-3" style={{ gap: 12 }}>
        <div style={{ padding: 12, borderRadius: 8, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#3b82f6', fontSize: 12, fontWeight: 500 }}>
            <Cloud size={14} /> Conservative
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(weather.conservative)}</div>
        </div>
        
        <div style={{ padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#f59e0b', fontSize: 12, fontWeight: 500 }}>
            <CloudSun size={14} /> Likely
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(weather.likely)}</div>
        </div>
        
        <div style={{ padding: 12, borderRadius: 8, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, color: '#10b981', fontSize: 12, fontWeight: 500 }}>
            <Sun size={14} /> Optimistic
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(weather.optimistic)}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ color: 'var(--text-muted)' }}>Confirmed: <b style={{ color: 'var(--text-primary)' }}>{formatCurrency(weather.confirmedPipeline)}</b></span>
        <span style={{ color: 'var(--text-muted)' }}>Earned: <b style={{ color: 'var(--text-primary)' }}>{formatCurrency(weather.earnedToDate)}</b></span>
      </div>
    </div>
  );
}
