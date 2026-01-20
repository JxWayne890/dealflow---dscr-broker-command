import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { ProfileService } from '../services/profileService';
import { InviteService } from '../services/inviteService';
import { uploadImageToImgBB } from '../lib/imgbb';
import { BrokerProfile } from '../types';
import { useToast } from '../contexts/ToastContext';
import { Team } from './Team';

interface SettingsProps {
    onProfileUpdate: (profile: BrokerProfile) => void;
    currentProfile: BrokerProfile | null;
}

export const Settings = ({ onProfileUpdate, currentProfile }: SettingsProps) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<BrokerProfile>(currentProfile || {
        name: '',
        email: '',
        company: '',
        phone: '',
        website: '',
        title: '',
        logoUrl: '',
        headshotUrl: ''
    });
    const { showToast } = useToast();
    const [showTzDropdown, setShowTzDropdown] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [joining, setJoining] = useState(false);

    const TIMEZONES = [
        { value: 'UTC', name: 'UTC' },
        { value: 'America/New_York', name: 'Eastern Time' },
        { value: 'America/Chicago', name: 'Central Time' },
        { value: 'America/Denver', name: 'Mountain Time' },
        { value: 'America/Los_Angeles', name: 'Pacific Time' },
        { value: 'America/Anchorage', name: 'Alaska Time' },
        { value: 'Pacific/Honolulu', name: 'Hawaii Time' },
        { value: 'Europe/London', name: 'London' },
        { value: 'Europe/Paris', name: 'Paris' },
        { value: 'Asia/Tokyo', name: 'Tokyo' },
        { value: 'Australia/Sydney', name: 'Sydney' }
    ];

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        if (currentProfile) {
            setProfile(currentProfile);
            setLoading(false);
            return;
        }
        try {
            const data = await ProfileService.getProfile();
            if (data) {
                setProfile(data);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            showToast('Failed to load profile data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const updated = await ProfileService.updateProfile(profile);
            setProfile(updated);
            onProfileUpdate(updated);
            showToast('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Failed to save profile:', error);
            showToast('Failed to save changes', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file: File, field: 'logoUrl' | 'headshotUrl') => {
        setSaving(true);
        // showToast('Uploading image...', 'info'); // Optional, maybe too noisy

        try {
            const url = await uploadImageToImgBB(file);
            const updatedProfile = { ...profile, [field]: url };

            // Save immediately to persist the URL
            const saved = await ProfileService.updateProfile(updatedProfile);
            setProfile(saved);
            onProfileUpdate(saved);
            showToast('Image uploaded and saved!', 'success');
        } catch (error: any) {
            console.error('Upload failed:', error);
            showToast(`Upload failed: ${error.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleJoinTeam = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinCode.trim()) return;

        setJoining(true);
        try {
            await InviteService.claimInvite(joinCode);
            const updated = await ProfileService.getProfile();
            if (updated) {
                setProfile(updated);
                onProfileUpdate(updated);
            }
            showToast('Successfully joined the team!', 'success');
            setJoinCode('');
        } catch (error: any) {
            showToast(error.message || 'Failed to join team', 'error');
        } finally {
            setJoining(false);
        }
    };

    if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
                <p className="text-gray-500">Manage your profile and team organization.</p>
            </div>

            {/* Tab Navigation */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'profile' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                >
                    <Icons.Users className="w-4 h-4" />
                    My Profile
                </button>
                {(!profile.role || profile.role === 'admin') && (
                    <button
                        onClick={() => setActiveTab('team')}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'team' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'}`}
                    >
                        <Icons.Users className="w-4 h-4" />
                        Team Management
                    </button>
                )}
            </div>

            {activeTab === 'profile' ? (
                <>
                    {/* Assistant joining team is always in profile/general settings */}
                    {profile.role === 'assistant' && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-center gap-6">
                            <div className="h-12 w-12 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                <Icons.Users className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-indigo-900 font-bold">Assistant Account</h3>
                                <p className="text-sm text-indigo-700">You are part of an organization. Your access and permissions are managed by your administrator.</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSave} className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 overflow-hidden">
                        <div className="p-8 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-1 rounded-full bg-indigo-600" />
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Personal Information</h2>
                                    <p className="text-sm text-gray-500">Update your public profile and contact details.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                                {/* Images Section */}

                                {/* Headshot */}
                                <div className="sm:col-span-6 md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Headshot</label>
                                    <div className="mt-2 flex items-center space-x-4">
                                        <div className="h-20 w-20 rounded-full overflow-hidden bg-gray-100 border border-gray-200">
                                            {profile.headshotUrl ? (
                                                <img src={profile.headshotUrl} alt="Headshot" className="h-full w-full object-cover" />
                                            ) : (
                                                <Icons.Users className="h-full w-full p-4 text-gray-300" />
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="headshot-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                                Change
                                                <input
                                                    id="headshot-upload"
                                                    name="headshot-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'headshotUrl');
                                                    }}
                                                />
                                            </label>
                                            <p className="mt-1 text-xs text-gray-500">JPG, GIF or PNG. 1MB max.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Logo */}
                                <div className="sm:col-span-6 md:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700">Company Logo</label>
                                    <div className="mt-2 flex items-center space-x-4">
                                        <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
                                            {profile.logoUrl ? (
                                                <img src={profile.logoUrl} alt="Logo" className="h-full w-full object-contain" />
                                            ) : (
                                                <span className="text-xs text-gray-400 font-medium">No Logo</span>
                                            )}
                                        </div>
                                        <div>
                                            <label htmlFor="logo-upload" className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                                Change
                                                <input
                                                    id="logo-upload"
                                                    name="logo-upload"
                                                    type="file"
                                                    className="sr-only"
                                                    accept="image/*"
                                                    onChange={(e) => {
                                                        if (e.target.files?.[0]) handleImageUpload(e.target.files[0], 'logoUrl');
                                                    }}
                                                />
                                            </label>
                                            <p className="mt-1 text-xs text-gray-500">JPG, GIF or PNG. 1MB max.</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Text Fields */}
                                <div className="sm:col-span-3">
                                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="name"
                                            id="name"
                                            value={profile.name}
                                            onChange={e => setProfile({ ...profile, name: e.target.value })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="title" className="block text-sm font-medium text-gray-700">Job Title</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="title"
                                            id="title"
                                            value={profile.title || ''}
                                            onChange={e => setProfile({ ...profile, title: e.target.value })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                                            placeholder="Senior Loan Officer"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-4">
                                    <label htmlFor="company" className="block text-sm font-medium text-gray-700">Company Name</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="company"
                                            id="company"
                                            value={profile.company || ''}
                                            onChange={e => setProfile({ ...profile, company: e.target.value })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-4">
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email (Read Only)</label>
                                    <div className="mt-1">
                                        <input
                                            type="email"
                                            name="email"
                                            id="email"
                                            value={profile.email}
                                            disabled
                                            className="bg-gray-50 shadow-sm block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border text-gray-500 cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="phone"
                                            id="phone"
                                            value={profile.phone || ''}
                                            onChange={e => setProfile({ ...profile, phone: e.target.value })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                                            placeholder="(555) 123-4567"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label htmlFor="website" className="block text-sm font-medium text-gray-700">Website</label>
                                    <div className="mt-1">
                                        <input
                                            type="text"
                                            name="website"
                                            id="website"
                                            value={profile.website || ''}
                                            onChange={e => setProfile({ ...profile, website: e.target.value })}
                                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                                            placeholder="www.example.com"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setShowTzDropdown(!showTzDropdown)}
                                            className="relative w-full bg-white border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2.5 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        >
                                            <span className="block truncate">
                                                {(() => {
                                                    const tz = TIMEZONES.find(t => t.value === profile.timezone) || TIMEZONES[0];
                                                    try {
                                                        const now = new Date();
                                                        const timeStr = now.toLocaleTimeString('en-US', {
                                                            timeZone: tz.value,
                                                            hour: 'numeric',
                                                            minute: '2-digit',
                                                            hour12: true
                                                        });
                                                        const parts = new Intl.DateTimeFormat('en-US', {
                                                            timeZone: tz.value,
                                                            timeZoneName: 'shortOffset'
                                                        }).formatToParts(now);
                                                        const offset = parts.find(p => p.type === 'timeZoneName')?.value || '';
                                                        return `${tz.name} (${offset}) - ${timeStr}`;
                                                    } catch (e) {
                                                        return tz.name;
                                                    }
                                                })()}
                                            </span>
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                                                <Icons.ChevronDown className="h-4 w-4 text-gray-400" />
                                            </span>
                                        </button>

                                        {showTzDropdown && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={() => setShowTzDropdown(false)}
                                                />
                                                <div className="absolute z-20 mt-1 w-full bg-white shadow-xl max-h-60 rounded-lg py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm border border-gray-100">
                                                    {TIMEZONES.map((tz) => {
                                                        let subLabel = '';
                                                        try {
                                                            const now = new Date();
                                                            const timeStr = now.toLocaleTimeString('en-US', {
                                                                timeZone: tz.value,
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            });
                                                            const parts = new Intl.DateTimeFormat('en-US', {
                                                                timeZone: tz.value,
                                                                timeZoneName: 'shortOffset'
                                                            }).formatToParts(now);
                                                            const offset = parts.find(p => p.type === 'timeZoneName')?.value || '';
                                                            subLabel = `${offset} • ${timeStr}`;
                                                        } catch (e) { }

                                                        const isSelected = profile.timezone === tz.value;

                                                        return (
                                                            <div
                                                                key={tz.value}
                                                                onClick={() => {
                                                                    setProfile({ ...profile, timezone: tz.value });
                                                                    setShowTzDropdown(false);
                                                                }}
                                                                className={`cursor-pointer select-none relative py-3 pl-3 pr-9 border-b border-gray-50 last:border-0 hover:bg-indigo-50 transition-colors ${isSelected ? 'bg-indigo-50/50' : ''}`}
                                                            >
                                                                <div className="flex items-center justify-between">
                                                                    <span className={`block truncate ${isSelected ? 'font-semibold text-indigo-700' : 'font-medium text-gray-900'}`}>
                                                                        {tz.name}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 font-normal">
                                                                        {subLabel}
                                                                    </span>
                                                                </div>
                                                                {isSelected && (
                                                                    <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-indigo-600">
                                                                        <Icons.CheckCircle className="h-4 w-4" />
                                                                    </span>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                            <Button type="submit" disabled={saving} className="px-10">
                                {saving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </div>
                    </form>

                    {/* Join Team for admins who aren't associated with anyone yet */}
                    {(!profile.role || profile.role === 'admin') && !profile.parentId && (
                        <div className="bg-white shadow-xl shadow-gray-200/50 rounded-2xl border border-gray-100 p-8 space-y-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                    <Icons.UserPlus className="w-6 h-6 text-indigo-600" />
                                    Join an Organization
                                </h2>
                                <p className="mt-1 text-sm text-gray-500">If you are joining someone else's team, enter their invitation code below.</p>
                            </div>

                            <form onSubmit={handleJoinTeam} className="flex gap-4">
                                <input
                                    type="text"
                                    placeholder="ENTER-CODE"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                    className="max-w-xs bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full text-lg font-mono tracking-widest rounded-xl px-4 py-3 uppercase"
                                />
                                <Button type="submit" disabled={joining || !joinCode}>
                                    {joining ? 'Joining...' : 'Join Team'}
                                </Button>
                            </form>
                        </div>
                    )}
                </>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <Team profile={profile} />
                </div>
            )}
        </div>
    );
};
