-- Run this in the Supabase SQL editor before running the scraper.

CREATE TABLE IF NOT EXISTS pool_timetables (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id       text        NOT NULL,
  day_of_week   text        NOT NULL,   -- 'Monday' … 'Sunday'
  start_time    time        NOT NULL,   -- '06:30:00'
  end_time      time        NOT NULL,   -- '21:30:00'
  activity_name text,                   -- e.g. 'Lane Swimming (Adults)'
  scraped_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pool_timetables_pool_id
  ON pool_timetables (pool_id);

CREATE INDEX IF NOT EXISTS idx_pool_timetables_day
  ON pool_timetables (pool_id, day_of_week);

-- Enable RLS
ALTER TABLE pool_timetables ENABLE ROW LEVEL SECURITY;

-- Anyone can read timetables (matches the rest of the app)
CREATE POLICY "public read timetables"
  ON pool_timetables FOR SELECT
  USING (true);

-- INSERT / DELETE are only executed by the scraper, which uses the service role key.
-- The service role bypasses RLS, so no explicit write policy is needed.
