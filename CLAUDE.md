# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Local Development
```bash
# Start development server
npm run dev

# Test locally
curl http://localhost:8787/rss
curl http://localhost:8787/json
curl http://localhost:8787/health
```

### Testing
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:api    # Test API connectivity and responses
npm run test:rss    # Validate RSS feed generation and structure
```

### Deployment
```bash
# Deploy to development environment
npm run deploy

# Deploy to staging
npm run deploy:staging

# Deploy to production
npm run deploy:prod
```

### Monitoring & Debugging
```bash
# View real-time logs
npm run logs

# List KV cache keys
npm run kv:list

# Clear KV cache
npm run kv:clear
```

## Architecture Overview

This is a **Cloudflare Worker** that transforms KarirHub job listing API data into RSS 2.0 feeds for social media automation (Zapier) and WordPress integration.

### Core Data Flow
```
KarirHub API → DataAggregator → RSSGenerator → RSS Feed
                            ↓
                      CacheManager (KV storage)
                            ↓
                      Analytics (D1 database)
```

### Key Components

**Entry Point (`src/index.js`)**
- Routes requests to appropriate handlers
- Handles `/rss`, `/json`, `/health`, `/stats` endpoints
- Orchestrates all modules with proper error handling

**API Integration (`src/modules/api-fetcher.js`)**
- Fetches from KarirHub API endpoints
- Implements retry logic and exponential backoff
- Handles rate limiting and error recovery
- Supports batch operations for performance

**Data Processing (`src/modules/data-aggregator.js`)**
- Enriches basic job listings with detailed information
- Generates social media-optimized content per platform
- Formats salary ranges, locations, and requirements
- Creates both RSS and HTML content versions

**RSS Generation (`src/modules/rss-generator.js`)**
- Produces RSS 2.0 compliant XML with media namespaces
- Optimizes titles/descriptions for social media character limits
- Generates hashtags and categories automatically
- Validates XML structure before output

**Caching Layer (`src/modules/cache-manager.js`)**
- Multi-tier caching strategy (15min API, 5min RSS)
- Stale-while-revalidate pattern for fresh content
- KV storage integration with intelligent invalidation
- Cache performance monitoring

**Analytics (`src/modules/analytics.js`)**
- Tracks feed requests, API calls, cache performance
- Stores in D1 database or falls back to KV storage
- Provides metrics for optimization and monitoring

### Environment Configuration

Configuration is centralized in `src/config/environment.js` with environment-specific overrides. Key variables:
- `API_BASE_URL`: KarirHub API endpoint
- `MAX_JOBS_PER_FEED`: Controls RSS feed size (default: 20)
- `CACHE_TTL`: Cache duration in seconds (default: 1800)
- `ENABLE_ANALYTICS`: Toggle performance tracking

### Caching Strategy

The system uses intelligent multi-level caching:
- **Job Listings**: 15 minutes (frequently changing)
- **Job Details**: 1 hour (stable data)
- **RSS Feed**: 5 minutes (generated content)
- **JSON Feed**: 5 minutes (alternative format)

Cache keys include environment prefixes to prevent cross-environment contamination.

### RSS Feed Structure

The generated RSS includes:
- **Social Media Optimized**: Titles with emojis, character limits, hashtags
- **WordPress Ready**: Full HTML content with proper formatting
- **Media Support**: Company logos and images via media namespaces
- **Comprehensive Metadata**: Categories, locations, job types, GUIDs

### Error Handling

The system implements graceful degradation:
- API failures fall back to cached content
- Individual job processing failures don't break entire feed
- Comprehensive logging for debugging
- User-friendly error responses

### Integration Points

**Zapier Integration**: Use `/rss` endpoint with 15-minute polling for social media posting
**WordPress Plugins**: Compatible with WP RSS Auto Importer, FeedWordPress
**Monitoring**: `/health` endpoint for uptime checks, `/stats` for performance metrics

### Testing Strategy

- **API Tests**: Validate KarirHub API connectivity and response structure
- **RSS Validation**: Ensure RSS 2.0 compliance and feed reader compatibility
- **Performance Tests**: Monitor response times and cache effectiveness
- Tests use real API data when available, fallback to mock data for reliability