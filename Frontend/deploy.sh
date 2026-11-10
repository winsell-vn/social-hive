#!/bin/bash
# Deploy helper for ChungToiXayWeb Frontend
# Usage: ./deploy.sh [--purge-cache]
#
# This script helps with deployment tasks.
# The actual file upload to VPS is done manually via aaPanel/FTP.
#
# To purge Cloudflare cache after deploy:
#   CLOUDFLARE_ZONE_ID=your_zone_id CLOUDFLARE_API_TOKEN=your_token ./deploy.sh --purge-cache

set -e

echo "🔨 Building Frontend..."
npm run build

if [ "$1" = "--purge-cache" ]; then
  if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ Error: CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN must be set"
    echo "   export CLOUDFLARE_ZONE_ID=your_zone_id"
    echo "   export CLOUDFLARE_API_TOKEN=your_api_token"
    exit 1
  fi

  echo "🧹 Purging Cloudflare cache for auth pages..."
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{
      "files": [
        "https://chungtoixayweb.vn/login",
        "https://chungtoixayweb.vn/register",
        "https://chungtoixayweb.vn/forgot-password",
        "https://chungtoixayweb.vn/reset-password",
        "https://chungtoixayweb.vn/"
      ]
    }'
  echo ""
  echo "✅ Cache purged for auth pages"
fi

echo ""
echo "📦 Build complete! Next steps:"
echo "  1. Upload .next/ folder to VPS via aaPanel"
echo "  2. Restart PM2 process: pm2 restart frontend"
echo "  3. If you haven't purged cache: ./deploy.sh --purge-cache"

