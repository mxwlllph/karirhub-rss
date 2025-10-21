# Troubleshooting Guide - KarirHub RSS Feed Generator

## 🚨 Common Issues and Solutions

This comprehensive troubleshooting guide covers common problems, their causes, and step-by-step solutions for the KarirHub RSS Feed Generator.

## 🔍 Diagnostic Tools

### Health Check Commands

Always start with these basic diagnostic commands:

```bash
# Check worker health
curl https://your-worker.workers.dev/health

# Test RSS feed generation
curl -H "Accept: application/rss+xml" https://your-worker.workers.dev/rss

# Test JSON feed
curl https://your-worker.workers.dev/json

# Check performance metrics
curl https://your-worker.workers.dev/stats

# Test with timing information
curl -w "@curl-format.txt" https://your-worker.workers.dev/rss
```

### curl-format.txt for Performance Testing
```bash
# Create curl-format.txt file
     time_namelookup:  %{time_namelookup}\n
        time_connect:  %{time_connect}\n
     time_appconnect:  %{time_appconnect}\n
    time_pretransfer:  %{time_pretransfer}\n
       time_redirect:  %{time_redirect}\n
  time_starttransfer:  %{time_starttransfer}\n
                     ----------\n
          time_total:  %{time_total}\n
```

## 📡 RSS Feed Issues

### Problem: Empty RSS Feed

**Symptoms:**
- RSS feed returns valid XML but no items
- `<channel>` element exists but no `<item>` elements
- Feed validates but contains no content

**Diagnostic Steps:**
```bash
# 1. Check API connectivity
curl https://api.kemnaker.go.id/karirhub/catalogue/v1/industrial-vacancies?page=1&limit=1

# 2. Check worker logs
wrangler tail --env production

# 3. Test with debug mode
wrangler dev --var LOG_LEVEL:debug
curl http://localhost:8787/rss
```

**Common Causes & Solutions:**

1. **API Endpoint Issues**
   ```bash
   # Check API status
   curl -I https://api.kemnaker.go.id/karirhub/catalogue/v1/industrial-vacancies

   # If API is down, check KarirHub status page
   # Wait for API recovery or implement fallback content
   ```

2. **Authentication Issues**
   ```bash
   # Check if API requires authentication
   curl -H "Authorization: Bearer YOUR_TOKEN" https://api.kemnaker.go.id/karirhub/catalogue/v1/industrial-vacancies?page=1&limit=1

   # Update wrangler.toml with required credentials
   wrangler secret put KARIRHUB_API_TOKEN
   ```

3. **Rate Limiting**
   ```bash
   # Check if you're being rate-limited
   curl -I https://api.kemnaker.go.id/karirhub/catalogue/v1/industrial-vacancies
   # Look for 429 status code or rate-limit headers

   # Solution: Implement exponential backoff in api-fetcher.js
   ```

4. **Data Parsing Errors**
   ```bash
   # Test API response format
   curl https://api.kemnaker.go.id/karirhub/catalogue/v1/industrial-vacancies?page=1&limit=1 | jq '.'

   # Check if response format has changed
   # Update data-aggregator.js to handle new format
   ```

### Problem: Invalid RSS XML

**Symptoms:**
- RSS feed fails XML validation
- Browsers can't parse the feed
- RSS readers show parsing errors

**Diagnostic Steps:**
```bash
# 1. Validate RSS feed
curl https://your-worker.workers.dev/rss | xmllint --format -

# 2. Check XML validation
curl https://your-worker.workers.dev/rss | xmllint --valid -

# 3. Use online validator
# https://validator.w3.org/feed/
```

**Common Causes & Solutions:**

1. **XML Escaping Issues**
   ```javascript
   // In rss-generator.js, ensure proper escaping
   function escapeXml(text) {
     return text
       .replace(/&/g, '&amp;')
       .replace(/</g, '&lt;')
       .replace(/>/g, '&gt;')
       .replace(/"/g, '&quot;')
       .replace(/'/g, '&#39;');
   }
   ```

2. **Invalid Characters**
   ```javascript
   // Remove or replace invalid characters
   function cleanText(text) {
     return text
       .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
       .replace(/[\uFFFE\uFFFF]/g, ''); // Remove invalid Unicode
   }
   ```

