# User Guide - KarirHub RSS Feed Generator

## 🚀 Getting Started

This guide will help you set up and use the KarirHub RSS Feed Generator for automated job posting to social media and WordPress.

## Prerequisites

- Cloudflare account (Free tier works)
- Node.js 18+ installed
- Git for repository management
- Basic understanding of RSS feeds

## Quick Setup (5 minutes)

### 1. Install Dependencies

```bash
# Clone the repository
git clone https://github.com/mxwlllph/karirhub-rss.git
cd karirhub-rss

# Install dependencies
npm install
```

### 2. Cloudflare Setup

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Create KV namespace for caching
wrangler kv:namespace create "RSS_CACHE"
```

### 3. Configure Project

Update `wrangler.toml` with your KV namespace ID:

```toml
[[kv_namespaces]]
binding = "RSS_CACHE"
id = "your-kv-namespace-id"  # Replace with your actual ID
preview_id = "your-preview-kv-namespace-id"
```

### 4. Test Locally

```bash
# Start development server
npm run dev

# Test the RSS feed
curl http://localhost:8787/rss
```

### 5. Deploy to Production

```bash
# Deploy to Cloudflare Workers
wrangler deploy --env production

# Your RSS feed is now live!
# https://your-worker.your-subdomain.workers.dev/rss
```

## 📱 Integration Setup

### Zapier Integration (Social Media)

1. **Create New Zap**
   - Go to [Zapier](https://zapier.com)
   - Click "Create Zap"
   - Choose "RSS by Zapier" as the trigger

2. **Configure RSS Trigger**
   - Select "New Item in Feed"
   - RSS URL: `https://your-worker.workers.dev/rss`
   - Polling Interval: 15 minutes
   - Click "Continue"

3. **Set Up Action**
   - Choose your social media platform (Facebook, Twitter, LinkedIn, etc.)
   - Connect your account
   - Map the RSS fields:
     - **Title**: Post content
     - **Description**: Additional context
     - **Link**: "Read more" URL

4. **Test and Activate**
   - Test the integration
   - Turn on your Zap

### WordPress Integration (Website)

#### Method 1: WP RSS Auto Importer (Recommended)

1. **Install Plugin**
   - In WordPress admin, go to Plugins → Add New
   - Search "WP RSS Auto Importer"
   - Install and activate

2. **Configure Import**
   - Go to RSS Aggregator → Import Feeds
   - Feed URL: `https://your-worker.workers.dev/rss`
   - Import Interval: Every hour
   - Max Posts: 10 per import

3. **Set Up Post Template**
   - Use "Job Listing" post type
   - Set status to "Published"
   - Enable featured images from media:thumbnail

#### Method 2: FeedWordPress

1. **Install Plugin**
   - Search and install "FeedWordPress"

2. **Add Feed**
   - Go to Syndication → Posts & Links
   - Add: `https://your-worker.workers.dev/rss`
   - Set update schedule to hourly

3. **Configure Categories**
   - Map RSS categories to WordPress categories
   - Set default post status to "Published"

## 📊 Available Endpoints

Your RSS Feed Worker provides these endpoints:

| Endpoint | Description | Usage |
|----------|-------------|-------|
| `/rss` | RSS 2.0 feed | Main feed for readers |
| `/json` | JSON format | API consumption |
| `/health` | System status | Monitoring |
| `/stats` | Usage statistics | Analytics |

### RSS Feed Structure

The RSS feed includes:
- **Title**: Optimized for social media with emojis
- **Description**: Job details with salary and location
- **Content**: Full HTML content for WordPress
- **Categories**: Industry and location tags
- **Media**: Company logos and images

## 🔧 Configuration Options

### Environment Variables

Customize your feed by updating `wrangler.toml`:

```toml
[vars]
# API Configuration
API_BASE_URL = "https://api.kemnaker.go.id/karirhub/catalogue/v1"
MAX_JOBS_PER_FEED = "20"

# RSS Settings
RSS_TITLE = "Lowongan Kerja Terbaru - KarirHub Indonesia"
RSS_DESCRIPTION = "Feed lowongan kerja resmi dari Kementerian Ketenagakerjaan Indonesia"

# Performance
CACHE_TTL = "1800"  # 30 minutes
ENABLE_ANALYTICS = "true"
LOG_LEVEL = "info"
```

