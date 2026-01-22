import React, { useEffect } from 'react';
import { Logo } from '../components/Logo';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface EmailConfirmationProps {
    onContinue: () => void;
    isDark?: boolean;
}

export const EmailConfirmation: React.FC<EmailConfirmationProps> = ({ onContinue, isDark }) => {

    useEffect(() => {
        // Optional: Trigger any tracking or status updates here
    }, []);

    return (
        <div className={`min-h-screen flex flex-col items-center justify-center p-4 ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'} transition-colors duration-500`}>

            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-800 transition-all duration-500">
                <div className="p-8 flex flex-col items-center text-center">

                    {/* Brand */}
                    <div className="mb-8 flex flex-col items-center gap-4">
                        <div className="flex items-center gap-3">
                            <Logo className="h-12 w-auto" variant="icon" isDark={isDark} />
                            <Logo className="h-8 w-auto" variant="full" isDark={isDark} />
                        </div>
                    </div>

                    {/* Success Icon */}
                    <div className="mb-6 rounded-full bg-green-100 dark:bg-green-900/30 p-4 animate-in zoom-in duration-500">
                        <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-500" />
                    </div>

                    {/* Content */}
                    <h1 className="text-2xl font-bold mb-2 tracking-tight">Email Verified!</h1>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-xs mx-auto text-sm leading-relaxed">
                        Your email address has been successfully verified. You can now access your account.
                    </p>

                    {/* Action */}
                    <button
                        onClick={onContinue}
                        className="w-full group rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white py-3 px-4 font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <span>Continue to Dashboard</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                    </button>

                </div>

                {/* Footer Decor */}
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 text-center border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400">The OfferHero &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </div>
    );
};
