/**
 * API Fetcher Module
 * Handles all API interactions with KarirHub API
 * Includes caching, retry logic, and error handling
 */

import { CONFIG, CACHE_STRATEGY } from '../config/environment.js';

/**
 * API Fetcher Class
 */
export class APIFetcher {
  /**
   * Constructor
   * @param {string} baseURL - Base URL for the API
   */
  constructor(baseURL = CONFIG.API_BASE_URL) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'User-Agent': CONFIG.RSS_GENERATOR,
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive'
    };
  }

  /**
   * Fetch job listings from the API
   * @param {number} page - Page number (default: 1)
   * @param {number} limit - Number of items per page (default: 18)
   * @returns {Promise<Object>} - API response with job listings
   */
  async fetchJobListings(page = 1, limit = 18) {
    const url = `${this.baseURL}/industrial-vacancies?page=${page}&limit=${limit}`;
    return this.fetchWithRetry(url, 'job_listings');
  }

  /**
   * Fetch detailed information for a specific job
   * @param {string} jobId - UUID of the job
   * @returns {Promise<Object>} - Detailed job information
   */
  async fetchJobDetail(jobId) {
    if (!jobId) {
      throw new Error('Job ID is required');
    }

    const url = `${this.baseURL}/vacancies/${jobId}`;
    return this.fetchWithRetry(url, 'job_details');
  }

  /**
   * Fetch detailed information for an employer
   * @param {string} employerId - UUID of the employer
   * @returns {Promise<Object>} - Detailed employer information
   */
  async fetchEmployerDetail(employerId) {
    if (!employerId) {
      throw new Error('Employer ID is required');
    }

    const url = `${this.baseURL}/employers/${employerId}`;
    return this.fetchWithRetry(url, 'employer_details');
  }

  /**
   * Generic fetch method with retry logic and error handling
   * @param {string} url - Full URL to fetch
   * @param {string} cacheType - Type of cache for this request
   * @param {number} retries - Number of retries attempted
   * @returns {Promise<Object>} - Parsed JSON response
   */
  async fetchWithRetry(url, cacheType = null, retries = 0) {
    try {
      const response = await this.fetchWithTimeout(url, {
        method: 'GET',
        headers: this.defaultHeaders
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Validate response structure
      if (!this.validateResponse(data)) {
        throw new Error('Invalid API response structure');
      }

      return data;

    } catch (error) {
      console.error(`API fetch failed for ${url}:`, error);

      // Retry logic
      if (retries < CONFIG.MAX_RETRIES && this.shouldRetry(error)) {
        const delay = CONFIG.RETRY_DELAY * Math.pow(2, retries); // Exponential backoff
        console.log(`Retrying in ${delay}ms... (attempt ${retries + 1}/${CONFIG.MAX_RETRIES})`);

        await this.sleep(delay);
        return this.fetchWithRetry(url, cacheType, retries + 1);
      }

      // Final retry attempt failed, throw the error
      throw new Error(`API request failed after ${retries} retries: ${error.message}`);
    }
  }

  /**
   * Fetch with timeout handling
   * @param {string} url - URL to fetch
   * @param {Object} options - Fetch options
   * @param {number} timeout - Timeout in milliseconds (default: 10000)
   * @returns {Promise<Response>} - Fetch response
   */
  async fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      return response;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Validate API response structure
   * @param {Object} data - Response data to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  validateResponse(data) {
    // Check if response has the expected structure
    if (!data || typeof data !== 'object') {
      return false;
    }

    // Check for status code
    if (data.code === undefined) {
      return false;
    }

    // If there's an error in the response, throw it
    if (data.code !== 200 && data.message) {
      throw new Error(`API Error (${data.code}): ${data.message}`);
    }

    return true;
  }

  /**
   * Determine if an error should trigger a retry
   * @param {Error} error - The error that occurred
   * @returns {boolean} - True if should retry
   */
  shouldRetry(error) {
    // Retry on network errors and 5xx server errors
    if (error.name === 'AbortError' || error.name === 'TypeError') {
      return true; // Network/timeout errors
    }

    if (error.message.includes('HTTP 5')) {
      return true; // Server errors
    }

    if (error.message.includes('HTTP 429')) {
      return true; // Rate limiting
    }

    // Don't retry on client errors (4xx except 429)
    return false;
  }

  /**
   * Sleep utility for retry delays
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Build query string from parameters
   * @param {Object} params - Parameters to convert
   * @returns {string} - Query string
   */
  buildQueryString(params) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    }

    return searchParams.toString();
  }

  /**
   * Get API health status
   * @returns {Promise<Object>} - Health status information
   */
  async getHealthStatus() {
    const startTime = Date.now();

    try {
      // Try to fetch a single job listing to test API connectivity
      const response = await this.fetchJobListings(1, 1);
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        lastCheck: new Date().toISOString(),
        availableJobs: response.pagination?.total || 0,
        apiVersion: response.version || 'unknown'
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        responseTime: `${Date.now() - startTime}ms`,
        lastCheck: new Date().toISOString()
      };
    }
  }

  /**
   * Batch fetch multiple job details
   * @param {Array<string>} jobIds - Array of job IDs
   * @param {number} concurrency - Maximum concurrent requests (default: 5)
   * @returns {Promise<Array>} - Array of job details
   */
  async batchFetchJobDetails(jobIds, concurrency = 5) {
    if (!jobIds || jobIds.length === 0) {
      return [];
    }

    const results = [];
    const errors = [];

    // Process jobs in batches to control concurrency
    for (let i = 0; i < jobIds.length; i += concurrency) {
      const batch = jobIds.slice(i, i + concurrency);

      const batchPromises = batch.map(async (jobId) => {
        try {
          const detail = await this.fetchJobDetail(jobId);
          return { success: true, data: detail.data, jobId };
        } catch (error) {
          errors.push({ jobId, error: error.message });
          return { success: false, error: error.message, jobId };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Small delay between batches to be respectful to the API
      if (i + concurrency < jobIds.length) {
        await this.sleep(100);
      }
    }

    if (errors.length > 0) {
      console.warn(`Failed to fetch ${errors.length} job details:`, errors);
    }

    return results.filter(result => result.success).map(result => result.data);
  }

  /**
   * Get multiple pages of job listings
   * @param {number} maxPages - Maximum number of pages to fetch
   * @param {number} perPage - Items per page
   * @returns {Promise<Array>} - Array of all job listings
   */
  async fetchMultiplePages(maxPages = 3, perPage = 18) {
    const allJobs = [];

    for (let page = 1; page <= maxPages; page++) {
      try {
        const response = await this.fetchJobListings(page, perPage);

        if (response.data && response.data.length > 0) {
          allJobs.push(...response.data);
        }

        // Stop if we got fewer results than requested (likely last page)
        if (response.data.length < perPage) {
          break;
        }

        // Small delay between page requests
        if (page < maxPages) {
          await this.sleep(200);
        }

      } catch (error) {
        console.error(`Failed to fetch page ${page}:`, error);
        break; // Stop on page fetch errors
      }
    }

    return allJobs;
  }

  /**
   * Set custom headers for requests
   * @param {Object} headers - Additional headers
   */
  setHeaders(headers) {
    this.defaultHeaders = { ...this.defaultHeaders, ...headers };
  }

  /**
   * Get current headers
   * @returns {Object} - Current headers
   */
  getHeaders() {
    return { ...this.defaultHeaders };
  }
}

/**
 * Create a singleton instance for use across the application
 */
export const apiFetcher = new APIFetcher();

/**
 * Export default class
 */
export default APIFetcher;