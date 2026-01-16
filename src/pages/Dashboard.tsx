import React, { useMemo } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { Quote, QuoteStatus, View } from '../types';

export const Dashboard = ({ quotes, onViewQuote, onNewQuote, onNavigate }: { quotes: Quote[], onViewQuote: (id: string) => void, onNewQuote: () => void, onNavigate?: (view: View, filter?: string) => void }) => {
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

    const formatCurrency = (amount: number) => {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(2)}M`;
        }
        return `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    return (
        <div className="space-y-6 pb-24 md:pb-0">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 text-sm hidden md:block">Overview of your deal flow and pending actions.</p>
                </div>
                <div className="md:hidden h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                    JB
                </div>
            </header>

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Pipeline */}
                <MetricCard
                    label="Active Volume"
                    value={formatCurrency(stats.activeVolume)}
                    icon={Icons.TrendingUp}
                    color="text-emerald-600"
                    subtext={`${quotes.filter(q => q.status === QuoteStatus.ACTIVE || q.status === QuoteStatus.FOLLOW_UP).length} deals active`}
                    onClick={() => onNavigate?.('quotes', 'active')}
                />
                <MetricCard
                    label="Projected Fees"
                    value={formatCurrency(stats.projectedRevenue)}
                    icon={Icons.DollarSign}
                    color="text-amber-500"
                    subtext="Potential commission"
                    onClick={() => onNavigate?.('quotes', 'active')}
                />

                {/* Performance */}
                <MetricCard
                    label="Closed Volume"
                    value={formatCurrency(stats.closedVolume)}
                    icon={Icons.CheckCircle}
                    color="text-indigo-600"
                    onClick={() => onNavigate?.('quotes', 'won')}
                />
                <MetricCard
                    label="Win Rate"
                    value={`${stats.winRate.toFixed(0)}%`}
                    icon={Icons.Award}
                    color="text-blue-500"
                    subtext={`Based on ${stats.closedWonCount} wins`}
                    onClick={() => onNavigate?.('analytics')}
                />

                {/* Operational */}
                <MetricCard
                    label="Pending Follow-Ups"
                    value={stats.pendingFollowUps.toString()}
                    icon={Icons.Clock}
                    color="text-orange-500"
                    subtext="Action required"
                    onClick={() => onNavigate?.('quotes', 'follow_up')}
                />
                <MetricCard
                    label="Lost Volume"
                    value={formatCurrency(stats.lostVolume)}
                    icon={Icons.XCircle}
                    color="text-gray-400"
                    onClick={() => onNavigate?.('quotes', 'lost')}
                />
            </div>

            {/* Action Center: Due Follow Ups */}
            {stats.pendingFollowUps > 0 && (
                <div className="bg-orange-50 border border-orange-100 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-orange-100 rounded-lg text-orange-600">
                                <Icons.Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Follow-ups Due Today</h3>
                                <p className="text-sm text-gray-600">These deals need your attention.</p>
                            </div>
                        </div>
                        <Button variant="secondary" className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100 hover:border-orange-300">
                            Process All ({stats.pendingFollowUps})
                        </Button>
                    </div>

                    <div className="grid gap-3">
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
                                    <div key={q.id} className="bg-white rounded-lg border border-orange-100 p-4 flex items-center justify-between shadow-sm">
                                        <div>
                                            <h4 className="font-medium text-gray-900">{q.investorName} <span className="text-gray-400 font-normal">| {q.propertyState}</span></h4>
                                            <div className="text-xs text-orange-600 font-medium mt-1 flex items-center">
                                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 mr-1.5 animate-pulse"></span>
                                                Follow-up #{stepNumber} due today
                                            </div>
                                        </div>
                                        <Button onClick={() => onViewQuote(q.id)} className="px-3 py-1 text-sm h-8">Review</Button>
                                    </div>
                                );
                            })}
                    </div>
                </div>
            )}

            {/* Quick Actions (Mobile Only) */}
            <div className="grid grid-cols-1 md:hidden">
                <Button onClick={onNewQuote} icon={Icons.Plus} className="w-full shadow-md bg-indigo-600">
                    New Quote
                </Button>
            </div>

            {/* Recent Activity */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900">Recent Quotes</h2>
                    <button onClick={() => { }} className="text-sm text-indigo-600 font-medium hover:text-indigo-800 md:hidden">View All</button>
                </div>

                {quotes.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
                        No quotes yet. Start your first deal!
                    </div>
                ) : (
                    <>
                        {/* Desktop Table View */}
                        <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {quotes.slice(0, 5).map((quote) => (
                                        <tr key={quote.id} onClick={() => onViewQuote(quote.id)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{quote.investorName}</div>
                                                <div className="text-sm text-gray-500">{quote.investorEmail}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{quote.propertyState}</div>
                                                <div className="text-xs text-gray-500">{quote.dealType}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                ${quote.loanAmount.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge status={quote.status} />
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(quote.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Icons.ChevronLeft className="w-5 h-5 text-gray-400 rotate-180 inline-block" />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="space-y-3 md:hidden">
                            {quotes.slice(0, 5).map(quote => (
                                <div
                                    key={quote.id}
                                    onClick={() => onViewQuote(quote.id)}
                                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:scale-[0.98] transition-transform cursor-pointer flex justify-between items-center"
                                >
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-semibold text-gray-900">{quote.investorName}</span>
                                            <StatusBadge status={quote.status} />
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            ${(quote.loanAmount / 1000).toFixed(0)}k • {quote.propertyState} • {quote.dealType}
                                        </div>
                                    </div>
                                    <Icons.ArrowRight className="w-5 h-5 text-gray-300" />
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};
