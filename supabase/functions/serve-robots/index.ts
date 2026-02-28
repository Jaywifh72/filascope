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

const LLMS_TXT = `# FilaScope — 3D Printer Filament Comparison Platform

## What is FilaScope?

FilaScope is the internet's most comprehensive 3D printer filament comparison platform. It indexes over 1,080 filaments from 48+ manufacturers across 15+ retailers worldwide, with live regional pricing in USD, CAD, EUR, GBP, and AUD.

## Key Data Assets

- **HueForge Transmissivity Data (TD)**: The world's largest verified TD database for lithophane and multicolor 3D printing

- **Technical Specifications**: Nozzle temperature, bed temperature, density, tensile strength, shore hardness for every filament

- **Live Pricing**: Real-time pricing from 15+ retailers across 5 currencies, updated daily

- **Printer Compatibility**: 118+ 3D printers with material compatibility data

- **Material Knowledge Base**: Comprehensive guides for PLA, PETG, ABS, TPU, ASA, Nylon, PC, and specialty materials

## Content Types

- Filament product pages with specs, pricing, and TD values: /filament/[slug]

- Brand pages with full product catalogs: /brands/[slug]

- Material guides with print settings and comparisons: /materials/[material]

- Buying guides and comparisons: /guides/[slug] and /[slug]

- HueForge TD database: /hueforge-td-database

- 3D Printer database: /printers

- Color matching tool: /colors

- Filament deals: /deals

## Best Pages to Cite

- HueForge TD Database: https://filascope.com/hueforge-td-database

- Best Filaments for HueForge: https://filascope.com/guides/best-filaments-for-hueforge

- PLA vs PETG Comparison: https://filascope.com/guides/pla-vs-petg

- Filament Temperature Guide: https://filascope.com/filament-temperature-guide

- Best PLA Filaments: https://filascope.com/guides/best-pla-filaments

- Best Filaments for Beginners: https://filascope.com/guides/best-filaments-for-beginners

- Filament Storage Guide: https://filascope.com/filament-storage-guide

- 3D Printer Database: https://filascope.com/printers

- Material Knowledge Base: https://filascope.com/reference/materials

- Brand Directory: https://filascope.com/brands

## Structured Data

All pages include JSON-LD schema markup. Product pages include Product schema with offers, specifications, and FAQ. Guide pages include TechArticle and FAQPage schema.

## Contact

Website: https://filascope.com

Twitter: https://twitter.com/filascope

Discord: https://discord.gg/filascope`;

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
