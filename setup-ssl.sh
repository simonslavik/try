#!/bin/bash
# ──────────────────────────────────────────────────────────
# setup-ssl.sh — Bootstrap Let's Encrypt SSL for mybookclub.win
#
# Prerequisites:
#   1. DNS A records for mybookclub.win AND www.mybookclub.win
#      must point to this server's IP (204.168.164.4)
#   2. Ports 80 and 443 must be open in firewall
#   3. Docker and docker compose must be installed
#
# Usage:  sudo bash setup-ssl.sh [your-email@example.com]
# ──────────────────────────────────────────────────────────

set -euo pipefail

DOMAIN="mybookclub.win"
EMAIL="${1:-}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

cd "$(dirname "$0")"

# ── Validate ──────────────────────────────────────────
if [ -z "$EMAIL" ]; then
    echo "Usage: sudo bash setup-ssl.sh your-email@example.com"
    echo "  The email is required for Let's Encrypt certificate notifications."
    exit 1
fi

echo "========================================"
echo "  SSL Setup for $DOMAIN"
echo "========================================"

# ── Step 1: Check DNS ────────────────────────────────
echo ""
echo "[1/5] Checking DNS resolution..."
RESOLVED_IP=$(dig +short "$DOMAIN" 2>/dev/null || true)
if [ -z "$RESOLVED_IP" ]; then
    echo "  ❌ ERROR: $DOMAIN does not resolve to any IP address."
    echo "  → Go to your domain registrar and add these DNS records:"
    echo ""
    echo "     Type  Name                  Value"
    echo "     A     mybookclub.win        204.168.164.4"
    echo "     A     www.mybookclub.win    204.168.164.4"
    echo ""
    echo "  DNS changes can take up to 48 hours to propagate."
    echo "  Re-run this script after DNS is configured."
    exit 1
fi
echo "  ✓ $DOMAIN resolves to $RESOLVED_IP"

# ── Step 2: Start services with HTTP-only nginx ─────
echo ""
echo "[2/5] Starting services with HTTP-only nginx (for ACME challenge)..."

# Temporarily swap to init config
cp nginx/nginx.conf nginx/nginx.conf.bak
cp nginx/nginx.init-ssl.conf nginx/nginx.conf

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d --build

echo "  ✓ Services started. Waiting 15s for services to stabilize..."
sleep 15

# ── Step 3: Obtain SSL certificate ───────────────────
echo ""
echo "[3/5] Requesting Let's Encrypt certificate..."

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" run --rm certbot \
    certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN" \
    -d "www.$DOMAIN"

if [ $? -ne 0 ]; then
    echo "  ❌ Certbot failed. Check the output above for details."
    # Restore original nginx config
    mv nginx/nginx.conf.bak nginx/nginx.conf
    exit 1
fi

echo "  ✓ SSL certificate obtained!"

# ── Step 4: Switch to full HTTPS nginx config ────────
echo ""
echo "[4/5] Switching to full HTTPS nginx configuration..."

# Restore the full nginx.conf (with SSL)
mv nginx/nginx.conf.bak nginx/nginx.conf

# Restart nginx to pick up certs
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" restart nginx

echo "  ✓ Nginx restarted with SSL"

# ── Step 5: Verify ───────────────────────────────────
echo ""
echo "[5/5] Verifying HTTPS..."
sleep 5

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://www.$DOMAIN" --connect-timeout 10 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo "  ✓ https://www.$DOMAIN is responding (HTTP $HTTP_CODE)"
else
    echo "  ⚠ HTTPS returned HTTP $HTTP_CODE — check nginx logs:"
    echo "    docker logs nginx-proxy --tail 20"
fi

echo ""
echo "========================================"
echo "  ✅ Setup complete!"
echo ""
echo "  Your site: https://www.$DOMAIN"
echo ""
echo "  To auto-renew certs, add this cron job:"
echo "  0 3 * * 0 cd $(pwd) && docker compose -f $COMPOSE_FILE run --rm certbot certbot renew && docker compose -f $COMPOSE_FILE restart nginx"
echo "========================================"
