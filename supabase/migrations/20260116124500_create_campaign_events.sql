-- Create campaign_events table for detailed analytics
CREATE TABLE IF NOT EXISTS public.campaign_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    step_id UUID REFERENCES public.campaign_steps(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sent', 'opened', 'clicked', 'converted', 'bounced', 'complained')),
    metadata JSONB DEFAULT '{}'::jsonb, -- Store specific link clicked, user agent, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes for performance (querying events by lead or campaign is common)
CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_id ON public.campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_lead_id ON public.campaign_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_type ON public.campaign_events(type);
CREATE INDEX IF NOT EXISTS idx_campaign_events_created_at ON public.campaign_events(created_at);

-- Enable RLS
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated full access to campaign_events" ON public.campaign_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
