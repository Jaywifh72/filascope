import type { GuideFilamentFilters } from '@/hooks/useGuideFilaments';

export interface EditorialSection {
  heading: string;
  content: string; // HTML string
  position: 'before' | 'after';
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface GuideConfig {
  slug: string;
  title: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
  category: 'buying-guide' | 'comparison' | 'beginner';
  readTime: number;
  publishedAt: string;
  updatedAt: string;
  keywords: string[];
  filters: GuideFilamentFilters;
  layout: 'ranked-list' | 'vs-comparison' | 'editorial';
  editorialSections: EditorialSection[];
  faqs: FAQItem[];
  relatedSlugs: string[];
}

export const BUYING_GUIDE_CONFIGS: Record<string, GuideConfig> = {
  'best-pla-filaments': {
    slug: 'best-pla-filaments',
    title: 'Best PLA Filaments in 2026',
    seoTitle: 'Best PLA Filaments in 2026 — Top 10 Ranked | FilaScope',
    seoDescription: 'Our data-driven ranking of the top 10 PLA filaments for 2026. Compare scores, prices, and specs with live regional pricing from 15+ retailers.',
    description: 'The definitive, data-driven ranking of PLA filaments based on specs, brand quality, pricing, and regional availability.',
    category: 'buying-guide',
    readTime: 12,
    publishedAt: '2026-01-15',
    updatedAt: '2026-02-01',
    keywords: ['best PLA filament', 'PLA filament 2026', 'top PLA filament', '3D printing PLA'],
    filters: { material: 'PLA', sortBy: 'score', limit: 10 },
    layout: 'ranked-list',
    editorialSections: [
      {
        heading: 'Why PLA Is Still the #1 Choice',
        content: `<p>PLA (Polylactic Acid) remains the most popular 3D printing filament for good reason. It's biodegradable, easy to print, doesn't require a heated bed or enclosure, and produces excellent surface quality. Whether you're a beginner or a seasoned maker, PLA is the go-to material for prototypes, decorative prints, and low-stress functional parts.</p>
<p>Our ranking uses the <strong>FilaScore algorithm</strong>, weighing data completeness, pricing transparency, color variety, technical documentation, brand trust, and regional availability to give you an objective comparison.</p>`,
        position: 'before',
      },
      {
        heading: 'What to Look For in PLA',
        content: `<ul>
<li><strong>Temperature range:</strong> Most PLA prints at 190–220°C nozzle / 50–60°C bed. Wider ranges offer more flexibility.</li>
<li><strong>Dimensional accuracy:</strong> Look for ±0.02mm tolerance or better.</li>
<li><strong>Color selection:</strong> More color options means better flexibility for your projects.</li>
<li><strong>Speed support:</strong> Some PLAs are formulated for high-speed printing (150mm/s+).</li>
<li><strong>Regional pricing:</strong> We show the best price in your region — no surprises at checkout.</li>
</ul>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'What is the best PLA filament for beginners?', answer: 'For beginners, we recommend filaments from verified brands like Bambu Lab, Hatchbox, or eSUN. These offer consistent quality, wide temperature windows, and good documentation.' },
      { question: 'Is PLA food safe?', answer: 'Raw PLA is generally considered food-safe, but the printing process introduces micro-gaps where bacteria can grow. For food contact, seal your prints with a food-safe epoxy coating.' },
      { question: 'Can PLA be used outdoors?', answer: 'PLA has low heat resistance (~60°C glass transition) and will deform in direct sunlight. For outdoor use, consider PETG or ASA instead.' },
    ],
    relatedSlugs: ['best-petg-filaments', 'pla-vs-petg', 'beginners-guide'],
  },

  'best-petg-filaments': {
    slug: 'best-petg-filaments',
    title: 'Best PETG Filaments in 2026',
    seoTitle: 'Best PETG Filaments in 2026 — Top 10 Ranked | FilaScope',
    seoDescription: 'Data-driven ranking of the top 10 PETG filaments. Compare strength, heat resistance, and regional prices across 15+ retailers.',
    description: 'The best PETG filaments ranked by FilaScore — perfect for functional parts that need more strength and heat resistance than PLA.',
    category: 'buying-guide',
    readTime: 11,
    publishedAt: '2026-01-20',
    updatedAt: '2026-02-01',
    keywords: ['best PETG filament', 'PETG filament 2026', 'top PETG', 'functional parts filament'],
    filters: { material: 'PETG', sortBy: 'score', limit: 10 },
    layout: 'ranked-list',
    editorialSections: [
      {
        heading: 'When to Choose PETG Over PLA',
        content: `<p>PETG combines the ease of PLA with much better mechanical properties. It offers superior heat resistance (~80°C), chemical resistance, and impact strength — making it ideal for functional parts, outdoor enclosures, and food-adjacent applications.</p>
<p>The trade-off? PETG is slightly more difficult to print: it strings more, requires a heated bed (70–80°C), and benefits from slower speeds. But for parts that need to last, PETG is the sweet spot between PLA and engineering-grade materials.</p>`,
        position: 'before',
      },
      {
        heading: 'PETG Printing Tips',
        content: `<ul>
<li><strong>Temperature:</strong> Nozzle 230–250°C, Bed 70–80°C. Too hot = stringing, too cold = poor layer adhesion.</li>
<li><strong>Retraction:</strong> Increase retraction distance by 1–2mm compared to PLA settings.</li>
<li><strong>First layer:</strong> PETG sticks aggressively to PEI sheets. Use a release agent or textured plate.</li>
<li><strong>Cooling:</strong> 30-50% fan — unlike PLA, PETG needs less cooling for stronger layer bonds.</li>
</ul>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'Is PETG stronger than PLA?', answer: 'Yes. PETG has higher impact resistance and better flexibility than PLA. It\'s also more heat-resistant, making it suitable for parts that experience mechanical stress.' },
      { question: 'Can you print PETG without an enclosure?', answer: 'Yes. Unlike ABS, PETG doesn\'t warp significantly and doesn\'t emit harmful fumes, so an enclosure is optional.' },
      { question: 'Is PETG food safe?', answer: 'PETG itself is FDA-approved for food contact. However, printed parts have micro-gaps. For food-safe applications, use a food-safe sealant.' },
    ],
    relatedSlugs: ['best-pla-filaments', 'best-abs-filaments', 'pla-vs-petg'],
  },

  'best-abs-filaments': {
    slug: 'best-abs-filaments',
    title: 'Best ABS Filaments in 2026',
    seoTitle: 'Best ABS Filaments in 2026 — Top 10 Ranked | FilaScope',
    seoDescription: 'Data-driven ranking of the top 10 ABS filaments. Compare heat resistance, mechanical properties, and prices for professional-grade prints.',
    description: 'The best ABS filaments for engineers and makers who need heat resistance, post-processing versatility, and proven mechanical properties.',
    category: 'buying-guide',
    readTime: 13,
    publishedAt: '2026-01-25',
    updatedAt: '2026-02-01',
    keywords: ['best ABS filament', 'ABS filament 2026', 'ABS for 3D printing', 'heat resistant filament'],
    filters: { material: 'ABS', sortBy: 'score', limit: 10 },
    layout: 'ranked-list',
    editorialSections: [
      {
        heading: 'Why ABS Still Matters in 2026',
        content: `<p>Despite competition from ASA and PETG, ABS remains the go-to material for engineering applications. Its key advantages: excellent heat resistance (~100°C), easy vapor smoothing with acetone for professional finishes, and proven track record in automotive and industrial prototyping.</p>
<p><strong>Important:</strong> ABS requires an enclosure for consistent results and emits fumes during printing. Ensure adequate ventilation or use a HEPA/activated carbon filter.</p>`,
        position: 'before',
      },
      {
        heading: 'ABS Safety & Print Settings',
        content: `<ul>
<li><strong>Enclosure required:</strong> ABS warps severely without one. Target 40–50°C chamber temp.</li>
<li><strong>Temperature:</strong> Nozzle 230–260°C, Bed 90–110°C.</li>
<li><strong>Ventilation:</strong> ABS emits styrene fumes. Print in a ventilated space or use a filtration system.</li>
<li><strong>Post-processing:</strong> Acetone vapor smoothing gives ABS parts an injection-molded finish.</li>
<li><strong>Bed adhesion:</strong> ABS juice (ABS dissolved in acetone) or specialized adhesion sheets work best.</li>
</ul>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'Is ABS safe to print indoors?', answer: 'ABS emits styrene fumes which can be irritating. Use an enclosure with a carbon filter, or print in a well-ventilated area. Do not print ABS in a bedroom or poorly ventilated space.' },
      { question: 'Why does ABS warp?', answer: 'ABS has a high shrinkage rate as it cools. Without an enclosure, uneven cooling causes corners to lift. An enclosure maintaining ~45°C ambient temperature prevents this.' },
      { question: 'Can you smooth ABS prints?', answer: 'Yes! Acetone vapor smoothing eliminates layer lines and gives ABS parts a glossy, injection-molded appearance.' },
    ],
    relatedSlugs: ['best-petg-filaments', 'best-pla-filaments', 'pla-vs-petg'],
  },

  'pla-vs-petg': {
    slug: 'pla-vs-petg',
    title: 'PLA vs PETG: Which Should You Choose?',
    seoTitle: 'PLA vs PETG — Complete Comparison Guide 2026 | FilaScope',
    seoDescription: 'PLA vs PETG compared side-by-side: strength, ease of printing, heat resistance, price, and best use cases. Data-backed recommendations for every scenario.',
    description: 'A side-by-side comparison of the two most popular filament materials with real product recommendations and data-backed verdicts.',
    category: 'comparison',
    readTime: 10,
    publishedAt: '2026-01-18',
    updatedAt: '2026-02-01',
    keywords: ['PLA vs PETG', 'PLA or PETG', 'filament comparison', 'which filament to use'],
    filters: { materials: ['PLA', 'PETG'], sortBy: 'score', limit: 6 },
    layout: 'vs-comparison',
    editorialSections: [
      {
        heading: 'Making the Right Choice',
        content: `<p>PLA and PETG are the two most popular 3D printing filaments, and choosing between them depends on your specific needs. Both are beginner-friendly, widely available, and affordable — but they excel in different scenarios.</p>
<p>Use this guide to understand the trade-offs and pick the right material for your next project.</p>`,
        position: 'before',
      },
      {
        heading: 'The Verdict',
        content: `<p><strong>Choose PLA if:</strong> You need great surface quality, easy printing, lots of color options, or you're a beginner. Ideal for prototypes, decorative models, cosplay props, and PLA-specific applications like HueForge.</p>
<p><strong>Choose PETG if:</strong> You need mechanical strength, heat resistance, outdoor durability, or chemical resistance. Ideal for functional parts, enclosures, brackets, and food-adjacent containers.</p>
<p><strong>When in doubt:</strong> Start with PLA. Move to PETG when your application demands it.</p>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'Is PLA or PETG cheaper?', answer: 'PLA is generally 10-20% cheaper per kilogram. However, PETG prices have been declining and many budget brands offer competitive PETG pricing.' },
      { question: 'Which is stronger, PLA or PETG?', answer: 'PETG has higher impact resistance and flexibility. PLA has higher rigidity but is more brittle. For parts under mechanical stress, PETG is the better choice.' },
      { question: 'Can beginners print PETG?', answer: 'Yes, but PLA is easier. PETG requires slightly higher temperatures, more retraction tuning, and can stick too aggressively to smooth PEI sheets.' },
    ],
    relatedSlugs: ['best-pla-filaments', 'best-petg-filaments', 'beginners-guide'],
  },

  'beginners-guide': {
    slug: 'beginners-guide',
    title: 'Complete Beginner\'s Guide to 3D Printing Filaments',
    seoTitle: 'Beginner\'s Guide to 3D Printing Filaments 2026 | FilaScope',
    seoDescription: 'New to 3D printing? Learn about filament types, how to choose the right material, and get top product recommendations for beginners.',
    description: 'Everything a new 3D printer owner needs to know about filament materials, settings, and choosing the right product.',
    category: 'beginner',
    readTime: 15,
    publishedAt: '2026-01-10',
    updatedAt: '2026-02-01',
    keywords: ['3D printing filament guide', 'beginner filament', 'first filament', 'filament types explained'],
    filters: { material: 'PLA', sortBy: 'score', limit: 5 },
    layout: 'editorial',
    editorialSections: [
      {
        heading: 'What Is 3D Printing Filament?',
        content: `<p>3D printing filament is thermoplastic material fed into an FDM (Fused Deposition Modeling) printer. The printer melts the filament and deposits it layer by layer to build a 3D object. Different materials offer different properties — strength, flexibility, heat resistance, and visual quality.</p>`,
        position: 'before',
      },
      {
        heading: 'Understanding Material Types',
        content: `<p><strong>PLA (Polylactic Acid):</strong> The easiest to print. Made from corn starch, biodegradable. Low temp (190–220°C). Great for beginners.</p>
<p><strong>PETG (Glycol-modified PET):</strong> Stronger and more heat-resistant than PLA. Slightly harder to print. Good for functional parts.</p>
<p><strong>ABS (Acrylonitrile Butadiene Styrene):</strong> Heat-resistant, tough, but requires an enclosure and good ventilation.</p>
<p><strong>TPU (Thermoplastic Polyurethane):</strong> Flexible/rubber-like. Great for phone cases, gaskets, wearables.</p>
<p><strong>Nylon (PA):</strong> Very strong and durable. Absorbs moisture — must be dried before use.</p>`,
        position: 'before',
      },
      {
        heading: 'How to Choose Your First Filament',
        content: `<ul>
<li><strong>Start with PLA.</strong> It's forgiving, widely available, and produces great-looking prints.</li>
<li><strong>Buy from a verified brand.</strong> Consistent diameter and quality matter more than price.</li>
<li><strong>Check your printer's specs.</strong> Ensure the filament's temperature requirements match your printer's capabilities.</li>
<li><strong>Store filament properly.</strong> Keep it sealed with desiccant to prevent moisture absorption.</li>
</ul>
<p>Not sure what to buy? Try our <a href="/wizard">Material Wizard</a> — it recommends filaments based on your specific needs in under 2 minutes.</p>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'What filament should I buy first?', answer: 'PLA is the best choice for your first filament. It\'s easy to print, affordable, and available in many colors. We recommend starting with a basic color (white or gray) from a verified brand.' },
      { question: 'Does filament expire?', answer: 'Filament doesn\'t technically expire, but it absorbs moisture from the air over time. Moist filament causes printing issues. Store it in a sealed container with desiccant for best results.' },
      { question: 'What diameter filament do I need?', answer: 'Most modern printers use 1.75mm filament. Some older or industrial printers use 2.85mm. Check your printer\'s specifications.' },
    ],
    relatedSlugs: ['best-pla-filaments', 'pla-vs-petg', 'hueforge-filaments'],
  },

  'hueforge-filaments': {
    slug: 'hueforge-filaments',
    title: 'Best Filaments for HueForge Printing',
    seoTitle: 'Best Filaments for HueForge 2026 — TD-Ranked | FilaScope',
    seoDescription: 'Find the best filaments for HueForge lithophane printing, ranked by Transmission Distance (TD). Includes picks for low, medium, and high TD ranges.',
    description: 'TD-ranked filament recommendations for HueForge lithophane printing, with explanations of transmissivity and picks for every TD range.',
    category: 'buying-guide',
    readTime: 14,
    publishedAt: '2026-01-22',
    updatedAt: '2026-02-01',
    keywords: ['HueForge filament', 'best filament for HueForge', 'transmission distance', 'TD filament', 'lithophane filament'],
    filters: { requireTD: true, sortBy: 'td', limit: 15 },
    layout: 'ranked-list',
    editorialSections: [
      {
        heading: 'Understanding Transmission Distance (TD)',
        content: `<p><strong>Transmission Distance (TD)</strong> measures how much light passes through a filament at a specific thickness. It's the critical property for HueForge lithophane printing, where images are created by varying print thickness to control light transmission.</p>
<p>TD is measured in millimeters and indicates the thickness at which the filament transitions from opaque to translucent:</p>
<ul>
<li><strong>Low TD (0.5–2.0mm):</strong> Very opaque. Creates high contrast in dark areas. Essential for shadows.</li>
<li><strong>Medium TD (2.0–4.0mm):</strong> Moderate light transmission. Provides mid-tones and gradients.</li>
<li><strong>High TD (4.0–8.0+mm):</strong> Very translucent. Creates bright highlights and white areas.</li>
</ul>
<p>A good HueForge project typically uses 3–5 colors across a range of TD values to create full-tonal images.</p>`,
        position: 'before',
      },
      {
        heading: 'Building Your HueForge Stack',
        content: `<p>For best results, select filaments that cover the full TD spectrum. A typical 4-color stack includes:</p>
<ol>
<li><strong>Black/Dark base (TD 0.5–1.5):</strong> Creates deep shadows and outlines.</li>
<li><strong>Dark mid-tone (TD 1.5–2.5):</strong> Fills in shadow detail.</li>
<li><strong>Light mid-tone (TD 2.5–4.0):</strong> Provides smooth gradients.</li>
<li><strong>Light/White top (TD 4.0+):</strong> Creates highlights and bright areas.</li>
</ol>
<p>Use our <a href="/colors?mode=hueforge">HueForge Stack Builder</a> to find filaments that match your needs, or browse the <a href="/td-database">full TD Database</a> for all measured filaments.</p>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'What is the best filament for HueForge?', answer: 'There\'s no single "best" filament — HueForge requires a stack of 3-5 filaments with different TD values. The best approach is to select filaments covering low, medium, and high TD ranges from verified brands with measured values.' },
      { question: 'How is TD measured?', answer: 'TD is measured by printing a calibration wedge and observing at which thickness light begins to pass through. The higher the TD value, the more translucent the filament.' },
      { question: 'Can I use any PLA for HueForge?', answer: 'Technically yes, but results vary dramatically. Filaments without measured TD values are unpredictable. We recommend using filaments from our database that have verified TD measurements.' },
    ],
    relatedSlugs: ['best-pla-filaments', 'beginners-guide', 'pla-vs-petg'],
  },
};

export const BUYING_GUIDE_SLUGS = Object.keys(BUYING_GUIDE_CONFIGS);

export function getBuyingGuideConfig(slug: string): GuideConfig | undefined {
  return BUYING_GUIDE_CONFIGS[slug];
}
