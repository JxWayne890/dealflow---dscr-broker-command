import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { ProfileService } from '../services/profileService';
import { uploadImageToImgBB } from '../lib/imgbb';
import { BrokerProfile } from '../types';

export const Settings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<BrokerProfile>({
        name: '',
        email: '',
        company: '',
        phone: '',
        website: '',
        title: '',
        logoUrl: '',
        headshotUrl: ''
    });
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const data = await ProfileService.getProfile();
            if (data) {
                setProfile(data);
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            setMessage({ type: 'error', text: 'Failed to load profile data' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const updated = await ProfileService.updateProfile(profile);
            setProfile(updated);
            setMessage({ type: 'success', text: 'Profile updated successfully' });
        } catch (error) {
            console.error('Failed to save profile:', error);
            setMessage({ type: 'error', text: 'Failed to save changes' });
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (file: File, field: 'logoUrl' | 'headshotUrl') => {
        setSaving(true);
        setMessage({ type: 'success', text: 'Uploading image...' });

        try {
            const url = await uploadImageToImgBB(file);
            const updatedProfile = { ...profile, [field]: url };

            // Save immediately to persist the URL
            const saved = await ProfileService.updateProfile(updatedProfile);
            setProfile(saved);
            setMessage({ type: 'success', text: 'Image uploaded and saved!' });
        } catch (error: any) {
            console.error('Upload failed:', error);
            setMessage({ type: 'error', text: `Upload failed: ${error.message}` });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-gray-500">Loading settings...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
            </div>

            <form onSubmit={handleSave} className="bg-white shadow rounded-lg p-6 space-y-6">
                {/* Profile Header */}
                <div className="border-b border-gray-200 pb-6">
                    <h2 className="text-lg font-medium text-gray-900">Profile Information</h2>
                    <p className="mt-1 text-sm text-gray-500">Update your account details and public profile.</p>
                </div>

                {message && (
                    <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

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
                        <label htmlFor="timezone" className="block text-sm font-medium text-gray-700">Timezone</label>
                        <div className="mt-1">
                            <select
                                id="timezone"
                                name="timezone"
                                value={profile.timezone}
                                onChange={e => setProfile({ ...profile, timezone: e.target.value })}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md px-3 py-2 border"
                            >
                                <option value="UTC">UTC (Universal Coordinated Time)</option>
                                <option value="America/New_York">Eastern Time (ET)</option>
                                <option value="America/Chicago">Central Time (CT)</option>
                                <option value="America/Denver">Mountain Time (MT)</option>
                                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                                <option value="America/Anchorage">Alaska Time (AKT)</option>
                                <option value="Pacific/Honolulu">Hawaii-Aleutian Time (HAT)</option>
                                <option value="Europe/London">London (GMT/BST)</option>
                                <option value="Europe/Paris">Paris (CET/CEST)</option>
                                <option value="Asia/Tokyo">Tokyo (JST)</option>
                                <option value="Australia/Sydney">Sydney (AEST/AEDT)</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-5 border-t border-gray-200 flex justify-end">
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </form>
        </div>
    );
};
