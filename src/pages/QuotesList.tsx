import React from 'react';
import { Icons } from '../components/Icons';
import { StatusBadge } from '../components/StatusBadge';
import { Quote } from '../types';

export const QuotesList = ({ quotes, onViewQuote }: { quotes: Quote[], onViewQuote: (id: string) => void }) => {
    return (
        <div className="pb-24 md:pb-0">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">All Quotes</h1>
                <div className="hidden md:block w-64">
                    <input type="text" placeholder="Search investors..." className="w-full pl-4 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
            </header>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term/Rate</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th scope="col" className="relative px-6 py-3"><span className="sr-only">View</span></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {quotes.map((quote) => (
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
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {quote.termYears}y @ {quote.rate}%
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <StatusBadge status={quote.status} />
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
                {quotes.map(quote => (
                    <div
                        key={quote.id}
                        onClick={() => onViewQuote(quote.id)}
                        className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm active:scale-[0.98] transition-transform cursor-pointer"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-semibold text-gray-900">{quote.investorName}</h3>
                            <StatusBadge status={quote.status} />
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                            {quote.dealType} • {quote.propertyState}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 border-t border-gray-100 pt-2">
                            <span className="font-medium text-gray-900">${quote.loanAmount.toLocaleString()}</span>
                            <span>{new Date(quote.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
