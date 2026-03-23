-- Process campaigns cron diagnostics and repair
--
-- Run these statements in the Supabase SQL editor for the live project.
-- They do not modify application tables. The final section recreates the cron
-- job using Vault secrets, which is safer than hard-coding the project URL and
-- publishable key in a migration.

-- 1) Confirm the job exists.
select jobid, jobname, schedule, command
from cron.job
where jobname = 'process-campaigns-hourly';

-- 2) Check the most recent job runs.
select jrd.*
from cron.job_run_details jrd
join cron.job j on j.jobid = jrd.jobid
where j.jobname = 'process-campaigns-hourly'
order by jrd.start_time desc
limit 20;

-- 3) Confirm the pg_cron scheduler worker is alive.
select
  pid as process_id,
  usename as database_user,
  application_name,
  backend_start as when_process_began,
  wait_event_type,
  state,
  query,
  backend_type
from pg_stat_activity
where application_name ilike 'pg_cron scheduler';

-- 4) Check for subscriptions that should already have fired.
select
  id,
  campaign_id,
  lead_id,
  status,
  current_step_index,
  next_run_at,
  last_email_sent_at,
  created_at
from public.campaign_subscriptions
where status = 'active'
  and next_run_at <= now()
order by next_run_at asc
limit 50;

-- 5) If needed, store the live project URL and publishable key in Vault.
-- Replace the placeholder values before running these.
--
-- select vault.create_secret('https://your-project-ref.supabase.co', 'project_url');
-- select vault.create_secret('your_publishable_or_anon_key', 'anon_key');

-- 6) Recreate the cron job against Vault-managed secrets.
-- Safe to run multiple times. Existing jobs with the same name are removed first.
select cron.unschedule(jobid)
from cron.job
where jobname = 'process-campaigns-hourly';

select cron.schedule(
  'process-campaigns-hourly',
  '*/10 * * * *',
  $$
  select
    net.http_post(
      url:=(
        select decrypted_secret
        from vault.decrypted_secrets
        where name = 'project_url'
      ) || '/functions/v1/process-campaigns',
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'anon_key'
        )
      ),
      body:='{}'::jsonb
    ) as request_id;
  $$
);
