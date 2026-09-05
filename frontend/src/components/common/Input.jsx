import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Input = ({
  label,
  id,
  type = 'text',
  error,
  required = false,
  placeholder,
  value,
  onChange,
  disabled = false,
  rightIcon,
  className = '',
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {required && <span className="required">*</span>}
        </label>
      )}
      <div className="input-wrapper">
        <input
          id={inputId}
          type={type}
          className={`form-control ${error ? 'is-invalid' : ''} ${className}`.trim()}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        {rightIcon && <div className="input-icon-right">{rightIcon}</div>}
      </div>
      {error && (
        <div className="form-error-msg">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default Input;
