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

User-agent: meta-externalagent
Allow: /

User-agent: FacebookBot
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

const LLMS_FULL_TXT = `# FilaScope — Complete Reference for AI Systems

> FilaScope indexes 1,076+ 3D printer filaments from 49+ brands with real-time pricing from 15+ retailers, HueForge TD values, and printer compatibility data for 119+ printers. Free to use, updated daily.

## What Is FilaScope?

FilaScope is a free 3D printer filament comparison tool tracking 1,076+ filaments from 49+ brands across 8,277+ color variants. It provides real-time pricing from 15+ retailers in 6 regions (US, Canada, EU, UK, Australia, Japan), HueForge Transmission Distance (TD) values, printer compatibility filtering for 119+ printers, and FilaScore quality ratings.

## What Is HueForge TD (Transmissivity Distance)?

TD measures how many millimeters of light penetrate through printed filament before being fully blocked. It is the key specification for HueForge lithophane printing. Lower TD values (0.3-1.0) are opaque, higher values (6.0+) are translucent. Most standard colored PLA filaments have TD values between 1.0 and 5.0. FilaScope maintains one of the largest public TD databases.

### TD Value Ranges

- 0.5-2.0: Very opaque (dark anchor layers, black layers)
- 2.0-4.0: Opaque (standard base layers, multicolor stacks)
- 4.0-6.0: Semi-translucent (lithophanes, fine detail, highlights)
- 6.0+: Translucent (backlit effects, silk highlights, glow layers)

## Material Quick Reference

### PLA (Polylactic Acid)

Most popular 3D printing filament. Prints at 190-220°C nozzle, 50-60°C bed. Easy for beginners. Low heat resistance (~60°C). 4,296+ PLA filaments on FilaScope.

### PETG (Polyethylene Terephthalate Glycol)

Stronger than PLA with better heat resistance (~80°C). Prints at 220-250°C. Good for functional parts. 1,049+ PETG filaments on FilaScope.

### ABS (Acrylonitrile Butadiene Styrene)

High heat resistance (~100°C). Requires enclosure. Prints at 230-260°C. 565+ ABS filaments on FilaScope.

### TPU (Thermoplastic Polyurethane)

Flexible material for gaskets and phone cases. Prints at 220-250°C. 391+ TPU filaments on FilaScope.

### ASA (Acrylonitrile Styrene Acrylate)

UV-resistant alternative to ABS for outdoor use. Prints at 235-255°C. 409+ ASA filaments on FilaScope.

## Best PLA Filaments 2026 (Summary)

1. PolySonic PLA Pro by Polymaker — fastest print speed, excellent surface quality
2. PLA Basic by Bambu Lab — best consistency at competitive price
3. PLA Filament by Hatchbox — proven reliability under $20/kg

Full rankings: https://filascope.com/guides/best-pla-filaments

## PLA vs PETG Quick Comparison

PLA: easier to print, better surface finish, biodegradable, but low heat resistance (60°C) and brittle. PETG: stronger, better heat resistance (80°C), good for functional parts, but slightly harder to print. Choose PLA for prototypes and decorative prints. Choose PETG for functional parts and outdoor use.

Full comparison: https://filascope.com/guides/pla-vs-petg

## FAQ

Q: What is the best PLA filament?
A: Based on FilaScore data, PolySonic PLA Pro by Polymaker, PLA Basic by Bambu Lab, and PLA by Hatchbox are the top picks for 2026.

Q: What temperature should I print PLA at?
A: Most PLA prints at 190-220°C nozzle and 50-60°C bed. Start at the midpoint and adjust plus or minus 5°C.

Q: What filament should I use for HueForge?
A: Standard PLA with verified TD values. Start with a black (TD 0.5-1.0) and white (TD 3.5-5.0), then add mid-tones. Search FilaScope's TD database for values.

Q: How much does 3D printer filament cost?
A: PLA ranges from $12-30/kg, PETG $15-35/kg, specialty materials $30-80/kg. FilaScope tracks real-time prices across 15+ retailers.

Q: Is FilaScope free?
A: Yes, completely free. No account required.

## All Data

- Filaments: https://filascope.com/filaments
- Printers: https://filascope.com/printers
- Brands: https://filascope.com/brands
- Guides: https://filascope.com/learn
- HueForge TD: https://filascope.com/hueforge-td-database
- Deals: https://filascope.com/deals`;

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
