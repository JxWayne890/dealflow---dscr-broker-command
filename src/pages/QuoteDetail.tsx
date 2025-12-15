import React from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { Quote, QuoteStatus } from '../types';

export const QuoteDetail = ({ quote, onBack, onUpdateStatus }: { quote: Quote, onBack: () => void, onUpdateStatus: (id: string, status: QuoteStatus) => void }) => {

    const getTimelineStatus = (scheduledDate: string, status: string) => {
        const today = new Date();
        const scheduled = new Date(scheduledDate);
        if (status === 'sent') return 'completed';
        if (status === 'cancelled') return 'cancelled';
        if (scheduled < today) return 'overdue';
        return 'upcoming';
    };

    return (
        <div className="pb-24 md:pb-0 max-w-5xl mx-auto">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
                    <Icons.ChevronLeft className="w-6 h-6" />
                </button>
                <h1 className="text-xl font-bold ml-2">Quote Details</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">{quote.investorName}</h2>
                                <p className="text-gray-500">{quote.investorEmail}</p>
                            </div>
                            <StatusBadge status={quote.status} />
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm border-t border-gray-100 pt-6">
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Loan Amount</p>
                                <p className="font-semibold text-gray-900 text-lg">${quote.loanAmount.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Deal Type</p>
                                <p className="font-semibold text-gray-900">{quote.dealType}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">LTV / Rate</p>
                                <p className="font-semibold text-gray-900">{quote.ltv}% / {quote.rate}%</p>
                            </div>
                            <div>
                                <p className="text-gray-500 text-xs uppercase tracking-wide mb-1">Sent Date</p>
                                <p className="font-semibold text-gray-900">{new Date(quote.createdAt).toLocaleDateString()}</p>
                            </div>
                        </div>

                        {quote.notes && (
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <p className="text-gray-500 text-xs uppercase tracking-wide mb-2">Notes</p>
                                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg text-sm">{quote.notes}</p>
                            </div>
                        )}
                    </div>

                    {/* Email History Preview (New for Desktop feel) */}
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Email Content</h3>
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 text-sm text-gray-600 font-mono whitespace-pre-wrap">
                            {quote.emailBody || "No email body saved."}
                        </div>
                    </div>
                </div>

                {/* Right Column: Timeline & Actions */}
                <div className="space-y-6">
                    {/* Actions Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4">Actions</h3>
                        <div className="space-y-3">
                            {quote.status !== QuoteStatus.CLOSED_WON && quote.status !== QuoteStatus.CLOSED_LOST && (
                                <Button
                                    className="w-full justify-start"
                                    variant="secondary"
                                    icon={Icons.CheckCircle}
                                    onClick={() => onUpdateStatus(quote.id, QuoteStatus.CLOSED_WON)}
                                >
                                    Mark Closed Won
                                </Button>
                            )}

                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                icon={quote.followUpsEnabled ? Icons.XCircle : Icons.RefreshCw}
                                onClick={() => alert("Toggled follow-ups (Mock Action)")}
                            >
                                {quote.followUpsEnabled ? 'Stop Follow-Ups' : 'Resume Follow-Ups'}
                            </Button>

                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                icon={Icons.Mail}
                                onClick={() => alert("Resend (Mock Action)")}
                            >
                                Resend Email
                            </Button>
                        </div>
                    </div>

                    {/* Timeline Card */}
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center justify-between">
                            <span>Follow-Up Sequence</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${quote.followUpsEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                {quote.followUpsEnabled ? 'Active' : 'Paused'}
                            </span>
                        </h3>

                        <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 py-2">
                            {quote.followUpSchedule.map((event, idx) => {
                                const tlStatus = getTimelineStatus(event.scheduledDate, event.status);
                                const iconMap = {
                                    completed: <Icons.CheckCircle className="w-5 h-5 text-emerald-500 bg-white" />,
                                    upcoming: <div className="w-4 h-4 rounded-full border-2 border-gray-300 bg-white" />,
                                    overdue: <Icons.Clock className="w-5 h-5 text-orange-500 bg-white" />,
                                    cancelled: <Icons.XCircle className="w-5 h-5 text-gray-400 bg-white" />
                                };

                                return (
                                    <div key={event.id} className="relative pl-6">
                                        <div className="absolute -left-[9px] top-0">
                                            {iconMap[tlStatus]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">Follow Up #{idx + 1}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(event.scheduledDate).toLocaleDateString()}
                                                {event.status === 'sent' && ' • Sent'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
