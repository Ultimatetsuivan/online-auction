import { useState, useEffect } from 'react';

export const useLikedProducts = () => {
  const [likedProducts, setLikedProducts] = useState([]);

  // Load liked products from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('likedProducts');
    if (saved) {
      try {
        setLikedProducts(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading liked products:', error);
        setLikedProducts([]);
      }
    }
  }, []);

  // Save to localStorage whenever likedProducts changes
  useEffect(() => {
    localStorage.setItem('likedProducts', JSON.stringify(likedProducts));
  }, [likedProducts]);

  const toggleLike = (product) => {
    setLikedProducts(prev => {
      const isLiked = prev.some(p => p._id === product._id);

      if (isLiked) {
        // Remove from liked
        return prev.filter(p => p._id !== product._id);
      } else {
        // Add to liked
        return [...prev, {
          _id: product._id,
          title: product.title,
          price: product.price,
          currentBid: product.currentBid,
          images: product.images,
          category: product.category,
          brand: product.brand,
          condition: product.condition,
          likedAt: new Date().toISOString()
        }];
      }
    });
  };

  const isLiked = (productId) => {
    return likedProducts.some(p => p._id === productId);
  };

  const clearAllLikes = () => {
    setLikedProducts([]);
    localStorage.removeItem('likedProducts');
  };

  return {
    likedProducts,
    toggleLike,
    isLiked,
    clearAllLikes
  };
};

export default useLikedProducts;
