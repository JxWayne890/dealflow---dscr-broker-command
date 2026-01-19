import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { ProfileService } from '../services/profileService';
import { InviteService } from '../services/inviteService';
import { BrokerProfile, Permissions } from '../types';
import { useToast } from '../contexts/ToastContext';

export const Team = () => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<BrokerProfile[]>([]);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [permissions, setPermissions] = useState<Permissions>({
        dashboard: true,
        quotes: true,
        investors: true,
        campaigns: true,
        analytics: true
    });

    useEffect(() => {
        loadTeam();
    }, []);

    const loadTeam = async () => {
        try {
            const data = await ProfileService.getTeam();
            setTeam(data);
        } catch (error) {
            console.error('Failed to load team:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvite = async () => {
        try {
            const code = await InviteService.createInvite(permissions);
            setInviteCode(code);
            showToast('Invite code generated!', 'success');
        } catch (error) {
            showToast('Failed to create invite', 'error');
        }
    };

    const copyInviteCode = () => {
        if (inviteCode) {
            navigator.clipboard.writeText(inviteCode);
            showToast('Code copied to clipboard', 'success');
        }
    };

    if (loading) return <div className="p-8 text-gray-500">Loading team...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Invite Section */}
                <div className="md:col-span-1 bg-white shadow rounded-lg p-6 space-y-4">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Icons.UserPlus className="w-5 h-5 text-indigo-600" />
                        Invite Assistant
                    </h2>
                    <p className="text-sm text-gray-500">Create an invite code with specific permissions.</p>

                    <div className="space-y-3 pt-2">
                        {Object.keys(permissions).map((key) => (
                            <label key={key} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={permissions[key as keyof Permissions]}
                                    onChange={(e) => setPermissions({ ...permissions, [key]: e.target.checked })}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <span className="text-sm font-medium text-gray-700 capitalize">{key}</span>
                            </label>
                        ))}
                    </div>

                    <Button
                        onClick={handleCreateInvite}
                        className="w-full justify-center mt-4"
                        icon={Icons.Zap}
                    >
                        Generate Code
                    </Button>

                    {inviteCode && (
                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                            <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">Your Invite Code</p>
                            <div className="flex items-center justify-center gap-2">
                                <span className="text-2xl font-mono font-bold text-indigo-900 tracking-widest">{inviteCode}</span>
                                <button onClick={copyInviteCode} className="p-1 hover:bg-indigo-100 rounded text-indigo-600">
                                    <Icons.Copy className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-indigo-400 mt-2 italic">Share this code with your assistant</p>
                        </div>
                    )}
                </div>

                {/* Team List */}
                <div className="md:col-span-2 bg-white shadow rounded-lg overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-medium text-gray-900">Current Assistants</h2>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {team.length === 0 ? (
                            <div className="p-12 text-center">
                                <Icons.Users className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                <p className="text-gray-500">No assistants yet. Generate a code to invite someone!</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {team.map((member) => (
                                    <li key={member.email} className="p-4 hover:bg-gray-50 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{member.name}</p>
                                                <p className="text-xs text-gray-500">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            {member.permissions && Object.entries(member.permissions)
                                                .filter(([_, enabled]) => enabled)
                                                .map(([key]) => (
                                                    <span key={key} className="px-2 py-0.5 bg-gray-100 text-[10px] font-medium text-gray-600 rounded-full capitalize">
                                                        {key}
                                                    </span>
                                                ))
                                            }
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
