-- Add organization-aware RLS policies
-- Assistants should be able to see data belonging to their parent_id (the admin)

-- Function to get the organization ID (either the user's ID if they are admin, or their parent_id)
CREATE OR REPLACE FUNCTION public.get_organization_id()
RETURNS UUID AS $$
    SELECT COALESCE(
        (SELECT parent_id FROM public.profiles WHERE id = auth.uid()),
        auth.uid()
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Update quotes policies
DROP POLICY IF EXISTS "Users can manage own quotes" ON public.quotes;
CREATE POLICY "Users can manage shared quotes" ON public.quotes
    FOR ALL TO authenticated
    USING (user_id = public.get_organization_id())
    WITH CHECK (user_id = public.get_organization_id());

-- Update investors policies
DROP POLICY IF EXISTS "Users can manage own investors" ON public.investors;
CREATE POLICY "Users can manage shared investors" ON public.investors
    FOR ALL TO authenticated
    USING (user_id = public.get_organization_id())
    WITH CHECK (user_id = public.get_organization_id());

-- Update campaigns policies
DROP POLICY IF EXISTS "Allow authenticated full access to campaigns" ON public.campaigns;
CREATE POLICY "Users can manage shared campaigns" ON public.campaigns
    FOR ALL TO authenticated
    USING (user_id = public.get_organization_id())
    WITH CHECK (user_id = public.get_organization_id());

-- Note: Other tables (campaign_steps, campaign_subscriptions) inherit access if they are linked via foreign keys
-- or if their policies are also updated. Let's update subscriptions too.
DROP POLICY IF EXISTS "Allow authenticated full access to campaign_subscriptions" ON public.campaign_subscriptions;
CREATE POLICY "Users can manage shared subscriptions" ON public.campaign_subscriptions
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.campaigns c 
            WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()
        )
    );
