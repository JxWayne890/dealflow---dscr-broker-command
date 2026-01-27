import React, { useState, useEffect } from 'react';
import { BrokerProfile, WebsitePage } from '../types';
import { WebsiteService } from '../services/websiteService';
import { ProfileService } from '../services/profileService';
import { useToast } from '../contexts/ToastContext';
import { Icons } from '../components/Icons';
import { PageEditor } from '../components/website/PageEditor';

interface WebsiteBuilderProps {
    profile: BrokerProfile | null;
    onProfileUpdate: (profile: BrokerProfile) => void;
}

export const WebsiteBuilder: React.FC<WebsiteBuilderProps> = ({ profile, onProfileUpdate }) => {
    const [loading, setLoading] = useState(true);
    const [pages, setPages] = useState<WebsitePage[]>([]);
    const [activeTab, setActiveTab] = useState<'pages' | 'settings' | 'editor'>('pages');
    const [editingPageId, setEditingPageId] = useState<string | null>(null);
    const { showToast } = useToast();

    // Subdomain Setup State
    const [subdomainInput, setSubdomainInput] = useState('');
    const [checkingSubdomain, setCheckingSubdomain] = useState(false);
    const [subdomainError, setSubdomainError] = useState('');

    useEffect(() => {
        if (profile?.websiteSubdomain) {
            loadPages();
        } else {
            setLoading(false);
        }
    }, [profile?.websiteSubdomain]);

    const loadPages = async () => {
        setLoading(true);
        const data = await WebsiteService.getPages();
        setPages(data);
        setLoading(false);
    };

    const handleCreateSubdomain = async () => {
        if (!profile) return;
        setCheckingSubdomain(true);
        setSubdomainError('');

        try {
            const available = await WebsiteService.checkSubdomainAvailability(subdomainInput);
            if (!available) {
                setSubdomainError('Subdomain is not available. Please try another.');
                setCheckingSubdomain(false);
                return;
            }

            const updatedProfile = await ProfileService.updateProfile({
                websiteSubdomain: subdomainInput,
                websiteSettings: { theme: 'modern', primaryColor: '#FBBF24' } // Default banana yellow
            });

            onProfileUpdate(updatedProfile);
            showToast('Website created successfully!', 'success');

            // Create default Home page
            const homePage = await WebsiteService.savePage({
                slug: 'home',
                title: 'Home',
                isPublished: true,
                order: 0,
                content: {
                    sections: [
                        {
                            type: 'hero',
                            heading: `Welcome to ${profile.company || profile.name}`,
                            subheading: 'We help investors secure the best financing for their real estate projects.',
                            ctaText: 'Get a Quote',
                            ctaLink: '#contact'
                        },
                        {
                            type: 'features',
                            heading: 'Our Services',
                            items: [
                                { title: 'DSCR Loans', description: 'No income verification needed. Qualify based on property cash flow.' },
                                { title: 'Fix & Flip', description: 'Short-term bridge financing for renovation projects.' },
                                { title: 'Rental Portfolio', description: 'Consolidate multiple properties into a single loan.' }
                            ]
                        }
                    ]
                }
            });

            if (homePage) {
                setPages([homePage]);
            }

        } catch (e) {
            console.error('Failed to create subdomain', e);
            showToast('Failed to create website', 'error');
        } finally {
            setCheckingSubdomain(false);
        }
    };

    const handleCreatePage = async () => {
        const title = prompt('Enter page title (e.g., About Us)');
        if (!title) return;

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

        try {
            const newPage = await WebsiteService.savePage({
                slug,
                title,
                isPublished: false,
                order: pages.length,
                content: { sections: [] }
            });

            if (newPage) {
                setPages([...pages, newPage]);
                handleEditPage(newPage.id);
                showToast('Page created', 'success');
            }
        } catch (e) {
            showToast('Failed to create page', 'error');
        }
    };

    const handleDeletePage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this page?')) return;

        try {
            await WebsiteService.deletePage(id);
            setPages(pages.filter(p => p.id !== id));
            showToast('Page deleted', 'success');
        } catch (e) {
            showToast('Failed to delete page', 'error');
        }
    };

    const handleEditPage = (id: string) => {
        setEditingPageId(id);
        setActiveTab('editor');
    };

    if (!profile) return <div>Loading...</div>;

    // Onboarding View: Create Subdomain
    if (!profile.websiteSubdomain) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-surface border border-border rounded-xl shadow-sm text-center">
                <div className="w-16 h-16 bg-banana-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icons.Globe className="w-8 h-8 text-banana-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2 text-foreground">Launch Your Website</h2>
                <p className="text-muted mb-8">Create a professional landing page to capture leads and showcase your services.</p>

                <div className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1">Choose your subdomain</label>
                        <div className="flex rounded-md shadow-sm">
                            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-border bg-muted/30 text-muted sm:text-sm">
                                https://
                            </span>
                            <input
                                type="text"
                                className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border border-border bg-surface focus:ring-banana-500 focus:border-banana-500 sm:text-sm"
                                placeholder="your-name"
                                value={subdomainInput}
                                onChange={e => {
                                    setSubdomainInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                                    setSubdomainError('');
                                }}
                            />
                        </div>
                        <p className="mt-1 text-xs text-muted">.dealflow.app (or custom domain later)</p>
                    </div>

                    {subdomainError && (
                        <div className="text-sm text-red-500 bg-red-50 p-2 rounded">{subdomainError}</div>
                    )}

                    <button
                        onClick={handleCreateSubdomain}
                        disabled={!subdomainInput || checkingSubdomain}
                        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-banana-900 bg-banana-400 hover:bg-banana-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-banana-500 disabled:opacity-50"
                    >
                        {checkingSubdomain ? 'Checking...' : 'Create Website'}
                    </button>
                </div>
            </div>
        );
    }

    // Dashboard View
    return (
        <div className="bg-background min-h-screen">
            <div className="border-b border-border bg-surface px-6 py-4 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Website Builder</h1>
                    <a
                        href={`/site/${profile.websiteSubdomain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-banana-600 hover:text-banana-700 flex items-center gap-1 mt-1"
                    >
                        {profile.websiteSubdomain}.dealflow.app <Icons.ExternalLink className="w-3 h-3" />
                    </a>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('pages')}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'pages' ? 'bg-banana-100 text-banana-900' : 'text-muted hover:bg-muted/10'}`}
                    >
                        Pages
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${activeTab === 'settings' ? 'bg-banana-100 text-banana-900' : 'text-muted hover:bg-muted/10'}`}
                    >
                        Settings
                    </button>
                </div>
            </div>

            <div className="p-6 max-w-5xl mx-auto">
                {activeTab === 'pages' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-lg font-medium text-foreground">Your Pages</h2>
                            <button
                                onClick={handleCreatePage}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 text-sm font-medium"
                            >
                                <Icons.Plus className="w-4 h-4" /> Add New Page
                            </button>
                        </div>

                        {loading ? <div>Loading...</div> : (
                            <div className="bg-surface rounded-xl border border-border overflow-hidden">
                                <table className="min-w-full divide-y divide-border">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Page Title</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Slug</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-surface divide-y divide-border">
                                        {pages.map(page => (
                                            <tr key={page.id} className="hover:bg-muted/5 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{page.title}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">/{page.slug}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${page.isPublished ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                        {page.isPublished ? 'Published' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => handleEditPage(page.id)} className="text-banana-600 hover:text-banana-900 mr-4">Edit</button>
                                                    <button onClick={() => handleDeletePage(page.id)} className="text-red-600 hover:text-red-900">Delete</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {pages.length === 0 && (
                                    <div className="p-8 text-center text-muted">
                                        No pages created yet. Click "Add New Page" to get started.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'editor' && editingPageId && (
                    <PageEditor
                        pageId={editingPageId}
                        initialContent={pages.find(p => p.id === editingPageId)?.content}
                        onClose={() => setActiveTab('pages')}
                        onUpdate={() => {
                            loadPages(); // Refresh to get latest content/order
                        }}
                    />
                )}
                {activeTab === 'settings' && (
                    <div className="bg-surface rounded-xl border border-border p-6">
                        <h3 className="text-lg font-medium mb-4">Site Settings</h3>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-foreground">Site Theme</label>
                                <select
                                    className="mt-1 block w-full rounded-md border-border bg-background shadow-sm focus:border-banana-500 focus:ring-banana-500 sm:text-sm"
                                    value={profile.websiteSettings?.theme || 'modern'}
                                    onChange={async (e) => {
                                        const newTheme = e.target.value as any;
                                        const updated = await ProfileService.updateProfile({
                                            websiteSettings: { ...profile.websiteSettings, theme: newTheme }
                                        });
                                        onProfileUpdate(updated);
                                        showToast('Theme updated', 'success');
                                    }}
                                >
                                    <option value="modern">Modern Light</option>
                                    <option value="classic">Classic Corporate</option>
                                    <option value="bold">Bold Dark</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground">Primary Color</label>
                                <div className="flex gap-2 mt-2">
                                    {['#FBBF24', '#3B82F6', '#10B981', '#EF4444', '#8B5CF6'].map(color => (
                                        <button
                                            key={color}
                                            className={`w-8 h-8 rounded-full border-2 ${profile.websiteSettings?.primaryColor === color ? 'border-foreground' : 'border-transparent'}`}
                                            style={{ backgroundColor: color }}
                                            onClick={async () => {
                                                const updated = await ProfileService.updateProfile({
                                                    websiteSettings: { ...profile.websiteSettings, primaryColor: color }
                                                });
                                                onProfileUpdate(updated);
                                                showToast('Color updated', 'success');
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
