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
    const baseStyle = "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    const sizeStyle = "px-4 py-2.5 text-sm";

    const variants = {
        primary: "bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-sm",
        secondary: "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-indigo-500 shadow-sm",
        danger: "bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-500",
        ghost: "bg-transparent text-gray-600 hover:bg-gray-100",
        outline: "bg-transparent border border-gray-300 text-gray-700 hover:bg-gray-50"
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
