/**
 * serve-robots edge function
 *
 * Serves two static files that Lovable's SPA hosting cannot serve natively:
 *   - robots.txt  (Content-Type: text/plain)
 *   - IndexNow key file (via ?file=indexnow-key)
 *
 * Reached via _redirects rules:
 *   /robots.txt                            → this function (302)
 *   /a3f8c2d7e1b5049f6a2c8d3e7f1b4a9c.txt → this function?file=indexnow-key (302)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /admin/

User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

User-agent: Applebot
Allow: /

User-agent: Applebot-Extended
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: Bytespider
Allow: /

User-agent: cohere-ai
Allow: /

User-agent: Meta-ExternalAgent
Allow: /

User-agent: FacebookBot
Allow: /

User-agent: OAI-SearchBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: DeepSeekBot
Allow: /

User-agent: Amazonbot
Allow: /

User-agent: YouBot
Allow: /

User-agent: AI2Bot
Allow: /

Sitemap: https://filascope.com/sitemap.xml`;

const INDEXNOW_KEY = "a3f8c2d7e1b5049f6a2c8d3e7f1b4a9c";

const LLMS_TXT = `# FilaScope — The World's Most Complete 3D Printer Filament Database

> FilaScope is a free filament comparison platform tracking 1,076+ 3D printer filaments from 49+ brands. Features real-time pricing from 15+ retailers across 6 regions (US, CA, EU, UK, AU, JP), the world's largest HueForge Transmission Distance (TD) database, printer compatibility filtering, and data-driven FilaScore quality ratings. Trusted by 10,000+ makers worldwide.

## Core Pages

- Homepage: https://filascope.com/
- Filament Database (8,277+ variants): https://filascope.com/filaments
- 3D Printer Database (119+ printers): https://filascope.com/printers
- Brand Directory (49+ brands): https://filascope.com/brands
- HueForge TD Database: https://filascope.com/hueforge-td-database
- Filament Deals: https://filascope.com/deals
- Side-by-Side Comparison Tool: https://filascope.com/compare
- Color Finder: https://filascope.com/colors
- Material Knowledge Base: https://filascope.com/reference/materials
- Learning Center (32 guides): https://filascope.com/learn

## Material Categories

- PLA (4,296 filaments): https://filascope.com/filaments/pla
- PETG (1,049 filaments): https://filascope.com/filaments/petg
- ABS (565 filaments): https://filascope.com/filaments/abs
- TPU/Flexible (391 filaments): https://filascope.com/filaments/tpu
- ASA (409 filaments): https://filascope.com/filaments/asa
- Nylon/PA (151 filaments): https://filascope.com/filaments/nylon

## Top Brands

- Bambu Lab (40 products): https://filascope.com/brands/bambu-lab
- Polymaker: https://filascope.com/brands/polymaker
- Prusament: https://filascope.com/brands/prusament
- eSUN: https://filascope.com/brands/esun
- Hatchbox: https://filascope.com/brands/hatchbox
- Overture: https://filascope.com/brands/overture
- Sunlu: https://filascope.com/brands/sunlu
- Creality: https://filascope.com/brands/creality

## Buying Guides

- Best PLA Filaments 2026: https://filascope.com/guides/best-pla-filaments
- Best PETG Filaments 2026: https://filascope.com/guides/best-petg-filaments
- Best ABS Filaments 2026: https://filascope.com/guides/best-abs-filaments
- Best TPU Filaments 2026: https://filascope.com/guides/best-tpu-filaments-2026
- Best ASA Filaments 2026: https://filascope.com/guides/best-asa-filaments
- Best Nylon Filaments 2026: https://filascope.com/guides/best-nylon-filaments
- Best Budget Filaments: https://filascope.com/guides/best-budget-filaments
- Best Filaments for Beginners: https://filascope.com/guides/best-filaments-for-beginners
- Best High-Speed PLA: https://filascope.com/guides/best-high-speed-pla-filaments
- Best Filaments for Miniatures: https://filascope.com/guides/best-filaments-for-miniatures
- Best Filaments for Functional Parts: https://filascope.com/guides/best-filaments-for-functional-parts
- Best Filaments for Outdoor Use: https://filascope.com/guides/best-filaments-for-outdoor-use
- Best Filaments for Lithophanes: https://filascope.com/guides/best-filaments-for-lithophanes
- Best Filament for Bambu Lab P1S: https://filascope.com/guides/best-filament-for-bambu-lab-p1s

## Material Comparisons

- PLA vs PETG: https://filascope.com/guides/pla-vs-petg
- PLA+ vs PLA Pro: https://filascope.com/guides/pla-plus-vs-pla-pro
- ASA vs ABS for Outdoor: https://filascope.com/guides/asa-vs-abs-outdoor-printing
- PETG vs ABS: https://filascope.com/guides/petg-vs-abs
- TPU vs PETG: https://filascope.com/guides/tpu-vs-petg
- Best Silk PLA Compared: https://filascope.com/guides/silk-pla-comparison

## HueForge Guides

- What Is HueForge TD?: https://filascope.com/guides/what-is-hueforge-td
- Best Filaments for HueForge: https://filascope.com/guides/best-filaments-for-hueforge
- Best White Filaments for HueForge: https://filascope.com/guides/best-white-filaments-for-hueforge
- How to Measure Filament TD: https://filascope.com/guides/how-to-measure-filament-td
- Complete HueForge Guide: https://filascope.com/learn/hueforge

## Key Features

- HueForge TD values for lithophane and multicolor printing
- Real-time pricing from US, CA, EU, UK, AU stores
- Printer compatibility filtering
- Side-by-side filament comparison tool
- FilaScore quality ratings (1-10 scale)
- 32 data-driven buying guides`;

const LLMS_FULL_TXT = `# FilaScope — The World's Most Complete 3D Printer Filament Comparison Platform

> FilaScope is a free, data-driven filament comparison platform that indexes 1,080+ 3D printer filaments from 48+ brands. It features real-time pricing from 15+ retailers across the US, Canada, EU, UK, and Australia, the largest public HueForge Transmission Distance (TD) database, printer compatibility filtering, and FilaScore quality ratings. Updated daily.

## What Is FilaScope?

FilaScope is a free 3D printer filament comparison platform that helps makers find the perfect filament for any project. It indexes 1,080+ filaments from 48+ brands with detailed specifications including nozzle temperature, bed temperature, diameter, material type, density, and tensile strength. FilaScope tracks real-time pricing from 15+ retailers worldwide with currency normalization across 6 regional markets (US, Canada, EU, UK, Australia, Japan). It features the world's largest public HueForge Transmission Distance (TD) database for lithophane and multicolor printing, printer compatibility filtering for 119+ printers, and a proprietary FilaScore quality rating system. FilaScope is trusted by 10,000+ makers globally.

## Key Data Points

- Total filaments indexed: 1,080+
- Total filament variants (colors): 8,277+
- Brands tracked: 48+
- Retailers monitored: 15+
- 3D printers in database: 119+
- Regional markets: US, Canada, EU, UK, Australia, Japan
- HueForge TD values tracked: largest public database
- Price updates: Daily
- FilaScore ratings: Every filament scored 1-10

## Material Types Covered

### PLA (Polylactic Acid)

PLA is the most popular 3D printing filament material. It prints at 190-220°C nozzle temperature, requires minimal bed heating (25-60°C), is biodegradable, and produces excellent surface quality. Ideal for beginners, prototypes, decorative prints, and low-stress functional parts. FilaScope tracks 4,296+ PLA filament variants.

### PETG (Polyethylene Terephthalate Glycol)

PETG is the second most popular filament, offering better strength and heat resistance than PLA. It prints at 220-250°C with a bed temperature of 70-80°C. PETG is more durable, slightly flexible, and suitable for functional parts, outdoor items, and food-safe containers. FilaScope tracks 1,048+ PETG variants.

### ABS (Acrylonitrile Butadiene Styrene)

ABS is a strong, heat-resistant engineering filament that prints at 230-260°C with a heated bed at 90-110°C. It requires an enclosed printer to prevent warping. ABS is ideal for mechanical parts, automotive components, and items that need heat resistance above 80°C. FilaScope tracks 865+ ABS variants.

### TPU (Thermoplastic Polyurethane)

TPU is a flexible, rubber-like filament with Shore hardness ratings from 85A to 98A. It prints at 210-230°C and is used for phone cases, gaskets, wearables, and vibration dampening. Requires slow print speeds (20-40mm/s). FilaScope tracks 381+ TPU/flex variants.

### ASA (Acrylonitrile Styrene Acrylate)

ASA is a UV-resistant alternative to ABS, ideal for outdoor applications. It prints at 235-260°C with similar strength to ABS but superior weathering resistance. FilaScope tracks 408+ ASA variants.

### Nylon/PA (Polyamide)

Nylon is a high-performance engineering filament with excellent strength, flexibility, and wear resistance. It prints at 240-270°C and requires dry storage. Used for gears, hinges, and load-bearing parts. FilaScope tracks 101+ Nylon variants.

## HueForge Transmission Distance (TD)

HueForge Transmission Distance (TD) measures how many millimeters of light can pass through a filament. Lower TD values (0.1-1.0) indicate opaque filaments, while higher values (4.0-10.0+) indicate translucent ones. TD is critical for HueForge multicolor lithophane printing, where the software calculates how colors blend when stacked layer-by-layer. FilaScope maintains the world's largest public TD database.

### TD Value Reference Ranges

- Black/Dark Colors: TD 0.3-0.8 (very opaque)
- Standard Colors: TD 1.5-3.0 (moderate)
- White: TD 3.5-5.0+ (translucent)
- Translucent/Clear: TD 5.0-10.0+ (highly translucent)

## Core Pages

- Homepage: https://filascope.com/
- Filament Database (1,080+ products): https://filascope.com/filaments
- PLA Filaments (4,296+ variants): https://filascope.com/filaments/pla
- PETG Filaments (1,048+ variants): https://filascope.com/filaments/petg
- ABS Filaments (865+ variants): https://filascope.com/filaments/abs
- TPU Filaments (381+ variants): https://filascope.com/filaments/tpu
- ASA Filaments (408+ variants): https://filascope.com/filaments/asa
- Nylon Filaments: https://filascope.com/filaments/nylon
- 3D Printer Database (119+ printers): https://filascope.com/printers
- Brand Directory (48+ brands): https://filascope.com/brands
- HueForge TD Database: https://filascope.com/hueforge-td-database
- Filament Deals (400+ active): https://filascope.com/deals
- Comparison Tool: https://filascope.com/compare
- Color Finder: https://filascope.com/color-finder
- Learning Center (32 guides): https://filascope.com/learn

## Buying Guides

- Best PLA Filaments 2026: https://filascope.com/guides/best-pla-filaments
- Best PETG Filaments 2026: https://filascope.com/guides/best-petg-filaments
- Best ABS Filaments 2026: https://filascope.com/guides/best-abs-filaments
- Best TPU Filaments 2026: https://filascope.com/guides/best-tpu-filaments
- Best ASA Filaments 2026: https://filascope.com/guides/best-asa-filaments
- Best Filaments for Beginners: https://filascope.com/best-filaments-for-beginners
- Best Filaments for HueForge: https://filascope.com/best-filaments-for-hueforge
- Best Filaments for Outdoor Use: https://filascope.com/guides/best-filaments-for-outdoor-use
- Best Filaments for Lithophanes: https://filascope.com/guides/best-filaments-for-lithophanes
- Best White Filaments for HueForge: https://filascope.com/guides/best-white-filaments-for-hueforge
- Best Filament for Bambu Lab P1S: https://filascope.com/guides/best-filament-for-bambu-lab-p1s
- Silk PLA Comparison: https://filascope.com/guides/silk-pla-comparison
- PLA Plus vs PLA Pro: https://filascope.com/guides/pla-plus-vs-pla-pro
- ASA vs ABS for Outdoor Printing: https://filascope.com/guides/asa-vs-abs-outdoor-printing

## Material Comparison Guides

- PLA vs PETG: https://filascope.com/pla-vs-petg
- What is HueForge TD: https://filascope.com/guides/what-is-hueforge-td
- How to Measure Filament TD: https://filascope.com/guides/how-to-measure-filament-td
- HueForge Complete Guide: https://filascope.com/learn/hueforge

## Top Brands on FilaScope

- Bambu Lab (40 products, 227 variants): https://filascope.com/brands/bambu-lab
- Polymaker: https://filascope.com/brands/polymaker
- eSUN: https://filascope.com/brands/esun
- Overture: https://filascope.com/brands/overture
- Creality: https://filascope.com/brands/creality
- Prusament: https://filascope.com/brands/prusament
- Fiberlogy: https://filascope.com/brands/fiberlogy
- FormFutura: https://filascope.com/brands/formfutura
- Hatchbox: https://filascope.com/brands/hatchbox
- Sunlu: https://filascope.com/brands/sunlu

## Frequently Asked Questions

Q: What is the best PLA filament in 2026?
A: Based on FilaScope's data-driven rankings, the top PLA filaments in 2026 are Polymaker PolySonic PLA Pro for print speed and surface quality, Bambu Lab PLA Basic for value and consistency, and Prusament PLA for dimensional accuracy. Rankings are based on FilaScore ratings that weigh print quality, pricing, brand trust, and regional availability across our database of 4,296+ PLA variants.

Q: What temperature should I print PLA at?
A: PLA filament typically prints at a nozzle temperature of 190-220°C with a bed temperature of 25-60°C. The optimal temperature varies by brand — for example, Bambu Lab PLA Basic recommends 190-220°C while some PLA+ variants may need up to 230°C. Always check the manufacturer's recommended settings, which FilaScope lists for every filament.

Q: What is HueForge Transmission Distance (TD)?
A: HueForge Transmission Distance (TD) measures how many millimeters of light can pass through a 3D printer filament. TD values range from 0.3 (very opaque, like black filament) to 10.0+ (highly translucent, like clear PETG). TD is essential for HueForge multicolor lithophane printing. FilaScope maintains the world's largest public TD database.

Q: How do I compare 3D printer filaments?
A: FilaScope's comparison tool lets you compare up to 6 filaments side-by-side across specs, pricing, availability, and HueForge TD values. Filter by material type, brand, price range, printer compatibility, and color. Each filament has a FilaScore (1-10) based on print quality, pricing transparency, and brand trust.

Q: What is the difference between PLA and PETG?
A: PLA prints easier (190-220°C, no enclosure needed) with better surface quality, while PETG is stronger, more heat-resistant (220-250°C), and better for functional parts. PLA is ideal for beginners and decorative prints; PETG is better for outdoor items, mechanical parts, and food-safe applications. See FilaScope's full PLA vs PETG guide at https://filascope.com/pla-vs-petg

Q: What filament should I use for HueForge?
A: For HueForge multicolor lithophane printing, choose filaments with known TD values. Use a black/dark filament with TD 0.5-1.0 for base layers, white with TD 3.5-5.0 for highlights, and mid-tone colors with TD 1.5-3.0. Standard PLA is most popular for HueForge due to consistent TD and wide color selection. Browse FilaScope's TD database at https://filascope.com/hueforge-td-database

Q: What is FilaScore?
A: FilaScore is FilaScope's proprietary quality rating system that scores every filament from 1-10. It evaluates six weighted factors: print quality consistency, temperature tolerance range, pricing across regions, community ratings and brand trust, HueForge TD data availability, and color variety. Rankings update automatically as new data flows into the database.

Q: How much does 3D printer filament cost?
A: 3D printer filament prices vary by material and brand. Standard PLA ranges from $15-30 USD per 1kg spool, PETG from $18-35, ABS from $15-30, and specialty filaments like Nylon or TPU from $25-60. FilaScope tracks real-time pricing from 15+ retailers across the US, Canada, EU, UK, and Australia with daily price updates and deal alerts.

---

Last updated: February 28, 2026
Data source: FilaScope.com database`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const file = url.searchParams.get("file");

  if (file === "indexnow-key" || file === "indexnow") {
    return new Response(INDEXNOW_KEY, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        ...corsHeaders,
      },
    });
  }

  if (file === "llms") {
    return new Response(LLMS_TXT, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        ...corsHeaders,
      },
    });
  }

  if (file === "llms-full") {
    return new Response(LLMS_FULL_TXT, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        ...corsHeaders,
      },
    });
  }

  // Default: serve robots.txt
  return new Response(ROBOTS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      ...corsHeaders,
    },
  });
});
