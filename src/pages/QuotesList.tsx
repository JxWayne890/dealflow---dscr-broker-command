import React from 'react';
import { Icons } from '../components/Icons';
import { StatusBadge } from '../components/StatusBadge';
import { Quote, QuoteStatus } from '../types';

import { StatusDropdown } from '../components/StatusDropdown';

type SortConfig = {
    key: 'investorName' | 'loanAmount' | 'createdAt' | 'status';
    direction: 'asc' | 'desc';
} | null;

export const QuotesList = ({ quotes, onViewQuote, onUpdateStatus, initialFilter = 'all' }: { quotes: Quote[], onViewQuote: (id: string) => void, onUpdateStatus?: (id: string, status: QuoteStatus) => void, initialFilter?: string }) => {
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
            const matchSearch = q.investorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.investorEmail.toLowerCase().includes(searchQuery.toLowerCase());

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
    }, [quotes, activeTab, sort, searchQuery]);

    const tabs = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'draft', label: 'Draft' },
        { id: 'won', label: 'Won' },
        { id: 'lost', label: 'Lost' },
        { id: 'follow_up', label: 'Follow-up' },
    ];

    const SortIndicator = ({ column }: { column: string }) => {
        if (sort?.key !== column) return <Icons.ChevronUp className="w-3 h-3 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return sort.direction === 'asc' ? <Icons.ChevronUp className="w-3 h-3 text-indigo-500" /> : <Icons.ChevronDown className="w-3 h-3 text-indigo-500" />;
    };

    return (
        <div className="pb-24 md:pb-0">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Quotes</h1>
                    <div className="flex space-x-1 mt-2 bg-gray-100 p-1 rounded-lg inline-flex overflow-x-auto max-w-full no-scrollbar">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-full md:w-64">
                    <input
                        type="text"
                        placeholder="Search investors..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
            </header>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                scope="col"
                                onClick={() => handleSort('investorName')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-1">Investor <SortIndicator column="investorName" /></div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                            <th
                                scope="col"
                                onClick={() => handleSort('loanAmount')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-1">Amount <SortIndicator column="loanAmount" /></div>
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term/Rate</th>
                            <th
                                scope="col"
                                onClick={() => handleSort('status')}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer group hover:bg-gray-100 transition-colors"
                            >
                                <div className="flex items-center gap-1">Status <SortIndicator column="status" /></div>
                            </th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedQuotes.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                    No quotes found in this view.
                                </td>
                            </tr>
                        ) : (
                            filteredAndSortedQuotes.map((quote) => (
                                <tr key={quote.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                                        <div className="text-sm font-medium text-gray-900">{quote.investorName}</div>
                                        <div className="text-sm text-gray-500">{quote.investorEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                                        <div className="text-sm text-gray-900">{quote.propertyState}</div>
                                        <div className="text-xs text-gray-500">{quote.dealType}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                                        ${quote.loanAmount?.toLocaleString() || '0'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => onViewQuote(quote.id)}>
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
                                        <Icons.ChevronLeft className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 rotate-180 inline-block transition-colors" />
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
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:scale-[0.98] transition-transform flex flex-col"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900 cursor-pointer" onClick={() => onViewQuote(quote.id)}>{quote.investorName}</h3>
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
                        <div className="text-sm text-gray-600 mb-2 cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                            {quote.dealType} • {quote.propertyState}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-2 cursor-pointer" onClick={() => onViewQuote(quote.id)}>
                            <span className="font-medium text-gray-900">${quote.loanAmount?.toLocaleString() || '0'}</span>
                            <span>{new Date(quote.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
