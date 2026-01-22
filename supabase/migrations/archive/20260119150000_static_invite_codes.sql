-- Add invite_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invite_code TEXT UNIQUE;

-- Function to generate random code
CREATE OR REPLACE FUNCTION generate_invite_code() RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    done BOOLEAN DEFAULT FALSE;
BEGIN
    WHILE NOT done LOOP
        new_code := upper(substring(md5(random()::text) from 1 for 6));
        LOCK TABLE public.profiles IN EXCLUSIVE MODE;
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

-- Policy to allow admins to update their assistants' permissions
CREATE POLICY "Admins can update their assistants" ON public.profiles
    FOR UPDATE TO authenticated
    USING (
        auth.uid() = id OR -- Can update own profile
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin' 
            AND public.profiles.parent_id = p.id
        )
    )
    WITH CHECK (
        auth.uid() = id OR -- Can update own profile
        EXISTS (
            SELECT 1 FROM public.profiles p 
            WHERE p.id = auth.uid() 
            AND p.role = 'admin' 
            AND public.profiles.parent_id = p.id
        )
    );
