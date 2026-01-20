
import React, { useState, useMemo } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { Investor } from '../types';
import { InvestorDetailModal } from '../components/InvestorDetailModal';
import { formatPhoneNumber } from '../utils/formatters';

interface InvestorsProps {
    investors: Investor[];
    onAddInvestor: (investor: Investor) => void;
    onUpdateInvestor: (id: string, updates: Partial<Investor>) => void;
    onDeleteInvestor: (id: string) => void;
    onBulkDeleteInvestors: (ids: string[]) => void;
}

export const Investors = ({ investors, onAddInvestor, onUpdateInvestor, onDeleteInvestor, onBulkDeleteInvestors }: InvestorsProps) => {
    const [showModal, setShowModal] = useState(false);
    const [editingInvestor, setEditingInvestor] = useState<Investor | null>(null);
    const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
    const [formData, setFormData] = useState<Partial<Investor>>({});
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    const filteredInvestors = useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return investors;

        return investors.filter(inv =>
            inv.name.toLowerCase().includes(query) ||
            inv.email.toLowerCase().includes(query) ||
            (inv.company && inv.company.toLowerCase().includes(query)) ||
            (inv.phone && inv.phone.replace(/[^0-9]/g, '').includes(query.replace(/[^0-9]/g, ''))) ||
            (inv.phone && inv.phone.toLowerCase().includes(query))
        );
    }, [investors, searchQuery]);

    const handleOpenAdd = () => {
        setEditingInvestor(null);
        setFormData({});
        setShowModal(true);
    };

    const handleOpenEdit = (e: React.MouseEvent, investor: Investor) => {
        e.stopPropagation();
        setEditingInvestor(investor);
        setFormData(investor);
        setShowModal(true);
    };

    const handleSave = () => {
        if (formData.name && formData.email) {
            if (editingInvestor) {
                onUpdateInvestor(editingInvestor.id, formData);
            } else {
                onAddInvestor({
                    id: Math.random().toString(36).substr(2, 9),
                    name: formData.name,
                    email: formData.email,
                    company: formData.company,
                    phone: formData.phone
                } as Investor);
            }
            setShowModal(false);
            setFormData({});
        }
    };

    const handleDelete = () => {
        if (editingInvestor && window.confirm(`Are you sure you want to remove ${editingInvestor.name}?`)) {
            onDeleteInvestor(editingInvestor.id);
            setShowModal(false);
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.length === investors.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(investors.map(inv => inv.id));
        }
    };

    const toggleSelectOne = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (window.confirm(`Are you sure you want to remove ${selectedIds.length} investors?`)) {
            onBulkDeleteInvestors(selectedIds);
            setSelectedIds([]);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Investors</h1>
                    <p className="text-sm text-muted mt-1">Manage your network of capital partners.</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 text-red-500 rounded-lg text-sm font-bold border border-red-500/20 hover:bg-red-500/20 transition-all animate-in fade-in slide-in-from-right-4"
                        >
                            <Icons.Trash className="w-4 h-4" />
                            Delete ({selectedIds.length})
                        </button>
                    )}
                    <Button icon={Icons.Plus} onClick={handleOpenAdd}>
                        Add Investor
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-muted group-focus-within:text-banana-400 transition-colors">
                    <Icons.Search className="w-5 h-5" />
                </div>
                <input
                    type="text"
                    placeholder="Search by name, company, email, or phone (area code)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-surface border border-border/10 rounded-2xl shadow-sm focus:ring-2 focus:ring-banana-400/20 focus:border-banana-400 transition-all text-sm text-foreground placeholder:text-muted/50 font-medium"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-muted hover:text-foreground transition-colors"
                    >
                        <Icons.XCircle className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="bg-surface/30 backdrop-blur-xl rounded-xl border border-border/10 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-border/10">
                    <thead className="bg-foreground/5">
                        <tr>
                            <th className="px-6 py-3 text-left w-10">
                                <input
                                    type="checkbox"
                                    className="rounded border-border/30 text-banana-400 focus:ring-banana-400 h-4 w-4 cursor-pointer bg-surface"
                                    checked={selectedIds.length === investors.length && investors.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-muted uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-transparent divide-y divide-border/10">
                        {filteredInvestors.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted">
                                    {searchQuery ? `No investors matching "${searchQuery}"` : 'No investors found. Add your first one!'}
                                </td>
                            </tr>
                        ) : (
                            filteredInvestors.map((investor) => (
                                <tr
                                    key={investor.id}
                                    className={`hover:bg-foreground/5 transition-colors cursor-pointer ${selectedIds.includes(investor.id) ? 'bg-indigo-500/10' : ''}`}
                                    onClick={() => setSelectedInvestor(investor)}
                                >
                                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            className="rounded border-border/30 text-banana-400 focus:ring-banana-400 h-4 w-4 cursor-pointer bg-surface"
                                            checked={selectedIds.includes(investor.id)}
                                            onChange={(e) => toggleSelectOne(e as any, investor.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold mr-3">
                                                {investor.name.charAt(0)}
                                            </div>
                                            <div className="text-sm font-medium text-foreground">{investor.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted">
                                        {investor.company || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-foreground">{investor.email}</div>
                                        <div className="text-xs text-muted">{formatPhoneNumber(investor.phone)}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={(e) => handleOpenEdit(e, investor)}
                                            className="text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1 rounded-lg transition-colors border border-transparent"
                                        >
                                            Edit
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-surface rounded-xl border border-border/10 shadow-2xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-foreground">
                                {editingInvestor ? 'Edit Investor' : 'New Investor'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-muted hover:text-foreground">
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Full Name</label>
                                <input
                                    className="block w-full rounded-lg bg-background border-border/10 border px-3 py-2 shadow-sm focus:border-banana-400 focus:ring-banana-400 sm:text-sm text-foreground placeholder:text-muted/50"
                                    placeholder="e.g. Sarah Smith"
                                    value={formData.name || ''}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Company (Optional)</label>
                                <input
                                    className="block w-full rounded-lg bg-background border-border/10 border px-3 py-2 shadow-sm focus:border-banana-400 focus:ring-banana-400 sm:text-sm text-foreground placeholder:text-muted/50"
                                    placeholder="e.g. Horizon Capital"
                                    value={formData.company || ''}
                                    onChange={e => setFormData({ ...formData, company: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Email</label>
                                <input
                                    type="email"
                                    className="block w-full rounded-lg bg-background border-border/10 border px-3 py-2 shadow-sm focus:border-banana-400 focus:ring-banana-400 sm:text-sm text-foreground placeholder:text-muted/50"
                                    placeholder="sarah@example.com"
                                    value={formData.email || ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    className="block w-full rounded-lg bg-background border-border/10 border px-3 py-2 shadow-sm focus:border-banana-400 focus:ring-banana-400 sm:text-sm text-foreground placeholder:text-muted/50"
                                    placeholder="(555) 123-4567"
                                    value={formData.phone || ''}
                                    onChange={e => {
                                        const formatted = formatPhoneNumber(e.target.value);
                                        setFormData({ ...formData, phone: formatted });
                                    }}
                                    maxLength={14}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex justify-between items-center">
                            {editingInvestor ? (
                                <button
                                    onClick={handleDelete}
                                    className="text-xs font-semibold text-red-500 hover:text-red-400 flex items-center gap-1.5 px-2 py-1 hover:bg-red-500/10 rounded transition-colors"
                                >
                                    <Icons.Trash className="w-3.5 h-3.5" />
                                    Delete Investor
                                </button>
                            ) : <div />}

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-foreground hover:bg-foreground/5 rounded-lg border border-border/10"
                                >
                                    Cancel
                                </button>
                                <Button onClick={handleSave} disabled={!formData.name || !formData.email}>
                                    {editingInvestor ? 'Save Changes' : 'Create Investor'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {/* Detail Modal */}
            {selectedInvestor && (
                <InvestorDetailModal
                    investor={selectedInvestor}
                    onClose={() => setSelectedInvestor(null)}
                />
            )}
        </div>
    );
};
