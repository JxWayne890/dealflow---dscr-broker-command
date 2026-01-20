import React from 'react';

export const MetricCard = ({ label, value, icon: Icon, color, subtext, onClick }: { label: string, value: string, icon: React.ElementType, color: string, subtext?: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`relative overflow-hidden bg-surface/40 backdrop-blur-xl p-5 rounded-2xl border border-border/10 shadow-2xl flex flex-col justify-between h-28 sm:h-36 transition-all duration-300 group ${onClick ? 'cursor-pointer hover:border-banana-400/30 hover:shadow-banana-400/10 hover:-translate-y-1' : ''}`}
    >
        {/* Hover Gradient Bloom */}
        <div className="absolute -right-6 -top-6 w-24 h-24 bg-foreground/5 rounded-full blur-2xl group-hover:bg-banana-400/10 transition-colors duration-500 pointer-events-none"></div>

        <div className="flex items-center justify-between relative z-10">
            <span className="text-muted text-xs font-semibold uppercase tracking-wider">{label}</span>
            <div className={`p-2 rounded-lg bg-foreground/5 border border-border/10 ${color}`}>
                <Icon className={`w-4 h-4`} />
            </div>
        </div>
        <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{value}</div>
            {subtext && <div className="text-xs text-muted mt-1 font-medium">{subtext}</div>}
        </div>
    </div>
);
