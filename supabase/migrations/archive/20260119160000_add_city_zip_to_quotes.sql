-- Add City and Zip to Quotes
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS property_city text;
ALTER TABLE public.quotes ADD COLUMN IF NOT EXISTS property_zip text;
