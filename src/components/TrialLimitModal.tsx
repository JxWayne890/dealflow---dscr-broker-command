import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Icons } from './Icons';

interface TrialLimitModalProps {
    isOpen: boolean;
    onClose: () => void;
    emailsSent: number;
    limit: number;
}

export const TrialLimitModal: React.FC<TrialLimitModalProps> = ({
    isOpen,
    onClose,
    emailsSent,
    limit
}) => {
    const handleUpgrade = () => {
        // TODO: Connect to existing Stripe payment flow
        // For now, redirect to a placeholder or settings
        window.location.href = '/?view=settings';
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Trial Limit Reached" maxWidth="max-w-md">
            <div className="text-center py-6">
                <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Icons.AlertCircle className="w-10 h-10 text-amber-500" />
                </div>

                <h2 className="text-2xl font-bold text-foreground mb-2">
                    You've reached your free trial limit
                </h2>

                <p className="text-muted mb-6">
                    You've sent <strong className="text-foreground">{emailsSent}</strong> of your <strong className="text-foreground">{limit}</strong> free emails.
                    <br />
                    Upgrade now to unlock unlimited email sends.
                </p>

                <div className="bg-surface/50 rounded-xl p-4 mb-6 border border-border/10">
                    <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-muted">Emails Used</span>
                        <span className="font-bold text-foreground">{emailsSent} / {limit}</span>
                    </div>
                    <div className="w-full bg-slate-700 rounded-full h-2">
                        <div
                            className="bg-gradient-to-r from-amber-500 to-red-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min((emailsSent / limit) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <Button
                        onClick={handleUpgrade}
                        className="w-full"
                        icon={Icons.Zap}
                    >
                        Upgrade Now
                    </Button>
                    <button
                        onClick={onClose}
                        className="w-full text-sm text-muted hover:text-foreground transition-colors py-2"
                    >
                        Maybe Later
                    </button>
                </div>
            </div>
        </Modal>
    );
};
