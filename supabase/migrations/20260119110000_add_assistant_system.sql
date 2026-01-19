-- Add role, parent_id, and permissions to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"dashboard": true, "quotes": true, "investors": true, "campaigns": true, "analytics": true}'::jsonb;

-- Create invites table
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    broker_id UUID REFERENCES public.profiles(id) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{"dashboard": true, "quotes": true, "investors": true, "campaigns": true, "analytics": true}'::jsonb,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS for invites (only broker can see their own invites)
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brokers can manage their own invites" ON public.invites;
CREATE POLICY "Brokers can manage their own invites" ON public.invites
    FOR ALL TO authenticated USING (auth.uid() = broker_id);

DROP POLICY IF EXISTS "Anyone can check an invite code" ON public.invites;
CREATE POLICY "Anyone can check an invite code" ON public.invites
    FOR SELECT TO authenticated USING (true);
