/**
 * generate-static-pages.js
 *
 * Post-build script that generates static HTML files for key pages.
 * Crawlers that don't execute JavaScript will see real content instead
 * of an empty <div id="root"></div>.
 *
 * Netlify serves static files from dist/ before the SPA catch-all,
 * so dist/filaments/index.html will be served for /filaments automatically.
 *
 * Usage: node scripts/generate-static-pages.js
 * Runs after `vite build` via: "build": "vite build && node scripts/generate-static-pages.js"
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR = join(__dirname, '..', 'dist');
const BASE_URL = 'https://filascope.com';

// Read the built index.html as a template
const templatePath = join(DIST_DIR, 'index.html');
if (!existsSync(templatePath)) {
  console.error('❌ dist/index.html not found. Run vite build first.');
  process.exit(1);
}
const template = readFileSync(templatePath, 'utf-8');

/**
 * Generate a static HTML page from the template.
 * Replaces <title>, meta tags, adds JSON-LD and semantic content.
 */
function generatePage({ path, title, description, canonical, jsonLd, content }) {
  let html = template;

  // Replace <title>
  html = html.replace(
    /<title>[^<]*<\/title>/,
    `<title>${escapeHtml(title)}</title>`
  );

  // Replace meta description
  html = html.replace(
    /<meta name="description" content="[^"]*"/,
    `<meta name="description" content="${escapeAttr(description)}"`
  );

  // Replace og:title
  html = html.replace(
    /<meta property="og:title" content="[^"]*"/,
    `<meta property="og:title" content="${escapeAttr(title)}"`
  );

  // Replace og:description
  html = html.replace(
    /<meta property="og:description" content="[^"]*"/,
    `<meta property="og:description" content="${escapeAttr(description)}"`
  );

  // Replace twitter:title
  html = html.replace(
    /<meta name="twitter:title" content="[^"]*"/,
    `<meta name="twitter:title" content="${escapeAttr(title)}"`
  );

  // Replace twitter:description
  html = html.replace(
    /<meta name="twitter:description" content="[^"]*"/,
    `<meta name="twitter:description" content="${escapeAttr(description)}"`
  );

  // Add canonical link (inject before </head>)
  const canonicalUrl = canonical || `${BASE_URL}${path}`;
  html = html.replace(
    '</head>',
    `  <link rel="canonical" href="${canonicalUrl}" />\n  </head>`
  );

  // Add JSON-LD schemas (inject before </head>)
  if (jsonLd && jsonLd.length > 0) {
    const jsonLdTags = jsonLd
      .map(schema => `  <script type="application/ld+json">${JSON.stringify(schema)}</script>`)
      .join('\n');
    html = html.replace(
      '</head>',
      `${jsonLdTags}\n  </head>`
    );
  }

  // Add semantic HTML content before <div id="root">
  // This content is visible to crawlers. When JS loads, React takes over #root
  // and the static content sits above it (or can be hidden via CSS).
  if (content) {
    html = html.replace(
      '<div id="root"></div>',
      `<div id="static-content" style="max-width:900px;margin:0 auto;padding:20px;font-family:'Inter',system-ui,sans-serif;color:#e2e8f0;">${content}</div>\n    <div id="root"></div>\n    <script>document.getElementById('static-content')?.remove();</script>`
    );
  }

  return html;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function writePage(path, html) {
  const dir = join(DIST_DIR, path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html, 'utf-8');
  console.log(`  ✅ ${path}/index.html`);
}

// ─── Page Definitions ─────────────────────────────────────────────

