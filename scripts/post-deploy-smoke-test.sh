#!/bin/bash
# post-deploy-smoke-test.sh — quick smoke test after deploy

BASE="https://filascope.com"
PASS=0 FAIL=0 WARN=0

check_status() {
    local desc="$1" url="$2"
    local status
    status=$(curl -sS -o /dev/null -w "%{http_code}" "$url" -H "User-Agent: Mozilla/5.0" --max-time 10 2>/dev/null || echo "000")
    if [ "$status" = "200" ]; then
        echo "  ✅ $desc (HTTP $status)"; ((PASS++))
    else
        echo "  ❌ $desc (HTTP $status)"; ((FAIL++))
    fi
}

check_header() {
    local desc="$1" url="$2" header="$3"
    if curl -sS -I "$url" -H "User-Agent: Mozilla/5.0" --max-time 10 2>/dev/null | grep -qi "$header"; then
        echo "  ✅ $desc"; ((PASS++))
    else
        echo "  ⚠️ $desc — not found"; ((WARN++))
    fi
}

check_body() {
    local desc="$1" url="$2" ua="$3" expect="$4"
    if curl -sS "$url" -H "User-Agent: $ua" --max-time 10 2>/dev/null | grep -q "$expect"; then
        echo "  ✅ $desc"; ((PASS++))
    else
        echo "  ❌ $desc — '$expect' not found"; ((FAIL++))
    fi
}

echo ""
echo "═══════════════════════════════════════════"
echo "  🔍 Post-Deploy Smoke Test"
echo "═══════════════════════════════════════════"

echo ""
echo "📄 Page Status:"
check_status "Homepage" "$BASE/"
check_status "Deals" "$BASE/deals/"
check_status "Brands" "$BASE/brands/"
check_status "Finder" "$BASE/finder/"
check_status "Filaments (PLA)" "$BASE/filaments/pla/"
check_status "About" "$BASE/about/"

echo ""
echo "🔒 Security Headers:"
check_header "HSTS" "$BASE/" "strict-transport-security"
check_header "X-Content-Type-Options" "$BASE/" "x-content-type-options"

echo ""
echo "🤖 Crawler Pre-rendering:"
check_body "Prerendered title" "$BASE/filament/pla-basic-filament" "Googlebot" "FilaScope"
check_body "Prerendered canonical" "$BASE/filament/pla-basic-filament" "Googlebot" "rel=\"canonical\""
check_body "Prerendered JSON-LD" "$BASE/filament/pla-basic-filament" "Googlebot" "application/ld+json"

echo ""
echo "📐 Canonical (single per page):"
CANONICAL_COUNT=$(curl -sS "$BASE/deals/" -H "User-Agent: Mozilla/5.0" 2>/dev/null | grep -ci "rel=\"canonical\"" || echo "0")
if [ "$CANONICAL_COUNT" -le 1 ]; then
    echo "  ✅ Deals page has $CANONICAL_COUNT canonical"; ((PASS++))
else
    echo "  ❌ Deals page has $CANONICAL_COUNT canonicals (should be 1)"; ((FAIL++))
fi

echo ""
echo "📊 Filament Counts:"
if curl -sS "$BASE/" -H "User-Agent: Mozilla/5.0" 2>/dev/null | grep -q "21,000+"; then
    echo "  ✅ Homepage shows 21,000+"; ((PASS++))
else
    echo "  ⚠️ Homepage count: 21,000+ not found"; ((WARN++))
fi

echo ""
echo "🤖 robots.txt:"
ROBOTS_CF=$(curl -sS "$BASE/robots.txt" 2>/dev/null | grep -c "Cloudflare Managed" 2>/dev/null || true)
ROBOTS_CF=${ROBOTS_CF:-0}
if [ "$ROBOTS_CF" -eq 0 ]; then
    echo "  ✅ Clean — no Cloudflare injection"; ((PASS++))
else
    echo "  ⚠️ Still has Cloudflare managed section"; ((WARN++))
fi

echo ""
echo "═══════════════════════════════════════════"
echo "  Results: ✅ $PASS passed | ❌ $FAIL failed | ⚠️ $WARN warnings"
echo "═══════════════════════════════════════════"

[ "$FAIL" -eq 0 ] && exit 0 || exit 1
