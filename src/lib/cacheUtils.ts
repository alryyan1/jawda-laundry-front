// Utility functions for managing localStorage cache

interface CachedData<T> {
  data: T;
  timestamp: number;
}

export const CACHE_KEYS = {
  PRODUCT_CATEGORIES: 'productCategories',
} as const;

export const CACHE_DURATIONS = {
  PRODUCT_CATEGORIES: 60 * 60 * 1000, // 1 hour
} as const;

/**
 * Save data to localStorage with timestamp
 */
export function saveToCache<T>(key: string, data: T): void {
  try {
    const cachedData: CachedData<T> = {
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(key, JSON.stringify(cachedData));
  } catch (error) {
    console.error(`Error saving to cache (${key}):`, error);
  }
}

/**
 * Load data from localStorage with expiration check
 */
export function loadFromCache<T>(key: string, maxAge: number): T | null {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    const cachedData: CachedData<T> = JSON.parse(cached);
    const isExpired = (Date.now() - cachedData.timestamp) > maxAge;

    if (isExpired) {
      localStorage.removeItem(key);
      return null;
    }

    return cachedData.data;
  } catch (error) {
    console.error(`Error loading from cache (${key}):`, error);
    return null;
  }
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error clearing cache (${key}):`, error);
  }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  try {
    Object.values(CACHE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing all cache:', error);
  }
}
