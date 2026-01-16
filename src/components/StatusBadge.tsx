import React from 'react';
import { QuoteStatus } from '../types';

export const StatusBadge = ({ status, onClick }: { status: QuoteStatus, onClick?: (e: React.MouseEvent) => void }) => {
    const styles = {
        [QuoteStatus.DRAFT]: "bg-gray-100 text-gray-800 border-gray-200",
        [QuoteStatus.ACTIVE]: "bg-blue-50 text-blue-700 border-blue-200",
        [QuoteStatus.FOLLOW_UP]: "bg-amber-50 text-amber-700 border-amber-200",
        [QuoteStatus.WON]: "bg-emerald-50 text-emerald-700 border-emerald-200",
        [QuoteStatus.LOST]: "bg-red-50 text-red-700 border-red-200",
    };

    return (
        <span
            onClick={onClick}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all ${styles[status]} ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95' : ''}`}
        >
            {status}
        </span>
    );
};
