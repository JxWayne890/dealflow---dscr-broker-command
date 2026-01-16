import React, { useEffect, useState } from 'react';
import { campaignService, Campaign, CampaignStats } from '../services/campaignService';
import { Icons } from '../components/Icons';

interface CampaignsProps {
    onEdit: (id: string) => void;
    onNew: () => void;
}

export function Campaigns({ onEdit, onNew }: CampaignsProps) {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [stats, setStats] = useState<Record<string, CampaignStats>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        try {
            const data = await campaignService.getCampaigns();
            setCampaigns(data);

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

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Email Campaigns</h1>
                    <p className="text-gray-500">Manage your automated follow-up sequences</p>
                </div>
                <button
                    onClick={onNew}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                    <Icons.Plus size={20} />
                    <span>New Campaign</span>
                </button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Icons.RefreshCw className="animate-spin text-gray-400" size={32} />
                </div>
            ) : campaigns.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200 shadow-sm">
                    <div className="inline-flex p-4 rounded-full bg-blue-50 text-blue-600 mb-4">
                        <Icons.Mail size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
                    <p className="text-gray-500 mb-6">Create your first automated follow-up sequence.</p>
                    <button
                        onClick={onNew}
                        className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
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
                                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer group"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className={`p-3 rounded-lg ${campaign.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                                            <Icons.Mail size={24} />
                                        </div>
                                        <div className={`px-2 py-1 rounded text-xs font-medium ${campaign.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {campaign.is_active ? 'Active' : 'Draft'}
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition">
                                        {campaign.name}
                                    </h3>
                                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                        {campaign.description || 'No description'}
                                    </p>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-3 gap-2 py-3 border-t border-gray-100">
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Sent</p>
                                            <p className="font-bold text-gray-800">{s.total_sent}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Open</p>
                                            <p className="font-bold text-gray-800">{s.open_rate}%</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 uppercase font-semibold">Click</p>
                                            <p className="font-bold text-gray-800">{s.click_rate}%</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center text-xs text-gray-400 mt-2">
                                        <Icons.Clock size={12} className="mr-1" />
                                        Created {new Date(campaign.created_at).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
}
