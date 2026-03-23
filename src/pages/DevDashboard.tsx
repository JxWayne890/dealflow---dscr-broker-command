import React, { useEffect, useState } from 'react';
import { Icons } from '../components/Icons';
import { adminService, AdminActivityRow, AdminFailedCronRow, AdminOverview, AdminQueueRow, AdminSubscriberRow } from '../services/adminService';
import { ProfileService } from '../services/profileService';

type AdminTab = 'overview' | 'subscribers' | 'queue' | 'failures' | 'activity';

const TAB_ORDER: AdminTab[] = ['overview', 'subscribers', 'queue', 'failures', 'activity'];

const formatDate = (value?: string | null) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatNumber = (value?: number | null) => {
    return new Intl.NumberFormat('en-US').format(value || 0);
};

const formatMessage = (value?: string | null) => {
    if (!value) return 'N/A';
    return value.length > 180 ? `${value.slice(0, 180)}...` : value;
};

const statusBadge = (value?: string | null) => {
    const styles: Record<string, string> = {
        active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        completed: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
        paused: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
        failed: 'bg-red-500/15 text-red-300 border-red-500/30',
        sent: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        opened: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
        clicked: 'bg-banana-400/15 text-banana-300 border-banana-400/30',
        bounced: 'bg-red-500/15 text-red-300 border-red-500/30',
        complained: 'bg-red-500/15 text-red-300 border-red-500/30',
        succeeded: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
    };

    return styles[value || ''] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';
};

const StatCard = ({ label, value, icon: Icon, tone = 'text-white' }: { label: string; value: number; icon: any; tone?: string }) => (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">{label}</span>
            <Icon className={`w-5 h-5 ${tone}`} />
        </div>
        <div className={`text-3xl font-black ${tone}`}>{formatNumber(value)}</div>
    </div>
);

const EmptyTableState = ({ message, colSpan }: { message: string; colSpan: number }) => (
    <tr>
        <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-400">
            {message}
        </td>
    </tr>
);

