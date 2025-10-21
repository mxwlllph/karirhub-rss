/**
 * Analytics Module
 * Tracks RSS feed performance and usage statistics
 * Stores data in D1 database or KV storage
 */

import { CONFIG } from '../config/environment.js';

/**
 * Analytics Class
 */
export class Analytics {
  /**
   * Constructor
   * @param {Object} d1Database - D1 database instance (optional)
   * @param {Object} kvStore - KV store instance (fallback)
   */
  constructor(d1Database = null, kvStore = null) {
    this.db = d1Database;
    this.kvStore = kvStore;
    this.enabled = CONFIG.ENABLE_ANALYTICS;
  }

  /**
   * Track RSS feed request
   * @param {string} feedType - Type of feed (rss, json)
   * @param {string} resultType - Type of result (cache_hit, generated, error)
   * @param {number} responseTime - Response time in milliseconds
   * @param {number} jobCount - Number of jobs in feed
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<boolean>} - True if tracked successfully
   */
  async trackFeedRequest(feedType, resultType, responseTime, jobCount = 0, metadata = {}) {
    if (!this.enabled) {
      return true;
    }

    try {
      const event = {
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        hour: new Date().getHours(),
        feedType,
        resultType,
        responseTime,
        jobCount,
        userAgent: metadata.userAgent || 'unknown',
        ip: metadata.ip || 'unknown',
        country: metadata.country || 'unknown',
        referer: metadata.referer || 'unknown'
      };

      // Try D1 database first
      if (this.db) {
        await this.trackWithD1('feed_requests', event);
      } else if (this.kvStore) {
        await this.trackWithKV('feed_requests', event);
      }

      console.log(`Tracked feed request: ${feedType} - ${resultType} (${responseTime}ms)`);
      return true;

    } catch (error) {
      console.error('Failed to track feed request:', error);
      return false;
    }
  }

  /**
   * Track API request
   * @param {string} endpoint - API endpoint
   * @param {string} result - Result (success, error, timeout)
   * @param {number} responseTime - Response time in milliseconds
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<boolean>} - True if tracked successfully
   */
  async trackAPIRequest(endpoint, result, responseTime, metadata = {}) {
    if (!this.enabled) {
      return true;
    }

    try {
      const event = {
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours(),
        endpoint,
        result,
        responseTime,
        statusCode: metadata.statusCode || 0,
        errorType: metadata.errorType || 'none'
      };

      if (this.db) {
        await this.trackWithD1('api_requests', event);
      } else if (this.kvStore) {
        await this.trackWithKV('api_requests', event);
      }

      console.log(`Tracked API request: ${endpoint} - ${result} (${responseTime}ms)`);
      return true;

    } catch (error) {
      console.error('Failed to track API request:', error);
      return false;
    }
  }

  /**
   * Track error event
   * @param {string} errorType - Type of error
   * @param {string} errorMessage - Error message
   * @param {string} context - Context where error occurred
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<boolean>} - True if tracked successfully
   */
  async trackError(errorType, errorMessage, context, metadata = {}) {
    if (!this.enabled) {
      return true;
    }

    try {
      const event = {
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        hour: new Date().getHours(),
        errorType,
        errorMessage: errorMessage.substring(0, 500), // Limit length
        context,
        severity: metadata.severity || 'medium',
        stackTrace: metadata.stackTrace?.substring(0, 1000) || ''
      };

      if (this.db) {
        await this.trackWithD1('errors', event);
      } else if (this.kvStore) {
        await this.trackWithKV('errors', event);
      }

      console.log(`Tracked error: ${errorType} in ${context}`);
      return true;

    } catch (error) {
      console.error('Failed to track error:', error);
      return false;
    }
  }