const pages = [
  {
    path: '/filaments',
    title: 'Compare 3D Printer Filaments — Database of 1,080+ Products | FilaScope',
    description: 'Browse and compare 1,080+ 3D printer filaments from 48+ brands. Filter by material, price, brand, color, and printer compatibility.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '3D Printer Filament Database',
        description: 'Structured database of 1,080+ 3D printer filaments from 48+ brands with specifications, pricing, and HueForge TD values.',
        url: `${BASE_URL}/filaments`,
      },
    ],
    content: `
      <h1>3D Printer Filament Database — Compare 1,080+ Products</h1>
      <p>FilaScope's filament database indexes 1,080+ 3D printer filaments from 48+ brands. Each product includes nozzle and bed temperature ranges, diameter, weight, density, and where available, HueForge TD values and mechanical properties. Live pricing is tracked from 15+ retailers across the US, Canada, EU, UK, and Australia.</p>
      <h2>Filter by Material</h2>
      <ul>
        <li><a href="/filaments/pla">PLA Filaments</a> — Easy to print, 190-220°C, best for decorative prints</li>
        <li><a href="/filaments/petg">PETG Filaments</a> — Stronger, 220-250°C, good for functional parts</li>
        <li><a href="/filaments/abs">ABS Filaments</a> — Heat-resistant, 230-260°C, requires enclosure</li>
        <li><a href="/filaments/tpu">TPU Filaments</a> — Flexible, 220-250°C, ideal for gaskets and cases</li>
        <li><a href="/filaments/asa">ASA Filaments</a> — UV-resistant, great for outdoor use</li>
        <li><a href="/filaments/nylon">Nylon Filaments</a> — Strongest FDM material, needs dry storage</li>
      </ul>
      <p>Use the interactive filters above to narrow by brand, color, price range, printer compatibility, and more. <a href="/compare">Compare up to 4 filaments side by side</a> or try the <a href="/wizard">Quick Match quiz</a> for personalized recommendations.</p>
    `,
  },
  {
    path: '/hueforge-td-database',
    title: 'HueForge TD Database — Filament Transmissivity Values | FilaScope',
    description: 'The largest public database of HueForge Transmission Distance (TD) values. 500+ filaments with verified TD data for lithophane and multicolor 3D printing.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Dataset',
        name: 'FilaScope HueForge TD Database',
        description: 'Comprehensive database of Transmission Distance (TD) values for 3D printing filaments, used for HueForge lithophane printing.',
        url: `${BASE_URL}/hueforge-td-database`,
        keywords: ['TD value', 'Transmission Distance', 'HueForge', 'filament database', '3D printing', 'lithophane'],
        isAccessibleForFree: true,
      },
    ],
    content: `
      <h1>HueForge TD Database — Filament Transmissivity Values</h1>
      <p>FilaScope maintains the internet's largest verified database of HueForge Transmission Distance (TD) values. TD measures how much light passes through a filament at a given thickness (in millimeters). Low TD values mean more opaque filaments; high TD values mean more translucent.</p>
      <h2>What is HueForge TD?</h2>
      <p>HueForge is software that creates multicolor 3D prints by stacking layers of different colored filaments and leveraging their light-filtering properties. The TD value is the single most critical variable for producing accurate lithophanes and color-blended prints. Without accurate TD data, HueForge prints come out incorrectly.</p>
      <h2>Database Coverage</h2>
      <p>FilaScope tracks TD values for 500+ filaments from brands including Bambu Lab, Polymaker, Prusament, eSUN, Sunlu, Hatchbox, and more. Values are sourced from official HueForge published data, manufacturer data sheets, and community-contributed measurements.</p>
      <p><a href="/guides/what-is-hueforge-td">Learn more about HueForge TD values</a> | <a href="/guides/best-filaments-for-hueforge">Best Filaments for HueForge</a></p>
    `,
  },
  {
    path: '/brands',
    title: '3D Printer Filament Brands — 48+ Manufacturers Compared | FilaScope',
    description: 'Explore 48+ 3D printer filament brands. Compare product ranges, pricing, quality ratings, and HueForge TD data availability across manufacturers.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '3D Printer Filament Brand Directory',
        description: 'Directory of 48+ 3D printer filament manufacturers with product ranges, pricing, and quality ratings.',
        url: `${BASE_URL}/brands`,
      },
    ],
    content: `
      <h1>3D Printer Filament Brands — 48+ Manufacturers Compared</h1>
      <p>FilaScope tracks filaments from 48+ manufacturers worldwide. Browse brands to compare product ranges, pricing across regions, material selection, and quality ratings.</p>
      <h2>Top Brands</h2>
      <ul>
        <li><a href="/brands/bambu-lab">Bambu Lab</a> — High-speed PLA, PETG, ABS optimized for Bambu printers with RFID</li>
        <li><a href="/brands/polymaker">Polymaker</a> — Wide range including PolyTerra PLA, PolyLite, and specialty materials</li>
        <li><a href="/brands/prusament">Prusament</a> — Premium filament with industry-leading ±0.02mm tolerances</li>
        <li><a href="/brands/esun">eSUN</a> — Budget-friendly with broad material selection including PLA+</li>
        <li><a href="/brands/overture">Overture</a> — Affordable quality PLA and PETG</li>
        <li><a href="/brands/hatchbox">Hatchbox</a> — Popular US brand for PLA and ABS</li>
        <li><a href="/brands/sunlu">Sunlu</a> — Budget PLA and specialty materials</li>
        <li><a href="/brands/fillamentum">Fillamentum</a> — Premium European brand with unique colors</li>
        <li><a href="/brands/colorfabb">ColorFabb</a> — Engineering-grade materials from the Netherlands</li>
        <li><a href="/brands/protopasta">Proto-pasta</a> — Specialty and composite filaments</li>
      </ul>
    `,
  },
  {
    path: '/printers',
    title: '3D Printer Database — Compare 119+ Models | FilaScope',
    description: 'Compare 119+ 3D printers from 22+ brands. Detailed specs including build volume, speeds, nozzle temps, connectivity, and filament compatibility.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '3D Printer Database',
        description: 'Database of 119+ 3D printers with detailed specifications and filament compatibility data.',
        url: `${BASE_URL}/printers`,
      },
    ],
    content: `
      <h1>3D Printer Database — Compare 119+ Models</h1>
      <p>FilaScope's printer database covers 119+ 3D printers from 22+ brands. Each printer profile includes build volume, maximum speeds, nozzle temperature range, heated bed specs, connectivity options, and compatible filament types.</p>
      <h2>Popular Printer Brands</h2>
      <ul>
        <li><a href="/printers?brand=bambu-lab">Bambu Lab Printers</a> — A1, A1 Mini, P1S, X1 Carbon</li>
        <li><a href="/printers?brand=prusa">Prusa Printers</a> — MK4S, MINI+, XL</li>
        <li><a href="/printers?brand=creality">Creality Printers</a> — Ender 3, K1, K1 Max</li>
        <li><a href="/printers?brand=elegoo">Elegoo Printers</a> — Neptune series</li>
        <li><a href="/printers?brand=anycubic">Anycubic Printers</a> — Kobra series</li>
      </ul>
    `,
  },
  {
    path: '/colors',
    title: 'Filament Color Finder — Match Any Color to 3D Printer Filaments | FilaScope',
    description: 'Find 3D printer filaments by color. Search by hex code, color name, or use the visual picker to find the closest matching filaments across 48+ brands.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Filament Color Finder',
        description: 'Search and match 3D printer filament colors across 48+ brands by hex code, color name, or color family.',
        url: `${BASE_URL}/colors`,
      },
    ],
    content: `
      <h1>Filament Color Finder — Match Any Color to 3D Printer Filaments</h1>
      <p>FilaScope's color matching tool helps you find the perfect filament color across 48+ brands. Search by color name, enter a hex code, or browse color families to find filaments that match your project needs.</p>
      <h2>Browse by Color Family</h2>
      <ul>
        <li><a href="/colors/white">White Filaments</a></li>
        <li><a href="/colors/black">Black Filaments</a></li>
        <li><a href="/colors/red">Red Filaments</a></li>
        <li><a href="/colors/blue">Blue Filaments</a></li>
        <li><a href="/colors/green">Green Filaments</a></li>
        <li><a href="/colors/yellow">Yellow Filaments</a></li>
        <li><a href="/colors/orange">Orange Filaments</a></li>
        <li><a href="/colors/purple">Purple Filaments</a></li>
        <li><a href="/colors/pink">Pink Filaments</a></li>
        <li><a href="/colors/gray">Gray Filaments</a></li>
      </ul>
    `,
  },
  {
    path: '/deals',
    title: 'Filament Deals — Latest 3D Printer Filament Price Drops | FilaScope',
    description: 'Find the latest 3D printer filament deals and price drops. FilaScope monitors prices from 15+ retailers daily across the US, Canada, EU, UK, and Australia.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Filament Deals & Price Drops',
        description: 'Latest 3D printer filament deals and price drops tracked daily from 15+ retailers.',
        url: `${BASE_URL}/deals`,
      },
    ],
    content: `
      <h1>Filament Deals — Latest 3D Printer Filament Price Drops</h1>
      <p>FilaScope monitors filament prices from 15+ retailers daily, flagging price drops and deals across 8,200+ color variants from 1,080+ filament products. Browse current deals below or set up alerts to be notified when your preferred filament drops in price.</p>
      <p>Prices are tracked in USD, CAD, EUR, GBP, and AUD across regions including the United States, Canada, Europe, United Kingdom, and Australia.</p>
    `,
  },
  {
    path: '/compare',
    title: 'Compare 3D Printer Filaments Side by Side | FilaScope',
    description: 'Compare up to 4 filaments side by side across every spec -- temps, strength, pricing, and HueForge TD values. Data from 1,080+ filament products.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'FilaScope Filament Comparison Tool',
        description: 'Compare up to 4 3D printer filaments side by side across specifications, pricing, and HueForge TD values.',
        url: `${BASE_URL}/compare`,
        applicationCategory: 'UtilityApplication',
        isAccessibleForFree: true,
      },
    ],
    content: `
      <h1>Compare 3D Printer Filaments Side by Side</h1>
      <p>FilaScope's comparison tool lets you select up to 4 filaments and compare them across every specification — print temperature, bed temperature, density, tensile strength, price per gram, and HueForge TD values. Use the search bar to find specific filaments or browse <a href="/filaments">the full database</a>.</p>
    `,
  },
  {
    path: '/guides',
    title: '3D Printing Guides, Tutorials & Buying Advice | FilaScope',
    description: 'Free 3D printing guides: filament buying advice, material comparisons, HueForge tutorials, and troubleshooting — backed by 1,080+ filament products.',
    canonical: `${BASE_URL}/guides`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '3D Printing Guides & Buying Advice',
        description: 'Free 3D printing guides covering filament selection, material comparisons, HueForge tutorials, and troubleshooting.',
        url: `${BASE_URL}/guides`,
      },
    ],
    content: `
      <h1>3D Printing Guides, Tutorials &amp; Buying Advice</h1>
      <p>FilaScope's learning center features 50+ data-driven guides on filament selection, material comparisons, HueForge techniques, and 3D printing best practices. All guides are backed by real data from our database of 1,080+ filament products (8,200+ color variants).</p>
      <h2>Popular Guides</h2>
      <ul>
        <li><a href="/guides/best-pla-filaments">Best PLA Filaments 2026</a></li>
        <li><a href="/guides/best-petg-filaments">Best PETG Filaments 2026</a></li>
        <li><a href="/guides/pla-vs-petg">PLA vs PETG Comparison</a></li>
        <li><a href="/guides/best-filaments-for-beginners">Best Filaments for Beginners</a></li>
        <li><a href="/guides/best-filaments-for-hueforge">Best Filaments for HueForge</a></li>
        <li><a href="/guides/what-is-hueforge-td">What is HueForge TD?</a></li>
        <li><a href="/guides/how-to-choose-3d-printer-filament">How to Choose 3D Printer Filament</a></li>
        <li><a href="/guides/filament-types-explained">Filament Types Explained</a></li>
        <li><a href="/guides/filament-temperature-guide">Filament Temperature Guide</a></li>
        <li><a href="/guides/filament-storage-guide">Filament Storage Guide</a></li>
      </ul>
    `,
  },
  {
    path: '/learn',
    title: '3D Printing Guides | FilaScope',
    description: 'This page has moved. Visit our guides section for filament buying advice, material comparisons, and HueForge tutorials.',
    canonical: `${BASE_URL}/guides`,
    content: `
      <h1>This page has moved</h1>
      <p>Our guides are now at <a href="/guides">/guides</a>. You will be redirected automatically.</p>
      <script>window.location.replace('/guides');</script>
    `,
  },
  {
    path: '/wizard',
    title: 'Quick Match — Find Your Perfect 3D Printer Filament | FilaScope',
    description: 'Answer 5 questions about your project, printer, and budget to get personalized filament recommendations from 1,080+ products.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'FilaScope Quick Match Filament Finder',
        description: 'Interactive quiz that recommends the best 3D printer filaments based on your project, printer, and budget.',
        url: `${BASE_URL}/wizard`,
        applicationCategory: 'UtilityApplication',
        isAccessibleForFree: true,
      },
    ],
    content: `
      <h1>Quick Match — Find Your Perfect 3D Printer Filament</h1>
      <p>FilaScope's Quick Match quiz asks 5 questions about your project type, printer model, material preference, budget, and priorities. It then recommends the best-matching filaments from our database of 1,080+ filament products with real pricing from 15+ retailers.</p>
      <p>Enable JavaScript for the interactive quiz, or <a href="/filaments">browse the full filament database</a>.</p>
    `,
  },
  {
    path: '/about',
    title: 'About FilaScope — The 3D Printer Filament Comparison Platform',
    description: 'FilaScope is a free filament comparison platform with 1,080+ products from 48+ brands, live pricing, and HueForge TD values.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        name: 'About FilaScope',
        description: 'FilaScope is a free 3D printer filament comparison platform with live pricing, HueForge TD values, and printer compatibility data.',
        url: `${BASE_URL}/about`,
      },
    ],
    content: `
      <h1>About FilaScope — The 3D Printer Filament Comparison Platform</h1>
      <p>FilaScope is a free 3D printer filament comparison platform that indexes 1,080+ filaments from 48+ brands with real-time pricing from 15+ retailers worldwide. It features the largest public HueForge Transmission Distance (TD) database, detailed material specifications, printer compatibility data, and FilaScore quality ratings.</p>
      <p>FilaScope is the only platform combining HueForge TD values, real-time multi-regional pricing, and printer compatibility in one database.</p>
    `,
  },
  {
    path: '/hueforge-td-lookup',
    title: 'HueForge TD Lookup — Find Your Filament\'s Transmission Distance | FilaScope',
    description: 'Look up HueForge Transmission Distance (TD) values for 500+ filaments. Search by brand, color, or material in the largest public TD database.',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'FilaScope HueForge TD Lookup',
        description: 'Search HueForge TD values for 500+ filaments by brand, color, or material.',
        url: `${BASE_URL}/hueforge-td-lookup`,
        applicationCategory: 'UtilityApplication',
        isAccessibleForFree: true,
      },
    ],
    content: `
      <h1>HueForge TD Lookup — Find Your Filament's Transmission Distance</h1>
      <p>Search the world's largest public database of HueForge Transmission Distance (TD) values. TD measures how much light passes through a filament at a given thickness (in millimeters) — the critical variable for accurate HueForge lithophane and multicolor prints.</p>
      <h2>Quick TD Reference</h2>
      <ul>
        <li><strong>Black filaments:</strong> TD 0.3–0.8 (very opaque)</li>
        <li><strong>Standard colors:</strong> TD 1.5–3.0</li>
        <li><strong>White filaments:</strong> TD 3.5–5.0</li>
        <li><strong>Clear/translucent:</strong> TD 5.0–10.0+</li>
      </ul>
      <p><a href="/hueforge-td-database">Browse the full TD database</a> | <a href="/guides/what-is-hueforge-td">What is HueForge TD?</a> | <a href="/guides/best-filaments-for-hueforge">Best Filaments for HueForge</a></p>
    `,
  },

  // ─── HueForge Tool Pages ────────────────────────────────────────
  {
    path: '/hueforge-filaments',
    title: 'HueForge Compatible Filaments — TD-Tested | FilaScope',
    description: 'Find filaments with verified HueForge TD values. Filter by brand, color, and transmissivity for perfect lithophane and multicolor prints.',
    canonical: `${BASE_URL}/hueforge-filaments`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'HueForge Compatible Filaments',
        description: 'Browse filaments with verified HueForge Transmission Distance (TD) values for lithophane and multicolor 3D printing.',
        url: `${BASE_URL}/hueforge-filaments`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'HueForge Filaments', item: `${BASE_URL}/hueforge-filaments` },
        ],
      },
    ],
    content: `
      <h1>HueForge Compatible Filaments</h1>
      <p>Browse filaments with verified HueForge Transmission Distance (TD) values. Filter by brand, color, and TD range to find the perfect filaments for lithophane and multicolor prints.</p>
      <p><a href="/hueforge-td-database">Full TD database</a> | <a href="/hueforge-td-lookup">TD lookup tool</a></p>
    `,
  },
  {
    path: '/hueforge-tools',
    title: 'HueForge Tools — TD Calculator & More | FilaScope',
    description: 'Free HueForge tools: TD calculator, palette builder, layer preview, and color matcher. Plan your multicolor 3D prints with data.',
    canonical: `${BASE_URL}/hueforge-tools`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'FilaScope HueForge Tools',
        description: 'Suite of free tools for HueForge multicolor 3D printing — TD calculator, palette builder, layer preview, and color matcher.',
        url: `${BASE_URL}/hueforge-tools`,
        applicationCategory: 'UtilityApplication',
        isAccessibleForFree: true,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'HueForge Tools', item: `${BASE_URL}/hueforge-tools` },
        ],
      },
    ],
    content: `
      <h1>HueForge Tools</h1>
      <p>Free tools to help you plan HueForge multicolor 3D prints. Calculate TD values, build palettes, preview layers, and match filament colors — all backed by FilaScope's database.</p>
      <ul>
        <li><a href="/hueforge-palette-builder">Palette Builder</a> — Design multi-color filament palettes</li>
        <li><a href="/hueforge-layer-preview">Layer Preview</a> — Visualize your print layers</li>
        <li><a href="/hueforge-color-matcher">Color Matcher</a> — Find matching filament colors</li>
        <li><a href="/hueforge-td-lookup">TD Lookup</a> — Search TD values by brand and color</li>
      </ul>
    `,
  },
  {
    path: '/hueforge-palette-builder',
    title: 'HueForge Palette Builder — Multi-Color Prints | FilaScope',
    description: 'Design multi-color filament palettes for HueForge prints. Select filaments by TD value and color to build the perfect combination.',
    canonical: `${BASE_URL}/hueforge-palette-builder`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'FilaScope HueForge Palette Builder',
        description: 'Interactive tool to design multi-color filament palettes for HueForge 3D prints using verified TD values.',
        url: `${BASE_URL}/hueforge-palette-builder`,
        applicationCategory: 'DesignApplication',
        isAccessibleForFree: true,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'HueForge Tools', item: `${BASE_URL}/hueforge-tools` },
          { '@type': 'ListItem', position: 3, name: 'Palette Builder', item: `${BASE_URL}/hueforge-palette-builder` },
        ],
      },
    ],
    content: `
      <h1>HueForge Palette Builder</h1>
      <p>Design multi-color filament palettes for HueForge prints. Select filaments by TD value and color, then preview how they combine for lithophane and multicolor projects.</p>
      <p><a href="/hueforge-tools">All HueForge tools</a> | <a href="/hueforge-td-database">TD database</a></p>
    `,
  },
  {
    path: '/hueforge-layer-preview',
    title: 'HueForge Layer Preview — Visualize Print Layers | FilaScope',
    description: 'Visualize how filament layers stack in your HueForge print. Preview light transmission and color blending before you print.',
    canonical: `${BASE_URL}/hueforge-layer-preview`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'FilaScope HueForge Layer Preview',
        description: 'Visualize how filament layers stack and transmit light in HueForge multicolor 3D prints.',
        url: `${BASE_URL}/hueforge-layer-preview`,
        applicationCategory: 'DesignApplication',
        isAccessibleForFree: true,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'HueForge Tools', item: `${BASE_URL}/hueforge-tools` },
          { '@type': 'ListItem', position: 3, name: 'Layer Preview', item: `${BASE_URL}/hueforge-layer-preview` },
        ],
      },
    ],
    content: `
      <h1>HueForge Layer Preview</h1>
      <p>Visualize how filament layers stack and transmit light in your HueForge print. Preview color blending and transmission effects before committing to a print.</p>
      <p><a href="/hueforge-tools">All HueForge tools</a> | <a href="/hueforge-palette-builder">Palette Builder</a></p>
    `,
  },
  {
    path: '/hueforge-color-matcher',
    title: 'HueForge Color Matcher — Find Matching Filaments | FilaScope',
    description: 'Find filament colors that match your HueForge project. Search by hex code or color name across 48+ brands with TD data.',
    canonical: `${BASE_URL}/hueforge-color-matcher`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'FilaScope HueForge Color Matcher',
        description: 'Match filament colors for HueForge projects. Search by hex code or color name across 48+ brands with verified TD values.',
        url: `${BASE_URL}/hueforge-color-matcher`,
        applicationCategory: 'UtilityApplication',
        isAccessibleForFree: true,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'HueForge Tools', item: `${BASE_URL}/hueforge-tools` },
          { '@type': 'ListItem', position: 3, name: 'Color Matcher', item: `${BASE_URL}/hueforge-color-matcher` },
        ],
      },
    ],
    content: `
      <h1>HueForge Color Matcher</h1>
      <p>Find filament colors that match your HueForge project needs. Search by hex code or color name across 48+ brands, with TD values to ensure accurate light transmission results.</p>
      <p><a href="/hueforge-tools">All HueForge tools</a> | <a href="/colors">Color finder</a></p>
    `,
  },

  // ─── Material Hub Pages ─────────────────────────────────────────
  {
    path: '/materials/pla',
    title: 'PLA Filament Guide — Properties & Settings | FilaScope',
    description: 'Complete PLA filament guide: print settings, mechanical properties, best brands, and top picks. The most popular 3D printing material explained.',
    canonical: `${BASE_URL}/materials/pla`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'PLA Filament Guide',
        description: 'Comprehensive guide to PLA filament properties, print settings, and best product picks.',
        url: `${BASE_URL}/materials/pla`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Materials', item: `${BASE_URL}/materials` },
          { '@type': 'ListItem', position: 3, name: 'PLA', item: `${BASE_URL}/materials/pla` },
        ],
      },
    ],
    content: `
      <h1>PLA Filament Guide</h1>
      <p>PLA is the most popular 3D printing filament. It prints at 190-220°C, requires minimal bed temperature, and produces high-quality results with low warping. Browse PLA properties, recommended settings, and top-rated products.</p>
      <p><a href="/filaments/pla">Browse PLA filaments</a> | <a href="/guides/best-pla-filaments">Best PLA picks</a></p>
    `,
  },
  {
    path: '/materials/petg',
    title: 'PETG Filament Guide — Properties & Settings | FilaScope',
    description: 'Complete PETG filament guide: print settings, strength data, chemical resistance, and best brands. Stronger than PLA for functional parts.',
    canonical: `${BASE_URL}/materials/petg`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'PETG Filament Guide',
        description: 'Comprehensive guide to PETG filament properties, print settings, and best product picks.',
        url: `${BASE_URL}/materials/petg`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Materials', item: `${BASE_URL}/materials` },
          { '@type': 'ListItem', position: 3, name: 'PETG', item: `${BASE_URL}/materials/petg` },
        ],
      },
    ],
    content: `
      <h1>PETG Filament Guide</h1>
      <p>PETG is a strong, chemically resistant filament that prints at 220-250°C. It bridges the gap between PLA ease-of-use and ABS durability. Explore properties, settings, and top-rated PETG products.</p>
      <p><a href="/filaments/petg">Browse PETG filaments</a> | <a href="/guides/best-petg-filaments">Best PETG picks</a></p>
    `,
  },
  {
    path: '/materials/abs',
    title: 'ABS Filament Guide — Properties & Settings | FilaScope',
    description: 'Complete ABS filament guide: print settings, heat resistance, enclosure requirements, and best brands for functional 3D printing.',
    canonical: `${BASE_URL}/materials/abs`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'ABS Filament Guide',
        description: 'Comprehensive guide to ABS filament properties, print settings, and best product picks.',
        url: `${BASE_URL}/materials/abs`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Materials', item: `${BASE_URL}/materials` },
          { '@type': 'ListItem', position: 3, name: 'ABS', item: `${BASE_URL}/materials/abs` },
        ],
      },
    ],
    content: `
      <h1>ABS Filament Guide</h1>
      <p>ABS is a heat-resistant engineering filament that prints at 230-260°C and requires an enclosed printer. It offers excellent durability and post-processing options. Review properties, settings, and top ABS products.</p>
      <p><a href="/filaments/abs">Browse ABS filaments</a> | <a href="/guides/best-abs-filaments">Best ABS picks</a></p>
    `,
  },
  {
    path: '/materials/tpu',
    title: 'TPU Filament Guide — Flexible Filament Settings | FilaScope',
    description: 'Complete TPU flexible filament guide: print settings, shore hardness, direct-drive requirements, and best brands for flexible 3D prints.',
    canonical: `${BASE_URL}/materials/tpu`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'TPU Filament Guide',
        description: 'Comprehensive guide to TPU flexible filament properties, print settings, and best product picks.',
        url: `${BASE_URL}/materials/tpu`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Materials', item: `${BASE_URL}/materials` },
          { '@type': 'ListItem', position: 3, name: 'TPU', item: `${BASE_URL}/materials/tpu` },
        ],
      },
    ],
    content: `
      <h1>TPU Filament Guide</h1>
      <p>TPU is a flexible, elastic filament that prints at 220-250°C. It works best with direct-drive extruders at slower speeds. Explore shore hardness ratings, settings, and the best TPU products.</p>
      <p><a href="/filaments/tpu">Browse TPU filaments</a> | <a href="/guides/best-tpu-filaments">Best TPU picks</a></p>
    `,
  },
  {
    path: '/materials/asa',
    title: 'ASA Filament Guide — UV-Resistant Settings | FilaScope',
    description: 'Complete ASA filament guide: UV resistance data, print settings, outdoor durability, and best brands. The go-to material for outdoor prints.',
    canonical: `${BASE_URL}/materials/asa`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'ASA Filament Guide',
        description: 'Comprehensive guide to ASA filament properties, UV resistance, print settings, and best product picks.',
        url: `${BASE_URL}/materials/asa`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Materials', item: `${BASE_URL}/materials` },
          { '@type': 'ListItem', position: 3, name: 'ASA', item: `${BASE_URL}/materials/asa` },
        ],
      },
    ],
    content: `
      <h1>ASA Filament Guide</h1>
      <p>ASA is the UV-resistant alternative to ABS, designed for outdoor 3D prints. It prints at 230-260°C and requires an enclosure. Explore UV durability data, settings, and the best ASA products.</p>
      <p><a href="/filaments/asa">Browse ASA filaments</a> | <a href="/guides/best-asa-filaments">Best ASA picks</a></p>
    `,
  },
  {
    path: '/materials/nylon',
    title: 'Nylon Filament Guide — High-Strength Settings | FilaScope',
    description: 'Complete nylon filament guide: print settings, moisture management, strength data, and best brands for high-performance 3D printing.',
    canonical: `${BASE_URL}/materials/nylon`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Nylon Filament Guide',
        description: 'Comprehensive guide to nylon filament properties, print settings, moisture management, and best product picks.',
        url: `${BASE_URL}/materials/nylon`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Materials', item: `${BASE_URL}/materials` },
          { '@type': 'ListItem', position: 3, name: 'Nylon', item: `${BASE_URL}/materials/nylon` },
        ],
      },
    ],
    content: `
      <h1>Nylon Filament Guide</h1>
      <p>Nylon is the strongest common FDM filament, printing at 240-270°C. It requires dry storage and an enclosed printer. Review strength data, moisture management tips, and the best nylon products.</p>
      <p><a href="/filaments/nylon">Browse nylon filaments</a> | <a href="/guides/best-nylon-filaments">Best nylon picks</a></p>
    `,
  },

  // ─── Color Family Pages ─────────────────────────────────────────
  {
    path: '/colors/white',
    title: 'White 3D Printer Filaments — Browse White Colors | FilaScope',
    description: 'Find the perfect white 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/white`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'White 3D Printer Filaments',
        description: 'Browse and compare white 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/white`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'White', item: `${BASE_URL}/colors/white` },
        ],
      },
    ],
    content: `
      <h1>White 3D Printer Filaments</h1>
      <p>Browse white filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect white for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/black',
    title: 'Black 3D Printer Filaments — Browse Black Colors | FilaScope',
    description: 'Find the perfect black 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/black`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Black 3D Printer Filaments',
        description: 'Browse and compare black 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/black`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Black', item: `${BASE_URL}/colors/black` },
        ],
      },
    ],
    content: `
      <h1>Black 3D Printer Filaments</h1>
      <p>Browse black filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect black for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/red',
    title: 'Red 3D Printer Filaments — Browse Red Colors | FilaScope',
    description: 'Find the perfect red 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/red`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Red 3D Printer Filaments',
        description: 'Browse and compare red 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/red`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Red', item: `${BASE_URL}/colors/red` },
        ],
      },
    ],
    content: `
      <h1>Red 3D Printer Filaments</h1>
      <p>Browse red filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect red for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/blue',
    title: 'Blue 3D Printer Filaments — Browse Blue Colors | FilaScope',
    description: 'Find the perfect blue 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/blue`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Blue 3D Printer Filaments',
        description: 'Browse and compare blue 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/blue`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Blue', item: `${BASE_URL}/colors/blue` },
        ],
      },
    ],
    content: `
      <h1>Blue 3D Printer Filaments</h1>
      <p>Browse blue filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect blue for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/green',
    title: 'Green 3D Printer Filaments — Browse Green Colors | FilaScope',
    description: 'Find the perfect green 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/green`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Green 3D Printer Filaments',
        description: 'Browse and compare green 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/green`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Green', item: `${BASE_URL}/colors/green` },
        ],
      },
    ],
    content: `
      <h1>Green 3D Printer Filaments</h1>
      <p>Browse green filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect green for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/yellow',
    title: 'Yellow 3D Printer Filaments — Browse Yellow Colors | FilaScope',
    description: 'Find the perfect yellow 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/yellow`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Yellow 3D Printer Filaments',
        description: 'Browse and compare yellow 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/yellow`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Yellow', item: `${BASE_URL}/colors/yellow` },
        ],
      },
    ],
    content: `
      <h1>Yellow 3D Printer Filaments</h1>
      <p>Browse yellow filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect yellow for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/orange',
    title: 'Orange 3D Printer Filaments — Browse Orange Colors | FilaScope',
    description: 'Find the perfect orange 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/orange`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Orange 3D Printer Filaments',
        description: 'Browse and compare orange 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/orange`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Orange', item: `${BASE_URL}/colors/orange` },
        ],
      },
    ],
    content: `
      <h1>Orange 3D Printer Filaments</h1>
      <p>Browse orange filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect orange for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/purple',
    title: 'Purple 3D Printer Filaments — Browse Purple Colors | FilaScope',
    description: 'Find the perfect purple 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/purple`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Purple 3D Printer Filaments',
        description: 'Browse and compare purple 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/purple`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Purple', item: `${BASE_URL}/colors/purple` },
        ],
      },
    ],
    content: `
      <h1>Purple 3D Printer Filaments</h1>
      <p>Browse purple filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect purple for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/pink',
    title: 'Pink 3D Printer Filaments — Browse Pink Colors | FilaScope',
    description: 'Find the perfect pink 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/pink`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Pink 3D Printer Filaments',
        description: 'Browse and compare pink 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/pink`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Pink', item: `${BASE_URL}/colors/pink` },
        ],
      },
    ],
    content: `
      <h1>Pink 3D Printer Filaments</h1>
      <p>Browse pink filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect pink for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/gray',
    title: 'Gray 3D Printer Filaments — Browse Gray Colors | FilaScope',
    description: 'Find the perfect gray 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/gray`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Gray 3D Printer Filaments',
        description: 'Browse and compare gray 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/gray`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Gray', item: `${BASE_URL}/colors/gray` },
        ],
      },
    ],
    content: `
      <h1>Gray 3D Printer Filaments</h1>
      <p>Browse gray filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect gray for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/brown',
    title: 'Brown 3D Printer Filaments — Browse Brown Colors | FilaScope',
    description: 'Find the perfect brown 3D printer filament. Compare shades from 48+ brands with hex values, TD data, and prices.',
    canonical: `${BASE_URL}/colors/brown`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Brown 3D Printer Filaments',
        description: 'Browse and compare brown 3D printer filaments from 48+ brands with hex values, TD data, and live pricing.',
        url: `${BASE_URL}/colors/brown`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Brown', item: `${BASE_URL}/colors/brown` },
        ],
      },
    ],
    content: `
      <h1>Brown 3D Printer Filaments</h1>
      <p>Browse brown filaments from 48+ brands. Compare shades, hex values, HueForge TD data, and live pricing to find the perfect brown for your project.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },
  {
    path: '/colors/transparent',
    title: 'Transparent 3D Printer Filaments — Browse Clear Colors | FilaScope',
    description: 'Find the perfect transparent 3D printer filament. Compare clear and translucent options from 48+ brands with TD data and prices.',
    canonical: `${BASE_URL}/colors/transparent`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Transparent 3D Printer Filaments',
        description: 'Browse and compare transparent and translucent 3D printer filaments from 48+ brands with TD data and live pricing.',
        url: `${BASE_URL}/colors/transparent`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Colors', item: `${BASE_URL}/colors` },
          { '@type': 'ListItem', position: 3, name: 'Transparent', item: `${BASE_URL}/colors/transparent` },
        ],
      },
    ],
    content: `
      <h1>Transparent 3D Printer Filaments</h1>
      <p>Browse transparent and translucent filaments from 48+ brands. Compare clarity levels, HueForge TD data, and live pricing for clear 3D printing projects.</p>
      <p><a href="/colors">All colors</a> | <a href="/filaments">All filaments</a></p>
    `,
  },

  // ─── Printer Category Pages ─────────────────────────────────────
  {
    path: '/printers/enclosed',
    title: 'Enclosed 3D Printers — Models with Enclosures | FilaScope',
    description: 'Compare enclosed 3D printers for ABS, ASA, nylon, and PC printing. Filter by build volume, price, and enclosure type.',
    canonical: `${BASE_URL}/printers/enclosed`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Enclosed 3D Printers',
        description: 'Compare enclosed 3D printers designed for high-temp materials like ABS, ASA, nylon, and polycarbonate.',
        url: `${BASE_URL}/printers/enclosed`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Printers', item: `${BASE_URL}/printers` },
          { '@type': 'ListItem', position: 3, name: 'Enclosed', item: `${BASE_URL}/printers/enclosed` },
        ],
      },
    ],
    content: `
      <h1>Enclosed 3D Printers</h1>
      <p>Compare enclosed 3D printers built for high-temperature materials like ABS, ASA, nylon, and polycarbonate. Enclosures reduce warping, block drafts, and contain fumes.</p>
      <p><a href="/printers">All printers</a> | <a href="/compatibility-matrix">Compatibility matrix</a></p>
    `,
  },
  {
    path: '/printers/multi-color',
    title: 'Multi-Color 3D Printers — AMS & MMU Models | FilaScope',
    description: 'Compare multi-color 3D printers with AMS, MMU, and multi-extruder systems. Print in multiple colors and materials automatically.',
    canonical: `${BASE_URL}/printers/multi-color`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Multi-Color 3D Printers',
        description: 'Compare multi-color 3D printers with automatic material switching systems like AMS and MMU.',
        url: `${BASE_URL}/printers/multi-color`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Printers', item: `${BASE_URL}/printers` },
          { '@type': 'ListItem', position: 3, name: 'Multi-Color', item: `${BASE_URL}/printers/multi-color` },
        ],
      },
    ],
    content: `
      <h1>Multi-Color 3D Printers</h1>
      <p>Compare 3D printers with automatic multi-color and multi-material systems including Bambu Lab AMS, Prusa MMU, and multi-extruder setups for multicolor prints.</p>
      <p><a href="/printers">All printers</a> | <a href="/hueforge-tools">HueForge tools</a></p>
    `,
  },
  {
    path: '/printers/high-speed',
    title: 'High-Speed 3D Printers — Fast Models Compared | FilaScope',
    description: 'Compare the fastest 3D printers on the market. Filter by max speed, acceleration, and print quality at high speeds.',
    canonical: `${BASE_URL}/printers/high-speed`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'High-Speed 3D Printers',
        description: 'Compare the fastest 3D printers with detailed speed, acceleration, and quality specifications.',
        url: `${BASE_URL}/printers/high-speed`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Printers', item: `${BASE_URL}/printers` },
          { '@type': 'ListItem', position: 3, name: 'High-Speed', item: `${BASE_URL}/printers/high-speed` },
        ],
      },
    ],
    content: `
      <h1>High-Speed 3D Printers</h1>
      <p>Compare the fastest 3D printers available, with max speeds up to 600mm/s and high acceleration. Filter by speed, print quality, and price to find the right fast printer.</p>
      <p><a href="/printers">All printers</a> | <a href="/filaments/high-speed-pla">High-speed PLA filaments</a></p>
    `,
  },
  {
    path: '/printers/budget',
    title: 'Budget 3D Printers Under $300 — Affordable Models | FilaScope',
    description: 'Compare the best budget 3D printers under $300. Find affordable models with great print quality, specs, and filament compatibility.',
    canonical: `${BASE_URL}/printers/budget`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Budget 3D Printers Under $300',
        description: 'Compare affordable 3D printers under $300 with detailed specifications and filament compatibility data.',
        url: `${BASE_URL}/printers/budget`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Printers', item: `${BASE_URL}/printers` },
          { '@type': 'ListItem', position: 3, name: 'Budget', item: `${BASE_URL}/printers/budget` },
        ],
      },
    ],
    content: `
      <h1>Budget 3D Printers Under $300</h1>
      <p>Find the best affordable 3D printers under $300. Compare build volume, print quality, speed, and filament compatibility across budget-friendly models.</p>
      <p><a href="/printers">All printers</a> | <a href="/guides/best-budget-filaments">Best budget filaments</a></p>
    `,
  },
  {
    path: '/printers/large-format',
    title: 'Large Format 3D Printers — Big Build Volume | FilaScope',
    description: 'Compare large format 3D printers with big build volumes. Find models with 300mm+ build areas for large-scale 3D printing projects.',
    canonical: `${BASE_URL}/printers/large-format`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Large Format 3D Printers',
        description: 'Compare large format 3D printers with 300mm+ build volumes for large-scale printing projects.',
        url: `${BASE_URL}/printers/large-format`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Printers', item: `${BASE_URL}/printers` },
          { '@type': 'ListItem', position: 3, name: 'Large Format', item: `${BASE_URL}/printers/large-format` },
        ],
      },
    ],
    content: `
      <h1>Large Format 3D Printers</h1>
      <p>Compare large format 3D printers with build volumes of 300mm and above. Find the right big-build-area printer for cosplay, prototyping, and large-scale projects.</p>
      <p><a href="/printers">All printers</a> | <a href="/filaments">Browse filaments</a></p>
    `,
  },

  // ─── Utility Pages ──────────────────────────────────────────────
  {
    path: '/compatibility-matrix',
    title: 'Printer-Filament Compatibility Matrix | FilaScope',
    description: 'Check which filaments work with your 3D printer. Cross-reference 119+ printers with material types, nozzle temps, and bed requirements.',
    canonical: `${BASE_URL}/compatibility-matrix`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'FilaScope Printer-Filament Compatibility Matrix',
        description: 'Interactive tool to check filament compatibility across 119+ 3D printers by material type, temperature, and bed requirements.',
        url: `${BASE_URL}/compatibility-matrix`,
        applicationCategory: 'UtilityApplication',
        isAccessibleForFree: true,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Compatibility Matrix', item: `${BASE_URL}/compatibility-matrix` },
        ],
      },
    ],
    content: `
      <h1>Printer-Filament Compatibility Matrix</h1>
      <p>Check which filament materials work with your 3D printer. Cross-reference 119+ printers against material types based on nozzle temperature, bed temperature, and enclosure requirements.</p>
      <p><a href="/printers">Browse printers</a> | <a href="/filaments">Browse filaments</a></p>
    `,
  },
  {
    path: '/slicer-directory',
    title: 'Slicer Directory — Compare 3D Printing Software | FilaScope',
    description: 'Compare 3D printer slicer software. Review features, supported printers, and material profiles for Cura, PrusaSlicer, OrcaSlicer, and more.',
    canonical: `${BASE_URL}/slicer-directory`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '3D Printer Slicer Directory',
        description: 'Directory of 3D printer slicer software with feature comparisons, supported printers, and material profile coverage.',
        url: `${BASE_URL}/slicer-directory`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Slicer Directory', item: `${BASE_URL}/slicer-directory` },
        ],
      },
    ],
    content: `
      <h1>3D Printer Slicer Directory</h1>
      <p>Compare popular 3D printer slicer software including Cura, PrusaSlicer, OrcaSlicer, Bambu Studio, and more. Review features, printer support, and material profiles.</p>
      <p><a href="/printers">Browse printers</a> | <a href="/filaments">Browse filaments</a></p>
    `,
  },
  {
    path: '/model-repositories',
    title: '3D Model Repositories — Where to Find STL Files | FilaScope',
    description: 'Directory of 3D model repositories for STL and 3MF files. Find free and paid models on Thingiverse, Printables, MakerWorld, and more.',
    canonical: `${BASE_URL}/model-repositories`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '3D Model Repositories',
        description: 'Directory of 3D model repositories and STL file sources for 3D printing.',
        url: `${BASE_URL}/model-repositories`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Model Repositories', item: `${BASE_URL}/model-repositories` },
        ],
      },
    ],
    content: `
      <h1>3D Model Repositories</h1>
      <p>Find STL and 3MF files for your 3D printer. Browse top model repositories including Thingiverse, Printables, MakerWorld, Thangs, and more.</p>
      <p><a href="/printers">Browse printers</a> | <a href="/filaments">Browse filaments</a></p>
    `,
  },

  // ─── Reference Pages ───────────────────────────────────────────
  {
    path: '/reference/materials',
    title: '3D Printing Material Knowledge Base | FilaScope',
    description: 'Complete 3D printing material reference. Properties, print settings, and use cases for PLA, PETG, ABS, TPU, ASA, nylon, PC, and more.',
    canonical: `${BASE_URL}/reference/materials`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: '3D Printing Material Knowledge Base',
        description: 'Comprehensive reference for all 3D printing material types with properties, settings, and use cases.',
        url: `${BASE_URL}/reference/materials`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Reference', item: `${BASE_URL}/reference` },
          { '@type': 'ListItem', position: 3, name: 'Materials', item: `${BASE_URL}/reference/materials` },
        ],
      },
    ],
    content: `
      <h1>3D Printing Material Knowledge Base</h1>
      <p>Comprehensive reference for all 3D printing materials. Learn properties, recommended print settings, and ideal use cases for PLA, PETG, ABS, TPU, ASA, nylon, polycarbonate, and specialty filaments.</p>
      <p><a href="/filaments">Browse filaments</a> | <a href="/guides">Guides</a></p>
    `,
  },
  {
    path: '/reference/slicers',
    title: 'Slicer Software Guide — Settings & Config | FilaScope',
    description: 'Guide to 3D printer slicer settings and configuration. Learn key parameters for print quality, speed, and material-specific profiles.',
    canonical: `${BASE_URL}/reference/slicers`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Slicer Software Guide',
        description: 'Reference guide to 3D printer slicer software settings, configuration, and material-specific profiles.',
        url: `${BASE_URL}/reference/slicers`,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: BASE_URL },
          { '@type': 'ListItem', position: 2, name: 'Reference', item: `${BASE_URL}/reference` },
          { '@type': 'ListItem', position: 3, name: 'Slicers', item: `${BASE_URL}/reference/slicers` },
        ],
      },
    ],
    content: `
      <h1>Slicer Software Guide</h1>
      <p>Learn key slicer settings for optimal 3D print quality. This guide covers layer height, speed, temperature, retraction, and material-specific profiles across popular slicers.</p>
      <p><a href="/slicer-directory">Slicer directory</a> | <a href="/filaments">Browse filaments</a></p>
    `,
  },
];

