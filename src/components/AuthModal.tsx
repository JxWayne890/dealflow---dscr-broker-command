import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from './Modal';
import { Button } from './Button';
import { Icons } from './Icons';
import { ProfileService } from '../services/profileService';
import { InviteService } from '../services/inviteService';
import { useToast } from '../contexts/ToastContext';
import { formatPhoneNumber } from '../utils/formatters';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultMode?: 'signin' | 'signup';
    initialStatus?: 'joined' | 'pending_setup' | 'pending_payment' | 'active';
}

type AuthStep = 'auth' | 'onboarding' | 'join_type' | 'assistant_setup' | 'producer_setup' | 'payment' | 'email_confirmation';

export const AuthModal = ({ isOpen, onClose, defaultMode = 'signin', initialStatus }: AuthModalProps) => {
    const { showToast } = useToast();
    const [authSubStep, setAuthSubStep] = useState<'email' | 'password'>('email');
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
    const [pendingUserId, setPendingUserId] = useState<string | null>(null);

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
                } else {
                    // Pre-fill from auth metadata if profile doesn't exist yet
                    setName(session.user.user_metadata?.name || session.user.user_metadata?.full_name || '');
                    setEmail(session.user.email || '');
                }
            }
        };

        if (isOpen) {
            hydrateProfile();
            setIsSignUp(defaultMode === 'signup');
            setAuthSubStep('email');
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
            // Use secure RPC to bypass RLS safely
            const { data, error } = await supabase
                .rpc('check_invite_code', { lookup_code: code.toUpperCase() });

            if (data && data.length > 0) {
                setOrganizationName(data[0].company_name);
                setCompany(data[0].company_name);
            } else {
                setOrganizationName(null);
            }
        } catch (e) {
            console.error('Code lookup failed', e);
            setOrganizationName(null);
        }
    };

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (authSubStep === 'email') {
            if (!email) {
                setError('Please enter your email address');
                return;
            }
            // Basic email validation could go here
            setAuthSubStep('password');
            return;
        }

        setLoading(true);

        if (isSignUp) {
            console.log('Signing up user:', email);
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                // Name is now collected in onboarding, not here
            });

            if (error) {
                setError(error.message);
                setLoading(false);
            } else {
                console.log('Signup success, showing email confirmation...');
                setStep('email_confirmation');
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
                let uid = pendingUserId;
                let userEmail = email;
                let userName = name;

                if (!uid) {
                    const { data: { user } } = await supabase.auth.getUser();
                    uid = user?.id || null;
                    if (user) {
                        userEmail = user.email || '';
                        userName = user.user_metadata?.name || user.user_metadata?.full_name || '';
                    }
                }

                if (uid) {
                    // pass name/email to ensure creation if missing
                    await ProfileService.onboardingUpdate(uid, {
                        onboardingStatus: statusUpdate as any,
                        name: userName,
                        email: userEmail
                    });
                }
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

        if (!name) {
            setError('Please enter your full name');
            setLoading(false);
            return;
        }

        try {
            if (type === 'assistant') {
                if (!joinCode) {
                    setError('Please enter your organizational join code.');
                    setLoading(false);
                    return;
                }
                console.log('Claiming invite code:', joinCode, 'for user:', pendingUserId);
                // Pass all profile data to the backend - it handles everything for assistants
                await InviteService.claimInvite(joinCode, pendingUserId, { name, phone, title: 'Assistant' });

                // Show email confirmation step
                console.log('Assistant profile created, showing email confirmation...');
                setStep('email_confirmation');
                setLoading(false);
                return; // Exit early - no need for ProfileService
            }

            // For admins, continue with the normal flow
            console.log('Updating profile data...');
            const updates = {
                name,
                company,
                title,
                phone,
                website,
                role: type,
                onboardingStatus: 'pending_payment' as any
            };

            let uid = pendingUserId;
            if (!uid) {
                const { data: { user } } = await supabase.auth.getUser();
                uid = user?.id || null;
            }

            if (uid) {
                // Use onboardingUpdate to ensure profile exists/is created
                await ProfileService.onboardingUpdate(uid, updates);
            }

            console.log('Moving to payment');
            setStep('payment');
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
            const updates = { onboardingStatus: 'pending_payment' as any };
            let uid = pendingUserId;
            if (!uid) {
                const { data: { user } } = await supabase.auth.getUser();
                uid = user?.id || null;
            }

            if (uid) {
                await ProfileService.onboardingUpdate(uid, updates);
            }

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
                            step === 'producer_setup' ? 'Your Details' :
                                'Choose Your Plan'
            }
            maxWidth="max-w-md"
        >
            <div className="mt-4">
                {step === 'auth' && (
                    <form className="space-y-5" onSubmit={handleAuth}>


                        <div className="space-y-4">
                            <div className="relative group/input">
                                <label className="block text-sm font-medium text-muted mb-1.5 ">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within/input:text-banana-400 transition-colors">
                                        <Icons.Mail className="h-5 w-5" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={authSubStep === 'password'}
                                        className={`block w-full pl-10 pr-4 py-3 bg-surface border ${authSubStep === 'password' ? 'border-transparent bg-white/5' : 'border-border/10'} rounded-xl focus:ring-2 focus:ring-banana-400 text-foreground placeholder:text-muted/50 transition-all outline-none font-medium`}
                                        placeholder="name@company.com"
                                    />
                                    {authSubStep === 'password' && (
                                        <button
                                            type="button"
                                            onClick={() => setAuthSubStep('email')}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm font-bold text-banana-400 hover:text-banana-300"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </div>

                            {authSubStep === 'password' && (
                                <div className="relative group/input animate-in fade-in slide-in-from-top-2">
                                    <label className="block text-sm font-medium text-muted mb-1.5">Password</label>
                                    <div className="relative">
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
                                            autoFocus
                                        />
                                    </div>
                                    {isSignUp && <div className="mt-2 text-xs text-muted space-y-1">
                                        <p>Password must contain:</p>
                                        <ul className="list-disc list-inside pl-1 text-[11px] opacity-70">
                                            <li>at least 8 characters</li>
                                            <li>a number (0-9)</li>
                                        </ul>
                                    </div>}
                                </div>
                            )}
                        </div>

                        {error && <div className="text-sm text-red-500 bg-red-500/10 p-3 rounded-xl border border-red-500/20">{error}</div>}

                        <Button type="submit" className="w-full justify-center py-3 bg-banana-400 text-slate-900 font-bold" disabled={loading}>
                            {loading ? 'Processing...' : (
                                authSubStep === 'email' ? 'Continue' :
                                    (isSignUp ? 'Create Account' : 'Sign In')
                            )}
                        </Button>

                        {/* Footer Links */}
                        <div className="text-center text-xs text-muted mt-6">
                            {isSignUp ? (
                                <p>By continuing, you agree to the <a href="#" className="underline hover:text-foreground">Terms of Service</a> and <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.</p>
                            ) : null}
                        </div>

                        <div className="mt-6 pt-6 border-t border-border/10 text-center">
                            <button onClick={() => {
                                setIsSignUp(!isSignUp);
                                setAuthSubStep('email');
                                setError(null);
                            }} className="text-sm font-bold text-banana-400 hover:text-banana-300">
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
                        {/* Added Name Field for Assistant */}
                        <div>
                            <label className="block text-sm font-medium text-muted mb-2">Your Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="block w-full px-4 py-3 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-foreground font-medium"
                                placeholder="John Doe"
                            />
                        </div>

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
                                    value="Assistant"
                                    disabled
                                    className="block w-full px-4 py-2 bg-slate-100/50 border border-border/10 rounded-xl text-slate-500 cursor-not-allowed text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1.5">Phone</label>
                                <input
                                    type="text"
                                    value={phone}
                                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
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
                            {/* Added Name Field for Producer */}
                            <div>
                                <label className="block text-sm font-medium text-muted mb-1.5">Full Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full px-4 py-2 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-sm font-medium text-foreground"
                                    placeholder="Jane Doe"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-muted mb-1.5">Company Name</label>
                                <input
                                    type="text"
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className="block w-full px-4 py-2 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 text-sm font-medium text-foreground"
                                    placeholder="The OfferHero LLC"
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
                                        onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
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

                        <div className="flex gap-3 pt-2">
                            <Button variant="secondary" className="flex-1 h-14" onClick={() => setStep('producer_setup')}>Back</Button>
                            <Button
                                className="flex-[2] h-14 bg-banana-400 text-slate-900 font-black text-lg shadow-[0_0_30px_-5px_rgba(250,204,21,0.4)]"
                                disabled={loading}
                                onClick={handleStartSubscription}
                            >
                                {loading ? 'Redirecting...' : 'Activate Now'}
                            </Button>
                        </div>
                        <p className="mt-4 text-[10px] text-muted uppercase tracking-widest">Secure Payment via Stripe</p>
                    </div>
                )}

                {step === 'email_confirmation' && (
                    <div className="text-center py-8">
                        <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Icons.Mail className="w-10 h-10 text-emerald-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground mb-3">Check Your Email!</h3>
                        <p className="text-muted text-sm mb-6 px-4">
                            We've sent a confirmation link to <span className="text-foreground font-semibold">{email}</span>.
                        </p>
                        <p className="text-muted text-sm mb-8 px-4">
                            Click the link in your email to verify your account, then come back and sign in to access your dashboard.
                        </p>

                        {organizationName && (
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6">
                                <p className="text-emerald-400 text-sm font-medium flex items-center justify-center gap-2">
                                    <Icons.CheckCircle className="w-4 h-4" />
                                    You've joined: {organizationName}
                                </p>
                            </div>
                        )}

                        <Button
                            className="w-full bg-banana-400 text-slate-900 font-bold"
                            onClick={() => {
                                onClose();
                                window.location.reload();
                            }}
                        >
                            Got it, I'll check my email
                        </Button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
