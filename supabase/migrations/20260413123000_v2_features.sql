-- ═══════════════════════════════════════════════════════════════
-- FreelanceOS v2 — New columns and tables
-- ═══════════════════════════════════════════════════════════════

-- ─── Add new columns to existing leads table ───────────────────
-- (Only run if these columns don't already exist)

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS priority        TEXT DEFAULT 'P3'
                                           CHECK (priority IN ('P0','P1','P2','P3')),
  ADD COLUMN IF NOT EXISTS estimated_value INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dm_sent_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS replied_at      TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_due   DATE,
  ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS on_bench        BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS bench_review_at DATE,
  ADD COLUMN IF NOT EXISTS source          TEXT DEFAULT 'instagram_hashtag',
  ADD COLUMN IF NOT EXISTS tags            TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_score        INTEGER,
  ADD COLUMN IF NOT EXISTS ai_score_reason TEXT,
  ADD COLUMN IF NOT EXISTS display_name    TEXT;

-- ─── Add new columns to existing projects table ────────────────

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS paid_amount        INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_structure  TEXT DEFAULT '50/50'
                                              CHECK (payment_structure IN
                                                ('50/50','100_upfront','milestone','custom')),
  ADD COLUMN IF NOT EXISTS start_date         DATE,
  ADD COLUMN IF NOT EXISTS delivery_date      DATE,
  ADD COLUMN IF NOT EXISTS milestones         JSONB DEFAULT '[]';

-- ─── New table: calendar_events ────────────────────────────────

CREATE TABLE IF NOT EXISTS calendar_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  event_date       DATE NOT NULL,
  event_time       TIME,
  type             TEXT NOT NULL DEFAULT 'custom'
                   CHECK (type IN ('followup','call','deadline','payment','outreach','custom')),
  linked_lead_id   UUID REFERENCES leads(id) ON DELETE SET NULL,
  linked_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  priority         TEXT CHECK (priority IN ('P0','P1','P2','P3')),
  done             BOOLEAN DEFAULT FALSE,
  color            TEXT DEFAULT '#378ADD',
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar events"
  ON calendar_events FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── New table: daily_logs ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS daily_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  log_date          DATE NOT NULL,
  dms               INTEGER DEFAULT 0,
  replies           INTEGER DEFAULT 0,
  leads_qualified   INTEGER DEFAULT 0,
  calls_booked      INTEGER DEFAULT 0,
  clients_closed    INTEGER DEFAULT 0,
  revenue_earned    INTEGER DEFAULT 0,
  note              TEXT DEFAULT '',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, log_date)
);

ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own daily logs"
  ON daily_logs FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── New table: ai_usage_log (rate limiting) ───────────────────

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,  -- 'generate_dm' | 'score_leads' | 'weekly_report'
  tokens_used INTEGER DEFAULT 0,
  used_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI usage"
  ON ai_usage_log FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── Indexes for performance ────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_leads_priority ON leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_stage ON leads(stage);
CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_due);
CREATE INDEX IF NOT EXISTS idx_leads_on_bench ON leads(on_bench);
CREATE INDEX IF NOT EXISTS idx_calendar_user_date ON calendar_events(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, log_date);
CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_log(user_id, used_at);
