import React from 'react';
import { useLikedProducts } from '../context/LikedProductsContext';
import { useToast } from './common/Toast';

// Supports either a full product object or just a productId
export const LikeButton = ({ product, productId, size = 'md', className = '' }) => {
  const { isLiked, toggleLike } = useLikedProducts();
  const toast = useToast();

  const id = product?._id || productId;
  const normalizedProduct = product || (id ? { _id: id } : null);

  if (!id || !normalizedProduct) {
    return null;
  }

  const liked = isLiked(id);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const wasLiked = liked;
      toggleLike(normalizedProduct);

      if (wasLiked) {
        toast.info('Removed from watchlist');
      } else {
        toast.success('Added to watchlist');
      }
    } catch (error) {
      console.error('Watchlist error:', error);
      toast.error('Unable to update watchlist');
    }
  };

  const sizeMap = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  };

  return (
    <button
      className={`rounded-full flex items-center justify-center transition-all shadow-sm border-2 ${
        liked
          ? 'bg-bn-primary border-bn-primary text-white'
          : 'bg-black/50 border-white/50 text-white hover:bg-bn-primary/80 hover:border-bn-primary'
      } ${sizeMap[size] || sizeMap.md} ${className}`}
      onClick={handleClick}
      title={liked ? 'In watchlist' : 'Add to watchlist'}
    >
      <i
        className={`bi ${liked ? 'bi-eye-fill' : 'bi-eye'}`}
        style={{
          animation: liked ? 'eyePulse 0.3s ease' : 'none',
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