export const DevDashboard: React.FC = () => {
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<AdminTab>('overview');
    const [searchTerm, setSearchTerm] = useState('');
    const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);

    const [overview, setOverview] = useState<AdminOverview | null>(null);
    const [subscribers, setSubscribers] = useState<AdminSubscriberRow[]>([]);
    const [queue, setQueue] = useState<AdminQueueRow[]>([]);
    const [failures, setFailures] = useState<AdminFailedCronRow[]>([]);
    const [activity, setActivity] = useState<AdminActivityRow[]>([]);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            const profile = await ProfileService.getProfile();
            if (!profile?.isPlatformAdmin) {
                setAuthorized(false);
                setLoading(false);
                return;
            }

            setAuthorized(true);
            const [overviewData, subscribersData, queueData, failuresData, activityData] = await Promise.all([
                adminService.getOverview(),
                adminService.getSubscribers(),
                adminService.getQueue(),
                adminService.getFailedCronRuns(),
                adminService.getRecentActivity()
            ]);

            setOverview(overviewData);
            setSubscribers(subscribersData);
            setQueue(queueData);
            setFailures(failuresData);
            setActivity(activityData);
            setLastLoadedAt(new Date().toISOString());
        } catch (err: any) {
            console.error('Failed to load admin dashboard', err);
            setError(err?.message || 'Failed to load admin dashboard');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const filteredSubscribers = subscribers.filter((subscriber) => {
        const haystack = [
            subscriber.owner_name,
            subscriber.owner_email,
            subscriber.company || ''
        ].join(' ').toLowerCase();

        return haystack.includes(searchTerm.toLowerCase());
    });

    const filteredQueue = queue.filter((item) => {
        const haystack = [
            item.org_name,
            item.org_email,
            item.campaign_name,
            item.investor_name || '',
            item.investor_email || ''
        ].join(' ').toLowerCase();

        return haystack.includes(searchTerm.toLowerCase());
    });

    const filteredFailures = failures.filter((item) => {
        const haystack = [
            item.job_name,
            item.status,
            item.return_message || ''
        ].join(' ').toLowerCase();

        return haystack.includes(searchTerm.toLowerCase());
    });

    const filteredActivity = activity.filter((item) => {
        const haystack = [
            item.org_name,
            item.campaign_name,
            item.investor_name || '',
            item.investor_email || '',
            item.event_type
        ].join(' ').toLowerCase();

        return haystack.includes(searchTerm.toLowerCase());
    });

    if (loading) {
        return (
            <div className="py-24 flex items-center justify-center">
                <Icons.RefreshCw className="w-12 h-12 text-banana-400 animate-spin" />
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="max-w-2xl mx-auto">
                <div className="rounded-3xl border border-red-500/20 bg-slate-950 text-center px-8 py-16">
                    <Icons.Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400">Your account is not marked as a platform admin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="text-white">
            <div className="max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-black mb-2">Platform Admin</h1>
                        <p className="text-slate-400">Cross-account visibility for subscribers, queue health, cron failures, and recent email activity.</p>
                        {lastLoadedAt && (
                            <p className="text-xs uppercase tracking-[0.18em] text-slate-500 mt-3">
                                Last refreshed {formatDate(lastLoadedAt)}
                            </p>
                        )}
                    </div>
                    <button
                        onClick={loadData}
                        className="px-4 py-3 bg-banana-400 text-slate-950 rounded-xl font-bold inline-flex items-center gap-2 hover:bg-banana-500 transition-colors"
                    >
                        <Icons.RefreshCw className="w-4 h-4" />
                        Refresh Data
                    </button>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 text-red-200 px-4 py-3">
                        {error}
                    </div>
                )}

                {overview && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
                        <StatCard label="Organizations" value={overview.total_orgs} icon={Icons.Users} tone="text-banana-300" />
                        <StatCard label="Total Users" value={overview.total_users} icon={Icons.UserPlus} tone="text-white" />
                        <StatCard label="Quotes Generated" value={overview.total_quotes} icon={Icons.FileText} tone="text-indigo-300" />
                        <StatCard label="Emails Sent" value={overview.sent_events_total} icon={Icons.Mail} tone="text-emerald-300" />
                        <StatCard label="Failed Cron 24h" value={overview.failed_cron_runs_24h} icon={Icons.AlertCircle} tone="text-red-300" />
                    </div>
                )}

                {overview && (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4 mb-8">
                        <StatCard label="Trial Users" value={overview.trial_users} icon={Icons.CreditCard} tone="text-slate-200" />
                        <StatCard label="Paid Users" value={overview.paid_users} icon={Icons.CheckCircle} tone="text-emerald-300" />
                        <StatCard label="Campaigns" value={overview.total_campaigns} icon={Icons.Mail} tone="text-indigo-300" />
                        <StatCard label="Active Queue" value={overview.active_subscriptions} icon={Icons.Clock} tone="text-banana-300" />
                        <StatCard label="Overdue Queue" value={overview.overdue_subscriptions} icon={Icons.AlertCircle} tone="text-red-300" />
                        <StatCard label="Bounces" value={overview.bounced_events_total} icon={Icons.XCircle} tone="text-red-300" />
                        <StatCard label="Complaints" value={overview.complained_events_total} icon={Icons.AlertCircle} tone="text-amber-300" />
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        {TAB_ORDER.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-colors ${activeTab === tab
                                    ? 'bg-banana-400 text-slate-950 border-banana-400'
                                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="relative flex-1 max-w-xl">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search org, email, campaign, lead, or error..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-banana-400"
                        />
                    </div>
                </div>

                {activeTab === 'overview' && overview && (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                            <h2 className="text-lg font-bold mb-4">Platform Snapshot</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-slate-400">Active users</span><span>{formatNumber(overview.active_users)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Investors</span><span>{formatNumber(overview.total_investors)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Scheduled subscriptions</span><span>{formatNumber(overview.scheduled_subscriptions)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Completed subscriptions</span><span>{formatNumber(overview.completed_subscriptions)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Profile email count total</span><span>{formatNumber(overview.emails_sent_total)}</span></div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
                            <h2 className="text-lg font-bold mb-4">Campaign Events</h2>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between"><span className="text-slate-400">Sent</span><span>{formatNumber(overview.sent_events_total)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Opened</span><span>{formatNumber(overview.opened_events_total)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Clicked</span><span>{formatNumber(overview.clicked_events_total)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Bounced</span><span>{formatNumber(overview.bounced_events_total)}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">Complained</span><span>{formatNumber(overview.complained_events_total)}</span></div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subscribers' && (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px]">
                                <thead>
                                    <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                                        <th className="px-4 py-4">Subscriber</th>
                                        <th className="px-4 py-4">Company</th>
                                        <th className="px-4 py-4">Plan</th>
                                        <th className="px-4 py-4">Team</th>
                                        <th className="px-4 py-4">Quotes</th>
                                        <th className="px-4 py-4">Investors</th>
                                        <th className="px-4 py-4">Campaigns</th>
                                        <th className="px-4 py-4">Active Queue</th>
                                        <th className="px-4 py-4">Overdue</th>
                                        <th className="px-4 py-4">Emails Sent</th>
                                        <th className="px-4 py-4">Last Email</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredSubscribers.length === 0 && (
                                        <EmptyTableState message="No subscriber rows match the current search." colSpan={11} />
                                    )}
                                    {filteredSubscribers.map((subscriber) => (
                                        <tr key={subscriber.org_id} className="border-b border-slate-800/60 text-sm">
                                            <td className="px-4 py-4">
                                                <div className="font-semibold">{subscriber.owner_name || 'Unknown'}</div>
                                                <div className="text-slate-400">{subscriber.owner_email}</div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-300">{subscriber.company || '-'}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${statusBadge(subscriber.subscription_status)}`}>
                                                    {subscriber.subscription_status || 'unknown'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">{formatNumber(subscriber.team_size)}</td>
                                            <td className="px-4 py-4">{formatNumber(subscriber.quotes_count)}</td>
                                            <td className="px-4 py-4">{formatNumber(subscriber.investors_count)}</td>
                                            <td className="px-4 py-4">{formatNumber(subscriber.campaigns_count)}</td>
                                            <td className="px-4 py-4">{formatNumber(subscriber.active_subscriptions)}</td>
                                            <td className="px-4 py-4 text-red-300">{formatNumber(subscriber.overdue_subscriptions)}</td>
                                            <td className="px-4 py-4">{formatNumber(subscriber.emails_sent)}</td>
                                            <td className="px-4 py-4 text-slate-400">{formatDate(subscriber.last_email_sent_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'queue' && (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1200px]">
                                <thead>
                                    <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                                        <th className="px-4 py-4">Subscriber</th>
                                        <th className="px-4 py-4">Campaign</th>
                                        <th className="px-4 py-4">Lead</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">Step</th>
                                        <th className="px-4 py-4">Next Step</th>
                                        <th className="px-4 py-4">Next Run</th>
                                        <th className="px-4 py-4">Last Sent</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredQueue.length === 0 && (
                                        <EmptyTableState message="No scheduled subscriptions match the current search." colSpan={8} />
                                    )}
                                    {filteredQueue.map((row) => (
                                        <tr key={row.subscription_id} className="border-b border-slate-800/60 text-sm">
                                            <td className="px-4 py-4">
                                                <div className="font-semibold">{row.org_name}</div>
                                                <div className="text-slate-400">{row.org_email}</div>
                                            </td>
                                            <td className="px-4 py-4">{row.campaign_name}</td>
                                            <td className="px-4 py-4">
                                                <div>{row.investor_name || 'Unknown lead'}</div>
                                                <div className="text-slate-400">{row.investor_email || 'No email'}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${statusBadge(row.status)}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">{row.current_step_index}</td>
                                            <td className="px-4 py-4">
                                                {row.next_step_order ? (
                                                    <div>
                                                        <div className="font-medium">Step {row.next_step_order}</div>
                                                        <div className="text-slate-400">{row.next_step_subject || 'No subject'}</div>
                                                    </div>
                                                ) : 'Completed'}
                                            </td>
                                            <td className="px-4 py-4 text-slate-300">{formatDate(row.next_run_at)}</td>
                                            <td className="px-4 py-4 text-slate-400">{formatDate(row.last_email_sent_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'failures' && (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px]">
                                <thead>
                                    <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                                        <th className="px-4 py-4">Job</th>
                                        <th className="px-4 py-4">Schedule</th>
                                        <th className="px-4 py-4">Status</th>
                                        <th className="px-4 py-4">Started</th>
                                        <th className="px-4 py-4">Ended</th>
                                        <th className="px-4 py-4">Message</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredFailures.length === 0 && (
                                        <EmptyTableState message="No failed cron runs match the current search." colSpan={6} />
                                    )}
                                    {filteredFailures.map((failure, index) => (
                                        <tr key={`${failure.job_id}-${failure.start_time}-${index}`} className="border-b border-slate-800/60 text-sm">
                                            <td className="px-4 py-4">
                                                <div className="font-semibold">{failure.job_name}</div>
                                                <div className="text-slate-400">Job #{failure.job_id}</div>
                                            </td>
                                            <td className="px-4 py-4">{failure.schedule}</td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${statusBadge(failure.status)}`}>
                                                    {failure.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">{formatDate(failure.start_time)}</td>
                                            <td className="px-4 py-4 text-slate-400">{formatDate(failure.end_time)}</td>
                                            <td className="px-4 py-4 text-slate-300">{formatMessage(failure.return_message)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'activity' && (
                    <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1200px]">
                                <thead>
                                    <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                                        <th className="px-4 py-4">Time</th>
                                        <th className="px-4 py-4">Subscriber</th>
                                        <th className="px-4 py-4">Campaign</th>
                                        <th className="px-4 py-4">Lead</th>
                                        <th className="px-4 py-4">Type</th>
                                        <th className="px-4 py-4">Metadata</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredActivity.length === 0 && (
                                        <EmptyTableState message="No campaign activity matches the current search." colSpan={6} />
                                    )}
                                    {filteredActivity.map((row) => (
                                        <tr key={row.event_id} className="border-b border-slate-800/60 text-sm">
                                            <td className="px-4 py-4 text-slate-300">{formatDate(row.created_at)}</td>
                                            <td className="px-4 py-4">
                                                <div className="font-semibold">{row.org_name}</div>
                                            </td>
                                            <td className="px-4 py-4">{row.campaign_name}</td>
                                            <td className="px-4 py-4">
                                                <div>{row.investor_name || 'Unknown lead'}</div>
                                                <div className="text-slate-400">{row.investor_email || 'No email'}</div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <span className={`inline-flex px-2 py-1 rounded-full border text-xs ${statusBadge(row.event_type)}`}>
                                                    {row.event_type}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-slate-400">{formatMessage(JSON.stringify(row.metadata || {}))}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
