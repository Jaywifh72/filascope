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

  // Default: serve robots.txt
  return new Response(ROBOTS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
      ...corsHeaders,
    },
  });
});
