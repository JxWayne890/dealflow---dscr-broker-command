import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from './Modal';
import { Button } from './Button';
import { Icons } from './Icons';
import { ProfileService } from '../services/profileService';
import { InviteService } from '../services/inviteService';
import { useToast } from '../contexts/ToastContext';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultMode?: 'signin' | 'signup';
    initialStatus?: 'joined' | 'pending_setup' | 'pending_payment' | 'active';
}

type AuthStep = 'auth' | 'onboarding' | 'join_type' | 'assistant_setup' | 'producer_setup' | 'payment';

export const AuthModal = ({ isOpen, onClose, defaultMode = 'signin', initialStatus }: AuthModalProps) => {
    const { showToast } = useToast();
    const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
    const [step, setStep] = useState<AuthStep>('auth');
    const [loading, setLoading] = useState(false);

    // Step 0: Auth
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    // Step 1: Profile Info
    const [company, setCompany] = useState('');
    const [title, setTitle] = useState('');
    const [phone, setPhone] = useState('');
    const [website, setWebsite] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [organizationName, setOrganizationName] = useState<string | null>(null);

    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Initial data hydration
    useEffect(() => {
        const hydrateProfile = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const existing = await ProfileService.getProfile();
                if (existing) {
                    setName(existing.name || '');
                    setCompany(existing.company || '');
                    setTitle(existing.title || '');
                    setPhone(existing.phone || '');
                    setWebsite(existing.website || '');
                }
            }
        };

        if (isOpen) {
            hydrateProfile();
            setIsSignUp(defaultMode === 'signup');
            setError(null);
            setMessage(null);

            // If resuming from an abandoned session
            if (initialStatus === 'pending_setup') {
                setStep('join_type');
            } else if (initialStatus === 'pending_payment') {
                setStep('payment');
            } else if (initialStatus === 'joined') {
                setStep('join_type');
            } else {
                setStep('auth');
            }
        }
    }, [isOpen, defaultMode, initialStatus]);

    // Handle Join Code lookup
    useEffect(() => {
        if (joinCode.length === 6) {
            checkJoinCode(joinCode);
        } else {
            setOrganizationName(null);
        }
    }, [joinCode]);

    const checkJoinCode = async (code: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('company')
                .eq('invite_code', code.toUpperCase())
                .eq('role', 'admin')
                .maybeSingle();

            if (data?.company) {
                setOrganizationName(data.company);
                setCompany(data.company);
            }
        } catch (e) {
            console.error('Code lookup failed', e);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (isSignUp) {
            console.log('Signing up user:', email);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                        full_name: name
                    }
                },
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            } else if (data.user) {
                console.log('Signup success, moving to join_type');
                setStep('join_type');
                setLoading(false);
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                onClose();
            }
        }
    };

    const handleStepTransition = async (nextStep: AuthStep, statusUpdate?: string) => {
        if (statusUpdate) {
            try {
                await ProfileService.updateProfile({ onboardingStatus: statusUpdate as any });
            } catch (e) {
                console.error("Failed to update status", e);
            }
        }
        setStep(nextStep);
    };

    const handleFinalOnboarding = async (type: 'admin' | 'assistant') => {
        console.log('Finalizing onboarding for:', type);
        setLoading(true);
        setError(null);

        try {
            if (type === 'assistant') {
                if (!joinCode) {
                    setError('Please enter your organizational join code.');
                    setLoading(false);
                    return;
                }
                console.log('Claiming invite code:', joinCode);
                await InviteService.claimInvite(joinCode);
            }

            console.log('Updating profile data...');
            // Update profile with the rest of the info
            await ProfileService.updateProfile({
                name,
                company,
                title,
                phone,
                website,
                role: type,
                onboardingStatus: type === 'admin' ? 'pending_payment' : 'active'
            });

            if (type === 'admin') {
                console.log('Moving to payment');
                setStep('payment');
            } else {
                console.log('Assistant join complete');
                showToast('Welcome to the team!', 'success');
                onClose();
                setTimeout(() => window.location.reload(), 500); // Small delay to show toast
            }
        } catch (e: any) {
            console.error('Onboarding error detailed:', e);
            setError(e.message || 'Onboarding failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleStartSubscription = async () => {
        setLoading(true);
        try {
            // Final status update before redirect
            await ProfileService.updateProfile({ onboardingStatus: 'pending_payment' });

            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.url) {
                window.location.href = data.url;
            } else {
                setError('Checkout failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            setError('Could not connect to payment server.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                step === 'auth' ? (isSignUp ? 'Create your account' : 'Welcome back') :
                    step === 'join_type' ? 'How are you joining?' :
                        step === 'assistant_setup' ? 'Join Organization' :
                            step === 'producer_setup' ? 'Company Details' :
                                'Choose Your Plan'
            }
            maxWidth="max-w-md"
        >
            <div className="mt-4">
                {step === 'auth' && (
                    <form className="space-y-5" onSubmit={handleAuth}>
                        {isSignUp && (
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within/input:text-banana-400 transition-colors">
                                    <Icons.Users className="h-5 w-5" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-foreground placeholder:text-muted/50 transition-all outline-none font-medium"
                                    placeholder="Full Name"
                                />
                            </div>
                        )}

                        <div className="relative group/input">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within/input:text-banana-400 transition-colors">
                                <Icons.Mail className="h-5 w-5" />
                            </div>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-4 py-3 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-foreground placeholder:text-muted/50 transition-all outline-none font-medium"
                                placeholder="name@company.com"
                            />
                        </div>

                        <div className="relative group/input">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within/input:text-banana-400 transition-colors">
                                <Icons.Lock className="h-5 w-5" />
                            </div>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-4 py-3 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-foreground placeholder:text-muted/50 transition-all outline-none font-medium"
                                placeholder="••••••••"
                            />
                        </div>

                        {error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>}

                        <Button type="submit" className="w-full justify-center py-3 bg-banana-400 text-slate-900 font-bold" disabled={loading}>
                            {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Sign In')}
                        </Button>

                        <div className="mt-6 pt-6 border-t border-border/10 text-center">
                            <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm font-bold text-banana-400 hover:text-banana-300">
                                {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'join_type' && (
                    <div className="space-y-4">
                        <p className="text-muted text-sm text-center mb-6">Choose how you want to use OfferHero.</p>
                        <button
                            onClick={() => handleStepTransition('producer_setup', 'pending_setup')}
                            className="w-full p-6 bg-surface border border-border/10 rounded-2xl hover:border-banana-400/50 hover:bg-banana-400/5 transition-all text-left group"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-banana-400/20 rounded-xl text-banana-400 group-hover:scale-110 transition-transform">
                                    <Icons.Award className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-foreground">Elite Producer</h3>
                            </div>
                            <p className="text-sm text-muted">A personal license for high-volume professionals. Full access to all automation tools.</p>
                        </button>

                        <button
                            onClick={() => handleStepTransition('assistant_setup', 'pending_setup')}
                            className="w-full p-6 bg-surface border border-border/10 rounded-2xl hover:border-indigo-400/50 hover:bg-indigo-400/5 transition-all text-left group"
                        >
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 bg-indigo-400/20 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Icons.Users className="w-6 h-6" />
                                </div>
                                <h3 className="font-bold text-lg text-foreground">Team Assistant</h3>
                            </div>
                            <p className="text-sm text-muted">Joining an existing organization? Enter your team's code to get started.</p>
                        </button>
                    </div>
                )}

                {step === 'assistant_setup' && (
                    <div className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">Organizational Join Code</label>
                            <input
                                type="text"
                                maxLength={6}
                                value={joinCode}
                                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                                className="block w-full px-4 py-3 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-center text-2xl font-mono tracking-widest uppercase"
                                placeholder="XXXXXX"
                            />
                            {organizationName ? (
                                <div className="mt-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 text-emerald-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                    <Icons.CheckCircle className="w-4 h-4" />
                                    Joining: <span className="font-bold">{organizationName}</span>
                                </div>
                            ) : joinCode.length === 6 && !loading ? (
                                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-red-400 text-sm font-medium animate-in fade-in slide-in-from-top-2">
                                    <Icons.AlertCircle className="w-4 h-4" />
                                    Invalid or unrecognized code
                                </div>
                            ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1.5">Job Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="block w-full px-4 py-2 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-sm"
                                    placeholder="Assistant"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1.5">Phone</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="block w-full px-4 py-2 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-sm"
                                    placeholder="(555) 000-0000"
                                />
                            </div>
                        </div>

                        {error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>}

                        <div className="flex gap-3">
                            <Button variant="secondary" className="flex-1" onClick={() => setStep('join_type')}>Back</Button>
                            <Button className="flex-[2] bg-banana-400 text-slate-900 font-bold" disabled={loading || !organizationName} onClick={() => handleFinalOnboarding('assistant')}>
                                {loading ? 'Joining...' : 'Complete Join'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'producer_setup' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1.5">Company Name</label>
                                <input
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="block w-full px-4 py-2 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-sm font-medium text-foreground"
                                    placeholder="Take This Cash LLC"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1.5">Job Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="block w-full px-4 py-2 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-sm"
                                        placeholder="Senior Broker"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-muted mb-1.5">Phone</label>
                                    <input
                                        type="text"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="block w-full px-4 py-2 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-sm"
                                        placeholder="(555) 000-0000"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1.5">Website</label>
                                <input
                                    type="text"
                                    value={website}
                                    onChange={(e) => setWebsite(e.target.value)}
                                    className="block w-full px-4 py-2 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-sm"
                                    placeholder="https://yourcompany.com"
                                />
                            </div>
                        </div>

                        {error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>}

                        <div className="flex gap-3 pt-2">
                            <Button variant="secondary" className="flex-1" onClick={() => setStep('join_type')}>Back</Button>
                            <Button className="flex-[2] bg-banana-400 text-slate-900 font-bold" disabled={loading || !company} onClick={() => handleFinalOnboarding('admin')}>
                                {loading ? 'Saving...' : 'Continue to Payment'}
                            </Button>
                        </div>
                    </div>
                )}

                {step === 'payment' && (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-banana-400/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Icons.CreditCard className="w-8 h-8 text-banana-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-2">Final Step: Activation</h3>
                        <p className="text-muted text-sm mb-8 px-4">Subscribe to the Elite Producer plan to activate your account and access all automation features.</p>

                        <div className="bg-foreground/5 rounded-2xl p-6 mb-8 text-left border border-border/10">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-foreground font-bold italic">Elite Producer Plan</span>
                                <span className="text-xl font-black text-banana-400">$250<span className="text-xs text-muted font-normal">/mo</span></span>
                            </div>
                            <ul className="space-y-3">
                                {['Automated Nurture Campaigns', 'Instant PDF Quote Gen', 'Visual Pipeline Management', 'Unlimited Seat Licensing'].map(f => (
                                    <li key={f} className="flex items-center gap-2 text-xs text-muted">
                                        <Icons.CheckCircle className="w-3 h-3 text-banana-400" />
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {error && <div className="text-sm text-red-500 mb-6">{error}</div>}

                        <Button
                            className="w-full h-14 bg-banana-400 text-slate-900 font-black text-lg shadow-[0_0_30px_-5px_rgba(250,204,21,0.4)]"
                            disabled={loading}
                            onClick={handleStartSubscription}
                        >
                            {loading ? 'Redirecting...' : 'Activate Now'}
                        </Button>
                        <p className="mt-4 text-[10px] text-muted uppercase tracking-widest">Secure Payment via Stripe</p>
                    </div>
                )}
            </div>
        </Modal>
    );
};

