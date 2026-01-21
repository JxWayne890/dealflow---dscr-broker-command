import React from 'react';

export const MetricCard = ({ label, value, icon: Icon, color, subtext, onClick }: { label: string, value: string, icon: React.ElementType, color: string, subtext?: string, onClick?: () => void }) => (
    <div
        onClick={onClick}
        className={`relative overflow-hidden bg-surface/30 backdrop-blur-3xl p-6 rounded-[2rem] border border-border/5 shadow-[0_8px_32px_rgba(0,0,0,0.12)] flex flex-col justify-between h-32 sm:h-44 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group ${onClick ? 'cursor-pointer hover:border-banana-400/20 hover:shadow-[0_20px_40px_-15px_rgba(250,204,21,0.1)] hover:-translate-y-2' : ''}`}
    >
        {/* Glow Accent */}
        <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full blur-[40px] opacity-0 group-hover:opacity-20 transition-all duration-700 pointer-events-none ${color.includes('banana') ? 'bg-banana-400' : color.includes('emerald') ? 'bg-emerald-400' : color.includes('indigo') ? 'bg-indigo-400' : 'bg-white'}`}></div>

        <div className="flex items-start justify-between relative z-10">
            <div className="flex flex-col">
                <span className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-1 opacity-70 group-hover:opacity-100 transition-opacity whitespace-nowrap">{label}</span>
                {subtext && <div className="text-[10px] text-muted/60 font-medium tracking-tight group-hover:text-muted transition-colors">{subtext}</div>}
            </div>
            <div className={`p-2.5 rounded-2xl bg-surfaceHighlight/50 border border-border/5 ${color} shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                <Icon className={`w-5 h-5`} />
            </div>
        </div>

        <div className="relative z-10 mt-auto">
            <div className="text-3xl sm:text-4xl font-bold text-foreground leading-none group-hover:scale-[1.02] transition-transform origin-left">{value}</div>
            <div className="mt-4 flex items-center gap-1">
                <div className={`h-[2px] rounded-full flex-1 bg-gradient-to-r from-transparent via-border/5 to-transparent`}></div>
            </div>
        </div>
    </div>
);
