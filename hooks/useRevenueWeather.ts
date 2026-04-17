import { useMemo } from 'react';
import { Lead } from './useLeads';
import { Project } from './useProjects';
import { RevenueWeatherData } from '@/lib/types';

const CLOSE_PROBABILITY: Record<string, number> = {
  call:      0.55,
  qualified: 0.30,
  replied:   0.15,
  dm_sent:   0.05,
};

export function useRevenueWeather(leads: Lead[], projects: Project[]): RevenueWeatherData {
  return useMemo(() => {
    let totalExpected = 0;
    
    // 1. For each active lead with estimated_value > 0
    leads.filter(l => l.stage !== 'client' && l.stage !== 'lost' && !l.on_bench).forEach(lead => {
      const estimatedValue = lead.estimated_value || 0;
      const prob = CLOSE_PROBABILITY[lead.stage] ?? 0;
      totalExpected += (estimatedValue * prob);
    });

    // 4. Confirmed pipeline
    const confirmedPipeline = projects
      .filter(p => p.status !== 'paid')
      .reduce((sum, p) => {
        const remaining = (p.budget || 0) - (p.paid_amount || 0);
        return sum + Math.max(0, remaining);
      }, 0);

    // 5. Earned to date
    const earnedToDate = projects.reduce((sum, p) => {
      const paidAmount = p.paid_amount || 0;

      // Backward compatibility: if old rows mark project as paid but paid_amount wasn't tracked,
      // treat full budget as earned so dashboard reflects real earnings.
      if (p.status === 'paid' && paidAmount === 0) {
        return sum + (p.budget || 0);
      }

      return sum + paidAmount;
    }, 0);

    return {
      conservative: Math.round(totalExpected * 0.6),
      likely: Math.round(totalExpected * 1.0),
      optimistic: Math.round(totalExpected * 1.4),
      confirmedPipeline,
      earnedToDate
    };
  }, [leads, projects]);
}
