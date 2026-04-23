#!/usr/bin/env python3
"""
Fix missing variant_price for brands with NULL prices.
Strategy:
  1. EUR→USD conversion for brands with price_eur set (AzureFilm, Spectrum, Sovol, Creality)
  2. Shopify JSON API scraping for Spectrum, Sovol, SainSmart, Anycubic, Printed Solid
  3. Creality store HTML/JSON-LD scraping
  4. Report FlashForge (no product URLs available)
"""

import httpx
import json
import re
import time
import sys
from datetime import datetime

# === CONFIG ===
SUPABASE_URL = "https://fytxfdvbzstnimzhjgth.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHhmZHZienN0bmltemhqZ3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0ODY2MCwiZXhwIjoyMDc5OTI0NjYwfQ.hrXImQ-abyBfwhMsti7GnLdILZR9rWvUNN5eXb8cjCg"

EUR_TO_USD = 1.0 / 0.92  # Inverse of the USD→EUR rate

HEADERS_SUPA = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
}

BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

stats = {
    "eur_converted": 0, "shopify_ok": 0, "shopify_fail": 0,
    "creality_ok": 0, "creality_fail": 0, "skipped": 0, "errors": 0
}

def supa_client():
    return httpx.Client(
        headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"},
        timeout=30, follow_redirects=True
    )

def fetch_null_filaments(client, brand, extra=None):
    all_rows, offset = [], 0
    while True:
        params = {
            "brand_name": f"eq.{brand}", "variant_price": "is.null",
            "select": "id,product_url,product_url_eu,price_eur,product_title",
            "limit": 500, "offset": offset, "order": "id"
        }
        if extra:
            params.update(extra)
        r = client.get(f"{SUPABASE_URL}/rest/v1/filaments", params=params)
        if r.status_code != 200:
            print(f"  ERR fetch {brand}: {r.text[:200]}"); break
        data = r.json()
        if not data: break
        all_rows.extend(data); offset += len(data)
        if len(data) < 500: break
    return all_rows

def update_price(client, fid, price, currency="USD"):
    col = {"USD": "variant_price", "EUR": "price_eur"}.get(currency, "variant_price")
    body = {col: price, "last_scraped_at": datetime.utcnow().isoformat() + "Z"}
    # Also compute regional if setting USD and no EUR exists
    if currency == "USD":
        body.setdefault("price_eur", round(price * 0.92, 2))
        body.setdefault("price_gbp", round(price * 0.79, 2))
        body.setdefault("price_cad", round(price * 1.37, 2))
        body.setdefault("price_aud", round(price * 1.53, 2))
    r = client.patch(
        f"{SUPABASE_URL}/rest/v1/filaments?id=eq.{fid}",
        headers={**HEADERS_SUPA}, json=body
    )
    return r.status_code in (200, 204)

# ================================================================
# PHASE 1: EUR → USD Conversion
# ================================================================
def phase1():
    print("\n=== PHASE 1: EUR → USD Conversion ===")
    c = supa_client()
    for brand in ["AzureFilm", "Spectrum Filaments", "Sovol", "Creality"]:
        rows = fetch_null_filaments(c, brand, {"price_eur": "not.is.null"})
        if not rows:
            print(f"  {brand}: nothing to convert"); continue
        print(f"  {brand}: {len(rows)} rows with price_eur")
        ok = 0
        for r in rows:
            eur = r.get("price_eur")
            if eur and eur > 0:
                usd = round(eur * EUR_TO_USD, 2)
                if update_price(c, r["id"], usd, "USD"):
                    ok += 1; stats["eur_converted"] += 1
                else:
                    stats["errors"] += 1
        print(f"    → {ok} converted")
    c.close()

# ================================================================
# PHASE 2: Shopify JSON API Scraping
# ================================================================
def shopify_price(url, http):
    """Get price from Shopify .json endpoint."""
    try:
        base = url.split("?")[0].rstrip("/")
        if "/products/" not in base:
            return None, "No /products/ in URL"
        json_url = base + ".json"
        r = http.get(json_url, headers={"User-Agent": BROWSER_UA, "Accept": "application/json"})
        if r.status_code != 200:
            return None, f"HTTP {r.status_code}"
        data = r.json()
        variants = data.get("product", {}).get("variants", [])
        if not variants:
            return None, "No variants"
        # Prefer 1kg available variants
        best = None
        for v in variants:
            t = (v.get("title") or "").lower()
            g = v.get("grams", 0) or 0
            if "1 kg" in t or "1kg" in t or (750 <= g <= 1100):
                best = v; break
        if not best:
            avail = [v for v in variants if v.get("available")]
            best = avail[0] if avail else variants[0]
        price = float(best["price"])
        if price <= 0 or price > 2000:
            return None, f"Bad price {price}"
        return price, None
    except Exception as e:
        return None, str(e)[:80]

