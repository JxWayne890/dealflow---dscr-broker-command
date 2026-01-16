import React, { useState, useRef, useEffect } from 'react';
import { QuoteStatus } from '../types';
import { StatusBadge } from './StatusBadge';

interface StatusDropdownProps {
    currentStatus: QuoteStatus;
    onStatusChange: (status: QuoteStatus) => void;
}

export const StatusDropdown = ({ currentStatus, onStatusChange }: StatusDropdownProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const statuses = Object.values(QuoteStatus);

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <StatusBadge
                status={currentStatus}
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
            />

            {isOpen && (
                <div className="absolute right-0 mt-2 w-40 rounded-lg bg-white shadow-lg border border-gray-200 z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-100 origin-top-right">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 border-b border-gray-100 mb-1">
                        Move to...
                    </div>
                    {statuses.map((status) => {
                        const dotColors = {
                            [QuoteStatus.DRAFT]: "bg-gray-400",
                            [QuoteStatus.ACTIVE]: "bg-blue-500",
                            [QuoteStatus.FOLLOW_UP]: "bg-amber-500",
                            [QuoteStatus.WON]: "bg-emerald-500",
                            [QuoteStatus.LOST]: "bg-red-500",
                        };

                        return (
                            <button
                                key={status}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStatusChange(status);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3
                                    ${currentStatus === status
                                        ? 'bg-indigo-50 text-indigo-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'}`}
                            >
                                <div className={`w-2 h-2 rounded-full ${dotColors[status]}`} />
                                <span className="flex-1">{status}</span>
                                {currentStatus === status && (
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-600"></div>
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};
