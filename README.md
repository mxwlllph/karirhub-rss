# KarirHub RSS Feed Generator

[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=for-the-badge&logo=cloudflare)](https://workers.cloudflare.com/)
[![RSS](https://img.shields.io/badge/RSS-2.0-FFA500?style=for-the-badge&logo=rss)](http://www.rssboard.org/rss-specification)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

🚀 **Cloudflare Worker RSS Feed Generator untuk KarirHub Kementerian Ketenagakerjaan Indonesia**

Transformasi data lowongan kerja dari API KarirHub menjadi RSS feed yang optimal untuk **Zapier** (auto-posting social media) dan **WordPress** (RSS-to-Post plugins).

## ✨ Fitur Utama

- 📡 **RSS 2.0 Compliant** - Validasi XML structure yang sempurna
- 🤖 **Social Media Optimization** - Auto-generate hashtag dan format platform-specific
- 🌐 **WordPress Integration** - Full HTML content untuk auto-create posts
- ⚡ **High Performance** - Multi-level caching dengan Cloudflare Edge
- 📊 **Analytics & Monitoring** - Real-time performance tracking
- 🔒 **Enterprise Ready** - Error handling, rate limiting, dan security best practices

## 🎯 Use Cases

### 🤖 Zapier Automation
```yaml
Trigger: RSS by Zapier → "New Item in Feed"
Platforms: Facebook, Twitter, LinkedIn, Instagram
Frequency: Every 15 minutes
Content: Optimized dengan emoji dan hashtag
```

### 🌐 WordPress Auto-Posting
```yaml
Plugin: WP RSS Auto Importer
Feed URL: https://your-worker.workers.dev/rss
Import: Setiap jam, maksimal 10 posts
Template: Job listing dengan company branding
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Cloudflare account
- Wrangler CLI

### 1. Installation
```bash
# Clone repository
git clone https://github.com/mxwlllph/karirhub-rss.git
cd karirhub-rss

# Install dependencies
npm install
```

### 2. Cloudflare Setup
```bash
# Login dan buat KV namespace
wrangler login
wrangler kv:namespace create "RSS_CACHE"

# Update wrangler.toml dengan KV namespace ID
```

### 3. Test & Deploy
```bash
# Test lokal
npm run dev
curl http://localhost:8787/rss

# Deploy ke production
wrangler deploy --env production

# RSS feed siap digunakan!
# https://your-worker.workers.dev/rss
```

## 📊 Available Endpoints

| Endpoint | Description | Usage |
|----------|-------------|-------|
| `/rss` | RSS 2.0 feed utama | `curl /rss` |
| `/json` | JSON feed alternative | `curl /json` |
| `/health` | Health check status | `curl /health` |
| `/stats` | Analytics statistics | `curl /stats` |

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloudflare     │    │   KarirHub      │    │   RSS Feed      │
│   Worker         │───▶│   API           │───▶│   Generation    │
│  (Serverless)   │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   KV Storage    │    │   Performance   │    │   Social Media  │
│   (Caching)     │    │   Monitoring    │    │   Optimization  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Project Structure

```
worker-karirhub/
├── 📁 src/                    # Source code modular
│   ├── index.js              # Main worker entry point
│   ├── config/               # Environment configuration
│   ├── modules/              # Core functionality modules
│   └── utils/                # Utility functions
├── 📁 docs/                   # Public documentation
│   ├── OVERVIEW.md           # Project overview
│   ├── USER_GUIDE.md         # User guide
│   ├── INTEGRATION.md        # Platform integration
│   ├── ARCHITECTURE.md       # Technical architecture
│   └── TROUBLESHOOTING.md    # Troubleshooting guide
├── 📁 dev-doc/                # Internal development docs
├── 📁 test/                   # Test suites
├── 📁 scripts/                # Utility scripts
├── wrangler.toml             # Cloudflare configuration
└── package.json              # Dependencies
```

## 📱 RSS Feed Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Lowongan Kerja Terbaru - KarirHub Indonesia</title>
    <description>Feed lowongan kerja resmi dari Kementerian Ketenagakerjaan Indonesia</description>
    <item>
      <title>🔥 Lowongan Software Engineer di PT Tech - Jakarta 💰 10-15jt</title>
      <description>S1 • Full-time • Technology</description>
      <content:encoded><![CDATA[Full HTML content...]]></content:encoded>
      <category domain="industry">Technology</category>
      <category domain="location">Jakarta</category>
      <media:thumbnail url="https://company.com/logo.jpg" />
    </item>
  </channel>
</rss>
```

## 🎯 Performance Metrics

- **Response Time**: <200ms (p95)
- **Cache Hit Rate**: >80%
- **Uptime**: >99.9%
- **Error Rate**: <1%

## 🔌 Integration Examples

### Zapier Setup
1. Create Zap with RSS trigger
2. Feed URL: `https://your-worker.workers.dev/rss`
3. Map fields to social media platforms
4. Test and activate

### WordPress Setup
1. Install WP RSS Auto Importer plugin
2. Feed URL: `https://your-worker.workers.dev/rss`
3. Configure import schedule and post template
4. Activate automatic posting

## 🧪 Testing

```bash
# Run test suite
npm test

# API connectivity test
npm run test:api

# RSS validation test
npm run test:rss

# Performance test
time curl https://your-worker.workers.dev/rss
```

## 📚 Documentation

### 📖 User Documentation
- [**User Guide**](./docs/USER_GUIDE.md) - Complete setup and usage instructions
- [**Integration Guide**](./docs/INTEGRATION.md) - Zapier & WordPress integration
- [**Troubleshooting**](./docs/TROUBLESHOOTING.md) - Common issues and solutions

### 🔧 Technical Documentation
- [**Project Overview**](./docs/OVERVIEW.md) - Business purpose and features
- [**Architecture**](./docs/ARCHITECTURE.md) - Technical implementation details
- [**Local Development**](./dev-doc/deployment/LOCAL_DEVELOPMENT.md) - Development setup
- [**GitHub Setup**](./dev-doc/deployment/GITHUB_SETUP.md) - Repository management

## 🚀 Deployment

### Environments
- **Development**: `localhost:8787` (local testing)
- **Staging**: `staging.karirhub.workers.dev` (pre-production)
- **Production**: `karirhub.com` (live service)

### Deploy Commands
```bash
# Development
npm run dev

# Staging
npm run deploy:staging

# Production
npm run deploy:prod
```

## 🤝 Contributing

We welcome contributions! Please:

1. Fork this repository
2. Create feature branch from `develop`
3. Add tests for new functionality
4. Ensure all tests pass: `npm test`
5. Update documentation as needed
6. Submit pull request with detailed description

See [GitHub Setup Guide](./dev-doc/deployment/GITHUB_SETUP.md) for detailed contribution guidelines.

## 📈 Monitoring

### Health Check
```bash
curl https://your-worker.workers.dev/health
```

### Performance Stats
```bash
curl https://your-worker.workers.dev/stats
```

### Real-time Logs
```bash
wrangler tail --env production
```

## 🔒 Security

- ✅ Input validation & sanitization
- ✅ Rate limiting implementation
- ✅ CORS configuration
- ✅ XML injection prevention
- ✅ Secure headers implementation
- ✅ Environment variable protection

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Kementerian Ketenagakerjaan RI** - For providing KarirHub API
- **Cloudflare** - For excellent Workers platform
- **RSS Advisory Board** - For RSS 2.0 specification

## 📞 Support

### 🆘 Getting Help
1. **Check Documentation**: Start with [User Guide](./docs/USER_GUIDE.md)
2. **Run Diagnostics**: `npm test` to validate setup
3. **Check Issues**: [GitHub Issues](https://github.com/mxwlllph/karirhub-rss/issues)
4. **Community**: [GitHub Discussions](https://github.com/mxwlllph/karirhub-rss/discussions)

### 📝 Reporting Issues
When reporting issues, please include:
- Environment (local/staging/production)
- Error messages and stack traces
- Steps to reproduce the problem
- Expected vs actual behavior

---

**🔗 Links**
- [GitHub Repository](https://github.com/mxwlllph/karirhub-rss)
- [Live Demo](https://your-worker.workers.dev/rss) (after deployment)
- [KarirHub API](https://api.kemnaker.go.id/docs)

**Built with ❤️ using Cloudflare Workers for Indonesian job seekers**

---

### 📊 Repository Stats

![GitHub stars](https://img.shields.io/github/stars/mxwlllph/karirhub-rss?style=social)
![GitHub forks](https://img.shields.io/github/forks/mxwlllph/karirhub-rss?style=social)
![GitHub issues](https://img.shields.io/github/issues/mxwlllph/karirhub-rss)
![GitHub pull requests](https://img.shields.io/github/issues-pr/mxwlllph/karirhub-rss)