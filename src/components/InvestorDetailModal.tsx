import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Investor, Quote } from '../types';
import { QuoteService } from '../services/quoteService';
import { Icons } from './Icons';

interface InvestorDetailModalProps {
    investor: Investor;
    onClose: () => void;
}

export const InvestorDetailModal = ({ investor, onClose }: InvestorDetailModalProps) => {
    const [quotes, setQuotes] = useState<Quote[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuotes = async () => {
            try {
                const data = await QuoteService.getQuotesByInvestorId(investor.id);
                setQuotes(data);
            } catch (error) {
                console.error('Failed to fetch queries', error);
            } finally {
                setLoading(false);
            }
        };

        if (investor.id) {
            fetchQuotes();
        }
    }, [investor.id]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="Investor Details"
            maxWidth="sm:max-w-4xl" // Wider modal for table
            primaryAction={{ label: 'Close', onClick: onClose }}
        >
            <div className="space-y-8">
                {/* Investor Info Section */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold">
                                {investor.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">{investor.name}</h2>
                                <p className="text-gray-500">{investor.company || 'Private Investor'}</p>
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="flex items-center justify-end text-sm text-gray-600">
                                <Icons.Mail className="w-4 h-4 mr-2" />
                                <a href={`mailto:${investor.email}`} className="hover:text-indigo-600">{investor.email}</a>
                            </div>
                            {investor.phone && (
                                <div className="flex items-center justify-end text-sm text-gray-600">
                                    <Icons.Phone className="w-4 h-4 mr-2" />
                                    <a href={`tel:${investor.phone}`} className="hover:text-indigo-600">{investor.phone}</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Deal History Section */}
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <Icons.TrendingUp className="w-5 h-5 mr-2 text-indigo-600" />
                        Deal History
                    </h3>

                    {loading ? (
                        <div className="text-center py-12 text-gray-500">
                            <Icons.RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading deals...
                        </div>
                    ) : quotes.length === 0 ? (
                        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-300 text-gray-500">
                            No deals found for this investor yet.
                        </div>
                    ) : (
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Property Address</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Loan Amount</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">LTV</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {quotes.map((quote) => (
                                        <tr key={quote.id}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                                {quote.propertyAddress || 'No Address'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {formatCurrency(quote.loanAmount)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {quote.ltv}%
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium 
                                                    ${quote.status === 'Won' ? 'bg-green-100 text-green-800' :
                                                        quote.status === 'Lost' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'}`}>
                                                    {quote.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                {formatDate(quote.createdAt)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
};
