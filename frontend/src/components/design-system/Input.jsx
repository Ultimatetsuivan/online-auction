import React from 'react';
import clsx from 'clsx';

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
  variant = 'default',
  ...props
}) => {
  const inputBase = 'w-full rounded-bn-md px-4 py-2.5 text-sm font-sans transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 bg-bn-surface text-bn-text placeholder:text-bn-text-tertiary';

  const inputVariant = clsx({
    'border border-bn-border focus:border-bn-primary focus:ring-primary-500/20': !error && !success && variant === 'default',
    'border-0 bg-bn-bg-secondary focus:ring-primary-500/20': variant === 'search',
    'border border-red-400 focus:border-red-500 focus:ring-red-500/20': error,
    'border border-green-400 focus:border-green-500 focus:ring-green-500/20': success,
    'bg-bn-bg-secondary cursor-not-allowed opacity-60': disabled,
  });

  const InputElement = type === 'textarea' ? 'textarea' : 'input';

  return (
    <div className={clsx('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-bn-text">
          {label}
          {required && <span className="text-bn-danger ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {prefix && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-bn-text-tertiary">
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
            inputBase,
            inputVariant,
            prefix && 'pl-10',
            suffix && 'pr-10',
            type === 'textarea' && 'resize-y min-h-[100px]'
          )}
          {...props}
        />

        {suffix && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-bn-text-tertiary">
            {suffix}
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-bn-danger flex items-center gap-1">
          <i className="bi bi-exclamation-circle" />
          {error}
        </p>
      )}
      {success && !error && (
        <p className="text-xs text-bn-success flex items-center gap-1">
          <i className="bi bi-check-circle" />
          {success}
        </p>
      )}
      {helperText && !error && !success && (
        <p className="text-xs text-bn-text-tertiary">{helperText}</p>
      )}
    </div>
  );
};

export default Input;
