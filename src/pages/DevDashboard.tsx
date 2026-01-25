import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ProfileService } from '../services/profileService';
import { BrokerProfile } from '../types';
import { Icons } from '../components/Icons';

const ALLOWED_EMAILS = ['theprovidersystem@gmail.com'];

type ProfileWithMeta = BrokerProfile & { id: string; createdAt: string };

export const DevDashboard: React.FC = () => {
    const [profiles, setProfiles] = useState<ProfileWithMeta[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const checkAuthAndFetch = async () => {
            // Check if user is authorized
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !ALLOWED_EMAILS.includes(user.email || '')) {
                setLoading(false);
                setAuthorized(false);
                return;
            }

            setAuthorized(true);
            const data = await ProfileService.getAllProfiles();
            setProfiles(data);
            setLoading(false);
        };
        checkAuthAndFetch();
    }, []);

    const filteredProfiles = profiles.filter(p => {
        const matchesSearch =
            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.company || '').toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || p.onboardingStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const statusCounts = profiles.reduce((acc, p) => {
        const status = p.onboardingStatus || 'unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A';
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status?: string) => {
        const colors: Record<string, string> = {
            active: 'bg-emerald-500/20 text-emerald-400',
            pending_payment: 'bg-amber-500/20 text-amber-400',
            pending_setup: 'bg-blue-500/20 text-blue-400',
            joined: 'bg-purple-500/20 text-purple-400',
        };
        return colors[status || ''] || 'bg-slate-500/20 text-slate-400';
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-banana-400"></div>
            </div>
        );
    }

    if (!authorized) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <div className="text-center">
                    <Icons.Lock className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
                    <p className="text-slate-400">You don't have permission to view this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-black mb-2">Dev Dashboard</h1>
                        <p className="text-slate-400">All subscribers and their information</p>
                    </div>
                    <button
                        onClick={async () => {
                            if (!window.confirm('This will find and remove all duplicate quotes system-wide. Proceed?')) return;
                            try {
                                const { data, error } = await supabase.rpc('delete_duplicates_v2'); // We'll need to define this or use a query
                                if (error) throw error;
                                alert('Cleanup complete!');
                            } catch (e) {
                                console.error(e);
                                alert('Failed to clear duplicates. Make sure the delete_duplicates SQL is applied.');
                            }
                        }}
                        className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                    >
                        <Icons.Trash className="w-4 h-4" />
                        Clean Duplicate Quotes
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <div className="text-2xl font-bold text-white">{profiles.length}</div>
                        <div className="text-sm text-slate-400">Total Users</div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <div className="text-2xl font-bold text-emerald-400">{statusCounts.active || 0}</div>
                        <div className="text-sm text-slate-400">Active</div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <div className="text-2xl font-bold text-amber-400">{statusCounts.pending_payment || 0}</div>
                        <div className="text-sm text-slate-400">Pending Payment</div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <div className="text-2xl font-bold text-blue-400">{statusCounts.pending_setup || 0}</div>
                        <div className="text-sm text-slate-400">Pending Setup</div>
                    </div>
                    <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                        <div className="text-2xl font-bold text-purple-400">{statusCounts.joined || 0}</div>
                        <div className="text-sm text-slate-400">Just Joined</div>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                        <input
                            type="text"
                            placeholder="Search by name, email, or company..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-banana-400"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-banana-400"
                    >
                        <option value="all">All Statuses</option>
                        <option value="active">Active</option>
                        <option value="pending_payment">Pending Payment</option>
                        <option value="pending_setup">Pending Setup</option>
                        <option value="joined">Joined</option>
                    </select>
                </div>

                {/* Table */}
                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-slate-800">
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Name</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Email</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Company</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Role</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Status</th>
                                    <th className="text-left px-6 py-4 text-sm font-semibold text-slate-400">Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProfiles.map((profile) => (
                                    <tr key={profile.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                {profile.headshotUrl ? (
                                                    <img src={profile.headshotUrl} alt={profile.name} className="w-8 h-8 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-sm font-medium">
                                                        {profile.name.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="font-medium">{profile.name || 'No Name'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-300">{profile.email}</td>
                                        <td className="px-6 py-4 text-slate-300">{profile.company || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className="capitalize text-slate-300">{profile.role || 'admin'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(profile.onboardingStatus)}`}>
                                                {profile.onboardingStatus?.replace(/_/g, ' ') || 'Unknown'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm">{formatDate(profile.createdAt)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {filteredProfiles.length === 0 && (
                        <div className="text-center py-12 text-slate-500">
                            No profiles found matching your criteria.
                        </div>
                    )}
                </div>

                <div className="mt-4 text-sm text-slate-500">
                    Showing {filteredProfiles.length} of {profiles.length} profiles
                </div>
            </div>
        </div>
    );
};
