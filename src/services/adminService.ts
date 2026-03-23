import { supabase } from '../lib/supabase';

export interface AdminOverview {
    total_orgs: number;
    total_users: number;
    active_users: number;
    trial_users: number;
    paid_users: number;
    total_quotes: number;
    total_investors: number;
    total_campaigns: number;
    active_subscriptions: number;
    scheduled_subscriptions: number;
    overdue_subscriptions: number;
    completed_subscriptions: number;
    emails_sent_total: number;
    sent_events_total: number;
    opened_events_total: number;
    clicked_events_total: number;
    bounced_events_total: number;
    complained_events_total: number;
    failed_cron_runs_24h: number;
}

export interface AdminSubscriberRow {
    org_id: string;
    owner_name: string;
    owner_email: string;
    company: string | null;
    onboarding_status: string | null;
    subscription_status: string | null;
    emails_sent: number;
    team_size: number;
    quotes_count: number;
    investors_count: number;
    campaigns_count: number;
    active_subscriptions: number;
    overdue_subscriptions: number;
    last_quote_created_at: string | null;
    last_email_sent_at: string | null;
    created_at: string;
}

export interface AdminQueueRow {
    subscription_id: string;
    org_id: string;
    org_name: string;
    org_email: string;
    campaign_id: string;
    campaign_name: string;
    lead_id: string;
    investor_name: string | null;
    investor_email: string | null;
    status: string;
    current_step_index: number;
    next_step_order: number | null;
    next_step_subject: string | null;
    next_run_at: string | null;
    last_email_sent_at: string | null;
}

export interface AdminFailedCronRow {
    job_id: number;
    job_name: string;
    schedule: string;
    status: string;
    return_message: string;
    start_time: string;
    end_time: string | null;
}

export interface AdminActivityRow {
    event_id: string;
    org_id: string;
    org_name: string;
    campaign_id: string;
    campaign_name: string;
    lead_id: string | null;
    investor_name: string | null;
    investor_email: string | null;
    event_type: string;
    created_at: string;
    metadata: Record<string, unknown> | null;
}

const rpc = async <T>(fn: string, params?: Record<string, unknown>) => {
    const { data, error } = await supabase.rpc(fn, params);
    if (error) throw error;
    return data as T;
};

const EMPTY_OVERVIEW: AdminOverview = {
    total_orgs: 0,
    total_users: 0,
    active_users: 0,
    trial_users: 0,
    paid_users: 0,
    total_quotes: 0,
    total_investors: 0,
    total_campaigns: 0,
    active_subscriptions: 0,
    scheduled_subscriptions: 0,
    overdue_subscriptions: 0,
    completed_subscriptions: 0,
    emails_sent_total: 0,
    sent_events_total: 0,
    opened_events_total: 0,
    clicked_events_total: 0,
    bounced_events_total: 0,
    complained_events_total: 0,
    failed_cron_runs_24h: 0
};

export const adminService = {
    async getOverview(): Promise<AdminOverview> {
        const data = await rpc<AdminOverview[]>('get_platform_admin_overview');
        return data?.[0] || EMPTY_OVERVIEW;
    },

    async getSubscribers(): Promise<AdminSubscriberRow[]> {
        return rpc<AdminSubscriberRow[]>('get_platform_admin_subscribers');
    },

    async getQueue(limit = 200): Promise<AdminQueueRow[]> {
        return rpc<AdminQueueRow[]>('get_platform_admin_queue', { p_limit: limit });
    },

    async getFailedCronRuns(limit = 100): Promise<AdminFailedCronRow[]> {
        return rpc<AdminFailedCronRow[]>('get_platform_admin_failed_cron_runs', { p_limit: limit });
    },

    async getRecentActivity(limit = 200): Promise<AdminActivityRow[]> {
        return rpc<AdminActivityRow[]>('get_platform_admin_recent_activity', { p_limit: limit });
    }
};
