import React, { useEffect, useState } from 'react';
import { Quote } from '../types';
import { QuoteService } from '../services/quoteService';
import { ProfileService } from '../services/profileService';
import { generateTermSheetHtml } from '../utils/pdfTemplates';
import { Icons } from '../components/Icons';
import { DEFAULT_BROKER_PROFILE } from '../constants';

export const PublicTermSheet = ({ quoteId }: { quoteId: string }) => {
    const [quote, setQuote] = useState<Quote | null>(null);
    const [comparisons, setComparisons] = useState<Quote[]>([]);
    const [profile, setProfile] = useState(DEFAULT_BROKER_PROFILE);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Fetch public quote data
                const q = await QuoteService.getPublicQuote(quoteId);
                if (q) {
                    setQuote(q);
                    // Fetch comparisons
                    const comps = await QuoteService.getComparisonQuotes(quoteId);
                    setComparisons(comps);

                    // Fetch broker profile for branding
                    // Note: We need a public way to get the profile of the quote owner
                    // For now, retry with public profile fetch if available
                    const { data: prof } = await ProfileService.getPublicProfile(quoteId);
                    if (prof) setProfile(prof);
                }
            } catch (err) {
                console.error('Failed to load public term sheet:', err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [quoteId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Icons.RefreshCw className="w-8 h-8 text-banana-500 animate-spin" />
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <Icons.XCircle className="w-10 h-10 text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Quote Not Found</h1>
                <p className="text-slate-600 mb-8 max-w-md">The link you followed may have expired or is incorrect. Please contact your broker for the latest terms.</p>
                <button onClick={() => window.location.href = '/'} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">Return Home</button>
            </div>
        );
    }

    const allQuotes = comparisons.length > 0 ? [quote, ...comparisons] : [quote];
    const html = generateTermSheetHtml(allQuotes, profile);

    return (
        <div className="min-h-screen bg-slate-100 py-12 px-4">
            <div className="max-w-[816px] mx-auto bg-white shadow-2xl rounded-lg overflow-hidden ring-1 ring-black/5">
                {/* Embedded HTML View */}
                <div
                    className="public-term-sheet-content"
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </div>

            <div className="max-w-[816px] mx-auto mt-8 flex justify-center no-print">
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl shadow-lg hover:bg-slate-800 transition-all font-bold"
                >
                    <Icons.Download className="w-5 h-5" />
                    <span>Download as PDF</span>
                </button>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                @media print {
                    .no-print { display: none !important; }
                    body { background: white !important; padding: 0 !important; }
                    .max-w-[816px] { max-width: 100% !important; box-shadow: none !important; margin: 0 !important; border-radius: 0 !important; }
                }
            `}} />
        </div>
    );
};
