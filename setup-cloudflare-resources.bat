@echo off
REM Cloudflare Resources Setup Script for KarirHub RSS Feed Generator (Windows)
REM This script creates the necessary KV namespace, D1 database, and Pages project

echo 🚀 Setting up Cloudflare resources for KarirHub RSS Feed Generator...

REM Check if user is logged in to Cloudflare
echo 📋 Checking Cloudflare authentication...
wrangler whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not authenticated with Cloudflare. Please run: wrangler auth login
    pause
    exit /b 1
)

echo ✅ Authenticated with Cloudflare

REM Create KV namespace for production
echo 🗂️  Creating KV namespace for RSS cache ^(production^)...
for /f "tokens=2 delims=:," %%a in ('wrangler kv:namespace create "RSS_CACHE" ^| findstr "id"') do set KV_ID=%%a
set KV_ID=%KV_ID: "=%
set KV_ID=%KV_ID:"=%
echo ✅ Created KV namespace: %KV_ID%

REM Create KV namespace for preview/development
echo 🗂️  Creating KV namespace for RSS cache ^(preview^)...
for /f "tokens=2 delims=:," %%a in ('wrangler kv:namespace create "RSS_CACHE" --preview ^| findstr "id"') do set KV_PREVIEW_ID=%%a
set KV_PREVIEW_ID=%KV_PREVIEW_ID: "=%
set KV_PREVIEW_ID=%KV_PREVIEW_ID:"=%
echo ✅ Created preview KV namespace: %KV_PREVIEW_ID%

REM Create D1 database for analytics
echo 🗄️  Creating D1 database for analytics...
for /f "tokens=2 delims=:," %%a in ('wrangler d1 create "karirhub-rss-analytics" ^| findstr "id"') do set D1_ID=%%a
set D1_ID=%D1_ID: "=%
set D1_ID=%D1_ID:"=%
echo ✅ Created D1 database: %D1_ID%

REM Backup original wrangler.toml
copy wrangler.toml wrangler.toml.bak >nul

REM Update wrangler.toml with actual IDs
echo 📝 Updating wrangler.toml with resource IDs...
powershell -Command "(Get-Content wrangler.toml) -replace 'RSS_CACHE_ID', '%KV_ID%' -replace 'RSS_CACHE_PREVIEW_ID', '%KV_PREVIEW_ID%' -replace 'RSS_ANALYTICS_ID', '%D1_ID%' | Set-Content wrangler.toml"

echo ✅ Updated wrangler.toml configuration
echo 💾 Backup of original wrangler.toml saved as wrangler.toml.bak

echo.
echo 🌐 Next steps for Cloudflare Pages setup:
echo 1. Go to Cloudflare Dashboard -^> Pages -^> Create application
echo 2. Connect your GitHub repository: https://github.com/mxwlllph/karirhub-rss
echo 3. Set build settings:
echo    - Build command: npm install
echo    - Build output directory: /
echo    - Root directory: /
echo.
echo 4. Add environment variables in Pages dashboard:
echo    - CLOUDFLARE_API_TOKEN: Your Cloudflare API token
echo    - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
echo.
echo 5. Add KV bindings to Pages Functions:
echo    - Variable name: RSS_CACHE
echo    - KV namespace: Select the RSS_CACHE namespace
echo.
echo 6. Add D1 bindings to Pages Functions:
echo    - Variable name: RSS_ANALYTICS
echo    - D1 database: Select the karirhub-rss-analytics database
echo.
echo 🎉 Setup complete! Your resources are ready for deployment.
echo.
echo 📄 Resource Summary:
echo - KV Namespace ^(Production^): %KV_ID%
echo - KV Namespace ^(Preview^): %KV_PREVIEW_ID%
echo - D1 Database: %D1_ID%
pause