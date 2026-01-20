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
            title="" // Removed redundant title
            maxWidth="max-w-3xl"
        >
            <div className="space-y-8 pb-4">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/10 pb-8">
                    <div className="flex items-center gap-5">
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-banana-400 to-amber-500 flex items-center justify-center text-slate-900 text-3xl font-bold shadow-lg shadow-banana-400/20 shrink-0">
                            {investor.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-foreground tracking-tight">{investor.name}</h2>
                            <p className="text-lg text-muted font-medium mt-1">{investor.company || 'Private Investor'}</p>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px]">
                        <div className="flex items-center gap-3 text-sm font-medium text-foreground bg-foreground/5 p-3 rounded-xl border border-border/5">
                            <div className="p-2 rounded-lg bg-surface shadow-sm">
                                <Icons.Mail className="w-4 h-4 text-banana-500" />
                            </div>
                            <a href={`mailto:${investor.email}`} className="truncate hover:text-banana-500 transition-colors">
                                {investor.email}
                            </a>
                        </div>
                        {investor.phone && (
                            <div className="flex items-center gap-3 text-sm font-medium text-foreground bg-foreground/5 p-3 rounded-xl border border-border/5">
                                <div className="p-2 rounded-lg bg-surface shadow-sm">
                                    <Icons.Phone className="w-4 h-4 text-banana-500" />
                                </div>
                                <a href={`tel:${investor.phone}`} className="truncate hover:text-banana-500 transition-colors">
                                    {formatPhoneNumber(investor.phone)}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Deal History Section */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                            <div className="w-1 h-5 bg-banana-500 rounded-full"></div>
                            Deal History
                        </h3>
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-foreground/5 text-muted border border-border/10">
                            {quotes.length} Deals
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted bg-surface/50 rounded-2xl border border-dashed border-border/10">
                            <Icons.RefreshCw className="w-6 h-6 animate-spin mb-3 text-banana-500" />
                            <p>Loading records...</p>
                        </div>
                    ) : quotes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-surface/50 rounded-2xl border border-dashed border-border/10 text-muted group hover:border-banana-500/30 transition-colors">
                            <div className="w-12 h-12 rounded-full bg-foreground/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <Icons.FileText className="w-6 h-6 text-muted" />
                            </div>
                            <p className="font-medium">No deals found</p>
                            <p className="text-sm opacity-60 mt-1">This investor hasn't funded any deals yet.</p>
                        </div>
                    ) : (
                        <div className="overflow-hidden bg-surface shadow-sm ring-1 ring-border/10 rounded-2xl">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-border/10">
                                    <thead className="bg-foreground/5">
                                        <tr>
                                            <th className="py-4 pl-6 pr-3 text-left text-xs font-bold text-muted uppercase tracking-wider">Property</th>
                                            <th className="px-3 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Amount</th>
                                            <th className="px-3 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">LTV</th>
                                            <th className="px-3 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Status</th>
                                            <th className="px-3 py-4 text-left text-xs font-bold text-muted uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/10 bg-transparent">
                                        {quotes.map((quote) => (
                                            <tr key={quote.id} className="hover:bg-foreground/5 transition-colors group">
                                                <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-bold text-foreground">
                                                    {quote.propertyAddress || 'No Address'}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-muted font-mono">
                                                    {formatCurrency(quote.loanAmount)}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-muted">
                                                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-foreground/5 text-xs font-medium">
                                                        {quote.ltv}%
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-bold capitalize
                                                        ${quote.status === 'Won' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                                                            quote.status === 'Lost' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                                'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
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
                        </div>
                    )}
                </div>
            </div>
            {/* Footer Actions */}
            <div className="flex justify-end pt-6 mt-6 border-t border-border/10">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-banana-400 hover:bg-banana-500 text-slate-900 font-bold rounded-xl shadow-lg shadow-banana-400/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                    Close
                </button>
            </div>
        </Modal>
    );
};
