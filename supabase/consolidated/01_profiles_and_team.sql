-- 1. Profiles Enhancements
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'admin';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.profiles(id);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{"dashboard": true, "quotes": true, "investors": true, "campaigns": true, "analytics": true}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Function to generate random code
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    done BOOLEAN DEFAULT FALSE;
BEGIN
    WHILE NOT done LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE invite_code = new_code) THEN
            done := TRUE;
        END IF;
    END LOOP;
    RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to handle profile creation/update for invite code
CREATE OR REPLACE FUNCTION handle_admin_invite_code() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role = 'admin' AND NEW.invite_code IS NULL THEN
        NEW.invite_code := generate_invite_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new profiles
DROP TRIGGER IF EXISTS on_profile_created_invite_code ON public.profiles;
CREATE TRIGGER on_profile_created_invite_code
    BEFORE INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION handle_admin_invite_code();

-- Update existing admins who don't have a code
UPDATE public.profiles SET invite_code = generate_invite_code() 
WHERE role = 'admin' AND invite_code IS NULL;

-- 2. Team Invites System
CREATE TABLE IF NOT EXISTS public.invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    broker_id UUID REFERENCES public.profiles(id) NOT NULL,
    permissions JSONB NOT NULL DEFAULT '{"dashboard": true, "quotes": true, "investors": true, "campaigns": true, "analytics": true}'::jsonb,
    is_used BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Invites Security
ALTER TABLE public.invites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Brokers can manage their own invites" ON public.invites;
CREATE POLICY "Brokers can manage their own invites" ON public.invites
    FOR ALL TO authenticated USING (auth.uid() = broker_id);

DROP POLICY IF EXISTS "Anyone can check an invite code" ON public.invites;
CREATE POLICY "Anyone can check an invite code" ON public.invites
    FOR SELECT TO authenticated USING (true);
