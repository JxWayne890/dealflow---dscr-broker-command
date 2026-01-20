import React, { useEffect, useState } from 'react';
import { campaignService, Campaign, CampaignStep, CampaignSubscription } from '../services/campaignService';
import { Icons } from '../components/Icons';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';
import { AnalogTimePicker } from '../components/AnalogTimePicker';

// Helper component for syntax highlighting variables in inputs/textareas
function VariableInput({
    value,
    onChange,
    placeholder,
    type = 'input',
    rows = 4,
    className = ''
}: {
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    type?: 'input' | 'textarea';
    rows?: number;
    className?: string;
}) {
    const highlightVariables = (text: string) => {
        if (!text) return null;
        const parts = text.split(/(\{\{[^}]+\}\})/g);
        return parts.map((part, i) => {
            if (part.startsWith('{{') && part.endsWith('}}')) {
                return (
                    <span
                        key={i}
                        className="bg-banana-400/20 text-banana-600 dark:text-banana-400 rounded-md ring-1 ring-banana-400/30 px-1 mx-0.5 font-bold shadow-[0_0_10px_rgba(250,204,21,0.2)] whitespace-nowrap"
                    >
                        {part}
                    </span>
                );
            }
            return <span key={i}>{part}</span>;
        });
    };

    const backdropRef = React.useRef<HTMLDivElement>(null);
    const commonClasses = "w-full px-4 py-2 text-sm leading-relaxed tracking-normal font-sans";
    const containerClasses = `relative w-full bg-surface border border-border/10 rounded-lg focus-within:ring-2 focus-within:ring-banana-400 transition-all overflow-hidden`;

    const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
        if (backdropRef.current) {
            backdropRef.current.scrollTop = e.currentTarget.scrollTop;
            backdropRef.current.scrollLeft = e.currentTarget.scrollLeft;
        }
    };

    return (
        <div className={containerClasses}>
            {/* The Highlighter Layer - Visible text and highlights */}
            <div
                ref={backdropRef}
                className={`${commonClasses} ${className} absolute inset-0 pointer-events-none whitespace-pre-wrap break-words border-transparent bg-transparent overflow-hidden z-0 text-foreground`}
                aria-hidden="true"
            >
                {highlightVariables(value || '')}
                {(!value || value.endsWith('\n')) && <br />}
            </div>

            {/* The Real Input/Textarea - Invisible text, visible caret/selection */}
            {type === 'textarea' ? (
                <textarea
                    rows={rows}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onScroll={handleScroll}
                    className={`${commonClasses} ${className} bg-transparent relative z-10 block resize-none scrollbar-hide focus:ring-0 border-none outline-none text-transparent caret-foreground selection:bg-banana-400/30 shadow-none`}
                    placeholder={placeholder}
                    spellCheck={false}
                />
            ) : (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={`${commonClasses} ${className} bg-transparent relative z-10 block focus:ring-0 border-none outline-none text-transparent caret-foreground selection:bg-banana-400/30 shadow-none`}
                    placeholder={placeholder}
                    spellCheck={false}
                />
            )}
        </div>
    );
}

interface CampaignEditorProps {
    campaignId: string | null;
    onBack: () => void;
}

