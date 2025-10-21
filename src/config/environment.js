/**
 * Environment Configuration
 * Central configuration management for the RSS Worker
 */

/**
 * Base configuration
 */
const BASE_CONFIG = {
  // Version information
  VERSION: '1.0.0',

  // API Configuration
  API_BASE_URL: 'https://api.kemnaker.go.id/karirhub/catalogue/v1',

  // Cache Configuration
  CACHE_TTL: 1800, // 30 minutes in seconds
  MAX_JOBS_PER_FEED: 20,

  // RSS Feed Configuration
  RSS_TITLE: 'Lowongan Kerja Terbaru - KarirHub Indonesia',
  RSS_DESCRIPTION: 'Feed lowongan kerja resmi dari Kementerian Ketenagakerjaan Indonesia',
  RSS_LANGUAGE: 'id',
  RSS_WEBMASTER: 'admin@karirhub.com',
  RSS_GENERATOR: 'Cloudflare Worker RSS Generator v1.0',
  RSS_COPYRIGHT: `© ${new Date().getFullYear()} Kementerian Ketenagakerjaan Indonesia`,

  // Service URLs
  BASE_URL: 'https://karirhub-rss.tekipik.workers.dev',

  // Social Media Configuration
  SOCIAL_MEDIA_HASHTAGS: ['#lowongankerja', '#karir', '#loker'],
  SOCIAL_MEDIA_CHAR_LIMITS: {
    twitter: 280,
    facebook: 500,
    linkedin: 700,
    instagram: 2200
  },

  // Analytics and Monitoring
  ENABLE_ANALYTICS: true,
  LOG_LEVEL: 'info',

  // Rate Limiting
  RATE_LIMIT_REQUESTS: 100,
  RATE_LIMIT_WINDOW: 60000, // 1 minute in ms

  // Content Limits
  MAX_DESCRIPTION_LENGTH: 300,
  MAX_TITLE_LENGTH: 100,

  // Retry Configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // 1 second
};

/**
 * Environment-specific configurations
 */
const ENVIRONMENTS = {
  development: {
    ...BASE_CONFIG,
    ENVIRONMENT: 'development',
    LOG_LEVEL: 'debug',
    CACHE_TTL: 300, // 5 minutes
    MAX_JOBS_PER_FEED: 5,
    ENABLE_ANALYTICS: false,
    BASE_URL: 'http://localhost:8787',
  },

  staging: {
    ...BASE_CONFIG,
    ENVIRONMENT: 'staging',
    LOG_LEVEL: 'info',
    CACHE_TTL: 900, // 15 minutes
    MAX_JOBS_PER_FEED: 10,
    BASE_URL: 'https://karirhub-rss-staging.workers.dev',
  },

  production: {
    ...BASE_CONFIG,
    ENVIRONMENT: 'production',
    LOG_LEVEL: 'warn',
    CACHE_TTL: 1800, // 30 minutes
    MAX_JOBS_PER_FEED: 50,
    BASE_URL: 'https://karirhub-rss.tekipik.workers.dev',
  }
};

/**
 * Cache strategy configuration
 */
export const CACHE_STRATEGY = {
  job_listings: 900,      // 15 minutes
  job_details: 3600,      // 1 hour
  employer_details: 7200, // 2 hours
  rss_feed: 300,         // 5 minutes
  json_feed: 300,        // 5 minutes
  api_health: 60,        // 1 minute
};

/**
 * HTTP headers configuration
 */
