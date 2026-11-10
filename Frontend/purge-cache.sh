#!/bin/bash
# Standalone Cloudflare cache purge for ChungToiXayWeb
# Usage: CLOUDFLARE_ZONE_ID=xxx CLOUDFLARE_API_TOKEN=xxx ./purge-cache.sh [--all]

set -e

if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ Error: Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN"
  exit 1
fi

if [ "$1" = "--all" ]; then
  echo "🧹 Purging ALL Cloudflare cache..."
  curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${CLOUDFLARE_ZONE_ID}/purge_cache" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}'
else
  echo "🧹 Purging auth page cache..."
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
fi

echo ""
echo "✅ Cache purge complete"

