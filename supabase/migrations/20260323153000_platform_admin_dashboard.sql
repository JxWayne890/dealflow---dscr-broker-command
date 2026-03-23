ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_platform_admin BOOLEAN NOT NULL DEFAULT false;

UPDATE public.profiles
SET is_platform_admin = true
WHERE lower(email) = 'theprovidersystem@gmail.com';

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT COALESCE(
        (SELECT is_platform_admin FROM public.profiles WHERE id = auth.uid()),
        false
    );
$$;

CREATE OR REPLACE FUNCTION public.protect_platform_admin_flag()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.is_platform_admin IS DISTINCT FROM OLD.is_platform_admin
       AND auth.uid() IS NOT NULL
       AND NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Only platform admins can change platform admin access';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_platform_admin_flag_trigger ON public.profiles;
CREATE TRIGGER protect_platform_admin_flag_trigger
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_platform_admin_flag();

CREATE OR REPLACE FUNCTION public.get_platform_admin_overview()
RETURNS TABLE (
    total_orgs BIGINT,
    total_users BIGINT,
    active_users BIGINT,
    trial_users BIGINT,
    paid_users BIGINT,
    total_quotes BIGINT,
    total_investors BIGINT,
    total_campaigns BIGINT,
    active_subscriptions BIGINT,
    scheduled_subscriptions BIGINT,
    overdue_subscriptions BIGINT,
    completed_subscriptions BIGINT,
    emails_sent_total BIGINT,
    sent_events_total BIGINT,
    opened_events_total BIGINT,
    clicked_events_total BIGINT,
    bounced_events_total BIGINT,
    complained_events_total BIGINT,
    failed_cron_runs_24h BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    WITH orgs AS (
        SELECT COUNT(*)::BIGINT AS count
        FROM public.profiles p
        WHERE COALESCE(p.parent_id, p.id) = p.id
    ),
    users AS (
        SELECT
            COUNT(*)::BIGINT AS total_users,
            COUNT(*) FILTER (WHERE onboarding_status = 'active')::BIGINT AS active_users,
            COUNT(*) FILTER (WHERE subscription_status = 'trial')::BIGINT AS trial_users,
            COUNT(*) FILTER (WHERE subscription_status = 'active')::BIGINT AS paid_users,
            COALESCE(SUM(emails_sent), 0)::BIGINT AS emails_sent_total
        FROM public.profiles
    ),
    quotes AS (
        SELECT COUNT(*)::BIGINT AS total_quotes
        FROM public.quotes
    ),
    investors AS (
        SELECT COUNT(*)::BIGINT AS total_investors
        FROM public.investors
    ),
    campaigns AS (
        SELECT COUNT(*)::BIGINT AS total_campaigns
        FROM public.campaigns
    ),
    subscriptions AS (
        SELECT
            COUNT(*) FILTER (WHERE status = 'active')::BIGINT AS active_subscriptions,
            COUNT(*) FILTER (WHERE status = 'active' AND next_run_at IS NOT NULL)::BIGINT AS scheduled_subscriptions,
            COUNT(*) FILTER (WHERE status = 'active' AND next_run_at <= now())::BIGINT AS overdue_subscriptions,
            COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_subscriptions
        FROM public.campaign_subscriptions
    ),
    events AS (
        SELECT
            COUNT(*) FILTER (WHERE type = 'sent')::BIGINT AS sent_events_total,
            COUNT(*) FILTER (WHERE type = 'opened')::BIGINT AS opened_events_total,
            COUNT(*) FILTER (WHERE type = 'clicked')::BIGINT AS clicked_events_total,
            COUNT(*) FILTER (WHERE type = 'bounced')::BIGINT AS bounced_events_total,
            COUNT(*) FILTER (WHERE type = 'complained')::BIGINT AS complained_events_total
        FROM public.campaign_events
    ),
    cron_failures AS (
        SELECT COUNT(*)::BIGINT AS failed_cron_runs_24h
        FROM cron.job_run_details jrd
        WHERE jrd.status <> 'succeeded'
          AND jrd.start_time >= now() - interval '24 hours'
    )
    SELECT
        orgs.count,
        users.total_users,
        users.active_users,
        users.trial_users,
        users.paid_users,
        quotes.total_quotes,
        investors.total_investors,
        campaigns.total_campaigns,
        subscriptions.active_subscriptions,
        subscriptions.scheduled_subscriptions,
        subscriptions.overdue_subscriptions,
        subscriptions.completed_subscriptions,
        users.emails_sent_total,
        events.sent_events_total,
        events.opened_events_total,
        events.clicked_events_total,
        events.bounced_events_total,
        events.complained_events_total,
        cron_failures.failed_cron_runs_24h
    FROM orgs, users, quotes, investors, campaigns, subscriptions, events, cron_failures;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_admin_subscribers()
RETURNS TABLE (
    org_id UUID,
    owner_name TEXT,
    owner_email TEXT,
    company TEXT,
    onboarding_status TEXT,
    subscription_status TEXT,
    emails_sent BIGINT,
    team_size BIGINT,
    quotes_count BIGINT,
    investors_count BIGINT,
    campaigns_count BIGINT,
    active_subscriptions BIGINT,
    overdue_subscriptions BIGINT,
    last_quote_created_at TIMESTAMPTZ,
    last_email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        p.id AS org_id,
        p.name AS owner_name,
        p.email AS owner_email,
        p.company,
        p.onboarding_status,
        p.subscription_status,
        COALESCE(email_stats.emails_sent, 0) AS emails_sent,
        COALESCE(team_stats.team_size, 0) AS team_size,
        COALESCE(quote_stats.quotes_count, 0) AS quotes_count,
        COALESCE(investor_stats.investors_count, 0) AS investors_count,
        COALESCE(campaign_stats.campaigns_count, 0) AS campaigns_count,
        COALESCE(subscription_stats.active_subscriptions, 0) AS active_subscriptions,
        COALESCE(subscription_stats.overdue_subscriptions, 0) AS overdue_subscriptions,
        quote_stats.last_quote_created_at,
        subscription_stats.last_email_sent_at,
        p.created_at
    FROM public.profiles p
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::BIGINT AS team_size
        FROM public.profiles team_member
        WHERE team_member.parent_id = p.id
    ) AS team_stats ON true
    LEFT JOIN LATERAL (
        SELECT COALESCE(SUM(member.emails_sent), 0)::BIGINT AS emails_sent
        FROM public.profiles member
        WHERE COALESCE(member.parent_id, member.id) = p.id
    ) AS email_stats ON true
    LEFT JOIN LATERAL (
        SELECT
            COUNT(*)::BIGINT AS quotes_count,
            MAX(q.created_at) AS last_quote_created_at
        FROM public.quotes q
        JOIN public.profiles quote_owner ON quote_owner.id = q.user_id
        WHERE COALESCE(quote_owner.parent_id, quote_owner.id) = p.id
    ) AS quote_stats ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::BIGINT AS investors_count
        FROM public.investors i
        JOIN public.profiles investor_owner ON investor_owner.id = i.user_id
        WHERE COALESCE(investor_owner.parent_id, investor_owner.id) = p.id
    ) AS investor_stats ON true
    LEFT JOIN LATERAL (
        SELECT COUNT(*)::BIGINT AS campaigns_count
        FROM public.campaigns c
        JOIN public.profiles campaign_owner ON campaign_owner.id = c.user_id
        WHERE COALESCE(campaign_owner.parent_id, campaign_owner.id) = p.id
    ) AS campaign_stats ON true
    LEFT JOIN LATERAL (
        SELECT
            COUNT(*) FILTER (WHERE cs.status = 'active')::BIGINT AS active_subscriptions,
            COUNT(*) FILTER (WHERE cs.status = 'active' AND cs.next_run_at <= now())::BIGINT AS overdue_subscriptions,
            MAX(cs.last_email_sent_at) AS last_email_sent_at
        FROM public.campaign_subscriptions cs
        JOIN public.campaigns c ON c.id = cs.campaign_id
        JOIN public.profiles campaign_owner ON campaign_owner.id = c.user_id
        WHERE COALESCE(campaign_owner.parent_id, campaign_owner.id) = p.id
    ) AS subscription_stats ON true
    WHERE COALESCE(p.parent_id, p.id) = p.id
    ORDER BY p.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_admin_queue(p_limit INTEGER DEFAULT 200)