// Material category pages
const materials = [
  { slug: 'pla', label: 'PLA', desc: 'Easy to print, biodegradable, 190-220°C nozzle temperature' },
  { slug: 'petg', label: 'PETG', desc: 'Stronger than PLA, good chemical resistance, 220-250°C' },
  { slug: 'abs', label: 'ABS', desc: 'Heat-resistant, requires enclosure, 230-260°C' },
  { slug: 'tpu', label: 'TPU', desc: 'Flexible and elastic, ideal for phone cases and gaskets' },
  { slug: 'asa', label: 'ASA', desc: 'UV-resistant alternative to ABS, great for outdoor use' },
  { slug: 'nylon', label: 'Nylon', desc: 'Strongest FDM material, hygroscopic, needs dry storage' },
  { slug: 'polycarbonate', label: 'Polycarbonate', desc: 'Extremely heat and impact resistant' },
  { slug: 'silk-pla', label: 'Silk PLA', desc: 'Glossy decorative finish, easy to print' },
  { slug: 'pla-plus', label: 'PLA+', desc: 'Enhanced PLA with improved toughness' },
  { slug: 'high-speed-pla', label: 'High-Speed PLA', desc: 'Optimized for fast printers like Bambu Lab' },
  { slug: 'wood-fill', label: 'Wood-Fill', desc: 'PLA composite with real wood fibers for natural texture and appearance' },
  { slug: 'carbon-fiber', label: 'Carbon Fiber', desc: 'Reinforced filament with carbon fiber for rigidity and strength' },
  { slug: 'metal-fill', label: 'Metal-Fill', desc: 'PLA composite with metal powder for metallic look and weight' },
  { slug: 'glow-in-dark', label: 'Glow-in-the-Dark', desc: 'Phosphorescent filament that glows after light exposure' },
];

