-- Adds source + plan_summary to cupboard_interest so leads from the Startup
-- Guide (start.cupboard.cc) carry their guide answers into the notification.
-- Project: oghneyjipbhyiffihewo. Run in the Supabase SQL Editor. Idempotent.
-- Existing waitlist inserts are unaffected — both columns nullable.

ALTER TABLE cupboard_interest
  ADD COLUMN IF NOT EXISTS source TEXT,
  ADD COLUMN IF NOT EXISTS plan_summary TEXT;

-- Verify
SELECT source, plan_summary FROM cupboard_interest LIMIT 1;
