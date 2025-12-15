import React from 'react';

export const MetricCard = ({ label, value, icon: Icon, color, subtext }: { label: string, value: string, icon: React.ElementType, color: string, subtext?: string }) => (
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-24 sm:h-32">
        <div className="flex items-center justify-between">
            <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">{label}</span>
            <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div>
            <div className="text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
            {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
        </div>
    </div>
);
