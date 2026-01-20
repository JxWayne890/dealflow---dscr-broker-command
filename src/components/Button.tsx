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
        primary: "bg-banana-400 text-slate-950 hover:bg-banana-500 hover:shadow-lg hover:shadow-banana-400/20 border border-transparent",
        secondary: "bg-foreground/5 backdrop-blur-md border border-border/10 text-foreground hover:bg-foreground/10 hover:border-border/20 shadow-lg shadow-black/5",
        danger: "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30",
        ghost: "bg-transparent text-muted hover:text-foreground hover:bg-foreground/5",
        outline: "bg-transparent border border-border/10 text-muted hover:border-banana-400 hover:text-banana-400 hover:bg-banana-400/5"
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
