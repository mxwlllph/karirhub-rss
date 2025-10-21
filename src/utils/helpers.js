/**
 * Helper Utilities
 * Common utility functions for the RSS Worker
 */

import { CONFIG, ERROR_MESSAGES, HTTP_HEADERS } from '../config/environment.js';

/**
 * Validate incoming request
 * @param {Request} request - The incoming request
 * @returns {Object} - Validation result
 */
export function validateRequest(request) {
  // Check request method
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return {
      valid: false,
      error: 'Method not allowed. Only GET and HEAD requests are supported.'
    };
  }

  // Check User-Agent for basic bot filtering
  const userAgent = request.headers.get('User-Agent') || '';
  if (userAgent.includes('bot') && userAgent.includes('evil')) {
    return {
      valid: false,
      error: 'Malicious bot detected.'
    };
  }

  // Check for rate limiting (basic implementation)
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (isRateLimited(clientIP)) {
    return {
      valid: false,
      error: 'Rate limit exceeded. Please try again later.'
    };
  }

  return { valid: true };
}

/**
 * Check if client IP is rate limited
 * @param {string} ip - Client IP address
 * @returns {boolean} - True if rate limited
 */
function isRateLimited(ip) {
  // This is a very basic rate limiting implementation
  // In production, you'd want to use a proper rate limiting service
  // or implement token bucket algorithm with KV storage

  const rateLimitStore = globalThis.rateLimitStore || new Map();

  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, { count: 1, resetTime: Date.now() + CONFIG.RATE_LIMIT_WINDOW });
    return false;
  }

  const clientData = rateLimitStore.get(ip);

  if (Date.now() > clientData.resetTime) {
    // Reset the counter
    rateLimitStore.set(ip, { count: 1, resetTime: Date.now() + CONFIG.RATE_LIMIT_WINDOW });
    return false;
  }

  if (clientData.count >= CONFIG.RATE_LIMIT_REQUESTS) {
    return true;
  }

  clientData.count++;
  return false;
}

/**
 * Handle errors consistently
 * @param {Error} error - The error to handle
 * @param {number} statusCode - HTTP status code
 * @returns {Response} - Error response
 */
export function handleError(error, statusCode = 500) {
  console.error('Error handled:', {
    message: error.message,
    stack: error.stack,
    statusCode
  });

  // Don't expose internal errors in production
  const isDevelopment = CONFIG.ENVIRONMENT === 'development';
  const errorMessage = isDevelopment ? error.message : ERROR_MESSAGES.generic;

  const errorResponse = {
    error: true,
    message: errorMessage,
    timestamp: new Date().toISOString(),
    status: statusCode
  };

  // Add stack trace in development
  if (isDevelopment && error.stack) {
    errorResponse.stack = error.stack;
  }

  // Log error for analytics if available
  if (globalThis.analytics) {
    globalThis.analytics.trackError('HTTP_ERROR', error.message, 'request_handler', {
      statusCode,
      severity: statusCode >= 500 ? 'high' : 'medium'
    }).catch(e => console.error('Failed to log error:', e));
  }

  return new Response(JSON.stringify(errorResponse, null, 2), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache, no-store'
    }
  });
}

/**
 * Log information messages
 * @param {string} message - Log message
 * @param {Object} data - Additional data to log
 */
export function logInfo(message, data = {}) {
  const logData = {
    level: 'info',
    message,
    timestamp: new Date().toISOString(),
    environment: CONFIG.ENVIRONMENT,
    ...data
  };

  console.log(JSON.stringify(logData));
}

/**
 * Log error messages
 * @param {string} message - Error message
 * @param {Object} data - Additional error data
 */
export function logError(message, data = {}) {
  const logData = {
    level: 'error',
    message,
    timestamp: new Date().toISOString(),
    environment: CONFIG.ENVIRONMENT,
    ...data
  };

  console.error(JSON.stringify(logData));
}

/**
 * Log warning messages
 * @param {string} message - Warning message
 * @param {Object} data - Additional warning data
 */
export function logWarn(message, data = {}) {
  const logData = {
    level: 'warn',
    message,
    timestamp: new Date().toISOString(),
    environment: CONFIG.ENVIRONMENT,
    ...data
  };

  console.warn(JSON.stringify(logData));
}

/**
 * Sanitize and validate job data
 * @param {Object} job - Job object to validate
 * @returns {Object} - Validation result
 */
export function validateJobData(job) {
  if (!job || typeof job !== 'object') {
    return {
      valid: false,
      error: 'Invalid job object: must be an object'
    };
  }

  const requiredFields = ['id', 'title', 'company_name'];
  const missingFields = requiredFields.filter(field => !job[field]);

  if (missingFields.length > 0) {
    return {
      valid: false,
      error: `Missing required fields: ${missingFields.join(', ')}`
    };
  }

  // Validate data types
  if (typeof job.id !== 'string') {
    return {
      valid: false,
      error: 'Job ID must be a string'
    };
  }

  if (typeof job.title !== 'string' || job.title.trim().length === 0) {
    return {
      valid: false,
      error: 'Job title must be a non-empty string'
    };
  }

  if (typeof job.company_name !== 'string' || job.company_name.trim().length === 0) {
    return {
      valid: false,
      error: 'Company name must be a non-empty string'
    };
  }

  // Validate date fields
  if (job.created_at && !isValidDate(job.created_at)) {
    return {
      valid: false,
      error: 'Invalid created_at date format'
    };
  }

  return { valid: true };
}

