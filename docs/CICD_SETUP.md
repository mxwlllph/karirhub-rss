# CI/CD Setup for Cloudflare Workers

This guide explains how to set up automatic deployment from GitHub to Cloudflare Workers.

## Required GitHub Secrets

To enable automatic deployment, you need to configure the following secrets in your GitHub repository:

### 1. Cloudflare API Token
- **Name**: `CLOUDFLARE_API_TOKEN`
- **Description**: API token for Cloudflare Workers deployment
- **How to create**:
  1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens)
  2. Click "Create Token"
  3. Use "Custom token" template
  4. Configure permissions:
     - **Account**: `Cloudflare Workers:Edit`
     - **Zone**: `Zone:Read` (if needed)
     - **Account Resources**: `All accounts` or specific account
  5. Set TTL as needed
  6. Copy the token value

### 2. Cloudflare Account ID
- **Name**: `CLOUDFLARE_ACCOUNT_ID` (optional)
- **Description**: Your Cloudflare account ID
- **How to find**: In Cloudflare Dashboard sidebar, look for "Account ID"

## Deployment Workflow

### Production Deployment (main branch)
When code is pushed to `main` branch:
1. Runs tests and linting
2. Fixes security vulnerabilities
3. Deploys to Cloudflare Workers using `wrangler deploy`
4. Performs health check on `https://karirhub-rss.tekipik.workers.dev/health`
5. Reports deployment status

### Staging Deployment (develop branch)
When code is pushed to `develop` branch:
1. Runs tests and linting
2. Deploys to staging environment
3. Performs health check on staging URL

## Local Development

### Prerequisites
- Node.js 18+
- Wrangler CLI: `npm install -g wrangler`

### Setup Commands
```bash
# Install dependencies
npm install

# Login to Cloudflare
wrangler auth login

# Run local development
npm run dev

# Deploy manually
npm run deploy
```

## Environment Configuration

The application automatically detects the environment:

- **Production**: `workers.dev` or `tekipik.workers.dev` domains
- **Staging**: Preview deployments
- **Development**: Localhost (port 8787)

### Environment Variables

Configure these in `wrangler.toml`:

```toml
[vars]
ENVIRONMENT = "production"
API_BASE_URL = "https://api.kemnaker.go.id/karirhub/catalogue/v1"
BASE_URL = "https://karirhub-rss.tekipik.workers.dev"
CACHE_TTL = "3600"
MAX_JOBS_PER_FEED = "30"
RSS_TITLE = "Lowongan Kerja Terbaru - KarirHub Indonesia"
RSS_DESCRIPTION = "Feed lowongan kerja resmi dari Kementerian Ketenagakerjaan Indonesia"
RSS_LANGUAGE = "id"
RSS_WEBMASTER = "admin@karirhub.com"
RSS_GENERATOR = "Cloudflare Worker RSS Generator v1.0"
ENABLE_ANALYTICS = "false"
LOG_LEVEL = "info"
```

## KV and D1 Bindings

### KV Namespace (Caching)
```toml
[[kv_namespaces]]
binding = "RSS_CACHE"
id = "your-kv-namespace-id"
preview_id = "your-preview-kv-namespace-id"
```

### D1 Database (Analytics)
```toml
[[d1_databases]]
binding = "RSS_ANALYTICS"
database_name = "karirhub-rss-analytics"
database_id = "your-d1-database-id"
```

## Troubleshooting

### Common Issues

1. **Deployments fail with authentication error**
   - Verify `CLOUDFLARE_API_TOKEN` is correctly set
   - Ensure token has proper permissions
   - Check if token has expired

2. **Health check fails after deployment**
   - Check Worker logs in Cloudflare Dashboard
   - Verify environment variables are set correctly
   - Ensure KV/D1 bindings are properly configured

3. **Cache write failures**
   - Verify KV namespace exists and is bound correctly
   - Check KV namespace permissions
   - Ensure KV namespace ID matches wrangler.toml

### Debug Commands

```bash
# Check Wrangler authentication
wrangler whoami

# View Worker logs
wrangler tail

# Test deployment locally
wrangler dev

# Check KV namespace
wrangler kv:key list --binding=RSS_CACHE
```

## Security Considerations

- Keep API tokens secure and never commit them to repository
- Use minimum required permissions for API tokens
- Regularly rotate API tokens
- Monitor deployment logs for suspicious activity

## Monitoring

### Endpoints to Monitor
- **Health Check**: `/health`
- **RSS Feed**: `/rss`
- **JSON Feed**: `/json`
- **Statistics**: `/stats`

### Expected Response Times
- Health check: < 500ms
- RSS feed generation: < 2000ms
- Cache hits: < 100ms

### Alerting
Set up alerts for:
- Deployment failures
- Health check failures
- High response times
- Error rate increases

## Rollback Procedure

If deployment causes issues:

1. **Immediate rollback**:
   ```bash
   git checkout previous-commit-hash
   git push origin main
   ```

2. **Manual rollback**:
   ```bash
   # List recent deployments
   wrangler deployments list

   # Rollback to specific deployment
   wrangler rollback [deployment-id]
   ```

3. **Emergency disable**:
   - Set `ENABLED=false` environment variable
   - Or return 503 status from Worker

## Performance Optimization

- Use KV caching for API responses
- Implement CDN caching headers
- Monitor KV usage and limits
- Optimize RSS feed size
- Use D1 for analytics sparingly

## Support

For issues with:
- **Cloudflare Workers**: [Cloudflare Docs](https://developers.cloudflare.com/workers/)
- **GitHub Actions**: [GitHub Actions Docs](https://docs.github.com/en/actions)
- **Wrangler CLI**: [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)