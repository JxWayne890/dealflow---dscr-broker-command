-- Add timezone to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- Add preferred run time to campaigns
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS preferred_run_time TEXT DEFAULT '09:00';
