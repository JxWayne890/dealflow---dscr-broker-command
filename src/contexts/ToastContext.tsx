import React, { createContext, useContext, useState, useEffect } from 'react';
import { Icons } from '../components/Icons';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container */}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto transform transition-all duration-300 ease-in-out
                            flex items-center p-4 min-w-[300px] rounded-lg shadow-lg border-l-4
                            ${toast.type === 'success' ? 'bg-white border-green-500 text-gray-800' : ''}
                            ${toast.type === 'error' ? 'bg-white border-red-500 text-gray-800' : ''}
                            ${toast.type === 'info' ? 'bg-white border-blue-500 text-gray-800' : ''}
                        `}
                    >
                        <div className="flex-shrink-0 mr-3">
                            {toast.type === 'success' && <Icons.CheckCircle className="h-5 w-5 text-green-500" />}
                            {toast.type === 'error' && <Icons.XCircle className="h-5 w-5 text-red-500" />}
                            {toast.type === 'info' && <Icons.FileText className="h-5 w-5 text-blue-500" />}
                        </div>
                        <div className="flex-1 text-sm font-medium">{toast.message}</div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="ml-4 text-gray-400 hover:text-gray-500"
                        >
                            <Icons.X size={16} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
