import React from 'react';
import { createPortal } from 'react-dom';
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

    return createPortal(
        <div className="fixed inset-0 z-[10000] overflow-y-auto">
            <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-slate-900/75 backdrop-blur-sm transition-opacity"
                    onClick={onClose}
                    aria-hidden="true"
                />

                {/* Content */}
                <div className={`relative transform overflow-hidden rounded-2xl bg-surface text-left shadow-2xl transition-all sm:my-8 w-full ${maxWidth} border border-border/10`}>
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
        </div>,
        document.body
    );
}
