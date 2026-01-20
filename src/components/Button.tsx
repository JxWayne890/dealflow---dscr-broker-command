import React from 'react';

export const Button = ({
    children,
    onClick,
    variant = 'primary',
    className = '',
    disabled = false,
    icon: Icon,
    type = 'button'
}: {
    children?: React.ReactNode;
    onClick?: () => void;
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    className?: string;
    disabled?: boolean;
    icon?: React.ElementType;
    type?: 'button' | 'submit' | 'reset';
}) => {
    const baseStyle = "inline-flex items-center justify-center rounded-xl font-bold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface focus:ring-banana-400 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
    const sizeStyle = "px-5 py-2.5 text-sm";

    const variants = {
        primary: "bg-banana-400 text-surface hover:bg-banana-500 hover:shadow-lg hover:shadow-banana-400/20 border border-transparent",
        secondary: "bg-surface/50 backdrop-blur-md border border-white/10 text-white hover:bg-white/10 hover:border-white/20 shadow-lg shadow-black/10",
        danger: "bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30",
        ghost: "bg-transparent text-slate-400 hover:text-white hover:bg-white/5",
        outline: "bg-transparent border border-white/10 text-slate-300 hover:border-banana-400 hover:text-banana-400 hover:bg-banana-400/5"
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyle} ${sizeStyle} ${variants[variant]} ${className}`}
        >
            {Icon && <Icon className="w-4 h-4 mr-2" />}
            {children}
        </button>
    );
};
