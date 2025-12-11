import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import ErrorHandler from '../utils/errorHandler';
import { Product } from '../types';
import { cacheManager } from '../utils/cache';

interface UseProductsOptions {
  categoryId?: string;
  searchQuery?: string;
  enabled?: boolean;
}

export function useProducts(options: UseProductsOptions = {}) {
  const { categoryId, searchQuery, enabled = true } = options;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = useCallback(async () => {
    if (!enabled) return;

    try {
      setError(null);
      
      // Try cache first
      const cacheKey = `products_${categoryId || 'all'}_${searchQuery || ''}`;
      const cached = await cacheManager.get<Product[]>(cacheKey);
      
      if (cached && !refreshing) {
        setProducts(cached);
        setLoading(false);
        // Still fetch in background to update cache
      }

      const response = await api.get('/api/product/products');
      const productsData = response.data?.data || response.data || [];
      
      // Filter by category if provided
      let filtered = productsData;
      if (categoryId) {
        filtered = productsData.filter((p: Product) => 
          p.category === categoryId || (typeof p.category === 'object' && p.category?._id === categoryId)
        );
      }

      // Filter by search query if provided
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filtered = filtered.filter((p: Product) =>
          p.title.toLowerCase().includes(query)
        );
      }

      setProducts(filtered);
      
      // Cache the results
      await cacheManager.set(cacheKey, filtered, 2 * 60 * 1000); // 2 minutes
    } catch (err) {
      const errorMessage = ErrorHandler.getErrorMessage(err);
      setError(errorMessage);
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [categoryId, searchQuery, enabled, refreshing]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchProducts();
  }, [fetchProducts]);

  return {
    products,
    loading,
    error,
    refreshing,
    refresh,
    refetch: fetchProducts,
  };
}

