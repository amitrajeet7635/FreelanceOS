-- ══════════════════════════════════════════════════════════════════════════
-- FreelanceOS — Supabase Schema
-- Run this in your Supabase project: Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════════════

-- ── Leads ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leads (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  username      TEXT        NOT NULL,
  niche         TEXT        NOT NULL,
  followers     TEXT,
  has_website   TEXT        NOT NULL DEFAULT 'no' CHECK (has_website IN ('no','yes','bad')),
  notes         TEXT,
  ig_link       TEXT,
  stage         TEXT        NOT NULL DEFAULT 'found',
  dm_sent_at    TIMESTAMPTZ,
  stage_history JSONB       NOT NULL DEFAULT '[]',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Projects ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  client     TEXT        NOT NULL,
  service    TEXT        NOT NULL,
  budget     INTEGER     NOT NULL DEFAULT 0,
  deadline   TIMESTAMPTZ,
  status     TEXT        NOT NULL DEFAULT 'in_progress',
  notes      TEXT,
  lead_id    UUID        REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Daily Entries ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_entries (
  id      UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  date    TEXT    UNIQUE NOT NULL,   -- ISO date string e.g. "2025-04-12"
  dms     INTEGER NOT NULL DEFAULT 0,
  replies INTEGER NOT NULL DEFAULT 0,
  leads   INTEGER NOT NULL DEFAULT 0,
  calls   INTEGER NOT NULL DEFAULT 0
);

-- ── Notes (singleton row) ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notes (
  id         TEXT        PRIMARY KEY DEFAULT 'singleton',
  content    TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO notes (id, content) VALUES ('singleton', '')
  ON CONFLICT (id) DO NOTHING;

-- ── Settings (singleton row) ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS settings (
  id             TEXT        PRIMARY KEY DEFAULT 'singleton',
  weekly_dms     INTEGER     NOT NULL DEFAULT 105,
  weekly_replies INTEGER     NOT NULL DEFAULT 18,
  weekly_leads   INTEGER     NOT NULL DEFAULT 50,
  weekly_clients INTEGER     NOT NULL DEFAULT 2,
  daily_dms      INTEGER     NOT NULL DEFAULT 15,
  daily_replies  INTEGER     NOT NULL DEFAULT 3,
  daily_leads    INTEGER     NOT NULL DEFAULT 2,
  daily_calls    INTEGER     NOT NULL DEFAULT 1,
  currency       TEXT        NOT NULL DEFAULT '₹',
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO settings (id) VALUES ('singleton')
  ON CONFLICT (id) DO NOTHING;

-- ── Auto-update updated_at trigger ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leads_updated_at    ON leads;
DROP TRIGGER IF EXISTS projects_updated_at ON projects;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Row Level Security (optional but recommended) ─────────────────────────────
-- Since this is a personal tool with no login, disable RLS or allow all:
ALTER TABLE leads         DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects      DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes         DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings      DISABLE ROW LEVEL SECURITY;
