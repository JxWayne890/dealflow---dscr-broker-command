import React from 'react';
import { QuoteStatus } from '../types';

export const StatusBadge = ({ status }: { status: QuoteStatus }) => {
    const styles = {
        [QuoteStatus.DRAFT]: "bg-gray-100 text-gray-800 border-gray-200",
        [QuoteStatus.SENT]: "bg-blue-50 text-blue-700 border-blue-200",
        [QuoteStatus.VIEWED]: "bg-purple-50 text-purple-700 border-purple-200",
        [QuoteStatus.REPLIED]: "bg-amber-50 text-amber-700 border-amber-200",
        [QuoteStatus.CLOSED_WON]: "bg-emerald-50 text-emerald-700 border-emerald-200",
        [QuoteStatus.CLOSED_LOST]: "bg-red-50 text-red-700 border-red-200",
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[status]}`}>
            {status}
        </span>
    );
};
