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
  vsMaterials?: [string, string]; // For vs-comparison layout: [materialA, materialB]
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
    relatedSlugs: ['best-petg-filaments', 'pla-vs-petg', 'beginners-guide', 'pla-plus-vs-pla-pro', 'silk-pla-comparison'],
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
    relatedSlugs: ['best-pla-filaments', 'best-abs-filaments', 'pla-vs-petg', 'best-filament-for-bambu-lab-p1s', 'asa-vs-abs-outdoor-printing'],
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
    relatedSlugs: ['best-petg-filaments', 'best-pla-filaments', 'pla-vs-petg', 'asa-vs-abs-outdoor-printing', 'best-filament-for-bambu-lab-p1s'],
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
    vsMaterials: ['PLA', 'PETG'],
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
    relatedSlugs: ['best-pla-filaments', 'best-petg-filaments', 'beginners-guide', 'pla-plus-vs-pla-pro', 'silk-pla-comparison'],
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
    relatedSlugs: ['best-pla-filaments', 'beginners-guide', 'pla-vs-petg', 'best-filaments-for-hueforge-lithophanes'],
  },

  'best-filaments-for-hueforge-lithophanes': {
    slug: 'best-filaments-for-hueforge-lithophanes',
    title: 'Best Filaments for HueForge Lithophanes',
    seoTitle: 'Best Filaments for HueForge Lithophanes (2026) | FilaScope',
    seoDescription: 'Top 10 filaments for HueForge lithophanes ranked by TD value. Compare opacity, prices, and settings for stunning lithophane prints.',
    description: 'The definitive ranked list of filaments optimized for HueForge lithophane printing, sorted by Transmission Distance (TD) with real pricing and specs.',
    category: 'buying-guide',
    readTime: 14,
    publishedAt: '2026-02-14',
    updatedAt: '2026-02-14',
    keywords: ['HueForge lithophane filament', 'best lithophane filament', 'TD value filament', 'lithophane 3D printing', 'HueForge 2026'],
    filters: { requireTD: true, sortBy: 'td', limit: 10 },
    layout: 'ranked-list',
    editorialSections: [
      {
        heading: 'What Makes a Good Lithophane Filament?',
        content: `<p>Lithophane quality depends on three filament properties: <strong>Transmission Distance (TD)</strong>, <strong>layer adhesion</strong>, and <strong>opacity consistency</strong>. TD measures how much light passes through at a given thickness — it's the single most important spec for HueForge projects.</p>
<p>For lithophanes, you want filaments with <strong>low TD values (0.5–2.5mm)</strong> for deep shadows and high contrast, plus filaments with <strong>higher TD values (3.0–6.0+mm)</strong> for highlights and mid-tones. The best lithophane stacks use 3–5 filaments spanning the full TD range.</p>
<ul>
<li><strong>Opacity:</strong> Consistent, uniform opacity across the spool ensures predictable results layer after layer.</li>
<li><strong>Layer adhesion:</strong> Strong interlayer bonding prevents delamination in thin lithophane walls.</li>
<li><strong>Dimensional accuracy:</strong> Tight diameter tolerance (±0.02mm) is critical — thickness variations directly affect light transmission.</li>
<li><strong>Color purity:</strong> Avoid filaments with glitter, metallic flakes, or translucent additives that scatter light unpredictably.</li>
</ul>`,
        position: 'before',
      },
      {
        heading: 'White vs Colored Filaments for Lithophanes',
        content: `<p>Traditional single-color lithophanes use <strong>white filament</strong> because it transmits light most evenly. White PLA typically has TD values of 3.0–5.0mm, producing excellent contrast between thick (dark) and thin (bright) areas when backlit.</p>
<p>However, <strong>HueForge changes the equation</strong>. Multi-color lithophanes layer different-colored filaments at varying thicknesses to create full-color images. In this case, you need:</p>
<ul>
<li><strong>Dark colors (black, dark brown):</strong> TD 0.5–1.5mm — for deep shadows and outlines.</li>
<li><strong>Mid-tones (red, blue, green):</strong> TD 1.5–3.0mm — for color detail and gradients.</li>
<li><strong>Light colors (yellow, white):</strong> TD 3.0–6.0mm — for highlights and bright areas.</li>
</ul>
<p>For classic single-color lithophanes, stick with white or natural PLA. For HueForge, build a stack covering the full TD spectrum.</p>`,
        position: 'after',
      },
      {
        heading: 'Recommended Settings for HueForge Printing',
        content: `<ul>
<li><strong>Layer height:</strong> 0.08–0.12mm for maximum detail. Lower = smoother gradients but longer print times.</li>
<li><strong>Nozzle temperature:</strong> 200–215°C for PLA. Slightly higher than normal ensures strong layer adhesion in thin walls.</li>
<li><strong>Print speed:</strong> 30–50mm/s. Slower speeds improve layer consistency and reduce artifacts.</li>
<li><strong>Infill:</strong> 100% — lithophanes must be fully solid for proper light transmission.</li>
<li><strong>Orientation:</strong> Print vertically (standing up) for best results. Horizontal printing compresses layers and reduces contrast.</li>
<li><strong>Cooling:</strong> 100% fan after the first few layers. PLA lithophanes benefit from maximum cooling.</li>
</ul>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'What TD value is best for lithophanes?', answer: 'For single-color lithophanes, a TD of 3.0–4.5mm (white PLA) gives the best contrast. For multi-color HueForge projects, you need a range: low TD (0.5–1.5) for shadows, medium (2.0–3.5) for mid-tones, and high (4.0+) for highlights.' },
      { question: 'Can I use PETG for HueForge?', answer: 'PETG works for lithophanes but is less ideal than PLA. PETG tends to be more translucent (higher TD), making it harder to achieve deep shadows. PLA offers more predictable opacity and better TD variety across brands.' },
      { question: 'What layer height should I use for lithophanes?', answer: '0.08mm to 0.12mm layer height is recommended. Thinner layers produce smoother tonal gradients. At 0.2mm, you lose significant detail and the transitions between light and dark become visibly stepped.' },
    ],
    relatedSlugs: ['hueforge-filaments', 'best-pla-filaments', 'beginners-guide'],
  },

  'pla-plus-vs-pla-pro': {
    slug: 'pla-plus-vs-pla-pro',
    title: 'PLA+ vs PLA Pro: Which Should You Choose?',
    seoTitle: 'PLA+ vs PLA Pro — What\'s the Difference? | FilaScope',
    seoDescription: 'PLA+ and PLA Pro compared: actual material differences, brand naming conventions, strength tests, and top product picks for each.',
    description: 'Cutting through the marketing confusion — what PLA+ and PLA Pro actually mean, how they differ, and which products deliver the best value.',
    category: 'comparison',
    readTime: 10,
    publishedAt: '2026-02-14',
    updatedAt: '2026-02-14',
    keywords: ['PLA+ vs PLA Pro', 'PLA plus', 'PLA Pro filament', 'enhanced PLA', 'PLA+ filament comparison'],
    filters: { materials: ['PLA+', 'PLA Pro'], sortBy: 'score', limit: 10 },
    layout: 'vs-comparison',
    vsMaterials: ['PLA+', 'PLA Pro'],
    editorialSections: [
      {
        heading: 'The Marketing Confusion Explained',
        content: `<p>"PLA+" and "PLA Pro" are <strong>not standardized material designations</strong>. Unlike PLA or PETG, these names are brand-specific marketing terms for enhanced PLA formulations. The result? Two filaments labeled "PLA+" from different brands can have completely different properties.</p>
<p>Here's how major brands use these terms:</p>
<ul>
<li><strong>eSUN PLA+:</strong> Their enhanced PLA with improved toughness and heat resistance. One of the original "PLA+" products.</li>
<li><strong>Polymaker PolyLite PLA Pro:</strong> A modified PLA with higher impact resistance and slightly higher heat deflection temperature.</li>
<li><strong>Bambu Lab PLA Basic vs PLA Matte:</strong> Bambu avoids both terms entirely, using descriptive names instead.</li>
<li><strong>Overture PLA Pro:</strong> Enhanced formulation with improved layer adhesion and reduced brittleness.</li>
</ul>
<p>The bottom line: <strong>ignore the name, compare the specs.</strong> That's exactly what our data-driven comparison below does.</p>`,
        position: 'before',
      },
      {
        heading: 'Key Differences: PLA+ vs PLA Pro',
        content: `<p>Despite the naming inconsistency, most "enhanced PLA" filaments share common improvements over standard PLA:</p>
<ul>
<li><strong>Impact resistance:</strong> 2–5× higher than standard PLA. Less brittle, more forgiving in functional parts.</li>
<li><strong>Temperature range:</strong> Typically 205–230°C nozzle (vs 190–220°C for standard PLA). Slightly higher bed temps too.</li>
<li><strong>Layer adhesion:</strong> Improved interlayer bonding means stronger parts in the Z-axis.</li>
<li><strong>Heat resistance:</strong> Marginally better than PLA (~62–68°C vs ~58°C glass transition), but still not suitable for high-heat applications.</li>
</ul>
<p><strong>When it matters:</strong> If you're printing decorative items, standard PLA is fine. For functional parts that need to survive drops or light mechanical stress, PLA+ / PLA Pro is worth the 10–20% price premium.</p>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'Is PLA+ the same as PLA Pro?', answer: 'Not exactly. Both are marketing terms for enhanced PLA, but different brands use different formulations. "PLA+" (popularized by eSUN) and "PLA Pro" (used by Polymaker, Overture) may have different additives and properties. Always compare specs, not names.' },
      { question: 'Is PLA+ stronger than regular PLA?', answer: 'Generally yes. Most PLA+ formulations have 2–5× higher impact resistance than standard PLA, better layer adhesion, and reduced brittleness. However, the strength improvement varies significantly between brands.' },
      { question: 'Do I need different settings for PLA+ or PLA Pro?', answer: 'Slightly. Most enhanced PLAs print at 205–230°C (5–10°C higher than standard PLA) and benefit from slightly higher bed temps (60–65°C). Retraction settings are usually the same as standard PLA.' },
    ],
    relatedSlugs: ['best-pla-filaments', 'beginners-guide', 'pla-vs-petg'],
  },

  'best-filament-for-bambu-lab-p1s': {
    slug: 'best-filament-for-bambu-lab-p1s',
    title: 'Best Filaments for Bambu Lab P1S',
    seoTitle: 'Best Filaments for Bambu Lab P1S (2026) | FilaScope',
    seoDescription: 'Top filament picks for the Bambu Lab P1S. PLA, PETG, ABS, and TPU recommendations with AMS compatibility notes and print settings.',
    description: 'Curated filament recommendations for Bambu Lab P1S owners — covering PLA, PETG, ABS, and TPU with AMS compatibility and tuned print profiles.',
    category: 'buying-guide',
    readTime: 13,
    publishedAt: '2026-02-14',
    updatedAt: '2026-02-14',
    keywords: ['Bambu Lab P1S filament', 'best filament P1S', 'P1S compatible filament', 'Bambu Lab filament', 'AMS filament'],
    filters: { materials: ['PLA', 'PETG', 'ABS', 'TPU'], sortBy: 'score', limit: 10 },
    layout: 'ranked-list',
    editorialSections: [
      {
        heading: 'Bambu Lab P1S: Quick Specs Recap',
        content: `<p>The <strong>Bambu Lab P1S</strong> is a fully enclosed CoreXY printer that handles a wide range of materials out of the box. Key specs for filament compatibility:</p>
<ul>
<li><strong>Max nozzle temp:</strong> 300°C — supports PLA, PETG, ABS, ASA, TPU, PA (Nylon), and PC.</li>
<li><strong>Max bed temp:</strong> 110°C — adequate for ABS and most engineering materials.</li>
<li><strong>Enclosure:</strong> Fully enclosed with active chamber heating — critical for ABS and PA.</li>
<li><strong>AMS compatibility:</strong> Works with the Bambu AMS for multi-color/multi-material printing. Requires filaments with consistent diameter (±0.02mm) and smooth spool winding.</li>
<li><strong>Max speed:</strong> 500mm/s — benefits from high-speed filament formulations.</li>
</ul>`,
        position: 'before',
      },
      {
        heading: 'AMS Compatibility Notes',
        content: `<p>The Bambu AMS (Automatic Material System) is popular for multi-color printing, but not all filaments work well with it:</p>
<ul>
<li><strong>Works great:</strong> Standard PLA, PLA+, PETG from major brands (Bambu Lab, Polymaker, eSUN). Consistent diameter and smooth winding are key.</li>
<li><strong>Works with care:</strong> ABS and ASA work in the AMS but require drying. Moisture causes jams in the PTFE tube.</li>
<li><strong>Avoid in AMS:</strong> TPU (too flexible for the feeder), wood-fill/carbon-fill (abrasive, clogs), and filaments on cardboard spools (can snag).</li>
</ul>
<p>For best AMS reliability, use filaments on Bambu-style refill spools or confirmed-compatible master spools.</p>`,
        position: 'after',
      },
      {
        heading: 'Recommended Settings by Material',
        content: `<ul>
<li><strong>PLA on P1S:</strong> 220°C nozzle, 60°C bed, 50–100% fan. Use the "Generic PLA" Bambu Studio profile as a starting point.</li>
<li><strong>PETG on P1S:</strong> 240°C nozzle, 80°C bed, 30% fan. Enable the textured PEI plate for easy release.</li>
<li><strong>ABS on P1S:</strong> 250°C nozzle, 100°C bed, 0–20% fan. Close the enclosure and enable chamber heating.</li>
<li><strong>TPU on P1S:</strong> 220–230°C nozzle, 50°C bed, 50% fan. Print slowly (30–50mm/s). Do NOT use the AMS.</li>
</ul>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'What filament brands work best with Bambu Lab P1S?', answer: 'Bambu Lab\'s own filaments are optimized for the P1S, but Polymaker, eSUN, and Hatchbox also work excellently. The key is consistent ±0.02mm diameter tolerance and smooth spool winding for AMS compatibility.' },
      { question: 'Can the P1S print TPU?', answer: 'Yes, the P1S prints TPU well with its direct-drive extruder. However, do NOT use TPU in the AMS — it\'s too flexible for the feeder mechanism. Feed TPU directly from an external spool holder.' },
      { question: 'Do I need to dry filament for the P1S?', answer: 'PLA and PETG are relatively moisture-tolerant, but ABS, PA, and TPU should always be dried before printing. The enclosed chamber helps, but wet filament still causes stringing, bubbling, and poor surface quality.' },
    ],
    relatedSlugs: ['best-pla-filaments', 'best-petg-filaments', 'best-abs-filaments'],
  },

  'silk-pla-comparison': {
    slug: 'silk-pla-comparison',
    title: 'Best Silk PLA Filaments Compared',
    seoTitle: 'Best Silk PLA Filaments Compared (2026) | FilaScope',
    seoDescription: 'Top 10 silk PLA filaments ranked. Compare sheen quality, color options, print settings, and prices for the shiniest prints.',
    description: 'A ranked comparison of the best silk PLA filaments — the shiny, metallic-finish material that produces stunning decorative prints.',
    category: 'buying-guide',
    readTime: 11,
    publishedAt: '2026-02-14',
    updatedAt: '2026-02-14',
    keywords: ['silk PLA filament', 'best silk PLA', 'shiny filament', 'metallic PLA', 'silk 3D printing filament'],
    filters: { material: 'Silk PLA', sortBy: 'score', limit: 10 },
    layout: 'ranked-list',
    editorialSections: [
      {
        heading: 'What Makes Silk PLA Different?',
        content: `<p><strong>Silk PLA</strong> contains special additives that create a smooth, glossy surface finish with a metallic sheen. Unlike standard PLA's matte or semi-gloss appearance, silk PLA prints look like polished metal or satin fabric — making it the go-to choice for decorative prints, vases, figurines, and display models.</p>
<p>The "silk" effect comes from co-polyester additives blended into the PLA base. These additives alter the filament's flow behavior, creating the characteristic smooth, reflective surface. However, this comes with trade-offs:</p>
<ul>
<li><strong>Reduced strength:</strong> Silk PLA is typically 20–30% weaker than standard PLA due to the additives reducing layer adhesion.</li>
<li><strong>Temperature sensitivity:</strong> Prints best in a narrow temperature window (typically 210–230°C). Too hot = loss of sheen. Too cold = poor adhesion.</li>
<li><strong>Stringing:</strong> More prone to stringing than standard PLA. Fine-tune retraction settings.</li>
<li><strong>Not for functional parts:</strong> Best used for decorative items. Use standard PLA or PLA+ for mechanical parts.</li>
</ul>`,
        position: 'before',
      },
      {
        heading: 'Printing Tips for Silk PLA',
        content: `<ul>
<li><strong>Nozzle temperature:</strong> 210–230°C. Start at 215°C and increase in 5°C increments until you get the best sheen without stringing.</li>
<li><strong>Bed temperature:</strong> 55–65°C. Standard PLA bed settings work fine.</li>
<li><strong>Print speed:</strong> 40–60mm/s for best surface quality. Higher speeds can reduce the silk effect.</li>
<li><strong>Cooling:</strong> 80–100% fan. Good cooling locks in the glossy finish.</li>
<li><strong>Layer height:</strong> 0.15–0.20mm. Thinner layers enhance the silk sheen. Avoid thick 0.3mm layers.</li>
<li><strong>Retraction:</strong> Increase retraction distance by 1mm vs standard PLA to combat stringing.</li>
<li><strong>Vase mode:</strong> Silk PLA looks spectacular in vase/spiral mode prints. Single-wall vases showcase the sheen beautifully.</li>
</ul>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'Is silk PLA as strong as regular PLA?', answer: 'No. Silk PLA is typically 20–30% weaker than standard PLA due to the co-polyester additives that create the shiny finish. It\'s best used for decorative prints, vases, and display models rather than functional or mechanical parts.' },
      { question: 'What temperature should I print silk PLA at?', answer: '210–230°C nozzle temperature works for most silk PLA brands. Start at 215°C and adjust in 5°C increments. The optimal temperature produces maximum sheen without stringing.' },
      { question: 'Can I mix silk PLA with regular PLA in multi-color prints?', answer: 'Yes, silk and standard PLA are compatible in multi-color prints. They share similar temperature ranges. Mixing creates an interesting contrast between matte and glossy sections.' },
    ],
    relatedSlugs: ['best-pla-filaments', 'pla-vs-petg', 'pla-plus-vs-pla-pro'],
  },

  'asa-vs-abs-outdoor-printing': {
    slug: 'asa-vs-abs-outdoor-printing',
    title: 'ASA vs ABS: Which is Better for Outdoor Printing?',
    seoTitle: 'ASA vs ABS for Outdoor 3D Prints — Compared | FilaScope',
    seoDescription: 'ASA vs ABS for outdoor use: UV resistance, heat tolerance, print difficulty, and weathering compared. Find the best filament for outdoor parts.',
    description: 'A head-to-head comparison of ASA and ABS for outdoor 3D printing — covering UV resistance, weathering, print difficulty, and real-world durability.',
    category: 'comparison',
    readTime: 12,
    publishedAt: '2026-02-14',
    updatedAt: '2026-02-14',
    keywords: ['ASA vs ABS', 'outdoor filament', 'UV resistant filament', 'ASA filament', 'ABS outdoor', 'weatherproof 3D print'],
    filters: { materials: ['ASA', 'ABS'], sortBy: 'score', limit: 10 },
    layout: 'vs-comparison',
    vsMaterials: ['ASA', 'ABS'],
    editorialSections: [
      {
        heading: 'Why Outdoor Printing Demands Special Materials',
        content: `<p>Standard PLA and PETG degrade in outdoor environments. PLA warps above 60°C (easily reached in direct sunlight), while PETG yellows and becomes brittle with UV exposure over months. For parts that need to survive outdoors — garden fixtures, drone components, tool holders, enclosures — you need <strong>ASA or ABS</strong>.</p>
<p>Both materials offer high heat resistance and good mechanical properties, but they handle UV radiation very differently. This guide compares them side by side to help you choose the right material for your outdoor project.</p>`,
        position: 'before',
      },
      {
        heading: 'UV Resistance: ASA\'s Key Advantage',
        content: `<p><strong>ASA (Acrylonitrile Styrene Acrylate)</strong> was specifically engineered for outdoor use. It replaces the butadiene rubber in ABS with acrylic rubber, which is inherently UV-stable. The result:</p>
<ul>
<li><strong>ASA:</strong> Minimal color fading or surface degradation after 12+ months of direct sun exposure. Industry tests show less than 5% yellowing index change after 2,000 hours of UV exposure.</li>
<li><strong>ABS:</strong> Noticeable yellowing within 3–6 months of outdoor exposure. Surface becomes chalky and brittle. Structural integrity degrades over time.</li>
</ul>
<p><strong>Verdict:</strong> For any part spending significant time outdoors, ASA is the clear winner for UV resistance.</p>`,
        position: 'after',
      },
      {
        heading: 'Print Difficulty & Settings Compared',
        content: `<p>Both ASA and ABS require similar print conditions, but there are differences:</p>
<ul>
<li><strong>Enclosure:</strong> Both <em>require</em> an enclosure. ASA is slightly more tolerant of temperature variation but still warps without one.</li>
<li><strong>Nozzle temp:</strong> ABS 230–260°C / ASA 240–270°C. ASA typically needs 5–10°C hotter.</li>
<li><strong>Bed temp:</strong> ABS 90–110°C / ASA 90–110°C. Similar requirements.</li>
<li><strong>Fumes:</strong> Both emit fumes — ABS produces styrene, ASA produces similar compounds. Ventilation or carbon filtration is essential for both.</li>
<li><strong>Post-processing:</strong> ABS can be acetone-smoothed for a glossy finish. ASA does <em>not</em> dissolve in acetone as easily — use MEK or ethyl acetate for ASA smoothing.</li>
<li><strong>Warping:</strong> Both warp, but ASA tends to warp slightly less due to its modified polymer structure.</li>
</ul>`,
        position: 'after',
      },
    ],
    faqs: [
      { question: 'Is ASA better than ABS for outdoor use?', answer: 'Yes. ASA\'s acrylic rubber base makes it significantly more UV-resistant than ABS. ABS yellows and becomes brittle in sunlight within months, while ASA maintains its color and strength for years of outdoor exposure.' },
      { question: 'Can I use ABS outdoors if I paint it?', answer: 'Painting ABS with UV-resistant paint can extend its outdoor life, but the paint will eventually chip or peel, exposing the ABS underneath. For long-term outdoor use, ASA is the better material choice even if you plan to paint.' },
      { question: 'Is ASA harder to print than ABS?', answer: 'Slightly. ASA requires 5–10°C higher nozzle temperatures and is a bit more sensitive to draft-induced warping. Both need an enclosure and ventilation. If you can print ABS successfully, ASA should not be a major challenge.' },
    ],
    relatedSlugs: ['best-abs-filaments', 'best-petg-filaments', 'best-filament-for-bambu-lab-p1s'],
  },
};

export const BUYING_GUIDE_SLUGS = Object.keys(BUYING_GUIDE_CONFIGS);

export function getBuyingGuideConfig(slug: string): GuideConfig | undefined {
  return BUYING_GUIDE_CONFIGS[slug];
}
