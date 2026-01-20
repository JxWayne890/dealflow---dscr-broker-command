import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Icons } from '../components/Icons';
import { ProfileService } from '../services/profileService';
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

    if (loading) return <div className="p-8 text-muted">Loading team...</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Organization Invite Code Section */}
                <div className="md:col-span-1 bg-surface/30 backdrop-blur-xl shadow-sm rounded-xl p-6 space-y-4 border border-border/10">
                    <h2 className="text-lg font-medium text-foreground flex items-center gap-2">
                        <Icons.UserPlus className="w-5 h-5 text-banana-400" />
                        Invite Assistant
                    </h2>
                    <p className="text-sm text-muted">Share this permanent organizational code with your team members to grant them access.</p>

                    <div className="mt-4 p-4 bg-banana-400/10 border border-banana-400/20 rounded-lg text-center animate-in fade-in slide-in-from-top-2">
                        <p className="text-xs text-banana-700 dark:text-banana-400 font-semibold uppercase tracking-wider mb-1">Your Organization Code</p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-2xl font-mono font-bold text-foreground tracking-widest">{profile?.inviteCode || '...'}</span>
                            <button onClick={copyInviteCode} className="p-1 hover:bg-banana-400/20 rounded text-banana-600 dark:text-banana-400 transition-colors">
                                <Icons.Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-[10px] text-banana-700/80 dark:text-banana-400/80 mt-2 italic capitalize">This code stays with your organization forever</p>
                    </div>

                    <div className="pt-4 border-t border-border/10">
                        <h3 className="text-xs font-bold text-muted/70 uppercase tracking-widest mb-3">How it works</h3>
                        <ul className="text-xs text-muted space-y-2">
                            <li className="flex gap-2">
                                <span className="text-banana-600 dark:text-banana-400 font-bold">1.</span>
                                <span>Assistant goes to Settings</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-banana-600 dark:text-banana-400 font-bold">2.</span>
                                <span>Enters this code in "Join Team"</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-banana-600 dark:text-banana-400 font-bold">3.</span>
                                <span>They appear in your list below</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Team List */}
                <div className="md:col-span-2 bg-surface/30 backdrop-blur-xl shadow-sm rounded-xl overflow-hidden border border-border/10 flex flex-col">
                    <div className="p-6 border-b border-border/10">
                        <h2 className="text-lg font-medium text-foreground">Current Assistants</h2>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {team.length === 0 ? (
                            <div className="p-12 text-center">
                                <Icons.Users className="w-12 h-12 text-muted/50 mx-auto mb-4" />
                                <p className="text-muted">No assistants yet. Generate a code to invite someone!</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-border/10">
                                {team.map((member) => (
                                    <li key={member.email} className="p-4 hover:bg-foreground/5 transition-colors flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-foreground/5 flex items-center justify-center text-foreground font-bold border border-border/10">
                                                {member.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-foreground">{member.name}</p>
                                                <p className="text-xs text-muted">{member.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {member.permissions && Object.entries(member.permissions).map(([key, enabled]) => (
                                                <button
                                                    key={key}
                                                    onClick={() => handleUpdatePermissions(member.email, key as keyof Permissions, !enabled)}
                                                    disabled={updating === member.email}
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${enabled
                                                        ? 'bg-banana-400/10 text-banana-700 dark:text-banana-400 hover:bg-banana-400/20'
                                                        : 'bg-foreground/5 text-muted hover:bg-foreground/10'}`}
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
