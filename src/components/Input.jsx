import React from 'react';

export default function Input({
    id,
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    required = false,
    autoComplete,
    error,
    className = '',
    ...props
}) {
    return (
        <div className="form-field">
            {label && (
                <label className="label" htmlFor={id}>
                    {label}
                </label>
            )}
            <input
                id={id}
                className={`input ${className} ${error ? 'invalid' : ''}`}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                autoComplete={autoComplete}
                {...props}
            />
            {error && <div className="error-text">{error}</div>}
        </div>
    );
}