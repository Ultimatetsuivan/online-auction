import React from 'react';
import clsx from 'clsx';

/**
 * Modern Input Component
 *
 * Types: text, number, email, password, textarea
 * States: default, error, success
 * Features: label, helper text, prefix/suffix icons
 */
export const Input = ({
  type = 'text',
  label,
  placeholder,
  value,
  onChange,
  error,
  success,
  helperText,
  disabled = false,
  required = false,
  className = '',
  rows = 4,
  prefix,
  suffix,
  ...props
}) => {
  const inputBaseClasses = 'w-full border rounded-lg px-4 py-2.5 text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';

  const inputVariantClasses = clsx({
    'border-neutral-200 focus:border-primary-500 focus:ring-primary-500/20': !error && !success,
    'border-red-500 focus:border-red-500 focus:ring-red-500/20': error,
    'border-green-500 focus:border-green-500 focus:ring-green-500/20': success,
    'bg-neutral-50 cursor-not-allowed opacity-60': disabled,
    'bg-white': !disabled,
  });

  const InputElement = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={clsx('form-group-modern', className)}>
      {label && (
        <label className="label-modern">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {prefix}
          </div>
        )}

        <InputElement
          type={type !== 'textarea' ? type : undefined}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          rows={type === 'textarea' ? rows : undefined}
          className={clsx(
            inputBaseClasses,
            inputVariantClasses,
            prefix && 'pl-10',
            suffix && 'pr-10',
            type === 'textarea' && 'resize-y min-h-[100px]'
          )}
          {...props}
        />

        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500">
            {suffix}
          </div>
        )}
      </div>

      {error && (
        <p className="error-text flex items-center gap-1 mt-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      {success && !error && (
        <p className="success-text flex items-center gap-1 mt-1.5">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          {success}
        </p>
      )}

      {helperText && !error && !success && (
        <p className="helper-text mt-1.5">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