  /**
   * Track cache performance
   * @param {string} cacheType - Type of cache operation
   * @param {string} result - Result (hit, miss, set, delete)
   * @param {number} responseTime - Response time in milliseconds
   * @param {string} key - Cache key (sanitized)
   * @returns {Promise<boolean>} - True if tracked successfully
   */
  async trackCacheOperation(cacheType, result, responseTime, key) {
    if (!this.enabled) {
      return true;
    }

    try {
      const event = {
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        cacheType,
        result,
        responseTime,
        keyHash: this.hashKey(key) // Don't store actual keys for privacy
      };

      if (this.db) {
        await this.trackWithD1('cache_operations', event);
      } else if (this.kvStore) {
        await this.trackWithKV('cache_operations', event);
      }

      return true;

    } catch (error) {
      console.error('Failed to track cache operation:', error);
      return false;
    }
  }

  /**
   * Track social media sharing
   * @param {string} platform - Social media platform
   * @param {string} jobId - Job ID
   * @param {string} action - Action (share, click, view)
   * @param {Object} metadata - Additional metadata
   * @returns {Promise<boolean>} - True if tracked successfully
   */
  async trackSocialMediaAction(platform, jobId, action, metadata = {}) {
    if (!this.enabled) {
      return true;
    }

    try {
      const event = {
        timestamp: Date.now(),
        date: new Date().toISOString().split('T')[0],
        platform,
        jobId,
        action,
        userAgent: metadata.userAgent || 'unknown',
        ip: metadata.ip || 'unknown'
      };

      if (this.db) {
        await this.trackWithD1('social_media', event);
      } else if (this.kvStore) {
        await this.trackWithKV('social_media', event);
      }

      console.log(`Tracked social media action: ${platform} - ${action}`);
      return true;

    } catch (error) {
      console.error('Failed to track social media action:', error);
      return false;
    }
  }

  /**
   * Track event using D1 database
   * @param {string} table - Table name
   * @param {Object} event - Event data
   * @returns {Promise<void>}
   */
  async trackWithD1(table, event) {
    if (!this.db) {
      throw new Error('D1 database not available');
    }

    const columns = Object.keys(event).join(', ');
    const placeholders = Object.keys(event).map(() => '?').join(', ');
    const values = Object.values(event);

    const query = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

    await this.db.prepare(query).bind(...values).run();
  }

  /**
   * Track event using KV storage
   * @param {string} eventType - Event type
   * @param {Object} event - Event data
   * @returns {Promise<void>}
   */
  async trackWithKV(eventType, event) {
    if (!this.kvStore) {
      throw new Error('KV storage not available');
    }

    const dateKey = event.date;
    const storageKey = `analytics_${eventType}_${dateKey}`;

    // Get existing data for the day
    const existing = await this.kvStore.get(storageKey, 'json') || { events: [] };

    // Add new event
    existing.events.push(event);

    // Limit events per day to prevent storage bloat
    if (existing.events.length > 1000) {
      existing.events = existing.events.slice(-1000);
    }

    // Store back to KV
    await this.kvStore.put(storageKey, JSON.stringify(existing), {
      expirationTtl: 30 * 24 * 60 * 60 // 30 days
    });
  }

  /**
   * Get analytics statistics
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Analytics data
   */
  async getStats(options = {}) {
    const {
      startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endDate = new Date(),
      eventType = 'all'
    } = options;

    try {
      if (this.db) {
        return await this.getStatsFromD1(startDate, endDate, eventType);
      } else if (this.kvStore) {
        return await this.getStatsFromKV(startDate, endDate, eventType);
      } else {
        return this.getMockStats();
      }

    } catch (error) {
      console.error('Failed to get analytics stats:', error);
      return { error: error.message };
    }
  }

