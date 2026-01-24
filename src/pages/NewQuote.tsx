import React, { useState, useEffect, useRef } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { Quote, QuoteStatus, DealType, BrokerProfile, EmailFormat, Investor } from '../types';
import { generateQuoteEmail } from '../services/geminiService';
import { sendQuoteEmail } from '../services/emailService';
import { generateHtmlEmail, generatePlainText } from '../utils/emailTemplates';
import { DEFAULT_BROKER_PROFILE, BASE_URL } from '../constants';
import { useToast } from '../contexts/ToastContext';
import { ProfileService } from '../services/profileService';
import { QuoteService } from '../services/quoteService';
import { generateTermSheetHtml } from '../utils/pdfTemplates';
import { TrialLimitModal } from '../components/TrialLimitModal';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export const NewQuote = ({ onCancel, onSave, investors, onAddInvestor }: {
    onCancel: () => void,
    onSave: (quote: Quote, shouldRedirect?: boolean) => void,
    investors: Investor[],
    onAddInvestor: (investor: Investor) => void
}) => {
    const { showToast } = useToast();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // UI State
    const [showSettings, setShowSettings] = useState(false);
    const [emailFormat, setEmailFormat] = useState<EmailFormat>('html');
    const [showTrialLimitModal, setShowTrialLimitModal] = useState(false);
    const [trialInfo, setTrialInfo] = useState({ emailsSent: 0, limit: 50 });

    // Profile State (Defaults for Demo)
    const [profile, setProfile] = useState<BrokerProfile>(DEFAULT_BROKER_PROFILE);

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

    const [formData, setFormData] = useState<Partial<Quote>>({
        id: Math.random().toString(36).substr(2, 9), // Pre-generate ID for stable links
        dealType: DealType.PURCHASE,
        propertyState: '',
        ltv: 75,
        termYears: 30,
        status: QuoteStatus.DRAFT,
        followUpsEnabled: true,
        // Initial "Intro" message (not the full email anymore, just the custom part)
        notes: '',
        rate: 7.5,
        emailBody: '', // This will store the *custom message* part, not the full HTML
        brokerFee: 0,
        brokerFeePercent: 1.0,
    });

    const [brokerFeeType, setBrokerFeeType] = useState<'$' | '%'>('%');

    // Available properties for the selected investor
    const [availableProperties, setAvailableProperties] = useState<string[]>([]);

    // When investor changes, update available properties
    useEffect(() => {
        if (formData.investorId) {
            const inv = investors.find(i => i.id === formData.investorId);
            setAvailableProperties(inv?.properties || []);
        } else {
            setAvailableProperties([]);
        }
    }, [formData.investorId, investors]);

    // Calculate Monthly Payment Automatically
    useEffect(() => {
        if (formData.loanAmount && formData.rate && formData.termYears) {
            const principal = formData.loanAmount;
            const monthlyRate = formData.rate / 100 / 12;
            const numberOfPayments = formData.termYears * 12;

            if (monthlyRate === 0) {
                setFormData(prev => ({ ...prev, monthlyPayment: Math.round(principal / numberOfPayments) }));
            } else {
                const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
                setFormData(prev => ({ ...prev, monthlyPayment: Math.round(payment * 100) / 100 }));
            }
        }
    }, [formData.loanAmount, formData.rate, formData.termYears]);

    // Recalculate Broker Fee if Loan Amount changes and we are in % mode
    useEffect(() => {
        if (brokerFeeType === '%' && formData.loanAmount && formData.brokerFeePercent) {
            const fee = (formData.loanAmount * formData.brokerFeePercent) / 100;
            setFormData(prev => ({ ...prev, brokerFee: Math.round(fee * 100) / 100 }));
        }
    }, [formData.loanAmount, formData.brokerFeePercent, brokerFeeType]);


    const handleGenerateEmail = () => {
        setIsGenerating(true);
        // Simulate a brief delay
        setTimeout(() => {
            const intro = `Great connecting with you. I've crunched the numbers for your scenario in ${formData.propertyState}. Based on _____ credit score, we can offer the following terms:`;

            // Compose final content with intro and user notes
            const finalContent = formData.notes
                ? `${intro}\n\n${formData.notes}`
                : intro;

            setFormData(prev => ({ ...prev, emailBody: finalContent }));
            setIsGenerating(false);
            setStep(2);
        }, 500);
    };

    const handleSubmit = async () => {
        setIsSending(true);

        // Generate the real schedule URL using the pre-generated ID
        const scheduleUrl = `${BASE_URL}/?view=schedule&quoteId=${formData.id}`;
        const formDataWithUrl = { ...formData, scheduleUrl };

        // Generate the FINAL payload based on format
        let finalContent = '';
        if (emailFormat === 'html') {
            finalContent = generateHtmlEmail(formDataWithUrl, profile, formData.emailBody || '');
        } else {
            finalContent = generatePlainText(formDataWithUrl, profile, formData.emailBody || '');
        }

        // Attempt real email send ONLY if auto-send is enabled
        let result: { success: boolean; error?: string } = { success: true }; // Default to true if not sending

        if (profile.autoSendQuoteEmail) {
            if (formData.investorEmail) {
                // Check trial limit before sending
                const trialCheck = await ProfileService.canSendEmail();
                if (!trialCheck.allowed) {
                    setTrialInfo({ emailsSent: trialCheck.emailsSent, limit: trialCheck.limit });
                    setShowTrialLimitModal(true);
                    setIsSending(false);
                    return;
                }

                result = await sendQuoteEmail(formDataWithUrl as Quote, finalContent, profile);

                // Increment email count on successful send
                if (result.success) {
                    await ProfileService.incrementEmailCount();
                }
            }
        } else {
            console.log("Auto-send disabled, skipping email dispatch.");
        }

        const newQuote: Quote = {
            ...formDataWithUrl as Quote,
            id: formData.id || Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            status: result.success ? (profile.autoSendQuoteEmail ? QuoteStatus.SENT : QuoteStatus.ACTIVE) : QuoteStatus.DRAFT,
            emailHtml: emailFormat === 'html' ? finalContent : undefined,
            followUpSchedule: [
                { id: Math.random().toString(36), dayOffset: 2, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString() },
                { id: Math.random().toString(36), dayOffset: 5, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString() },
                { id: Math.random().toString(36), dayOffset: 10, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString() },
            ]
        };

        if (result.success) {
            // Success Logic
        } else {
            console.error("Email send failed:", result.error);
            showToast(`Email Sending Failed: ${result.error || 'Check server console'}`, 'error');
        }

        // If this is a new investor (no ID selected but name exists), allow saving them
        // Note: In a real app, we might ask "Do you want to save this investor?"
        // Here we'll just check if the ID maps to an existing one or not.
        const existingParams = investors.find(i => i.id === formData.investorId);
        if (!existingParams && formData.investorName && formData.investorEmail) {
            const newInv: Investor = {
                id: Math.random().toString(36).substr(2, 9),
                name: formData.investorName,
                email: formData.investorEmail,

            };
            // We can trigger this silent update
            // onAddInvestor(newInv); 
            onAddInvestor(newInv);
        }

        setIsSending(false);
        if (result.success) {
            // Update step or show success, but SAVE first.
            // When sending, we might want to stay on the success step, not redirect.
            // Trigger save with NO redirect
            onSave(newQuote, false);

            // Update the form data with the final object so Step 3 can use it if needed (mostly generic info)
            setFormData(newQuote);
            setStep(3); // Show Success View
        } else {
            // Error handled above with alert
        }
    };

    // Live HTML Preview
    const previewScheduleUrl = `${BASE_URL}/?view=schedule&quoteId=${formData.id}`;
    const htmlPreview = generateHtmlEmail({ ...formData, scheduleUrl: previewScheduleUrl }, profile, formData.emailBody || '');

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto relative">

            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button onClick={step === 1 ? onCancel : () => setStep(1)} className="p-2 -ml-2 text-muted hover:text-foreground rounded-full hover:bg-foreground/5 transition-colors">
                        <Icons.ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold ml-2 text-foreground">
                        {step === 1 ? 'New Deal Quote' : 'Review & Send'}
                    </h1>
                </div>
                {step === 2 && (
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-sm font-medium text-muted hover:text-foreground flex items-center bg-surface border border-border/10 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
                    >
                        <Icons.Settings className="w-4 h-4 mr-2" />
                        Profile Settings
                    </button>
                )}
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-0 flex gap-6">
                {step === 1 ? (
                    // Step 1: Data Entry form (Unchanged mostly)
                    <div className="w-full max-w-2xl mx-auto space-y-6">
                        <div className="bg-surface/30 backdrop-blur-xl p-6 rounded-xl border border-border/10 shadow-sm">
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-6 border-b border-border/10 pb-2">Investor Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Select Investor">
                                    <CustomSelect
                                        value={formData.investorId || ''}
                                        options={investors.map(inv => ({ label: inv.name, value: inv.id }))}
                                        placeholder="Select an investor..."
                                        onChange={(selectedId) => {
                                            if (selectedId === 'new') {
                                                setFormData({ ...formData, investorId: '', investorName: '', investorEmail: '' });
                                            } else {
                                                const inv = investors.find(i => i.id === selectedId);
                                                if (inv) {
                                                    setFormData({
                                                        ...formData,
                                                        investorId: inv.id,
                                                        investorName: inv.name,
                                                        investorEmail: inv.email
                                                    });
                                                }
                                            }
                                        }}
                                    />
                                </Field>
                                <Field label="Or Create New">
                                    <div className="flex items-center pt-2">
                                        <span className="text-xs text-muted">Edit details below to create new contact</span>
                                    </div>
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Investor Name">
                                    <Input placeholder="e.g. John Doe" value={formData.investorName || ''} onChange={e => setFormData({ ...formData, investorName: e.target.value })} />
                                </Field>
                                <Field label="Investor Email">
                                    <Input type="email" placeholder="john@example.com" value={formData.investorEmail || ''} onChange={e => setFormData({ ...formData, investorEmail: e.target.value })} />
                                </Field>
                            </div>
                        </div>

                        <div className="bg-surface/30 backdrop-blur-xl p-6 rounded-xl border border-border/10 shadow-sm">
                            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-6 border-b border-border/10 pb-2">Deal Terms</h3>

                            {/* Property Selection */}
                            <Field label="Property Address">
                                {availableProperties.length > 0 ? (
                                    <div className="space-y-3">
                                        <Select
                                            value={availableProperties.includes(formData.propertyAddress || '') ? formData.propertyAddress : 'new_property'}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === 'new_property') {
                                                    setFormData({ ...formData, propertyAddress: '' });
                                                } else {
                                                    setFormData({ ...formData, propertyAddress: val });
                                                }
                                            }}
                                        >
                                            <option value="new_property">Enter a new address...</option>
                                            {availableProperties.map((p, i) => (
                                                <option key={i} value={p}>{p}</option>
                                            ))}
                                        </Select>

                                        {(!formData.propertyAddress || !availableProperties.includes(formData.propertyAddress)) && (
                                            <AddressAutocomplete
                                                value={formData.propertyAddress || ''}
                                                onChange={(val, state, city, zip) => {
                                                    setFormData(prev => ({
                                                        ...prev,
                                                        propertyAddress: val,
                                                        propertyState: state || prev.propertyState,
                                                        propertyCity: city || prev.propertyCity,
                                                        propertyZip: zip || prev.propertyZip
                                                    }));
                                                }}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <AddressAutocomplete
                                        value={formData.propertyAddress || ''}
                                        onChange={(val, state, city, zip) => {
                                            setFormData(prev => ({
                                                ...prev,
                                                propertyAddress: val,
                                                propertyState: state || prev.propertyState,
                                                propertyCity: city || prev.propertyCity,
                                                propertyZip: zip || prev.propertyZip
                                            }));
                                        }}
                                    />
                                )}
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="City">
                                    <Input placeholder="e.g. Dallas" value={formData.propertyCity || ''} onChange={e => setFormData({ ...formData, propertyCity: e.target.value })} />
                                </Field>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="State">
                                        <Input placeholder="TX" value={formData.propertyState || ''} onChange={e => setFormData({ ...formData, propertyState: e.target.value.toUpperCase() })} maxLength={2} />
                                    </Field>
                                    <Field label="Zip">
                                        <Input placeholder="75201" value={formData.propertyZip || ''} onChange={e => setFormData({ ...formData, propertyZip: e.target.value })} />
                                    </Field>
                                </div>
                                <Field label="Type">
                                    <Select value={formData.dealType} onChange={e => setFormData({ ...formData, dealType: e.target.value as DealType })}>
                                        {Object.values(DealType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                </Field>
                            </div>

                            <Field label="Loan Amount">
                                <CurrencyInput
                                    value={formData.loanAmount || 0}
                                    onChange={val => setFormData({ ...formData, loanAmount: val })}
                                    placeholder="0.00"
                                />
                            </Field>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <Field label="LTV %">
                                    <Input type="number" placeholder="75" value={formData.ltv || ''} onChange={e => setFormData({ ...formData, ltv: Number(e.target.value) })} />
                                </Field>
                                <Field label="Rate %">
                                    <Input type="number" step="0.125" placeholder="7.5" value={formData.rate || ''} onChange={e => setFormData({ ...formData, rate: Number(e.target.value) })} />
                                </Field>
                                <Field label="Type">
                                    <Select value={formData.rateType || 'Fixed'} onChange={e => setFormData({ ...formData, rateType: e.target.value as any })}>
                                        <option value="Fixed">Fixed</option>
                                        <option value="ARM">ARM</option>
                                    </Select>
                                </Field>
                                <Field label="Term (Yr)">
                                    <Input type="number" placeholder="30" value={formData.termYears || ''} onChange={e => setFormData({ ...formData, termYears: Number(e.target.value) })} />
                                </Field>
                            </div>

                            <Field label="Prepay Penalty">
                                <Input
                                    placeholder="e.g. 5-4-3-2-1 or 3 Yr Hard"
                                    value={formData.prepayPenalty || ''}
                                    onChange={e => setFormData({ ...formData, prepayPenalty: e.target.value })}
                                />
                            </Field>

                            <Field label="Based on Credit Score">
                                <Input
                                    placeholder="e.g. 700 or 720+"
                                    value={formData.creditScore || ''}
                                    onChange={e => setFormData({ ...formData, creditScore: e.target.value })}
                                />
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Lender Origination ($)">
                                    <CurrencyInput
                                        value={formData.originationFee || 0}
                                        onChange={val => setFormData({ ...formData, originationFee: val })}
                                        placeholder="0.00"
                                    />
                                </Field>
                                <Field label="Underwriting Fee ($)">
                                    <CurrencyInput
                                        value={formData.uwFee || 0}
                                        onChange={val => setFormData({ ...formData, uwFee: val })}
                                        placeholder="0.00"
                                    />
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Monthly P&I Payment">
                                    <CurrencyInput
                                        value={formData.monthlyPayment || 0}
                                        onChange={val => setFormData({ ...formData, monthlyPayment: val })}
                                        placeholder="0.00"
                                    />
                                    <p className="text-[10px] text-muted/60 mt-1 italic leading-tight">Automatically calculated, but you can override if needed.</p>
                                </Field>
                                <Field label="Other Closing Fees">
                                    <CurrencyInput
                                        value={formData.closingFees || 0}
                                        onChange={val => setFormData({ ...formData, closingFees: val })}
                                        placeholder="0.00"
                                    />
                                </Field>
                            </div>

                            <Field label="Total Estimated Costs">
                                <div className="bg-banana-400/10 border border-banana-400/20 rounded-xl px-4 py-3 shadow-inner text-banana-900 dark:text-banana-100 font-extrabold text-xl flex items-center justify-between">
                                    <span className="text-xs uppercase tracking-widest opacity-60">Total sum of all fees:</span>
                                    <span>$${((formData.originationFee || 0) + (formData.uwFee || 0) + (formData.brokerFee || 0) + (formData.closingFees || 0)).toLocaleString()}</span>
                                </div>
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Broker Fee">
                                    <div className="flex gap-2">
                                        <div className="w-1/3">
                                            <div className="relative">
                                                <select
                                                    className="block w-full appearance-none rounded-lg bg-surface border-border/10 border px-3 py-2.5 pr-8 shadow-sm text-foreground focus:border-banana-400 focus:ring-banana-400 sm:text-sm"
                                                    value={brokerFeeType}
                                                    onChange={e => {
                                                        const newVal = e.target.value as '$' | '%';
                                                        setBrokerFeeType(newVal);
                                                        // Reset values to avoid confusion when switching?
                                                        // Or just recalculate. Let's recalculate if switching to %
                                                        if (newVal === '%' && formData.loanAmount) {
                                                            const pct = 1.0; // Default to 1% if starting fresh?
                                                            setFormData(p => ({ ...p, brokerFeePercent: pct, brokerFee: (p.loanAmount! * pct) / 100 }));
                                                        }
                                                    }}
                                                >
                                                    <option value="$">Flat ($)</option>
                                                    <option value="%">Percent (%)</option>
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
                                                    <Icons.ChevronDown className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1">
                                            {brokerFeeType === '$' ? (
                                                <CurrencyInput
                                                    value={formData.brokerFee || 0}
                                                    onChange={val => setFormData({ ...formData, brokerFee: val, brokerFeePercent: 0 })}
                                                    placeholder="0.00"
                                                />
                                            ) : (
                                                <div className="relative rounded-md shadow-sm">
                                                    <input
                                                        type="number"
                                                        step="0.125"
                                                        className="block w-full rounded-lg bg-surface border-border/10 border px-3 py-2.5 shadow-sm text-foreground placeholder:text-muted/50 focus:border-banana-400 focus:ring-banana-400 sm:text-sm"
                                                        placeholder="1.0"
                                                        value={formData.brokerFeePercent || ''}
                                                        onChange={e => {
                                                            const val = parseFloat(e.target.value);
                                                            setFormData({
                                                                ...formData,
                                                                brokerFeePercent: val,
                                                                brokerFee: formData.loanAmount ? (formData.loanAmount * val) / 100 : 0
                                                            });
                                                        }}
                                                    />
                                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                                        <span className="text-muted sm:text-sm">%</span>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {brokerFeeType === '%' && (formData.brokerFee || 0) > 0 && (
                                        <p className="text-sm font-semibold text-banana-600 dark:text-banana-400 mt-2 bg-banana-50 dark:bg-banana-900/20 px-3 py-1.5 rounded-lg border border-banana-200 dark:border-banana-800/30 inline-block shadow-sm">
                                            Calculated: ${formData.brokerFee?.toLocaleString()}
                                        </p>
                                    )}
                                </Field>
                            </div>

                            <Field label="Notes (Optional)">
                                <textarea
                                    className="block w-full rounded-lg bg-surface border-border/10 border px-3 py-2 shadow-sm text-foreground placeholder:text-muted/50 focus:border-banana-400 focus:ring-banana-400 sm:text-sm transition-shadow"
                                    rows={3}
                                    placeholder="Key selling points or context..."
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </Field>

                            <Field label="Lender Code (Internal Tag)">
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within:text-banana-500 transition-colors">
                                        <Icons.Tag className="h-4 w-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={formData.lenderCode || ''}
                                        onChange={(e) => setFormData(prev => ({ ...prev, lenderCode: e.target.value }))}
                                        className="block w-full pl-10 pr-4 py-2.5 bg-surface border border-border/10 rounded-lg focus:ring-2 focus:ring-banana-400/20 focus:border-banana-400 transition-all text-sm text-foreground placeholder:text-muted/50"
                                        placeholder="e.g. VISIO-2024-Q1"
                                    />
                                </div>
                            </Field>
                        </div>

                        <div className="flex justify-end pt-4 hidden md:flex">
                            <Button
                                onClick={handleGenerateEmail}
                                className="w-full md:w-auto"
                                disabled={isGenerating || !formData.investorEmail || !formData.loanAmount}
                                icon={Icons.FileText}
                            >
                                {isGenerating ? 'Drafting...' : 'Review Email'}
                            </Button>
                        </div>
                    </div>
                ) : step === 2 ? (
                    // Step 2: Review (Split View)
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full h-full">

                        {/* Left: Editor & Controls */}
                        <div className="flex flex-col gap-6 h-full">
                            {/* Format Toggle */}
                            <div className="bg-surface/30 backdrop-blur-xl p-4 rounded-xl border border-border/10 shadow-sm flex items-center justify-between">
                                <span className="font-semibold text-foreground">Email Format</span>
                                <div className="bg-foreground/5 p-1 rounded-lg flex">
                                    <button
                                        onClick={() => setEmailFormat('text')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${emailFormat === 'text' ? 'bg-surface text-foreground shadow-sm' : 'text-muted hover:text-foreground'}`}
                                    >
                                        Text
                                    </button>
                                    <button
                                        onClick={() => setEmailFormat('html')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${emailFormat === 'html' ? 'bg-surface text-banana-600 dark:text-banana-400 shadow-sm' : 'text-muted hover:text-foreground'}`}
                                    >
                                        Professional HTML
                                    </button>
                                </div>
                            </div>

                            {/* Message Editor */}
                            <div className="bg-surface/30 backdrop-blur-xl p-6 rounded-xl border border-border/10 shadow-sm flex-1 flex flex-col">
                                <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide mb-4">
                                    Message Body <span className="text-muted font-normal normal-case">(Introduction & Notes)</span>
                                </h3>
                                <textarea
                                    className="w-full flex-1 p-4 rounded-lg bg-transparent border border-border/10 shadow-sm text-foreground placeholder:text-muted/50 focus:ring-2 focus:ring-banana-400 focus:border-transparent resize-none text-base leading-relaxed"
                                    placeholder="Enter your message here..."
                                    value={formData.emailBody}
                                    onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                                />
                                <p className="text-xs text-muted mt-2">
                                    {emailFormat === 'html'
                                        ? "Note: The deal details, header, and footer will be added automatically to the standard template."
                                        : "Note: Standard plain text format will include deal terms at the bottom."}
                                </p>
                            </div>

                            <div className="bg-surface/30 backdrop-blur-xl p-6 rounded-xl border border-border/10 shadow-sm">
                                <h3 className="text-sm font-semibold text-foreground mb-4">Automated Follow-Up Plan</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center text-sm text-muted bg-foreground/5 p-3 rounded-lg border border-border/10">
                                        <Icons.Calendar className="w-4 h-4 mr-3 text-banana-600 dark:text-banana-400" />
                                        <span>Wait 2 days → <strong>Follow Up #1</strong></span>
                                    </div>
                                    <div className="flex items-center text-sm text-muted bg-foreground/5 p-3 rounded-lg border border-border/10">
                                        <Icons.Calendar className="w-4 h-4 mr-3 text-banana-600 dark:text-banana-400" />
                                        <span>Wait 5 days → <strong>Follow Up #2</strong></span>
                                    </div>
                                    <div className="flex items-center text-sm text-muted bg-foreground/5 p-3 rounded-lg border border-border/10">
                                        <Icons.Calendar className="w-4 h-4 mr-3 text-banana-600 dark:text-banana-400" />
                                        <span>Wait 10 days → <strong>Final Check-in</strong></span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-border/10 flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">Enable Auto Follow-up</span>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, followUpsEnabled: !prev.followUpsEnabled }))}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.followUpsEnabled ? 'bg-banana-400' : 'bg-foreground/10'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${formData.followUpsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right: Live Preview */}
                        <div className="bg-gray-800 rounded-xl border border-gray-700 shadow-lg overflow-hidden flex flex-col h-[600px] lg:h-full">
                            <div className="bg-gray-900 p-3 flex items-center justify-between border-b border-gray-700">
                                <div className="flex space-x-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">Preview</span>
                                <div className="w-10"></div>
                            </div>

                            <div className="flex-1 bg-white overflow-hidden relative">
                                {emailFormat === 'html' ? (
                                    <iframe
                                        srcDoc={htmlPreview}
                                        className="w-full h-full border-none"
                                        title="Email Preview"
                                    />
                                ) : (
                                    <div className="w-full h-full p-8 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-gray-800 bg-white">
                                        {generatePlainText(formData, profile, formData.emailBody || '')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Send Button Block (Desktop) */}
                        <div className="col-span-1 lg:col-span-2 hidden md:flex justify-end pt-4 gap-3">
                            <Button
                                onClick={() => {
                                    const draftQuote = {
                                        ...formData,
                                        id: formData.id || Math.random().toString(36).substr(2, 9),
                                        createdAt: new Date().toISOString(),
                                        status: QuoteStatus.DRAFT,
                                        emailHtml: emailFormat === 'html' ? generateHtmlEmail({ ...formData, scheduleUrl: previewScheduleUrl } as Quote, profile, formData.emailBody || '') : undefined,
                                        followUpSchedule: [] // No follow ups for drafts usually, or paused
                                    };
                                    onSave(draftQuote as Quote, false);
                                }}
                                variant="secondary"
                                className="px-6"
                            >
                                Save as Draft
                            </Button>
                            <Button
                                onClick={async () => {
                                    // 1. Generate and Download PDF
                                    const element = document.createElement('div');
                                    element.innerHTML = generateTermSheetHtml(formData, profile);

                                    const opt = {
                                        margin: 0,
                                        filename: `Term_Sheet_${formData.investorName?.replace(/\s+/g, '_') || 'Quote'}_${new Date().toISOString().split('T')[0]}.pdf`,
                                        image: { type: 'jpeg' as const, quality: 0.98 },
                                        html2canvas: { scale: 2, useCORS: true },
                                        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
                                    };

                                    html2pdf().set(opt).from(element).save();
                                    showToast('Downloading Term Sheet PDF...', 'success');

                                    // 2. Automatically Save to Database as DOWNLOADED
                                    const scheduleUrl = `${BASE_URL}/?view=schedule&quoteId=${formData.id}`;
                                    const formDataWithUrl = { ...formData, scheduleUrl };

                                    // Use HTML format for the stored preview if possible
                                    const finalContent = generateHtmlEmail(formDataWithUrl, profile, formData.emailBody || '');

                                    const newQuote: Quote = {
                                        ...formDataWithUrl as Quote,
                                        id: formData.id || Math.random().toString(36).substr(2, 9),
                                        createdAt: new Date().toISOString(),
                                        status: QuoteStatus.DOWNLOADED,
                                        emailHtml: finalContent,
                                        followUpSchedule: [
                                            { id: Math.random().toString(36), dayOffset: 2, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString() },
                                            { id: Math.random().toString(36), dayOffset: 5, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString() },
                                            { id: Math.random().toString(36), dayOffset: 10, status: 'pending', scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString() },
                                        ]
                                    };

                                    // Trigger the actual save without redirect
                                    onSave(newQuote, false);
                                }}
                                variant="outline"
                                icon={Icons.FileText}
                                className="px-6"
                            >
                                Download Term Sheet
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className="w-full md:w-auto px-8"
                                icon={profile.autoSendQuoteEmail ? Icons.Send : Icons.CheckCircle}
                                disabled={isSending}
                            >
                                {isSending ? 'Processing...' : (profile.autoSendQuoteEmail ? 'Send Quote Now' : 'Create Quote')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Step 3: Success View
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="bg-surface/30 backdrop-blur-xl p-12 rounded-2xl shadow-xl text-center max-w-lg border border-border/10 animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Icons.CheckCircle className="w-10 h-10 text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-foreground mb-2">Quote Created Successfully!</h2>
                            <p className="text-muted mb-8 text-lg">
                                {profile.autoSendQuoteEmail
                                    ? <span>Your quote has been emailed to <strong>{formData.investorName}</strong>.</span>
                                    : <span>Quote saved for <strong>{formData.investorName}</strong>. Ready to share.</span>
                                }
                            </p>
                            <div className="grid grid-cols-1 gap-3 mb-6">
                                <Button
                                    onClick={() => {
                                        const element = document.createElement('div');
                                        element.innerHTML = generateTermSheetHtml(formData, profile);

                                        const opt = {
                                            margin: 0,
                                            filename: `Term_Sheet_${formData.investorName?.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`,
                                            image: { type: 'jpeg' as const, quality: 0.98 },
                                            html2canvas: { scale: 2, useCORS: true },
                                            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
                                        };

                                        html2pdf().set(opt).from(element).save();

                                        if (formData.id) {
                                            QuoteService.updateQuote(formData.id, { status: QuoteStatus.DOWNLOADED });
                                        }
                                        showToast('Downloading PDF...', 'success');
                                    }}
                                    variant="outline"
                                    icon={Icons.FileText} // Changed icon to FileText for PDF? Or Download
                                    className="justify-center"
                                >
                                    Download Terms (PDF)
                                </Button>
                                <Button
                                    onClick={() => {
                                        const url = `${BASE_URL}/?view=schedule&quoteId=${formData.id}`;
                                        navigator.clipboard.writeText(url);
                                        showToast('Schedule link copied to clipboard!', 'success');
                                    }}
                                    variant="outline"
                                    icon={Icons.Link}
                                    className="justify-center"
                                >
                                    Copy Schedule Link
                                </Button>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-border/10">
                                <Button
                                    onClick={() => onSave(formData as Quote)}
                                    className="w-full justify-center py-4 text-base"
                                >
                                    Return to Dashboard
                                </Button>
                                <button
                                    onClick={() => {
                                        // Reset form to start a new one? Or maybe just go back to dash
                                        // For now, let's just use the main button to leave. 
                                        // But could offer "Create Another"
                                        onSave(formData as Quote);
                                    }}
                                    className="text-sm text-muted hover:text-foreground hover:underline transition-colors"
                                >
                                    View Quote Details
                                </button>
                            </div>
                        </div>
                    </div>
                )
                }
            </div >

            {/* Profile Settings Slide-over / Modal */}
            {
                showSettings && (
                    <div className="absolute inset-0 z-50 flex justify-end">
                        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
                        <div className="relative w-full max-w-sm bg-surface h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 border-l border-border/10">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-foreground">Broker Profile</h2>
                                <button onClick={() => setShowSettings(false)} className="text-muted hover:text-foreground">
                                    <Icons.X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                <Field label="Full Name">
                                    <Input value={profile.name} onChange={e => setProfile({ ...profile, name: e.target.value })} />
                                </Field>
                                <Field label="Job Title">
                                    <Input value={profile.title} onChange={e => setProfile({ ...profile, title: e.target.value })} />
                                </Field>
                                <Field label="Phone">
                                    <Input value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
                                </Field>
                                <Field label="Logo URL">
                                    <Input value={profile.logoUrl} onChange={e => setProfile({ ...profile, logoUrl: e.target.value })} />
                                </Field>
                                <Field label="Headshot URL">
                                    <Input value={profile.headshotUrl} onChange={e => setProfile({ ...profile, headshotUrl: e.target.value })} />
                                </Field>
                                <Field label="Website">
                                    <Input value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} />
                                </Field>

                                <div className="pt-4 border-t border-border/10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-foreground">Auto-Send Emails</span>
                                            <span className="text-xs text-muted">Send email automatically when created</span>
                                        </div>
                                        <button
                                            onClick={() => {
                                                const newVal = !profile.autoSendQuoteEmail;
                                                setProfile({ ...profile, autoSendQuoteEmail: newVal });
                                                // Ideally, we should save this preference to the backend immediately
                                                ProfileService.updateProfile({ autoSendQuoteEmail: newVal }).catch(err => console.error("Failed to save pref", err));
                                            }}
                                            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${profile.autoSendQuoteEmail ? 'bg-banana-400' : 'bg-foreground/10'}`}
                                        >
                                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-surface shadow ring-0 transition duration-200 ease-in-out ${profile.autoSendQuoteEmail ? 'translate-x-5' : 'translate-x-0'}`} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <Button className="w-full" onClick={() => setShowSettings(false)}>Close & Save</Button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Mobile Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-border/10 p-4 pb-8 z-10 md:hidden">
                <div className="max-w-md mx-auto flex gap-3">
                    {step === 1 ? (
                        <Button
                            onClick={handleGenerateEmail}
                            className="w-full"
                            disabled={isGenerating || !formData.investorEmail || !formData.loanAmount}
                            icon={Icons.FileText}
                        >
                            {isGenerating ? 'Drafting...' : 'Review Email'}
                        </Button>
                    ) : (
                        <Button
                            onClick={handleSubmit}
                            className="w-full"
                            icon={Icons.Send}
                            disabled={isSending}
                        >
                            {isSending ? 'Processing...' : (profile.autoSendQuoteEmail ? 'Send Quote' : 'Create Quote')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Trial Limit Modal */}
            <TrialLimitModal
                isOpen={showTrialLimitModal}
                onClose={() => setShowTrialLimitModal(false)}
                emailsSent={trialInfo.emailsSent}
                limit={trialInfo.limit}
            />
        </div >
    );
};

// Address Autocomplete Component
const AddressAutocomplete = ({ value, onChange }: { value: string, onChange: (val: string, state?: string, city?: string, zip?: string) => void }) => {
    const [query, setQuery] = useState(value);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showResults, setShowResults] = useState(false);
    const [loading, setLoading] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const apiKey = import.meta.env.VITE_GEOAPIFY_API_KEY;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        setQuery(value);
    }, [value]);

    useEffect(() => {
        if (!query || query.length < 3 || loading) {
            setSuggestions([]);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setLoading(true);
            try {
                const response = await fetch(`https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(query)}&filter=countrycode:us&apiKey=${apiKey}`);
                const data = await response.json();
                setSuggestions(data.features || []);
                setShowResults(true);
            } catch (error) {
                console.error('Geoapify error:', error);
            } finally {
                setLoading(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [query]);

    return (
        <div className="relative" ref={containerRef}>
            <Input
                placeholder="e.g. 123 Main St"
                value={query}
                onChange={(e) => {
                    setQuery(e.target.value);
                    if (!e.target.value) onChange('');
                }}
                onFocus={() => setShowResults(suggestions.length > 0)}
            />

            {showResults && suggestions.length > 0 && (
                <div className="absolute z-[100] w-full mt-1 bg-surface border border-border/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {suggestions.map((s, i) => (
                        <button
                            key={i}
                            type="button"
                            className="w-full text-left px-4 py-3 hover:bg-banana-400/10 transition-colors border-b border-border/5 last:border-0 flex flex-col"
                            onClick={() => {
                                const props = s.properties;
                                const fullAddress = props.address_line1 || props.formatted;
                                const state = props.state_code || props.state;
                                const city = props.city;
                                const zip = props.postcode;
                                setQuery(fullAddress);
                                onChange(fullAddress, state, city, zip);
                                setShowResults(false);
                            }}
                        >
                            <span className="text-sm font-bold text-foreground">{s.properties.address_line1}</span>
                            <span className="text-xs text-muted">{s.properties.address_line2}</span>
                        </button>
                    ))}
                </div>
            )}

            {loading && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Icons.RefreshCw className="w-4 h-4 text-banana-400 animate-spin" />
                </div>
            )}
        </div>
    );
};

// Extracted UI Components to prevent re-render focus issues
const Field = ({ label, children }: { label: string, children?: React.ReactNode }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-muted mb-1">{label}</label>
        {children}
    </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input className="block w-full rounded-lg bg-surface border-border/10 border px-3 py-2.5 shadow-sm text-foreground placeholder:text-muted/50 focus:border-banana-400 focus:ring-banana-400 sm:text-sm transition-shadow" {...props} />
);

const CurrencyInput = ({ value, onChange, placeholder }: { value: number, onChange: (val: number) => void, placeholder?: string }) => {
    const format = (num: number) => {
        if (!num && num !== 0) return '';
        return new Intl.NumberFormat('en-US').format(num);
    };

    const [displayValue, setDisplayValue] = useState(format(value));

    useEffect(() => {
        setDisplayValue(format(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const rawValue = e.target.value.replace(/,/g, '');
        if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
            const numValue = Number(rawValue);
            onChange(numValue);
            setDisplayValue(e.target.value); // Temporarily keep what they typed for cursor stability
        }
    };

    return (
        <div className="relative rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-muted sm:text-sm px-0.5">$</span>
            </div>
            <input
                type="text"
                className="block w-full rounded-lg bg-surface border-border/10 border pl-7 pr-3 py-2.5 shadow-sm text-foreground placeholder:text-muted/50 focus:border-banana-400 focus:ring-banana-400 sm:text-sm transition-shadow"
                placeholder={placeholder}
                value={displayValue}
                onChange={handleChange}
            />
        </div>
    );
};

const CustomSelect = ({
    value,
    onChange,
    options,
    placeholder = "Select..."
}: {
    value: string;
    onChange: (val: string) => void;
    options: { label: string; value: string }[];
    placeholder?: string;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative w-full cursor-default rounded-lg bg-surface py-2.5 pl-3 pr-10 text-left shadow-sm border border-border/10 focus:outline-none focus:ring-2 focus:ring-banana-500/20 focus:border-banana-500 sm:text-sm transition-all text-foreground"
            >
                <span className={`block truncate ${!selectedOption ? 'text-muted' : 'text-foreground'}`}>
                    {selectedOption?.label || placeholder}
                </span>
                <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <Icons.ChevronDown className={`h-4 w-4 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </span>
            </button>

            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md bg-surface py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm animate-in fade-in zoom-in-95 duration-100 border border-border/10">
                    {options.length === 0 ? (
                        <div className="relative cursor-default select-none py-2 px-4 text-muted italic">
                            No options available
                        </div>
                    ) : (
                        options.map((option) => (
                            <div
                                key={option.value}
                                className={`relative cursor-default select-none py-2 pl-10 pr-4 transition-colors ${value === option.value
                                    ? 'bg-banana-50 dark:bg-banana-500/10 text-banana-900 dark:text-banana-100'
                                    : 'text-foreground hover:bg-banana-100/50 dark:hover:bg-banana-500/5'
                                    }`}
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                            >
                                <span className={`block truncate ${value === option.value ? 'font-medium' : 'font-normal'}`}>
                                    {option.label}
                                </span>
                                {value === option.value ? (
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-banana-600 dark:text-banana-400">
                                        <Icons.Check className="h-4 w-4" aria-hidden="true" />
                                    </span>
                                ) : null}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="relative">
        <select className="block w-full appearance-none rounded-lg bg-surface border-border/10 border px-3 py-2.5 pr-8 shadow-sm text-foreground focus:border-banana-400 focus:ring-banana-400 sm:text-sm transition-shadow" {...props}>
            {props.children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-muted">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
        </div>
    </div>
);
