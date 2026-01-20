import React from 'react';
import { Modal } from './Modal';
import { Icons } from './Icons';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'primary' | 'danger';
    loading?: boolean;
}

export const ConfirmModal = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'primary',
    loading = false
}: ConfirmModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onCancel}
            title={title}
            primaryAction={{
                label: confirmLabel,
                onClick: onConfirm,
                variant: variant,
                loading: loading
            }}
            secondaryAction={{
                label: cancelLabel,
                onClick: onCancel
            }}
        >
            <div className="flex items-start space-x-4">
                <div className={`mt-0.5 p-2 rounded-xl border ${variant === 'danger'
                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                    : 'bg-banana-400/10 text-banana-600 dark:text-banana-400 border-banana-400/20'}`}>
                    {variant === 'danger' ? <Icons.XCircle size={20} /> : <Icons.AlertCircle size={20} />}
                </div>
                <div>
                    <p className="text-sm text-muted leading-relaxed font-medium">
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
};
