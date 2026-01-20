import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Investor, Quote } from '../types';
import { QuoteService } from '../services/quoteService';
import { Icons } from './Icons';
import { formatPhoneNumber } from '../utils/formatters';

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
                <div className="bg-surface/30 backdrop-blur-xl p-6 rounded-2xl border border-border/10 shadow-sm">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-full bg-banana-400/20 flex items-center justify-center text-banana-600 dark:text-banana-400 text-2xl font-bold border border-banana-400/20">
                                {investor.name.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{investor.name}</h2>
                                <p className="text-muted font-medium">{investor.company || 'Private Investor'}</p>
                            </div>
                        </div>
                        <div className="text-right space-y-1">
                            <div className="flex items-center justify-end text-sm text-muted">
                                <Icons.Mail className="w-4 h-4 mr-2" />
                                <a href={`mailto:${investor.email}`} className="hover:text-banana-600 dark:hover:text-banana-400 transition-colors">{investor.email}</a>
                            </div>
                            {investor.phone && (
                                <div className="flex items-center justify-end text-sm text-muted">
                                    <Icons.Phone className="w-4 h-4 mr-2" />
                                    <a href={`tel:${investor.phone}`} className="hover:text-banana-600 dark:hover:text-banana-400 transition-colors">{formatPhoneNumber(investor.phone)}</a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Deal History Section */}
                <div>
                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4 flex items-center">
                        <Icons.TrendingUp className="w-4 h-4 mr-2 text-banana-600 dark:text-banana-400" />
                        Deal History
                    </h3>

                    {loading ? (
                        <div className="text-center py-12 text-muted">
                            <Icons.RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                            Loading deals...
                        </div>
                    ) : quotes.length === 0 ? (
                        <div className="text-center py-12 bg-foreground/5 rounded-2xl border border-dashed border-border/10 text-muted">
                            No deals found for this investor yet.
                        </div>
                    ) : (
                        <div className="overflow-hidden shadow-sm ring-1 ring-border/10 rounded-2xl">
                            <table className="min-w-full divide-y divide-border/10">
                                <thead className="bg-foreground/5">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-xs font-bold text-muted uppercase tracking-wider sm:pl-6">Property Address</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-muted uppercase tracking-wider">Loan Amount</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-muted uppercase tracking-wider">LTV</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-xs font-bold text-muted uppercase tracking-wider">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/10 bg-transparent">
                                    {quotes.map((quote) => (
                                        <tr key={quote.id} className="hover:bg-foreground/5 transition-colors">
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-foreground sm:pl-6">
                                                {quote.propertyAddress || 'No Address'}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                                                {formatCurrency(quote.loanAmount)}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                                                {quote.ltv}%
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
            </div>
        </Modal>
    );
};
