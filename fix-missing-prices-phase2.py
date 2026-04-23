#!/usr/bin/env python3
"""Fix remaining missing prices - Phase 2 cleanup."""

import httpx, json, re, time
from datetime import datetime

SUPABASE_URL = "https://fytxfdvbzstnimzhjgth.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHhmZHZienN0bmltemhqZ3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0ODY2MCwiZXhwIjoyMDc5OTI0NjYwfQ.hrXImQ-abyBfwhMsti7GnLdILZR9rWvUNN5eXb8cjCg"
HEADERS_SUPA = {"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}", "Content-Type": "application/json"}
BROWSER_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"

stats = {"fixed": 0, "failed": 0}

def update_price(c, fid, price, currency="USD"):
    col = "variant_price" if currency == "USD" else "price_eur"
    body = {col: price, "last_scraped_at": datetime.utcnow().isoformat() + "Z"}
    if currency == "USD":
        body["price_eur"] = round(price * 0.92, 2)
        body["price_gbp"] = round(price * 0.79, 2)
        body["price_cad"] = round(price * 1.37, 2)
        body["price_aud"] = round(price * 1.53, 2)
    r = c.patch(f"{SUPABASE_URL}/rest/v1/filaments?id=eq.{fid}", headers=HEADERS_SUPA, json=body)
    return r.status_code in (200, 204)

# --- AzureFilm: scrape WooCommerce URLs ---
print("=== AzureFilm WooCommerce scrape ===")
c = httpx.Client(headers={"apikey": SUPABASE_KEY, "Authorization": f"Bearer {SUPABASE_KEY}"}, timeout=30)
http = httpx.Client(timeout=15, follow_redirects=True)

r = c.get(f"{SUPABASE_URL}/rest/v1/filaments", params={
    "brand_name": "eq.AzureFilm", "variant_price": "is.null",
    "product_url_eu": "not.is.null", "price_eur": "is.null",
    "select": "id,product_url_eu,product_title", "limit": 20})
rows = r.json()
print(f"  Found {len(rows)} AzureFilm with URL but no EUR price")

for row in rows:
    url = row.get("product_url_eu")
    if not url: continue
    try:
        # AzureFilm is WooCommerce - try .json or HTML
        # WooCommerce REST API
        json_url = url.rstrip("/") + "?wc-api=v3" if "?" not in url else url
        resp = http.get(url, headers={"User-Agent": BROWSER_UA})
        if resp.status_code == 200:
            html = resp.text
            # Try WooCommerce price patterns
            price_match = re.search(r'"price"\s*:\s*"?(\d+[\.,]?\d*)"?', html)
            if not price_match:
                price_match = re.search(r'class="woocommerce-Price-amount[^"]*"[^>]*>[^€$]*?(\d+[\.,]?\d+)', html)
            if not price_match:
                price_match = re.search(r'€\s*(\d+[\.,]?\d+)', html)
            if price_match:
                price = float(price_match.group(1).replace(",", "."))
                if 1 <= price <= 500:
                    if update_price(c, row["id"], price, "EUR"):
                        stats["fixed"] += 1
                        print(f"  OK: {row['product_title'][:40]} → €{price}")
                        time.sleep(0.2)
                        continue
            print(f"  NO PRICE: {url[:60]}")
            stats["failed"] += 1
        else:
            print(f"  HTTP {resp.status_code}: {url[:60]}")
            stats["failed"] += 1
    except Exception as e:
        print(f"  ERR: {e}")
        stats["failed"] += 1
    time.sleep(0.2)

# --- SainSmart & Printed Solid: use higher price cap ---
print("\n=== SainSmart/Printed Solid high-price fix ===")
for brand in ["SainSmart", "Printed Solid"]:
    r = c.get(f"{SUPABASE_URL}/rest/v1/filaments", params={
        "brand_name": f"eq.{brand}", "variant_price": "is.null",
        "product_url": "not.is.null",
        "select": "id,product_url,product_title", "limit": 20})
    rows = r.json()
    if not rows:
        print(f"  {brand}: nothing remaining"); continue
    print(f"  {brand}: {len(rows)} to fix")
    for row in rows:
        url = row.get("product_url")
        if not url: continue
        try:
            json_url = url.split("?")[0].rstrip("/") + ".json"
            resp = http.get(json_url, headers={"User-Agent": BROWSER_UA, "Accept": "application/json"})
            if resp.status_code == 200:
                data = resp.json()
                variants = data.get("product", {}).get("variants", [])
                if variants:
                    price = float(variants[0]["price"])
                    if price > 0:
                        if update_price(c, row["id"], price):
                            stats["fixed"] += 1
                            print(f"    OK: {row['product_title'][:45]} → ${price}")
                        continue
            print(f"    FAIL: {url[:60]}")
            stats["failed"] += 1
        except Exception as e:
            stats["failed"] += 1
        time.sleep(0.2)

# --- Final count ---
print("\n=== FINAL COUNTS ===")
brands_target = ["AzureFilm", "Spectrum Filaments", "Sovol", "SainSmart", "Anycubic", "Creality", "Printed Solid", "FlashForge"]
for brand in brands_target:
    r = c.get(f"{SUPABASE_URL}/rest/v1/filaments", params={
        "brand_name": f"eq.{brand}", "variant_price": "is.null",
        "select": "id", "limit": 1, "count": "exact"})
    cr = r.headers.get("content-range", "?")
    count = cr.split("/")[-1] if "/" in cr else "?"
    print(f"  {brand}: {count} null prices remaining")

# Total
r = c.get(f"{SUPABASE_URL}/rest/v1/filaments", params={
    "variant_price": "is.null", "select": "id", "limit": 1, "count": "exact"})
cr = r.headers.get("content-range", "?")
total = cr.split("/")[-1] if "/" in cr else "?"
print(f"\n  TOTAL null prices: {total}")
print(f"\n=== STATS === fixed={stats['fixed']} failed={stats['failed']}")
http.close()
c.close()
