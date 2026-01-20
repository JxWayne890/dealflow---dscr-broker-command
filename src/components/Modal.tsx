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
                <div className={`relative inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full ${maxWidth} sm:align-middle border border-gray-200`}>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="sm:flex sm:items-start">
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <div className="text-sm text-gray-500">
                                        {children}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500"
                            onClick={onClose}
                        >
                            <Icons.X size={20} />
                        </button>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                        {primaryAction && (
                            <button
                                type="button"
                                disabled={primaryAction.loading}
                                className={`inline-flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm
                                    ${primaryAction.variant === 'danger'
                                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                                        : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'}
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
                                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
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
