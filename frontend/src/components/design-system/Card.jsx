import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

/**
 * Modern Card Component
 *
 * Features: hover effects, variants, padding options
 * Variants: default, bordered, elevated
 */
export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className = '',
  onClick,
  ...props
}) => {
  const baseClasses = 'bg-white rounded-xl transition-all duration-200';

  const variants = {
    default: 'shadow-soft border border-neutral-200',
    bordered: 'border-2 border-neutral-200',
    elevated: 'shadow-soft-lg',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hoverable
    ? 'hover:shadow-soft-md hover:-translate-y-1 cursor-pointer'
    : '';

  const classes = clsx(
    baseClasses,
    variants[variant],
    paddings[padding],
    hoverClasses,
    className
  );

  if (hoverable || onClick) {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)' }}
        whileTap={{ scale: 0.99 }}
        className={classes}
        onClick={onClick}
        {...props}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
