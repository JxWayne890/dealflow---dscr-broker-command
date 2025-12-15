import React, { useMemo } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { Quote, QuoteStatus } from '../types';

export const Dashboard = ({ quotes, onViewQuote, onNewQuote }: { quotes: Quote[], onViewQuote: (id: string) => void, onNewQuote: () => void }) => {
    const stats = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        const pendingFollowUps = quotes.reduce((acc, q) => {
            if (!q.followUpsEnabled || q.status === QuoteStatus.CLOSED_WON || q.status === QuoteStatus.CLOSED_LOST) return acc;
            const hasPending = q.followUpSchedule.some(f => f.status === 'pending' && f.scheduledDate.startsWith(today));
            return acc + (hasPending ? 1 : 0);
        }, 0);

        const activeVolume = quotes
            .filter(q => q.status !== QuoteStatus.CLOSED_LOST && q.status !== QuoteStatus.CLOSED_WON)
            .reduce((acc, q) => acc + q.loanAmount, 0);

        const closedWon = quotes.filter(q => q.status === QuoteStatus.CLOSED_WON).length;
        const sentToday = quotes.filter(q => q.createdAt.startsWith(today)).length;

        return { sentToday, pendingFollowUps, activeVolume, closedWon };
    }, [quotes]);

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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard label="Active Volume" value={`$${(stats.activeVolume / 1000000).toFixed(1)}M`} icon={Icons.TrendingUp} color="text-emerald-500" />
                <MetricCard label="Pending Follow-Ups" value={stats.pendingFollowUps.toString()} icon={Icons.Clock} color="text-orange-500" subtext="Action required" />
                <MetricCard label="Quotes Sent Today" value={stats.sentToday.toString()} icon={Icons.Send} color="text-blue-500" />
                <MetricCard label="Deals Closed" value={stats.closedWon.toString()} icon={Icons.CheckCircle} color="text-indigo-500" />
            </div>

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
                        <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
