-- Add tracking columns to quotes table
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS next_contact_due TIMESTAMPTZ;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS workflow_step INTEGER DEFAULT 0;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS email_message_id TEXT;

-- Create an index for querying due follow-ups
CREATE INDEX IF NOT EXISTS idx_quotes_next_contact_due ON public.quotes(next_contact_due);
