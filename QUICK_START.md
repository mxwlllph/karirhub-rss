# ⚡ Quick Start Guide

## 🚀 Get Running in 5 Minutes

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI (`npm install -g wrangler`)

### 1. Clone & Install
```bash
git clone https://github.com/mxwlllph/karirhub-rss.git
cd karirhub-rss
npm install
```

### 2. Cloudflare Setup
```bash
wrangler login
wrangler kv:namespace create "RSS_CACHE"
# Update wrangler.toml with your KV namespace ID
```

### 3. Local Development
```bash
npm run dev
# Visit http://localhost:8787
```

### 4. Test
```bash
npm test
curl http://localhost:8787/rss
```

### 5. Deploy to Production
```bash
wrangler deploy --env production
# Your RSS feed is now live at: https://your-subdomain.workers.dev/rss
```

---

## 📋 Essential Commands

### Development
```bash
npm run dev          # Start local server
npm test             # Run test suite
wrangler tail        # View real-time logs
```

### Deployment
```bash
npm run deploy        # Deploy to development
npm run deploy:staging # Deploy to staging
npm run deploy:prod   # Deploy to production
```

### Testing
```bash
npm run test:api     # API connectivity tests
npm run test:rss     # RSS validation tests
```

### Cache Management
```bash
npm run kv:list      # List KV cache keys
npm run kv:clear     # Clear all cache
```

---

## 🔧 Configuration

### Environment Variables
Edit `wrangler.toml` or use environment variables:
```bash
API_BASE_URL = "https://api.kemnaker.go.id/karirhub/catalogue/v1"
MAX_JOBS_PER_FEED = "20"
CACHE_TTL = "1800"
```

### Local Override
Create `.dev.vars` for local testing:
```bash
LOG_LEVEL = "debug"
MAX_JOBS_PER_FEED = "5"
```

---

## 📊 Endpoints

| Endpoint | Description | Example Usage |
|----------|-------------|---------------|
| `/rss` | RSS 2.0 feed | `curl /rss` |
| `/json` | JSON feed | `curl /json` |
| `/health` | Health status | `curl /health` |
| `/stats` | Analytics | `curl /stats` |

---

## 🧪 Quick Testing

### Check Health
```bash
curl http://localhost:8787/health
```

### Validate RSS
```bash
curl http://localhost:8787/rss | xmllint --format -
```

### Test Performance
```bash
time curl http://localhost:8787/rss
```

---

## 📱 Zapier Integration

1. **Create Zap**: RSS by Zapier → "New Item in Feed"
2. **RSS URL**: `https://your-worker.workers.dev/rss`
3. **Polling**: Every 15 minutes
4. **Map fields**: Title → Social media post, Description → Content

---

## 🌐 WordPress Integration

1. **Install**: WP RSS Auto Importer plugin
2. **Feed URL**: `https://your-worker.workers.dev/rss`
3. **Import**: Every hour, max 10 posts
4. **Template**: Use provided job listing template

---

## 🚨 Troubleshooting

### Common Issues
- **Empty RSS**: Clear cache (`npm run kv:clear`)
- **API timeout**: Check KarirHub API status
- **Deployment fails**: Verify Cloudflare login

### Debug Mode
```bash
wrangler dev --var LOG_LEVEL:debug
```

### Check Logs
```bash
wrangler tail --env production
```

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `src/index.js` | Main worker entry point |
| `wrangler.toml` | Cloudflare configuration |
| `src/config/environment.js` | Environment settings |
| `test/api-test.js` | API test suite |
| `test/rss-validation.js` | RSS validation tests |

---

## 🔄 Development Workflow

1. **Local Development**: `npm run dev`
2. **Test Changes**: `npm test`
3. **Deploy to Staging**: `npm run deploy:staging`
4. **Test Staging**: Manual testing
5. **Deploy to Production**: `npm run deploy:prod`

---

## 📞 Support

### Documentation
- [Full Guide](./LOCAL_DEVELOPMENT.md)
- [Testing Procedures](./dev-doc/testing/TESTING_GUIDE.md)
- [Deployment Workflow](./dev-doc/deployment/DEPLOYMENT_WORKFLOW.md)

### Help Commands
```bash
# Get help with Wrangler
wrangler --help

# Check KV namespace status
wrangler kv:namespace list

# View available routes
wrangler route list
```

### Quick Tips
- Start with small job counts for testing (`MAX_JOBS_PER_FEED=5`)
- Use `wrangler tail` for debugging
- Clear cache when testing API changes
- Monitor `/stats` for performance metrics

---

## 🎯 Success Indicators

✅ **Local Development**: `http://localhost:8787/health` returns healthy
✅ **RSS Generation**: `/rss` returns valid XML
✅ **API Integration**: Tests pass with real KarirHub data
✅ **Deployment**: Worker deploys without errors
✅ **Production**: Live RSS feed accessible online

---

**🎉 You're ready!** Your KarirHub RSS Feed Worker is now running and can be integrated with Zapier, WordPress, or any RSS-consuming service.