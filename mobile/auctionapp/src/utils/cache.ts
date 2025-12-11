// Simple in-memory cache utility for API responses
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Memory cache (fast, but cleared on app restart)
  setMemory<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    });
  }

  getMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  clearMemory(key?: string): void {
    if (key) {
      this.memoryCache.delete(key);
    } else {
      this.memoryCache.clear();
    }
  }

  // Persistent cache (slower, but survives app restarts)
  async setPersistent<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiry: Date.now() + ttl,
      };
      await AsyncStorage.setItem(`cache_${key}`, JSON.stringify(entry));
    } catch (error) {
      console.error('Error setting persistent cache:', error);
    }
  }

  async getPersistent<T>(key: string): Promise<T | null> {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      if (Date.now() > entry.expiry) {
        await AsyncStorage.removeItem(`cache_${key}`);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.error('Error getting persistent cache:', error);
      return null;
    }
  }

  async clearPersistent(key?: string): Promise<void> {
    try {
      if (key) {
        await AsyncStorage.removeItem(`cache_${key}`);
      } else {
        // Clear all cache entries
        const keys = await AsyncStorage.getAllKeys();
        const cacheKeys = keys.filter(k => k.startsWith('cache_'));
        await AsyncStorage.multiRemove(cacheKeys);
      }
    } catch (error) {
      console.error('Error clearing persistent cache:', error);
    }
  }

  // Combined get (memory first, then persistent)
  async get<T>(key: string): Promise<T | null> {
    // Try memory first
    const memoryData = this.getMemory<T>(key);
    if (memoryData !== null) return memoryData;

    // Try persistent
    const persistentData = await this.getPersistent<T>(key);
    if (persistentData !== null) {
      // Restore to memory cache
      this.setMemory(key, persistentData);
      return persistentData;
    }

    return null;
  }

  // Combined set (both memory and persistent)
  async set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    this.setMemory(key, data, ttl);
    await this.setPersistent(key, data, ttl);
  }
}

export const cacheManager = new CacheManager();
export default cacheManager;


