#!/usr/bin/env python3
"""Generate static sitemap XML files from the Supabase REST API."""

import json
import re
import urllib.request
from datetime import date

BASE_URL = "https://filascope.com"
API_BASE = "https://fytxfdvbzstnimzhjgth.supabase.co/rest/v1"
API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dHhmZHZienN0bmltemhqZ3RoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDM0ODY2MCwiZXhwIjoyMDc5OTI0NjYwfQ.hrXImQ-abyBfwhMsti7GnLdILZR9rWvUNN5eXb8cjCg"
TODAY = date.today().isoformat()
OUT_DIR = "public"


def api_get(endpoint, params=""):
    url = f"{API_BASE}/{endpoint}?{params}" if params else f"{API_BASE}/{endpoint}"
    req = urllib.request.Request(url, headers={"apikey": API_KEY})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def api_get_all(endpoint, select, where="", page_size=1000):
    """Paginate through all rows."""
    rows = []
    offset = 0
    while True:
        params = f"select={select}&limit={page_size}&offset={offset}"
        if where:
            params += f"&{where}"
        batch = api_get(endpoint, params)
        rows.extend(batch)
        if len(batch) < page_size:
            break
        offset += page_size
    return rows


def to_brand_slug(name):
    """Mirror src/utils/brandSlug.ts toBrandSlug()."""
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s)
    s = re.sub(r"-+", "-", s)
    s = s.strip("-")
    return s


def xml_escape(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("'", "&apos;").replace('"', "&quot;")


def url_entry(loc, lastmod=None, changefreq=None, priority=None):
    parts = [f"  <url>\n    <loc>{xml_escape(loc)}</loc>"]
    if lastmod:
        parts.append(f"    <lastmod>{lastmod}</lastmod>")
    if changefreq:
        parts.append(f"    <changefreq>{changefreq}</changefreq>")
    if priority is not None:
        parts.append(f"    <priority>{priority}</priority>")
    parts.append("  </url>")
    return "\n".join(parts)


def write_sitemap(filename, entries):
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    xml += "\n".join(entries)
    xml += "\n</urlset>\n"
    path = f"{OUT_DIR}/{filename}"
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"  Wrote {path} ({len(entries)} URLs)")


