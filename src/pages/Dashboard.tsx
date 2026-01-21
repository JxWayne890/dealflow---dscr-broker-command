import React, { useMemo, useState } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { Logo } from '../components/Logo';
import { Quote, QuoteStatus, View, Investor, BrokerProfile } from '../types';

export const Dashboard = ({ quotes, investors = [], onViewQuote, onNewQuote, onNavigate, profile, isDark = false }: { quotes: Quote[], investors?: Investor[], onViewQuote: (id: string) => void, onNewQuote: () => void, onNavigate?: (view: View, filter?: string) => void, profile?: BrokerProfile | null, isDark?: boolean }) => {
    const initials = profile?.name
        ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : '??';

    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];

        // Active Pipeline (Active + Follow-up)
        const activeQuotes = quotes.filter(q => q.status === QuoteStatus.ACTIVE || q.status === QuoteStatus.FOLLOW_UP);
        const activeVolume = activeQuotes.reduce((acc, q) => acc + q.loanAmount, 0);

        // Projected Revenue (Commission)
        // Sum of originationFee + uwFee for active deals
        const projectedRevenue = activeQuotes.reduce((acc, q) => {
            const fees = (q.originationFee || 0) + (q.uwFee || 0);
            return acc + fees;
        }, 0);

        // Follow ups
        const pendingFollowUps = quotes.reduce((acc, q) => {
            if (!q.followUpsEnabled || q.status === QuoteStatus.WON || q.status === QuoteStatus.LOST) return acc;
            const hasPending = q.followUpSchedule.some(f => f.status === 'pending' && f.scheduledDate.startsWith(today));
            return acc + (hasPending ? 1 : 0);
        }, 0);

        // Closed Won
        const wonQuotes = quotes.filter(q => q.status === QuoteStatus.WON);
        const closedVolume = wonQuotes.reduce((acc, q) => acc + q.loanAmount, 0);
        const closedWonCount = wonQuotes.length;

        // Active/Lost for Win Rate
        const lostQuotes = quotes.filter(q => q.status === QuoteStatus.LOST);
        const lostVolume = lostQuotes.reduce((acc, q) => acc + q.loanAmount, 0);

        // Win Rate = Won / (Won + Lost) -- ignoring active for now as they are TBD
        const decidedQuotes = wonQuotes.length + lostQuotes.length;
        const winRate = decidedQuotes > 0 ? (wonQuotes.length / decidedQuotes) * 100 : 0;

        const sentToday = quotes.filter(q => q.createdAt.startsWith(today)).length;

        return {
            sentToday,
            pendingFollowUps,
            activeVolume,
            closedVolume,
            projectedRevenue,
            winRate,
            lostVolume,
            closedWonCount
        };
    }, [quotes]);

    const [searchQuery, setSearchQuery] = useState('');

    const filteredRecentQuotes = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return quotes.slice(0, 10);

        const monthNames = [
            "january", "february", "march", "april", "may", "june",
            "july", "august", "september", "october", "november", "december"
        ];

        return quotes.filter(q => {
            const date = new Date(q.createdAt);
            const monthName = monthNames[date.getMonth()];
            const amountStr = q.loanAmount.toString();
            const formattedAmount = q.loanAmount.toLocaleString();

            const investor = investors.find(inv => inv.id === q.investorId);
            const phoneClean = investor?.phone?.replace(/[^0-9]/g, '');
            const queryClean = query.replace(/[^0-9]/g, '');

            return q.investorName.toLowerCase().includes(query) ||
                q.investorEmail.toLowerCase().includes(query) ||
                (q.propertyAddress && q.propertyAddress.toLowerCase().includes(query)) ||
                (q.propertyCity && q.propertyCity.toLowerCase().includes(query)) ||
                (q.propertyZip && q.propertyZip.toLowerCase().includes(query)) ||
                q.propertyState.toLowerCase().includes(query) ||
                (investor?.company && investor.company.toLowerCase().includes(query)) ||
                (investor?.phone && investor.phone.toLowerCase().includes(query)) ||
                (phoneClean && queryClean && phoneClean.includes(queryClean)) ||
                amountStr.includes(query) ||
                formattedAmount.includes(query) ||
                monthName.includes(query) ||
                date.toLocaleDateString().includes(query);
        }).slice(0, 10);
    }, [quotes, investors, searchQuery]);

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(2)}M`;
        }
        return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="space-y-8 pb-24 md:pb-0">
            <header className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    {/* Mobile Logo */}
                    {/* Mobile Logo */}
                    {/* Mobile Logo */}
                    <div className="md:hidden flex items-center gap-2">
                        <Logo className="h-8 w-auto" variant='icon' isDark={isDark} />
                        <Logo className="h-6 w-auto" variant='full' isDark={isDark} />
                    </div>
                    {/* Desktop Heading */}
                    <div className="hidden md:block">
                        <h1 className="text-3xl font-bold text-foreground tracking-tight">Dashboard</h1>
                        <p className="text-muted text-sm mt-1">Overview of your deal flow and pending actions.</p>
                    </div>
                </div>

                <button
                    onClick={() => onNavigate?.('settings')}
                    className="flex items-center gap-3 md:hidden focus:outline-none"
                    aria-label="Go to Settings"
                >
                    {/* Mobile Greeting - Optional */}
                    <span className="text-sm font-semibold text-foreground">
                        {profile?.name ? `Hi, ${profile.name.split(' ')[0]}` : ''}
                    </span>

                    <div className="h-10 w-10 rounded-full bg-banana-400 text-slate-900 font-bold border border-banana-500 shadow-lg shadow-banana-400/20 flex items-center justify-center">
                        {initials}
                    </div>
                </button>

                {/* Desktop Profile (Hidden here, usually in Sidebar) */}
                <div className="hidden md:block"></div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Active Pipeline */}
                <MetricCard
                    label="Active Volume"
                    value={formatCurrency(stats.activeVolume)}
                    icon={Icons.TrendingUp}
                    color="text-emerald-400"
                    subtext={`${quotes.filter(q => q.status === QuoteStatus.ACTIVE || q.status === QuoteStatus.FOLLOW_UP).length} deals active`}
                    onClick={() => onNavigate?.('quotes', 'active')}
                />
                <MetricCard
                    label="Projected Fees"
                    value={formatCurrency(stats.projectedRevenue)}
                    icon={Icons.DollarSign}
                    color="text-banana-400"
                    subtext="Potential commission"
                    onClick={() => onNavigate?.('quotes', 'active')}
                />

                {/* Performance */}
                <MetricCard
                    label="Closed Volume"
                    value={formatCurrency(stats.closedVolume)}
                    icon={Icons.CheckCircle}
                    color="text-secondary"
                    onClick={() => onNavigate?.('quotes', 'won')}
                />
                <MetricCard
                    label="Win Rate"
                    value={`${stats.winRate.toFixed(0)}%`}
                    icon={Icons.Award}
                    color="text-blue-400"
                    subtext={`Based on ${stats.closedWonCount} wins`}
                    onClick={() => onNavigate?.('analytics')}
                />

                {/* Operational */}
                <MetricCard
                    label="Pending Follow-Ups"
                    value={stats.pendingFollowUps.toString()}
                    icon={Icons.Clock}
                    color="text-orange-400"
                    subtext="Action required"
                    onClick={() => onNavigate?.('quotes', 'follow_up')}
                />
                <MetricCard
                    label="Lost Volume"
                    value={formatCurrency(stats.lostVolume)}
                    icon={Icons.XCircle}
                    color="text-slate-400"
                    onClick={() => onNavigate?.('quotes', 'lost')}
                />
            </div>

            {/* Action Center: Due Follow Ups */}
            {stats.pendingFollowUps > 0 && (
                <div className="bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 backdrop-blur-md rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-orange-500/20 rounded-xl text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/10">
                                <Icons.Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-bold text-foreground text-lg">Follow-ups Due Today</h3>
                                <p className="text-sm text-muted">These deals need your attention.</p>
                            </div>
                        </div>
                        <Button variant="secondary" className="bg-surface/50 border-border/10 text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/30 hover:text-orange-300">
                            Process All ({stats.pendingFollowUps})
                        </Button>
                    </div>

                    <div className="grid gap-3 relative z-10">
                        {quotes
                            .filter(q => {
                                const today = new Date().toISOString().split('T')[0];
                                return q.followUpsEnabled &&
                                    q.status !== QuoteStatus.WON &&
                                    q.status !== QuoteStatus.LOST &&
                                    q.followUpSchedule.some(f => f.status === 'pending' && f.scheduledDate.startsWith(today));
                            })
                            .map(q => {
                                const dueStep = q.followUpSchedule.find(f => f.status === 'pending' && f.scheduledDate.startsWith(new Date().toISOString().split('T')[0]));
                                const stepNumber = dueStep ? q.followUpSchedule.indexOf(dueStep) + 1 : 1;

                                return (
                                    <div key={q.id} className="bg-surface/40 hover:bg-foreground/5 border border-border/10 rounded-xl p-4 flex items-center justify-between transition-colors group">
                                        <div>
                                            <h4 className="font-semibold text-foreground group-hover:text-banana-600 dark:group-hover:text-banana-400 transition-colors">{q.investorName} <span className="text-muted font-normal">| {q.propertyState}</span></h4>
                                            <div className="text-xs text-orange-400 font-medium mt-1 flex items-center">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]"></span>
                                                Follow-up #{stepNumber} due today
                                            </div>
                                        </div>
                                        <Button onClick={() => onViewQuote(q.id)} variant="secondary" className="px-4 py-1.5 text-xs h-8">Review</Button>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}



            {/* Recent Activity */}
            <div className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-xl font-bold text-foreground tracking-tight">Recent Quotes</h2>
                    <div className="relative group w-full md:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted group-focus-within:text-banana-600 dark:group-focus-within:text-banana-400 transition-colors">
                            <Icons.Search className="w-4 h-4" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, property, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-10 py-3 bg-surface/50 border border-border/10 rounded-xl shadow-lg shadow-black/10 focus:ring-2 focus:ring-banana-400/20 focus:border-banana-400/50 transition-all text-sm text-foreground placeholder:text-muted font-medium"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted hover:text-foreground transition-colors"
                            >
                                <Icons.XCircle className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>

                {filteredRecentQuotes.length === 0 ? (
                    <div className="text-center py-16 text-muted bg-surface/20 rounded-2xl border border-dashed border-border/10 backdrop-blur-sm">
                        {searchQuery ? `No quotes matching "${searchQuery}"` : 'No quotes yet. Start your first deal!'}
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-surface/30 backdrop-blur-xl rounded-2xl border border-border/10 shadow-2xl overflow-hidden">
                            <table className="min-w-full divide-y divide-border/10">
                                <thead className="bg-foreground/5">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Investor</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Property</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Amount</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-muted uppercase tracking-wider">Date</th>
                                        <th scope="col" className="relative px-6 py-4"><span className="sr-only">View</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-border/10">
                                    {filteredRecentQuotes.map((quote) => (
                                        <tr key={quote.id} onClick={() => onViewQuote(quote.id)} className="hover:bg-foreground/5 cursor-pointer transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-bold text-foreground group-hover:text-banana-600 dark:group-hover:text-banana-400 transition-colors">{quote.investorName}</div>
                                                <div className="text-xs text-muted font-medium">{quote.investorEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-slate-500 dark:text-slate-300">{quote.propertyState}</div>
                                                <div className="text-xs text-muted">{quote.dealType}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-mono font-medium tracking-tight">
                                                ${quote.loanAmount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={quote.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-muted">
                                                <div className="text-slate-600 dark:text-slate-300 font-medium">{new Date(quote.createdAt).toLocaleDateString()}</div>
                                                <div className="text-[10px] text-muted">{new Date(quote.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="h-8 w-8 rounded-full bg-foreground/5 flex items-center justify-center group-hover:bg-banana-400 group-hover:text-slate-900 transition-all">
                                                    <Icons.ChevronLeft className="w-5 h-5 text-muted group-hover:text-slate-900 rotate-180 transition-colors" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="space-y-3 md:hidden">
                            {filteredRecentQuotes.map(quote => (
                                <div
                                    key={quote.id}
                                    onClick={() => onViewQuote(quote.id)}
                                    className="bg-surface/40 backdrop-blur-lg p-5 rounded-2xl border border-border/10 active:scale-[0.98] transition-transform cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="font-bold text-foreground">{quote.investorName}</span>
                                            <StatusBadge status={quote.status} />
                                        </div>
                                        <div className="text-sm text-muted font-medium">
                                            ${(quote.loanAmount / 1000).toFixed(0)}k • {quote.propertyState} • {quote.dealType}
                                        </div>
                                    </div>
                                    <Icons.ArrowRight className="w-5 h-5 text-muted" />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
