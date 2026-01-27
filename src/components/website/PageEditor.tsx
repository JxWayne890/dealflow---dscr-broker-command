import React, { useState } from 'react';
import { WebsitePage } from '../../types';
import { WebsiteService } from '../../services/websiteService';
import { useToast } from '../../contexts/ToastContext';
import { Icons } from '../Icons';

interface PageEditorProps {
    pageId: string;
    initialContent: any;
    onClose: () => void;
    onUpdate: () => void;
}

export const PageEditor: React.FC<PageEditorProps> = ({ pageId, initialContent, onClose, onUpdate }) => {
    const [content, setContent] = useState(initialContent || { sections: [] });
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const handleSave = async () => {
        setSaving(true);
        try {
            await WebsiteService.savePage({
                id: pageId,
                content
            });
            showToast('Page saved', 'success');
            onUpdate();
        } catch (e) {
            showToast('Failed to save page', 'error');
        } finally {
            setSaving(false);
        }
    };

    const addSection = (type: 'hero' | 'text' | 'features') => {
        const newSection = {
            type,
            heading: type === 'hero' ? 'New Hero Section' : type === 'features' ? 'Our Features' : '',
            subheading: type === 'hero' ? 'Subtitle goes here' : '',
            html: type === 'text' ? '<p>Your content here...</p>' : '',
            items: type === 'features' ? [
                { title: 'Feature 1', description: 'Description 1' },
                { title: 'Feature 2', description: 'Description 2' },
                { title: 'Feature 3', description: 'Description 3' }
            ] : []
        };

        setContent({
            ...content,
            sections: [...(content.sections || []), newSection]
        });
    };

    const updateSection = (index: number, updates: any) => {
        const newSections = [...(content.sections || [])];
        newSections[index] = { ...newSections[index], ...updates };
        setContent({ ...content, sections: newSections });
    };

    const deleteSection = (index: number) => {
        const newSections = [...(content.sections || [])];
        newSections.splice(index, 1);
        setContent({ ...content, sections: newSections });
    };

    const moveSection = (index: number, direction: 'up' | 'down') => {
        const newSections = [...(content.sections || [])];
        if (direction === 'up' && index > 0) {
            [newSections[index - 1], newSections[index]] = [newSections[index], newSections[index - 1]];
        } else if (direction === 'down' && index < newSections.length - 1) {
            [newSections[index + 1], newSections[index]] = [newSections[index], newSections[index + 1]];
        }
        setContent({ ...content, sections: newSections });
    };

    return (
        <div className="bg-surface rounded-xl border border-border flex flex-col h-[calc(100vh-200px)]">
            {/* Header */}
            <div className="p-4 border-b border-border flex justify-between items-center bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="text-muted hover:text-foreground">
                        <Icons.ArrowRight className="w-5 h-5 rotate-180" />
                    </button>
                    <h3 className="font-bold">Edit Page Content</h3>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-4 py-2 bg-banana-400 text-slate-900 rounded-md font-bold hover:bg-banana-500 disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {content.sections?.length === 0 && (
                    <div className="text-center py-20 text-muted border-2 border-dashed border-border rounded-xl">
                        No sections yet. Add one from the sidebar.
                    </div>
                )}

                {content.sections?.map((section: any, idx: number) => (
                    <div key={idx} className="bg-white border border-border shadow-sm rounded-lg p-4 group relative">
                        {/* Section Header Controls */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => moveSection(idx, 'up')} className="p-1 hover:bg-gray-100 rounded text-muted"><Icons.ChevronUp className="w-4 h-4" /></button>
                            <button onClick={() => moveSection(idx, 'down')} className="p-1 hover:bg-gray-100 rounded text-muted"><Icons.ChevronDown className="w-4 h-4" /></button>
                            <button onClick={() => deleteSection(idx)} className="p-1 hover:bg-red-50 text-red-400 rounded"><Icons.Trash className="w-4 h-4" /></button>
                        </div>

                        <div className="text-xs uppercase font-bold text-muted mb-3 flex items-center gap-2">
                            <Icons.Layers className="w-3 h-3" /> {section.type} Section
                        </div>

                        {/* Editor Fields */}
                        <div className="space-y-4">
                            {section.type === 'hero' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Heading</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                            value={section.heading || ''}
                                            onChange={e => updateSection(idx, { heading: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Subheading</label>
                                        <textarea
                                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                            value={section.subheading || ''}
                                            onChange={e => updateSection(idx, { subheading: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">CTA Text</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                                value={section.ctaText || ''}
                                                onChange={e => updateSection(idx, { ctaText: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">CTA Link</label>
                                            <input
                                                type="text"
                                                className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                                value={section.ctaLink || ''}
                                                onChange={e => updateSection(idx, { ctaLink: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {section.type === 'text' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">HTML Content</label>
                                    <textarea
                                        rows={6}
                                        className="w-full px-3 py-2 border border-slate-200 rounded-md font-mono text-sm"
                                        value={section.html || ''}
                                        onChange={e => updateSection(idx, { html: e.target.value })}
                                    />
                                    <p className="text-xs text-muted mt-1">Accepts basic HTML tags like &lt;p&gt;, &lt;h2&gt;, &lt;ul&gt;, etc.</p>
                                </div>
                            )}

                            {section.type === 'features' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Heading</label>
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border border-slate-200 rounded-md"
                                            value={section.heading || ''}
                                            onChange={e => updateSection(idx, { heading: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        {section.items?.map((item: any, i: number) => (
                                            <div key={i} className="p-3 bg-slate-50 rounded border border-slate-100 flex gap-3">
                                                <div className="flex-1 space-y-2">
                                                    <input
                                                        type="text"
                                                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                                                        placeholder="Title"
                                                        value={item.title}
                                                        onChange={e => {
                                                            const newItems = [...section.items];
                                                            newItems[i] = { ...item, title: e.target.value };
                                                            updateSection(idx, { items: newItems });
                                                        }}
                                                    />
                                                    <input
                                                        type="text"
                                                        className="w-full px-2 py-1 border border-slate-200 rounded text-sm"
                                                        placeholder="Description"
                                                        value={item.description}
                                                        onChange={e => {
                                                            const newItems = [...section.items];
                                                            newItems[i] = { ...item, description: e.target.value };
                                                            updateSection(idx, { items: newItems });
                                                        }}
                                                    />
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newItems = [...section.items];
                                                        newItems.splice(i, 1);
                                                        updateSection(idx, { items: newItems });
                                                    }}
                                                    className="text-red-400 hover:text-red-500 self-start p-1"
                                                >
                                                    <Icons.X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={() => updateSection(idx, { items: [...(section.items || []), { title: '', description: '' }] })}
                                            className="text-sm text-banana-600 font-medium flex items-center gap-1"
                                        >
                                            <Icons.Plus className="w-4 h-4" /> Add Feature Item
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}

                {/* Add Section Controls */}
                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-border/50">
                    <button onClick={() => addSection('hero')} className="flex flex-col items-center justify-center p-4 bg-white border border-dashed border-slate-300 rounded-lg hover:border-banana-400 hover:bg-banana-50 transition-colors">
                        <span className="text-2xl mb-2">🖼️</span>
                        <span className="font-bold text-sm">Add Hero</span>
                    </button>
                    <button onClick={() => addSection('text')} className="flex flex-col items-center justify-center p-4 bg-white border border-dashed border-slate-300 rounded-lg hover:border-banana-400 hover:bg-banana-50 transition-colors">
                        <span className="text-2xl mb-2">📝</span>
                        <span className="font-bold text-sm">Add Text</span>
                    </button>
                    <button onClick={() => addSection('features')} className="flex flex-col items-center justify-center p-4 bg-white border border-dashed border-slate-300 rounded-lg hover:border-banana-400 hover:bg-banana-50 transition-colors">
                        <span className="text-2xl mb-2">✨</span>
                        <span className="font-bold text-sm">Add Features</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
