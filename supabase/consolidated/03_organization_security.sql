-- 1. Organization Context Function
CREATE OR REPLACE FUNCTION public.get_organization_id()
RETURNS UUID AS $$
    SELECT COALESCE(
        (SELECT parent_id FROM public.profiles WHERE id = auth.uid()),
        auth.uid()
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 2. Shared Data Policies (Quotes)
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can insert own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can update own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can delete own quotes" ON public.quotes;
DROP POLICY IF EXISTS "Users can manage own quotes" ON public.quotes;

CREATE POLICY "Users can manage shared quotes" ON public.quotes
    FOR ALL TO authenticated
    USING (user_id = public.get_organization_id())
    WITH CHECK (user_id = public.get_organization_id());

-- 3. Shared Data Policies (Investors)
DROP POLICY IF EXISTS "Users can view own investors" ON public.investors;
DROP POLICY IF EXISTS "Users can insert own investors" ON public.investors;
DROP POLICY IF EXISTS "Users can update own investors" ON public.investors;
DROP POLICY IF EXISTS "Users can delete own investors" ON public.investors;
DROP POLICY IF EXISTS "Users can manage own investors" ON public.investors;

CREATE POLICY "Users can manage shared investors" ON public.investors
    FOR ALL TO authenticated
    USING (user_id = public.get_organization_id())
    WITH CHECK (user_id = public.get_organization_id());

-- 4. Shared Data Policies (Campaigns)
DROP POLICY IF EXISTS "Users can manage shared campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Allow authenticated full access to campaigns" ON public.campaigns;
CREATE POLICY "Users can manage shared campaigns" ON public.campaigns
    FOR ALL TO authenticated
    USING (user_id = public.get_organization_id())
    WITH CHECK (user_id = public.get_organization_id());

-- 5. Dependent Policies (Subscriptions, Steps, Events)
DROP POLICY IF EXISTS "Users can manage shared subscriptions" ON public.campaign_subscriptions;
DROP POLICY IF EXISTS "Allow authenticated full access to campaign_subscriptions" ON public.campaign_subscriptions;
CREATE POLICY "Users can manage shared subscriptions" ON public.campaign_subscriptions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c 
            WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can manage shared steps" ON public.campaign_steps;
DROP POLICY IF EXISTS "Allow authenticated full access to campaign_steps" ON public.campaign_steps;
CREATE POLICY "Users can manage shared steps" ON public.campaign_steps
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c 
            WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()
        )
    );

DROP POLICY IF EXISTS "Users can manage shared events" ON public.campaign_events;
DROP POLICY IF EXISTS "Allow authenticated full access to campaign_events" ON public.campaign_events;
CREATE POLICY "Users can manage shared events" ON public.campaign_events
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c 
            WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()
        )
    );
