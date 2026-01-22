-- Add lender_code column to quotes table
ALTER TABLE public.quotes 
ADD COLUMN IF NOT EXISTS lender_code text;

-- Update RLS policies if necessary (usually not needed for new columns if policy is on row level)
-- But good to be safe and explicitly allow access if policies select specific columns (ours select *)
