-- Add missing columns to leads table for extension support
-- This migration adds user_id, priority, source, and estimated_value columns

ALTER TABLE leads
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'P3',
ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'other',
ADD COLUMN IF NOT EXISTS estimated_value NUMERIC;

-- Create index for user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_user_username ON leads(user_id, username);
