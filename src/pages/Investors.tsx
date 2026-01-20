
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { Investor } from '../types';
import { InvestorDetailModal } from '../components/InvestorDetailModal';

interface InvestorsProps {
    investors: Investor[];
    onAddInvestor: (investor: Investor) => void;
}

export const Investors = ({ investors, onAddInvestor }: InvestorsProps) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedInvestor, setSelectedInvestor] = useState<Investor | null>(null);
    const [newInvestor, setNewInvestor] = useState<Partial<Investor>>({});

    const handleSave = () => {
        if (newInvestor.name && newInvestor.email) {
            onAddInvestor({
                id: Math.random().toString(36).substr(2, 9),
                name: newInvestor.name,
                email: newInvestor.email,
                company: newInvestor.company,
                phone: newInvestor.phone
            } as Investor);
            setShowAddModal(false);
            setNewInvestor({});
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Investors</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your network of capital partners.</p>
                </div>
                <Button icon={Icons.Plus} onClick={() => setShowAddModal(true)}>
                    Add Investor
                </Button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {investors.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                    No investors found. Add your first one!
                                </td>
                            </tr>
                        ) : (
                            investors.map((investor) => (
                                <tr
                                    key={investor.id}
                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                    onClick={() => setSelectedInvestor(investor)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold mr-3">
                                                {investor.name.charAt(0)}
                                            </div>
                                            <div className="text-sm font-medium text-gray-900">{investor.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {investor.company || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{investor.email}</div>
                                        <div className="text-xs text-gray-500">{investor.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Simple Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 p-6 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-900">New Investor</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                                <Icons.X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input
                                    className="block w-full rounded-lg border-gray-300 border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="e.g. Sarah Smith"
                                    value={newInvestor.name || ''}
                                    onChange={e => setNewInvestor({ ...newInvestor, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Company (Optional)</label>
                                <input
                                    className="block w-full rounded-lg border-gray-300 border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="e.g. Horizon Capital"
                                    value={newInvestor.company || ''}
                                    onChange={e => setNewInvestor({ ...newInvestor, company: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                <input
                                    type="email"
                                    className="block w-full rounded-lg border-gray-300 border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="sarah@example.com"
                                    value={newInvestor.email || ''}
                                    onChange={e => setNewInvestor({ ...newInvestor, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (Optional)</label>
                                <input
                                    type="tel"
                                    className="block w-full rounded-lg border-gray-300 border px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                    placeholder="(555) 123-4567"
                                    value={newInvestor.phone || ''}
                                    onChange={e => setNewInvestor({ ...newInvestor, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg border border-gray-300"
                            >
                                Cancel
                            </button>
                            <Button onClick={handleSave} disabled={!newInvestor.name || !newInvestor.email}>
                                Save Investor
                            </Button>
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
