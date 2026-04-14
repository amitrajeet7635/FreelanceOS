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
      .reduce((sum, p) => sum + (p.budget - (p.paid_amount || 0)), 0);

    // 5. Earned to date
    const earnedToDate = projects.reduce((sum, p) => sum + (p.paid_amount || 0), 0);

    return {
      conservative: Math.round(totalExpected * 0.6),
      likely: Math.round(totalExpected * 1.0),
      optimistic: Math.round(totalExpected * 1.4),
      confirmedPipeline,
      earnedToDate
    };
  }, [leads, projects]);
}
