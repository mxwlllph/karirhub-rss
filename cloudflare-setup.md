# Cloudflare Pages + Workers Deployment Guide

This guide walks you through setting up your KarirHub RSS Feed Generator with Cloudflare Pages and Workers integration.

## 📋 Prerequisites

- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [GitHub Account](https://github.com/signup)
- [Node.js 18+](https://nodejs.org/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/)

## 🚀 Quick Setup

### Step 1: Authenticate with Cloudflare

```bash
# Install Wrangler if you haven't already
npm install -g wrangler

# Login to Cloudflare
wrangler auth login
```

### Step 2: Create Cloudflare Resources

Run the setup script to automatically create all necessary resources:

**Windows:**
```cmd
setup-cloudflare-resources.bat
```

**Linux/Mac:**
```bash
chmod +x setup-cloudflare-resources.sh
./setup-cloudflare-resources.sh
```

**Manual Setup (if scripts fail):**

```bash
# Create KV namespace for production
wrangler kv:namespace create "RSS_CACHE"

# Create KV namespace for preview
wrangler kv:namespace create "RSS_CACHE" --preview

# Create D1 database
wrangler d1 create "karirhub-rss-analytics"
```

After running these commands, update `wrangler.toml` with the returned IDs:
- Replace `RSS_CACHE_ID` with production KV namespace ID
- Replace `RSS_CACHE_PREVIEW_ID` with preview KV namespace ID
- Replace `RSS_ANALYTICS_ID` with D1 database ID

### Step 3: Create Cloudflare Pages Project

1. **Go to Cloudflare Dashboard** → [Pages](https://dash.cloudflare.com/pages)
2. **Click "Create application"**
3. **Connect to Git** → Select GitHub → Choose `karirhub-rss` repository
4. **Set build settings:**
   - **Framework preset:** None
   - **Build command:** `npm install`
   - **Build output directory:** `/`
   - **Root directory:** `/`
5. **Click "Save and Deploy"**

### Step 4: Configure Pages Functions

1. **In your Pages project**, go to **Settings** → **Functions**
2. **Add KV namespace binding:**
   - **Variable name:** `RSS_CACHE`
   - **KV namespace:** Select your `RSS_CACHE` namespace
3. **Add D1 database binding:**
   - **Variable name:** `RSS_ANALYTICS`
   - **D1 database:** Select your `karirhub-rss-analytics` database

### Step 5: Set Environment Variables

In **Settings** → **Environment variables**, add:

**Production:**
- `CLOUDFLARE_API_TOKEN`: Your API token
- `CLOUDFLARE_ACCOUNT_ID`: Your account ID
- `ENVIRONMENT`: `production`

**Preview:**
- `CLOUDFLARE_API_TOKEN`: Your API token
- `CLOUDFLARE_ACCOUNT_ID`: Your account ID
- `ENVIRONMENT`: `preview`

## 🔧 Configuration Details

### Resource Bindings

The application uses these bindings in `wrangler.toml`:

```toml
# KV namespace for caching
[[kv_namespaces]]
binding = "RSS_CACHE"
id = "YOUR_ACTUAL_KV_ID"
preview_id = "YOUR_ACTUAL_PREVIEW_KV_ID"

# D1 database for analytics
[[d1_databases]]
binding = "RSS_ANALYTICS"
database_name = "karirhub-rss-analytics"
database_id = "YOUR_ACTUAL_D1_ID"
```

### Environment Variables

The application supports these environment variables:

- `API_BASE_URL`: KarirHub API endpoint
- `CACHE_TTL`: Cache duration in seconds (default: 1800)
- `MAX_JOBS_PER_FEED`: Maximum jobs per RSS feed (default: 20)
- `RSS_TITLE`: Custom RSS feed title
- `RSS_DESCRIPTION`: RSS feed description
- `ENABLE_ANALYTICS`: Enable analytics tracking (true/false)
- `LOG_LEVEL`: Logging level (info, debug, warn, error)

## 🌍 Deployment URLs

After setup, your application will be available at:

- **Production:** `https://karirhub-rss.pages.dev`
- **Preview (for PRs):** `https://random-string.karirhub-rss.pages.dev`

### Available Endpoints

- **RSS Feed:** `/rss` - Full RSS 2.0 feed with job listings
- **JSON Feed:** `/json` - JSON alternative to RSS feed
- **Health Check:** `/health` - Application health status
- **Statistics:** `/stats` - Performance and usage analytics

## 🔄 Automatic Deployments

The GitHub Actions workflow automatically deploys:

- **Main branch** → Production Pages
- **Develop branch** → Preview Pages
- **Pull requests** → Preview deployments

## 🐛 Troubleshooting

### Common Issues

**1. KV namespace error:**
```
KV namespace 'your-kv-namespace-id' is not valid
```
**Solution:** Run the setup script to create real KV namespaces and update `wrangler.toml`.

**2. Worker name mismatch:**
```
Expected "karirhub-rss" but got "karirhub-rss-feed"
```
**Solution:** The updated `wrangler.toml` fixes this naming issue.

**3. D1 database binding error:**
```
D1 database binding not found
```
**Solution:** Ensure D1 database is created and properly bound in Pages Functions settings.

**4. Build failures:**
```
npm audit found 2 moderate vulnerabilities
```
**Solution:** The workflow now runs `npm audit fix` automatically.

### Debugging Commands

```bash
# Check deployment status
wrangler pages deployment list --project-name=karirhub-rss

# View real-time logs
wrangler pages deployment tail --project-name=karirhub-rss

# Test locally
npm run dev

# Validate configuration
npx wrangler whoami
```

## 📊 Monitoring

### Health Checks

The `/health` endpoint returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-21T04:44:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

### Analytics

The `/stats` endpoint provides:
- Cache hit rates
- API response times
- Error rates
- Feed generation metrics

## 🔐 Security

- **No hardcoded secrets** in the codebase
- **Environment variables** for sensitive configuration
- **Input validation** and sanitization
- **Rate limiting** and caching for performance
- **Security scanning** in CI/CD pipeline

## 🎉 Success!

Once deployed, your KarirHub RSS Feed Generator will:
- Automatically fetch job listings from KarirHub API
- Generate RSS feeds every 15 minutes
- Cache responses for performance
- Track analytics and usage metrics
- Serve Zapier-compatible feeds for social media automation

**Integration Examples:**
- **Zapier:** Use `/rss` endpoint for social media posting
- **WordPress:** Compatible with RSS import plugins
- **Social Media:** Optimized titles and hashtags

Your RSS feed is now ready for integration! 🚀