for (const mat of materials) {
  pages.push({
    path: `/filaments/${mat.slug}`,
    title: `${mat.label} 3D Printer Filaments — Compare Products & Prices | FilaScope`,
    description: `Browse and compare ${mat.label} filaments from 48+ brands. ${mat.desc}. Live pricing from 15+ retailers.`,
    content: `
      <h1>${mat.label} 3D Printer Filaments</h1>
      <p>${mat.desc}. Browse and compare ${mat.label} filaments from 48+ brands on FilaScope. Each product includes specifications, live pricing from 15+ retailers, and HueForge TD values where available.</p>
      <p><a href="/filaments">View all filaments</a> | <a href="/compare">Compare filaments side by side</a></p>
    `,
  });
}

// Guide pages — synced with guideConfigs.ts
const guides = [
  // Best-of buying guides
  { slug: 'best-pla-filaments', title: 'Best PLA Filaments in 2026' },
  { slug: 'best-petg-filaments', title: 'Best PETG Filaments in 2026' },
  { slug: 'best-abs-filaments', title: 'Best ABS Filaments in 2026' },
  { slug: 'best-tpu-filaments', title: 'Best TPU Filaments in 2026' },
  { slug: 'best-asa-filaments', title: 'Best ASA Filaments in 2026' },
  { slug: 'best-nylon-filaments', title: 'Best Nylon Filaments in 2026' },
  { slug: 'best-pc-filaments', title: 'Best Polycarbonate (PC) Filaments in 2026' },
  { slug: 'best-budget-filaments', title: 'Best Budget 3D Printer Filaments in 2026' },
  { slug: 'best-high-speed-pla-filaments', title: 'Best High-Speed PLA Filaments in 2026' },
  { slug: 'best-food-safe-filaments', title: 'Best Food-Safe Filaments in 2026' },
  { slug: 'best-filaments-for-functional-parts', title: 'Best Filaments for Functional Parts in 2026' },
  { slug: 'best-filaments-for-outdoor-use', title: 'Best 3D Printer Filaments for Outdoor Use in 2026' },
  { slug: 'best-filaments-for-miniatures', title: 'Best 3D Printer Filament for Miniatures in 2026' },
  { slug: 'best-filaments-for-cosplay', title: 'Best 3D Printer Filament for Cosplay in 2026' },
  { slug: 'best-filaments-for-lithophanes', title: 'Best Filaments for Lithophane Printing in 2026' },
  // Material comparison guides
  { slug: 'pla-vs-petg', title: 'PLA vs PETG: Which Should You Choose?' },
  { slug: 'petg-vs-abs', title: 'PETG vs ABS: Which Should You Choose?' },
  { slug: 'tpu-vs-petg', title: 'TPU vs PETG: Flexible vs Rigid Filament Compared' },
  { slug: 'pla-plus-vs-pla-pro', title: 'PLA+ vs PLA Pro: Which Should You Choose?' },
  { slug: 'asa-vs-abs-outdoor-printing', title: 'ASA vs ABS: Which is Better for Outdoor Printing?' },
  { slug: 'silk-pla-comparison', title: 'Best Silk PLA Filaments Compared' },
  { slug: 'strongest-3d-printer-filament', title: 'What Is the Strongest 3D Printer Filament?' },
  // HueForge guides
  { slug: 'hueforge-filaments', title: 'Best Filaments for HueForge Printing' },
  { slug: 'best-filaments-for-hueforge-lithophanes', title: 'Best Filaments for HueForge Lithophanes' },
  { slug: 'hueforge-beginners-guide', title: 'Complete HueForge Guide for Beginners' },
  { slug: 'understanding-td-values', title: 'Understanding TD Values: What They Mean and Why They Matter' },
  { slug: 'hueforge-color-selection', title: 'HueForge Color Selection: How to Pick the Right Filaments' },
  // Knowledge & how-to guides
  { slug: 'beginners-guide', title: "Complete Beginner's Guide to 3D Printing Filaments" },
  { slug: 'how-to-choose-filament', title: 'How to Choose 3D Printer Filament — A Complete Decision Guide' },
  { slug: 'how-to-store-filament', title: 'How to Store 3D Printer Filament Properly' },
  { slug: 'how-to-dry-filament', title: 'How to Dry 3D Printer Filament — Complete Temperature & Time Guide' },
  { slug: 'food-safe-filament', title: 'What 3D Printer Filament Is Food Safe?' },
  // Printer-specific guides
  { slug: 'best-filament-for-bambu-lab-p1s', title: 'Best Filaments for Bambu Lab P1S' },
  { slug: 'best-filament-for-bambu-lab-a1', title: 'Best Filaments for Bambu Lab A1 Mini & A1' },
  { slug: 'best-filament-for-bambu-lab-a1-mini', title: 'Best Filaments for Bambu Lab A1 Mini in 2026' },
  { slug: 'best-filament-for-bambu-lab-x1-carbon', title: 'Best Filaments for Bambu Lab X1 Carbon in 2026' },
  { slug: 'best-filament-for-prusa-mk4', title: 'Best Filaments for Prusa MK4 in 2026' },
  { slug: 'best-filament-for-creality-k1', title: 'Best Filaments for Creality K1 & K1 Max in 2026' },
  { slug: 'best-filament-for-creality-k1-max', title: 'Best Filaments for Creality K1 Max in 2026' },
  { slug: 'best-filament-for-ender-3', title: 'Best Filaments for Creality Ender 3 in 2026' },
  { slug: 'best-filament-for-creality-ender-3-v3', title: 'Best Filaments for Creality Ender 3 V3 in 2026' },
];

