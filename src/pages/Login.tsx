import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Icons } from '../components/Icons';
import { Button } from '../components/Button';

export const Login = () => {
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

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
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="w-12 h-12 bg-banana-400 rounded-xl flex items-center justify-center shadow-lg shadow-banana-400/20">
                        <Icons.TrendingUp className="w-7 h-7 text-slate-900" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
                    {isSignUp ? 'Create your account' : 'Sign in to your account'}
                </h2>
                <p className="mt-2 text-center text-sm text-muted">
                    Or{' '}
                    <button onClick={() => setIsSignUp(!isSignUp)} className="font-medium text-banana-600 dark:text-banana-400 hover:text-banana-500 bg-transparent border-0 p-0 cursor-pointer transition-colors">
                        {isSignUp ? 'sign in instead' : 'create an account'}
                    </button>
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-surface/30 backdrop-blur-xl py-8 px-4 shadow-xl border border-border/10 sm:rounded-xl sm:px-10">
                    <form className="space-y-6" onSubmit={handleAuth}>
                        {isSignUp && (
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-muted">
                                    Full Name
                                </label>
                                <div className="mt-1">
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="name"
                                        required={isSignUp}
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 bg-surface border border-border/10 rounded-lg shadow-sm placeholder:text-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-banana-400 focus:border-banana-400 sm:text-sm transition-shadow"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-muted">
                                Email address
                            </label>
                            <div className="mt-1">
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 bg-surface border border-border/10 rounded-lg shadow-sm placeholder:text-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-banana-400 focus:border-banana-400 sm:text-sm transition-shadow"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-muted">
                                Password
                            </label>
                            <div className="mt-1">
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="appearance-none block w-full px-3 py-2 bg-surface border border-border/10 rounded-lg shadow-sm placeholder:text-muted/50 text-foreground focus:outline-none focus:ring-2 focus:ring-banana-400 focus:border-banana-400 sm:text-sm transition-shadow"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-500/10 border border-red-500/20 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-500">{error}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        {message && (
                            <div className="rounded-md bg-emerald-500/10 border border-emerald-500/20 p-4">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-emerald-500">{message}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <Button
                                type="submit"
                                className="w-full justify-center shadow-lg shadow-banana-400/20"
                                disabled={loading}
                            >
                                {loading ? 'Loading...' : (isSignUp ? 'Sign up' : 'Sign in')}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};
