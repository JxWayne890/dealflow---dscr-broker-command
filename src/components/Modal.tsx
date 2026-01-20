import React, { Fragment } from 'react';
import { Icons } from './Icons';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    primaryAction?: {
        label: string;
        onClick: () => void;
        variant?: 'primary' | 'danger';
        loading?: boolean;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
    maxWidth?: string;
}

export function Modal({ isOpen, onClose, title, children, primaryAction, secondaryAction, maxWidth = 'sm:max-w-lg' }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />

                {/* Center Method */}
                <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">&#8203;</span>

                {/* Content */}
                <div className={`relative inline-block transform overflow-hidden rounded-2xl bg-surface text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full ${maxWidth} sm:align-middle border border-border/10`}>
                    <div className="bg-surface px-4 pt-5 pb-4 sm:p-8 sm:pb-6">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                <h3 className="text-xl font-bold leading-6 text-foreground" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-4">
                                    <div className="text-sm text-muted">
                                        {children}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            className="absolute top-5 right-5 text-muted hover:text-foreground transition-colors"
                            onClick={onClose}
                        >
                            <Icons.X size={20} />
                        </button>
                    </div>
                    <div className="bg-foreground/5 px-4 py-4 sm:flex sm:flex-row-reverse sm:px-8 border-t border-border/10">
                        {primaryAction && (
                            <button
                                type="button"
                                disabled={primaryAction.loading}
                                className={`inline-flex w-full justify-center rounded-xl border border-transparent px-6 py-2.5 text-sm font-bold text-slate-900 shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto
                                    ${primaryAction.variant === 'danger'
                                        ? 'bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white'
                                        : 'bg-banana-400 hover:bg-banana-500 focus:ring-banana-400 shadow-banana-400/20'}
                                    ${primaryAction.loading ? 'opacity-70 cursor-not-allowed' : ''}
                                `}
                                onClick={primaryAction.onClick}
                            >
                                {primaryAction.loading && <Icons.RefreshCw className="animate-spin mr-2 h-4 w-4" />}
                                {primaryAction.label}
                            </button>
                        )}
                        {secondaryAction && (
                            <button
                                type="button"
                                className="mt-3 inline-flex w-full justify-center rounded-xl border border-border/10 bg-surface px-6 py-2.5 text-sm font-bold text-foreground shadow-sm hover:bg-foreground/5 focus:outline-none focus:ring-2 focus:ring-banana-400 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto transition-all"
                                onClick={secondaryAction.onClick}
                            >
                                {secondaryAction.label}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