### Customization Options

#### Content Length
- **Social Media**: Short titles with emojis (Twitter optimized)
- **WordPress**: Full HTML content with formatting
- **JSON**: Complete data structure for APIs

#### Caching Strategy
- **Job Listings**: 15 minutes
- **Job Details**: 1 hour
- **RSS Feed**: 5 minutes
- **Analytics**: 24 hours

## 📱 Social Media Optimization

### Platform-Specific Features

#### Twitter/X
- 280 character limit
- Hashtag generation
- Image attachments via media:thumbnail
- Link preview optimization

#### Facebook
- Full HTML content support
- Rich media previews
- Automatic link expansion
- Multiple image support

#### LinkedIn
- Professional formatting
- Industry hashtag suggestions
- Company mentions
- Professional tone

#### Instagram
- Visual content focus
- Caption optimization
- Story swipe-up links
- Image carousel support

### Hashtag Strategy

The system automatically generates relevant hashtags:
- **Industry**: #Software, #Marketing, #Finance
- **Location**: #Jakarta, #Surabaya, #Bandung
- **Job Type**: #Remote, #FullTime, #Freelance
- **Skills**: #JavaScript, #Python, #Design

## 📈 Monitoring and Analytics

### Health Monitoring

Check your worker status:
```bash
curl https://your-worker.workers.dev/health
```

### Performance Statistics

View usage statistics:
```bash
curl https://your-worker.workers.dev/stats
```

### Monitoring Dashboard

Key metrics to monitor:
- **Response Time**: Should be <200ms
- **Cache Hit Rate**: Should be >80%
- **Error Rate**: Should be <1%
- **Feed Requests**: Track usage patterns

## 🚨 Troubleshooting

### Common Issues

#### Empty RSS Feed
```bash
# Check API connectivity
curl https://api.kemnaker.go.id/karirhub/catalogue/v1/industrial-vacancies?page=1&limit=1

# Clear cache
npm run kv:clear
```

#### Slow Response Time
- Reduce `MAX_JOBS_PER_FEED` in config
- Check cache hit rate via `/stats`
- Verify KV namespace is properly configured

#### Social Media Posting Errors
- Verify RSS feed is valid XML
- Check Zapier connection status
- Ensure content meets platform requirements

#### WordPress Import Issues
- Confirm feed URL is accessible
- Check plugin configuration
- Verify post template settings

### Debug Mode

Enable detailed logging:
```bash
wrangler dev --var LOG_LEVEL:debug
```

### Log Monitoring

View real-time logs:
```bash
wrangler tail --env production
```

## 🔄 Maintenance

### Regular Tasks

1. **Weekly**
   - Check performance metrics
   - Monitor error rates
   - Review feed quality

2. **Monthly**
   - Update dependencies
   - Review caching strategy
   - Optimize content length

3. **Quarterly**
   - Update integration settings
   - Review platform requirements
   - Update documentation

### Updates and Upgrades

Keep your deployment up to date:

```bash
# Pull latest changes
git pull origin main

# Update dependencies
npm install

# Test changes
npm test

# Deploy updates
wrangler deploy --env production
```

## 📞 Support

### Documentation
- [Technical Architecture](./ARCHITECTURE.md)
- [Integration Guide](./INTEGRATION.md)
- [Troubleshooting](./TROUBLESHOOTING.md)

### Development Resources
- [GitHub Repository](https://github.com/mxwlllph/karirhub-rss)
- [Issue Reporting](https://github.com/mxwlllph/karirhub-rss/issues)

### Community
- [Discussions](https://github.com/mxwlllph/karirhub-rss/discussions)
- [FAQ](https://github.com/mxwlllph/karirhub-rss/wiki)

---

**🎉 Congratulations!** Your KarirHub RSS Feed Generator is now set up and ready to automatically share Indonesian job opportunities across multiple platforms.

Need help? Check our [Troubleshooting Guide](./TROUBLESHOOTING.md) or [open an issue](https://github.com/mxwlllph/karirhub-rss/issues).