-- Migration: Add parent_quote_id and missing columns to quotes table
-- This enables multi-quote comparison feature

-- Add parent_quote_id for linking comparison quotes to their primary quote
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS parent_quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE;

-- Add missing columns that may not exist
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS broker_fee NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS broker_fee_percent NUMERIC;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS prepay_penalty TEXT;
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS credit_score TEXT;

-- Create index for efficient lookup of comparison quotes
CREATE INDEX IF NOT EXISTS idx_quotes_parent_quote_id ON quotes(parent_quote_id);

-- Update RLS to ensure users can only see their own comparison quotes
-- (existing RLS should handle this since user_id is still required)
