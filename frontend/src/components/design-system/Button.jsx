import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconRight,
  children,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const base = 'font-semibold rounded-bn-md transition-all duration-200 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-offset-1';

  const variants = {
    primary: 'bg-bn-primary text-white hover:brightness-110 hover:shadow-soft-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-primary-500/30',
    secondary: 'bg-bn-bg-secondary text-bn-text border border-bn-border hover:bg-bn-surface-hover active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-neutral-400/30',
    outline: 'border-2 border-bn-primary text-bn-primary hover:bg-primary-50 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-primary-500/30',
    ghost: 'text-bn-text-secondary hover:bg-bn-surface-hover hover:text-bn-text active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-neutral-400/30',
    danger: 'bg-bn-danger text-white hover:brightness-110 hover:shadow-soft-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-red-500/30',
    success: 'bg-bn-success text-white hover:brightness-110 hover:shadow-soft-md active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed focus:ring-green-500/30',
    icon: 'text-bn-text-secondary hover:bg-bn-surface-hover hover:text-bn-text rounded-full disabled:opacity-50 disabled:cursor-not-allowed focus:ring-neutral-400/30',
  };

  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const iconSizes = {
    xs: 'p-1',
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-2.5',
  };

  const classes = clsx(
    base,
    variants[variant],
    variant === 'icon' ? iconSizes[size] : sizes[size],
    (disabled || loading) && 'pointer-events-none',
    className
  );

  const handleClick = (e) => {
    if (!disabled && !loading && onClick) onClick(e);
  };

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      className={classes}
      disabled={disabled || loading}
      type={type}
      onClick={handleClick}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {icon && !loading && icon}
      {children}
      {iconRight && !loading && iconRight}
    </motion.button>
  );
};

export default Button;
