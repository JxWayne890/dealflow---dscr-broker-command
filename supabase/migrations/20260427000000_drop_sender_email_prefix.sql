-- Remove per-broker sender email override.
-- All outbound mail now uses a single fixed mailbox (deals@theofferhero.com)
-- to consolidate domain reputation and avoid spoofing heuristics.

DROP FUNCTION IF EXISTS public.check_email_prefix_available(TEXT);

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_sender_email_prefix_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS sender_email_prefix;

NOTIFY pgrst, 'reload schema';