3. **Malformed Structure**
   ```xml
   <!-- Ensure proper RSS 2.0 structure -->
   <?xml version="1.0" encoding="UTF-8"?>
   <rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
     <channel>
       <title>Required</title>
       <description>Required</description>
       <link>Required</link>
       <item>
         <title>Required</title>
         <description>Required</description>
       </item>
     </channel>
   </rss>
   ```

### Problem: Slow Response Times

**Symptoms:**
- RSS feed takes >2 seconds to load
- Timeouts during feed generation
- Poor performance monitoring metrics

**Diagnostic Steps:**
```bash
# 1. Measure response time
time curl https://your-worker.workers.dev/rss

# 2. Check performance metrics
curl https://your-worker.workers.dev/stats | jq

# 3. Analyze timing breakdown
curl -w "@curl-format.txt" https://your-worker.workers.dev/rss -o /dev/null
```

**Optimization Solutions:**

1. **Cache Issues**
   ```bash
   # Check cache hit rate
   curl https://your-worker.workers.dev/stats | jq '.cacheOperations.hitRate'

   # If hit rate < 80%, clear cache and restart
   wrangler kv:key delete --namespace-id=YOUR_KV_ID "rss-cache:*"
   ```

2. **API Performance**
   ```bash
   # Test API response time
   time curl https://api.kemnaker.go.id/karirhub/catalogue/v1/industrial-vacancies?page=1&limit=20

   # If slow, reduce number of job requests
   # Update MAX_JOBS_PER_FEED in wrangler.toml
   ```

3. **Worker Cold Start**
   ```bash
   # Prevent cold starts with scheduled warm-up
   # Add cron trigger to wrangler.toml:
   [triggers]
   crons = ["*/5 * * * *"]  # Every 5 minutes
   ```

## 🔌 Integration Issues

### Zapier Integration Problems

**Problem: Zap Not Triggering**

**Diagnostic Steps:**
```bash
# 1. Check RSS feed accessibility
curl -H "Accept: application/rss+xml" https://your-worker.workers.dev/rss

# 2. Test Zapier webhook
# In Zapier, check "We didn't receive a webhook" errors

# 3. Check polling frequency
# Zapier polls every 15 minutes by default
```

**Solutions:**

1. **RSS Feed Format Issues**
   ```xml
   <!-- Ensure proper RSS structure for Zapier -->
   <rss version="2.0">
     <channel>
       <title>Your Feed Title</title>
       <description>Your feed description</description>
       <item>
         <title>Job Title</title>
         <description>Job Description</description>
         <link>https://example.com/job/123</link>
         <pubDate>Mon, 20 Oct 2025 10:00:00 GMT</pubDate>
         <guid isPermaLink="false">123</guid>
       </item>
     </channel>
   </rss>
   ```

2. **Content Length Issues**
   ```javascript
   // Zapier has limits on item size
   // Keep descriptions under 10KB
   function truncateContent(content, maxLength = 10000) {
     return content.length > maxLength ?
       content.substring(0, maxLength - 3) + '...' : content;
   }
   ```

**Problem: Social Media Posting Errors**

**Solutions:**

1. **Twitter Character Limits**
   ```javascript
   // Ensure tweets are under 280 characters
   function formatTweet(job) {
     const title = job.title.substring(0, 100);
     const salary = job.salaryRange || '';
     const location = job.location || '';
     const link = job.shortUrl || job.url;

     return `${title} ${salary} ${location} ${link}`.substring(0, 279);
   }
   ```

2. **Facebook Link Previews**
   ```bash
   # Debug Facebook link sharing
   curl https://developers.facebook.com/tools/debug/?q=https://your-worker.workers.dev/rss

   # Add Open Graph tags if needed
   ```

### WordPress Integration Problems

**Problem: Plugin Not Importing Content**

**Diagnostic Steps:**
```bash
# 1. Test RSS feed accessibility from WordPress server
curl -v https://your-worker.workers.dev/rss

# 2. Check WordPress plugin logs
# In WordPress admin: Tools → Site Health → Info

# 3. Test import manually
# In WordPress: RSS Aggregator → Import Feeds → Test Import
```

**Solutions:**

1. **Feed URL Issues**
   ```bash
   # Verify feed is accessible
   curl -L https://your-worker.workers.dev/rss

   # Check for HTTP redirects
   curl -I https://your-worker.workers.dev/rss
   ```

