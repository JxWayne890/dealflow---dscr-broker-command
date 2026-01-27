-- Add website settings to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website_subdomain text UNIQUE,
ADD COLUMN IF NOT EXISTS website_settings jsonb DEFAULT '{}'::jsonb;

-- Create website_pages table
CREATE TABLE IF NOT EXISTS public.website_pages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    slug text NOT NULL,
    title text NOT NULL,
    content jsonb DEFAULT '{}'::jsonb,
    is_published boolean DEFAULT false,
    "order" integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE(profile_id, slug)
);

-- RLS Policies
ALTER TABLE public.website_pages ENABLE ROW LEVEL SECURITY;

-- Public can read published pages
CREATE POLICY "Public can view published pages"
ON public.website_pages FOR SELECT
USING (is_published = true);

-- Owners can verify their own pages
CREATE POLICY "Users can view own pages"
ON public.website_pages FOR SELECT
USING (auth.uid() = profile_id);

-- Owners can insert their own pages
CREATE POLICY "Users can insert own pages"
ON public.website_pages FOR INSERT
WITH CHECK (auth.uid() = profile_id);

-- Owners can update their own pages
CREATE POLICY "Users can update own pages"
ON public.website_pages FOR UPDATE
USING (auth.uid() = profile_id);

-- Owners can delete their own pages
CREATE POLICY "Users can delete own pages"
ON public.website_pages FOR DELETE
USING (auth.uid() = profile_id);

-- Index for faster lookups by subdomain (via profile join) and slug
CREATE INDEX IF NOT EXISTS idx_website_pages_profile_slug ON public.website_pages(profile_id, slug);

-- Function to submit a public lead (Creates an investor)
CREATE OR REPLACE FUNCTION public.submit_public_lead(
    p_profile_id uuid,
    p_name text,
    p_email text,
    p_phone text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres) to bypass RLS on investors
SET search_path = public
AS $$
BEGIN
    -- Insert into investors table
    -- Assumes investors table exists and has user_id, name, email
    INSERT INTO public.investors (user_id, name, email, phone)
    VALUES (p_profile_id, p_name, p_email, p_phone);
END;
$$;

-- Grant execute to public/anon
GRANT EXECUTE ON FUNCTION public.submit_public_lead TO anon;
GRANT EXECUTE ON FUNCTION public.submit_public_lead TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_lead TO service_role;
