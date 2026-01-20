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
    const [sort, setSort] = React.useState<SortConfig>(null);
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
    ];

    const SortIndicator = ({ column }: { column: string }) => {
        if (sort?.key !== column) return <Icons.ChevronUp className="w-3 h-3 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sort.direction === 'asc' ? <Icons.ChevronUp className="w-3 h-3 text-indigo-500" /> : <Icons.ChevronDown className="w-3 h-3 text-indigo-500" />;
    };

    return (
        <div className="pb-24 md:pb-0">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground tracking-tight">Quotes</h1>
                    <div className="flex space-x-1 mt-2 bg-foreground/5 p-1 rounded-lg inline-flex overflow-x-auto max-w-full no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="relative group w-full md:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted group-focus-within:text-banana-400 transition-colors">
                        <Icons.Search className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Search name, property, or phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2.5 bg-surface border border-border/10 rounded-2xl shadow-sm focus:ring-2 focus:ring-banana-400/20 focus:border-banana-400 transition-all text-sm text-foreground placeholder:text-muted/50 font-medium"
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
            </header>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-surface/30 backdrop-blur-xl rounded-xl border border-border/10 shadow-sm">
                <table className="min-w-full divide-y divide-border/10">
                    <thead className="bg-foreground/5">
                        <tr>
                            <th
                                scope="col"
                                onClick={() => handleSort('investorName')}
                                className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer group hover:bg-foreground/5 transition-colors"
                            >
                                <div className="flex items-center gap-1">Investor <SortIndicator column="investorName" /></div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Property</th>
                            <th
                                scope="col"
                                onClick={() => handleSort('loanAmount')}
                                className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer group hover:bg-foreground/5 transition-colors"
                            >
                                <div className="flex items-center gap-1">Amount <SortIndicator column="loanAmount" /></div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Term/Rate</th>
                            <th
                                scope="col"
                                onClick={() => handleSort('status')}
                                className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider cursor-pointer group hover:bg-foreground/5 transition-colors"
                            >
                                <div className="flex items-center gap-1">Status <SortIndicator column="status" /></div>
                            </th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-border/10">
                        {filteredAndSortedQuotes.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-muted">
                                    No quotes found in this view.
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedQuotes.map((quote) => (
                                <tr key={quote.id} className="hover:bg-foreground/5 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                                        <div className="text-sm font-medium text-foreground">{quote.investorName}</div>
                                        <div className="text-sm text-muted">{quote.investorEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                                        <div className="text-sm text-foreground">{quote.propertyState}</div>
                                        <div className="text-xs text-muted">{quote.dealType}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                                        ${quote.loanAmount?.toLocaleString() || '0'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                                        {quote.termYears}y @ {quote.rate}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {onUpdateStatus ? (
                                            <StatusDropdown
                                                currentStatus={quote.status}
                                                onStatusChange={(newStatus) => onUpdateStatus(quote.id, newStatus)}
                                            />
                                        ) : (
                                            <StatusBadge status={quote.status} />
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                                        <Icons.ChevronLeft className="w-5 h-5 text-muted group-hover:text-banana-400 rotate-180 inline-block transition-colors" />
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="space-y-3 md:hidden">
                {filteredAndSortedQuotes.map(quote => (
                    <div
                        key={quote.id}
                        className="bg-surface/30 backdrop-blur-xl p-4 rounded-xl border border-border/10 shadow-sm active:scale-[0.98] transition-transform flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-foreground cursor-pointer" onClick={() => onViewQuote(quote.id)}>{quote.investorName}</h3>
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
                        <div className="text-sm text-muted mb-2 cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                            {quote.dealType} • {quote.propertyState}
                        </div>
                        <div className="flex justify-between items-center text-xs text-muted border-t border-border/10 pt-2 cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                            <span className="font-medium text-foreground">${quote.loanAmount?.toLocaleString() || '0'}</span>
                            <span>{new Date(quote.createdAt).toLocaleDateString()} {new Date(quote.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