def phase2():
    print("\n=== PHASE 2: Shopify Store Scraping ===")
    c = supa_client()
    http = httpx.Client(timeout=15, follow_redirects=True)
    brands = ["Spectrum Filaments", "Sovol", "SainSmart", "Anycubic", "Printed Solid"]
    for brand in brands:
        # For brands that might have some EUR prices, only get rows without EUR
        extra = {}
        if brand in ["Sovol"]:
            extra = {"price_eur": "is.null"}
        rows = fetch_null_filaments(c, brand, extra)
        if not rows:
            print(f"  {brand}: nothing to scrape"); continue
        print(f"  {brand}: {len(rows)} to scrape")
        ok = fail = 0
        for i, row in enumerate(rows):
            url = row.get("product_url")
            if not url:
                stats["skipped"] += 1; continue
            price, err = shopify_price(url, http)
            if price is not None:
                if update_price(c, row["id"], price):
                    ok += 1; stats["shopify_ok"] += 1
                else:
                    stats["errors"] += 1
            else:
                fail += 1; stats["shopify_fail"] += 1
                if fail <= 3:
                    print(f"    FAIL: {url[:70]} → {err}")
            time.sleep(0.15)
            if (i + 1) % 100 == 0:
                print(f"    {i+1}/{len(rows)} (ok={ok} fail={fail})")
        print(f"  {brand}: done ok={ok} fail={fail}")
    http.close()
    c.close()

# ================================================================
# PHASE 3: Creality HTML/JSON-LD Scraping
# ================================================================
def creality_price(url, http):
    try:
        r = http.get(url, headers={"User-Agent": BROWSER_UA})
        if r.status_code != 200:
            return None, f"HTTP {r.status_code}"
        # Try JSON-LD
        for m in re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', r.text, re.DOTALL):
            try:
                ld = json.loads(m)
                if isinstance(ld, dict) and ld.get("@type") == "Product":
                    offers = ld.get("offers", {})
                    if isinstance(offers, dict) and offers.get("price"):
                        return float(offers["price"]), None
                    elif isinstance(offers, list):
                        for o in offers:
                            if o.get("price"):
                                return float(o["price"]), None
            except: pass
        return None, "No JSON-LD price"
    except Exception as e:
        return None, str(e)[:80]

def phase3():
    print("\n=== PHASE 3: Creality Store Scraping ===")
    c = supa_client()
    http = httpx.Client(timeout=15, follow_redirects=True)
    rows = fetch_null_filaments(c, "Creality", {"product_url": "not.is.null", "price_eur": "is.null"})
    if not rows:
        print("  Nothing to scrape"); c.close(); http.close(); return
    print(f"  {len(rows)} to scrape")
    for row in rows:
        url = row.get("product_url")
        if not url: continue
        price, err = creality_price(url, http)
        if price is not None:
            if update_price(c, row["id"], price):
                stats["creality_ok"] += 1
            else:
                stats["errors"] += 1
            print(f"    OK: {url[:60]} → ${price}")
        else:
            stats["creality_fail"] += 1
            print(f"    FAIL: {url[:60]} → {err}")
        time.sleep(0.3)
    http.close()
    c.close()

# ================================================================
# PHASE 4: Remaining counts check
# ================================================================
def phase4_report():
    print("\n=== PHASE 4: Remaining Null Prices Report ===")
    c = supa_client()
    brands = ["AzureFilm", "Spectrum Filaments", "Sovol", "SainSmart", "Anycubic", "Creality", "Printed Solid", "FlashForge"]
    for brand in brands:
        r = c.get(f"{SUPABASE_URL}/rest/v1/filaments",
            params={"brand_name": f"eq.{brand}", "variant_price": "is.null", "select": "id", "limit": 1, "count": "exact"})
        count = r.headers.get("content-range", "?").split("/")[-1] if "/" in r.headers.get("content-range", "?") else "?"
        print(f"  {brand}: {count} remaining null prices")
    c.close()

# ================================================================
def main():
    print(f"=== Fix Missing Prices === {datetime.utcnow().isoformat()}")
    phase1()
    phase2()
    phase3()
    phase4_report()
    print(f"\n=== STATS ===")
    for k, v in stats.items():
        print(f"  {k}: {v}")
    print(f"Done: {datetime.utcnow().isoformat()}")

if __name__ == "__main__":
    main()