2. **Content Format Issues**
   ```xml
   <!-- WordPress prefers full content in content:encoded -->
   <item>
     <title>Job Title</title>
     <description>Brief description</description>
     <content:encoded><![CDATA[
       <h2>Full job description with HTML</h2>
       <p>Complete job details...</p>
     ]]></content:encoded>
     <category domain="industry">Technology</category>
     <category domain="location">Jakarta</category>
   </item>
   ```

3. **Image Import Issues**
   ```xml
   <!-- Include proper media thumbnails -->
   <media:thumbnail url="https://example.com/logo.jpg" />
   <media:content url="https://example.com/image.jpg" type="image/jpeg" />
   ```

## 🗄️ Cache Issues

### Problem: Cache Not Working

**Symptoms:**
- High API call frequency
- Slow response times
- Cache hit rate near 0%

**Diagnostic Steps:**
```bash
# 1. Check cache statistics
curl https://your-worker.workers.dev/stats | jq '.cacheOperations'

# 2. Test cache functionality
curl https://your-worker.workers.dev/rss  # First request
curl https://your-worker.workers.dev/rss  # Second request should be cached

# 3. Check KV namespace status
wrangler kv:namespace list
```

**Solutions:**

1. **KV Namespace Configuration**
   ```bash
   # Verify KV namespace is properly configured
   wrangler kv:namespace list

   # Check wrangler.toml configuration
   grep -A 5 "kv_namespaces" wrangler.toml
   ```

2. **Cache Key Issues**
   ```javascript
   // Ensure consistent cache key generation
   function generateCacheKey(params) {
     return `rss-feed:${JSON.stringify(params)}`;
   }
   ```

3. **Cache TTL Issues**
   ```javascript
   // Check if TTL is too short
   const CACHE_TTL = parseInt(env.CACHE_TTL) || 1800; // 30 minutes
   ```

### Problem: Stale Cache Data

**Solutions:**

1. **Manual Cache Clear**
   ```bash
   # Clear all RSS cache
   wrangler kv:key delete --namespace-id=YOUR_KV_ID "rss-cache:*"

   # Clear specific cache entry
   wrangler kv:key delete --namespace-id=YOUR_KV_ID "rss-feed:default"
   ```

2. **Automatic Cache Invalidation**
   ```javascript
   // Implement cache invalidation on data updates
   async function invalidateCache(cacheKey) {
     await env.RSS_CACHE.delete(cacheKey);
   }
   ```

## 🚀 Deployment Issues

### Problem: Worker Deployment Fails

**Diagnostic Steps:**
```bash
# 1. Check Wrangler configuration
wrangler whoami

# 2. Validate wrangler.toml
wrangler validate

# 3. Check for syntax errors
npm test

# 4. Detailed deployment logs
wrangler deploy --env production --verbose
```

**Common Solutions:**

1. **Configuration Errors**
   ```toml
   # Ensure proper wrangler.toml structure
   name = "karirhub-rss-feed"
   main = "src/index.js"
   compatibility_date = "2023-12-01"

   [[kv_namespaces]]
   binding = "RSS_CACHE"
   id = "your-kv-namespace-id"
   ```

2. **Environment Variable Issues**
   ```bash
   # Check required environment variables
   wrangler secret list

   # Set missing secrets
   wrangler secret put API_KEY
   ```

3. **Module Import Issues**
   ```javascript
   // Ensure proper ES6 module syntax
   import { fetchJobs } from './modules/api-fetcher.js';
   export default {
     fetch: handleRequest
   };
   ```

### Problem: Custom Domain Not Working

**Diagnostic Steps:**
```bash
# 1. Check DNS configuration
nslookup karirhub.com

# 2. Check SSL certificate
curl -I https://karirhub.com

# 3. Verify Cloudflare route
wrangler route list
```

**Solutions:**

1. **DNS Configuration**
   ```bash
   # Point A record to Cloudflare IP
   # Or use CNAME to workers.dev subdomain

   # Test DNS propagation
   dig karirhub.com
   ```

2. **SSL Certificate**
   ```bash
   # Cloudflare provides free SSL certificates
   # Ensure SSL/TLS mode is "Full (Strict)" in Cloudflare dashboard
   ```

## 📊 Performance Monitoring

### Setting Up Monitoring