for (const guide of guides) {
  pages.push({
    path: `/guides/${guide.slug}`,
    title: `${guide.title} | FilaScope`,
    description: `${guide.title}. Data-driven guide backed by FilaScope's database of 1,080+ filament products from 48+ brands with real-time pricing.`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: guide.title,
        url: `${BASE_URL}/guides/${guide.slug}`,
        publisher: { '@type': 'Organization', name: 'FilaScope', url: BASE_URL },
      },
    ],
    content: `
      <h1>${guide.title}</h1>
      <p>This guide uses data from FilaScope's database of 1,080+ filament products across 48+ brands, with real-time pricing from 15+ retailers. <a href="/filaments">Browse the full filament database</a> or <a href="/guides">view all guides</a>.</p>
    `,
  });
}

// Top brand pages
const topBrands = [
  { slug: 'bambu-lab', name: 'Bambu Lab', desc: 'High-speed PLA, PETG, ABS, and specialty filaments optimized for Bambu Lab printers with RFID auto-detection.' },
  { slug: 'polymaker', name: 'Polymaker', desc: 'Premium filament brand known for PolyTerra PLA, PolyLite, and PolySonic lines across PLA, PETG, ABS, and specialty materials.' },
  { slug: 'esun', name: 'eSUN', desc: 'Budget-friendly filament with the widest material selection including PLA+, PETG, ABS, TPU, ASA, Nylon, and composites.' },
  { slug: 'prusament', name: 'Prusament', desc: 'Premium European filament with industry-leading ±0.02mm diameter tolerance from Prusa Research.' },
  { slug: 'overture', name: 'Overture', desc: 'Reliable, affordable filament brand popular for PLA and PETG with consistent quality.' },
  { slug: 'hatchbox', name: 'Hatchbox', desc: 'One of the most popular US filament brands, known for consistent PLA quality and wide color selection.' },
  { slug: 'sunlu', name: 'Sunlu', desc: 'Budget filament brand with wide color selection, popular for PLA, silk PLA, and specialty materials.' },
  { slug: 'fillamentum', name: 'Fillamentum', desc: 'Premium European brand from Czech Republic known for unique colors and high-quality ASA, PLA, and specialty filaments.' },
  { slug: 'colorfabb', name: 'ColorFabb', desc: 'Dutch engineering-grade filament brand specializing in nGen, HT, and composite materials.' },
  { slug: 'protopasta', name: 'Proto-pasta', desc: 'Specialty and composite filament maker based in Oregon, known for carbon fiber, metal-fill, and conductive PLA.' },
  { slug: 'creality', name: 'Creality', desc: 'Major 3D printer manufacturer also producing affordable Hyper PLA, PETG, and specialty filaments.' },
  { slug: 'elegoo', name: 'Elegoo', desc: 'Printer manufacturer expanding into filament with competitive PLA and PETG offerings.' },
];

for (const brand of topBrands) {
  pages.push({
    path: `/brands/${brand.slug}`,
    title: `${brand.name} Filaments — Products, Prices & Reviews | FilaScope`,
    description: `Browse all ${brand.name} 3D printer filaments. ${brand.desc} Compare specs, live pricing, and HueForge TD values.`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Brand',
        name: brand.name,
        url: `${BASE_URL}/brands/${brand.slug}`,
      },
    ],
    content: `
      <h1>${brand.name} 3D Printer Filaments</h1>
      <p>${brand.desc}</p>
      <p>Browse all ${brand.name} products on FilaScope with live pricing, specifications, and HueForge TD values where available.</p>
      <p><a href="/brands">View all brands</a> | <a href="/filaments">Browse all filaments</a> | <a href="/compare">Compare filaments</a></p>
    `,
  });
}

// ─── Generate All Pages ───────────────────────────────────────────

console.log(`\n📄 Generating ${pages.length} static HTML pages...\n`);

let count = 0;
for (const page of pages) {
  const html = generatePage(page);
  writePage(page.path, html);
  count++;
}

console.log(`\n✅ Generated ${count} static pages in dist/\n`);
