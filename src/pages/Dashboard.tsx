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
        <div className="space-y-10 pb-24 md:pb-0">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 overflow-hidden">
                <div className="flex items-center gap-4 relative">
                    <div className="md:hidden flex items-center gap-3">
                        <div className="p-2 bg-banana-400 rounded-xl shadow-[0_0_20px_rgba(250,204,21,0.3)]">
                            <Logo className="h-7 w-auto" variant='icon' isDark={false} />
                        </div>
                        <Logo className="h-6 w-auto" variant='full' isDark={isDark} />
                    </div>

                    <div className="hidden md:block">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-banana-600 dark:text-banana-400 opacity-60">System Operational</span>
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        <h1 className="text-3xl font-bold text-foreground leading-none">
                            {profile?.name ? `Welcome back, ${profile.name.split(' ')[0]}` : 'Dashboard'}
                        </h1>
                        <p className="text-muted text-sm mt-3 flex items-center gap-2">
                            <Icons.Sparkles className="w-4 h-4 text-banana-400" />
                            Your pipeline is healthy with <span className="text-foreground font-semibold">{quotes.filter(q => q.status === QuoteStatus.ACTIVE).length} active deals</span> in queue.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate?.('settings')}
                        className="flex items-center gap-3 md:hidden focus:outline-none p-1.5 rounded-2xl bg-surfaceHighlight/50 border border-border/5"
                    >
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-banana-300 to-banana-500 text-slate-950 font-bold border border-banana-400 shadow-lg flex items-center justify-center">
                            {initials}
                        </div>
                    </button>


                </div>
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

            {/* Intelligence Center: Due Action Items */}
            {stats.pendingFollowUps > 0 && (
                <section className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 via-banana-400/20 to-orange-500/20 rounded-[2.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                    <div className="relative bg-surface/40 backdrop-blur-3xl border border-orange-500/10 rounded-[2.5rem] p-8 overflow-hidden">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="p-4 bg-orange-500 rounded-[1.2rem] text-slate-950">
                                    <Icons.Zap className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-orange-500">Intelligence Briefing</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></div>
                                    </div>
                                    <h3 className="font-bold text-foreground text-xl">Active Quotes Required</h3>
                                    <p className="text-sm text-muted mt-1">Found <span className="text-orange-500 font-semibold">{stats.pendingFollowUps} critical follow-ups</span> requiring immediate sequence execution.</p>
                                </div>
                            </div>
                            <Button variant="secondary" className="h-12 px-6 bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500 text-slate-950 font-bold rounded-2xl transition-all">
                                Execute All Sequences
                            </Button>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4 relative z-10">
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
                                        <div key={q.id} className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 hover:border-orange-500/30 rounded-2xl p-5 flex items-center justify-between transition-all group/item">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-bold text-foreground group-hover/item:text-orange-500 transition-colors">{q.investorName}</h4>
                                                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-muted uppercase">{q.propertyState}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex -space-x-1">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className={`w-1.5 h-1.5 rounded-full border border-surface ${i <= stepNumber ? 'bg-orange-500' : 'bg-muted/20'}`} />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] text-orange-500/80 font-medium uppercase tracking-widest">Sequence Step {stepNumber}</span>
                                                </div>
                                            </div>
                                            <button onClick={() => onViewQuote(q.id)} className="text-muted hover:text-orange-500 transition-all duration-300 hover:drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]">
                                                <Icons.ChevronRight className="w-6 h-6" />
                                            </button>
                                        </div>
                                    );
                                })}
                        </div>
                    </div>
                </section>
            )}

            {/* Recent Activity */}
            <section className="space-y-6">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-banana-600 dark:text-banana-400 opacity-60">Ledger</span>
                        </div>
                        <h2 className="text-2xl font-bold text-foreground">Recent Quotes</h2>
                    </div>
                    <div className="relative group w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-banana-500 transition-colors">
                            <Icons.Search className="w-5 h-5" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search name, property, or amount..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-12 pr-12 py-4 bg-surface/30 backdrop-blur-xl border border-border/5 rounded-2xl shadow-xl focus:ring-2 focus:ring-banana-400/20 focus:border-banana-400/30 transition-all text-sm font-bold text-foreground placeholder:text-muted/50"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted hover:text-foreground transition-colors"
                            >
                                <Icons.XCircle className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>

                {filteredRecentQuotes.length === 0 ? (
                    <div className="text-center py-24 text-muted bg-surface/20 rounded-[3rem] border border-dashed border-border/10 backdrop-blur-sm">
                        <div className="w-16 h-16 bg-surfaceHighlight/50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 opacity-50">
                            <Icons.FileText className="w-8 h-8" />
                        </div>
                        <p className="font-bold text-lg mb-1">{searchQuery ? `Verification Failed` : 'System Empty'}</p>
                        <p className="text-sm font-medium opacity-60 max-w-xs mx-auto px-4">
                            {searchQuery ? `No records matching "${searchQuery}" found in the primary database.` : 'Deploy your first quote to begin tracking deal velocity and intelligence.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-surface/20 backdrop-blur-3xl rounded-[2.5rem] border border-border/5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] overflow-hidden">
                            <table className="min-w-full divide-y divide-white/5">
                                <thead className="bg-white/5">
                                    <tr>
                                        <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Investor Quote</th>
                                        <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Deployment</th>
                                        <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Volume</th>
                                        <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Status</th>
                                        <th scope="col" className="px-8 py-5 text-left text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Timestamp</th>
                                        <th scope="col" className="relative px-8 py-5"><span className="sr-only">Access</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-white/5">
                                    {filteredRecentQuotes.map((quote) => (
                                        <tr key={quote.id} onClick={() => onViewQuote(quote.id)} className="hover:bg-white/[0.04] cursor-pointer transition-all group">
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-base font-bold text-foreground group-hover:text-banana-400 transition-colors">{quote.investorName}</div>
                                                <div className="text-[11px] text-muted font-medium opacity-70 italic">{quote.investorEmail}</div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-semibold text-foreground/80">{quote.propertyState}</span>
                                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surfaceHighlight/50 border border-border/5 text-muted tracking-wide uppercase">{quote.dealType}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-base font-bold text-foreground">
                                                    ${quote.loanAmount.toLocaleString()}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <StatusBadge status={quote.status} />
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap">
                                                <div className="text-xs font-bold text-foreground/70 uppercase">{new Date(quote.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                                                <div className="text-[9px] text-muted font-medium tracking-[0.1em] opacity-50 uppercase">{new Date(quote.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-8 py-6 whitespace-nowrap text-right">
                                                <Icons.ChevronRight className="w-6 h-6 text-muted/40 group-hover:text-banana-400 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.6)] inline-block" />
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
                                    className="bg-surface/40 backdrop-blur-lg p-5 rounded-2xl border border-border/10 active:scale-[0.98] transition-transform cursor-pointer flex justify-between items-center group"
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
                                    <Icons.ChevronRight className="w-6 h-6 text-muted/40 transition-all duration-300 group-active:text-banana-400 group-active:drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </section>
        </div>
    );
};
