-- Migration: Add origination_fee_percent to quotes table
-- This enables percentage-based origination fee input

ALTER TABLE quotes ADD COLUMN IF NOT EXISTS origination_fee_percent NUMERIC;
