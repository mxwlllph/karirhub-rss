/**
 * Cache Manager Module
 * Handles intelligent caching with KV storage
 * Implements multi-level caching strategies
 */

import { CONFIG, CACHE_STRATEGY } from '../config/environment.js';

/**
 * Cache Manager Class
 */
export class CacheManager {
  /**
   * Constructor
   * @param {Object} kvStore - Cloudflare KV store instance
   */
  constructor(kvStore) {
    if (!kvStore) {
      console.warn('CacheManager: No KV store provided - caching will be disabled');
      this.kvStore = null;
    } else {
      this.kvStore = kvStore;
    }
    this.defaultTTL = CONFIG.CACHE_TTL;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Get data from cache
   * @param {string} key - Cache key
   * @param {string} type - Cache type (determines TTL)
   * @returns {Promise<any>} - Cached data or null
   */
  async get(key, type = 'default') {
    if (!this.kvStore) {
      this.cacheStats.misses++;
      return null;
    }

    try {
      const cacheKey = this.buildCacheKey(key, type);
      const cached = await this.kvStore.get(cacheKey, 'json');

      if (!cached) {
        this.cacheStats.misses++;
        return null;
      }

      // Check if cache entry is expired
      if (this.isExpired(cached)) {
        this.cacheStats.misses++;
        console.log(`Cache entry expired for ${cacheKey}`);
        await this.delete(cacheKey, type);
        return null;
      }

      this.cacheStats.hits++;
      console.log(`Cache hit for ${cacheKey} (age: ${this.getCacheAge(cached)}s)`);
      return cached.data;

    } catch (error) {
      this.cacheStats.errors++;
      console.error(`Cache get error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   * @param {string} type - Cache type (determines TTL)
   * @param {number} customTTL - Custom TTL in seconds
   * @returns {Promise<boolean>} - True if successful
   */
  async set(key, data, type = 'default', customTTL = null) {
    if (!this.kvStore) {
      console.warn(`Cache disabled - skipping set operation for ${key}`);
      return false;
    }

    try {
      const cacheKey = this.buildCacheKey(key, type);
      const ttl = customTTL || CACHE_STRATEGY[type] || this.defaultTTL;

      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl,
        type,
        version: '1.0'
      };

      // Store in KV with expiration
      await this.kvStore.put(cacheKey, JSON.stringify(cacheEntry), {
        expirationTtl: ttl
      });

      console.log(`Cached ${cacheKey} with TTL ${ttl}s`);
      return true;

    } catch (error) {
      console.error(`Cache set error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Delete data from cache
   * @param {string} key - Cache key
   * @param {string} type - Cache type
   * @returns {Promise<boolean>} - True if successful
   */
  async delete(key, type = 'default') {
    try {
      const cacheKey = this.buildCacheKey(key, type);
      await this.kvStore.delete(cacheKey);
      console.log(`Deleted cache entry ${cacheKey}`);
      return true;

    } catch (error) {
      console.error(`Cache delete error for ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all cache entries (for a specific type or all)
   * @param {string} type - Cache type to clear (optional)
   * @returns {Promise<boolean>} - True if successful
   */
  async clear(type = null) {
    try {
      if (type) {
        // Clear specific cache type
        const prefix = this.buildCacheKey('', type);
        const list = await this.kvStore.list({ prefix });

        const deletePromises = list.keys.map(key =>
          this.kvStore.delete(key.name)
        );

        await Promise.all(deletePromises);
        console.log(`Cleared ${list.keys.length} entries for cache type: ${type}`);
      } else {
        // Clear all cache (limited to recent entries)
        const list = await this.kvStore.list({ limit: 1000 });

        const deletePromises = list.keys.map(key =>
          this.kvStore.delete(key.name)
        );

        await Promise.all(deletePromises);
        console.log(`Cleared ${list.keys.length} cache entries`);
      }

      // Reset stats
      this.resetStats();
      return true;

    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  /**
   * Build cache key with type prefix
   * @param {string} key - Original key
   * @param {string} type - Cache type
   * @returns {string} - Formatted cache key
   */
  buildCacheKey(key, type) {
    const prefix = `${CONFIG.ENVIRONMENT}_${type}`;
    return key ? `${prefix}:${key}` : prefix;
  }

  /**
   * Check if cache entry is expired
   * @param {Object} cacheEntry - Cache entry object
   * @returns {boolean} - True if expired
   */
  isExpired(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) {
      return true;
    }

    const age = Date.now() - cacheEntry.timestamp;
    const maxAge = (cacheEntry.ttl || this.defaultTTL) * 1000;

    return age > maxAge;
  }

  /**
   * Get cache age in seconds
   * @param {Object} cacheEntry - Cache entry object
   * @returns {number} - Age in seconds
   */
  getCacheAge(cacheEntry) {
    if (!cacheEntry || !cacheEntry.timestamp) {
      return 0;
    }

    return Math.floor((Date.now() - cacheEntry.timestamp) / 1000);
  }

  /**
   * Get or set cache with fallback function
   * @param {string} key - Cache key
   * @param {string} type - Cache type
   * @param {Function} fallback - Function to generate data if cache miss
   * @param {number} customTTL - Custom TTL
   * @returns {Promise<any>} - Data from cache or fallback
   */
  async getOrSet(key, type, fallback, customTTL = null) {
    // Try to get from cache first
    const cached = await this.get(key, type);
    if (cached !== null) {
      return cached;
    }

    // Generate fresh data
    try {
      const data = await fallback();

      // Cache the result
      await this.set(key, data, type, customTTL);

      return data;
    } catch (error) {
      console.error(`Fallback function failed for ${key}:`, error);
      throw error;
    }
  }

  /**
   * Warm up cache with common data
   * @returns {Promise<boolean>} - True if successful
   */
  async warmUp() {
    try {
      console.log('Starting cache warm-up...');

      const warmUpTasks = [
        this.warmUpJobListings(),
        this.warmUpAPIHealth()
      ];

      await Promise.all(warmUpTasks);
      console.log('Cache warm-up completed');
      return true;

    } catch (error) {
      console.error('Cache warm-up failed:', error);
      return false;
    }
  }

  /**
   * Warm up job listings cache
   * @returns {Promise<void>}
   */
  async warmUpJobListings() {
    try {
      // This would typically import and use the API fetcher
      // For now, we'll just log the intention
      console.log('Warming up job listings cache...');

      // In a real implementation:
      // const apiFetcher = new APIFetcher();
      // const listings = await apiFetcher.fetchJobListings(1, 10);
      // await this.set('job_listings_10', listings, 'job_listings');

    } catch (error) {
      console.error('Failed to warm up job listings:', error);
    }
  }

  /**
   * Warm up API health cache
   * @returns {Promise<void>}
   */
  async warmUpAPIHealth() {
    try {
      console.log('Warming up API health cache...');

      const healthData = {
        status: 'healthy',
        timestamp: Date.now(),
        lastCheck: new Date().toISOString()
      };

      await this.set('api_health', healthData, 'api_health');

    } catch (error) {
      console.error('Failed to warm up API health:', error);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache statistics
   */
  getStats() {
    const totalRequests = this.cacheStats.hits + this.cacheStats.misses;
    const hitRate = totalRequests > 0 ? (this.cacheStats.hits / totalRequests * 100).toFixed(2) : 0;

    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      errors: this.cacheStats.errors,
      hitRate: `${hitRate}%`,
      totalRequests,
      uptime: Date.now() - this.cacheStats.lastReset,
      lastReset: new Date(this.cacheStats.lastReset).toISOString()
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.cacheStats = {
      hits: 0,
      misses: 0,
      errors: 0,
      lastReset: Date.now()
    };
  }

  /**
   * Perform cache health check
   * @returns {Promise<Object>} - Health check result
   */
  async healthCheck() {
    try {
      const testKey = 'health_check_test';
      const testData = { test: true, timestamp: Date.now() };

      // Test write
      const writeSuccess = await this.set(testKey, testData, 'test');
      if (!writeSuccess) {
        throw new Error('Cache write failed');
      }

      // Test read
      const readData = await this.get(testKey, 'test');
      if (!readData || readData.test !== true) {
        throw new Error('Cache read failed');
      }

      // Test delete
      const deleteSuccess = await this.delete(testKey, 'test');
      if (!deleteSuccess) {
        throw new Error('Cache delete failed');
      }

      // Get cache info
      const stats = this.getStats();

      return {
        healthy: true,
        message: 'All cache operations successful',
        stats,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      return {
        healthy: false,
        message: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get cache size information
   * @returns {Promise<Object>} - Cache size info
   */
  async getCacheSize() {
    try {
      const list = await this.kvStore.list({ limit: 1000 });

      const sizeByType = {};

      for (const key of list.keys) {
        const type = key.name.split(':')[0]?.split('_')[1] || 'unknown';
        sizeByType[type] = (sizeByType[type] || 0) + 1;
      }

      return {
        totalKeys: list.keys.length,
        sizeByType,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Failed to get cache size:', error);
      return {
        totalKeys: 0,
        sizeByType: {},
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Cache multiple items in batch
   * @param {Array} items - Array of {key, data, type, ttl} objects
   * @returns {Promise<Array>} - Array of success/failure results
   */
  async setBatch(items) {
    const results = await Promise.allSettled(
      items.map(item => this.set(item.key, item.data, item.type, item.ttl))
    );

    return results.map((result, index) => ({
      key: items[index].key,
      success: result.status === 'fulfilled',
      error: result.status === 'rejected' ? result.reason : null
    }));
  }

  /**
   * Get multiple items in batch
   * @param {Array} keys - Array of {key, type} objects
   * @returns {Promise<Array>} - Array of cached data or null
   */
  async getBatch(keys) {
    const results = await Promise.allSettled(
      keys.map(item => this.get(item.key, item.type))
    );

    return results.map(result =>
      result.status === 'fulfilled' ? result.value : null
    );
  }

  /**
   * Advanced caching with stale-while-revalidate
   * @param {string} key - Cache key
   * @param {string} type - Cache type
   * @param {Function} fallback - Function to generate fresh data
   * @param {number} swrTTL - Stale-while-revalidate TTL (seconds)
   * @returns {Promise<any>} - Data (possibly stale)
   */
  async getWithSWR(key, type, fallback, swrTTL = null) {
    const cached = await this.get(key, type);

    if (cached) {
      // Check if data is stale but still usable
      const cacheEntry = await this.kvStore.get(this.buildCacheKey(key, type), 'json');

      if (cacheEntry && this.isStale(cacheEntry, swrTTL)) {
        console.log(`Serving stale data for ${key}, refreshing in background`);

        // Refresh cache in background without blocking
        this.refreshInBackground(key, type, fallback).catch(error => {
          console.error(`Background refresh failed for ${key}:`, error);
        });
      }

      return cached;
    }

    // No cache hit, fetch fresh data
    return this.getOrSet(key, type, fallback);
  }

  /**
   * Check if cache entry is stale but still within SWR window
   * @param {Object} cacheEntry - Cache entry object
   * @param {number} swrTTL - Stale-while-revalidate TTL
   * @returns {boolean} - True if stale but reusable
   */
  isStale(cacheEntry, swrTTL) {
    if (!swrTTL) return false;

    const age = Date.now() - cacheEntry.timestamp;
    const staleAge = swrTTL * 1000;

    return age > staleAge && age < (cacheEntry.ttl * 1000);
  }

  /**
   * Refresh cache in background
   * @param {string} key - Cache key
   * @param {string} type - Cache type
   * @param {Function} fallback - Function to generate fresh data
   * @returns {Promise<void>}
   */
  async refreshInBackground(key, type, fallback) {
    try {
      const data = await fallback();
      await this.set(key, data, type);
      console.log(`Background refresh completed for ${key}`);
    } catch (error) {
      console.error(`Background refresh failed for ${key}:`, error);
    }
  }
}

/**
 * Create singleton cache manager instance
 */
export let cacheManager = null;

/**
 * Initialize cache manager
 * @param {Object} kvStore - KV store instance
 * @returns {CacheManager} - Cache manager instance
 */
export function initializeCache(kvStore) {
  cacheManager = new CacheManager(kvStore);
  return cacheManager;
}

/**
 * Get cache manager instance
 * @returns {CacheManager} - Cache manager instance
 */
export function getCacheManager() {
  if (!cacheManager) {
    throw new Error('Cache manager not initialized. Call initializeCache() first.');
  }
  return cacheManager;
}

export default CacheManager;