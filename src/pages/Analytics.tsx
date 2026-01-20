
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { MetricCard } from '../components/MetricCard';
import { Modal } from '../components/Modal';
import { Quote, Investor, QuoteStatus } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';

interface AnalyticsProps {
    quotes: Quote[];
    investors: Investor[];
    onViewQuote: (id: string) => void;
}

type ChartView = 'week' | 'month';

interface ChartPoint {
    month: string;
    fullLabel: string;
    volume: number;
    range: { start: Date; end: Date };
    x: number;
    y: number;
}

export const Analytics = ({ quotes, investors, onViewQuote }: AnalyticsProps) => {
    const [chartView, setChartView] = useState<ChartView>('month');
    const [selectedPoint, setSelectedPoint] = useState<ChartPoint | null>(null);

    // Calculate simple metrics
    const totalVolume = quotes.reduce((acc, q) => acc + q.loanAmount, 0);
    const avgLtv = quotes.length > 0 ? quotes.reduce((acc, q) => acc + q.ltv, 0) / quotes.length : 0;
    const closedDeals = quotes.filter(q => q.status === QuoteStatus.WON).length;
    const conversionRate = quotes.length > 0 ? (closedDeals / quotes.length) * 100 : 0;

    // Dynamic Chart Data Calculation
    const getChartData = () => {
        const now = new Date();
        const data = [];

        if (chartView === 'month') {
            // Last 6 Months
            for (let i = 5; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthName = d.toLocaleString('en-US', { month: 'short' });
                const start = new Date(d.getFullYear(), d.getMonth(), 1);
                const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);

                data.push({
                    label: monthName,
                    fullLabel: d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
                    range: { start, end }
                });
            }
        } else { // chartView === 'week'
            // Last 8 Weeks
            for (let i = 7; i >= 0; i--) {
                const d = new Date(now);
                d.setDate(d.getDate() - (i * 7));
                // Align to Sunday/Monday? Let's just do sliding 7-day windows or simpler current week logic.
                // Simpler: End of week is 'd'. Start is 'd - 6'.
                const end = new Date(d);
                const start = new Date(d);
                start.setDate(end.getDate() - 6);

                // Label: "Nov 25"
                const label = start.toLocaleString('en-US', { month: 'short', day: 'numeric' });
                data.push({
                    label,
                    fullLabel: `Week of ${label}`,
                    range: { start, end }
                });
            }
        }

        return data.map(item => {
            const volume = quotes
                .filter(q => {
                    const qDate = new Date(q.createdAt);
                    return qDate >= item.range.start && qDate <= item.range.end;
                })
                .reduce((acc, q) => acc + q.loanAmount, 0);

            return {
                month: item.label, // displayed on axis
                fullLabel: item.fullLabel, // displayed in tooltip
                volume: Number((volume / 1000000).toFixed(2)),
                range: item.range
            };
        });
    };

    const monthlyActivity = getChartData();
    const maxVolume = Math.max(...monthlyActivity.map(d => d.volume)) || 1;

    // Chart Calculations
    const chartHeight = 200;
    const chartWidth = 800; // Virtual width for SVG key calculation
    const xStep = chartWidth / (monthlyActivity.length - 1 || 1);

    const points: ChartPoint[] = monthlyActivity.map((d, i) => {
        const x = i * xStep;
        // Leave 20px padding at top/bottom prevents clipping
        const y = chartHeight - ((d.volume / maxVolume) * (chartHeight * 0.8));
        return { x, y, ...d };
    });

    // Generate Path (Smooth Curve or Straight Lines) -- using straight lines for robustness with small data points
    const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
    const areaPath = `${linePath} L ${chartWidth} ${chartHeight} L 0 ${chartHeight} Z`;

    const getChartSubtitle = () => {
        if (chartView === 'week') return 'Weekly volume for the last 8 weeks';
        return 'Monthly volume for the last 6 months';
    };

    const getSelectedPointDeals = () => {
        if (!selectedPoint) return [];
        return quotes.filter(q => {
            const qDate = new Date(q.createdAt);
            return qDate >= selectedPoint.range.start && qDate <= selectedPoint.range.end;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
                <p className="text-sm text-muted mt-1">Overview of your deal flow and performance.</p>
            </div>

            {/* Top Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <MetricCard
                    label="Active Volume"
                    value={`$${(totalVolume / 1000000).toFixed(1)}M`}
                    icon={Icons.TrendingUp}
                    color="text-emerald-500"
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
                    color="text-banana-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <div className="lg:col-span-2 bg-surface/30 backdrop-blur-xl p-6 rounded-xl border border-border/10 shadow-sm flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Deal Volume Trend</h3>
                            <p className="text-xs text-muted mt-1">{getChartSubtitle()}</p>
                        </div>
                        <div className="flex bg-foreground/5 p-1 rounded-lg">
                            {(['week', 'month'] as ChartView[]).map((view) => (
                                <button
                                    key={view}
                                    onClick={() => setChartView(view)}
                                    className={`px-3 py-1 text-xs font-medium rounded-md transition-all capitalize ${chartView === view
                                        ? 'bg-surface text-foreground shadow-sm'
                                        : 'text-muted hover:text-foreground'
                                        }`}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 min-h-[250px] relative w-full group/chart">
                        {/* SVG Layer for Lines and Area */}
                        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#FDE047" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="#FDE047" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                                <line
                                    key={i}
                                    x1="0"
                                    y1={chartHeight * p}
                                    x2={chartWidth}
                                    y2={chartHeight * p}
                                    className="stroke-border/10"
                                    strokeWidth="1"
                                    strokeDasharray="4 4"
                                    vectorEffect="non-scaling-stroke"
                                />
                            ))}

                            {/* Area Fill */}
                            <path d={areaPath} fill="url(#chartGradient)" />

                            {/* Line Stroke */}
                            <path d={linePath} fill="none" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                        </svg>

                        {/* Interactive HTML Layer (Dots & Tooltips) */}
                        <div className="absolute inset-0">
                            {points.map((p, i) => (
                                <div
                                    key={i}
                                    className="absolute w-8 h-8 -ml-4 -mt-4 flex items-center justify-center group/point cursor-pointer"
                                    onClick={() => setSelectedPoint(p)}
                                    style={{
                                        left: `${(i / (points.length - 1)) * 100}%`,
                                        top: `${(p.y / chartHeight) * 100}%`
                                    }}
                                >
                                    {/* Visible Dot */}
                                    <div className="w-2.5 h-2.5 bg-surface border-2 border-banana-400 rounded-full group-hover/point:scale-150 transition-transform duration-200 shadow-sm" />

                                    {/* Tooltip */}
                                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover/point:opacity-100 transition-opacity pointer-events-none z-10">
                                        <div className="bg-surface border border-border/10 text-foreground shadow-xl text-xs px-2 py-1.5 rounded whitespace-nowrap font-medium flex flex-col items-center">
                                            <span className="font-bold mb-0.5">{p.fullLabel}</span>
                                            <span>${p.volume}M</span>
                                            <div className="w-2 h-2 bg-surface border-b border-r border-border/10 rotate-45 -mt-1 translate-y-1/2 absolute bottom-[-4px]"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* X-Axis Labels */}
                        <div className="absolute bottom-0 left-0 right-0 translate-y-full pt-2 flex justify-between text-xs text-muted font-medium px-2">
                            {points.map((p, i) => (
                                <span key={i}>{p.month}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Secondary Stats */}
                <div className="bg-surface/30 backdrop-blur-xl p-6 rounded-xl border border-border/10 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-6">Deal Mix</h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted">Purchase</span>
                                <span className="font-medium text-foreground">45%</span>
                            </div>
                            <div className="w-full bg-foreground/5 rounded-full h-2">
                                <div className="bg-banana-400 h-2 rounded-full" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted">Refi (Rate/Term)</span>
                                <span className="font-medium text-foreground">30%</span>
                            </div>
                            <div className="w-full bg-foreground/5 rounded-full h-2">
                                <div className="bg-blue-400 h-2 rounded-full" style={{ width: '30%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between text-sm mb-2">
                                <span className="text-muted">Refi (Cash-Out)</span>
                                <span className="font-medium text-foreground">25%</span>
                            </div>
                            <div className="w-full bg-foreground/5 rounded-full h-2">
                                <div className="bg-emerald-400 h-2 rounded-full" style={{ width: '25%' }}></div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-border/10">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-muted">Pipeline Value</span>
                            <span className="text-xl font-bold text-foreground">$4.5M</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Modal */}
            <Modal
                isOpen={!!selectedPoint}
                onClose={() => setSelectedPoint(null)}
                title={`Deals - ${selectedPoint?.fullLabel}`}
                maxWidth="sm:max-w-4xl"
            >
                <div className="mt-4">
                    {getSelectedPointDeals().length === 0 ? (
                        <div className="text-center py-8 text-muted">
                            No active deals found for this period.
                        </div>
                    ) : (
                        <div className="overflow-hidden shadow-sm ring-1 ring-border/10 rounded-2xl">
                            <table className="min-w-full divide-y divide-border/10">
                                <thead className="bg-foreground/5">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-bold text-muted uppercase tracking-wider sm:pl-6">Investor</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-muted uppercase tracking-wider">Loan Amount</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-muted uppercase tracking-wider">Type</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-muted uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10 bg-transparent">
                                    {getSelectedPointDeals().map((quote) => (
                                        <tr
                                            key={quote.id}
                                            onClick={() => onViewQuote(quote.id)}
                                            className="hover:bg-foreground/5 cursor-pointer transition-colors"
                                        >
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                                {quote.investorName}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                                                {formatCurrency(quote.loanAmount)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                                                {quote.dealType}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold
                                                    ${quote.status === 'Won' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        quote.status === 'Lost' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-foreground/10 text-muted'}`}>
                                                    {quote.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                                                {formatDate(quote.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </Modal>
        </div>
    );
};
