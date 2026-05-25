import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import clsx from 'clsx';
import { ProductImage } from '../ProductImage';
import { LikeButton } from '../LikeButton';
import Badge from './Badge';

/**
 * Unified ProductCard - replaces HomeCard, auction-card inline JSX, MercariProductCard
 * Variants: grid (default), compact, list
 */
export const ProductCard = ({
  product,
  variant = 'grid',
  formatPrice,
  formatTimeLeft,
  showLike = true,
  className = '',
}) => {
  if (!product || !product._id) return null;

  const getImageUrl = () => {
    const entry = product?.images?.find((img) => img?.isPrimary) || product?.images?.[0] || product?.imageUrls?.[0];
    if (!entry) return null;
    if (typeof entry === 'string') return entry;
    return entry.url || entry.path || entry.secure_url || null;
  };

  const imageUrl = getImageUrl();
  const currentPrice = product?.currentBid || product?.price;
  const isFixedPrice = product?.sellType === 'fixed' || product?.sellType === 'buy_now';
  const timeLeft = isFixedPrice ? '' : (formatTimeLeft?.(product.bidDeadline) || '');
  const isEnded = timeLeft === 'Ended';

  const currentUserId = (() => {
    try { return JSON.parse(localStorage.getItem('user'))?._id; } catch { return null; }
  })();
  const ownerId = product?.user?._id || product?.user?.id || product?.user;
  const isOwner = currentUserId && ownerId && currentUserId.toString() === ownerId.toString();

  if (variant === 'compact') {
    return (
      <Link to={`/products/${product._id}`} className="block no-underline group">
        <motion.div
          whileHover={{ y: -2 }}
          className={clsx('bg-bn-surface rounded-bn-lg overflow-hidden', className)}
        >
          <div className="relative aspect-square overflow-hidden bg-bn-bg-secondary">
            <ProductImage product={product} src={imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {timeLeft && (
              <Badge variant={isEnded ? 'danger' : 'neutral'} size="sm" className="absolute top-2 left-2">
                {timeLeft}
              </Badge>
            )}
          </div>
          <div className="p-3">
            <p className="text-sm font-medium text-bn-text truncate">{product.title}</p>
            <p className="text-sm font-bold text-bn-primary mt-1">{formatPrice?.(currentPrice)}</p>
          </div>
        </motion.div>
      </Link>
    );
  }

  if (variant === 'list') {
    return (
      <Link to={`/products/${product._id}`} className="block no-underline group">
        <motion.div
          whileHover={{ y: -1 }}
          className={clsx('bg-bn-surface rounded-bn-lg border border-bn-border overflow-hidden flex gap-4 p-4', className)}
        >
          <div className="relative w-32 h-32 flex-shrink-0 rounded-bn-md overflow-hidden bg-bn-bg-secondary">
            <ProductImage product={product} src={imageUrl} alt={product.title} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-semibold text-bn-text truncate">{product.title}</h3>
              <p className="text-sm text-bn-text-secondary mt-1 line-clamp-2">{product.description}</p>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-lg font-bold text-bn-primary">{formatPrice?.(currentPrice)}</span>
              {timeLeft && <Badge variant={isEnded ? 'danger' : 'warning'} size="sm">{timeLeft}</Badge>}
            </div>
          </div>
        </motion.div>
      </Link>
    );
  }

  // Default: grid variant
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={clsx('bg-bn-surface rounded-bn-lg shadow-card overflow-hidden group transition-shadow hover:shadow-card-hover', className)}
    >
      {/* Image */}
      <Link to={`/products/${product._id}`} className="block no-underline">
        <div className="relative aspect-[4/3] overflow-hidden bg-bn-bg-secondary">
          <ProductImage
            product={product}
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Badges */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
            {timeLeft && (
              <Badge variant={isEnded ? 'danger' : 'neutral'} size="sm">{timeLeft}</Badge>
            )}
          </div>
          {/* Like button */}
          {showLike && (
            <div className="absolute top-2.5 right-2.5" onClick={(e) => e.preventDefault()}>
              <LikeButton product={product} productId={product._id} size="sm" />
            </div>
          )}
          {/* Price overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-8">
            <span className="text-white font-bold text-lg drop-shadow-md">{formatPrice?.(currentPrice)}</span>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="p-4">
        <Link to={`/products/${product._id}`} className="block no-underline">
          <h3 className="text-sm font-semibold text-bn-text line-clamp-2 leading-snug hover:text-bn-primary transition-colors">
            {product.title || 'Гарчиггүй'}
          </h3>
        </Link>
        <div className="flex items-center justify-between mt-2 text-xs text-bn-text-tertiary">
          <span>{isFixedPrice ? 'Тогтмол үнэ' : `Эхлэх ${formatPrice?.(product?.price)}`}</span>
          <span>{product?.location || 'Нөөцтэй'}</span>
        </div>
        <div className="mt-3">
          <Link
            to={`/products/${product._id}`}
            className={`block w-full text-center py-2 rounded-bn-md text-sm font-semibold transition-all no-underline ${
              isOwner
                ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                : 'bg-bn-primary text-white hover:brightness-110'
            }`}
          >
            {isOwner ? 'Миний зар' : isFixedPrice ? 'Худалдаж авах' : 'Санал өгөх'}
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
