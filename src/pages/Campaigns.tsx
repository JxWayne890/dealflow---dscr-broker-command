import React, { useEffect, useState } from 'react';
import { campaignService, Campaign, CampaignStats } from '../services/campaignService';
import { Icons } from '../components/Icons';
import { ConfirmModal } from '../components/ConfirmModal';
import { useToast } from '../contexts/ToastContext';

interface CampaignsProps {
    onEdit: (id: string) => void;
    onNew: () => void;
    isAdmin?: boolean;
}

export function Campaigns({ onEdit, onNew, isAdmin = true }: CampaignsProps) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState<Record<string, CampaignStats>>({});
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const { showToast } = useToast();

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        try {
            const data = await campaignService.getCampaigns();
            setCampaigns(data);
            setSelectedIds(new Set()); // Reset on reload

            // Load stats for all
            const statsMap: Record<string, CampaignStats> = {};
            await Promise.all(data.map(async (c) => {
                const s = await campaignService.getCampaignStats(c.id);
                statsMap[c.id] = s;
            }));
            setStats(statsMap);

        } catch (error) {
            console.error('Failed to load campaigns', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === campaigns.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(campaigns.map(c => c.id)));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.size === 0) return;
        setShowConfirmDelete(true);
    };

    const executeBulkDelete = async () => {
        setShowConfirmDelete(false);
        setIsDeleting(true);
        try {
            await campaignService.deleteCampaigns(Array.from(selectedIds));
            await loadCampaigns();
            showToast(`Successfully deleted ${selectedIds.size} campaign(s)`, 'success');
        } catch (error) {
            console.error('Bulk delete failed', error);
            showToast('Failed to delete some campaigns.', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Email Campaigns</h1>
                    <p className="text-muted">Manage your automated follow-up sequences</p>
                </div>
                <div className="flex items-center space-x-3">
                    {isAdmin && selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            disabled={isDeleting}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition border border-red-500/20"
                        >
                            <Icons.XCircle size={20} />
                            <span>{isDeleting ? 'Deleting...' : `Delete (${selectedIds.size})`}</span>
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            onClick={toggleSelectAll}
                            className="flex items-center space-x-2 px-4 py-2 bg-surface text-foreground rounded-lg hover:bg-foreground/5 transition border border-border/10"
                        >
                            <span>{selectedIds.size === campaigns.length && campaigns.length > 0 ? 'Deselect All' : 'Select All'}</span>
                        </button>
                    )}
                    <button
                        onClick={onNew}
                        className="flex items-center space-x-2 px-4 py-2 bg-banana-400 text-slate-900 rounded-lg hover:bg-banana-500 transition shadow-sm font-medium"
                    >
                        <Icons.Plus size={20} />
                        <span>New Campaign</span>
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Icons.RefreshCw className="animate-spin text-muted" size={32} />
                </div>
            ) : campaigns.length === 0 ? (
                <div className="text-center py-12 bg-surface/30 backdrop-blur-xl rounded-xl border border-border/10 shadow-sm">
                    <div className="inline-flex p-4 rounded-full bg-banana-400/10 text-banana-600 dark:text-banana-400 mb-4">
                        <Icons.Mail size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No campaigns yet</h3>
                    <p className="text-muted mb-6">Create your first automated follow-up sequence.</p>
                    <button
                        onClick={onNew}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-banana-400 text-slate-900 rounded-lg hover:bg-banana-500 transition font-medium"
                    >
                        <Icons.Plus size={20} />
                        <span>Create Campaign</span>
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {campaigns.map((campaign) => {
                        const s = stats[campaign.id] || { total_sent: 0, open_rate: 0, click_rate: 0 };

                        return (
                            <div
                                key={campaign.id}
                                onClick={() => onEdit(campaign.id)}
                                className={`bg-surface/30 backdrop-blur-xl rounded-xl border transition cursor-pointer group relative overflow-hidden ${selectedIds.has(campaign.id) ? 'border-banana-400 ring-2 ring-banana-400/20 shadow-md' : 'border-border/10 shadow-sm hover:shadow-md'}`}
                            >
                                {/* Selection Checkbox - Admin Only */}
                                {isAdmin && (
                                    <div
                                        onClick={(e) => toggleSelection(e, campaign.id)}
                                        className={`absolute top-4 left-4 z-10 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors ${selectedIds.has(campaign.id) ? 'bg-banana-400 border-banana-400 text-slate-900' : 'bg-surface border-border/30'}`}
                                    >
                                        {selectedIds.has(campaign.id) && <Icons.Check size={14} strokeWidth={3} />}
                                    </div>
                                )}

                                <div className="p-6 pt-12">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-lg ${campaign.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-foreground/5 text-muted'}`}>
                                            <Icons.Mail size={24} />
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${campaign.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-foreground/5 text-muted'}`}>
                                            {campaign.is_active ? 'Active' : 'Draft'}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-banana-400 transition">
                                        {campaign.name}
                                    </h3>
                                    <p className="text-sm text-muted mb-4 line-clamp-2">
                                        {campaign.description || 'No description'}
                                    </p>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-border/10">
                                        <div>
                                            <p className="text-xs text-muted uppercase font-semibold">Sent</p>
                                            <p className="font-bold text-foreground">{s.total_sent}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted uppercase font-semibold">Open</p>
                                            <p className="font-bold text-foreground">{s.open_rate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted uppercase font-semibold">Click</p>
                                            <p className="font-bold text-foreground">{s.click_rate}%</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-xs text-muted mt-2">
                                        <Icons.Clock size={12} className="mr-1" />
                                        Created {new Date(campaign.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            <ConfirmModal
                isOpen={showConfirmDelete}
                title="Delete Campaigns"
                message={`Are you sure you want to delete ${selectedIds.size} campaign(s)? This action cannot be undone.`}
                confirmLabel="Delete"
                onConfirm={executeBulkDelete}
                onCancel={() => setShowConfirmDelete(false)}
                variant="danger"
                loading={isDeleting}
            />
        </div>
    );
}
