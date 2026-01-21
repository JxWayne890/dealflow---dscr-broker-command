import React from 'react';

export const Logo = ({ className = "h-8 w-auto", variant = "full" }: { className?: string, variant?: 'full' | 'icon' }) => {
    const src = variant === 'icon'
        ? "/TheOfferHero_Logo_Icon.png?v=" + new Date().getTime()
        : "/TheOfferHero_Logo_Full.png?v=" + new Date().getTime();

    return (
        <img
            src={src}
            alt="The OfferHero"
            className={`${className} object-contain`}
        />
    );
};
