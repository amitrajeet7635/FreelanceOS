-- ══════════════════════════════════════════════════════════════════════════
-- FreelanceOS — RLS Policies Setup
-- Since you've enabled Supabase Authentication (locking the app behind a login), 
-- you must also configure the database's Row Level Security (RLS) to allow 
-- your authenticated user to read and write data.
--
-- Run this script in your Supabase project: Dashboard → SQL Editor → New Query
-- ══════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE leads         ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects      ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings      ENABLE ROW LEVEL SECURITY;

-- Create policies for the "leads" table
CREATE POLICY "Allow full access to authenticated users on leads"
  ON leads FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for the "projects" table  
CREATE POLICY "Allow full access to authenticated users on projects"
  ON projects FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for the "daily_entries" table
CREATE POLICY "Allow full access to authenticated users on daily_entries"
  ON daily_entries FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for the "notes" table
CREATE POLICY "Allow full access to authenticated users on notes"
  ON notes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for the "settings" table
CREATE POLICY "Allow full access to authenticated users on settings"
  ON settings FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
