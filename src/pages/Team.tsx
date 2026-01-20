import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { ProfileService } from '../services/profileService';
import { InviteService } from '../services/inviteService';
import { BrokerProfile, Permissions } from '../types';
import { useToast } from '../contexts/ToastContext';

export const Team = ({ profile }: { profile: BrokerProfile | null }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [team, setTeam] = useState<BrokerProfile[]>([]);
    const [updating, setUpdating] = useState<string | null>(null);

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

    const copyInviteCode = () => {
        if (profile?.inviteCode) {
            navigator.clipboard.writeText(profile.inviteCode);
            showToast('Code copied to clipboard', 'success');
        }
    };

    const handleUpdatePermissions = async (memberEmail: string, key: keyof Permissions, value: boolean) => {
        setUpdating(memberEmail);
        try {
            const member = team.find(m => m.email === memberEmail);
            if (!member) return;

            const newPermissions = { ...member.permissions, [key]: value } as Permissions;

            // Note: We need a way to update assistant profile. 
            // Since we use organization_id RLS, admin can update profiles with same org_id if policy allows.
            // Let's assume ProfileService needs an updateAssistant method or similar.
            // For now, let's just do the DB update here or extend ProfileService.
            const { error } = await supabase
                .from('profiles')
                .update({ permissions: newPermissions })
                .eq('email', memberEmail);

            if (error) throw error;

            setTeam(prev => prev.map(m => m.email === memberEmail ? { ...m, permissions: newPermissions } : m));
            showToast('Permissions updated', 'success');
        } catch (error) {
            console.error('Update failed:', error);
            showToast('Failed to update permissions', 'error');
        } finally {
            setUpdating(null);
        }
    };

    if (loading) return <div className="p-8 text-gray-500">Loading team...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Organization Invite Code Section */}
                <div className="md:col-span-1 bg-white shadow rounded-lg p-6 space-y-4 border border-indigo-100 ring-4 ring-indigo-50/50">
                    <h2 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                        <Icons.UserPlus className="w-5 h-5 text-indigo-600" />
                        Invite Assistant
                    </h2>
                    <p className="text-sm text-gray-500">Share this permanent organizational code with your team members to grant them access.</p>

                    <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs text-indigo-600 font-semibold uppercase tracking-wider mb-1">Your Organization Code</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl font-mono font-bold text-indigo-900 tracking-widest">{profile?.inviteCode || '...'}</span>
                            <button onClick={copyInviteCode} className="p-1 hover:bg-indigo-100 rounded text-indigo-600">
                                <Icons.Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] text-indigo-400 mt-2 italic capitalize">This code stays with your organization forever</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">How it works</h3>
                        <ul className="text-xs text-gray-500 space-y-2">
                            <li className="flex gap-2">
                                <span className="text-indigo-500 font-bold">1.</span>
                                <span>Assistant goes to Settings</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-indigo-500 font-bold">2.</span>
                                <span>Enters this code in "Join Team"</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-indigo-500 font-bold">3.</span>
                                <span>They appear in your list below</span>
                            </li>
                        </ul>
                    </div>
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
                                        <div className="flex items-center gap-2">
                                            {member.permissions && Object.entries(member.permissions).map(([key, enabled]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleUpdatePermissions(member.email, key as keyof Permissions, !enabled)}
                                                    disabled={updating === member.email}
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${enabled
                                                        ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                                                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                >
                                                    {key}
                                                </button>
                                            ))}
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
