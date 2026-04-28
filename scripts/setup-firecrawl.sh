#!/bin/bash
# setup-firecrawl.sh
# Run this after getting a Firecrawl API key from firecrawl.dev
#
# Usage: FIRECRAWL_KEY=fc-xxx bash scripts/setup-firecrawl.sh

set -euo pipefail

if [ -z "${FIRECRAWL_KEY:-}" ]; then
    echo "Usage: FIRECRAWL_KEY=fc-xxx bash scripts/setup-firecrawl.sh"
    echo ""
    echo "Get your key at: https://firecrawl.dev"
    echo "Free tier: 500 credits/month"
    exit 1
fi

echo "Setting up Firecrawl MCP..."

# Save key
echo "$FIRECRAWL_KEY" > ~/.openclaw/workspace/.secrets/firecrawl
echo "✅ Saved to .secrets/firecrawl"

# Add to Claude Code MCP
claude mcp add --scope user firecrawl --env "FIRECRAWL_API_KEY=$FIRECRAWL_KEY" \
    -- npx -y firecrawl-mcp 2>&1
echo "✅ Firecrawl MCP added"

# Test
echo ""
echo "Testing connection..."
npx -y firecrawl-mcp --help 2>&1 | head -3

echo ""
echo "═══════════════════════════════════════════"
echo "  ✅ Firecrawl Setup Complete"
echo "═══════════════════════════════════════════"
echo ""
echo "Available tools:"
echo "  firecrawl_scrape     — Single page extraction"
echo "  firecrawl_batch_scrape — Multiple URLs with rate limiting"
echo "  firecrawl_extract    — Structured data with JSON schema"
echo "  firecrawl_map        — Discover all URLs on a site"
echo "  firecrawl_crawl      — Deep multi-page crawl"
echo "  firecrawl_search     — Web search + content extraction"
echo ""
echo "Use in brand scrapers: firecrawl_extract with filament JSON schema"
echo "Use for competitor monitoring: firecrawl_scrape on All3DP/FilamentColors"
