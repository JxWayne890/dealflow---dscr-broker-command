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
    isDark: boolean;
    toggleTheme: () => void;
}

export const Layout = ({ children, currentView, onViewChange, onNewQuote, profile, isDark, toggleTheme }: LayoutProps) => {
    const initials = profile?.name
        ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase()
        : '??';

    const [isCollapsed, setIsCollapsed] = useState(false);

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    const NavItem = ({ view, icon: Icon, label, color = 'banana' }: { view: View, icon: any, label: string, color?: string }) => {
        const isActive = currentView === view || (view === 'campaigns' && currentView === 'campaign_editor');

        const activeStyles = {
            banana: 'bg-banana-400/10 text-banana-600 dark:text-banana-400 shadow-[0_0_15px_-3px_rgba(250,204,21,0.15)] border-banana-400/20',
            indigo: 'bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 shadow-[0_0_15px_-3px_rgba(129,140,248,0.15)] border-indigo-400/20',
            emerald: 'bg-emerald-400/10 text-emerald-600 dark:text-emerald-400 shadow-[0_0_15px_-3px_rgba(52,211,153,0.15)] border-emerald-400/20'
        }[color] || 'bg-banana-400/10 text-banana-600 dark:text-banana-400 shadow-[0_0_15px_-3px_rgba(250,204,21,0.15)] border-banana-400/20';

        const iconActiveStyles = {
            banana: 'text-banana-600 dark:text-banana-400',
            indigo: 'text-indigo-600 dark:text-indigo-400',
            emerald: 'text-emerald-600 dark:text-emerald-400'
        }[color] || 'text-banana-600 dark:text-banana-400';

        return (
            <button
                onClick={() => onViewChange(view)}
                className={`w-full flex items-center px-4 py-3 text-sm font-semibold rounded-2xl transition-all duration-300 group relative border border-transparent ${isActive
                    ? `${activeStyles}`
                    : 'text-muted hover:bg-foreground/5 hover:text-foreground hover:translate-x-1'
                    } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? label : undefined}
            >
                {isActive && !isCollapsed && (
                    <div className={`absolute left-0 w-1 h-5 rounded-full ${color === 'banana' ? 'bg-banana-400' : color === 'indigo' ? 'bg-indigo-400' : 'bg-emerald-400'} shadow-[0_0_8px_rgba(250,204,21,0.5)]`} />
                )}
                <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? iconActiveStyles : 'text-muted group-hover:text-foreground group-hover:scale-110'} ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && <span className="truncate tracking-tight">{label}</span>}
                {isActive && !isCollapsed && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-current opacity-40 animate-pulse" />
                )}
            </button>
        );
    };

    const NavSection = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <div className="space-y-1 mb-6">
            {!isCollapsed && (
                <div className="px-4 mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-[0.2em] text-muted-foreground/40 uppercase">
                        {title}
                    </span>
                    <div className="h-[1px] flex-1 ml-3 bg-gradient-to-r from-border/10 to-transparent"></div>
                </div>
            )}
            {children}
        </div>
    );

    return (
        <div className="h-screen bg-background text-foreground font-sans selection:bg-banana-500/30 flex overflow-hidden">
            {/* Desktop Sidebar */}
            <aside
                className={`hidden md:flex flex-col bg-surface/40 backdrop-blur-3xl border-r border-border/5 h-full flex-shrink-0 shadow-[20px_0_50px_-20px_rgba(0,0,0,0.1)] z-20 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] relative ${isCollapsed ? 'w-24' : 'w-72'}`}
            >
                {/* Visual Accent */}
                <div className={`absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-banana-400/10 to-transparent opacity-50`}></div>

                {/* Collapse Toggle Button - Re-styled for premium feel */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-4 top-10 bg-surface border border-border/10 rounded-full w-8 h-8 flex items-center justify-center shadow-xl text-muted hover:text-banana-400 hover:scale-110 transition-all z-50 group"
                >
                    <Icons.ChevronLeft className={`w-4 h-4 transition-transform duration-500 ${isCollapsed ? 'rotate-180' : ''} group-hover:scale-125`} />
                </button>

                <div className={`p-6 flex justify-center items-center relative overflow-hidden transition-all duration-500 ${isCollapsed ? 'h-24' : 'h-28'}`}>
                    <button
                        onClick={() => onViewChange('dashboard')}
                        className="flex justify-center items-center hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none w-full"
                    >
                        <Logo
                            className={`h-auto transition-all duration-500 ${isCollapsed ? 'w-12' : 'w-44 max-w-full drop-shadow-2xl'}`}
                            variant={isCollapsed ? 'icon' : 'full'}
                            isDark={isDark}
                        />
                    </button>
                </div>

                <div className="flex-1 px-4 py-4 space-y-2 overflow-y-auto no-scrollbar scroll-smooth">
                    <NavSection title="Core Focus">
                        {(!profile?.role || profile.role === 'admin' || profile.permissions?.dashboard) && (
                            <NavItem view="dashboard" icon={Icons.Home} label="Dashboard" color="banana" />
                        )}
                        {(!profile?.role || profile.role === 'admin' || profile.permissions?.quotes) && (
                            <NavItem view="quotes" icon={Icons.FileText} label="Quotes" color="indigo" />
                        )}
                        {(!profile?.role || profile.role === 'admin' || profile.permissions?.investors) && (
                            <NavItem view="investors" icon={Icons.Users} label="Investors" color="emerald" />
                        )}
                    </NavSection>

                    <NavSection title="Growth Engine">
                        {(!profile?.role || profile.role === 'admin' || profile.permissions?.campaigns) && (
                            <NavItem view="campaigns" icon={Icons.Mail} label="Campaigns" color="indigo" />
                        )}
                        {(!profile?.role || profile.role === 'admin' || profile.permissions?.analytics) && (
                            <NavItem view="analytics" icon={Icons.TrendingUp} label="Intelligence" color="emerald" />
                        )}
                    </NavSection>

                </div>

                <div className={`p-4 mt-auto border-t border-border/5 space-y-3 bg-gradient-to-b from-transparent via-surface/30 to-surface/60 transition-all duration-300 ${isCollapsed ? 'items-center px-4' : ''}`}>
                    {(!profile?.role || profile.role === 'admin' || profile.permissions?.quotes) && (
                        <div className="px-2">
                            <Button
                                onClick={onNewQuote}
                                className={`h-12 shadow-[0_0_20px_rgba(250,204,21,0.2)] bg-banana-400 text-slate-950 font-bold rounded-2xl hover:bg-banana-500 border-none transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 ${isCollapsed ? 'w-12 h-12 p-0 rounded-2xl justify-center' : 'w-full justify-center text-sm'}`}
                            >
                                <Icons.Plus className="w-5 h-5" />
                                {!isCollapsed && <span>New Quote</span>}
                            </Button>
                        </div>
                    )}

                    <div className={`flex flex-col gap-2 ${isCollapsed ? 'w-full' : ''}`}>
                        <div className="flex items-center gap-2 px-2">
                            <button
                                onClick={() => onViewChange('settings')}
                                className={`flex-1 group flex items-center gap-3 p-2 rounded-2xl transition-all duration-300 border border-transparent hover:bg-foreground/5 hover:border-border/5 ${currentView === 'settings' ? 'bg-foreground/5 border-border/5' : ''
                                    } ${isCollapsed ? 'justify-center' : ''}`}
                                title={isCollapsed ? "Profile Settings" : undefined}
                            >
                                <div className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-bold border transition-all duration-300 ${currentView === 'settings'
                                    ? 'bg-gradient-to-br from-banana-300 to-banana-500 text-slate-950 border-banana-400 shadow-[0_4px_12px_rgba(250,204,21,0.3)]'
                                    : 'bg-surfaceHighlight text-muted border-border/5 group-hover:border-border/10 group-hover:text-foreground'
                                    }`}>
                                    {initials}
                                </div>
                                {!isCollapsed && (
                                    <div className="flex-1 text-left min-w-0">
                                        <p className={`text-xs font-bold truncate transition-colors ${currentView === 'settings' ? 'text-foreground' : 'text-muted group-hover:text-foreground'}`}>
                                            {profile?.name || 'Account'}
                                        </p>
                                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter truncate opacity-70">
                                            {profile?.title || 'Elite Producer'}
                                        </p>
                                    </div>
                                )}
                            </button>

                            {!isCollapsed && (
                                <button
                                    onClick={toggleTheme}
                                    className={`p-2.5 rounded-xl border border-transparent hover:bg-foreground/5 hover:border-border/5 flex items-center justify-center transition-all group shrink-0 shadow-sm`}
                                    title={isDark ? "Light Mode" : "Dark Mode"}
                                >
                                    {isDark ? (
                                        <Icons.Sun className="w-4 h-4 text-banana-400 group-hover:text-banana-300 transition-colors" />
                                    ) : (
                                        <Icons.Moon className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
                                    )}
                                </button>
                            )}
                        </div>

                        {isCollapsed && (
                            <button
                                onClick={toggleTheme}
                                className={`w-10 h-10 mx-auto rounded-xl border border-transparent hover:bg-foreground/5 hover:border-border/10 flex items-center justify-center transition-all group shadow-sm`}
                                title={isDark ? "Light Mode" : "Dark Mode"}
                            >
                                {isDark ? (
                                    <Icons.Sun className="w-5 h-5 text-banana-400 group-hover:text-banana-300 transition-colors" />
                                ) : (
                                    <Icons.Moon className="w-5 h-5 text-muted group-hover:text-foreground transition-colors" />
                                )}
                            </button>
                        )}
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
                    <nav className="md:hidden fixed bottom-6 left-4 right-4 h-[72px] bg-surface/80 backdrop-blur-xl border border-border/10 rounded-2xl px-2 flex justify-around items-center z-50 shadow-2xl shadow-black/20">
                        <button
                            onClick={() => onViewChange('dashboard')}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-banana-400/10 text-banana-600 dark:text-banana-400' : 'text-muted sm:hover:text-foreground'}`}
                        >
                            <Icons.Home className="w-6 h-6" />
                        </button>

                        <button
                            onClick={() => onViewChange('quotes')}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${currentView === 'quotes' ? 'bg-banana-400/10 text-banana-600 dark:text-banana-400' : 'text-muted sm:hover:text-foreground'}`}
                        >
                            <Icons.FileText className="w-6 h-6" />
                        </button>

                        {(!profile?.role || profile.role === 'admin' || profile.permissions?.quotes) && (
                            <div className="relative -top-6">
                                <button
                                    onClick={onNewQuote}
                                    className="w-16 h-16 bg-banana-400 text-slate-900 rounded-full flex items-center justify-center shadow-xl shadow-banana-400/40 hover:bg-banana-500 active:scale-95 transition-all ring-4 ring-background"
                                >
                                    <Icons.Plus className="w-8 h-8" />
                                </button>
                            </div>
                        )}

                        <button
                            onClick={() => onViewChange('investors')}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all ${currentView === 'investors' ? 'bg-banana-400/10 text-banana-600 dark:text-banana-400' : 'text-muted sm:hover:text-foreground'}`}
                        >
                            <Icons.Users className="w-6 h-6" />
                        </button>

                        <button
                            onClick={toggleTheme}
                            className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl transition-all text-muted sm:hover:text-foreground`}
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
