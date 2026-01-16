-- Create campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id)
);

-- Create campaign_steps table
CREATE TABLE IF NOT EXISTS public.campaign_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    delay_days INTEGER DEFAULT 0 NOT NULL, -- Days to wait after the previous step (or start)
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create campaign_subscriptions table (links leads to campaigns)
CREATE TABLE IF NOT EXISTS public.campaign_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    current_step_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
    last_email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    next_run_at TIMESTAMP WITH TIME ZONE -- Helper to query efficiently
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign_id ON public.campaign_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_campaign_id ON public.campaign_subscriptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_status ON public.campaign_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_next_run_at ON public.campaign_subscriptions(next_run_at);

-- Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_subscriptions ENABLE ROW LEVEL SECURITY;

-- Simple policies (allow all for authenticated users for now, to be refined)
CREATE POLICY "Allow authenticated full access to campaigns" ON public.campaigns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to campaign_steps" ON public.campaign_steps
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated full access to campaign_subscriptions" ON public.campaign_subscriptions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