RETURNS TABLE (
    subscription_id UUID,
    org_id UUID,
    org_name TEXT,
    org_email TEXT,
    campaign_id UUID,
    campaign_name TEXT,
    lead_id UUID,
    investor_name TEXT,
    investor_email TEXT,
    status TEXT,
    current_step_index INTEGER,
    next_step_order INTEGER,
    next_step_subject TEXT,
    next_run_at TIMESTAMPTZ,
    last_email_sent_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        cs.id AS subscription_id,
        org_profile.id AS org_id,
        org_profile.name AS org_name,
        org_profile.email AS org_email,
        c.id AS campaign_id,
        c.name AS campaign_name,
        q.id AS lead_id,
        q.investor_name,
        q.investor_email,
        cs.status,
        cs.current_step_index,
        next_step.order_index AS next_step_order,
        next_step.subject_template AS next_step_subject,
        cs.next_run_at,
        cs.last_email_sent_at
    FROM public.campaign_subscriptions cs
    JOIN public.campaigns c ON c.id = cs.campaign_id
    JOIN public.profiles campaign_owner ON campaign_owner.id = c.user_id
    JOIN public.profiles org_profile ON org_profile.id = COALESCE(campaign_owner.parent_id, campaign_owner.id)
    LEFT JOIN public.quotes q ON q.id = cs.lead_id
    LEFT JOIN public.campaign_steps next_step
        ON next_step.campaign_id = cs.campaign_id
       AND next_step.order_index = cs.current_step_index + 1
    WHERE cs.status = 'active'
    ORDER BY cs.next_run_at ASC NULLS LAST, c.name ASC
    LIMIT COALESCE(p_limit, 200);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_admin_failed_cron_runs(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
    job_id BIGINT,
    job_name TEXT,
    schedule TEXT,
    status TEXT,
    return_message TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        j.jobid::BIGINT,
        j.jobname::TEXT,
        j.schedule::TEXT,
        jrd.status::TEXT,
        jrd.return_message::TEXT,
        jrd.start_time,
        jrd.end_time
    FROM cron.job_run_details jrd
    JOIN cron.job j ON j.jobid = jrd.jobid
    WHERE jrd.status <> 'succeeded'
    ORDER BY jrd.start_time DESC
    LIMIT COALESCE(p_limit, 100);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_platform_admin_recent_activity(p_limit INTEGER DEFAULT 200)
RETURNS TABLE (
    event_id UUID,
    org_id UUID,
    org_name TEXT,
    campaign_id UUID,
    campaign_name TEXT,
    lead_id UUID,
    investor_name TEXT,
    investor_email TEXT,
    event_type TEXT,
    created_at TIMESTAMPTZ,
    metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NOT public.is_platform_admin() THEN
        RAISE EXCEPTION 'Access denied';
    END IF;

    RETURN QUERY
    SELECT
        ce.id AS event_id,
        org_profile.id AS org_id,
        org_profile.name AS org_name,
        c.id AS campaign_id,
        c.name AS campaign_name,
        q.id AS lead_id,
        q.investor_name,
        q.investor_email,
        ce.type AS event_type,
        ce.created_at,
        ce.metadata
    FROM public.campaign_events ce
    JOIN public.campaigns c ON c.id = ce.campaign_id
    JOIN public.profiles campaign_owner ON campaign_owner.id = c.user_id
    JOIN public.profiles org_profile ON org_profile.id = COALESCE(campaign_owner.parent_id, campaign_owner.id)
    LEFT JOIN public.quotes q ON q.id = ce.lead_id
    ORDER BY ce.created_at DESC
    LIMIT COALESCE(p_limit, 200);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.is_platform_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_platform_admin_overview() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_platform_admin_subscribers() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_platform_admin_queue(INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_platform_admin_failed_cron_runs(INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_platform_admin_recent_activity(INTEGER) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_admin_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_admin_subscribers() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_admin_queue(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_admin_failed_cron_runs(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_platform_admin_recent_activity(INTEGER) TO authenticated;
