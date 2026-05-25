import React from 'react';
import { motion } from 'framer-motion';
import clsx from 'clsx';

export const Card = ({
  children,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  interactive = false,
  className = '',
  onClick,
  ...props
}) => {
  const base = 'bg-bn-surface rounded-bn-lg transition-all duration-200';

  const variants = {
    default: 'shadow-card border border-bn-border',
    bordered: 'border border-bn-border',
    elevated: 'shadow-soft-md',
    flat: 'bg-bn-bg-secondary',
    interactive: 'shadow-card border border-bn-border hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const hoverClasses = hoverable && variant !== 'interactive'
    ? 'hover:shadow-card-hover hover:-translate-y-0.5 cursor-pointer'
    : '';

  const classes = clsx(
    base,
    variants[interactive ? 'interactive' : variant],
    paddings[padding],
    hoverClasses,
    className
  );

  if (hoverable || interactive || onClick) {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.995 }}
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
