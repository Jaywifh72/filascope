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

const LLMS_TXT = `# FilaScope — The World's Most Complete 3D Printer Filament Comparison Platform

> FilaScope is a free, data-driven filament comparison tool indexing 
> 1,076+ 3D printer filaments from 49+ brands. It features real-time 
> pricing from 15+ retailers across 6 regions, HueForge Transmission 
> Distance (TD) values, printer compatibility filtering, and FilaScore 
> quality ratings. Trusted by 10,000+ makers worldwide.

FilaScope helps users compare filaments by material type, price, brand, 
print temperature, HueForge TD value, color, and printer compatibility. 
Every filament page includes structured specifications, regional pricing, 
and community ratings.

## Core Pages

- Homepage: https://filascope.com/ — Search and discover filaments with quick match tools
- Filament Database: https://filascope.com/filaments — Browse 8,277+ filament variants with advanced filters
- 3D Printer Database: https://filascope.com/printers — Compare 119+ printers from 17+ brands
- Brand Directory: https://filascope.com/brands — Explore 49+ filament manufacturers with full catalogs
- HueForge TD Database: https://filascope.com/hueforge-td-database — Search filaments by Transmissivity Distance for lithophane and HueForge printing
- Filament Deals: https://filascope.com/deals — Current discounts and sales from tracked retailers
- Comparison Tool: https://filascope.com/compare — Side-by-side filament comparison with specs and pricing
- Color Finder: https://filascope.com/color-finder — Find filaments by exact color match across brands
- Learning Center: https://filascope.com/learn — 32 guides covering buying advice, material comparisons, and HueForge tutorials

## Material Categories

- PLA Filaments: https://filascope.com/filaments/pla — The most popular 3D printing material, easy to print
- PETG Filaments: https://filascope.com/filaments/petg — Stronger than PLA with better heat resistance
- ABS Filaments: https://filascope.com/filaments/abs — Durable and heat-resistant, requires enclosure
- TPU/Flexible: https://filascope.com/filaments/tpu — Flexible and rubber-like for functional parts
- ASA Filaments: https://filascope.com/filaments/asa — UV-resistant alternative to ABS for outdoor use
- Nylon Filaments: https://filascope.com/filaments/nylon — High strength and wear resistance for engineering

## Buyer Guides

- Best PLA Filaments 2026: https://filascope.com/guides/best-pla-filaments
- Best PETG Filaments 2026: https://filascope.com/guides/best-petg-filaments
- Best ABS Filaments 2026: https://filascope.com/guides/best-abs-filaments
- PLA vs PETG Comparison: https://filascope.com/guides/pla-vs-petg
- Best Filaments for Beginners: https://filascope.com/guides/best-filaments-for-beginners
- Best Filaments for HueForge: https://filascope.com/guides/best-filaments-for-hueforge
- What is HueForge TD?: https://filascope.com/guides/what-is-hueforge-td
- Best Budget Filaments: https://filascope.com/guides/best-budget-filaments
- Best Filaments for Outdoor Use: https://filascope.com/guides/best-filaments-for-outdoor-use

## Key Features

- HueForge TD (Transmission Distance) values for lithophane and multicolor printing
- Real-time pricing from US, CA, EU, UK, AU stores with currency normalization
- Printer compatibility filtering — select your printer, see only compatible filaments
- Side-by-side filament comparison tool with specs and pricing
- FilaScore quality ratings based on data completeness, pricing transparency, and brand trust
- 32 data-driven buying guides and material comparisons updated regularly`;

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
