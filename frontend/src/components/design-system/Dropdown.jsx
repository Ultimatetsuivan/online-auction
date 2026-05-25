import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export const Dropdown = ({
  isOpen,
  onClose,
  trigger,
  children,
  align = 'right',
  width = 'w-64',
  className = '',
}) => {
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        onClose?.();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  return (
    <div ref={ref} className="relative">
      {trigger}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
            className={clsx(
              'absolute z-50 mt-2 rounded-bn-lg bg-bn-surface border border-bn-border shadow-soft-lg overflow-hidden',
              align === 'right' ? 'right-0' : 'left-0',
              width,
              className
            )}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const DropdownItem = ({ children, onClick, danger = false, className = '', ...props }) => (
  <button
    onClick={onClick}
    className={clsx(
      'w-full text-left px-4 py-2.5 text-sm transition-colors',
      danger
        ? 'text-bn-danger hover:bg-red-50'
        : 'text-bn-text hover:bg-bn-surface-hover',
      className
    )}
    {...props}
  >
    {children}
  </button>
);

export const DropdownDivider = () => (
  <div className="h-px bg-bn-divider my-1" />
);

export const DropdownHeader = ({ children, className = '' }) => (
  <div className={clsx('px-4 py-2.5 text-xs font-semibold text-bn-text-tertiary uppercase tracking-wider', className)}>
    {children}
  </div>
);

export default Dropdown;
