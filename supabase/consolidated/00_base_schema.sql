-- 0. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Base)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email text,
  name text,
  company text,
  phone text,
  website text,
  logo_url text,
  headshot_url text,
  title text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Default Policies (Will be refined by Organization RLS)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Investors Table (Base)
CREATE TABLE IF NOT EXISTS public.investors (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  email text,
  company text,
  phone text,
  properties text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.investors ENABLE ROW LEVEL SECURITY;

-- Default Policies
DROP POLICY IF EXISTS "Users can view own investors" ON public.investors;
CREATE POLICY "Users can view own investors" ON public.investors FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own investors" ON public.investors;
CREATE POLICY "Users can insert own investors" ON public.investors FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own investors" ON public.investors;
CREATE POLICY "Users can update own investors" ON public.investors FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own investors" ON public.investors;
CREATE POLICY "Users can delete own investors" ON public.investors FOR DELETE USING (auth.uid() = user_id);

-- 3. Quotes Table (Base)
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  investor_id uuid REFERENCES public.investors,
  investor_name text,
  investor_email text,
  property_address text,
  property_city text,
  property_zip text,
  property_state text,
  deal_type text,
  loan_amount numeric,
  ltv numeric,
  rate numeric,
  rate_type text DEFAULT 'Fixed',
  term_years numeric,
  origination_fee numeric,
  uw_fee numeric,
  monthly_payment numeric,
  closing_fees numeric,
  notes text,
  email_body text,
  email_html text,
  status text DEFAULT 'Draft',
  follow_ups_enabled boolean DEFAULT false,
  follow_up_schedule jsonb DEFAULT '[]'::jsonb,
  schedule_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_interaction_at timestamptz
);

ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Default Policies
DROP POLICY IF EXISTS "Users can view own quotes" ON public.quotes;
CREATE POLICY "Users can view own quotes" ON public.quotes FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own quotes" ON public.quotes;
CREATE POLICY "Users can insert own quotes" ON public.quotes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own quotes" ON public.quotes;
CREATE POLICY "Users can update own quotes" ON public.quotes FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own quotes" ON public.quotes;
CREATE POLICY "Users can delete own quotes" ON public.quotes FOR DELETE USING (auth.uid() = user_id);

-- 4. Auth Triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'name')
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
