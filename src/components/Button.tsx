import React from "react";

interface ButtonProps {
    children: React.ReactNode;
    onClick?: () => void;
    className?: string;
    disabled?: boolean;
}

export default function Button({
                                   children,
                                   onClick,
                                   className = '',
                                   disabled = false,
                               }: ButtonProps) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${className}`}
        >
            {children}
        </button>
    );
}
