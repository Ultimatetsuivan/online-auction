import React, { forwardRef } from 'react';
import { IoSearchOutline, IoCloseOutline } from 'react-icons/io5';
import clsx from 'clsx';

export const SearchInput = forwardRef(({
  value = '',
  onChange,
  onClear,
  onSubmit,
  placeholder = 'Search...',
  className = '',
  ...props
}, ref) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit?.(value);
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('relative w-full', className)}>
      <div className="relative flex items-center">
        <IoSearchOutline className="absolute left-3.5 text-bn-text-tertiary" size={18} />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 rounded-bn-full bg-bn-bg-secondary border-0 text-sm text-bn-text placeholder:text-bn-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
          {...props}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 text-bn-text-tertiary hover:text-bn-text transition-colors"
          >
            <IoCloseOutline size={18} />
          </button>
        )}
      </div>
    </form>
  );
});

SearchInput.displayName = 'SearchInput';

export default SearchInput;
