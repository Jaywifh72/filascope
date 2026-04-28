#!/bin/bash
# FilaScope Deploy Script with Pre-Deploy Checks
# Run from /home/jay/filascope/

set -euo pipefail

echo "═══════════════════════════════════════════"
echo "  FilaScope Deploy Pipeline"
echo "═══════════════════════════════════════════"

# 1. Secret Scan (gitleaks)
echo ""
echo "🔒 Step 1: Secret Scan"
echo "─────────────────────"
if command -v gitleaks &>/dev/null || [ -x ~/.local/bin/gitleaks ]; then
    ~/.local/bin/gitleaks protect --staged --source . -v 2>&1 || {
        echo "🚨 BLOCKED: Secrets detected in staged files!"
        exit 1
    }
    echo "✅ No secrets detected"
else
    echo "⚠️  gitleaks not found — skipping secret scan"
fi

# 2. Type Check
echo ""
echo "📝 Step 2: TypeScript Check"
echo "───────────────────────────"
npx tsc --noEmit 2>&1 || {
    echo "❌ TypeScript errors found"
    exit 1
}
echo "✅ TypeScript clean"

# 3. Build
echo ""
echo "🔨 Step 3: Build"
echo "────────────────"
npm run build 2>&1 | tail -10
echo "✅ Build complete"

# 4. Bundle Size Check
echo ""
echo "📦 Step 4: Bundle Size"
echo "──────────────────────"
TOTAL_SIZE=$(du -sh dist/ | cut -f1)
JS_SIZE=$(find dist/ -name "*.js" -exec du -ch {} + | grep total | cut -f1)
echo "Total: $TOTAL_SIZE | JS: $JS_SIZE"

# 5. Deploy
echo ""
echo "🚀 Step 5: Deploy to Cloudflare Pages"
echo "──────────────────────────────────────"

CF_KEY=$(head -1 ~/.openclaw/workspace/.secrets/cloudflare 2>/dev/null || echo "")
if [ -z "$CF_KEY" ]; then
    echo "❌ No Cloudflare credentials found"
    exit 1
fi

CLOUDFLARE_API_KEY=$CF_KEY \
CLOUDFLARE_EMAIL=jeanjacquesboileau@gmail.com \
npx wrangler pages deploy dist \
    --project-name=filascope-prod \
    --branch=main \
    --commit-dirty=true 2>&1 | tail -10

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Deploy Complete"
echo "═══════════════════════════════════════════"
