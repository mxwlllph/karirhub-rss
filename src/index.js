/**
 * Cloudflare Worker RSS Feed Generator
 * Generates RSS 2.0 feeds from KarirHub API data
 * Supports Zapier integration and WordPress RSS-to-Post plugins
 */

import { APIFetcher } from './modules/api-fetcher.js';
import { DataAggregator } from './modules/data-aggregator.js';
import { RSSGenerator } from './modules/rss-generator.js';
import { CacheManager } from './modules/cache-manager.js';
import { Analytics } from './modules/analytics.js';
import { CONFIG } from './config/environment.js';
import { validateRequest, handleError, logInfo, logError } from './utils/helpers.js';

/**
 * Main request handler
 */
addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

/**
 * Handle incoming requests
 * @param {Request} request - The incoming request
 * @returns {Promise<Response>} - The response
 */
async function handleRequest(request) {
  const startTime = Date.now();
  const url = new URL(request.url);

  try {
    logInfo('Request received', {
      method: request.method,
      url: url.pathname,
      userAgent: request.headers.get('User-Agent')
    });

    // Validate request
    const validation = validateRequest(request);
    if (!validation.valid) {
      return handleError(new Error(validation.error), 400);
    }

    // Route handling
    switch (url.pathname) {
      case '/':
      case '/rss':
        return await handleRSSFeed(request, startTime);

      case '/json':
        return await handleJSONFeed(request, startTime);

      case '/health':
        return await handleHealthCheck();

      case '/stats':
        return await handleStats();

      default:
        return new Response(`
          <html>
            <head><title>KarirHub RSS Feed Service</title></head>
            <body>
              <h1>KarirHub RSS Feed Service</h1>
              <p><strong>Endpoints:</strong></p>
              <ul>
                <li><a href="/rss">RSS Feed</a> - RSS 2.0 format</li>
                <li><a href="/json">JSON Feed</a> - JSON format</li>
                <li><a href="/health">Health Check</a> - Service status</li>
                <li><a href="/stats">Statistics</a> - Feed statistics</li>
              </ul>
              <p><strong>Documentation:</strong></p>
              <p>See README.md for integration with Zapier and WordPress.</p>
            </body>
          </html>
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
    }
  } catch (error) {
    logError('Request handling failed', { error: error.message, stack: error.stack });
    return handleError(error, 500);
  }
}

/**
 * Handle RSS feed generation
 * @param {Request} request - The incoming request
 * @param {number} startTime - Request start time
 * @returns {Promise<Response>} - RSS feed response
 */
async function handleRSSFeed(request, startTime) {
  try {
    logInfo('Generating RSS feed');

    // Initialize components with fallback handling
    const cacheManager = new CacheManager(globalThis.RSS_CACHE || null);
    const apiFetcher = new APIFetcher(CONFIG.API_BASE_URL);
    const dataAggregator = new DataAggregator(apiFetcher, cacheManager);
    const rssGenerator = new RSSGenerator();
    const analytics = new Analytics(globalThis.RSS_ANALYTICS, globalThis.RSS_CACHE || null);

    // Check cache first
    const cacheKey = 'rss_feed_main';
    const cachedRSS = await cacheManager.get(cacheKey, 'rss');

    if (cachedRSS) {
      logInfo('Serving RSS from cache');

      // Log analytics for cache hit
      await analytics.trackFeedRequest('rss', 'cache_hit', Date.now() - startTime);

      return new Response(cachedRSS, {
        headers: {
          'Content-Type': 'application/rss+xml; charset=utf-8',
          'Cache-Control': `public, max-age=${CONFIG.CACHE_TTL}`,
          'X-Cache': 'HIT'
        }
      });
    }

    // Generate fresh RSS feed
    const jobs = await dataAggregator.aggregateJobData(CONFIG.MAX_JOBS_PER_FEED);
    logInfo(`Aggregated ${jobs.length} jobs for RSS feed`);

    // Generate RSS XML
    const rssXML = rssGenerator.generateRSS(jobs);

    // Cache the result
    await cacheManager.set(cacheKey, rssXML, 'rss');

    // Log analytics
    const generationTime = Date.now() - startTime;
    await analytics.trackFeedRequest('rss', 'generated', generationTime, jobs.length);

    logInfo(`RSS feed generated successfully in ${generationTime}ms`);

    return new Response(rssXML, {
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': `public, max-age=${CONFIG.CACHE_TTL}`,
        'X-Cache': 'MISS',
        'X-Generation-Time': generationTime.toString(),
        'X-Job-Count': jobs.length.toString()
      }
    });

  } catch (error) {
    logError('RSS generation failed', { error: error.message });

    // Return error RSS or fallback content
    const errorRSS = generateErrorRSS(error);
    return new Response(errorRSS, {
      status: 500,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'X-Error': error.message
      }
    });
  }
}

/**
 * Handle JSON feed generation
 * @param {Request} request - The incoming request
 * @param {number} startTime - Request start time
 * @returns {Promise<Response>} - JSON feed response
 */
async function handleJSONFeed(request, startTime) {
  try {
    logInfo('Generating JSON feed');

    // Initialize components with fallback handling
    const cacheManager = new CacheManager(globalThis.RSS_CACHE || null);
    const apiFetcher = new APIFetcher(CONFIG.API_BASE_URL);
    const dataAggregator = new DataAggregator(apiFetcher, cacheManager);
    const analytics = new Analytics(globalThis.RSS_ANALYTICS, globalThis.RSS_CACHE || null);

    // Check cache
    const cacheKey = 'json_feed_main';
    const cachedJSON = await cacheManager.get(cacheKey, 'json');

    if (cachedJSON) {
      await analytics.trackFeedRequest('json', 'cache_hit', Date.now() - startTime);

      return new Response(JSON.stringify(cachedJSON, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': `public, max-age=${CONFIG.CACHE_TTL}`,
          'X-Cache': 'HIT'
        }
      });
    }

    // Generate fresh JSON feed
    const jobs = await dataAggregator.aggregateJobData(CONFIG.MAX_JOBS_PER_FEED);
    const jsonFeed = generateJSONFeed(jobs);

    // Cache result
    await cacheManager.set(cacheKey, jsonFeed, 'json');

    // Log analytics
    const generationTime = Date.now() - startTime;
    await analytics.trackFeedRequest('json', 'generated', generationTime, jobs.length);

    return new Response(JSON.stringify(jsonFeed, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${CONFIG.CACHE_TTL}`,
        'X-Cache': 'MISS',
        'X-Generation-Time': generationTime.toString()
      }
    });

  } catch (error) {
    logError('JSON feed generation failed', { error: error.message });

    return new Response(JSON.stringify({
      error: 'Feed generation failed',
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle health check requests
 * @returns {Promise<Response>} - Health check response
 */
async function handleHealthCheck() {
  try {
    // Initialize components with fallback handling
    const cacheManager = new CacheManager(globalThis.RSS_CACHE || null);
    const apiFetcher = new APIFetcher(CONFIG.API_BASE_URL);

    // Check API connectivity
    const apiStartTime = Date.now();
    const apiTest = await apiFetcher.fetchJobListings(1, 1);
    const apiResponseTime = Date.now() - apiStartTime;

    // Check cache functionality
    const cacheTest = await cacheManager.healthCheck();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: CONFIG.VERSION,
      environment: CONFIG.ENVIRONMENT,
      uptime: Date.now() - globalThis.startTime,
      services: {
        api: {
          status: apiTest.code === 200 ? 'healthy' : 'unhealthy',
          responseTime: `${apiResponseTime}ms`,
          lastCheck: new Date().toISOString()
        },
        cache: {
          status: cacheTest.healthy ? 'healthy' : 'unhealthy',
          ...cacheTest
        }
      },
      endpoints: {
        rss: `${new URL(CONFIG.BASE_URL).origin}/rss`,
        json: `${new URL(CONFIG.BASE_URL).origin}/json`,
        health: `${new URL(CONFIG.BASE_URL).origin}/health`,
        stats: `${new URL(CONFIG.BASE_URL).origin}/stats`
      }
    };

    return new Response(JSON.stringify(health, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Handle statistics requests
 * @returns {Promise<Response>} - Statistics response
 */
async function handleStats() {
  try {
    // Check if analytics binding is available
    if (!globalThis.RSS_ANALYTICS) {
      return new Response(JSON.stringify({
        error: 'Analytics unavailable',
        message: 'RSS_ANALYTICS binding not found'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const analytics = new Analytics(globalThis.RSS_ANALYTICS, globalThis.RSS_CACHE || null);
    const stats = await analytics.getStats();

    return new Response(JSON.stringify(stats, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // 5 minutes
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Stats unavailable',
      message: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Generate error RSS feed
 * @param {Error} error - The error that occurred
 * @returns {string} - Error RSS XML
 */
function generateErrorRSS(error) {
  const currentDate = new Date().toUTCString();

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${CONFIG.RSS_TITLE} - Service Unavailable</title>
    <description>RSS feed temporarily unavailable. Please try again later.</description>
    <link>${CONFIG.BASE_URL}</link>
    <language>${CONFIG.RSS_LANGUAGE}</language>
    <lastBuildDate>${currentDate}</lastBuildDate>
    <generator>${CONFIG.RSS_GENERATOR}</generator>
    <item>
      <title>Service Temporarily Unavailable</title>
      <description>The RSS feed service is experiencing technical difficulties. Error: ${error.message}</description>
      <pubDate>${currentDate}</pubDate>
      <guid isPermaLink="false">error-${Date.now()}</guid>
    </item>
  </channel>
</rss>`;
}

/**
 * Generate JSON feed
 * @param {Array} jobs - Array of job objects
 * @returns {Object} - JSON feed object
 */
function generateJSONFeed(jobs) {
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: CONFIG.RSS_TITLE,
    description: CONFIG.RSS_DESCRIPTION,
    home_page_url: CONFIG.BASE_URL,
    feed_url: `${CONFIG.BASE_URL}/json`,
    language: CONFIG.RSS_LANGUAGE,
    items: jobs.map(job => ({
      id: job.id,
      url: `${CONFIG.API_BASE_URL}/vacancies/${job.id}`,
      title: job.title,
      content_html: job.detail?.description || '',
      summary: `${job.company_name} - ${job.city_name}`,
      date_published: job.created_at,
      date_modified: job.updated_at || job.created_at,
      author: {
        name: job.company_name
      },
      tags: [
        job.industry_name,
        job.city_name,
        job.job_function_name
      ].filter(Boolean),
      _social: {
        title: `🔥 Lowongan ${job.title} di ${job.company_name} - ${job.city_name}`,
        description: `${job.salary_range || 'Gaji nego'} • ${job.detail?.job_type || 'Full-time'} • ${job.industry_name}`,
        hashtags: `#lowongankerja #karir #loker #${job.city_name?.toLowerCase().replace(/\s+/g, '')} #${job.industry_name?.toLowerCase().replace(/\s+/g, '')}`
      }
    }))
  };
}

// Initialize global start time for uptime tracking
globalThis.startTime = Date.now();

export default {
  fetch: handleRequest
};