-- Enable necessary extensions
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule the cron job to run every hour
-- NOTE: We use the ANON key here which is safe for client-side, 
-- but ensure your RLS policies on 'campaigns' tables are correct.
select cron.schedule(
  'process-campaigns-hourly',
  '*/10 * * * *', -- Every 10 minutes
  $$
  select
    net.http_post(
        url:='https://auxgywcgnezpzpdtmxuf.supabase.co/functions/v1/process-campaigns',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer sb_publishable_CbCR9N1klrjlIKKEOtnlxQ_V43WVPJ9"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
