# FilaScope SEO & Marketing Monitoring Checklist

Last updated: 2026-03-18

---

## Weekly Monitoring

### Google Search Console
- [ ] Check **Coverage** report for new errors (404s, soft 404s, server errors)
- [ ] Review **Core Web Vitals** — flag any pages with poor LCP, FID, or CLS
- [ ] Check **Sitemaps** submission status — ensure all 6 sub-sitemaps are indexed
- [ ] Monitor **Search Performance** for top queries:
  - "best pla filament" / "best pla filament 2026"
  - "hueforge td values" / "hueforge td database"
  - "filament comparison"
  - "best filament for [printer model]"
  - "pla vs petg"
  - "3d printer filament database"
- [ ] Check **Indexing** — how many pages are indexed vs submitted?
- [ ] Look for **Manual Actions** (penalties)

### Google Analytics
- [ ] Organic search traffic trend (week over week)
- [ ] Top landing pages from organic search
- [ ] Referral traffic from Reddit, Discord, YouTube
- [ ] Bounce rate on guide pages (target: <60%)
- [ ] Time on page for buying guides (target: >3 min)
- [ ] /deals page conversion (clicks to retailer)

### AI Search Citation Tracking
- [ ] Query Perplexity.ai for: "best pla filament 2026", "hueforge td values", "filament comparison tool"
- [ ] Query ChatGPT for: "what is the best pla filament", "hueforge td database", "compare 3d printing filaments"
- [ ] Check Google AI Overviews for target keywords
- [ ] Note whether FilaScope is cited, and in what position

---

## Monthly Monitoring

### Technical SEO
- [ ] Run Lighthouse audit on top 10 pages:
  - Homepage (/)
  - /filaments
  - /filaments/pla
  - /hueforge-td-database
  - /brands
  - /printers
  - /guides/best-pla-filaments
  - /guides/pla-vs-petg
  - /colors
  - /deals
- [ ] Validate JSON-LD on top pages via Google Rich Results Test
- [ ] Check robots.txt is serving correctly
- [ ] Verify llms.txt is accessible and up-to-date
- [ ] Test sitemap.xml — all URLs resolving, lastmod dates current
- [ ] Check IndexNow GitHub Action ran successfully (weekly Mondays)

### Content Freshness
- [ ] Update guide dates if content was refreshed
- [ ] Verify price data freshness (no prices >7 days stale on key pages)
- [ ] Review "last updated" in llms.txt and llms-full.txt
- [ ] Check for any new guide slugs that need adding to generate-static-pages.js

### Competitive Monitoring
- [ ] Check FilamentColors.xyz for new features
- [ ] Check 3DFilamentProfiles.com for TD data expansion
- [ ] Google "[competitor] filament database" to see if anyone new is emerging
- [ ] Check if any competitor added HueForge TD data at scale

### Community & Backlinks
- [ ] Check Google Search Console > Links for new backlinks
- [ ] Review Reddit posts that mention FilaScope
- [ ] Check HueForge community for mentions
- [ ] Monitor YouTube for filament review videos that cite FilaScope

---

## Quarterly Reviews

### Keyword Strategy
- [ ] Export top 100 queries from GSC, identify gaps
- [ ] Research new long-tail keywords (seasonal: "best filament for Christmas gifts", etc.)
- [ ] Identify new guide opportunities based on search demand
- [ ] Check if any existing guides are declining in traffic — refresh content

### Technical Debt
- [ ] Evaluate prerender.io vs full SSR migration (Next.js/Remix)
- [ ] Audit image optimization — any non-WebP images? Missing dimensions?
- [ ] Check page load times have not regressed
- [ ] Review and clean up any 301 redirect chains

### Content Expansion Roadmap
Priority new guides based on search volume and competition:

**Printer-specific (high intent, low competition):**
- Best filaments for Bambu Lab A1 Mini
- Best filaments for Prusa XL
- Best filaments for Elegoo Neptune 4
- Best filaments for Voron 2.4

**Use-case guides (medium volume, medium competition):**
- Best filament for 3D printed vases
- Best filament for mechanical keyboard cases
- Best filament for drone parts
- Best filament for RC car bodies

**Material deep-dives (high volume, high competition):**
- PETG vs ABS vs ASA for functional parts
- Carbon fiber filament guide (PLA-CF vs PETG-CF vs PA-CF)
- Wood/metal/marble fill filament comparison

**HueForge content (niche, low competition, high conversion):**
- HueForge filament stacking guide
- Complete HueForge TD value table by brand
- HueForge color profiles explained

---

## Key Targets (2026 Q2)

| Metric | Current (est.) | Q2 Target |
|---|---|---|
| Monthly organic search visits | TBD (check GSC) | 5,000+ |
| Indexed pages in Google | TBD | 200+ |
| Average position for "hueforge td" | TBD | Top 5 |
| Average position for "best pla filament" | TBD | Top 20 |
| AI search citations per month | TBD | 10+ |
| Reddit referral visits/month | TBD | 500+ |
| Backlinks from .com domains | TBD | 15+ |

---

## Immediate Action Items (Next 2 Weeks)

1. **Set up Google Search Console** if not already done — verify ownership, submit sitemaps
2. **Set up Google Analytics 4** with UTM tracking for Reddit/Discord/YouTube links
3. **Post HueForge TD database announcement** on r/3Dprinting and r/HueForge
4. **Request HueForge wiki inclusion** for TD database
5. **Run first Lighthouse audit** on top 10 pages, create baseline scores
6. **Query AI engines** for target keywords, document baseline citations
7. **Verify IndexNow** is submitting new URLs correctly
8. **Check all guide static pages** are being generated in the build
