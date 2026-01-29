import React from 'react';
import { Icons } from '../components/Icons';
import { StatusBadge } from '../components/StatusBadge';
import { Quote, QuoteStatus, View, Investor } from '../types';

import { StatusDropdown } from '../components/StatusDropdown';

type SortConfig = {
    key: 'investorName' | 'loanAmount' | 'createdAt' | 'status';
    direction: 'asc' | 'desc';
} | null;

export const QuotesList = ({ quotes, investors = [], onViewQuote, onUpdateStatus, initialFilter = 'all' }: { quotes: Quote[], investors?: Investor[], onViewQuote: (id: string) => void, onUpdateStatus?: (id: string, status: QuoteStatus) => void, initialFilter?: string }) => {
    const [activeTab, setActiveTab] = React.useState<string>(initialFilter);
    const [sort, setSort] = React.useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
    const [searchQuery, setSearchQuery] = React.useState('');

    React.useEffect(() => {
        setActiveTab(initialFilter);
    }, [initialFilter]);

    const handleSort = (key: 'investorName' | 'loanAmount' | 'createdAt' | 'status') => {
        setSort(prev => {
            if (prev?.key === key) {
                return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    const filteredAndSortedQuotes = React.useMemo(() => {
        // Filter
        let result = quotes.filter(q => {
            // Tab filtering
            let matchTab = false;
            switch (activeTab) {
                case 'draft': matchTab = q.status === QuoteStatus.DRAFT; break;
                case 'active': matchTab = q.status === QuoteStatus.ACTIVE; break;
                case 'won': matchTab = q.status === QuoteStatus.WON; break;
                case 'lost': matchTab = q.status === QuoteStatus.LOST; break;
                case 'downloaded': matchTab = q.status === QuoteStatus.DOWNLOADED; break;
                case 'follow_up': matchTab = q.status === QuoteStatus.FOLLOW_UP; break;
                case 'all':
                default:
                    matchTab = q.status !== QuoteStatus.DRAFT;
            }

            // Search filtering
            const query = searchQuery.toLowerCase().trim();
            const matchSearch = (() => {
                const monthNames = [
                    "january", "february", "march", "april", "may", "june",
                    "july", "august", "september", "october", "november", "december"
                ];
                const date = new Date(q.createdAt);
                const monthName = monthNames[date.getMonth()];
                const amountStr = (q.loanAmount || 0).toString();
                const formattedAmount = (q.loanAmount || 0).toLocaleString();

                const investor = investors.find(inv => inv.id === q.investorId);
                const phoneClean = investor?.phone?.replace(/[^0-9]/g, '');
                const queryClean = query.replace(/[^0-9]/g, '');

                return (q.investorName || '').toLowerCase().includes(query) ||
                    (q.investorEmail || '').toLowerCase().includes(query) ||
                    (q.propertyAddress && q.propertyAddress.toLowerCase().includes(query)) ||
                    (q.propertyCity && q.propertyCity.toLowerCase().includes(query)) ||
                    (q.propertyZip && q.propertyZip.toLowerCase().includes(query)) ||
                    (q.propertyState || '').toLowerCase().includes(query) ||
                    (investor?.company && investor.company.toLowerCase().includes(query)) ||
                    (investor?.phone && investor.phone.toLowerCase().includes(query)) ||
                    (phoneClean && queryClean && phoneClean.includes(queryClean)) ||
                    amountStr.includes(query) ||
                    formattedAmount.includes(query) ||
                    monthName.includes(query) ||
                    date.toLocaleDateString().includes(query);
            })();

            return matchTab && matchSearch;
        });

        // Sort
        if (sort) {
            result.sort((a, b) => {
                const valA = a[sort.key] || '';
                const valB = b[sort.key] || '';

                if (valA < valB) return sort.direction === 'asc' ? -1 : 1;
                if (valA > valB) return sort.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return result;
    }, [quotes, investors, activeTab, sort, searchQuery]);

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'draft', label: 'Draft' },
        { id: 'won', label: 'Won' },
        { id: 'lost', label: 'Lost' },
        { id: 'follow_up', label: 'Follow-up' },
        { id: 'downloaded', label: 'Downloaded' },
    ];

    const SortIndicator = ({ column }: { column: string }) => {
        if (sort?.key !== column) return <Icons.ChevronUp className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sort.direction === 'asc' ? <Icons.ChevronUp className="w-3 h-3 text-indigo-500" /> : <Icons.ChevronDown className="w-3 h-3 text-indigo-500" />;
    };

    return (
        <div className="pb-24 md:pb-0 space-y-8">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 overflow-hidden">
                <div className="space-y-4 w-full md:w-auto">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-banana-600 dark:text-banana-400 opacity-60">Ledger Index</span>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground leading-none">Quotes</h1>
                    </div>

                    <div className="flex p-1.5 bg-surfaceHighlight/30 backdrop-blur-md rounded-2xl border border-border/5 inline-flex overflow-x-auto max-w-full no-scrollbar shadow-sm">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-5 py-2 text-xs font-semibold uppercase tracking-widest rounded-xl whitespace-nowrap transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-gradient-to-br from-banana-300 to-banana-500 text-slate-950 shadow-lg shadow-banana-400/20 scale-105'
                                    : 'text-muted/60 hover:text-foreground hover:bg-white/5'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative group w-full md:w-96">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted group-focus-within:text-banana-500 transition-colors">
                        <Icons.Search className="w-5 h-5" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search name, property, or volume..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-12 pr-12 py-4 bg-surface/30 backdrop-blur-xl border border-border/5 rounded-2xl shadow-xl focus:ring-2 focus:ring-banana-400/20 focus:border-banana-400/30 transition-all text-sm font-medium text-foreground placeholder:text-muted/50"
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
            </header>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-surface/20 backdrop-blur-3xl rounded-[2.5rem] border border-border/5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] overflow-hidden">
                <table className="min-w-full divide-y divide-white/5">
                    <thead className="bg-white/5">
                        <tr>
                            <th
                                scope="col"
                                onClick={() => handleSort('investorName')}
                                className="px-8 py-5 text-left text-[10px] font-semibold text-muted uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-1">Investor Quote <SortIndicator column="investorName" /></div>
                            </th>
                            <th scope="col" className="px-8 py-5 text-left text-[10px] font-semibold text-muted uppercase tracking-wider">Deployment</th>
                            <th
                                scope="col"
                                onClick={() => handleSort('loanAmount')}
                                className="px-8 py-5 text-left text-[10px] font-semibold text-muted uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-1">Volume <SortIndicator column="loanAmount" /></div>
                            </th>
                            <th
                                scope="col"
                                onClick={() => handleSort('createdAt')}
                                className="px-8 py-5 text-left text-[10px] font-semibold text-muted uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-1">Date <SortIndicator column="createdAt" /></div>
                            </th>
                            <th scope="col" className="px-8 py-5 text-left text-[10px] font-semibold text-muted uppercase tracking-wider">Configuration</th>
                            <th
                                scope="col"
                                onClick={() => handleSort('status')}
                                className="px-8 py-5 text-left text-[10px] font-semibold text-muted uppercase tracking-wider cursor-pointer hover:bg-white/5 transition-colors group"
                            >
                                <div className="flex items-center gap-1">Status <SortIndicator column="status" /></div>
                            </th>
                            <th scope="col" className="relative px-8 py-5 text-center text-[10px] font-semibold text-muted uppercase tracking-wider">Access</th>
                        </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-white/5">
                        {filteredAndSortedQuotes.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-8 py-24 text-center">
                                    <div className="flex flex-col items-center justify-center opacity-40">
                                        <div className="p-4 bg-white/5 rounded-2xl mb-4 text-muted">
                                            <Icons.AlertCircle className="w-8 h-8" />
                                        </div>
                                        <p className="text-lg font-bold text-foreground">Zero Vectors Detected</p>
                                        <p className="text-xs font-semibold text-muted mt-1 uppercase tracking-widest">No matching records in sequence hub.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedQuotes.map((quote) => (
                                <tr key={quote.id} className="hover:bg-white/[0.04] cursor-pointer transition-all group">
                                    <td className="px-8 py-6 whitespace-nowrap" onClick={() => onViewQuote(quote.id)}>
                                        <div className="text-base font-bold text-foreground group-hover:text-banana-400 transition-colors">{quote.investorName}</div>
                                        <div className="text-[11px] text-muted font-medium opacity-70 italic">{quote.investorEmail}</div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap" onClick={() => onViewQuote(quote.id)}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-semibold text-foreground/80">{quote.propertyState}</span>
                                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surfaceHighlight/50 border border-border/5 text-muted tracking-wide uppercase">{quote.dealType}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap text-base font-bold text-foreground" onClick={() => onViewQuote(quote.id)}>
                                        ${quote.loanAmount?.toLocaleString() || '0'}
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap text-xs font-medium text-foreground/70" onClick={() => onViewQuote(quote.id)}>
                                        {new Date(quote.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap" onClick={() => onViewQuote(quote.id)}>
                                        <div className="text-xs font-bold text-foreground/70 uppercase">{quote.termYears}Y Fixed Duration</div>
                                        <div className="text-[10px] text-muted font-medium tracking-widest uppercase">{quote.rate}% Rate Floor</div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        {onUpdateStatus ? (
                                            <StatusDropdown
                                                currentStatus={quote.status}
                                                onStatusChange={(newStatus) => onUpdateStatus(quote.id, newStatus)}
                                            />
                                        ) : (
                                            <StatusBadge status={quote.status} />
                                        )}
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap text-right" onClick={() => onViewQuote(quote.id)}>
                                        <Icons.ChevronRight className="w-6 h-6 mx-auto text-muted/40 group-hover:text-banana-400 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-4 md:hidden">
                {filteredAndSortedQuotes.map(quote => (
                    <div
                        key={quote.id}
                        className="bg-surface/30 backdrop-blur-xl p-6 rounded-[2rem] border border-border/5 shadow-xl active:scale-[0.98] transition-transform flex flex-col group"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-foreground" onClick={() => onViewQuote(quote.id)}>{quote.investorName}</h3>
                                <p className="text-[10px] font-medium text-muted uppercase tracking-widest">{quote.dealType} • {quote.propertyState}</p>
                            </div>
                            <div className="relative">
                                {onUpdateStatus ? (
                                    <StatusDropdown
                                        currentStatus={quote.status}
                                        onStatusChange={(newStatus) => onUpdateStatus(quote.id, newStatus)}
                                    />
                                ) : (
                                    <StatusBadge status={quote.status} />
                                )}
                            </div>
                        </div>
                        <div className="flex items-end justify-between border-t border-white/5 pt-4" onClick={() => onViewQuote(quote.id)}>
                            <div>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mb-1">Vector Volume</p>
                                <p className="text-xl font-bold text-foreground">${quote.loanAmount?.toLocaleString() || '0'}</p>
                            </div>
                            <div className="text-muted/40 group-hover:text-banana-400 transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">
                                <Icons.ChevronRight className="w-6 h-6" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
