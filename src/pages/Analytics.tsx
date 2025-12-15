
import React from 'react';
import { Icons } from '../components/Icons';
import { MetricCard } from '../components/MetricCard';
import { Quote, Investor } from '../types';

interface AnalyticsProps {
    quotes: Quote[];
    investors: Investor[];
}

export const Analytics = ({ quotes, investors }: AnalyticsProps) => {
    // Calculate simple metrics
    const totalVolume = quotes.reduce((acc, q) => acc + q.loanAmount, 0);
    const avgLtv = quotes.length > 0 ? quotes.reduce((acc, q) => acc + q.ltv, 0) / quotes.length : 0;
    const closedDeals = quotes.filter(q => q.status === 'Closed Won').length;
    const conversionRate = quotes.length > 0 ? (closedDeals / quotes.length) * 100 : 0;

    // Simple mock data for "Activity Over Time" chart
    const monthlyActivity = [
        { month: 'Jan', volume: 1.2 },
        { month: 'Feb', volume: 2.1 },
        { month: 'Mar', volume: 1.8 },
        { month: 'Apr', volume: 3.2 },
        { month: 'May', volume: 2.5 },
        { month: 'Jun', volume: 4.0 },
    ];

    const maxVolume = Math.max(...monthlyActivity.map(d => d.volume));

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
                <p className="text-sm text-gray-500 mt-1">Overview of your deal flow and performance.</p>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Active Volume"
                    value={`$${(totalVolume / 1000000).toFixed(1)}M`}
                    icon={Icons.TrendingUp}
                    color="text-green-500"
                />
                <MetricCard
                    label="Total Investors"
                    value={investors.length.toString()}
                    icon={Icons.Users}
                    color="text-blue-500"
                />
                <MetricCard
                    label="Avg. LTV"
                    value={`${avgLtv.toFixed(0)}%`}
                    icon={Icons.PieChart}
                    color="text-indigo-500"
                />
                <MetricCard
                    label="Conversion"
                    value={`${conversionRate.toFixed(1)}%`}
                    icon={Icons.Award}
                    color="text-yellow-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Deal Volume (Last 6 Months)</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {monthlyActivity.map((data, i) => (
                            <div key={i} className="flex-1 flex flex-col items-center group">
                                <div
                                    className="w-full bg-indigo-100 rounded-t-lg group-hover:bg-indigo-200 transition-all relative"
                                    style={{ height: `${(data.volume / maxVolume) * 100}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        ${data.volume}M
                                    </div>
                                </div>
                                <span className="text-xs text-gray-500 mt-2 font-medium">{data.month}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Deal Mix</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Purchase</span>
                                <span className="font-medium text-gray-900">45%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-indigo-500 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Refi (Rate/Term)</span>
                                <span className="font-medium text-gray-900">30%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '30%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-600">Refi (Cash-Out)</span>
                                <span className="font-medium text-gray-900">25%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-teal-500 h-2 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-500">Pipeline Value</span>
                            <span className="text-xl font-bold text-gray-900">$4.5M</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
