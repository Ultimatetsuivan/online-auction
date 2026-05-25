import React from 'react';
import clsx from 'clsx';

const variantClasses = {
  primary: 'bg-primary-50 text-primary-700',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
  neutral: 'bg-bn-bg-secondary text-bn-text-secondary backdrop-blur-sm',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1 text-sm',
};

export const Badge = ({
  variant = 'neutral',
  size = 'md',
  dot = false,
  children,
  className = '',
  ...props
}) => {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 font-semibold rounded-bn-full whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {dot && (
        <span className={clsx(
          'w-1.5 h-1.5 rounded-full',
          variant === 'success' && 'bg-green-500',
          variant === 'danger' && 'bg-red-500',
          variant === 'warning' && 'bg-amber-500',
          variant === 'primary' && 'bg-primary-500',
          variant === 'info' && 'bg-blue-500',
          variant === 'neutral' && 'bg-neutral-400',
        )} />
      )}
      {children}
    </span>
  );
};

export default Badge;