def generate_pages_sitemap():
    """Static pages sitemap."""
    pages = [
        ("/", "daily", 1.0),
        ("/filaments", "daily", 0.9),
        ("/filaments/pla", "weekly", 0.8),
        ("/filaments/petg", "weekly", 0.8),
        ("/filaments/abs", "weekly", 0.8),
        ("/filaments/tpu", "weekly", 0.8),
        ("/filaments/asa", "weekly", 0.7),
        ("/filaments/nylon", "weekly", 0.7),
        ("/filaments/pc", "weekly", 0.7),
        ("/filaments/pva", "weekly", 0.6),
        ("/filaments/hips", "weekly", 0.6),
        ("/filaments/silk-pla", "weekly", 0.7),
        ("/filaments/pla-plus", "weekly", 0.7),
        ("/filaments/high-speed-pla", "weekly", 0.7),
        ("/filaments/polycarbonate", "weekly", 0.6),
        ("/filaments/petg-cf", "weekly", 0.6),
        ("/brands", "weekly", 0.8),
        ("/brands/compare", "weekly", 0.7),
        ("/printers", "weekly", 0.8),
        ("/printers/compare", "weekly", 0.7),
        ("/printers/enclosed", "weekly", 0.7),
        ("/printers/multi-color", "weekly", 0.7),
        ("/printers/high-speed", "weekly", 0.7),
        ("/printers/large-format", "weekly", 0.7),
        ("/printers/corexy", "weekly", 0.7),
        ("/printers/bed-slinger", "weekly", 0.7),
        ("/printers/direct-drive", "weekly", 0.7),
        ("/printers/under-300", "weekly", 0.7),
        ("/printers/under-500", "weekly", 0.7),
        ("/printers/under-1000", "weekly", 0.7),
        ("/colors", "weekly", 0.8),
        ("/hueforge-td-database", "weekly", 0.9),
        ("/hueforge-filaments", "weekly", 0.8),
        ("/hueforge-tools", "weekly", 0.7),
        ("/hueforge-filament-substitute-finder", "weekly", 0.7),
        ("/hueforge-layer-preview", "weekly", 0.7),
        ("/hueforge-color-matcher", "weekly", 0.7),
        ("/hueforge-project-planner", "weekly", 0.7),
        ("/hueforge-palette-builder", "weekly", 0.7),
        ("/deals", "daily", 0.7),
        ("/compare", "weekly", 0.7),
        ("/materials/compare", "weekly", 0.7),
        ("/wizard", "monthly", 0.6),
        ("/diagnose", "monthly", 0.6),
        ("/compatibility-matrix", "weekly", 0.7),
        ("/learn", "weekly", 0.7),
        ("/reference/materials", "monthly", 0.6),
        ("/reference/slicers", "monthly", 0.6),
        ("/reference/cad", "monthly", 0.5),
        ("/reference/repos", "monthly", 0.5),
        ("/reference/influencers", "monthly", 0.5),
        ("/reference/specialty", "monthly", 0.5),
        ("/reference/methodology", "monthly", 0.5),
        ("/accessories", "weekly", 0.6),
        ("/filament-database", "daily", 0.8),
        ("/td-database", "weekly", 0.8),
        ("/slicer-directory", "monthly", 0.5),
        ("/model-repositories", "monthly", 0.5),
        ("/about", "monthly", 0.5),
        ("/methodology", "monthly", 0.5),
        ("/roadmap", "monthly", 0.4),
        ("/install", "monthly", 0.4),
        ("/privacy", "yearly", 0.3),
        ("/terms", "yearly", 0.3),
        ("/affiliate-disclosure", "yearly", 0.3),
    ]
    entries = [url_entry(f"{BASE_URL}{p}", TODAY, cf, pr) for p, cf, pr in pages]
    write_sitemap("sitemap-pages.xml", entries)


def generate_filaments_sitemap():
    """Filament detail pages."""
    print("  Fetching filaments...")
    rows = api_get_all("filaments", "product_handle", "product_handle=not.is.null")
    entries = []
    seen = set()
    for r in rows:
        handle = r["product_handle"]
        if handle and handle not in seen:
            seen.add(handle)
            entries.append(url_entry(f"{BASE_URL}/filament/{handle}", TODAY, "weekly", 0.6))
    write_sitemap("sitemap-filaments.xml", entries)


def generate_brands_sitemap():
    """Brand pages derived from unique vendor names."""
    print("  Fetching vendors...")
    rows = api_get_all("filaments", "vendor", "vendor=not.is.null")
    vendors = sorted(set(r["vendor"] for r in rows if r.get("vendor")))
    entries = []
    seen = set()
    for v in vendors:
        slug = to_brand_slug(v)
        if slug and slug not in seen:
            seen.add(slug)
            entries.append(url_entry(f"{BASE_URL}/brands/{slug}", TODAY, "weekly", 0.7))
    write_sitemap("sitemap-brands.xml", entries)


def generate_printers_sitemap():
    """Printer detail pages."""
    print("  Fetching printers...")
    rows = api_get_all("printers", "id")
    entries = [url_entry(f"{BASE_URL}/printers/{r['id']}", TODAY, "weekly", 0.6) for r in rows]

    # Also add printer brand category pages
    brand_rows = api_get_all("printer_brands", "brand")
    for b in brand_rows:
        slug = to_brand_slug(b["brand"])
        if slug:
            entries.append(url_entry(f"{BASE_URL}/printers/brand/{slug}", TODAY, "weekly", 0.7))

    write_sitemap("sitemap-printers.xml", entries)


