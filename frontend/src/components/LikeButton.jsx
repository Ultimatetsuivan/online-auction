import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useLikedProducts } from '../context/LikedProductsContext';
import { useToast } from './common/Toast';

export const LikeButton = ({ product, size = 'md', className = '' }) => {
  const { isLiked, toggleLike } = useLikedProducts();
  const toast = useToast();
  const liked = isLiked(product._id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const wasLiked = liked;
      toggleLike(product);

      if (wasLiked) {
        toast.info('Watchlist-аас хасагдлаа');
      } else {
        toast.success('Watchlist-д нэмэгдлээ! 👁️');
      }
    } catch (error) {
      console.error('Watchlist error:', error);
      toast.error('Алдаа гарлаа');
    }
  };

  const sizeStyles = {
    sm: {
      button: 'btn-sm',
      icon: 'fs-6',
      padding: '0.25rem 0.5rem'
    },
    md: {
      button: '',
      icon: 'fs-5',
      padding: '0.5rem 0.75rem'
    },
    lg: {
      button: 'btn-lg',
      icon: 'fs-4',
      padding: '0.75rem 1rem'
    }
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      className={`btn ${currentSize.button} ${className}`}
      onClick={handleClick}
      style={{
        backgroundColor: liked ? '#FF6A00' : 'rgba(0, 0, 0, 0.5)',
        border: liked ? '2px solid #FF6A00' : '2px solid rgba(255, 255, 255, 0.5)',
        color: liked ? 'white' : 'white',
        padding: currentSize.padding,
        borderRadius: '50%',
        width: size === 'sm' ? '32px' : size === 'lg' ? '48px' : '40px',
        height: size === 'sm' ? '32px' : size === 'lg' ? '48px' : '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}
      title={liked ? 'Watchlist-аас хасах' : 'Watchlist-д нэмэх'}
      onMouseEnter={(e) => {
        if (!liked) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 106, 0, 0.8)';
          e.currentTarget.style.borderColor = '#FF6A00';
          e.currentTarget.style.color = 'white';
        }
      }}
      onMouseLeave={(e) => {
        if (!liked) {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.5)';
          e.currentTarget.style.color = 'white';
        }
      }}
    >
      <i
        className={`bi ${liked ? 'bi-eye-fill' : 'bi-eye'} ${currentSize.icon}`}
        style={{
          animation: liked ? 'eyePulse 0.3s ease' : 'none',
          display: 'inline-block',
          fontSize: size === 'sm' ? '0.875rem' : size === 'lg' ? '1.25rem' : '1rem',
          lineHeight: 1,
          color: 'inherit'
        }}
      ></i>
      <style>
        {`
          @keyframes eyePulse {
            0%, 100% { transform: scale(1); }
            25% { transform: scale(1.2); }
            50% { transform: scale(1); }
            75% { transform: scale(1.1); }
          }
        `}
      </style>
    </button>
  );
};

export default LikeButton;
