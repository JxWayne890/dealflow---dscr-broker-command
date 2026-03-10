-- 11_education_system.sql
-- Replaces Website Builder with Education video library

CREATE TABLE IF NOT EXISTS public.education_tutorials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT NOT NULL,
    category TEXT NOT NULL,
    thumbnail_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.education_tutorials ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can view tutorials
DROP POLICY IF EXISTS "Anyone can view education tutorials" ON public.education_tutorials;
CREATE POLICY "Anyone can view education tutorials" ON public.education_tutorials
    FOR SELECT TO authenticated USING (true);

-- Only admins can insert/update/delete tutorials
DROP POLICY IF EXISTS "Admins can manage education tutorials" ON public.education_tutorials;
CREATE POLICY "Admins can manage education tutorials" ON public.education_tutorials
    FOR ALL TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