  /**
   * Get statistics from D1 database
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} eventType - Event type filter
   * @returns {Promise<Object>} - Statistics
   */
  async getStatsFromD1(startDate, endDate, eventType) {
    const stats = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      },
      feedRequests: await this.getFeedRequestStats(startDate, endDate),
      apiRequests: await this.getAPIRequestStats(startDate, endDate),
      errors: await this.getErrorStats(startDate, endDate),
      cacheOperations: await this.getCacheStats(startDate, endDate),
      socialMedia: await this.getSocialMediaStats(startDate, endDate)
    };

    return stats;
  }

  /**
   * Get feed request statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Feed request stats
   */
  async getFeedRequestStats(startDate, endDate) {
    if (!this.db) {
      return this.getMockFeedStats();
    }

    const query = `
      SELECT
        feedType,
        resultType,
        COUNT(*) as count,
        AVG(responseTime) as avgResponseTime,
        MIN(responseTime) as minResponseTime,
        MAX(responseTime) as maxResponseTime,
        AVG(jobCount) as avgJobCount
      FROM feed_requests
      WHERE date >= ? AND date <= ?
      GROUP BY feedType, resultType
      ORDER BY count DESC
    `;

    const results = await this.db
      .prepare(query)
      .bind(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      .all();

    return {
      total: results.results.reduce((sum, row) => sum + row.count, 0),
      byType: results.results,
      topPerforming: results.results.sort((a, b) => b.avgResponseTime - a.avgResponseTime)[0]
    };
  }

  /**
   * Get API request statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - API request stats
   */
  async getAPIRequestStats(startDate, endDate) {
    if (!this.db) {
      return this.getMockAPIStats();
    }

    const query = `
      SELECT
        endpoint,
        result,
        COUNT(*) as count,
        AVG(responseTime) as avgResponseTime
      FROM api_requests
      WHERE date >= ? AND date <= ?
      GROUP BY endpoint, result
      ORDER BY count DESC
    `;

    const results = await this.db
      .prepare(query)
      .bind(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      .all();

    const successRate = results.results.reduce((sum, row) => {
      return sum + (row.result === 'success' ? row.count : 0);
    }, 0) / results.results.reduce((sum, row) => sum + row.count, 0) * 100;

    return {
      total: results.results.reduce((sum, row) => sum + row.count, 0),
      successRate: `${successRate.toFixed(2)}%`,
      byEndpoint: results.results,
      slowestEndpoint: results.results.sort((a, b) => b.avgResponseTime - a.avgResponseTime)[0]
    };
  }

  /**
   * Get error statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Error stats
   */
  async getErrorStats(startDate, endDate) {
    if (!this.db) {
      return this.getMockErrorStats();
    }

    const query = `
      SELECT
        errorType,
        context,
        COUNT(*) as count,
        severity
      FROM errors
      WHERE date >= ? AND date <= ?
      GROUP BY errorType, context
      ORDER BY count DESC
      LIMIT 10
    `;

    const results = await this.db
      .prepare(query)
      .bind(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      .all();

    return {
      total: results.results.reduce((sum, row) => sum + row.count, 0),
      topErrors: results.results,
      criticalErrors: results.results.filter(row => row.severity === 'critical')
    };
  }

  /**
   * Get cache statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Cache stats
   */
  async getCacheStats(startDate, endDate) {
    if (!this.db) {
      return this.getMockCacheStats();
    }

    const query = `
      SELECT
        cacheType,
        result,
        COUNT(*) as count,
        AVG(responseTime) as avgResponseTime
      FROM cache_operations
      WHERE date >= ? AND date <= ?
      GROUP BY cacheType, result
      ORDER BY count DESC
    `;

    const results = await this.db
      .prepare(query)
      .bind(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      .all();

    const hits = results.results.reduce((sum, row) =>
      sum + (row.result === 'hit' ? row.count : 0), 0
    );
    const total = results.results.reduce((sum, row) => sum + row.count, 0);
    const hitRate = total > 0 ? (hits / total * 100).toFixed(2) : 0;

    return {
      total,
      hits,
      hitRate: `${hitRate}%`,
      byType: results.results
    };
  }

  /**
   * Get social media statistics
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<Object>} - Social media stats
   */
  async getSocialMediaStats(startDate, endDate) {
    if (!this.db) {
      return this.getMockSocialMediaStats();
    }

    const query = `
      SELECT
        platform,
        action,
        COUNT(*) as count
      FROM social_media
      WHERE date >= ? AND date <= ?
      GROUP BY platform, action
      ORDER BY count DESC
    `;

    const results = await this.db
      .prepare(query)
      .bind(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      )
      .all();

    return {
      total: results.results.reduce((sum, row) => sum + row.count, 0),
      byPlatform: results.results,
      mostPopularPlatform: results.results.sort((a, b) => b.count - a.count)[0]?.platform || 'none'
    };
  }

  /**
   * Get statistics from KV storage
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @param {string} eventType - Event type filter
   * @returns {Promise<Object>} - Statistics
   */
  async getStatsFromKV(startDate, endDate, eventType) {
    const stats = {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        days: Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
      },
      feedRequests: { total: 0, byType: [] },
      apiRequests: { total: 0, successRate: '0%' },
      errors: { total: 0, topErrors: [] },
      cacheOperations: { total: 0, hitRate: '0%' },
      socialMedia: { total: 0, byPlatform: [] }
    };

    // Iterate through dates and collect data
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];

      try {
        // Get feed requests
        const feedData = await this.kvStore.get(`analytics_feed_requests_${dateKey}`, 'json');
        if (feedData && feedData.events) {
          stats.feedRequests.total += feedData.events.length;
        }

        // Get API requests
        const apiData = await this.kvStore.get(`analytics_api_requests_${dateKey}`, 'json');
        if (apiData && apiData.events) {
          stats.apiRequests.total += apiData.events.length;
        }

        // Get errors
        const errorData = await this.kvStore.get(`analytics_errors_${dateKey}`, 'json');
        if (errorData && errorData.events) {
          stats.errors.total += errorData.events.length;
        }

        // Get cache operations
        const cacheData = await this.kvStore.get(`analytics_cache_operations_${dateKey}`, 'json');
        if (cacheData && cacheData.events) {
          stats.cacheOperations.total += cacheData.events.length;
        }

        // Get social media actions
        const socialData = await this.kvStore.get(`analytics_social_media_${dateKey}`, 'json');
        if (socialData && socialData.events) {
          stats.socialMedia.total += socialData.events.length;
        }

      } catch (error) {
        console.warn(`Failed to get analytics for ${dateKey}:`, error);
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return stats;
  }

  /**
   * Get mock statistics when no storage is available
   * @returns {Object} - Mock statistics
   */
  getMockStats() {
    return {
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
        days: 7
      },
      feedRequests: {
        total: 1500,
        byType: [
          { feedType: 'rss', resultType: 'cache_hit', count: 800 },
          { feedType: 'rss', resultType: 'generated', count: 400 },
          { feedType: 'json', resultType: 'cache_hit', count: 200 },
          { feedType: 'json', resultType: 'generated', count: 100 }
        ]
      },
      apiRequests: {
        total: 500,
        successRate: '98.5%',
        byEndpoint: [
          { endpoint: '/industrial-vacancies', result: 'success', count: 300 },
          { endpoint: '/vacancies/{id}', result: 'success', count: 150 },
          { endpoint: '/employers/{id}', result: 'success', count: 45 },
          { endpoint: '/industrial-vacancies', result: 'error', count: 5 }
        ]
      },
      errors: {
        total: 15,
        topErrors: [
          { errorType: 'API_TIMEOUT', context: 'job_details', count: 8, severity: 'medium' },
          { errorType: 'NETWORK_ERROR', context: 'api_fetcher', count: 4, severity: 'high' },
          { errorType: 'PARSING_ERROR', context: 'rss_generator', count: 3, severity: 'low' }
        ]
      },
      cacheOperations: {
        total: 2000,
        hits: 1600,
        hitRate: '80.0%',
        byType: [
          { cacheType: 'job_listings', result: 'hit', count: 600 },
          { cacheType: 'job_listings', result: 'miss', count: 150 },
          { cacheType: 'job_details', result: 'hit', count: 800 },
          { cacheType: 'job_details', result: 'miss', count: 200 },
          { cacheType: 'rss_feed', result: 'hit', count: 200 },
          { cacheType: 'rss_feed', result: 'miss', count: 50 }
        ]
      },
      socialMedia: {
        total: 350,
        byPlatform: [
          { platform: 'twitter', action: 'share', count: 150 },
          { platform: 'facebook', action: 'share', count: 100 },
          { platform: 'linkedin', action: 'share', count: 75 },
          { platform: 'twitter', action: 'click', count: 25 }
        ],
        mostPopularPlatform: 'twitter'
      }
    };
  }

  /**
   * Hash cache key for privacy
   * @param {string} key - Original key
   * @returns {string} - Hashed key
   */
  hashKey(key) {
    // Simple hash function for demo purposes
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get mock feed stats
   * @returns {Object} - Mock feed stats
   */
  getMockFeedStats() {
    return {
      total: 1500,
      byType: [
        { feedType: 'rss', resultType: 'cache_hit', count: 800, avgResponseTime: 45 },
        { feedType: 'rss', resultType: 'generated', count: 400, avgResponseTime: 1200 },
        { feedType: 'json', resultType: 'cache_hit', count: 200, avgResponseTime: 50 },
        { feedType: 'json', resultType: 'generated', count: 100, avgResponseTime: 1100 }
      ],
      topPerforming: { feedType: 'rss', resultType: 'cache_hit', avgResponseTime: 45 }
    };
  }

  /**
   * Get mock API stats
   * @returns {Object} - Mock API stats
   */
  getMockAPIStats() {
    return {
      total: 500,
      successRate: '98.5%',
      byEndpoint: [
        { endpoint: '/industrial-vacancies', result: 'success', count: 300, avgResponseTime: 800 },
        { endpoint: '/vacancies/{id}', result: 'success', count: 150, avgResponseTime: 600 },
        { endpoint: '/employers/{id}', result: 'success', count: 45, avgResponseTime: 500 },
        { endpoint: '/industrial-vacancies', result: 'error', count: 5, avgResponseTime: 5000 }
      ],
      slowestEndpoint: { endpoint: '/industrial-vacancies', result: 'error', avgResponseTime: 5000 }
    };
  }

  /**
   * Get mock error stats
   * @returns {Object} - Mock error stats
   */
  getMockErrorStats() {
    return {
      total: 15,
      topErrors: [
        { errorType: 'API_TIMEOUT', context: 'job_details', count: 8, severity: 'medium' },
        { errorType: 'NETWORK_ERROR', context: 'api_fetcher', count: 4, severity: 'high' },
        { errorType: 'PARSING_ERROR', context: 'rss_generator', count: 3, severity: 'low' }
      ],
      criticalErrors: [
        { errorType: 'NETWORK_ERROR', context: 'api_fetcher', count: 4, severity: 'high' }
      ]
    };
  }

  /**
   * Get mock cache stats
   * @returns {Object} - Mock cache stats
   */
  getMockCacheStats() {
    return {
      total: 2000,
      hits: 1600,
      hitRate: '80.0%',
      byType: [
        { cacheType: 'job_listings', result: 'hit', count: 600, avgResponseTime: 5 },
        { cacheType: 'job_listings', result: 'miss', count: 150, avgResponseTime: 800 },
        { cacheType: 'job_details', result: 'hit', count: 800, avgResponseTime: 8 },
        { cacheType: 'job_details', result: 'miss', count: 200, avgResponseTime: 600 },
        { cacheType: 'rss_feed', result: 'hit', count: 200, avgResponseTime: 3 },
        { cacheType: 'rss_feed', result: 'miss', count: 50, avgResponseTime: 1200 }
      ]
    };
  }

  /**
   * Get mock social media stats
   * @returns {Object} - Mock social media stats
   */
  getMockSocialMediaStats() {
    return {
      total: 350,
      byPlatform: [
        { platform: 'twitter', action: 'share', count: 150 },
        { platform: 'facebook', action: 'share', count: 100 },
        { platform: 'linkedin', action: 'share', count: 75 },
        { platform: 'twitter', action: 'click', count: 25 }
      ],
      mostPopularPlatform: 'twitter'
    };
  }
}

export default Analytics;