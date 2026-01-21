import React from 'react';

export const Logo = ({ className = "h-8 w-auto", variant = "full", isDark = false }: { className?: string, variant?: 'full' | 'icon', isDark?: boolean }) => {
    // Add timestamp to force cache refresh (v2)
    const baseUrl = variant === 'icon'
        ? (isDark ? "/TheOfferHero_Logo_Icon_Dark.png" : "/assets/logo_icon.png")
        : (isDark ? "/TheOfferHero_Logo_Full_Dark.png" : "/assets/logo_full.png");

    // Use the assets we just created in src/assets if possible, but for public folder serving:
    // actually, in previous steps I copied to src/assets.
    // stick to public folder for consistency with how vite serves static assets easily if referenced by root path, 
    // OR use the imported assets. 
    // The previous implementation used public folder paths.
    // Let's use the public folder paths as previously intended for the dark mode logic I saw earlier.
    // Wait, the user said "replace this with the actal logos". 
    // I copied them to src/assets/logo_*.png in step 504.
    // But the dark mode ones are in public/TheOfferHero_Logo_*_Dark.png (created in step 490).

    // Let's rely on the public folder for now to be safe with dynamic paths.

    const url = variant === 'icon'
        ? (isDark ? "/TheOfferHero_Logo_Icon_Dark.png" : "/TheOfferHero_Logo_Icon.png")
        : (isDark ? "/TheOfferHero_Logo_Full_Dark.png" : "/TheOfferHero_Logo_Full.png");

    const src = `${url}?v=${new Date().getTime()}`;

    return (
        <img
            src={src}
            alt="The OfferHero"
            className={`${className} object-contain`}
        />
    );
};
