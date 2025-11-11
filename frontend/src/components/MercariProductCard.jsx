import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const MercariProductCard = ({ product, showLikeButton = false, onLikeClick }) => {
  const { isDarkMode } = useTheme();
  
  const imageUrl = product.images?.find(img => img.isPrimary)?.url || product.images?.[0]?.url || '/default.png';
  const price = product.currentBid || product.price;
  const isSold = product.sold || !product.available;

  return (
    <Link 
      to={`/products/${product._id}`} 
      className="text-decoration-none mercari-product-card"
      style={{ 
        color: 'inherit',
        display: 'block'
      }}
    >
      <div className="mercari-card-wrapper">
        {/* Image Container */}
        <div className="mercari-image-container">
          <img
            src={imageUrl}
            alt={product.title}
            className="mercari-product-image"
            loading="lazy"
          />
          
          {/* SOLD Badge */}
          {isSold && (
            <span className="mercari-sold-text">SOLD</span>
          )}
          
          {/* Price Overlay */}
          <div className="mercari-price-overlay">
            <span className="mercari-price-text">₮{price.toLocaleString()}</span>
          </div>
          
          {/* Like Button */}
          {showLikeButton && (
            <button
              className="mercari-like-button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (onLikeClick) {
                  onLikeClick(product);
                }
              }}
              aria-label="Like product"
            >
              <i className="bi bi-heart-fill"></i>
            </button>
          )}
          
          {/* Additional Badges */}
          {product.condition === 'like-new' && (
            <div className="mercari-badge mercari-badge-top-left" style={{ backgroundColor: '#FF6A00' }}>
              <span className="mercari-badge-text">美品</span>
            </div>
          )}
        </div>
        
        {/* Product Title */}
        <div className="mercari-product-title">
          <p className="mb-0" style={{
            color: isDarkMode ? 'var(--color-text)' : '#2c3e50',
            fontSize: '0.9rem',
            lineHeight: '1.4',
            minHeight: '2.8rem',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {product.title}
          </p>
        </div>
      </div>
    </Link>
  );
};

