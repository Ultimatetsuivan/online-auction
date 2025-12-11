import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { buildApiUrl, getAuthToken } from '../config/api';

const LikedProductsContext = createContext();

export const useLikedProducts = () => {
  const context = useContext(LikedProductsContext);
  if (!context) {
    throw new Error('useLikedProducts must be used within LikedProductsProvider');
  }
  return context;
};

const loadLocalLikes = () => {
  try {
    const saved = localStorage.getItem('likedProducts');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Error loading liked products:', error);
    return [];
  }
};

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.error('Failed to parse stored user:', error);
    return null;
  }
};

const normalizeProduct = (product, meta = {}) => {
  if (!product) return null;

  const normalizedId = product._id || product.id || meta._id;
  if (!normalizedId) return null;

  return {
    _id: normalizedId,
    title: product.title ?? meta.title ?? '',
    price: product.price ?? meta.price ?? 0,
    currentBid: product.currentBid ?? meta.currentBid ?? null,
    images: Array.isArray(product.images)
      ? product.images
      : product.image
        ? [{ url: product.image, isPrimary: true }]
        : meta.images || [],
    category: product.category ?? meta.category ?? null,
    brand: product.brand ?? meta.brand ?? null,
    condition: product.condition ?? meta.condition ?? null,
    description: product.description ?? meta.description ?? '',
    bidDeadline: product.bidDeadline ?? meta.bidDeadline ?? null,
    sold: typeof product.sold === 'boolean' ? product.sold : (typeof meta.sold === 'boolean' ? meta.sold : false),
    likedAt: meta.likedAt || product.likedAt || new Date().toISOString()
  };
};

const getAuthDetails = () => {
  const storedUser = getStoredUser();
  const token = storedUser?.token || getAuthToken();
  const userId = storedUser?._id || storedUser?.id || null;
  return token ? { token, userId } : null;
};

export const LikedProductsProvider = ({ children }) => {
  const [likedProducts, setLikedProducts] = useState(() => loadLocalLikes());
  const [authInfo, setAuthInfo] = useState(() => getAuthDetails());
  const [isSyncing, setIsSyncing] = useState(false);

  // Track auth changes (login / logout across app)
  const refreshAuthInfo = useCallback(() => {
    setAuthInfo(getAuthDetails());
  }, []);

  useEffect(() => {
    refreshAuthInfo();
    window.addEventListener('userLogin', refreshAuthInfo);
    window.addEventListener('storage', refreshAuthInfo);

    return () => {
      window.removeEventListener('userLogin', refreshAuthInfo);
      window.removeEventListener('storage', refreshAuthInfo);
    };
  }, [refreshAuthInfo]);

  // Sync liked products to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('likedProducts', JSON.stringify(likedProducts));
  }, [likedProducts]);

  const syncFromServer = useCallback(
    async (token) => {
      if (!token) return;
      setIsSyncing(true);
      try {
        const response = await axios.get(
          buildApiUrl('/api/likes/my'),
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const likesArray = Array.isArray(response.data?.likes)
          ? response.data.likes
              .map(like => normalizeProduct(like?.product, { likedAt: like?.createdAt }))
              .filter(Boolean)
          : [];

        setLikedProducts(likesArray);
      } catch (error) {
        console.error('Failed to sync liked products from server:', error);
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  // Fetch liked products when authenticated, or load from localStorage for guests
  useEffect(() => {
    if (authInfo?.token) {
      syncFromServer(authInfo.token);
    } else {
      // For guests, keep localStorage data (they can browse with local likes)
      setLikedProducts(loadLocalLikes());
    }
  }, [authInfo?.token, syncFromServer]);

  const getProductId = (product) => {
    return product?._id || product?.id || product?.productId || null;
  };

  const updateLocalLikes = useCallback((product, shouldBeLiked) => {
    const productId = getProductId(product);
    if (!productId) return;
    const normalizedId = productId.toString();

    setLikedProducts(prev => {
      const exists = prev.some(p => p._id?.toString() === normalizedId);
      if (shouldBeLiked) {
        const normalizedProduct = normalizeProduct(product, { _id: normalizedId });
        if (!normalizedProduct) return prev;

        if (exists) {
          return prev.map(p => (p._id?.toString() === normalizedId ? { ...p, ...normalizedProduct } : p));
        }
        return [...prev, normalizedProduct];
      }
      return prev.filter(p => p._id?.toString() !== normalizedId);
    });
  }, []);

  const toggleLike = async (product) => {
    const productId = getProductId(product);
    if (!productId) return;

    const normalizedId = productId.toString();
    const currentlyLiked = likedProducts.some(p => p._id?.toString() === normalizedId);
    const token = authInfo?.token || getAuthToken();

    if (!token) {
      updateLocalLikes(product, !currentlyLiked);
      return;
    }

    try {
      const response = await axios.post(
        buildApiUrl(`/api/likes/${normalizedId}`),
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const serverLiked = !!response.data?.liked;
      updateLocalLikes(product, serverLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Fall back to optimistic local toggle so the UI still responds
      updateLocalLikes(product, !currentlyLiked);
    }
  };

  const isLiked = (productId) => {
    if (!productId) return false;
    const normalizedId = productId.toString();
    return likedProducts.some(p => p._id?.toString() === normalizedId);
  };

  const clearAllLikes = () => {
    setLikedProducts([]);
    localStorage.removeItem('likedProducts');
  };

  const removeLike = useCallback((productId) => {
    if (!productId) return;
    const normalizedId = productId.toString();
    setLikedProducts(prev => prev.filter(p => p._id?.toString() !== normalizedId));
  }, []);

  return (
    <LikedProductsContext.Provider
      value={{
        likedProducts,
        toggleLike,
        isLiked,
        clearAllLikes,
        removeLike,
        isSyncing
      }}
    >
      {children}
    </LikedProductsContext.Provider>
  );
};

export default LikedProductsContext;
