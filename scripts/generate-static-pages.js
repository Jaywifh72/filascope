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
    description: 'Browse and compare 1,080+ 3D printer filaments from 48+ brands. Filter by material, price, brand, color, and printer compatibility. Live pricing from 15+ retailers.',
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
    content: `
      <h1>Filament Deals — Latest 3D Printer Filament Price Drops</h1>
      <p>FilaScope monitors filament prices from 15+ retailers daily, flagging price drops and deals across 8,200+ filaments. Browse current deals below or set up alerts to be notified when your preferred filament drops in price.</p>
      <p>Prices are tracked in USD, CAD, EUR, GBP, and AUD across regions including the United States, Canada, Europe, United Kingdom, and Australia.</p>
    `,
  },
  {
    path: '/compare',
    title: 'Compare 3D Printer Filaments Side by Side | FilaScope',
    description: 'Compare up to 4 filaments side by side across every specification — temperatures, strength, pricing, and HueForge TD values. Data from 1,080+ filaments.',
    content: `
      <h1>Compare 3D Printer Filaments Side by Side</h1>
      <p>FilaScope's comparison tool lets you select up to 4 filaments and compare them across every specification — print temperature, bed temperature, density, tensile strength, price per gram, and HueForge TD values. Use the search bar to find specific filaments or browse <a href="/filaments">the full database</a>.</p>
    `,
  },
  {
    path: '/learn',
    title: '3D Printing Guides, Tutorials & Buying Advice | FilaScope',
    description: 'Free 3D printing guides covering filament buying advice, material comparisons, HueForge tutorials, and troubleshooting tips — backed by data from 8,200+ filaments.',
    content: `
      <h1>3D Printing Guides, Tutorials &amp; Buying Advice</h1>
      <p>FilaScope's learning center features 50+ data-driven guides on filament selection, material comparisons, HueForge techniques, and 3D printing best practices. All guides are backed by real data from our database of 8,200+ filaments.</p>
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
    path: '/wizard',
    title: 'Quick Match — Find Your Perfect 3D Printer Filament | FilaScope',
    description: 'Answer 5 questions about your project, printer, and budget to get personalized filament recommendations from FilaScope\'s database of 8,200+ filaments.',
    content: `
      <h1>Quick Match — Find Your Perfect 3D Printer Filament</h1>
      <p>FilaScope's Quick Match quiz asks 5 questions about your project type, printer model, material preference, budget, and priorities. It then recommends the best-matching filaments from our database of 8,200+ options with real pricing from 15+ retailers.</p>
      <p>Enable JavaScript for the interactive quiz, or <a href="/filaments">browse the full filament database</a>.</p>
    `,
  },
  {
    path: '/about',
    title: 'About FilaScope — The 3D Printer Filament Comparison Platform',
    description: 'Learn about FilaScope, the most comprehensive 3D printer filament comparison tool with 8,200+ products from 48+ brands, live pricing, and HueForge TD values.',
    content: `
      <h1>About FilaScope — The 3D Printer Filament Comparison Platform</h1>
      <p>FilaScope is a free 3D printer filament comparison platform that indexes 1,080+ filaments from 48+ brands with real-time pricing from 15+ retailers worldwide. It features the largest public HueForge Transmission Distance (TD) database, detailed material specifications, printer compatibility data, and FilaScore quality ratings.</p>
      <p>FilaScope is the only platform combining HueForge TD values, real-time multi-regional pricing, and printer compatibility in one database.</p>
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

// Guide pages
const guides = [
  { slug: 'best-pla-filaments', title: 'Best PLA Filaments 2026' },
  { slug: 'best-petg-filaments', title: 'Best PETG Filaments 2026' },
  { slug: 'best-abs-filaments', title: 'Best ABS Filaments 2026' },
  { slug: 'best-tpu-filaments', title: 'Best TPU Filaments 2026' },
  { slug: 'best-asa-filaments', title: 'Best ASA Filaments 2026' },
  { slug: 'best-nylon-filaments', title: 'Best Nylon Filaments 2026' },
  { slug: 'best-filaments-for-beginners', title: 'Best Filaments for Beginners' },
  { slug: 'best-filaments-for-hueforge', title: 'Best Filaments for HueForge' },
  { slug: 'best-budget-filaments', title: 'Best Budget 3D Printer Filaments' },
  { slug: 'best-white-filaments', title: 'Best White 3D Printer Filaments' },
  { slug: 'pla-vs-petg', title: 'PLA vs PETG — Filament Comparison' },
  { slug: 'pla-vs-abs', title: 'PLA vs ABS — Filament Comparison' },
  { slug: 'petg-vs-abs', title: 'PETG vs ABS — Filament Comparison' },
  { slug: 'tpu-vs-petg', title: 'TPU vs PETG — Filament Comparison' },
  { slug: 'nylon-vs-petg', title: 'Nylon vs PETG — Filament Comparison' },
  { slug: 'what-is-hueforge-td', title: 'What is HueForge TD? Complete Guide' },
  { slug: 'how-to-measure-filament-td', title: 'How to Measure Filament TD Values' },
  { slug: 'best-white-filaments-for-hueforge', title: 'Best White Filaments for HueForge' },
  { slug: 'filament-temperature-guide', title: 'Filament Temperature Guide' },
  { slug: 'filament-storage-guide', title: 'How to Store 3D Printer Filament' },
  { slug: 'how-to-choose-3d-printer-filament', title: 'How to Choose 3D Printer Filament' },
  { slug: 'filament-types-explained', title: '3D Printer Filament Types Explained' },
  { slug: 'strongest-3d-printer-filament', title: 'Strongest 3D Printer Filament' },
  { slug: 'cheapest-filament', title: 'Cheapest 3D Printer Filament' },
  { slug: 'best-filaments-for-miniatures', title: 'Best Filaments for Miniatures' },
  { slug: 'best-filaments-for-cosplay', title: 'Best Filaments for Cosplay' },
  { slug: 'best-filaments-for-outdoor-use', title: 'Best Filaments for Outdoor Use' },
  { slug: 'best-filaments-for-food-safe', title: 'Best Food-Safe 3D Printer Filaments' },
  { slug: 'best-bambu-lab-filaments', title: 'Best Bambu Lab Filaments' },
  { slug: 'best-prusa-filaments', title: 'Best Prusa Filaments' },
];

for (const guide of guides) {
  pages.push({
    path: `/guides/${guide.slug}`,
    title: `${guide.title} | FilaScope`,
    description: `${guide.title}. Data-driven guide backed by FilaScope's database of 8,200+ filaments from 48+ brands with real-time pricing.`,
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
      <p>This guide uses data from FilaScope's database of 8,200+ filaments across 48+ brands, with real-time pricing from 15+ retailers. <a href="/filaments">Browse the full filament database</a> or <a href="/learn">view all guides</a>.</p>
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
