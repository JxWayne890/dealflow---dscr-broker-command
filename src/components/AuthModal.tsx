import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Modal } from './Modal';
import { Button } from './Button';
import { Icons } from './Icons';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultMode?: 'signin' | 'signup';
}

export const AuthModal = ({ isOpen, onClose, defaultMode = 'signin' }: AuthModalProps) => {
    const [isSignUp, setIsSignUp] = useState(defaultMode === 'signup');
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    // Reset state when modal opens or mode changes externally
    useEffect(() => {
        if (isOpen) {
            setIsSignUp(defaultMode === 'signup');
            setError(null);
            setMessage(null);
            // Don't clear email/name/pass to be friendly if they accidentally closed it
        }
    }, [isOpen, defaultMode]);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        if (isSignUp) {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: name,
                    },
                },
            });
            if (error) setError(error.message);
            else setMessage('Check your email for the confirmation link!');
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) setError(error.message);
            // On success, Supabase auth state change will trigger redirect in App.tsx
            // We can optionally close modal here, but the page refresh/redirect usually handles it better
        }
        setLoading(false);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isSignUp ? 'Create your account' : 'Welcome back'}
            maxWidth="max-w-md"
        >
            <div className="mt-4">
                <form className="space-y-5" onSubmit={handleAuth}>
                    {isSignUp && (
                        <div>
                            <div className="relative group/input">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within/input:text-banana-400 transition-colors">
                                    <Icons.Users className="h-5 w-5" />
                                </div>
                                <input
                                    id="auth-name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required={isSignUp}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full pl-10 pr-4 py-3 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 focus:border-banana-400 text-foreground placeholder:text-muted/50 transition-all outline-none font-medium"
                                    placeholder="Full Name"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <div className="relative group/input">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within/input:text-banana-400 transition-colors">
                                <Icons.Mail className="h-5 w-5" />
                            </div>
                            <input
                                id="auth-email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full pl-10 pr-4 py-3 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 focus:border-banana-400 text-foreground placeholder:text-muted/50 transition-all outline-none font-medium"
                                placeholder="name@company.com"
                            />
                        </div>
                    </div>

                    <div>
                        <div className="relative group/input">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-muted group-focus-within/input:text-banana-400 transition-colors">
                                <div className="flex items-center justify-center w-5 h-5 border-2 border-current rounded-md overflow-hidden">
                                    <div className="w-1.5 h-1.5 bg-current rounded-full translate-y-0.5" />
                                </div>
                            </div>
                            <input
                                id="auth-password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="block w-full pl-10 pr-4 py-3 bg-surface border border-border/10 rounded-xl focus:ring-2 focus:ring-banana-400 focus:border-banana-400 text-foreground placeholder:text-muted/50 transition-all outline-none font-medium"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 flex items-start gap-3">
                            <Icons.AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</div>
                        </div>
                    )}

                    {message && (
                        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-start gap-3">
                            <Icons.CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <div className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">{message}</div>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full justify-center py-3 bg-banana-400 text-slate-900 font-bold text-base rounded-xl hover:bg-banana-500 hover:shadow-lg hover:shadow-banana-400/20 transition-all"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Icons.RefreshCw className="w-4 h-4 animate-spin mr-2" />
                                Processing...
                            </>
                        ) : (
                            isSignUp ? 'Create Account' : 'Sign In'
                        )}
                    </Button>
                </form>

                <div className="mt-6 pt-6 border-t border-border/10 text-center">
                    <p className="text-muted text-sm">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="font-bold text-banana-600 dark:text-banana-400 hover:text-banana-500 transition-colors"
                        >
                            {isSignUp ? 'Sign in' : 'Sign up for free'}
                        </button>
                    </p>
                </div>
            </div>
        </Modal>
    );
};
