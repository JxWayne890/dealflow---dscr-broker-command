import React, { useState, useEffect } from 'react';
import { educationService } from '../services/educationService';
import { EducationTutorial, BrokerProfile } from '../types';
import { Icons } from '../components/Icons';
import { Modal } from '../components/Modal';
import { useToast } from '../contexts/ToastContext';

interface EducationProps {
    profile: BrokerProfile | null;
}

const CATEGORY_ICONS: Record<string, any> = {
    'Campaigns': Icons.Mail,
    'Quoting': Icons.FileText,
    'General': Icons.Home,
    'Investors': Icons.Users,
    'Analytics': Icons.TrendingUp,
    'Settings': Icons.Settings,
};

const CATEGORY_COLORS: Record<string, string> = {
    'Campaigns': 'from-violet-500 to-purple-600',
    'Quoting': 'from-blue-500 to-cyan-500',
    'General': 'from-banana-400 to-amber-500',
    'Investors': 'from-emerald-500 to-green-600',
    'Analytics': 'from-orange-500 to-red-500',
    'Settings': 'from-slate-500 to-slate-600',
};

export function Education({ profile }: EducationProps) {
    const [tutorials, setTutorials] = useState<EducationTutorial[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTutorial, setSelectedTutorial] = useState<EducationTutorial | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const { showToast } = useToast();

    useEffect(() => {
        loadTutorials();
    }, []);

    const loadTutorials = async () => {
        setLoading(true);
        try {
            const data = await educationService.getTutorials();
            setTutorials(data);
        } catch (e) {
            console.error('Failed to load tutorials', e);
            showToast('Failed to load tutorials', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getEmbedUrl = (url: string) => {
        if (!url) return '';
        if (url.includes('vimeo.com')) {
            const vimeoId = url.split('/').pop()?.split('?')[0];
            return `https://player.vimeo.com/video/${vimeoId}?badge=0&autopause=0&player_id=0&app_id=58479`;
        }
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
            const ytId = url.includes('v=') ? url.split('v=')[1].split('&')[0] : url.split('/').pop();
            return `https://www.youtube.com/embed/${ytId}`;
        }
        return url;
    };

    // Group tutorials by category
    const groupedTutorials = tutorials.reduce((acc, tut) => {
        if (!acc[tut.category]) acc[tut.category] = [];
        acc[tut.category].push(tut);
        return acc;
    }, {} as Record<string, EducationTutorial[]>);

    const categories = Object.keys(groupedTutorials);
    const currentCategoryTutorials = selectedCategory ? groupedTutorials[selectedCategory] || [] : [];

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center p-8">
                <Icons.RefreshCw className="animate-spin text-banana-400" size={32} />
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background">
            {/* Header */}
            <div className="bg-surface border-b border-border/10 p-6 flex items-center justify-between z-10 sticky top-0">
                <div className="flex items-center space-x-3">
                    {selectedCategory ? (
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className="w-10 h-10 rounded-xl bg-foreground/5 hover:bg-foreground/10 flex items-center justify-center text-muted hover:text-foreground transition-colors"
                        >
                            <Icons.ChevronLeft size={20} />
                        </button>
                    ) : (
                        <div className="w-10 h-10 rounded-xl bg-banana-400/10 flex items-center justify-center text-banana-500">
                            <Icons.Video size={20} />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            {selectedCategory || 'Education'}
                        </h1>
                        <p className="text-sm text-muted">
                            {selectedCategory
                                ? `${currentCategoryTutorials.length} tutorial${currentCategoryTutorials.length !== 1 ? 's' : ''}`
                                : 'Learn how to maximize your platform experience'
                            }
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                <div className="max-w-6xl mx-auto">
                    {/* FOLDER VIEW — show category cards */}
                    {!selectedCategory && (
                        <>
                            {categories.length === 0 ? (
                                <div className="text-center py-20 bg-surface rounded-2xl border border-border/10 border-dashed">
                                    <Icons.Video className="mx-auto h-12 w-12 text-muted mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium text-foreground">No tutorials available</h3>
                                    <p className="text-muted mt-1">Check back later for new guides and videos.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {categories.map((category) => {
                                        const IconComp = CATEGORY_ICONS[category] || Icons.Layers;
                                        const gradient = CATEGORY_COLORS[category] || 'from-banana-400 to-amber-500';
                                        const count = groupedTutorials[category].length;

                                        return (
                                            <button
                                                key={category}
                                                onClick={() => setSelectedCategory(category)}
                                                className="group text-left bg-surface rounded-2xl border border-border/10 overflow-hidden hover:shadow-xl hover:shadow-banana-400/5 transition-all duration-300 hover:-translate-y-1"
                                            >
                                                <div className={`h-32 bg-gradient-to-br ${gradient} relative flex items-center justify-center overflow-hidden`}>
                                                    <IconComp size={64} className="text-white/20 absolute -right-4 -bottom-4 group-hover:scale-110 transition-transform duration-500" />
                                                    <IconComp size={40} className="text-white relative z-10 group-hover:scale-110 transition-transform duration-300" />
                                                </div>
                                                <div className="p-5">
                                                    <h3 className="font-bold text-foreground text-lg group-hover:text-banana-500 transition-colors flex items-center justify-between">
                                                        {category}
                                                        <Icons.ChevronRight size={18} className="text-muted group-hover:text-banana-500 group-hover:translate-x-1 transition-all" />
                                                    </h3>
                                                    <p className="text-sm text-muted mt-1">
                                                        {count} tutorial{count !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}

                    {/* INSIDE A FOLDER — show tutorials in this category */}
                    {selectedCategory && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentCategoryTutorials.map((tutorial) => (
                                <div key={tutorial.id} className="group relative bg-surface rounded-2xl border border-border/10 overflow-hidden hover:shadow-xl hover:shadow-banana-400/5 transition-all duration-300 flex flex-col">
                                    <div
                                        className="aspect-video bg-foreground/5 relative overflow-hidden group cursor-pointer"
                                        onClick={() => setSelectedTutorial(tutorial)}
                                    >
                                        {tutorial.thumbnailUrl ? (
                                            <img src={tutorial.thumbnailUrl} alt={tutorial.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex flex-col items-center justify-center text-muted gap-3">
                                                <Icons.Video size={48} className="opacity-20 group-hover:scale-110 transition-transform duration-300" />
                                                <div className="w-12 h-12 rounded-full bg-banana-400 text-slate-900 flex items-center justify-center pl-1 shadow-xl group-hover:scale-110 transition-transform">
                                                    <Icons.ExternalLink size={20} />
                                                </div>
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-[2px]">
                                            <div className="w-16 h-16 rounded-full bg-banana-400 text-slate-900 flex items-center justify-center pl-1 transform translate-y-4 group-hover:translate-y-0 shadow-xl transition-all duration-300">
                                                <Icons.ExternalLink size={28} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h4 className="font-bold text-foreground text-lg mb-2 line-clamp-2 leading-tight group-hover:text-banana-500 transition-colors cursor-pointer" onClick={() => setSelectedTutorial(tutorial)}>
                                            {tutorial.title}
                                        </h4>
                                        <p className="text-sm text-muted line-clamp-3 mb-4 leading-relaxed flex-1">
                                            {tutorial.description || 'No description provided.'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Video Player Modal */}
            <Modal
                isOpen={!!selectedTutorial}
                onClose={() => setSelectedTutorial(null)}
                title={selectedTutorial?.title || 'Tutorial'}
                maxWidth="sm:max-w-4xl"
            >
                {selectedTutorial && (
                    <div className="space-y-4">
                        <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden border border-border/10">
                            <iframe
                                src={getEmbedUrl(selectedTutorial.videoUrl)}
                                className="w-full h-full"
                                frameBorder="0"
                                allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
                                title={selectedTutorial.title}
                            ></iframe>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-foreground mb-2">{selectedTutorial.title}</h3>
                            <p className="text-muted leading-relaxed">
                                {selectedTutorial.description || 'No description provided.'}
                            </p>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
