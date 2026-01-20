-- ============================================================================
-- MASTER RESET: The OfferHero Complete Database Schema
-- ============================================================================
-- Run this ONCE to fix all conflicts and set up the correct schema.
-- This file consolidates ALL SQL into one definitive source of truth.
-- ============================================================================

-- ============================================================================
-- SECTION 0: CLEANUP - Drop all conflicting functions and triggers
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_profile_created_invite_code ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_activated ON public.profiles;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_admin_invite_code() CASCADE;
DROP FUNCTION IF EXISTS public.handle_onboarding_activation() CASCADE;
DROP FUNCTION IF EXISTS public.generate_invite_code() CASCADE;
DROP FUNCTION IF EXISTS public.claim_invite(uuid, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.claim_invite(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.check_invite_code(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_organization_id() CASCADE;

-- ============================================================================
-- SECTION 1: EXTENSIONS
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SECTION 2: BASE TABLES
-- ============================================================================

-- 2.1 Profiles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT,
    name TEXT,
    company TEXT,
    phone TEXT,
    website TEXT,
    logo_url TEXT,
    headshot_url TEXT,
    title TEXT,
    role TEXT DEFAULT 'admin',
    parent_id UUID REFERENCES public.profiles(id),
    invite_code TEXT UNIQUE,
    onboarding_status TEXT DEFAULT 'joined',
    permissions JSONB DEFAULT '{"dashboard": true, "quotes": true, "investors": true, "campaigns": true, "analytics": true}'::jsonb,
    timezone TEXT DEFAULT 'UTC',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure all columns exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'joined';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"dashboard": true, "quotes": true, "investors": true, "campaigns": true, "analytics": true}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- 2.2 Investors Table
CREATE TABLE IF NOT EXISTS public.investors (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    company TEXT,
    phone TEXT,
    properties TEXT[],
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.3 Quotes Table
CREATE TABLE IF NOT EXISTS public.quotes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    investor_id UUID REFERENCES public.investors,
    investor_name TEXT,
    investor_email TEXT,
    property_address TEXT,
    property_state TEXT,
    deal_type TEXT,
    loan_amount NUMERIC,
    ltv NUMERIC,
    rate NUMERIC,
    rate_type TEXT DEFAULT 'Fixed',
    term_years NUMERIC,
    origination_fee NUMERIC,
    uw_fee NUMERIC,
    monthly_payment NUMERIC,
    closing_fees NUMERIC,
    notes TEXT,
    email_body TEXT,
    email_html TEXT,
    status TEXT DEFAULT 'Draft',
    follow_ups_enabled BOOLEAN DEFAULT false,
    follow_up_schedule JSONB DEFAULT '[]'::jsonb,
    schedule_url TEXT,
    last_contacted_at TIMESTAMPTZ,
    next_contact_due TIMESTAMPTZ,
    workflow_step INTEGER DEFAULT 0,
    email_message_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    last_interaction_at TIMESTAMPTZ
);

-- 2.4 Campaigns Table
CREATE TABLE IF NOT EXISTS public.campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    preferred_run_time TEXT DEFAULT '09:00',
    user_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2.5 Campaign Steps Table
CREATE TABLE IF NOT EXISTS public.campaign_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    delay_days INTEGER DEFAULT 0 NOT NULL,
    subject_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.6 Campaign Subscriptions Table
CREATE TABLE IF NOT EXISTS public.campaign_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
    lead_id UUID NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
    current_step_index INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed')),
    last_email_sent_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2.7 Campaign Events Table
CREATE TABLE IF NOT EXISTS public.campaign_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE,
    step_id UUID REFERENCES public.campaign_steps(id) ON DELETE SET NULL,
    lead_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('sent', 'opened', 'clicked', 'converted', 'bounced', 'complained')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_quotes_next_contact_due ON public.quotes(next_contact_due);
CREATE INDEX IF NOT EXISTS idx_campaign_steps_campaign_id ON public.campaign_steps(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_campaign_id ON public.campaign_subscriptions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_status ON public.campaign_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_campaign_subscriptions_next_run_at ON public.campaign_subscriptions(next_run_at);
CREATE INDEX IF NOT EXISTS idx_campaign_events_campaign_id ON public.campaign_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_events_lead_id ON public.campaign_events(lead_id);

-- ============================================================================
-- SECTION 4: ENABLE RLS
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 5: HELPER FUNCTIONS
-- ============================================================================

-- 5.1 Organization Context (for shared data access)
CREATE OR REPLACE FUNCTION public.get_organization_id()
RETURNS UUID AS $$
    SELECT COALESCE(
        (SELECT parent_id FROM public.profiles WHERE id = auth.uid()),
        auth.uid()
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 5.2 Invite Code Checker (bypasses RLS for lookups)
CREATE OR REPLACE FUNCTION public.check_invite_code(lookup_code text)
RETURNS TABLE (company_name text, admin_id uuid) 
SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT company, id FROM public.profiles
    WHERE invite_code = lookup_code AND role = 'admin';
END;
$$ LANGUAGE plpgsql;

-- 5.3 Invite Claimer (links assistant to admin's org)
CREATE OR REPLACE FUNCTION public.claim_invite(
    p_user_id UUID, 
    p_invite_code TEXT,
    p_name TEXT DEFAULT NULL,
    p_phone TEXT DEFAULT NULL,
    p_title TEXT DEFAULT NULL
)
RETURNS void SECURITY DEFINER AS $$
DECLARE
    v_admin_id UUID;
    v_company TEXT;
    v_logo_url TEXT;
    v_website TEXT;
    v_profile_exists BOOLEAN;
BEGIN
    -- Find the admin by their invite code
    SELECT id, company, logo_url, website
    INTO v_admin_id, v_company, v_logo_url, v_website
    FROM public.profiles
    WHERE invite_code = p_invite_code AND role = 'admin';

    IF v_admin_id IS NULL THEN
        RAISE EXCEPTION 'Invalid invite code';
    END IF;

    -- Check if profile already exists
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE id = p_user_id) INTO v_profile_exists;

    IF v_profile_exists THEN
        -- UPDATE the existing profile
        UPDATE public.profiles SET 
            role = 'assistant',
            parent_id = v_admin_id,
            company = v_company,
            logo_url = v_logo_url,
            website = v_website,
            name = COALESCE(p_name, name),
            phone = COALESCE(p_phone, phone),
            title = COALESCE(p_title, 'Assistant'),
            onboarding_status = 'active',
            updated_at = now(),
            permissions = '{"dashboard": true, "quotes": true, "investors": true, "campaigns": true, "analytics": true}'::jsonb
        WHERE id = p_user_id;
    ELSE
        -- INSERT a new profile (fallback if trigger failed)
        INSERT INTO public.profiles (id, email, name, phone, title, role, parent_id, company, logo_url, website, onboarding_status, permissions)
        SELECT 
            p_user_id,
            u.email,
            COALESCE(p_name, u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
            p_phone,
            COALESCE(p_title, 'Assistant'),
            'assistant',
            v_admin_id,
            v_company,
            v_logo_url,
            v_website,
            'active',
            '{"dashboard": true, "quotes": true, "investors": true, "campaigns": true, "analytics": true}'::jsonb
        FROM auth.users u WHERE u.id = p_user_id;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 6: AUTH TRIGGER (Creates profile on signup)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name, role, onboarding_status)
    VALUES (
        new.id, 
        new.email, 
        COALESCE(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        'admin',
        'joined'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', new.id, SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- SECTION 7: INVITE CODE GENERATOR (Runs when admin becomes 'active')
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_onboarding_activation()
RETURNS trigger AS $$
DECLARE
    v_new_code TEXT;
    done BOOLEAN DEFAULT FALSE;
BEGIN
    -- Only generate code when: status changes to 'active', role is 'admin', and no code exists
    IF (OLD.onboarding_status IS DISTINCT FROM 'active') 
       AND NEW.onboarding_status = 'active' 
       AND NEW.role = 'admin' 
       AND NEW.invite_code IS NULL THEN
       
        WHILE NOT done LOOP
            v_new_code := upper(substring(md5(random()::text) from 1 for 6));
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = v_new_code) THEN
                done := TRUE;
            END IF;
        END LOOP;
        
        NEW.invite_code := v_new_code;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_activated
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_onboarding_activation();

-- ============================================================================
-- SECTION 8: RLS POLICIES
-- ============================================================================

-- 8.1 Profiles Policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 8.2 Shared Data Policies (Organization-based with assistant DELETE restriction)

-- Helper function to check if user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
    SELECT COALESCE(
        (SELECT role = 'admin' FROM public.profiles WHERE id = auth.uid()),
        false
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- QUOTES: Assistants can view, create, update - but NOT delete
DROP POLICY IF EXISTS "Users can manage shared quotes" ON public.quotes;
DROP POLICY IF EXISTS "Org users can view quotes" ON public.quotes;
DROP POLICY IF EXISTS "Org users can insert quotes" ON public.quotes;
DROP POLICY IF EXISTS "Org users can update quotes" ON public.quotes;
DROP POLICY IF EXISTS "Admins can delete quotes" ON public.quotes;

CREATE POLICY "Org users can view quotes" ON public.quotes
    FOR SELECT TO authenticated
    USING (user_id = public.get_organization_id());

CREATE POLICY "Org users can insert quotes" ON public.quotes
    FOR INSERT TO authenticated
    WITH CHECK (user_id = public.get_organization_id());

CREATE POLICY "Org users can update quotes" ON public.quotes
    FOR UPDATE TO authenticated
    USING (user_id = public.get_organization_id());

CREATE POLICY "Admins can delete quotes" ON public.quotes
    FOR DELETE TO authenticated
    USING (user_id = public.get_organization_id() AND public.is_admin());

-- INVESTORS: Assistants can view, create, update - but NOT delete
DROP POLICY IF EXISTS "Users can manage shared investors" ON public.investors;
DROP POLICY IF EXISTS "Org users can view investors" ON public.investors;
DROP POLICY IF EXISTS "Org users can insert investors" ON public.investors;
DROP POLICY IF EXISTS "Org users can update investors" ON public.investors;
DROP POLICY IF EXISTS "Admins can delete investors" ON public.investors;

CREATE POLICY "Org users can view investors" ON public.investors
    FOR SELECT TO authenticated
    USING (user_id = public.get_organization_id());

CREATE POLICY "Org users can insert investors" ON public.investors
    FOR INSERT TO authenticated
    WITH CHECK (user_id = public.get_organization_id());

CREATE POLICY "Org users can update investors" ON public.investors
    FOR UPDATE TO authenticated
    USING (user_id = public.get_organization_id());

CREATE POLICY "Admins can delete investors" ON public.investors
    FOR DELETE TO authenticated
    USING (user_id = public.get_organization_id() AND public.is_admin());

-- CAMPAIGNS: Assistants can view, create, update - but NOT delete
DROP POLICY IF EXISTS "Users can manage shared campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Org users can view campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Org users can insert campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Org users can update campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Admins can delete campaigns" ON public.campaigns;

CREATE POLICY "Org users can view campaigns" ON public.campaigns
    FOR SELECT TO authenticated
    USING (user_id = public.get_organization_id());

CREATE POLICY "Org users can insert campaigns" ON public.campaigns
    FOR INSERT TO authenticated
    WITH CHECK (user_id = public.get_organization_id());

CREATE POLICY "Org users can update campaigns" ON public.campaigns
    FOR UPDATE TO authenticated
    USING (user_id = public.get_organization_id());

CREATE POLICY "Admins can delete campaigns" ON public.campaigns
    FOR DELETE TO authenticated
    USING (user_id = public.get_organization_id() AND public.is_admin());

-- 8.3 Campaign Child Tables (inherit from parent campaign, same rules)
DROP POLICY IF EXISTS "Users can manage shared subscriptions" ON public.campaign_subscriptions;
DROP POLICY IF EXISTS "Org users can view subscriptions" ON public.campaign_subscriptions;
DROP POLICY IF EXISTS "Org users can insert subscriptions" ON public.campaign_subscriptions;
DROP POLICY IF EXISTS "Org users can update subscriptions" ON public.campaign_subscriptions;
DROP POLICY IF EXISTS "Admins can delete subscriptions" ON public.campaign_subscriptions;

CREATE POLICY "Org users can view subscriptions" ON public.campaign_subscriptions
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()));

CREATE POLICY "Org users can insert subscriptions" ON public.campaign_subscriptions
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()));

CREATE POLICY "Org users can update subscriptions" ON public.campaign_subscriptions
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()));

