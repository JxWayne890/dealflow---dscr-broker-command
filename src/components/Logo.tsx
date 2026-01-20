import React from 'react';
import { Banana } from 'lucide-react';

export const Logo = ({ className = "h-8 w-auto" }: { className?: string }) => (
    <div className={`flex items-center gap-2 ${className}`}>
        <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 bg-banana-400 blur-md opacity-30 rounded-full"></div>
            <Banana size={32} className="text-banana-600 dark:text-banana-400 fill-banana-400/20 rotate-12 relative z-10" strokeWidth={2.5} />
        </div>
        <span className="font-bold text-xl tracking-tight text-foreground">
            The Offer<span className="text-banana-600 dark:text-banana-400">Hero</span>
        </span>
    </div>
);
