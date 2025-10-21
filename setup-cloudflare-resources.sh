#!/bin/bash

# Cloudflare Resources Setup Script for KarirHub RSS Feed Generator
# This script creates the necessary KV namespace, D1 database, and Pages project

set -e

echo "🚀 Setting up Cloudflare resources for KarirHub RSS Feed Generator..."

# Check if user is logged in to Cloudflare
echo "📋 Checking Cloudflare authentication..."
if ! wrangler whoami &> /dev/null; then
    echo "❌ Not authenticated with Cloudflare. Please run: wrangler auth login"
    exit 1
fi

echo "✅ Authenticated with Cloudflare"

# Create KV namespace for production
echo "🗂️  Creating KV namespace for RSS cache (production)..."
KV_OUTPUT=$(wrangler kv:namespace create "RSS_CACHE")
KV_ID=$(echo "$KV_OUTPUT" | grep -o '"id": "[^"]*' | cut -d'"' -f4)
echo "✅ Created KV namespace: $KV_ID"

# Create KV namespace for preview/development
echo "🗂️  Creating KV namespace for RSS cache (preview)..."
KV_PREVIEW_OUTPUT=$(wrangler kv:namespace create "RSS_CACHE" --preview)
KV_PREVIEW_ID=$(echo "$KV_PREVIEW_OUTPUT" | grep -o '"id": "[^"]*' | cut -d'"' -f4)
echo "✅ Created preview KV namespace: $KV_PREVIEW_ID"

# Create D1 database for analytics
echo "🗄️  Creating D1 database for analytics..."
D1_OUTPUT=$(wrangler d1 create "karirhub-rss-analytics")
D1_ID=$(echo "$D1_OUTPUT" | grep -o '"id": "[^"]*' | cut -d'"' -f4)
echo "✅ Created D1 database: $D1_ID"

# Update wrangler.toml with actual IDs
echo "📝 Updating wrangler.toml with resource IDs..."
sed -i.bak "s/RSS_CACHE_ID/$KV_ID/g" wrangler.toml
sed -i.bak "s/RSS_CACHE_PREVIEW_ID/$KV_PREVIEW_ID/g" wrangler.toml
sed -i.bak "s/RSS_ANALYTICS_ID/$D1_ID/g" wrangler.toml

echo "✅ Updated wrangler.toml configuration"

# Create a backup of the original file
echo "💾 Backup of original wrangler.toml saved as wrangler.toml.bak"

# Instructions for Pages setup
echo ""
echo "🌐 Next steps for Cloudflare Pages setup:"
echo "1. Go to Cloudflare Dashboard → Pages → Create application"
echo "2. Connect your GitHub repository: https://github.com/mxwlllph/karirhub-rss"
echo "3. Set build settings:"
echo "   - Build command: npm install"
echo "   - Build output directory: /"
echo "   - Root directory: /"
echo ""
echo "4. Add environment variables in Pages dashboard:"
echo "   - CLOUDFLARE_API_TOKEN: Your Cloudflare API token"
echo "   - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID"
echo ""
echo "5. Add KV bindings to Pages Functions:"
echo "   - Variable name: RSS_CACHE"
echo "   - KV namespace: Select the RSS_CACHE namespace"
echo ""
echo "6. Add D1 bindings to Pages Functions:"
echo "   - Variable name: RSS_ANALYTICS"
echo "   - D1 database: Select the karirhub-rss-analytics database"
echo ""
echo "🎉 Setup complete! Your resources are ready for deployment."
echo ""
echo "📄 Resource Summary:"
echo "- KV Namespace (Production): $KV_ID"
echo "- KV Namespace (Preview): $KV_PREVIEW_ID"
echo "- D1 Database: $D1_ID"