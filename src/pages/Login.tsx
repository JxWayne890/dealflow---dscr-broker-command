import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';
import { AuthModal } from '../components/AuthModal';

export const Login = () => {
    const [authOpen, setAuthOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
    const [activeSlide, setActiveSlide] = useState(0); // For Campaign Carousel
    const [activeManagementSlide, setActiveManagementSlide] = useState(0); // For Management Carousel
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);

    const handleSubscribe = async () => {
        setIsSubscribing(true);
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                alert('Checkout failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Subscription error:', error);
            alert('Could not connect to payment server. Please try again later.');
        } finally {
            setIsSubscribing(false);
        }
    };

    const campaignSlides = [
        "/campaign-step-1.png",
        "/campaign-step-2.png",
        "/campaign-step-3.png"
    ];

    const managementSlides = [
        "/campaign-sequence-steps.png",
        "/campaign-enrolled-leads.png",
        "/campaign-settings.png"
    ];

    const openAuth = (mode: 'signin' | 'signup') => {
        setAuthMode(mode);
        setAuthOpen(true);
    };

    const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: any, title: string, description: string, delay: string }) => (
        <div className={`p-8 rounded-3xl ${isDarkMode ? 'bg-slate-900/40 border-white/5 hover:bg-slate-800/40 hover:border-white/10' : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-banana-400/30 shadow-sm'} border backdrop-blur-md transition-all duration-500 group animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards ${delay}`}>
            <div className={`w-12 h-12 ${isDarkMode ? 'bg-banana-400/10 border-banana-400/20' : 'bg-banana-400/10 border-banana-400/10'} rounded-2xl flex items-center justify-center mb-6 border group-hover:scale-110 transition-transform duration-500 shadow-lg ${isDarkMode ? 'shadow-banana-400/5' : 'shadow-banana-400/10'}`}>
                <Icon className="w-6 h-6 text-banana-400" />
            </div>
            <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-3`}>{title}</h3>
            <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed text-sm`}>
                {description}
            </p>
        </div>
    );

    return (
        <div className={`min-h-screen ${isDarkMode ? 'bg-slate-950' : 'bg-zinc-50'} text-foreground font-sans relative selection:bg-banana-500/30 transition-colors duration-500`}>
            {/* Background Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                {/* Main Brand Glows */}
                <div className={`absolute top-[-10%] left-[-10%] w-[800px] h-[800px] ${isDarkMode ? 'bg-banana-500/10' : 'bg-banana-400/10'} rounded-full blur-[120px] opacity-40 mix-blend-screen animate-pulse duration-[10s]`} />
                <div className={`absolute top-[10%] right-[-5%] w-[600px] h-[600px] ${isDarkMode ? 'bg-banana-400/5' : 'bg-banana-400/5'} rounded-full blur-[100px] opacity-30 mix-blend-screen`} />
                <div className={`absolute bottom-[-10%] left-[20%] w-[900px] h-[900px] ${isDarkMode ? 'bg-slate-900/50' : 'bg-banana-400/5'} rounded-full blur-[150px] opacity-40`} />

                {/* Decorative Grid/Noise */}
                <div className={`absolute inset-0 ${isDarkMode ? 'bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)]' : 'bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)]'} bg-[size:40px_40px]`}></div>
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.05] brightness-75 contrast-125 mix-blend-overlay"></div>
            </div>

            {/* Navigation */}
            <nav className="relative z-50 px-6 py-6 md:px-12 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-banana-400 to-banana-500 rounded-xl flex items-center justify-center shadow-lg shadow-banana-400/20">
                        <Icons.TrendingUp className="w-6 h-6 text-slate-900" />
                    </div>
                    <span className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-950'} tracking-tight hidden sm:block`}>The OfferHero</span>
                </div>
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`p-2 rounded-xl border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-banana-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
                        aria-label="Toggle Theme"
                    >
                        {isDarkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                        className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} hover:text-banana-400 font-medium text-sm transition-colors hidden md:block`}
                    >
                        Pricing
                    </button>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => openAuth('signin')}
                            className={`${isDarkMode ? 'text-slate-300' : 'text-slate-600'} hover:${isDarkMode ? 'text-white' : 'text-slate-900'} font-medium text-sm transition-colors py-2 px-4`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => openAuth('signup')}
                            className={`${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' : 'bg-slate-950 hover:bg-slate-800 text-white border-transparent'} border px-5 py-2.5 rounded-xl text-sm font-semibold transition-all backdrop-blur-md`}
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            <main className="relative z-10 px-6 pb-24">

                {/* Hero Section */}
                <div className="max-w-5xl mx-auto text-center pt-24 pb-40 relative">
                    <div className="flex flex-col items-center mb-10">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black tracking-[0.3em] uppercase text-banana-400/80">
                                The Next Generation of Loan Software
                            </span>
                        </div>
                    </div>

                    <h1 className={`text-6xl sm:text-8xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tighter mb-10 leading-[0.95]`}>
                        The Mortgage <br className="hidden md:block" />
                        Broker's <br className="hidden md:block" />
                        <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-banana-300 via-banana-400 to-banana-300 pb-2">
                            Unfair Advantage
                        </span>
                    </h1>

                    <p className={`text-xl sm:text-2xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto leading-relaxed mb-14 font-medium`}>
                        Command your entire pipeline, automate high-touch outreach, and close deals faster. Built exclusively for elite producers.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <Button
                            onClick={() => openAuth('signup')}
                            className={`h-16 px-10 text-xl bg-banana-400 hover:bg-banana-500 text-slate-950 font-black rounded-2xl shadow-[0_0_50px_-10px_rgba(250,204,21,0.5)] hover:shadow-[0_0_80px_-10px_rgba(250,204,21,0.7)] hover:scale-[1.05] active:scale-[0.95] transition-all w-full sm:w-auto border-none`}
                        >
                            Get Started Free
                            <Icons.ArrowRight className="w-6 h-6 ml-2" />
                        </Button>
                        <button className={`h-16 px-10 text-xl ${isDarkMode ? 'text-white border-white/10 hover:bg-white/5' : 'text-slate-900 border-slate-200 hover:bg-slate-50'} border rounded-2xl font-bold backdrop-blur-md transition-all w-full sm:w-auto group`}>
                            <span className="flex items-center gap-2">
                                <span className={`w-8 h-8 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <Icons.PieChart className="w-4 h-4 text-banana-400" />
                                </span>
                                View Platform Demo
                            </span>
                        </button>
                    </div>

                    {/* Visual Decorative Element at bottom of hero */}
                    <div className="mt-32 relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
                    </div>
                </div>

                {/* Features Section */}
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            <section className={`relative py-32 ${isDarkMode ? 'bg-slate-950' : 'bg-white border-y border-slate-100'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        {/* Text Content */}
                        <div className="flex-1 space-y-8">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-banana-400/10 border border-banana-400/20 text-banana-400 text-sm font-medium">
                                <Icons.PieChart className="w-4 h-4" />
                                <span>Mission Control</span>
                            </div>

                            <h2 className={`text-4xl md:text-5xl font-extrabold ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-tight leading-tight`}>
                                Your Entire Business <br />
                                <span className={`inline-block text-transparent bg-clip-text bg-gradient-to-r ${isDarkMode ? 'from-banana-200 to-banana-400' : 'from-banana-600 to-banana-400'}`}>
                                    At A Glance
                                </span>
                            </h2>

                            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                                No more spreadsheets. The Dashboard gives you a real-time pulse on your deal flow, commissions, and follow-ups.
                            </p>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-banana-500/10 flex items-center justify-center border border-banana-500/20 shrink-0">
                                        <Icons.TrendingUp className="w-6 h-6 text-banana-400" />
                                    </div>
                                    <div>
                                        <h3 className={`${isDarkMode ? 'text-white' : 'text-slate-900'} font-bold text-lg`}>Financial Clarity</h3>
                                        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} text-sm mt-1`}>
                                            Instantly see your Active Volume, Projected Fees, and Win Rate. Know exactly where your revenue stands.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-banana-500/10 flex items-center justify-center border border-banana-500/20 shrink-0">
                                        <Icons.Clock className="w-6 h-6 text-banana-400" />
                                    </div>
                                    <div>
                                        <h3 className={`${isDarkMode ? 'text-white' : 'text-slate-900'} font-bold text-lg`}>Never Miss a Follow-up</h3>
                                        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} text-sm mt-1`}>
                                            The system tracks every deal's status and reminds you when to take action.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Image */}
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-4 bg-banana-500/10 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-700"></div>
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
            <section className={`relative py-24 ${isDarkMode ? 'bg-slate-900' : 'bg-zinc-50'} overflow-hidden`}>
                <div className="max-w-7xl mx-auto px-6 space-y-32">

                    {/* Part 1: The Pipeline Command */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-banana-400/10 border border-banana-400/20 text-banana-400 text-sm font-medium">
                                <Icons.List className="w-4 h-4" />
                                <span>Total Visibility</span>
                            </div>
                            <h2 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} leading-tight`}>
                                Visual Pipeline Command
                            </h2>
                            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                                See your entire book of business at a glance. Filter by active deals, drafts, or won opportunities. No more digging through emails to find that one quote.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-banana-400/10 flex items-center justify-center border border-banana-400/20 shrink-0 mt-0.5">
                                        <Icons.Check className="w-3.5 h-3.5 text-banana-400" />
                                    </div>
                                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Instant status tracking (Active, Draft, Won)</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-banana-400/10 flex items-center justify-center border border-banana-400/20 shrink-0 mt-0.5">
                                        <Icons.Check className="w-3.5 h-3.5 text-banana-400" />
                                    </div>
                                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Quick-access contact details for every investor</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-4 bg-banana-400/5 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
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
                            <h2 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} leading-tight`}>
                                The Heart of Your Deal Flow
                            </h2>
                            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                                This isn't just a quote. It's an automated closing machine. Generate complex scenarios in seconds and let the system handle the follow-up.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <Icons.Wand2 className="w-6 h-6 text-banana-400 mb-3" />
                                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-1`}>Instant Generation</h4>
                                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>Create professional PDF tear sheets with one click.</p>
                                </div>
                                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                                    <Icons.Send className="w-6 h-6 text-banana-400 mb-3" />
                                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-1`}>Auto-Enrollment</h4>
                                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>One button to start a multi-step email nurture campaign.</p>
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

                    {/* Part 3: Investor Management */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-banana-400/10 border border-banana-400/20 text-banana-400 text-sm font-medium">
                                <Icons.Users className="w-4 h-4" />
                                <span>Capital Network</span>
                            </div>
                            <h2 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} leading-tight`}>
                                Manage Your Capital Partners
                            </h2>
                            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                                A centralized directory for all your funding sources. Organize investors, track their preferences, and keep their contact info at your fingertips.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-banana-400/10 flex items-center justify-center border border-banana-400/20 shrink-0 mt-0.5">
                                        <Icons.Check className="w-3.5 h-3.5 text-banana-400" />
                                    </div>
                                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Searchable database of all investors</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-banana-400/10 flex items-center justify-center border border-banana-400/20 shrink-0 mt-0.5">
                                        <Icons.Check className="w-3.5 h-3.5 text-banana-400" />
                                    </div>
                                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>One-click editing and management</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-4 bg-banana-400/5 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <img
                                src="/investors-list.png"
                                alt="Investors List View"
                                className="relative rounded-xl shadow-2xl border border-white/10 w-full transform group-hover:-translate-y-2 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Part 4: Deep Deal Insights (Modal) */}
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-banana-400/10 border border-banana-400/20 text-banana-400 text-sm font-medium">
                                <Icons.TrendingUp className="w-4 h-4" />
                                <span>Deal History Insight</span>
                            </div>
                            <h2 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} leading-tight`}>
                                Every Deal, One View
                            </h2>
                            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                                Click on any investor to instantly expand their full deal history. See exactly which loans they've funded, active opportunities, and total volume.
                            </p>
                            <div className="grid grid-cols-1 gap-4 pt-4">
                                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} flex items-start gap-4`}>
                                    <div className="p-3 bg-banana-400/10 rounded-xl text-banana-400 border border-banana-400/20">
                                        <Icons.FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-1`}>Detailed Breakdown</h4>
                                        <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed font-medium`}>View Property Address, LTV, Loan Amount, and Status for every single transaction associated with that investor.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-4 bg-banana-400/5 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <img
                                src="/investor-detail.png"
                                alt="Investor Detail Modal"
                                className="relative rounded-xl shadow-2xl border border-white/10 w-full transform group-hover:-translate-y-2 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Part 5: Campaign Management */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-banana-400/10 border border-banana-400/20 text-banana-400 text-sm font-medium">
                                <Icons.Mail className="w-4 h-4" />
                                <span>Smart Campaigns</span>
                            </div>
                            <h2 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} leading-tight`}>
                                Automated Outreach at Scale
                            </h2>
                            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                                Don't just send one email. Build entire journeys. Our campaign manager lets you create sophisticated drip sequences that nurture leads automatically.
                            </p>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-banana-400/10 flex items-center justify-center border border-banana-400/20 shrink-0 mt-0.5">
                                        <Icons.Check className="w-3.5 h-3.5 text-banana-400" />
                                    </div>
                                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Pre-built templates for Cold Revival, New Deals, and holidays</span>
                                </li>
                                <li className="flex items-start gap-4">
                                    <div className="w-6 h-6 rounded-full bg-banana-400/10 flex items-center justify-center border border-banana-400/20 shrink-0 mt-0.5">
                                        <Icons.Check className="w-3.5 h-3.5 text-banana-400" />
                                    </div>
                                    <span className={isDarkMode ? 'text-slate-300' : 'text-slate-700'}>Real-time engagement tracking (Sent, Open, Click)</span>
                                </li>
                            </ul>
                        </div>
                        <div className="flex-1 relative group">
                            <div className="absolute -inset-4 bg-banana-400/5 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
                            <img
                                src="/campaigns-list.png"
                                alt="Campaigns Overview"
                                className="relative rounded-xl shadow-2xl border border-white/10 w-full transform group-hover:-translate-y-2 transition-transform duration-500"
                            />
                        </div>
                    </div>

                    {/* Part 6: Sequence Editor Carousel */}
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-banana-400/10 border border-banana-400/20 text-banana-400 text-sm font-medium">
                                <Icons.Zap className="w-4 h-4" />
                                <span>Total Control</span>
                            </div>
                            <h2 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} leading-tight`}>
                                Craft the Perfect Message
                            </h2>
                            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                                Our Sequence Editor gives you granular control over every touchpoint. Add as many steps as you need, set precise delays, and personalize instantly.
                            </p>
                            <div className="space-y-4">
                                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} group/card hover:bg-white/[0.07] transition-all`}>
                                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-2 flex items-center gap-2`}>
                                        <div className="p-1.5 bg-banana-400/10 rounded-lg text-banana-400">
                                            <Icons.MousePointer className="w-4 h-4" />
                                        </div>
                                        Drag-and-Drop Personalization
                                    </h4>
                                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                                        Insert dynamic fields like <span className="text-banana-400 font-mono text-xs bg-banana-400/10 px-1.5 py-0.5 rounded-md mx-1 border border-banana-400/20">NAME</span> or <span className="text-banana-400 font-mono text-xs bg-banana-400/10 px-1.5 py-0.5 rounded-md mx-1 border border-banana-400/20">ADDRESS</span> just by dragging them into your email.
                                    </p>
                                </div>
                                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'} group/card hover:bg-white/[0.07] transition-all`}>
                                    <h4 className={`font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-2 flex items-center gap-2`}>
                                        <div className="p-1.5 bg-banana-400/10 rounded-lg text-banana-400">
                                            <Icons.Clock className="w-4 h-4" />
                                        </div>
                                        Intelligent Timing
                                    </h4>
                                    <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                                        "Wait 3 days, then send." Set the cadence that works best for your clients.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Carousel: Sequence Editor */}
                        <div className="flex-1 relative group w-full">
                            {/* Outer Glow */}
                            <div className="absolute -inset-16 bg-banana-400/5 rounded-[4rem] blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                            <div className="relative">
                                {campaignSlides.map((slide, index) => (
                                    <img
                                        key={index}
                                        src={slide}
                                        alt={`Campaign Box Step ${index + 1}`}
                                        className={`w-full rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.7)] border border-white/10 transition-all duration-700 ease-in-out ${activeSlide === index
                                            ? 'relative opacity-100 scale-100'
                                            : 'absolute top-0 left-0 opacity-0 scale-95 pointer-events-none'
                                            }`}
                                    />
                                ))}

                                {/* Carousel Controls (Floating) */}
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
                                    <button
                                        onClick={() => setActiveSlide(prev => (prev === 0 ? campaignSlides.length - 1 : prev - 1))}
                                        className={`p-3 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-600'} border hover:bg-banana-400 hover:text-slate-900 transition-all shadow-2xl hover:scale-110 active:scale-95`}
                                    >
                                        <Icons.ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => setActiveSlide(prev => (prev === campaignSlides.length - 1 ? 0 : prev + 1))}
                                        className={`p-3 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-600'} border hover:bg-banana-400 hover:text-slate-900 transition-all shadow-2xl hover:scale-110 active:scale-95`}
                                    >
                                        <Icons.ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Badge (Floating) */}
                                <div className="absolute -top-6 -right-6 z-40">
                                    <div className={`px-5 py-2.5 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-banana-400/30' : 'bg-white border-banana-400/50 shadow-lg'} border text-banana-400 text-sm font-black animate-in slide-in-from-top-4 duration-500`}>
                                        STEP {activeSlide + 1}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Part 7: Campaign Intelligence & Settings */}
                    <div className="flex flex-col lg:flex-row-reverse items-center gap-16 mt-32">
                        <div className="flex-1 space-y-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-banana-400/10 border border-banana-400/20 text-banana-400 text-sm font-medium">
                                <Icons.Settings className="w-4 h-4" />
                                <span>Complete Command</span>
                            </div>
                            <h2 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} leading-tight`}>
                                Run Your Campaigns<br /> Like a Machine
                            </h2>
                            <p className={`text-lg ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} leading-relaxed`}>
                                Manage every aspect of your outreach from one intuitive interface. Monitor active leads, tweak your steps, and fine-tune your schedule.
                            </p>

                            <div className="space-y-6 pt-2">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-banana-400/10 flex items-center justify-center border border-banana-400/20 shrink-0">
                                        <Icons.Users className="w-5 h-5 text-banana-400" />
                                    </div>
                                    <div>
                                        <h3 className={`${isDarkMode ? 'text-white' : 'text-slate-900'} font-bold text-base`}>Enrolled Leads</h3>
                                        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} text-sm mt-1`}>See exactly who is active, completed, or paused. Resume or stop sequences with a click.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-banana-400/10 flex items-center justify-center border border-banana-400/20 shrink-0">
                                        <Icons.Clock className="w-5 h-5 text-banana-400" />
                                    </div>
                                    <div>
                                        <h3 className={`${isDarkMode ? 'text-white' : 'text-slate-900'} font-bold text-base`}>Precision Scheduling</h3>
                                        <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} text-sm mt-1`}>
                                            Control the exact time of day your emails land. Set your preferred send window (e.g., 9:00 AM) and let the system handle the day-delays automatically.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Management Carousel */}
                        <div className="flex-1 relative group w-full">
                            {/* Outer Glow */}
                            <div className="absolute -inset-16 bg-banana-400/5 rounded-[4rem] blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

                            <div className="relative">
                                {managementSlides.map((slide, index) => (
                                    <img
                                        key={index}
                                        src={slide}
                                        alt={`Management View ${index + 1}`}
                                        className={`w-full rounded-[2.5rem] shadow-[0_40px_80px_-15px_rgba(0,0,0,0.7)] border border-white/10 transition-all duration-700 ease-in-out ${activeManagementSlide === index
                                            ? 'relative opacity-100 scale-100'
                                            : 'absolute top-0 left-0 opacity-0 scale-95 pointer-events-none'
                                            }`}
                                    />
                                ))}

                                {/* Carousel Controls (Floating) */}
                                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40">
                                    <button
                                        onClick={() => setActiveManagementSlide(prev => (prev === 0 ? managementSlides.length - 1 : prev - 1))}
                                        className={`p-3 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-600'} border hover:bg-banana-400 hover:text-slate-900 transition-all shadow-2xl hover:scale-110 active:scale-95`}
                                    >
                                        <Icons.ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => setActiveManagementSlide(prev => (prev === managementSlides.length - 1 ? 0 : prev + 1))}
                                        className={`p-3 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-600'} border hover:bg-banana-400 hover:text-slate-900 transition-all shadow-2xl hover:scale-110 active:scale-95`}
                                    >
                                        <Icons.ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Badge (Floating) */}
                                <div className="absolute -top-6 -right-6 z-40">
                                    <div className={`px-5 py-2.5 rounded-2xl ${isDarkMode ? 'bg-slate-900 border-banana-400/30' : 'bg-white border-banana-400/50 shadow-lg'} border text-banana-400 text-sm font-black animate-in slide-in-from-top-4 duration-500`}>
                                        {activeManagementSlide === 0 ? 'STEPS' : activeManagementSlide === 1 ? 'LEADS' : 'SETTINGS'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            {/* Pricing Section */}
            <section id="pricing" className={`relative py-32 ${isDarkMode ? 'bg-slate-900/50' : 'bg-white border-y border-slate-100'}`}>
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-banana-400/10 border border-banana-400/20 text-banana-400 text-sm font-medium mb-6">
                            <Icons.DollarSign className="w-4 h-4" />
                            <span>Fair & Simple</span>
                        </div>
                        <h2 className={`text-4xl md:text-6xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-6 tracking-tight`}>
                            Command Your <span className="text-banana-400">Future</span>
                        </h2>
                        <p className={`text-xl ${isDarkMode ? 'text-slate-400' : 'text-slate-600'} max-w-2xl mx-auto`}>
                            Whether you're a solo producer or building an empire, we have the right foundation for your growth.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                        {/* Elite Producer Tier */}
                        <div className="relative group">
                            <div className="absolute -inset-px bg-gradient-to-b from-banana-400/20 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className={`relative p-8 rounded-[2.5rem] ${isDarkMode ? 'bg-slate-950 border-white/5 shadow-2xl' : 'bg-white border-slate-200 shadow-xl'} border flex flex-col h-full`}>
                                <div className="mb-8">
                                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-2`}>Elite Producer</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-4xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>$250</span>
                                        <span className="text-slate-500 font-medium">/month</span>
                                    </div>
                                    <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mt-4 text-sm leading-relaxed`}>The ultimate toolset for high-volume professionals looking for speed and automation.</p>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {[
                                        "Automated Nurture Campaigns",
                                        "Instant PDF Quote Generation",
                                        "Visual Pipeline Management",
                                        "Advanced Analytics Dashboard",
                                        "Monthly Maintenance Included",
                                        "Instant Cloud Support"
                                    ].map((feature, i) => (
                                        <li key={i} className={`flex items-center gap-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} text-sm`}>
                                            <div className="w-5 h-5 rounded-full bg-banana-400/10 flex items-center justify-center border border-banana-400/20">
                                                <Icons.Check className="w-3 h-3 text-banana-400" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Button
                                    onClick={handleSubscribe}
                                    disabled={isSubscribing}
                                    className="w-full h-14 bg-banana-400 hover:bg-banana-500 text-slate-950 font-black rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubscribing ? 'Connecting...' : 'Subscribe Now'}
                                </Button>
                            </div>
                        </div>

                        {/* Private Ownership Tier */}
                        <div className="relative group">
                            <div className="absolute -inset-px bg-gradient-to-b from-white/10 to-transparent rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className={`relative p-8 rounded-[2.5rem] ${isDarkMode ? 'bg-slate-900/40 border-white/10 shadow-2xl backdrop-blur-xl' : 'bg-slate-50 border-slate-200 shadow-lg'} border flex flex-col h-full`}>
                                <div className="mb-8">
                                    <div className={`inline-block px-3 py-1 rounded-lg ${isDarkMode ? 'bg-white/5 border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-600'} text-[10px] font-black tracking-widest uppercase mb-3`}>Personal License</div>
                                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-2`}>Private Ownership</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-3xl font-black ${isDarkMode ? 'text-white' : 'text-slate-900'} tracking-widest uppercase italic`}>Contact Us</span>
                                    </div>
                                    <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mt-4 text-sm leading-relaxed`}>Own the entire source code for your personal use. Run it on your own private infrastructure.</p>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {[
                                        "Full Source Code Access",
                                        "Custom Domain Integration",
                                        "Private Database Control",
                                        "No Resale Rights Allowed",
                                        "Self-Managed Setup",
                                        "Direct Core Updates"
                                    ].map((feature, i) => (
                                        <li key={i} className={`flex items-center gap-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} text-sm`}>
                                            <div className={`w-5 h-5 rounded-full ${isDarkMode ? 'bg-white/10 border-white/20' : 'bg-slate-200 border-slate-300'} flex items-center justify-center`}>
                                                <Icons.Check className={`w-3 h-3 ${isDarkMode ? 'text-white' : 'text-slate-600'}`} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`w-full h-14 ${isDarkMode ? 'bg-white/10 hover:bg-white/20 text-white border-white/10' : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-200'} border font-bold rounded-2xl transition-all text-sm`}
                                >
                                    Inquire for Details
                                </button>
                                <p className={`text-[10px] ${isDarkMode ? 'text-slate-500' : 'text-slate-400'} mt-4 text-center leading-relaxed`}>
                                    *Ownership excludes monthly maintenance. You are responsible for deploying core updates as they are available.
                                </p>
                            </div>
                        </div>

                        {/* Commercial License Tier */}
                        <div className="relative group">
                            <div className="absolute -inset-px bg-gradient-to-br from-banana-400/30 via-transparent to-banana-400/30 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>
                            <div className={`relative p-8 rounded-[2.5rem] ${isDarkMode ? 'bg-slate-950 border-2 border-banana-400/20 shadow-[0_0_50px_-20px_rgba(250,204,21,0.3)]' : 'bg-white border-2 border-banana-400/30 shadow-[0_20px_50px_-10px_rgba(250,204,21,0.2)]'} flex flex-col h-full`}>
                                <div className="mb-8">
                                    <div className="inline-block px-3 py-1 rounded-lg bg-banana-400 text-slate-950 text-[10px] font-black tracking-widest uppercase mb-3 shadow-[0_0_20px_-5px_rgba(250,204,21,0.5)]">Full Rights</div>
                                    <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'} mb-2`}>Commercial License</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-black text-banana-400 tracking-widest uppercase italic">Contact Us</span>
                                    </div>
                                    <p className={`${isDarkMode ? 'text-slate-400' : 'text-slate-600'} mt-4 text-sm leading-relaxed`}>The keys to the kingdom. Full rights to resell, white-label, or build a new product on top of our tech.</p>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {[
                                        "Full Resell & White-Label Rights",
                                        "Unrestricted Commercial Use",
                                        "Brand Identity Ownership",
                                        "Raw Project Files & Assets",
                                        "Unlimited Seat Licensing",
                                        "Independent Product Roadmap"
                                    ].map((feature, i) => (
                                        <li key={i} className={`flex items-center gap-3 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'} text-sm`}>
                                            <div className="w-5 h-5 rounded-full bg-banana-400/10 flex items-center justify-center border border-banana-400/20">
                                                <Icons.Check className="w-3 h-3 text-banana-400" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className="w-full h-14 bg-banana-400 hover:bg-banana-500 text-slate-950 font-black rounded-2xl shadow-xl transition-all text-sm"
                                >
                                    Acquire Full Rights
                                </button>
                                <p className="text-[10px] text-slate-500 mt-4 text-center leading-relaxed font-bold">
                                    *Complete software acquisition. Legal transfer of intellectual property rights for commercial distribution.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className={`relative z-10 ${isDarkMode ? 'border-white/5 bg-slate-950/50' : 'border-slate-100 bg-white/50'} border-t py-12 mt-20 backdrop-blur-xl`}>
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className={`flex items-center gap-2 ${isDarkMode ? 'opacity-50 text-white' : 'opacity-80 text-slate-950'}`}>
                        <Icons.TrendingUp className="w-5 h-5" />
                        <span className="font-bold">The OfferHero</span>
                    </div>
                    <div className={`${isDarkMode ? 'text-slate-500' : 'text-slate-400'} text-sm`}>
                        © {new Date().getFullYear()} All rights reserved.
                    </div>
                </div>
            </footer>

            <AuthModal
                isOpen={authOpen}
                onClose={() => setAuthOpen(false)}
                defaultMode={authMode}
            />
        </div >
    );
};
