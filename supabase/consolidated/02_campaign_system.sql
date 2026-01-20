-- 1. Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    preferred_run_time TEXT DEFAULT '09:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES auth.users(id)
);

-- Ensure preferred_run_time exists even if table was created before this column was added
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS preferred_run_time TEXT DEFAULT '09:00';

-- 2. Campaign Steps Table
CREATE TABLE IF NOT EXISTS public.campaign_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    delay_days INTEGER DEFAULT 0 NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Campaign Subscriptions Table
CREATE TABLE IF NOT EXISTS public.campaign_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    current_step_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
    last_email_sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    next_run_at TIMESTAMP WITH TIME ZONE
);

-- 4. Campaign Events Table (Analytics)
CREATE TABLE IF NOT EXISTS public.campaign_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    step_id UUID REFERENCES public.campaign_steps(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sent', 'opened', 'clicked', 'converted', 'bounced', 'complained')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign_id ON public.campaign_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_campaign_id ON public.campaign_subscriptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_status ON public.campaign_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_next_run_at ON public.campaign_subscriptions(next_run_at);
CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_id ON public.campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_lead_id ON public.campaign_events(lead_id);

-- 6. Enable RLS
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

-- 7. Base Policies (Placeholder - See Organization RLS for advanced sharing)
DROP POLICY IF EXISTS "Allow authenticated full access to campaigns" ON public.campaigns;
CREATE POLICY "Allow authenticated full access to campaigns" ON public.campaigns
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access to campaign_steps" ON public.campaign_steps;
CREATE POLICY "Allow authenticated full access to campaign_steps" ON public.campaign_steps
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access to campaign_subscriptions" ON public.campaign_subscriptions;
CREATE POLICY "Allow authenticated full access to campaign_subscriptions" ON public.campaign_subscriptions
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated full access to campaign_events" ON public.campaign_events;
CREATE POLICY "Allow authenticated full access to campaign_events" ON public.campaign_events
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
