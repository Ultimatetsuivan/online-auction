import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';

/**
 * ProductImage Component
 * Displays product images with proper fallback handling
 *
 * @param {Object} product - Product object with images array
 * @param {string} alt - Alt text for the image
 * @param {string} className - Additional CSS classes
 * @param {Object} style - Inline styles for the image
 * @param {Object} fallbackStyle - Inline styles for the fallback placeholder
 * @param {string} fallbackIconSize - Size of the fallback icon (default: '3rem')
 */
export const ProductImage = ({
  product,
  alt,
  className = '',
  style = {},
  fallbackStyle = {},
  fallbackIconSize = '3rem',
  ...props
}) => {
  const { isDarkMode } = useTheme();
  const [imageError, setImageError] = useState(false);

  // Find the image URL (primary first, then first available)
  const imageUrl = product?.images?.find(img => img.isPrimary)?.url || product?.images?.[0]?.url;

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
      className={`${className} d-flex align-items-center justify-content-center bg-light`}
      style={{
        backgroundColor: isDarkMode ? '#2d3748' : '#f8f9fa',
        ...style,
        ...fallbackStyle
      }}
      {...props}
    >
      <i className="bi bi-image text-muted" style={{ fontSize: fallbackIconSize }}></i>
    </div>
  );
};
