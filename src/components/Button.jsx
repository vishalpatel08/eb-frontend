import React from 'react';

export default function Button({
    children,
    type = 'button',
    variant = 'primary',
    disabled = false,
    loading = false,
    className = '',
    ...props
}) {
    const baseClass = variant === 'primary' ? 'submit-btn' : 'btn';
    
    return (
        <button
            type={type}
            className={`${baseClass} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? 'Loading...' : children}
        </button>
    );
}