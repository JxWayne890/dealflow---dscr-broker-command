import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { Quote, QuoteStatus, DealType, BrokerProfile, EmailFormat, Investor } from '../types';
import { generateQuoteEmail } from '../services/geminiService';
import { sendQuoteEmail } from '../services/emailService';
import { generateHtmlEmail, generatePlainText } from '../utils/emailTemplates';
import { DEFAULT_BROKER_PROFILE } from '../constants';
import { useToast } from '../contexts/ToastContext';

export const NewQuote = ({ onCancel, onSave, investors, onAddInvestor }: {
    onCancel: () => void,
    onSave: (quote: Quote) => void,
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

    // Profile State (Defaults for Demo)
    const [profile, setProfile] = useState<BrokerProfile>(DEFAULT_BROKER_PROFILE);

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const { ProfileService } = await import('../services/profileService');
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
    });

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
                return;
            }

            const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) / (Math.pow(1 + monthlyRate, numberOfPayments) - 1);
            setFormData(prev => ({ ...prev, monthlyPayment: Math.round(payment * 100) / 100 }));
        }
    }, [formData.loanAmount, formData.rate, formData.termYears]);

    const handleGenerateEmail = () => {
        setIsGenerating(true);
        // Simulate a brief delay
        setTimeout(() => {
            // For the new template system, we just want a nice intro message.
            const intro = formData.notes
                ? `Great connecting with you.I've crunched the numbers for your scenario in ${formData.propertyState}. Based on the details provided, we can offer the following terms:`
                : `Great connecting with you. Based on the details provided, here is the quote for your scenario in ${formData.propertyState}:`;

            setFormData(prev => ({ ...prev, emailBody: intro }));
            setIsGenerating(false);
            setStep(2);
        }, 500);
    };

    const handleSubmit = async () => {
        setIsSending(true);

        // Generate the real schedule URL using the pre-generated ID
        const scheduleUrl = `${window.location.origin}/?view=schedule&quoteId=${formData.id}`;
        const formDataWithUrl = { ...formData, scheduleUrl };

        // Generate the FINAL payload based on format
        let finalContent = '';
        if (emailFormat === 'html') {
            finalContent = generateHtmlEmail(formDataWithUrl, profile, formData.emailBody || '');
        } else {
            finalContent = generatePlainText(formDataWithUrl, profile, formData.emailBody || '');
        }

        // Attempt real email send
        let result: { success: boolean; error?: string } = { success: false };
        if (formData.investorEmail) {
            result = await sendQuoteEmail(formDataWithUrl as Quote, finalContent, profile);
        }

        const newQuote: Quote = {
            ...formDataWithUrl as Quote,
            id: formData.id || Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            status: result.success ? QuoteStatus.ACTIVE : QuoteStatus.DRAFT,
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
            // However, strictly speaking, NewQuote props has onAddInvestor.
            onAddInvestor(newInv);
        }

        setIsSending(false);
        if (result.success) {
            // Update the form data with the final object so Step 3 can use it if needed (mostly generic info)
            setFormData(newQuote);
            setStep(3); // Show Success View
        } else {
            // Error handled above with alert
        }
    };

    // Live HTML Preview
    const previewScheduleUrl = `${window.location.origin}/?view=schedule&quoteId=${formData.id}`;
    const htmlPreview = generateHtmlEmail({ ...formData, scheduleUrl: previewScheduleUrl }, profile, formData.emailBody || '');

    return (
        <div className="flex flex-col h-full max-w-5xl mx-auto relative">

            {/* Header / Nav */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button onClick={step === 1 ? onCancel : () => setStep(1)} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100">
                        <Icons.ChevronLeft className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold ml-2">
                        {step === 1 ? 'New Deal Quote' : 'Review & Send'}
                    </h1>
                </div>
                {step === 2 && (
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-sm font-medium text-gray-600 hover:text-indigo-600 flex items-center bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
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
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-6 border-b border-gray-100 pb-2">Investor Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Select Investor">
                                    <Select
                                        value={formData.investorId || ''}
                                        onChange={e => {
                                            const selectedId = e.target.value;
                                            if (selectedId === 'new') {
                                                // Handle creating new investor logic if needed, or just clear fields
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
                                    >
                                        <option value="">Select an investor...</option>
                                        {investors.map(inv => (
                                            <option key={inv.id} value={inv.id}>{inv.name}</option>
                                        ))}
                                    </Select>
                                </Field>
                                <Field label="Or Create New">
                                    <div className="flex items-center pt-2">
                                        <span className="text-xs text-gray-500">Edit details below to create new contact</span>
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

                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-6 border-b border-gray-100 pb-2">Deal Terms</h3>

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
                                            <Input
                                                placeholder="e.g. 123 Main St"
                                                value={formData.propertyAddress || ''}
                                                onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                                                className="block w-full rounded-lg border-gray-300 border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm mt-2"
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <Input
                                        placeholder="e.g. 123 Main St"
                                        value={formData.propertyAddress || ''}
                                        onChange={e => setFormData({ ...formData, propertyAddress: e.target.value })}
                                    />
                                )}
                            </Field>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="State">
                                    <Input placeholder="TX" value={formData.propertyState || ''} onChange={e => setFormData({ ...formData, propertyState: e.target.value.toUpperCase() })} maxLength={2} />
                                </Field>
                                <Field label="Type">
                                    <Select value={formData.dealType} onChange={e => setFormData({ ...formData, dealType: e.target.value as DealType })}>
                                        {Object.values(DealType).map(t => <option key={t} value={t}>{t}</option>)}
                                    </Select>
                                </Field>
                            </div>

                            <Field label="Loan Amount">
                                <div className="relative rounded-md shadow-sm">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <Input type="number" className="pl-7" placeholder="0.00" value={formData.loanAmount || ''} onChange={e => setFormData({ ...formData, loanAmount: Number(e.target.value) })} />
                                </div>
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Lender Origination ($)">
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <Input
                                            type="number"
                                            className="pl-7"
                                            placeholder="0.00"
                                            value={formData.originationFee || ''}
                                            onChange={e => setFormData({ ...formData, originationFee: Number(e.target.value) })}
                                        />
                                    </div>
                                </Field>
                                <Field label="Underwriting Fee ($)">
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <Input
                                            type="number"
                                            className="pl-7"
                                            placeholder="0.00"
                                            value={formData.uwFee || ''}
                                            onChange={e => setFormData({ ...formData, uwFee: Number(e.target.value) })}
                                        />
                                    </div>
                                </Field>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Monthly P&I Payment">
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <Input
                                            type="number"
                                            className="pl-7"
                                            placeholder="0.00"
                                            value={formData.monthlyPayment || ''}
                                            onChange={e => setFormData({ ...formData, monthlyPayment: Number(e.target.value) })}
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 italic leading-tight">Automatically calculated, but you can override if needed.</p>
                                </Field>
                                <Field label="Other Closing Fees">
                                    <div className="relative rounded-md shadow-sm">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                            <span className="text-gray-500 sm:text-sm">$</span>
                                        </div>
                                        <Input
                                            type="number"
                                            className="pl-7"
                                            placeholder="0.00"
                                            value={formData.closingFees || ''}
                                            onChange={e => setFormData({ ...formData, closingFees: Number(e.target.value) })}
                                        />
                                    </div>
                                </Field>
                            </div>

                            <Field label="Notes (Optional)">
                                <textarea
                                    className="block w-full rounded-lg border-gray-300 border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    rows={3}
                                    placeholder="Key selling points or context..."
                                    value={formData.notes || ''}
                                    onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                />
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
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                                <span className="font-semibold text-gray-700">Email Format</span>
                                <div className="bg-gray-100 p-1 rounded-lg flex">
                                    <button
                                        onClick={() => setEmailFormat('text')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${emailFormat === 'text' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Text
                                    </button>
                                    <button
                                        onClick={() => setEmailFormat('html')}
                                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${emailFormat === 'html' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Professional HTML
                                    </button>
                                </div>
                            </div>

                            {/* Message Editor */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
                                    Message Body <span className="text-gray-400 font-normal normal-case">(Introduction & Notes)</span>
                                </h3>
                                <textarea
                                    className="w-full flex-1 p-4 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-base leading-relaxed"
                                    placeholder="Enter your message here..."
                                    value={formData.emailBody}
                                    onChange={(e) => setFormData({ ...formData, emailBody: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    {emailFormat === 'html'
                                        ? "Note: The deal details, header, and footer will be added automatically to the standard template."
                                        : "Note: Standard plain text format will include deal terms at the bottom."}
                                </p>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-900 mb-4">Automated Follow-Up Plan</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <Icons.Calendar className="w-4 h-4 mr-3 text-indigo-500" />
                                        <span>Wait 2 days → <strong>Follow Up #1</strong></span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <Icons.Calendar className="w-4 h-4 mr-3 text-indigo-500" />
                                        <span>Wait 5 days → <strong>Follow Up #2</strong></span>
                                    </div>
                                    <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <Icons.Calendar className="w-4 h-4 mr-3 text-indigo-500" />
                                        <span>Wait 10 days → <strong>Final Check-in</strong></span>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Enable Auto Follow-up</span>
                                    <button
                                        onClick={() => setFormData(prev => ({ ...prev, followUpsEnabled: !prev.followUpsEnabled }))}
                                        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${formData.followUpsEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${formData.followUpsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
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
                                    onSave(draftQuote as Quote);
                                }}
                                variant="secondary"
                                className="px-6"
                            >
                                Save as Draft
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                className="w-full md:w-auto px-8"
                                icon={Icons.Send}
                                disabled={isSending}
                            >
                                {isSending ? 'Sending...' : 'Send Quote Now'}
                            </Button>
                        </div>
                    </div>
                ) : (
                    // Step 3: Success View
                    <div className="w-full h-full flex items-center justify-center">
                        <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-lg border border-gray-100 animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Icons.CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quote Sent Successfully!</h2>
                            <p className="text-gray-500 mb-8 text-lg">
                                Your quote has been emailed to <strong>{formData.investorName}</strong> ({formData.investorEmail}).
                            </p>
                            <div className="space-y-3">
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
                                    className="text-sm text-gray-400 hover:text-gray-600"
                                >
                                    View Quote Details
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Profile Settings Slide-over / Modal */}
            {showSettings && (
                <div className="absolute inset-0 z-50 flex justify-end">
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setShowSettings(false)}></div>
                    <div className="relative w-full max-w-sm bg-white h-full shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900">Broker Profile</h2>
                            <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
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
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-100">
                            <Button className="w-full" onClick={() => setShowSettings(false)}>Close & Save</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Sticky Footer */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-8 z-10 md:hidden">
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
                            {isSending ? 'Sending...' : 'Send Quote'}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Extracted UI Components to prevent re-render focus issues
const Field = ({ label, children }: { label: string, children?: React.ReactNode }) => (
    <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
        {children}
    </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input className="block w-full rounded-lg border-gray-300 border px-3 py-2.5 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" {...props} />
);

const Select = (props: React.SelectHTMLAttributes<HTMLSelectElement>) => (
    <div className="relative">
        <select className="block w-full appearance-none rounded-lg border-gray-300 border px-3 py-2.5 pr-8 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white" {...props}>
            {props.children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
        </div>
    </div>
);
