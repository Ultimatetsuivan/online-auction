import React from 'react';
import clsx from 'clsx';

const sizeClasses = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
};

export const Avatar = ({
  src,
  alt = '',
  name = '',
  size = 'md',
  className = '',
  ...props
}) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name}
        className={clsx(
          'rounded-full object-cover flex-shrink-0',
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }

  return (
    <div
      className={clsx(
        'rounded-full flex-shrink-0 flex items-center justify-center font-semibold bg-primary-100 text-primary-700',
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {initials}
    </div>
  );
};

export default Avatar;
