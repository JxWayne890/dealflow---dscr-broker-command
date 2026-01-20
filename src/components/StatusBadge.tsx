import React from 'react';
import { QuoteStatus } from '../types';

export const StatusBadge = ({ status, onClick }: { status: QuoteStatus, onClick?: (e: React.MouseEvent) => void }) => {
    const styles = {
        [QuoteStatus.DRAFT]: "bg-slate-500/10 text-slate-400 border-slate-500/20",
        [QuoteStatus.ACTIVE]: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_8px_rgba(59,130,246,0.1)]",
        [QuoteStatus.FOLLOW_UP]: "bg-orange-500/10 text-orange-400 border-orange-500/20 shadow-[0_0_8px_rgba(249,115,22,0.1)]",
        [QuoteStatus.WON]: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
        [QuoteStatus.LOST]: "bg-red-500/10 text-red-400 border-red-500/20",
    };

    return (
        <span
            onClick={onClick}
            className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border backdrop-blur-md transition-all ${styles[status]} ${onClick ? 'cursor-pointer hover:bg-opacity-20 active:scale-95' : ''}`}
        >
            {status}
        </span>
    );
};
