import { useMemo } from 'react';
import { Lead } from './useLeads';
import { Project } from './useProjects';
import { DailyLog, ActionQueueItem } from '@/lib/types';
import { todayISO } from '@/lib/utils';

export function useActionQueue(leads: Lead[], projects: Project[], dailyLog?: DailyLog): ActionQueueItem[] {
  return useMemo(() => {
    const queue: ActionQueueItem[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Leads where priority === 'P0' -> type respond_p0
    leads.filter(l => l.priority === 'P0').forEach(l => {
      const hours = l.replied_at ? Math.floor((new Date().getTime() - new Date(l.replied_at).getTime()) / 3600000) : 0;
      queue.push({
        id: l._id + '_p0',
        type: 'respond_p0',
        title: `Respond to @${l.username}`,
        description: `Replied ${hours} hrs ago`,
        urgency: 'critical',
        linkedLeadId: l._id,
        doneKey: `done_p0_${l._id}_${todayISO()}`
      });
    });

    // 2. Leads where stage === 'dm_sent' AND follow_up_due <= today -> type followup_dm
    leads.filter(l => l.stage === 'dm_sent' && l.follow_up_due && new Date(l.follow_up_due) <= today).forEach(l => {
      const days = l.dmSentAt ? Math.floor((new Date().getTime() - new Date(l.dmSentAt).getTime()) / 86400000) : 0;
      queue.push({
        id: l._id + '_followup',
        type: 'followup_dm',
        title: `Follow-up DM: @${l.username}`,
        description: `Sent ${days} days ago`,
        urgency: 'high',
        linkedLeadId: l._id,
        doneKey: `done_followup_${l._id}_${todayISO()}`
      });
    });

    // 3. Leads where stage === 'replied' -> type qualify_lead
    leads.filter(l => l.stage === 'replied' && l.priority !== 'P0').forEach(l => {
      queue.push({
        id: l._id + '_qualify',
        type: 'qualify_lead',
        title: `Qualify @${l.username}`,
        description: `Ask about budget and timeline`,
        urgency: 'medium',
        linkedLeadId: l._id,
        doneKey: `done_qualify_${l._id}_${todayISO()}`
      });
    });

    // 4. Projects where deadline is within 48 hours -> type delivery_due
    projects.filter(p => p.deadline && p.status !== 'delivered' && p.status !== 'paid').forEach(p => {
      // @ts-ignore
      const hours = Math.floor((new Date(p.deadline).getTime() - new Date().getTime()) / 3600000);
      if (hours <= 48 && hours >= 0) {
        queue.push({
          id: p._id + '_delivery',
          type: 'delivery_due',
          title: `Delivery due: ${p.client}`,
          description: `${p.service} in ${hours} hours`,
          urgency: 'critical',
          linkedProjectId: p._id,
          doneKey: `done_delivery_${p._id}_${todayISO()}`
        });
      }
    });

    // 5. Projects where status === 'delivered' AND paid_amount < budget -> type chase_payment
    projects.filter(p => p.status === 'delivered' && p.paid_amount !== undefined && p.paid_amount < p.budget).forEach(p => {
      queue.push({
        id: p._id + '_payment',
        type: 'chase_payment',
        title: `Chase payment: ${p.client}`,
        description: `₹${p.budget - (p.paid_amount || 0)} outstanding`,
        urgency: 'high',
        linkedProjectId: p._id,
        doneKey: `done_payment_${p._id}_${todayISO()}`
      });
    });

    // 6. Leads where stage === 'client' with no linked project -> type create_project
    const leadIdsWithProjects = new Set(projects.map(p => p.leadId).filter(Boolean));
    leads.filter(l => l.stage === 'client' && !leadIdsWithProjects.has(l._id)).forEach(l => {
      queue.push({
        id: l._id + '_create_proj',
        type: 'create_project',
        title: `Create project`,
        description: `For @${l.username}`,
        urgency: 'medium',
        linkedLeadId: l._id,
        doneKey: `done_create_proj_${l._id}_${todayISO()}`
      });
    });

    // 7. Bench leads where bench_review_at <= today -> type bench_review
    leads.filter(l => l.on_bench && l.bench_review_at && new Date(l.bench_review_at) <= today).forEach(l => {
      queue.push({
        id: l._id + '_bench',
        type: 'bench_review',
        title: `Check in: @${l.username}`,
        description: `Benched lead review due`,
        urgency: 'low',
        linkedLeadId: l._id,
        doneKey: `done_bench_${l._id}_${todayISO()}`
      });
    });

    return queue.slice(0, 10);
  }, [leads, projects, dailyLog]);
}