export const HTTP_HEADERS = {
  rss: {
    'Content-Type': 'application/rss+xml; charset=utf-8',
    'Cache-Control': 'public, max-age=1800',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
  json: {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=1800',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  },
  html: {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
  },
  health: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache, no-store',
  }
};

/**
 * RSS field mapping configuration
 */
export const RSS_FIELD_MAPPING = {
  title: {
    maxLength: 100,
    prefix: '🔥 ',
    template: '{emoji} Lowongan {title} di {company} - {location}'
  },
  description: {
    maxLength: 300,
    template: '{salary} • {job_type} • {industry} • {education}',
    hashtags: true
  },
  content: {
    includeCompanyInfo: true,
    includeRequirements: true,
    includeBenefits: true,
    includeContact: true,
    format: 'html'
  },
  categories: {
    domains: ['industry', 'location', 'function', 'type'],
    maxCategories: 8
  }
};

/**
 * Social media content templates
 */
export const SOCIAL_MEDIA_TEMPLATES = {
  twitter: {
    template: `🔥 {title}

💰 {salary}
📍 {location}
📋 {education} • {job_type}
🏢 {industry}

{hashtags}

#lowongankerja #karir #loker`,
    maxLength: 280
  },

  facebook: {
    template: `💼 **Lowongan Kerja: {position}**

🏢 **Perusahaan**: {company}
📍 **Lokasi**: {location}
💰 **Gaji**: {salary}
📋 **Persyaratan**: {education}, {experience}
🏭 **Industri**: {industry}

📝 **Deskripsi**: {description}

🎁 **Benefit**: {benefits}

📅 **Deadline**: {deadline}

🔗 **Apply**: {link}

{hashtags}`,
    maxLength: 500
  },

  linkedin: {
    template: `🚀 **Career Opportunity: {position}**

**Company**: {company} | {industry}
**Location**: {location}
**Employment Type**: {job_type}
**Salary Range**: {salary}

**Requirements:**
• {education}
• {experience}
• {skills}

**About the Role:**
{description}

**Benefits Offered:**
{benefits}

**Application Deadline**: {deadline}

#jobopportunity #hiring #{industry} #careers {location_hashtag}`,
    maxLength: 700
  }
};

/**
 * Hashtag generation configuration
 */
export const HASHTAG_CONFIG = {
  base: ['#lowongankerja', '#karir', '#loker'],
  locationPrefix: '#loker',
  industryPrefix: '#lowongan',
  functionPrefix: '#',
  maxHashtags: 8,
  customHashtags: {
    'automotive': '#otomotif',
    'technology': '#teknologi',
    'healthcare': '#kesehatan',
    'education': '#pendidikan',
    'finance': '#keuangan',
    'manufacturing': '#manufaktur'
  }
};

/**
 * Content formatting configuration
 */
export const CONTENT_FORMATTING = {
  currency: {
    locale: 'id-ID',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  },
  date: {
    locale: 'id-ID',
    options: {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  },
  salary: {
    formatAsMillion: true,
    suffix: 'jt',
    showRange: true
  },
  truncate: {
    suffix: '...',
    wordBoundary: true
  }
};

/**
 * Error messages configuration
 */
export const ERROR_MESSAGES = {
  generic: 'Terjadi kesalahan pada layanan. Silakan coba lagi nanti.',
  api_unavailable: 'Sumber data lowongan kerja sedang tidak tersedia. Silakan coba beberapa saat lagi.',
  invalid_request: 'Permintaan tidak valid.',
  rate_limit: 'Terlalu banyak permintaan. Silakan coba lagi nanti.',
  cache_error: 'Cache service sedang bermasalah.',
  parsing_error: 'Gagal memproses data dari API.',
  network_error: 'Koneksi ke API gagal.',
  timeout: 'Permintaan timeout. Silakan coba lagi.',
};

/**
 * Get configuration for current environment
 * @returns {Object} Environment-specific configuration
 */
export function getConfig() {
  const environment = globalThis.ENVIRONMENT || 'development';

  // Override with environment variables from Cloudflare Workers
  const config = {
    ...ENVIRONMENTS[environment],
    API_BASE_URL: globalThis.API_BASE_URL || ENVIRONMENTS[environment].API_BASE_URL,
    CACHE_TTL: parseInt(globalThis.CACHE_TTL) || ENVIRONMENTS[environment].CACHE_TTL,
    MAX_JOBS_PER_FEED: parseInt(globalThis.MAX_JOBS_PER_FEED) || ENVIRONMENTS[environment].MAX_JOBS_PER_FEED,
    RSS_TITLE: globalThis.RSS_TITLE || ENVIRONMENTS[environment].RSS_TITLE,
    RSS_DESCRIPTION: globalThis.RSS_DESCRIPTION || ENVIRONMENTS[environment].RSS_DESCRIPTION,
    ENABLE_ANALYTICS: globalThis.ENABLE_ANALYTICS === 'true' || ENVIRONMENTS[environment].ENABLE_ANALYTICS,
    LOG_LEVEL: globalThis.LOG_LEVEL || ENVIRONMENTS[environment].LOG_LEVEL,
  };

  // Add runtime information
  config.RUNTIME = {
    startTime: globalThis.startTime,
    version: config.VERSION,
    environment: environment,
  };

  return config;
}

/**
 * Export default configuration
 */
export const CONFIG = getConfig();

// Export configuration for use in other modules
export default CONFIG;