import React from 'react';
import { Icons } from './Icons';
import { Button } from './Button';
import { View, BrokerProfile } from '../types';

interface LayoutProps {
    children: React.ReactNode;
    currentView: View;
    onViewChange: (view: View) => void;
    onNewQuote: () => void;
    profile: BrokerProfile | null;
}

export const Layout = ({ children, currentView, onViewChange, onNewQuote, profile }: LayoutProps) => {
    const initials = profile?.name
        ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : '??';

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-indigo-100 flex flex-row">

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200 h-screen sticky top-0">
                <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm">
                        DF
                    </div>
                    <span className="font-bold text-gray-900 text-lg tracking-tight">DealFlow</span>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.dashboard) && (
                        <button
                            onClick={() => onViewChange('dashboard')}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Icons.Home className={`w-5 h-5 mr-3 ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-gray-400'}`} />
                            Dashboard
                        </button>
                    )}
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.quotes) && (
                        <button
                            onClick={() => onViewChange('quotes')}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === 'quotes' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Icons.FileText className={`w-5 h-5 mr-3 ${currentView === 'quotes' ? 'text-indigo-600' : 'text-gray-400'}`} />
                            Quotes
                        </button>
                    )}
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.investors) && (
                        <button
                            onClick={() => onViewChange('investors')}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === 'investors' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Icons.Users className={`w-5 h-5 mr-3 ${currentView === 'investors' ? 'text-indigo-600' : 'text-gray-400'}`} />
                            Investors
                        </button>
                    )}
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.campaigns) && (
                        <button
                            onClick={() => onViewChange('campaigns')}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === 'campaigns' || currentView === 'campaign_editor' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Icons.Mail className={`w-5 h-5 mr-3 ${currentView === 'campaigns' || currentView === 'campaign_editor' ? 'text-indigo-600' : 'text-gray-400'}`} />
                            Campaigns
                        </button>
                    )}
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.analytics) && (
                        <button
                            onClick={() => onViewChange('analytics')}
                            className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${currentView === 'analytics' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Icons.TrendingUp className={`w-5 h-5 mr-3 ${currentView === 'analytics' ? 'text-indigo-600' : 'text-gray-400'}`} />
                            Analytics
                        </button>
                    )}

                </nav>

                <div className="p-4 border-t border-gray-100 flex flex-col gap-4">
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.quotes) && (
                        <Button onClick={onNewQuote} className="w-full justify-center shadow-lg" icon={Icons.Plus}>
                            New Quote
                        </Button>
                    )}

                    <button
                        onClick={() => onViewChange('settings')}
                        className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 border border-transparent hover:bg-white hover:shadow-md hover:border-gray-100 ${currentView === 'settings' ? 'bg-white shadow-md border-gray-100 ring-2 ring-indigo-50' : 'bg-gray-50/50 hover:scale-[1.02]'}`}
                    >
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold border transition-all duration-200 ${currentView === 'settings' ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-inner group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-700 group-hover:shadow-sm'}`}>
                            {initials}
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <p className={`text-sm font-semibold truncate transition-colors ${currentView === 'settings' ? 'text-indigo-900' : 'text-gray-900'}`}>{profile?.name || 'Loading...'}</p>
                            <div className="flex items-center justify-between gap-1">
                                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider truncate">{profile?.title || 'Broker'}</p>
                                <Icons.Settings className={`w-3.5 h-3.5 transition-all duration-300 ${currentView === 'settings' ? 'text-indigo-600 rotate-90 scale-110' : 'text-gray-400 group-hover:rotate-45'}`} />
                            </div>
                        </div>
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col min-h-screen relative w-full">
                {/* Main Content */}
                <main className={`flex-1 overflow-y-auto no-scrollbar p-5 pt-8 md:p-8 w-full max-w-7xl mx-auto ${currentView === 'new_quote' ? 'pb-0' : 'pb-24 md:pb-8'}`}>
                    {children}
                </main>

                {/* Mobile Bottom Navigation (Hidden on Desktop & New Quote) */}
                {currentView !== 'new_quote' && (
                    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-10 safe-area-bottom">
                        <button
                            onClick={() => onViewChange('dashboard')}
                            className={`flex flex-col items-center space-y-1 ${currentView === 'dashboard' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Icons.Home className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Home</span>
                        </button>

                        {(!profile?.role || profile.role === 'admin' || profile.permissions?.quotes) && (
                            <div className="relative -top-6">
                                <button
                                    onClick={onNewQuote}
                                    className="bg-indigo-600 text-white rounded-full p-4 shadow-lg hover:bg-indigo-700 active:scale-95 transition-transform ring-4 ring-gray-50"
                                >
                                    <Icons.Plus className="w-6 h-6" />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => onViewChange('quotes')}
                            className={`flex flex-col items-center space-y-1 ${currentView === 'quotes' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <Icons.FileText className="w-6 h-6" />
                            <span className="text-[10px] font-medium">Quotes</span>
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
};
