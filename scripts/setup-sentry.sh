#!/bin/bash
# setup-sentry.sh
# Run this after creating a Sentry project at sentry.io
#
# Usage: SENTRY_DSN=https://xxx@sentry.io/xxx bash scripts/setup-sentry.sh

set -euo pipefail

if [ -z "${SENTRY_DSN:-}" ]; then
    echo "Usage: SENTRY_DSN=https://xxx@sentry.io/xxx bash scripts/setup-sentry.sh"
    echo ""
    echo "1. Go to: https://sentry.io (free tier: 5K errors/month)"
    echo "2. Create project: 'filascope' (React)"
    echo "3. Copy the DSN"
    exit 1
fi

echo "Setting up Sentry..."

# Save DSN
echo "$SENTRY_DSN" > ~/.openclaw/workspace/.secrets/sentry-dsn
echo "✅ Saved to .secrets/sentry-dsn"

# Install Sentry SDK in FilaScope
cd /home/jay/filascope
npm install @sentry/react 2>&1 | tail -3
echo "✅ @sentry/react installed"

# Add Sentry init to the app
echo ""
echo "Add this to src/main.tsx (before App import):"
echo ""
echo "  import * as Sentry from '@sentry/react';"
echo "  Sentry.init({"
echo "    dsn: '$SENTRY_DSN',"
echo "    integrations: [Sentry.browserTracingIntegration()],"
echo "    tracesSampleRate: 0.1,"
echo "    environment: import.meta.env.MODE,"
echo "  });"
echo ""

# Add Sentry MCP to Claude Code
claude mcp add --scope user sentry --env "SENTRY_DSN=$SENTRY_DSN" \
    -- npx -y @sentry/mcp-server 2>&1 || echo "⚠️ Sentry MCP not yet available — use sentry-cli instead"

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Sentry Setup Complete"
echo "═══════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "  1. Add Sentry.init() to src/main.tsx (see above)"
echo "  2. Add SENTRY_DSN to GitHub Actions secrets"
echo "  3. Create error-monitor cron in OpenClaw"
echo ""
echo "Error monitoring cron command:"
echo "  'Check Sentry for new errors in the last hour on filascope.com project.'"
