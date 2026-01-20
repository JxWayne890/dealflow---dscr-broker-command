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
            <div className="flex items-start space-x-3">
                <div className={`mt-0.5 p-2 rounded-full ${variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                    {variant === 'danger' ? <Icons.XCircle size={20} /> : <Icons.Clock size={20} />}
                </div>
                <div>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {message}
                    </p>
                </div>
            </div>
        </Modal>
    );
};
