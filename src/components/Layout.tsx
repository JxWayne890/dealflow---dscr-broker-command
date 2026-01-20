import React, { useState, useEffect } from 'react';
import { Logo } from './Logo';
import { Icons } from './Icons';
import { Button } from './Button';
import { supabase } from '../lib/supabase';
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

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Check initial theme from localStorage or system preference
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
            setIsDark(true);
        } else {
            document.documentElement.classList.remove('dark');
            setIsDark(false);
        }
    }, []);

    const toggleTheme = () => {
        const newIsDark = !isDark;
        setIsDark(newIsDark);
        if (newIsDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => {
        const isActive = currentView === view || (view === 'campaigns' && currentView === 'campaign_editor');
        return (
            <button
                onClick={() => onViewChange(view)}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 group ${isActive
                    ? 'bg-banana-400/10 text-banana-600 dark:text-banana-400 shadow-[0_0_15px_-3px_rgba(250,204,21,0.15)] border border-banana-400/10'
                    : 'text-muted hover:bg-foreground/5 hover:text-foreground hover:translate-x-1'
                    }`}
            >
                <Icon className={`w-5 h-5 mr-3 transition-colors ${isActive ? 'text-banana-600 dark:text-banana-400' : 'text-muted group-hover:text-foreground'}`} />
                {label}
            </button>
        );
    };

    return (
        <div className="h-screen bg-background text-foreground font-sans selection:bg-banana-500/30 flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside className="hidden md:flex flex-col w-72 bg-surface/60 backdrop-blur-2xl border-r border-border/10 h-full flex-shrink-0 shadow-2xl z-20">
                <div className="p-8 pb-6 border-b border-border/10 flex justify-center items-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-border/20 to-transparent"></div>
                    <button
                        onClick={() => onViewChange('dashboard')}
                        className="flex justify-center items-center hover:scale-105 transition-transform duration-300 focus:outline-none w-full"
                    >
                        <Logo className="h-10 w-auto" />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto no-scrollbar">
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.dashboard) && (
                        <NavItem view="dashboard" icon={Icons.Home} label="Dashboard" />
                    )}
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.quotes) && (
                        <NavItem view="quotes" icon={Icons.FileText} label="Quotes" />
                    )}
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.investors) && (
                        <NavItem view="investors" icon={Icons.Users} label="Investors" />
                    )}
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.campaigns) && (
                        <NavItem view="campaigns" icon={Icons.Mail} label="Campaigns" />
                    )}
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.analytics) && (
                        <NavItem view="analytics" icon={Icons.TrendingUp} label="Analytics" />
                    )}
                </nav>

                <div className="p-6 border-t border-border/10 flex flex-col gap-4 bg-gradient-to-t from-surface/50 to-transparent">
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.quotes) && (
                        <Button
                            onClick={onNewQuote}
                            className="w-full justify-center shadow-lg shadow-banana-400/20 bg-banana-400 text-slate-900 font-bold hover:bg-banana-500 border-none transition-all hover:scale-[1.02]"
                            icon={Icons.Plus}
                        >
                            New Quote
                        </Button>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() => onViewChange('settings')}
                            className={`flex-1 group flex items-center gap-3 p-3 rounded-2xl transition-all duration-300 border border-transparent hover:bg-foreground/5 hover:border-border/10 ${currentView === 'settings' ? 'bg-foreground/5 border-border/10' : ''
                                }`}
                        >
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold border transition-all duration-300 ${currentView === 'settings'
                                ? 'bg-banana-400 text-slate-900 border-banana-500 shadow-lg shadow-banana-400/20'
                                : 'bg-surfaceHighlight text-muted border-border/10 group-hover:border-border/20 group-hover:text-foreground'
                                }`}>
                                {initials}
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className={`text-sm font-semibold truncate transition-colors ${currentView === 'settings' ? 'text-foreground' : 'text-muted group-hover:text-foreground'}`}>
                                    {profile?.name || 'Loading...'}
                                </p>
                                <div className="flex items-center justify-between gap-1">
                                    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider truncate group-hover:text-slate-400 transition-colors">
                                        {profile?.title || 'Broker'}
                                    </p>
                                    <Icons.Settings className={`w-3.5 h-3.5 transition-all duration-500 ${currentView === 'settings' ? 'text-banana-400 rotate-90' : 'text-muted group-hover:text-muted/80 group-hover:rotate-45'}`} />
                                </div>
                            </div>
                        </button>

                        <button
                            onClick={toggleTheme}
                            className="p-3 rounded-2xl border border-transparent hover:bg-foreground/5 hover:border-border/10 flex items-center justify-center transition-all group"
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDark ? (
                                <Icons.Sun className="w-5 h-5 text-banana-400 group-hover:text-banana-300 transition-colors" />
                            ) : (
                                <Icons.Moon className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
                            )}
                        </button>
                        <button
                            onClick={handleLogout}
                            className="p-3 rounded-2xl border border-transparent hover:bg-red-500/10 hover:border-red-500/20 flex items-center justify-center transition-all group"
                            title="Log Out"
                        >
                            <Icons.LogOut className="w-5 h-5 text-muted group-hover:text-red-500 transition-colors" />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className="flex-1 flex flex-col h-full relative w-full overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-banana-500/5 rounded-full blur-[100px] pointer-events-none"></div>

                {/* Main Content */}
                <main className={`flex-1 overflow-y-auto no-scrollbar p-5 pt-8 md:p-10 w-full max-w-7xl mx-auto relative z-10 ${currentView === 'new_quote' ? 'pb-0' : 'pb-28 md:pb-10'}`}>
                    {children}
                </main>

                {/* Mobile Bottom Navigation */}
                {currentView !== 'new_quote' && (
                    <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-surface/80 backdrop-blur-xl border border-border/10 rounded-2xl px-6 py-4 flex justify-between items-center z-50 shadow-2xl shadow-black/20">
                        <button
                            onClick={() => onViewChange('dashboard')}
                            className={`flex flex-col items-center space-y-1 transition-colors ${currentView === 'dashboard' ? 'text-banana-600 dark:text-banana-400' : 'text-muted'}`}
                        >
                            <Icons.Home className="w-6 h-6" />
                        </button>

                        {(!profile?.role || profile.role === 'admin' || profile.permissions?.quotes) && (
                            <div className="relative -top-8">
                                <button
                                    onClick={onNewQuote}
                                    className="bg-banana-400 text-slate-900 rounded-2xl p-4 shadow-xl shadow-banana-400/30 hover:bg-banana-500 active:scale-95 transition-all ring-4 ring-background"
                                >
                                    <Icons.Plus className="w-7 h-7" />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => onViewChange('quotes')}
                            className={`flex flex-col items-center space-y-1 transition-colors ${currentView === 'quotes' ? 'text-banana-600 dark:text-banana-400' : 'text-muted'}`}
                        >
                            <Icons.FileText className="w-6 h-6" />
                        </button>

                        <button
                            onClick={toggleTheme}
                            className={`flex flex-col items-center space-y-1 transition-colors text-muted`}
                            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                        >
                            {isDark ? (
                                <Icons.Sun className="w-6 h-6 text-banana-400" />
                            ) : (
                                <Icons.Moon className="w-6 h-6" />
                            )}
                        </button>
                    </nav>
                )}
            </div>
        </div>
    );
};
