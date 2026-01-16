import React, { useEffect, useState } from 'react';
import { campaignService, Campaign, CampaignStep, CampaignSubscription } from '../services/campaignService';
import { Icons } from '../components/Icons';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';

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

    // Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSendNowModal, setShowSendNowModal] = useState(false);
    const [selectedSubId, setSelectedSubId] = useState<string | null>(null);

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
                    is_active: active
                });
                currentId = newCamp?.id || null;
            } else {
                await campaignService.updateCampaign(currentId, {
                    name,
                    description,
                    is_active: active
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
            await campaignService.triggerImmediateEmail(selectedSubId);
            showToast('Email triggered! It should arrive shortly.', 'success');
            setShowSendNowModal(false);
            onBack(); // Refresh list effectively
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
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
                        <Icons.ArrowRight className="rotate-180" size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{campaignId ? 'Edit Campaign' : 'New Campaign'}</h1>
                        <p className="text-sm text-gray-500">Configure your automated sequence</p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    {campaignId && (
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition text-sm font-medium"
                        >
                            Delete
                        </button>
                    )}
                    <div className="flex items-center space-x-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
                        <span className="text-sm text-gray-700">Active</span>
                        <button
                            onClick={() => setActive(!active)}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${active ? 'bg-green-500' : 'bg-gray-200'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                    >
                        {saving ? <Icons.RefreshCw className="animate-spin" size={18} /> : <Icons.CheckCircle size={18} />}
                        <span>Save Changes</span>
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-6 border-b border-gray-200 mb-6">
                <button
                    onClick={() => setView('steps')}
                    className={`pb-3 text-sm font-medium border-b-2 transition ${view === 'steps' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Sequence Steps
                </button>
                <button
                    onClick={() => setView('leads')}
                    className={`pb-3 text-sm font-medium border-b-2 transition ${view === 'leads' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Enrolled Leads
                </button>
                <button
                    onClick={() => setView('settings')}
                    className={`pb-3 text-sm font-medium border-b-2 transition ${view === 'settings' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Settings
                </button>
            </div>

            {/* View: Settings (Default Campaign Details) */}
            {view === 'settings' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. Cold Lead Revival"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Internal notes about this campaign"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* View: Steps */}
            {view === 'steps' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold text-gray-900">Follow-up Steps</h2>
                        <button
                            onClick={handleAddStep}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            <Icons.Plus size={16} />
                            <span>Add Step</span>
                        </button>
                    </div>

                    {steps.map((step, index) => (
                        <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                                <div className="flex items-center space-x-3">
                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">
                                        {index + 1}
                                    </span>
                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                        <Icons.Clock size={14} />
                                        <span>Send</span>
                                        <input
                                            type="number"
                                            min="0"
                                            value={step.delay_days}
                                            onChange={(e) => handleStepChange(index, 'delay_days', parseInt(e.target.value) || 0)}
                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-center"
                                        />
                                        <span>days after {index === 0 ? 'starting' : 'previous step'}</span>
                                    </div>
                                </div>
                                <button onClick={() => handleRemoveStep(index)} className="text-gray-400 hover:text-red-500">
                                    <Icons.X size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Subject</label>
                                    <input
                                        type="text"
                                        value={step.subject_template}
                                        onChange={(e) => handleStepChange(index, 'subject_template', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                        placeholder="Email Subject Line"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between mb-1">
                                        <label className="block text-xs font-medium text-gray-500 uppercase">Body</label>
                                        <span className="text-xs text-gray-400">Available variables: {'{{firstName}}'}, {'{{address}}'}</span>
                                    </div>
                                    <textarea
                                        rows={8}
                                        value={step.body_template}
                                        onChange={(e) => handleStepChange(index, 'body_template', e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none font-mono text-sm"
                                        placeholder="Hi {{firstName}}, ..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {steps.length === 0 && (
                        <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 mb-2">No steps in this campaign yet.</p>
                            <button
                                onClick={handleAddStep}
                                className="text-blue-600 font-medium hover:underline"
                            >
                                Add your first follow-up email
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* View: Leads */}
            {view === 'leads' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Investor / Deal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Step</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Run</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {subs.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">
                                        No leads are currently enrolled in this campaign.
                                    </td>
                                </tr>
                            ) : (
                                subs.map((sub) => (
                                    <tr key={sub.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{sub.quotes?.investorName || 'Unknown Investor'}</div>
                                            <div className="text-xs text-gray-500">
                                                {sub.quotes?.dealType} • ${sub.quotes?.loanAmount?.toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                ${sub.status === 'active' ? 'bg-green-100 text-green-800' :
                                                    sub.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                                                        'bg-red-100 text-red-800'}`}>
                                                {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {sub.status === 'completed' ? (
                                                <span className="text-gray-400 italic">Journey Complete</span>
                                            ) : (
                                                <div>
                                                    <span className="font-medium text-gray-900">Step {sub.current_step_index + 1}</span>
                                                    <span className="text-xs text-gray-500 block max-w-[200px] truncate" title={getPersonalizedSubject(
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center space-x-4">
                                            <div>
                                                {new Date(sub.next_run_at).toLocaleDateString()}
                                            </div>
                                            {sub.status === 'active' && (
                                                <button
                                                    onClick={() => {
                                                        setSelectedSubId(sub.id);
                                                        setShowSendNowModal(true);
                                                    }}
                                                    className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded border border-blue-200 hover:bg-blue-100 transition flex items-center space-x-1"
                                                    title="Force send next email now"
                                                >
                                                    <Icons.Send size={12} />
                                                    <span>Send Now</span>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
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
                onClose={() => setShowSendNowModal(false)}
                title="Send Email Now"
                primaryAction={{
                    label: 'Send Now',
                    onClick: handleSendNow
                }}
                secondaryAction={{
                    label: 'Cancel',
                    onClick: () => setShowSendNowModal(false)
                }}
            >
                Are you sure you want to send the next scheduled email immediately? It will be sent within a few moments and the schedule will advance to the next step.
            </Modal>
        </div>

    );
}
