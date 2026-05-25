import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * ProductImage Component
 * Displays product images with proper fallback handling
 */
export const ProductImage = ({
  product,
  src,
  alt,
  className = '',
  style = {},
  fallbackStyle = {},
  fallbackIconSize = '3rem',
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const [imageError, setImageError] = useState(false);

  const normalizeEntry = (entry) => {
    if (!entry) return null;
    if (typeof entry === 'string') return entry;
    return entry.url || entry.path || entry.secure_url || null;
  };

  // Find the image URL (primary first, then first available), or accept direct src prop
  const imageUrl =
    src ||
    normalizeEntry(product?.images?.find((img) => img?.isPrimary)) ||
    normalizeEntry(product?.images?.[0]) ||
    normalizeEntry(product?.imageUrls?.[0]) ||
    normalizeEntry(product?.imageUrl) ||
    normalizeEntry(product?.image);

  // If there's a valid image URL and no error, display the image
  if (imageUrl && !imageError) {
    return (
      <img
        src={imageUrl}
        alt={alt || product?.title || 'Product image'}
        className={className}
        style={style}
        onError={() => setImageError(true)}
        loading="lazy"
        {...props}
      />
    );
  }

  // Otherwise, display a fallback placeholder
  return (
    <div
      className={`${className} flex items-center justify-center bg-bn-bg-secondary`}
      style={{
        ...style,
        ...fallbackStyle
      }}
      {...props}
    >
      <i className="bi bi-image text-bn-text-secondary" style={{ fontSize: fallbackIconSize }}></i>
    </div>
  );
};