/**
 * Check if date string is valid
 * @param {string} dateString - Date string to validate
 * @returns {boolean} - True if valid date
 */
export function isValidDate(dateString) {
  if (!dateString) return false;

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
}

/**
 * Format currency for Indonesian Rupiah
 * @param {number} amount - Amount to format
 * @returns {string} - Formatted currency
 */
export function formatCurrency(amount) {
  if (!amount || typeof amount !== 'number') {
    return 'Rp 0';
  }

  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format salary range
 * @param {Object} salary - Salary object with min/max
 * @returns {string} - Formatted salary range
 */
export function formatSalaryRange(salary) {
  if (!salary || typeof salary !== 'object') {
    return 'Gaji nego';
  }

  if (salary.min && salary.max) {
    return `${formatCurrency(salary.min)} - ${formatCurrency(salary.max)}`;
  } else if (salary.min) {
    return `${formatCurrency(salary.min)}+`;
  } else if (salary.max) {
    return `Hingga ${formatCurrency(salary.max)}`;
  }

  return 'Gaji nego';
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add if truncated
 * @returns {string} - Truncated text
 */
export function truncateText(text, maxLength, suffix = '...') {
  if (!text || typeof text !== 'string') {
    return '';
  }

  if (text.length <= maxLength) {
    return text;
  }

  const truncated = text.substring(0, maxLength - suffix.length);

  // Try to truncate at word boundary
  const lastSpace = truncated.lastIndexOf(' ');
  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + suffix;
  }

  return truncated + suffix;
}

/**
 * Clean and normalize text
 * @param {string} text - Text to clean
 * @returns {string} - Cleaned text
 */
export function cleanText(text) {
  if (!text || typeof text !== 'string') {
    return '';
  }

  return text
    .trim()
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/[\r\n\t]/g, ' ') // Remove line breaks and tabs
    .replace(/[^\w\s\-.,@#$%&*()+=\[\]{}|\\:";'<>?\/]/g, '') // Remove special chars except basic punctuation
    .substring(0, 1000); // Limit length
}

/**
 * Generate random string
 * @param {number} length - Length of string to generate
 * @returns {string} - Random string
 */
export function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  return result;
}

/**
 * Generate hash for string
 * @param {string} str - String to hash
 * @returns {string} - Hash string
 */
export function simpleHash(str) {
  if (!str) return '';

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Extract client information from request
 * @param {Request} request - Request object
 * @returns {Object} - Client information
 */
export function extractClientInfo(request) {
  return {
    ip: request.headers.get('CF-Connecting-IP') ||
        request.headers.get('X-Forwarded-For') ||
        request.headers.get('X-Real-IP') ||
        'unknown',
    userAgent: request.headers.get('User-Agent') || 'unknown',
    country: request.headers.get('CF-IPCountry') || 'unknown',
    referer: request.headers.get('Referer') || 'unknown',
    acceptLanguage: request.headers.get('Accept-Language') || 'unknown'
  };
}

/**
 * Check if request is from a bot
 * @param {Request} request - Request object
 * @returns {boolean} - True if bot
 */
export function isBotRequest(request) {
  const userAgent = request.headers.get('User-Agent') || '';

  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /node/i,
    /go-http/i,
    /httpclient/i
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Get appropriate headers for response
 * @param {string} contentType - Content type
 * @param {Object} options - Additional options
 * @returns {Object} - Headers object
 */
export function getResponseHeaders(contentType = 'json', options = {}) {
  const baseHeaders = HTTP_HEADERS[contentType] || HTTP_HEADERS.json;

  const headers = { ...baseHeaders };

  // Add custom headers
  if (options.cacheControl) {
    headers['Cache-Control'] = options.cacheControl;
  }

  if (options.contentType) {
    headers['Content-Type'] = options.contentType;
  }

  if (options.customHeaders) {
    Object.assign(headers, options.customHeaders);
  }

  // Add security headers
  headers['X-Content-Type-Options'] = 'nosniff';
  headers['X-Frame-Options'] = 'DENY';
  headers['X-XSS-Protection'] = '1; mode=block';
  headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

  return headers;
}

/**
 * Parse query parameters from URL
 * @param {URL} url - URL object
 * @returns {Object} - Parsed parameters
 */
export function parseQueryParams(url) {
  const params = {};

  for (const [key, value] of url.searchParams) {
    // Try to parse as JSON, fallback to string
    try {
      params[key] = JSON.parse(value);
    } catch {
      params[key] = value;
    }
  }

  return params;
}

/**
 * Validate and sanitize pagination parameters
 * @param {Object} params - Query parameters
 * @returns {Object} - Validated pagination params
 */
export function validatePaginationParams(params) {
  const page = parseInt(params.page) || 1;
  const limit = parseInt(params.limit) || CONFIG.MAX_JOBS_PER_FEED;

  return {
    page: Math.max(1, Math.min(page, 100)), // Limit page to 1-100
    limit: Math.max(1, Math.min(limit, 100)), // Limit limit to 1-100
    offset: Math.max(0, (page - 1) * limit)
  };
}

/**
 * Create CORS response
 * @param {any} data - Response data
 * @param {number} status - HTTP status
 * @param {string} contentType - Content type
 * @returns {Response} - CORS-enabled response
 */
export function createCORSResponse(data, status = 200, contentType = 'json') {
  const headers = getResponseHeaders(contentType, {
    customHeaders: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });

  let body;
  if (typeof data === 'string') {
    body = data;
  } else if (contentType === 'json') {
    body = JSON.stringify(data, null, 2);
  } else {
    body = String(data);
  }

  return new Response(body, {
    status,
    headers
  });
}

/**
 * Handle OPTIONS requests for CORS
 * @returns {Response} - OPTIONS response
 */
export function handleOPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Measure execution time of a function
 * @param {Function} fn - Function to measure
 * @param {...any} args - Function arguments
 * @returns {Promise<Object>} - Result with execution time
 */
export async function measureExecutionTime(fn, ...args) {
  const startTime = Date.now();

  try {
    const result = await fn(...args);
    const executionTime = Date.now() - startTime;

    return {
      success: true,
      result,
      executionTime
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    return {
      success: false,
      error: error.message,
      executionTime
    };
  }
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, delay) {
  let timeoutId;

  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Retry function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise<any>} - Function result
 */
export async function retry(fn, maxRetries = 3, baseDelay = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Create error response for specific error types
 * @param {string} errorType - Type of error
 * @param {string} customMessage - Custom error message
 * @returns {Response} - Error response
 */
export function createErrorResponse(errorType, customMessage = null) {
  const errorMap = {
    'invalid_request': { status: 400, message: ERROR_MESSAGES.invalid_request },
    'rate_limit': { status: 429, message: ERROR_MESSAGES.rate_limit },
    'api_unavailable': { status: 503, message: ERROR_MESSAGES.api_unavailable },
    'cache_error': { status: 500, message: ERROR_MESSAGES.cache_error },
    'timeout': { status: 408, message: ERROR_MESSAGES.timeout }
  };

  const errorInfo = errorMap[errorType] || {
    status: 500,
    message: customMessage || ERROR_MESSAGES.generic
  };

  return handleError(new Error(errorInfo.message), errorInfo.status);
}

/**
 * Validate RSS feed structure
 * @param {string} rssContent - RSS XML content
 * @returns {Object} - Validation result
 */
export function validateRSSFeed(rssContent) {
  if (!rssContent || typeof rssContent !== 'string') {
    return {
      valid: false,
      error: 'RSS content must be a non-empty string'
    };
  }

  const requiredElements = [
    '<?xml',
    '<rss',
    'version="2.0"',
    '<channel>',
    '<title>',
    '<description>',
    '<link>',
    '</channel>',
    '</rss>'
  ];

  const missingElements = requiredElements.filter(element =>
    !rssContent.includes(element)
  );

  if (missingElements.length > 0) {
    return {
      valid: false,
      error: `Missing required RSS elements: ${missingElements.join(', ')}`
    };
  }

  // Check for unescaped ampersands (common XML error)
  const unescapedAmpersands = rssContent.match(/&(?!amp;|lt;|gt;|quot;|apos;)/g);
  if (unescapedAmpersands) {
    return {
      valid: false,
      error: `Found ${unescapedAmpersands.length} unescaped ampersand(s)`
    };
  }

  return { valid: true };
}

/**
 * Get memory usage information
 * @returns {Object} - Memory usage stats
 */
export function getMemoryUsage() {
  if (typeof performance !== 'undefined' && performance.memory) {
    return {
      used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) // MB
    };
  }

  return {
    used: 0,
    total: 0,
    limit: 0
  };
}

/**
 * Create standardized success response
 * @param {any} data - Response data
 * @param {Object} metadata - Additional metadata
 * @returns {Object} - Standardized response object
 */
export function createSuccessResponse(data, metadata = {}) {
  return {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      version: CONFIG.VERSION,
      environment: CONFIG.ENVIRONMENT,
      ...metadata
    }
  };
}

export default {
  validateRequest,
  handleError,
  logInfo,
  logError,
  logWarn,
  validateJobData,
  isValidDate,
  formatCurrency,
  formatSalaryRange,
  truncateText,
  cleanText,
  generateRandomString,
  simpleHash,
  extractClientInfo,
  isBotRequest,
  getResponseHeaders,
  parseQueryParams,
  validatePaginationParams,
  createCORSResponse,
  handleOPTIONS,
  measureExecutionTime,
  debounce,
  retry,
  createErrorResponse,
  validateRSSFeed,
  getMemoryUsage,
  createSuccessResponse
};