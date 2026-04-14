export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string; bg: string; description: string }> = {
  P0: { label: 'P0', color: '#E24B4A', bg: '#FCEBEB', description: 'Critical — respond NOW' },
  P1: { label: 'P1', color: '#EF9F27', bg: '#FAEEDA', description: 'Hot — follow up today' },
  P2: { label: 'P2', color: '#378ADD', bg: '#E6F1FB', description: 'Warm — standard queue' },
  P3: { label: 'P3', color: '#888780', bg: '#F1EFE8', description: 'Cold — background batch' },
};

export interface CalendarEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string;          // YYYY-MM-DD
  event_time?: string;         // HH:MM
  type: 'followup' | 'call' | 'deadline' | 'payment' | 'outreach' | 'custom';
  linked_lead_id?: string;
  linked_project_id?: string;
  priority?: Priority;
  done: boolean;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface DailyLog {
  id: string;
  user_id: string;
  log_date: string;            // YYYY-MM-DD
  dms: number;
  replies: number;
  leads_qualified: number;
  calls_booked: number;
  clients_closed: number;
  revenue_earned: number;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface LeadV2Extensions {
  priority: Priority;
  estimated_value: number;
  dm_sent_at?: string;
  replied_at?: string;
  follow_up_due?: string;
  last_contact_at?: string;
  on_bench: boolean;
  bench_review_at?: string;
  source: string;
  tags: string[];
  ai_score?: number;
  ai_score_reason?: string;
  display_name?: string;
}

export interface ProjectV2Extensions {
  paid_amount: number;
  payment_structure: '50/50' | '100_upfront' | 'milestone' | 'custom';
  start_date?: string;
  delivery_date?: string;
  milestones: Array<{ id: string; title: string; dueDate: string; done: boolean }>;
}

export interface RevenueWeatherData {
  conservative: number;
  likely: number;
  optimistic: number;
  confirmedPipeline: number;
  earnedToDate: number;
}

export interface ActionQueueItem {
  id: string;
  type: 'respond_p0' | 'followup_dm' | 'qualify_lead' | 'delivery_due' | 
        'chase_payment' | 'create_project' | 'bench_review';
  title: string;
  description: string;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  linkedLeadId?: string;
  linkedProjectId?: string;
  doneKey: string;             // localStorage key for "marked done today"
}