CREATE POLICY "Admins can delete subscriptions" ON public.campaign_subscriptions
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()) AND public.is_admin());

DROP POLICY IF EXISTS "Users can manage shared steps" ON public.campaign_steps;
DROP POLICY IF EXISTS "Org users can view steps" ON public.campaign_steps;
DROP POLICY IF EXISTS "Org users can insert steps" ON public.campaign_steps;
DROP POLICY IF EXISTS "Org users can update steps" ON public.campaign_steps;
DROP POLICY IF EXISTS "Admins can delete steps" ON public.campaign_steps;

CREATE POLICY "Org users can view steps" ON public.campaign_steps
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()));

CREATE POLICY "Org users can insert steps" ON public.campaign_steps
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()));

CREATE POLICY "Org users can update steps" ON public.campaign_steps
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()));

CREATE POLICY "Admins can delete steps" ON public.campaign_steps
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()) AND public.is_admin());

DROP POLICY IF EXISTS "Users can manage shared events" ON public.campaign_events;
DROP POLICY IF EXISTS "Org users can view events" ON public.campaign_events;
DROP POLICY IF EXISTS "Org users can insert events" ON public.campaign_events;
DROP POLICY IF EXISTS "Org users can update events" ON public.campaign_events;
DROP POLICY IF EXISTS "Admins can delete events" ON public.campaign_events;

CREATE POLICY "Org users can view events" ON public.campaign_events
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()));

CREATE POLICY "Org users can insert events" ON public.campaign_events
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()));

CREATE POLICY "Org users can update events" ON public.campaign_events
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()));

CREATE POLICY "Admins can delete events" ON public.campaign_events
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.campaigns c WHERE c.id = campaign_id AND c.user_id = public.get_organization_id()) AND public.is_admin());

-- ============================================================================
-- SECTION 9: DATA RECOVERY (Fix any missing profiles)
-- ============================================================================

INSERT INTO public.profiles (id, email, name, role, onboarding_status)
SELECT 
    u.id, 
    u.email, 
    COALESCE(u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
    'admin',
    'joined'
FROM auth.users u
WHERE u.id NOT IN (SELECT id FROM public.profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- DONE! Your database is now clean and consistent.
-- ============================================================================
