import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { Quote, QuoteStatus, BrokerProfile } from '../types';
import { generateHtmlEmail } from '../utils/emailTemplates';
import { sendQuoteEmail } from '../services/emailService';
import { generateTermSheetHtml } from '../utils/pdfTemplates';
import { DEFAULT_BROKER_PROFILE, BASE_URL } from '../constants';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { StatusBadge } from '../components/StatusBadge';
import { Campaign } from '../services/campaignService';
import { ProfileService } from '../services/profileService';
import { TrialLimitModal } from '../components/TrialLimitModal';
// @ts-ignore
import html2pdf from 'html2pdf.js';
const activeColor = "text-banana-600 dark:text-banana-400";
const activeBg = "bg-banana-400";

export const QuoteDetail = ({
    quote,
    onBack,
    onUpdateStatus,
    onUpdateQuote
}: {
    quote: Quote,
    onBack: () => void,
    onUpdateStatus: (id: string, status: QuoteStatus) => void,
    onUpdateQuote: (id: string, updates: Partial<Quote>) => void
}) => {
    const { showToast } = useToast();

    const [profile, setProfile] = useState<BrokerProfile>(DEFAULT_BROKER_PROFILE);
    const [isResending, setIsResending] = useState(false);
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [activeCampaigns, setActiveCampaigns] = useState<Campaign[]>([]);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
    const [enrolling, setEnrolling] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'email'>('details');
    const [showTrialLimitModal, setShowTrialLimitModal] = useState(false);
    const [trialInfo, setTrialInfo] = useState({ emailsSent: 0, limit: 50 });

    // Load user's profile with senderEmailPrefix
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const userProfile = await ProfileService.getProfile();
                if (userProfile) setProfile(userProfile);
            } catch (err) {
                console.error('Failed to load profile', err);
            }
        };
        loadProfile();
    }, []);

    const handleResend = async () => {
        setIsResending(true);

        // Check trial limit before sending
        const trialCheck = await ProfileService.canSendEmail();
        if (!trialCheck.allowed) {
            setTrialInfo({ emailsSent: trialCheck.emailsSent, limit: trialCheck.limit });
            setShowTrialLimitModal(true);
            setIsResending(false);
            return;
        }

        const scheduleUrl = `${BASE_URL}/?view=schedule&quoteId=${quote.id}`;
        const quoteWithUrl = { ...quote, scheduleUrl };
        const html = quote.emailHtml || generateHtmlEmail(quoteWithUrl, profile, quote.emailBody || '');
        const result = await sendQuoteEmail(quote, html, profile);

        if (result.success) {
            await ProfileService.incrementEmailCount();
            showToast('Email resent successfully!', 'success');
        } else {
            showToast(`Resend failed: ${result.error}`, 'error');
        }
        setIsResending(false);
    };

    const handleEnrollClick = async () => {
        try {
            const { campaignService } = await import('../services/campaignService');
            const campaigns = await campaignService.getCampaigns();
            const active = campaigns.filter(c => c.is_active);

            if (active.length === 0) {
                showToast("No active campaigns found. Please create one first.", 'error');
                return;
            }
            setActiveCampaigns(active);
            setSelectedCampaignId(active[0].id);
            setShowEnrollModal(true);
        } catch (e) {
            console.error(e);
            showToast("Failed to fetch campaigns", 'error');
        }
    };

    const confirmEnrollment = async () => {
        if (!selectedCampaignId) return;
        setEnrolling(true);
        try {
            const { campaignService } = await import('../services/campaignService');
            await campaignService.subscribeLead(selectedCampaignId, quote.id);
            const campaignName = activeCampaigns.find(c => c.id === selectedCampaignId)?.name || 'Campaign';
            showToast(`Enrolled in ${campaignName}! First email scheduled.`, 'success');
            setShowEnrollModal(false);
        } catch (e) {
            console.error(e);
            showToast("Failed to enroll lead", 'error');
        } finally {
            setEnrolling(false);
        }
    };

    const MetricCard = ({ label, value, icon: Icon }: { label: string, value: string | number, icon: React.ElementType }) => (
        <div className="bg-surface/40 backdrop-blur-xl p-5 rounded-2xl border border-border/10 shadow-2xl flex flex-col gap-1 transition-all hover:border-banana-400/30 hover:shadow-banana-400/10 hover:-translate-y-1">
            <div className="flex items-center gap-2 text-muted mb-1">
                <Icon className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
            </div>
            <div className="text-xl font-bold text-foreground">{value}</div>
        </div>
    );

    const DetailRow = ({ label, value }: { label: string, value: string | number | React.ReactNode }) => (
        <div className="flex justify-between py-3 border-b border-border/10 last:border-0 group hover:bg-foreground/5 px-2 rounded-lg transition-colors">
            <span className="text-sm text-muted font-medium">{label}</span>
            <span className="text-sm text-foreground font-semibold">{value || 'N/A'}</span>
        </div>
    );

    const previewHtml = quote.emailHtml || generateHtmlEmail({
        ...quote,
        scheduleUrl: `${BASE_URL}/?view=schedule&quoteId=${quote.id}`
    }, profile, quote.emailBody || '');

    return (
        <div className="pb-24 max-w-7xl mx-auto px-4 md:px-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Navigation & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 hover:bg-foreground/5 rounded-full transition-colors text-muted hover:text-foreground"
                    >
                        <Icons.ChevronLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-extrabold text-foreground tracking-tight">{quote.investorName}</h1>
                            <StatusBadge status={quote.status} />
                        </div>
                        <p className="text-muted text-sm mt-0.5">{quote.investorEmail}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {quote.status !== QuoteStatus.WON && quote.status !== QuoteStatus.LOST && (
                        <>
                            <Button
                                variant="outline"
                                className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                                onClick={() => onUpdateStatus(quote.id, QuoteStatus.LOST)}
                            >
                                Mark Lost
                            </Button>
                            <Button
                                className="bg-banana-400 text-slate-900 hover:bg-banana-500 border-none shadow-lg shadow-banana-400/20"
                                icon={Icons.CheckCircle}
                                onClick={() => onUpdateStatus(quote.id, QuoteStatus.WON)}
                            >
                                Mark Closed Won
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <MetricCard
                    label="Loan Amount"
                    value={`$${quote.loanAmount?.toLocaleString()}`}
                    icon={Icons.DollarSign}
                />
                <MetricCard
                    label="Rate"
                    value={`${quote.rate}% ${quote.rateType || 'Fixed'}`}
                    icon={Icons.Zap}
                />
                <MetricCard
                    label="LTV"
                    value={`${quote.ltv}%`}
                    icon={Icons.TrendingUp}
                />
                <MetricCard
                    label="Term"
                    value={`${quote.termYears} Years`}
                    icon={Icons.Clock}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left/Main Column: Quote Details & Email Preview */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Content Tabs */}
                    <div className="bg-surface/30 backdrop-blur-xl rounded-2xl border border-border/10 shadow-2xl overflow-hidden">
                        <div className="flex border-b border-border/10 bg-foreground/5 p-1 m-2 rounded-2xl">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${activeTab === 'details' ? 'bg-banana-400 text-slate-900 shadow-lg shadow-banana-400/20' : 'text-muted hover:bg-foreground/5 hover:text-foreground'}`}
                            >
                                Quote Details
                            </button>
                            <button
                                onClick={() => setActiveTab('email')}
                                className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all duration-200 ${activeTab === 'email' ? 'bg-banana-400 text-slate-900 shadow-lg shadow-banana-400/20' : 'text-muted hover:bg-foreground/5 hover:text-foreground'}`}
                            >
                                Email Preview
                            </button>
                        </div>

                        <div className="p-8">
                            {activeTab === 'details' ? (
                                <div className="space-y-8">
                                    {/* Property Section */}
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
                                            Property Information
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                            <DetailRow
                                                label="Address"
                                                value={
                                                    <div className="flex items-center gap-2">
                                                        <span>{quote.propertyAddress}</span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                window.open(`https://www.zillow.com/homes/${encodeURIComponent(`${quote.propertyAddress} ${quote.propertyCity} ${quote.propertyState} ${quote.propertyZip}`.trim())}`, '_blank', 'noopener,noreferrer');
                                                            }}
                                                            className="inline-flex items-center justify-center p-1.5 bg-surface dark:bg-white border border-border/10 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
                                                            title="Research on Zillow"
                                                        >
                                                            <img
                                                                src="https://www.zillowstatic.com/s3/pfs/static/z-logo-default-visual-refresh.svg"
                                                                className="h-3 w-auto opacity-70 group-hover:opacity-100 transition-opacity"
                                                                alt="Zillow"
                                                            />
                                                        </button>
                                                    </div>
                                                }
                                            />
                                            <DetailRow label="City" value={quote.propertyCity} />
                                            <DetailRow label="State / Zip" value={`${quote.propertyState || ''} ${quote.propertyZip || ''}`} />
                                            <DetailRow label="Deal Type" value={quote.dealType} />
                                            <DetailRow label="Monthly Payment (P&I)" value={`$${quote.monthlyPayment?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} />
                                        </div>
                                    </div>

                                    {/* Financials Section */}
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
                                            Loan Breakdown
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                                            <DetailRow label="Origination Fee" value={`$${quote.originationFee?.toLocaleString()}`} />
                                            <DetailRow label="Underwriting Fee" value={`$${quote.uwFee?.toLocaleString()}`} />
                                            {quote.brokerFee && <DetailRow label="Broker Fee" value={`$${quote.brokerFee.toLocaleString()}`} />}
                                            <DetailRow label="Other Closing Fees" value={`$${quote.closingFees?.toLocaleString()}`} />
                                            <DetailRow label="Total Estimated Costs" value={<strong>{`$${((quote.originationFee || 0) + (quote.uwFee || 0) + (quote.brokerFee || 0) + (quote.closingFees || 0)).toLocaleString()}`}</strong>} />
                                            {quote.lenderCode && <DetailRow label="Lender Code" value={quote.lenderCode} />}
                                            <DetailRow label="Credit Score" value={quote.creditScore ? <strong>{quote.creditScore}</strong> : 'Not specified'} />
                                            <DetailRow label="Created At" value={new Date(quote.createdAt).toLocaleDateString(undefined, { dateStyle: 'long' })} />
                                        </div>
                                    </div>

                                    {/* Notes */}
                                    {quote.notes && (
                                        <div className="bg-amber-500/10 rounded-2xl p-6 border border-amber-500/20">
                                            <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 mb-2">Internal Notes</h3>
                                            <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">{quote.notes}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-foreground/5 rounded-2xl p-1 border border-border/10 overflow-hidden">
                                    <div className="bg-surface border-b border-border/10 px-4 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex gap-1.5">
                                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                                            </div>
                                            <span className="text-xs text-muted font-medium ml-2">Email Preview</span>
                                        </div>
                                        <div className="text-[10px] text-muted font-mono bg-foreground/5 px-2 py-1 rounded border border-border/10">
                                            {quote.investorEmail}
                                        </div>
                                    </div>
                                    <div className="overflow-auto bg-white max-h-[600px] shadow-inner">
                                        <div
                                            className="origin-top scale-[0.85] md:scale-100"
                                            dangerouslySetInnerHTML={{ __html: previewHtml }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Actions & Journey */}
                <div className="space-y-6">
                    {/* Automation Panel */}
                    <div className="bg-surface/30 backdrop-blur-xl rounded-2xl border border-border/10 shadow-2xl p-6 space-y-4">
                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-2">Automation</h3>

                        <Button
                            className="w-full justify-between py-4 shadow-lg shadow-banana-400/20 bg-banana-400 text-slate-900 border-none font-bold hover:bg-banana-500"
                            icon={Icons.Sparkles}
                            onClick={handleEnrollClick}
                        >
                            Enroll in Campaign
                        </Button>

                        <div className="space-y-2 pt-2">
                            <button
                                onClick={() => onUpdateQuote(quote.id, { followUpsEnabled: !quote.followUpsEnabled })}
                                className="w-full flex items-center justify-between p-3 rounded-xl border border-border/10 hover:bg-foreground/5 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${quote.followUpsEnabled ? 'bg-emerald-500/10 text-emerald-500' : 'bg-foreground/5 text-muted'}`}>
                                        <Icons.RefreshCw className={`w-4 h-4 ${quote.followUpsEnabled ? 'animate-spin-slow' : ''}`} />
                                    </div>
                                    <span className="text-sm font-semibold text-foreground">{quote.followUpsEnabled ? 'Follow-ups Active' : 'Resume Follow-ups'}</span>
                                </div>
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${quote.followUpsEnabled ? 'bg-emerald-500' : 'bg-muted/30'}`}>
                                    <div className={`absolute top-0.5 bottom-0.5 w-3 h-3 bg-surface rounded-full transition-all ${quote.followUpsEnabled ? 'right-0.5' : 'left-0.5'}`} />
                                </div>
                            </button>

                            <button
                                onClick={handleResend}
                                disabled={isResending}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/10 hover:bg-banana-400/10 hover:border-banana-400/30 transition-all group text-left"
                            >
                                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 group-hover:bg-banana-400 group-hover:text-slate-900 transition-colors">
                                    {isResending ? <Icons.RefreshCw className="w-4 h-4 animate-spin" /> : <Icons.Mail className="w-4 h-4" />}
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-foreground">Resend Email</div>
                                    <div className="text-[10px] text-muted">Send latest terms again</div>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    const element = document.createElement('div');
                                    element.innerHTML = generateTermSheetHtml(quote, profile);

                                    const opt = {
                                        margin: 0,
                                        filename: `Term_Sheet_${quote.investorName.replace(/\s+/g, '_')}_${new Date(quote.createdAt).toISOString().split('T')[0]}.pdf`,
                                        image: { type: 'jpeg' as const, quality: 0.98 },
                                        html2canvas: { scale: 2, useCORS: true },
                                        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
                                    };

                                    html2pdf().set(opt).from(element).save();

                                    if (onUpdateStatus) {
                                        onUpdateStatus(quote.id, QuoteStatus.DOWNLOADED);
                                    }
                                    showToast('Downloading PDF...', 'success');
                                }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/10 hover:bg-banana-400/10 hover:border-banana-400/30 transition-all group text-left"
                            >
                                <div className="p-2 rounded-lg bg-red-500/10 text-red-500 group-hover:bg-banana-400 group-hover:text-slate-900 transition-colors">
                                    <Icons.FileText className="w-4 h-4" />
                                </div>
                                <div>
                                    <div className="text-sm font-semibold text-foreground">Download PDF</div>
                                    <div className="text-[10px] text-muted">Save as PDF document</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Timeline Panel */}
                    <div className="bg-surface/30 backdrop-blur-xl rounded-2xl border border-border/10 shadow-2xl p-6">
                        <JourneyTimeline leadId={quote.id} />
                    </div>
                </div>
            </div>

            {/* Modals */}
            <Modal
                isOpen={showEnrollModal}
                onClose={() => setShowEnrollModal(false)}
                title="Confirm Enrollment"
                primaryAction={{
                    label: enrolling ? 'Enrolling...' : 'Confirm Enrollment',
                    onClick: confirmEnrollment,
                    loading: enrolling
                }}
                secondaryAction={{
                    label: 'Cancel',
                    onClick: () => setShowEnrollModal(false)
                }}
            >
                <div className="space-y-4">
                    <p className="text-sm text-muted">
                        Choose a campaign to enroll <strong>{quote.investorName}</strong> into. They will receive the automated sequence starting immediately.
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-muted uppercase tracking-wider ml-1">Select Campaign</label>
                        <select
                            value={selectedCampaignId}
                            onChange={(e) => setSelectedCampaignId(e.target.value)}
                            className="w-full p-3 bg-surface border border-border/10 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-banana-400 focus:border-banana-400 transition-all outline-none text-foreground"
                        >
                            {activeCampaigns.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <p className="text-xs text-muted italic bg-foreground/5 p-3 rounded-lg border border-dashed border-border/10">
                        The first email will be scheduled according to the campaign's delay settings.
                    </p>
                </div>
            </Modal>

            {/* Trial Limit Modal */}
            <TrialLimitModal
                isOpen={showTrialLimitModal}
                onClose={() => setShowTrialLimitModal(false)}
                emailsSent={trialInfo.emailsSent}
                limit={trialInfo.limit}
            />
        </div>
    );
};

// Sub-component for Journey Timeline
function JourneyTimeline({ leadId }: { leadId: string }) {
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const { campaignService } = await import('../services/campaignService');
                const data = await campaignService.getLeadEvents(leadId);
                setEvents(data || []);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [leadId]);

    if (loading) return <div className="p-4 text-center text-sm text-muted">Loading journey...</div>;

    return (
        <div>
            <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-6">Activity Timeline</h3>
            {events.length === 0 ? (
                <p className="text-xs text-muted italic text-center py-4">No activity recorded yet.</p>
            ) : (
                <div className="relative border-l-2 border-border/10 ml-3 space-y-8 py-2">
                    {events.map((event) => {
                        const icons = {
                            sent: <Icons.Mail className="w-3.5 h-3.5 text-muted" />,
                            opened: <Icons.Eye className="w-3.5 h-3.5 text-indigo-400" />,
                            clicked: <Icons.MousePointer className="w-3.5 h-3.5 text-amber-400" />,
                            converted: <Icons.CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                        };

                        return (
                            <div key={event.id} className="relative pl-8">
                                <div className={`absolute -left-[14px] top-0 p-1.5 rounded-full bg-surface border shadow-sm ${event.type === 'opened' ? 'border-indigo-500/30' : 'border-border/10'}`}>
                                    {icons[event.type as keyof typeof icons] || icons.sent}
                                </div>
                                <div className="flex flex-col">
                                    <p className="text-sm font-bold text-foreground capitalize leading-tight">
                                        {event.type}
                                    </p>
                                    <p className="text-[11px] text-muted mt-0.5">
                                        {new Date(event.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                                    </p>
                                    {event.type === 'clicked' && event.metadata?.url && (
                                        <div className="mt-2 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-[10px] text-amber-600 dark:text-amber-400 truncate">
                                            Clicked: {new URL(event.metadata.url).hostname}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
