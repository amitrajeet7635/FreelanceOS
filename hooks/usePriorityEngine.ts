import { Lead } from "./useLeads";
import { Priority } from "@/lib/types";

export function computeAutoPriority(lead: Lead): Priority {
  const now = new Date();
  const repliedAt = lead.replied_at ? new Date(lead.replied_at) : null;
  const hoursSinceReply = repliedAt ? (now.getTime() - repliedAt.getTime()) / 3600000 : Infinity;

  // Rule 1: Replied very recently → P0 (needs immediate response)
  if (lead.stage === 'replied' && hoursSinceReply < 4) return 'P0';

  // Rule 2: Replied but not yet qualified → P1
  if (lead.stage === 'replied') return 'P1';

  // Rule 3: Qualified or call booked → P1
  if (lead.stage === 'qualified' || lead.stage === 'call') return 'P1';

  // Rule 4: DM sent and follow-up is overdue → P2
  const followUpDue = lead.follow_up_due ? new Date(lead.follow_up_due) : null;
  if (lead.stage === 'dm_sent' && followUpDue && followUpDue <= now) return 'P2';

  // Rule 5: Default
  return lead.priority || 'P3';
}
