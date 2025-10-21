#!/bin/bash

# Git Initialization Script for KarirHub RSS Feed Worker
# This script initializes the git repository and creates the initial commit

set -e  # Exit on any error

echo "🚀 Initializing Git repository for KarirHub RSS Feed Worker..."

# Check if we're in the right directory
if [ ! -f "wrangler.toml" ]; then
    echo "❌ Error: wrangler.toml not found. Make sure you're in the project root directory."
    exit 1
fi

# Initialize git repository
echo "📝 Initializing git repository..."
git init

# Set up git configuration (modify as needed)
echo "⚙️ Setting git configuration..."
git config user.name "KarirHub RSS Developer"
git config user.email "developer@karirhub.com"

# Add all files (respecting .gitignore)
echo "📁 Adding files to git..."
git add .

# Create initial commit
echo "💝 Creating initial commit..."
git commit -m "Initial commit: KarirHub RSS Feed Worker

🚀 Features:
• Cloudflare Worker RSS feed generation
• KarirHub API integration with real data
• Social media optimization (Zapier-ready)
• WordPress plugin compatibility
• Multi-environment support (dev/staging/prod)
• Comprehensive caching strategy
• Analytics and monitoring
• Performance optimization

📁 Project Structure:
• src/ - Modular source code architecture
• test/ - Comprehensive test suite
• dev-doc/ - Development documentation (gitignored)
• wrangler.toml - Cloudflare Worker configuration
• .gitignore - Comprehensive exclusion rules

🔧 Tech Stack:
• Cloudflare Workers (serverless)
• Node.js 18+ runtime
• Wrangler CLI for deployment
• KV storage for intelligent caching
• D1 database for analytics

📊 Performance Targets:
• Response time: <200ms (p95)
• Cache hit rate: >80%
• Uptime: >99.9%
• Error rate: <1%

🔌 Integration Ready:
• Zapier RSS triggers
• WordPress RSS-to-Post plugins
• Social media platforms (Twitter, Facebook, LinkedIn, Instagram)
• Custom RSS feed readers

📚 Documentation:
• QUICK_START.md - 5-minute setup guide
• LOCAL_DEVELOPMENT.md - Complete local setup
• TESTING_GUIDE.md - Testing procedures
• GITHUB_SETUP.md - Repository setup
• DEPLOYMENT_WORKFLOW.md - Multi-environment deployment
• CLAUDE.md - AI assistant guidance

Ready for development and deployment! 🎉"

# Set up main branch
echo "🌿 Setting up main branch..."
git branch -M main

# Create develop branch for development work
echo "🌿 Creating develop branch..."
git checkout -b develop
git checkout main

# Show success message
echo ""
echo "✅ Git repository successfully initialized!"
echo ""
echo "📋 Next steps:"
echo "1. Connect to GitHub repository:"
echo "   git remote add origin https://github.com/mxwlllph/karirhub-rss.git"
echo "   git push -u origin main"
echo ""
echo "2. Set up Cloudflare Workers:"
echo "   wrangler login"
echo "   wrangler kv:namespace create \"RSS_CACHE\""
echo "   # Update wrangler.toml with your KV namespace IDs"
echo ""
echo "3. Start local development:"
echo "   npm run dev"
echo ""
echo "4. Test locally:"
echo "   npm test"
echo "   curl http://localhost:8787/health"
echo ""
echo "5. Deploy to staging:"
echo "   wrangler deploy --env staging"
echo ""
echo "📚 For detailed instructions, see:"
echo "   • QUICK_START.md - Quick reference guide"
echo "   • LOCAL_DEVELOPMENT.md - Complete setup guide"
echo "   • GITHUB_SETUP.md - GitHub repository setup"
echo ""
echo "🚀 Happy coding!"