**Health Monitoring Script:**
```bash
#!/bin/bash
# health-check.sh

RSS_URL="https://your-worker.workers.dev"
HEALTH_URL="$RSS_URL/health"
RSS_FEED_URL="$RSS_URL/rss"

echo "=== Health Check ==="
curl -s "$HEALTH_URL" | jq '.'

echo -e "\n=== RSS Feed Check ==="
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$RSS_FEED_URL")
echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ RSS feed is accessible"
else
    echo "❌ RSS feed is not accessible (Status: $HTTP_STATUS)"
fi

echo -e "\n=== Performance Check ==="
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$RSS_FEED_URL")
echo "Response Time: ${RESPONSE_TIME}s"

if (( $(echo "$RESPONSE_TIME < 0.5" | bc -l) )); then
    echo "✅ Response time is good"
else
    echo "⚠️ Response time is slow"
fi
```

**Performance Alerting:**
```bash
#!/bin/bash
# performance-alert.sh

RSS_URL="https://your-worker.workers.dev/rss"
MAX_RESPONSE_TIME=1.0
MIN_CACHE_HIT_RATE=80

RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$RSS_URL")
CACHE_STATS=$(curl -s "$RSS_URL/../stats")
CACHE_HIT_RATE=$(echo "$CACHE_STATS" | jq -r '.cacheOperations.hitRate // 0' | tr -d '%')

# Alert if performance is poor
if (( $(echo "$RESPONSE_TIME > $MAX_RESPONSE_TIME" | bc -l) )); then
    echo "🚨 ALERT: High response time: ${RESPONSE_TIME}s"
    # Send notification (email, Slack, etc.)
fi

if (( $(echo "$CACHE_HIT_RATE < $MIN_CACHE_HIT_RATE" | bc -l) )); then
    echo "🚨 ALERT: Low cache hit rate: ${CACHE_HIT_RATE}%"
    # Send notification
fi
```

## 🔧 Debug Mode

### Enabling Detailed Logging

**Local Development:**
```bash
# Start with debug logging
wrangler dev --var LOG_LEVEL:debug

# Monitor logs in real-time
wrangler tail --format=pretty
```

**Production Debugging:**
```bash
# Temporary debug mode
wrangler deploy --env production --var LOG_LEVEL:debug

# Monitor production logs
wrangler tail --env production

# Remember to revert to warn level
wrangler deploy --env production --var LOG_LEVEL:warn
```

### Debug Information Collection

**Comprehensive Debug Script:**
```bash
#!/bin/bash
# collect-debug-info.sh

echo "=== System Information ==="
date
echo "Node.js version: $(node --version)"
echo "Wrangler version: $(wrangler --version)"

echo -e "\n=== Worker Status ==="
wrangler whoami

echo -e "\n=== KV Namespaces ==="
wrangler kv:namespace list

echo -e "\n=== Routes ==="
wrangler route list

echo -e "\n=== Health Check ==="
curl -s https://your-worker.workers.dev/health | jq '.'

echo -e "\n=== Performance Stats ==="
curl -s https://your-worker.workers.dev/stats | jq '.'

echo -e "\n=== RSS Feed Test ==="
curl -s https://your-worker.workers.dev/rss | head -20

echo -e "\n=== Recent Logs ==="
wrangler tail --env production --since=1h
```

## 📞 Getting Help

### Before Requesting Support

1. **Check This Guide**
   - Review relevant sections
   - Try suggested solutions
   - Document what you've tried

2. **Collect Debug Information**
   ```bash
   ./collect-debug-info.sh > debug-info.txt
   ```

3. **Check GitHub Issues**
   - Search existing issues
   - Check for known problems
   - Review recent discussions

### Creating Support Requests

When creating a GitHub issue, include:

1. **Environment Information**
   - Worker URL
   - Deployment environment (dev/staging/prod)
   - Browser and OS

2. **Problem Description**
   - Clear description of the issue
   - Steps to reproduce
   - Expected vs actual behavior

3. **Debug Information**
   - Output from `collect-debug-info.sh`
   - Relevant error messages
   - Performance metrics

4. **Troubleshooting Steps Taken**
   - What you've already tried
   - Results of each attempt
   - Any changes made

### Community Resources

- **GitHub Issues**: [Create New Issue](https://github.com/mxwlllph/karirhub-rss/issues)
- **GitHub Discussions**: [Community Forum](https://github.com/mxwlllph/karirhub-rss/discussions)
- **Documentation**: [Project Docs](https://github.com/mxwlllph/karirhub-rss/wiki)
- **Email Support**: Available for enterprise customers

---

**🎯 Pro Tip**: Most issues are resolved by checking the health endpoint and reviewing the logs. Always start there before diving into complex debugging!