def generate_guides_sitemap():
    """Guide/article pages."""
    guides = [
        # Material comparisons
        "/guides/pla-vs-petg",
        "/guides/pla-vs-abs",
        "/guides/petg-vs-abs",
        "/guides/tpu-vs-petg",
        "/guides/nylon-vs-petg",
        # Best-of guides
        "/guides/best-filaments-for-beginners",
        "/guides/best-filaments-for-hueforge",
        "/guides/best-white-filaments-for-hueforge",
        "/guides/best-filaments-for-outdoor-use",
        "/guides/best-filaments-for-lithophanes",
        "/guides/best-filaments-for-miniatures",
        "/guides/best-filaments-for-cosplay",
        "/guides/best-filaments-for-functional-parts",
        "/guides/best-food-safe-filaments",
        "/guides/best-budget-filaments",
        "/guides/best-pla-filaments",
        "/guides/best-petg-filaments",
        "/guides/best-abs-filaments",
        "/guides/best-tpu-filaments",
        "/guides/best-asa-filaments",
        "/guides/best-nylon-filaments",
        "/guides/best-pc-filaments",
        "/guides/best-high-speed-pla-filaments",
        "/guides/strongest-3d-printer-filament",
        # Printer-specific guides
        "/guides/best-filament-for-bambu-lab-p1s",
        "/guides/best-filament-for-bambu-lab-a1-mini",
        "/guides/best-filament-for-bambu-lab-x1-carbon",
        "/guides/best-filament-for-creality-ender-3-v3",
        "/guides/best-filament-for-creality-k1-max",
        "/guides/best-filament-for-creality-k1",
        "/guides/best-filament-for-prusa-mk4",
        # HueForge guides
        "/guides/what-is-hueforge-td",
        "/guides/how-to-measure-filament-td",
        "/guides/understanding-td-values",
        "/guides/hueforge-beginners-guide",
        "/guides/hueforge-color-selection",
        "/guides/best-filaments-for-hueforge-lithophanes",
        # How-to and educational
        "/guides/how-to-choose-3d-printer-filament",
        "/guides/how-to-choose-filament",
        "/guides/3d-printer-filament-types-explained",
        "/guides/filament-temperature-guide",
        "/guides/filament-storage-guide",
        "/guides/how-to-store-filament",
        "/guides/how-to-dry-filament",
        "/guides/food-safe-filament",
        "/guides/silk-pla-comparison",
        "/guides/asa-vs-abs-outdoor-printing",
        "/guides/pla-plus-vs-pla-pro",
        "/guides/print-settings",
        "/guides/troubleshooting",
    ]
    entries = [url_entry(f"{BASE_URL}{g}", TODAY, "monthly", 0.7) for g in guides]
    write_sitemap("sitemap-guides.xml", entries)


def generate_colors_sitemap():
    """Color family pages."""
    color_families = [
        "red", "orange", "yellow", "green", "blue", "purple", "pink",
        "brown", "black", "white", "grey", "gray", "gold", "silver",
        "transparent", "multicolor", "natural", "beige", "cream", "ivory",
    ]
    entries = [url_entry(f"{BASE_URL}/colors/{c}", TODAY, "weekly", 0.6) for c in color_families]
    write_sitemap("sitemap-colors.xml", entries)


def generate_sitemap_index():
    """Main sitemap index pointing to sub-sitemaps."""
    subs = [
        "sitemap-pages.xml",
        "sitemap-filaments.xml",
        "sitemap-brands.xml",
        "sitemap-printers.xml",
        "sitemap-guides.xml",
        "sitemap-colors.xml",
    ]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for s in subs:
        xml += f"  <sitemap>\n    <loc>{BASE_URL}/{s}</loc>\n    <lastmod>{TODAY}</lastmod>\n  </sitemap>\n"
    xml += "</sitemapindex>\n"
    path = f"{OUT_DIR}/sitemap.xml"
    with open(path, "w", encoding="utf-8") as f:
        f.write(xml)
    print(f"  Wrote {path} (index with {len(subs)} sitemaps)")


if __name__ == "__main__":
    print("Generating static sitemaps...")
    generate_pages_sitemap()
    generate_filaments_sitemap()
    generate_brands_sitemap()
    generate_printers_sitemap()
    generate_guides_sitemap()
    generate_colors_sitemap()
    generate_sitemap_index()
    print("Done!")
