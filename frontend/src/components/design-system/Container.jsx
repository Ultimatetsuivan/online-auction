import React from 'react';
import clsx from 'clsx';

export const Container = ({
  children,
  size = 'default',
  className = '',
  ...props
}) => {
  const sizes = {
    sm: 'max-w-3xl',
    default: 'max-w-bn',
    lg: 'max-w-7xl',
    full: 'max-w-full',
  };

  return (
    <div
      className={clsx('mx-auto px-4 sm:px-6 lg:px-8', sizes[size], className)}
      {...props}
    >
      {children}
    </div>
  );
};

export default Container;