export function CampaignEditor({ campaignId, onBack }: CampaignEditorProps) {
    const { showToast } = useToast();

    // Local state
    const [steps, setSteps] = useState<CampaignStep[]>([]);
    const [subs, setSubs] = useState<CampaignSubscription[]>([]);
    const [view, setView] = useState<'steps' | 'leads' | 'settings'>('steps');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [active, setActive] = useState(false);
    const [preferredRunTime, setPreferredRunTime] = useState('09:00');

    // Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSendNowModal, setShowSendNowModal] = useState(false);
    const [selectedSubId, setSelectedSubId] = useState<string | null>(null);
    const [selectedStepOrder, setSelectedStepOrder] = useState<number | null>(null);
    const [expandedSubId, setExpandedSubId] = useState<string | null>(null);
    const [showTimePicker, setShowTimePicker] = useState(false);

    useEffect(() => {
        if (campaignId) {
            loadCampaign(campaignId);
        } else {
            // New Campaign Defaults
            setLoading(false);
            setName('New Campaign');
            setActive(false);
            setSteps([]);
        }
    }, [campaignId]);

    const loadCampaign = async (id: string) => {
        try {
            const camp = await campaignService.getCampaign(id);
            setName(camp.name);
            setDescription(camp.description || '');
            setActive(camp.is_active);
            setPreferredRunTime(camp.preferred_run_time || '09:00');

            const s = await campaignService.getCampaignSteps(id);
            setSteps(s);

            const subscriptions = await campaignService.getCampaignSubscriptions(id);
            setSubs(subscriptions || []);
        } catch (error) {
            console.error('Failed to load campaign', error);
            showToast('Error loading campaign data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleAddStep = () => {
        setSteps([
            ...steps,
            {
                campaign_id: campaignId || '', // Will be fixed on save
                order_index: steps.length + 1,
                delay_days: steps.length === 0 ? 0 : 2,
                subject_template: '',
                body_template: 'Hi {{firstName}},\n\n'
            }
        ]);
    };

    const handleStepChange = (index: number, field: keyof CampaignStep, value: any) => {
        const newSteps = [...steps];
        newSteps[index] = { ...newSteps[index], [field]: value };
        setSteps(newSteps);
    };

    const handleRemoveStep = (index: number) => {
        const newSteps = steps.filter((_, i) => i !== index);
        setSteps(newSteps);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            let currentId = campaignId;

            // Create if new
            if (!currentId) {
                const newCamp = await campaignService.createCampaign({
                    name,
                    description,
                    is_active: active,
                    preferred_run_time: preferredRunTime
                });
                currentId = newCamp?.id || null;
            } else {
                await campaignService.updateCampaign(currentId, {
                    name,
                    description,
                    is_active: active,
                    preferred_run_time: preferredRunTime
                });
            }

            if (currentId) {
                await campaignService.saveCampaignSteps(currentId, steps);
                showToast('Campaign saved successfully', 'success');
                onBack(); // Or stay on page? Choosing to go back for now as per original
            }

        } catch (error) {
            console.error('Failed to save', error);
            showToast('Failed to save changes', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        try {
            await campaignService.deleteCampaign(campaignId!);
            showToast('Campaign deleted', 'success');
            onBack();
        } catch (error) {
            console.error('Delete failed', error);
            showToast('Failed to delete campaign', 'error');
        }
    };

    const handleSendNow = async () => {
        if (!selectedSubId) return;
        try {
            await campaignService.triggerImmediateEmail(selectedSubId, selectedStepOrder || undefined);
            showToast('Email triggered! It should arrive shortly.', 'success');
            setShowSendNowModal(false);
            setSelectedStepOrder(null);
            // Refresh subs after send
            const subscriptions = await campaignService.getCampaignSubscriptions(campaignId!);
            setSubs(subscriptions || []);
        } catch (e) {
            showToast('Failed to trigger email', 'error');
            console.error(e);
        }
    };

    const getPersonalizedSubject = (template: string, sub: CampaignSubscription) => {
        if (!template) return '';
        let subject = template;

        // Replace Variables
        if (sub.quotes?.investorName) {
            subject = subject.replace(/{{firstName}}/g, sub.quotes.investorName.split(' ')[0]);
        }
        if (sub.quotes?.propertyAddress) {
            subject = subject.replace(/{{address}}/g, sub.quotes.propertyAddress);
        }

        return subject;
    };

    if (loading) return <div className="p-10 flex justify-center"><Icons.RefreshCw className="animate-spin" /></div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center space-x-4">
                    <button onClick={onBack} className="text-muted hover:text-foreground transition-colors">
                        <Icons.ArrowRight className="rotate-180" size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{campaignId ? 'Edit Campaign' : 'New Campaign'}</h1>
                        <p className="text-sm text-muted">Configure your automated sequence</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {campaignId && (
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 text-red-600 hover:bg-red-500/10 rounded-lg transition text-sm font-medium"
                        >
                            Delete
                        </button>
                    )}
                    <div className="flex items-center space-x-2 bg-surface border border-border/10 rounded-lg px-3 py-2">
                        <span className="text-sm text-foreground">Active</span>
                        <button
                            onClick={() => setActive(!active)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${active ? 'bg-emerald-500' : 'bg-foreground/10'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-2 bg-banana-400 text-slate-900 rounded-lg hover:bg-banana-500 transition shadow-sm disabled:opacity-50 font-medium"
                    >
                        {saving ? <Icons.RefreshCw className="animate-spin" size={18} /> : <Icons.CheckCircle size={18} />}
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-6 border-b border-border/10 mb-6">
                <button
                    onClick={() => setView('steps')}
                    className={`pb-3 text-sm font-medium border-b-2 transition ${view === 'steps' ? 'border-banana-400 text-banana-600 dark:text-banana-400' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    Sequence Steps
                </button>
                <button
                    onClick={() => setView('leads')}
                    className={`pb-3 text-sm font-medium border-b-2 transition ${view === 'leads' ? 'border-banana-400 text-banana-600 dark:text-banana-400' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    Enrolled Leads
                </button>
                <button
                    onClick={() => setView('settings')}
                    className={`pb-3 text-sm font-medium border-b-2 transition ${view === 'settings' ? 'border-banana-400 text-banana-600 dark:text-banana-400' : 'border-transparent text-muted hover:text-foreground'}`}
                >
                    Settings
                </button>
            </div>

            {/* View: Settings (Default Campaign Details) */}
            {view === 'settings' && (
                <div className="bg-surface/30 backdrop-blur-xl rounded-xl shadow-sm border border-border/10 p-6 mb-8">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">Campaign Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 bg-surface text-foreground border border-border/10 rounded-lg focus:ring-2 focus:ring-banana-400 focus:border-banana-400 outline-none placeholder:text-muted/50"
                                placeholder="e.g. Cold Lead Revival"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 bg-surface text-foreground border border-border/10 rounded-lg focus:ring-2 focus:ring-banana-400 focus:border-banana-400 outline-none placeholder:text-muted/50"
                                placeholder="Internal notes about this campaign"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-muted mb-1">Preferred Send Time</label>
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => setShowTimePicker(true)}
                                    className="flex items-center space-x-3 px-6 py-3 bg-surface text-foreground border border-border/10 rounded-xl hover:border-banana-400 group transition-all shadow-lg shadow-black/5"
                                >
                                    <span className="text-2xl font-bold tracking-tight">
                                        {(() => {
                                            const [h, m] = preferredRunTime.split(':');
                                            const hour = parseInt(h);
                                            const displayHour = hour % 12 || 12;
                                            const ampm = hour >= 12 ? 'PM' : 'AM';
                                            return `${displayHour}:${m} ${ampm}`;
                                        })()}
                                    </span>
                                    <Icons.Clock className="w-6 h-6 text-muted group-hover:text-banana-400 transition-colors" />
                                </button>
                                <p className="text-xs text-muted max-w-[200px]">Emails will be scheduled at this time in your local timezone.</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* View: Steps */}
            {view === 'steps' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-foreground">Follow-up Steps</h2>
                        <button
                            onClick={handleAddStep}
                            className="flex items-center space-x-1 text-banana-600 dark:text-banana-400 hover:text-foreground text-sm font-medium transition-colors"
                        >
                            <Icons.Plus size={16} />
                            <span>Add Step</span>
                        </button>
                    </div>

                    {steps.map((step, index) => (
                        <div key={index} className="bg-surface/30 backdrop-blur-xl rounded-xl shadow-sm border border-border/10 overflow-hidden">
                            <div className="bg-foreground/5 px-6 py-3 border-b border-border/10 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-banana-400/10 text-banana-600 dark:text-banana-400 border border-banana-400/20 text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <div className="flex items-center space-x-2 text-sm text-muted">
                                        <Icons.Clock size={14} />
                                        <span>Send</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={step.delay_days}
                                            onChange={(e) => handleStepChange(index, 'delay_days', parseInt(e.target.value) || 0)}
                                            className="w-16 px-2 py-1 bg-surface border border-border/10 rounded text-center text-foreground outline-none focus:border-banana-400"
                                        />
                                        <span>days after {index === 0 ? 'starting' : 'previous step'}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveStep(index)} className="text-muted hover:text-red-500 transition-colors">
                                    <Icons.X size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-muted uppercase mb-1">Subject</label>
                                    <VariableInput
                                        value={step.subject_template}
                                        onChange={(val) => handleStepChange(index, 'subject_template', val)}
                                        placeholder="Email Subject Line"
                                        className="text-sm"
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-xs font-medium text-muted uppercase">Body</label>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-muted uppercase font-bold tracking-wider">Drag to Insert:</span>
                                            <div className="flex gap-2">
                                                {['{{firstName}}', '{{address}}', '{{senderName}}', '{{companyName}}'].map(v => (
                                                    <span
                                                        key={v}
                                                        draggable
                                                        onDragStart={(e) => e.dataTransfer.setData('text/plain', v)}
                                                        className="px-3 py-1.5 rounded-full bg-banana-400/10 text-banana-600 dark:text-banana-400 border border-banana-400/20 text-xs font-bold cursor-grab active:cursor-grabbing hover:bg-banana-400/20 transition-colors shadow-sm"
                                                        title="Drag into subject or body"
                                                    >
                                                        {v}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <VariableInput
                                        type="textarea"
                                        rows={8}
                                        value={step.body_template}
                                        onChange={(val) => handleStepChange(index, 'body_template', val)}
                                        placeholder="Hi {{firstName}}, ..."
                                        className="font-mono text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {steps.length === 0 && (
                        <div className="text-center py-10 bg-foreground/5 rounded-xl border border-dashed border-border/10">
                            <p className="text-muted mb-2">No steps in this campaign yet.</p>
                            <button
                                onClick={handleAddStep}
                                className="text-banana-600 dark:text-banana-400 font-medium hover:underline"
                            >
                                Add your first follow-up email
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* View: Leads */}
            {view === 'leads' && (
                <div className="bg-surface/30 backdrop-blur-xl rounded-xl shadow-sm border border-border/10 overflow-hidden overflow-x-auto">
                    <table className="min-w-full divide-y divide-border/10">
                        <thead className="bg-foreground/5">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Investor / Deal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Current Step</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Next Run</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-border/10">
                            {subs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-muted text-sm">
                                        No leads are currently enrolled in this campaign.
                                    </td>
                                </tr>
                            ) : (
                                subs.map((sub) => (
                                    <React.Fragment key={sub.id}>
                                        <tr
                                            className="hover:bg-foreground/5 cursor-pointer transition-colors"
                                            onClick={() => setExpandedSubId(expandedSubId === sub.id ? null : sub.id)}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <Icons.ChevronDown
                                                        className={`w-4 h-4 mr-3 text-muted transition-transform ${expandedSubId === sub.id ? 'rotate-180' : ''}`}
                                                    />
                                                    <div>
                                                        <div className="text-sm font-medium text-foreground">{sub.quotes?.investorName || 'Unknown Investor'}</div>
                                                        <div className="text-[10px] text-muted/60 font-medium">{sub.quotes?.investorEmail}</div>
                                                        <div className="text-xs text-muted">
                                                            {sub.quotes?.dealType} • ${sub.quotes?.loanAmount?.toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${sub.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                                                        sub.status === 'completed' ? 'bg-foreground/10 text-muted' :
                                                            'bg-red-500/10 text-red-500'}`}>
                                                    {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                                                {sub.status === 'completed' ? (
                                                    <span className="text-muted italic">Journey Complete</span>
                                                ) : (
                                                    <div>
                                                        <span className="font-medium text-foreground">Step {sub.current_step_index + 1}</span>
                                                        <span className="text-xs text-muted block max-w-[200px] truncate" title={getPersonalizedSubject(
                                                            steps[sub.current_step_index]?.subject_template || 'Unknown Step',
                                                            sub
                                                        )}>
                                                            {getPersonalizedSubject(
                                                                steps[sub.current_step_index]?.subject_template || 'Unknown Step',
                                                                sub
                                                            )}
                                                        </span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                                                <div className="flex items-center justify-between group">
                                                    <span>
                                                        {sub.next_run_at ? new Date(sub.next_run_at).toLocaleDateString() : 'N/A'}
                                                    </span>
                                                    {sub.status === 'active' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedSubId(sub.id);
                                                                setSelectedStepOrder(null); // Default to next
                                                                setShowSendNowModal(true);
                                                            }}
                                                            className="text-xs bg-banana-400/10 text-banana-600 dark:text-banana-400 px-2 py-1 rounded border border-banana-400/20 hover:bg-banana-400/20 transition flex items-center space-x-1 opacity-0 group-hover:opacity-100"
                                                        >
                                                            <Icons.Send size={12} />
                                                            <span>Send Next</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedSubId === sub.id && (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-4 bg-foreground/[0.02] border-t border-b border-border/10">
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-sm font-bold text-muted uppercase tracking-tight">Timeline & Steps</h4>
                                                            <p className="text-xs text-muted">Started on {new Date(sub.created_at).toLocaleDateString()}</p>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {steps.map((step, idx) => {
                                                                const isCompleted = idx < sub.current_step_index;
                                                                const isCurrent = idx === sub.current_step_index;
                                                                const isFuture = idx > sub.current_step_index;

                                                                // Calculate originally scheduled date
                                                                // This is an estimate based on day offsets
                                                                const totalOffset = steps.slice(0, idx + 1).reduce((acc, s) => acc + s.delay_days, 0);
                                                                const estDate = new Date(sub.created_at);
                                                                estDate.setDate(estDate.getDate() + totalOffset);

                                                                return (
                                                                    <div
                                                                        key={idx}
                                                                        className={`flex items-center justify-between p-3 rounded-lg border bg-surface shadow-sm ${isCurrent ? 'border-banana-400 ring-1 ring-banana-400' : 'border-border/10'}`}
                                                                    >
                                                                        <div className="flex items-center space-x-4">
                                                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-emerald-100 dark:bg-emerald-500/20 border-emerald-500 text-emerald-600 dark:text-emerald-400' : isCurrent ? 'bg-banana-400/10 border-banana-400 text-banana-600 dark:text-banana-400' : 'bg-foreground/5 border-border/10 text-muted'}`}>
                                                                                {isCompleted ? <Icons.CheckCircle size={16} /> : <span className="text-xs font-bold">{idx + 1}</span>}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-medium text-foreground">{step.subject_template}</p>
                                                                                <div className="flex items-center space-x-2 text-xs text-muted">
                                                                                    <span>Delay: {step.delay_days}d</span>
                                                                                    <span>•</span>
                                                                                    <span>Scheduled: {estDate.toLocaleDateString()}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center space-x-2">
                                                                            {isCompleted && (
                                                                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded">Sent</span>
                                                                            )}
                                                                            {isCurrent && (
                                                                                <span className="text-xs font-medium text-banana-600 dark:text-banana-400 bg-banana-400/10 px-2 py-1 rounded">Up Next</span>
                                                                            )}
                                                                            <button
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    setSelectedSubId(sub.id);
                                                                                    setSelectedStepOrder(idx + 1);
                                                                                    setShowSendNowModal(true);
                                                                                }}
                                                                                className={`text-xs px-3 py-1.5 rounded-md font-medium transition ${isCurrent ? 'bg-banana-400 text-slate-900 hover:bg-banana-500' : 'bg-surface text-muted border border-border/10 hover:bg-foreground/5'}`}
                                                                            >
                                                                                Send Now
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Modals */}
            <Modal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                title="Delete Campaign"
                primaryAction={{
                    label: 'Delete',
                    onClick: handleDelete,
                    variant: 'danger'
                }}
                secondaryAction={{
                    label: 'Cancel',
                    onClick: () => setShowDeleteModal(false)
                }}
            >
                Are you sure you want to delete this campaign? This action cannot be undone and will cancel all active subscriptions.
            </Modal>

            <Modal
                isOpen={showSendNowModal}
                onClose={() => {
                    setShowSendNowModal(false);
                    setSelectedStepOrder(null);
                }}
                title="Send Email Now"
                primaryAction={{
                    label: 'Send Now',
                    onClick: handleSendNow
                }}
                secondaryAction={{
                    label: 'Cancel',
                    onClick: () => {
                        setShowSendNowModal(false);
                        setSelectedStepOrder(null);
                    }
                }}
            >
                {selectedStepOrder ? (
                    <div className="space-y-3">
                        <p>Are you sure you want to send <strong className="text-foreground">Step {selectedStepOrder}</strong> immediately?</p>
                        {(() => {
                            const sub = subs.find(s => s.id === selectedSubId);
                            const step = steps[selectedStepOrder - 1];
                            if (sub && step) {
                                const totalOffset = steps.slice(0, selectedStepOrder).reduce((acc, s) => acc + s.delay_days, 0);
                                const estDate = new Date(sub.created_at);
                                estDate.setDate(estDate.getDate() + totalOffset);
                                return (
                                    <p className="text-sm text-banana-600 dark:text-banana-400 bg-banana-400/10 p-3 rounded-lg border border-banana-400/20 italic">
                                        This step was originally scheduled for {estDate.toLocaleDateString()} ({steps[selectedStepOrder - 1].delay_days} days after the previous event).
                                    </p>
                                );
                            }
                            return null;
                        })()}
                        <p className="text-sm text-muted">The campaign schedule will advance to the following step after this email is sent.</p>
                    </div>
                ) : (
                    <p className="text-muted">Are you sure you want to send the next scheduled email immediately? It will be sent within a few moments and the schedule will advance to the next step.</p>
                )}
            </Modal>

            {showTimePicker && (
                <AnalogTimePicker
                    value={preferredRunTime}
                    onChange={(val) => setPreferredRunTime(val)}
                    onClose={() => setShowTimePicker(false)}
                />
            )}
        </div>

    );
}
