import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { AuthModal } from '../components/AuthModal';

export const Login = () => {
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

    const openAuth = (mode: 'signin' | 'signup') => {
        setAuthMode(mode);
        setAuthOpen(true);
    };

    const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: string }) => (
        <div className={`p-8 rounded-3xl bg-slate-900/40 border border-white/5 backdrop-blur-md hover:bg-slate-800/40 hover:border-white/10 transition-all duration-500 group animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards ${delay}`}>
            <div className="w-12 h-12 bg-banana-400/10 rounded-2xl flex items-center justify-center mb-6 border border-banana-400/20 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-banana-400/5">
                <Icon className="w-6 h-6 text-banana-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
            <p className="text-slate-400 leading-relaxed text-sm">
                {description}
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-foreground font-sans relative selection:bg-banana-500/30">
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[1000px] bg-indigo-600/10 rounded-full blur-[150px] opacity-40 mix-blend-screen" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-banana-500/5 rounded-full blur-[150px] opacity-30 mix-blend-screen" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 px-6 py-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-banana-400 to-banana-500 rounded-xl flex items-center justify-center shadow-lg shadow-banana-400/20">
                        <Icons.TrendingUp className="w-6 h-6 text-slate-900" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-tight hidden sm:block">The OfferHero</span>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => openAuth('signin')}
                        className="text-slate-300 hover:text-white font-medium text-sm transition-colors py-2 px-4"
                    >
                        Sign In
                    </button>
                    <button
                        onClick={() => openAuth('signup')}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-md"
                    >
                        Get Started
                    </button>
                </div>
            </nav>

            <main className="relative z-10 px-6 pb-24">

                {/* Hero Section */}
                <div className="max-w-4xl mx-auto text-center pt-20 pb-32">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-banana-400/10 border border-banana-400/20 text-banana-400 text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <Icons.Sparkles className="w-4 h-4" />
                        <span>Now with Automated Loan Scenarios</span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl font-extrabold text-white tracking-tight mb-8 leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
                        The Mortgage Broker's <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-banana-200 via-banana-400 to-amber-200">
                            Unfair Advantage
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                        Command your pipeline, automate your outreach, and create stunning quotes in seconds. The all-in-one platform built for top producers.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
                        <Button
                            onClick={() => openAuth('signup')}
                            className="h-14 px-8 text-lg bg-banana-400 hover:bg-banana-500 text-slate-900 font-bold rounded-2xl shadow-[0_0_40px_-10px_rgba(250,204,21,0.4)] hover:shadow-[0_0_60px_-10px_rgba(250,204,21,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all w-full sm:w-auto"
                        >
                            Start Free Trial
                            <Icons.ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <button className="h-14 px-8 text-lg text-white border border-white/10 hover:bg-white/5 rounded-2xl font-semibold backdrop-blur-sm transition-all w-full sm:w-auto">
                            View Demo
                        </button>
                    </div>

                    {/* Social Proof / Trusted By */}
                    <div className="mt-20 pt-10 border-t border-white/5 animate-in fade-in duration-1000 delay-500">
                        <p className="text-slate-500 text-sm font-medium uppercase tracking-widest mb-8">Trusted by elite brokers at</p>
                        <div className="flex flex-wrap justify-center gap-12 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                            {/* Placeholder Logos */}
                            <div className="h-8 w-24 bg-white/20 rounded"></div>
                            <div className="h-8 w-24 bg-white/20 rounded"></div>
                            <div className="h-8 w-24 bg-white/20 rounded"></div>
                            <div className="h-8 w-24 bg-white/20 rounded"></div>
                        </div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <FeatureCard
                            icon={Icons.Zap}
                            title="Automated Nurture"
                            description="Never let a lead go cold. Set up intelligent, multi-step email sequences that nurture your prospects while you sleep."
                            delay="delay-100"
                        />
                        <FeatureCard
                            icon={Icons.FileText}
                            title="Instant Quotes"
                            description="Generate beautiful, branded loan scenarios in seconds. Impress agents and borrowers with professional PDF tear sheets."
                            delay="delay-200"
                        />
                        <FeatureCard
                            icon={Icons.PieChart}
                            title="Pipeline Command"
                            description="Visual drag-and-drop pipeline management. Track every deal stage, set tasks, and forecast your commissions with precision."
                            delay="delay-300"
                        />
                    </div>
                </div>

            </main>

            {/* Dashboard Preview Section */}
            <section className="relative py-24 bg-slate-950">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Text Content */}
                        <div className="flex-1 space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium">
                                <Icons.PieChart className="w-4 h-4" />
                                <span>Mission Control</span>
                            </div>

                            <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                                Your Entire Business <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                                    At A Glance
                                </span>
                            </h2>

                            <p className="text-lg text-slate-400 leading-relaxed">
                                No more spreadsheets. The Dashboard gives you a real-time pulse on your deal flow, commissions, and follow-ups.
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                                        <Icons.TrendingUp className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Financial Clarity</h3>
                                        <p className="text-slate-400 text-sm mt-1">
                                            Instantly see your Active Volume, Projected Fees, and Win Rate. Know exactly where your revenue stands.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 shrink-0">
                                        <Icons.Clock className="w-6 h-6 text-cyan-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-bold text-lg">Never Miss a Follow-up</h3>
                                        <p className="text-slate-400 text-sm mt-1">
                                            The system tracks every deal's status and reminds you when to take action.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-700"></div>
                            <img
                                src="/dashboard-preview.png"
                                alt="Dashboard Preview"
                                className="relative rounded-2xl shadow-2xl border border-white/10 w-full transform group-hover:scale-[1.02] transition-transform duration-700"
                            />
                        </div>
                    </div>
                </div>
            </section>


            {/* Quotes & Automation Deep Dive */}
            <section className="relative py-24 bg-slate-900 overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 space-y-32">

                    {/* Part 1: The Pipeline Command */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
                                <Icons.List className="w-4 h-4" />
                                <span>Total Visibility</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                                Visual Pipeline Command
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                See your entire book of business at a glance. Filter by active deals, drafts, or won opportunities. No more digging through emails to find that one quote.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <Icons.Check className="w-5 h-5 text-emerald-500 mt-1" />
                                    <span className="text-slate-300">Instant status tracking (Active, Draft, Won)</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <Icons.Check className="w-5 h-5 text-emerald-500 mt-1" />
                                    <span className="text-slate-300">Quick-access contact details for every investor</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-4 bg-emerald-500/20 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <img
                                src="/quotes-list-preview.png"
                                alt="Quotes List View"
                                className="relative rounded-xl shadow-2xl border border-white/10 w-full transform group-hover:-translate-y-2 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Part 2: The Heart of the App */}
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-banana-500/10 border border-banana-500/20 text-banana-400 text-sm font-medium">
                                <Icons.Zap className="w-4 h-4" />
                                <span>Automation Engine</span>
                            </div>
                            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight">
                                The Heart of Your Deal Flow
                            </h2>
                            <p className="text-lg text-slate-400 leading-relaxed">
                                This isn't just a quote. It's an automated closing machine. Generate complex scenarios in seconds and let the system handle the follow-up.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <Icons.Wand2 className="w-6 h-6 text-banana-400 mb-3" />
                                    <h4 className="font-bold text-white mb-1">Instant Generation</h4>
                                    <p className="text-sm text-slate-400">Create professional PDF tear sheets with one click.</p>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <Icons.Send className="w-6 h-6 text-banana-400 mb-3" />
                                    <h4 className="font-bold text-white mb-1">Auto-Enrollment</h4>
                                    <p className="text-sm text-slate-400">One button to start a multi-step email nurture campaign.</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-4 bg-banana-500/20 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <img
                                src="/quote-detail-preview.png"
                                alt="Quote Detail View"
                                className="relative rounded-xl shadow-2xl border border-white/10 w-full transform group-hover:-translate-y-2 transition-transform duration-500"
                            />
                        </div>
                    </div>

                </div>
            </section>


            <footer className="relative z-10 border-t border-white/5 py-12 mt-20 bg-slate-950/50 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2 opacity-50">
                        <Icons.TrendingUp className="w-5 h-5" />
                        <span className="font-bold">The OfferHero</span>
                    </div>
                    <div className="text-slate-500 text-sm">
                        © {new Date().getFullYear()} All rights reserved.
                    </div>
                </div>
            </footer>

            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
                defaultMode={authMode}
            />
        </div>
    );
};
