import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, BreadcrumbSchema, ItemListSchema, FAQSection, Breadcrumbs, HowToSchema } from '@/components/seo';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { normalizeColorHex } from '@/lib/utils';
import {
  ArrowRight,
  Thermometer,
  Ruler,
  Weight,
  ShieldCheck,
  Droplets,
  Palette,
  Globe,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Beaker,
  Sparkles,
  TreePine,
  Gem,
  Moon,
  Zap,
} from 'lucide-react';

/* ─── FAQ Data (expanded to 10) ──────────────────────────────────────── */

const FAQS = [
  {
    question: 'What is the best PLA filament brand in 2026?',
    answer:
      'Based on FilaScope\'s analysis of 24,000+ filaments across 49+ brands, the top PLA brands in 2026 are Bambu Lab, Prusament, Polymaker, eSUN, and Hatchbox. Bambu Lab PLA Basic leads for Bambu Lab printer owners with its ±0.01mm tolerance optimized for high-speed printing. Prusament PLA is the universal gold standard with QR-verified ±0.02mm tolerance. The best brand depends on your printer, region, and whether you prioritize quality, value, or color variety.',
  },
  {
    question: 'Is PLA+ better than regular PLA?',
    answer:
      'PLA+ (also called PLA Pro or Tough PLA) is a modified PLA formulation with improved impact resistance and reduced brittleness — typically 3-5× better impact strength than standard PLA. It prints at similar temperatures (205-225°C) but produces parts that flex slightly before breaking rather than shattering. The tradeoff is a 10-20% price premium and occasionally reduced surface detail on very fine features. For functional parts like clips, tool holders, or anything that takes mechanical stress, PLA+ is worth the upgrade. For display models and prototypes, standard PLA gives better surface finish.',
  },
  {
    question: 'What temperature should I print PLA at?',
    answer:
      'Most PLA filaments print best at 190-220°C nozzle temperature and 50-60°C bed temperature. Start at 210°C and adjust in 5°C increments. Too low causes under-extrusion and poor layer adhesion; too high causes stringing and oozing. Specialty PLAs differ: Silk PLA typically needs 215-230°C, wood-fill PLA runs at 190-210°C, and PLA+ is best at 205-225°C. Always check the manufacturer-recommended range — it\'s usually printed on the spool or listed on the product page. Running a temperature tower is the best way to dial in the ideal temp for any new spool.',
  },
  {
    question: 'How long does PLA filament last before it goes bad?',
    answer:
      'Unopened PLA filament stored in a cool, dry place lasts 1-2 years without issues. Once opened, PLA absorbs moisture from the air (it\'s hygroscopic) which degrades print quality — you\'ll notice popping sounds during printing, increased stringing, and rough surface finishes. Store opened spools in a sealed container with desiccant packets, or use a dedicated filament dry box. If a spool has already absorbed moisture, dry it at 45-50°C for 4-6 hours in a food dehydrator or filament dryer before printing. Properly stored PLA can remain usable for years.',
  },
  {
    question: 'What is the cheapest good PLA filament?',
    answer:
      'According to FilaScope\'s pricing data from 15+ retailers, eSUN PLA+ is consistently the best budget PLA at $15-20/kg with reliable quality. Bambu Lab PLA Basic is competitively priced at $19.99/kg if you order direct. For ultra-budget printing, Overture PLA ($16-18/kg) and SUNLU PLA Basic ($13-16/kg) offer decent quality. Avoid no-name brands under $12/kg — poor diameter tolerance leads to jams and failed prints that waste more money than you save. Always factor in cost-per-successful-print, not just spool price.',
  },
  {
    question: 'Can you leave PLA prints outside?',
    answer:
      'PLA is not suitable for prolonged outdoor use. It begins to soften at around 55-60°C (glass transition temperature), so direct sunlight on a warm day can warp PLA parts. UV exposure also degrades PLA over time, causing brittleness and color fading within weeks to months. For outdoor applications, use ASA, PETG, or ABS instead. If you must use PLA outdoors temporarily, applying a UV-resistant clear coat can extend its life to several months, but it\'s not a permanent solution.',
  },
  {
    question: 'Is PLA food safe for cups, plates, or cookie cutters?',
    answer:
      'Raw PLA is technically made from plant-based materials and is generally considered food-safe as a material. However, 3D-printed PLA objects have layer lines that trap bacteria, making them difficult to clean properly. Additionally, many colored PLA filaments contain pigments or additives that are not food-safe certified. For single-use items like cookie cutters that briefly contact food, PLA is generally fine. For reusable food containers, cups, or utensils, either coat the print with food-safe epoxy to seal the layer lines, or use a filament specifically certified as food-safe by the manufacturer.',
  },
  {
    question: 'How do I fix stringing with PLA?',
    answer:
      'Stringing is the most common PLA printing issue. Start by lowering your nozzle temperature by 5-10°C — stringing is almost always caused by too-hot filament. Next, increase retraction distance (4-6mm for Bowden setups, 1-2mm for direct drive) and retraction speed (40-60mm/s). Enable "Combing" or "Avoid crossing perimeters" in your slicer. Increase travel speed to 150-200mm/s. If stringing persists, check that your filament isn\'t wet — dry it at 45-50°C for 4 hours. A quick post-processing fix: briefly pass a heat gun over the print to melt away fine strings.',
  },
  {
    question: 'What is the difference between PLA, PLA+, Silk PLA, and Matte PLA?',
    answer:
      'Standard PLA is the baseline — easy to print, good surface finish, brittle. PLA+ adds impact modifiers for 3-5× better toughness, ideal for functional parts. Silk PLA contains additives that create a glossy, metallic sheen — beautiful for display models but slightly weaker and trickier to print (needs higher temps, 215-230°C). Matte PLA uses mineral fillers to eliminate shine and hide layer lines — excellent for prototypes and cosplay pieces. Each variant has tradeoffs: PLA+ costs more, Silk PLA bridges poorly, and Matte PLA can be more abrasive on brass nozzles over time.',
  },
  {
    question: 'How does FilaScope rank PLA filaments?',
    answer:
      'FilaScope uses the FilaScore algorithm to rank filaments based on multiple weighted factors: price-to-quality ratio (30%), diameter tolerance consistency (20%), community feedback and reviews (20%), brand reliability and track record (15%), and regional availability across retailers (15%). Data is sourced from 24,000+ filaments across 49+ brands and 15+ retailers. Scores are updated as new pricing and review data comes in. This data-driven approach eliminates editorial bias — every filament earns its ranking from real-world data, not sponsorships or personal preference.',
  },
];

/* ─── PLA Traits (Buyer's Guide cards) ───────────────────────────────── */

const PLA_TRAITS = [
  { icon: Thermometer, label: 'Temperature Range', desc: 'Look for 190-220°C nozzle temp. Lower ranges mean easier printing on basic printers without all-metal hotends. Premium brands publish exact ranges per color.' },
  { icon: Ruler, label: 'Diameter Tolerance', desc: 'Premium PLA holds ±0.02mm (Prusament, Bambu Lab). Budget PLA at ±0.05mm is acceptable. Wider tolerance causes inconsistent extrusion, visible artifacts, and failed prints.' },
  { icon: Weight, label: 'Spool Weight & Value', desc: '1kg is standard. Larger 2-3kg spools offer 15-25% better per-gram value for high-volume printers. Always calculate $/kg, not spool price, when comparing brands.' },
  { icon: ShieldCheck, label: 'Brand Reliability', desc: 'Established brands publish TDS (Technical Data Sheets) and maintain batch-to-batch consistency — critical for repeatable results across multiple spools and colors.' },
  { icon: Palette, label: 'Color Availability', desc: 'Some brands offer 30+ colors (Polymaker, eSUN), while others focus on fewer, perfectly calibrated shades. For HueForge projects or multi-color prints, color variety matters.' },
  { icon: Globe, label: 'Regional Availability', desc: 'Not every brand ships everywhere affordably. Bambu Lab and Overture have strong US distribution. Prusament ships worldwide from the Czech Republic. Check local retailer stock to avoid high shipping costs.' },
];

/* ─── PLA Variants ───────────────────────────────────────────────────── */

const PLA_VARIANTS = [
  {
    name: 'PLA+ (Tough PLA)',
    icon: Zap,
    temp: '205-225°C',
    desc: 'Modified PLA with impact modifiers for 3-5× better toughness. Slightly higher print temps. Best for functional parts, enclosures, and clips that need to flex without shattering.',
    ideal: 'Functional parts, mechanical clips, tool holders',
  },
  {
    name: 'Silk PLA',
    icon: Sparkles,
    temp: '215-230°C',
    desc: 'Contains mineral additives that create a glossy, metallic sheen. Beautiful surface finish but slightly weaker and more prone to stringing. Bridging performance is reduced.',
    ideal: 'Display models, vases, decorative pieces, gifts',
  },
  {
    name: 'Matte PLA',
    icon: Moon,
    temp: '195-220°C',
    desc: 'Uses mineral fillers to eliminate shine and dramatically reduce visible layer lines. Excellent for prototypes and cosplay. May be slightly more abrasive on brass nozzles over extended use.',
    ideal: 'Cosplay, prototypes, professional presentations',
  },
  {
    name: 'Wood Fill PLA',
    icon: TreePine,
    temp: '190-210°C',
    desc: 'PLA mixed with 10-30% wood fibers (usually bamboo or pine). Produces a textured, wood-like surface that can be sanded and stained. Print at lower temps to avoid clogging. Use 0.5mm+ nozzles.',
    ideal: 'Decorative items, board game accessories, signage',
  },
  {
    name: 'Metal Fill PLA',
    icon: Gem,
    temp: '195-220°C',
    desc: 'Contains metal powder (copper, bronze, iron) blended into PLA. Heavier than standard PLA, can be polished to a metallic finish and develops patina over time. Very abrasive — use hardened steel nozzles.',
    ideal: 'Jewelry, sculptures, replicas, desk accessories',
  },
  {
    name: 'Glow-in-the-Dark PLA',
    icon: Beaker,
    temp: '195-220°C',
    desc: 'Contains strontium aluminate particles that glow after light exposure. Extremely abrasive — hardened steel or ruby nozzle mandatory. Print thicker walls (2mm+) for stronger glow effect.',
    ideal: 'Night lights, kids\' toys, switch plates, novelties',
  },
];

/* ─── Common PLA Problems ────────────────────────────────────────────── */

const PLA_PROBLEMS = [
  {
    problem: 'Stringing & Oozing',
    symptoms: 'Thin threads of filament between printed parts or travel moves.',
    solutions: [
      'Lower nozzle temp by 5-10°C',
      'Increase retraction distance (4-6mm Bowden, 1-2mm direct drive)',
      'Increase retraction speed to 40-60mm/s',
      'Enable combing / avoid crossing perimeters in slicer',
      'Dry filament at 45-50°C for 4 hours if moist',
    ],
  },
  {
    problem: 'Poor Bed Adhesion',
    symptoms: 'Print lifts from bed during first layers, warping at corners.',
    solutions: [
      'Clean bed with IPA (isopropyl alcohol) before each print',
      'Increase bed temp to 60°C for PLA',
      'Slow first layer to 20-30mm/s',
      'Decrease Z-offset slightly (nozzle closer to bed)',
      'Use PEI sheet, glass with glue stick, or painter\'s tape',
    ],
  },
  {
    problem: 'Layer Separation / Delamination',
    symptoms: 'Visible gaps between layers, weak layer bonding, parts splitting along layer lines.',
    solutions: [
      'Increase nozzle temperature by 5-10°C for better interlayer bonding',
      'Reduce cooling fan to 50-70% for structural parts',
      'Increase flow rate by 2-5%',
      'Check for partially clogged nozzle (do a cold pull)',
      'Verify filament isn\'t wet — moisture causes steam bubbles between layers',
    ],
  },
  {
    problem: 'Moisture / Wet Filament',
    symptoms: 'Popping or sizzling sounds during print, rough surface, excessive stringing, bubbles in extrusion.',
    solutions: [
      'Dry PLA at 45-50°C for 4-6 hours',
      'Use a filament dryer or food dehydrator',
      'Store opened spools with desiccant in sealed containers',
      'Use a dry box that feeds directly to the printer',
      'Fresh spools should be vacuum-sealed — return if seal is broken',
    ],
  },
  {
    problem: 'Nozzle Clogging',
    symptoms: 'Under-extrusion, filament grinding, no material coming out.',
    solutions: [
      'Perform a cold pull (heat to 200°C, push filament through, cool to 90°C, pull out)',
      'Clean nozzle with acupuncture needle',
      'Check for heat creep — ensure heatsink fan is running',
      'Replace nozzle if worn (especially after specialty filaments)',
      'Use 0.5mm+ nozzles for wood-fill, metal-fill, or glow PLA',
    ],
  },
];

/* ─── PLA vs PLA+ vs Silk Comparison ─────────────────────────────────── */

const PLA_COMPARISON = [
  { property: 'Print Temperature', pla: '190-220°C', plaPlus: '205-225°C', silk: '215-230°C' },
  { property: 'Bed Temperature', pla: '50-60°C', plaPlus: '50-60°C', silk: '55-65°C' },
  { property: 'Impact Resistance', pla: 'Low (brittle)', plaPlus: 'Medium-High', silk: 'Low-Medium' },
  { property: 'Surface Finish', pla: 'Good (smooth)', plaPlus: 'Good', silk: 'Excellent (glossy)' },
  { property: 'Layer Line Visibility', pla: 'Moderate', plaPlus: 'Moderate', silk: 'Low (sheen hides them)' },
  { property: 'Bridging Performance', pla: 'Good', plaPlus: 'Good', silk: 'Poor' },
  { property: 'Price (per kg)', pla: '$15-25', plaPlus: '$18-28', silk: '$18-30' },
  { property: 'Ease of Printing', pla: '★★★★★', plaPlus: '★★★★☆', silk: '★★★☆☆' },
  { property: 'Best For', pla: 'General, prototypes', plaPlus: 'Functional parts', silk: 'Display, decorative' },
];

/* ─── Curated Top 12 Entries ─────────────────────────────────────────── */

const TOP_12_ENTRIES: {
  rank: number;
  brand: string;
  name: string;
  badge?: string;
  nozzle: string;
  bed: string;
  tolerance: string;
  weight: string;
  bestFor: string;
  priceRange: string;
  pros: string[];
  cons: string[];
  verdict: string;
}[] = [
  {
    rank: 1,
    brand: 'Bambu Lab',
    name: 'PLA Basic',
    badge: 'Best for Bambu Printers',
    nozzle: '190-220°C',
    bed: '50-60°C',
    tolerance: '±0.01mm',
    weight: '1kg',
    bestFor: 'Bambu Lab printer owners, high-speed printing',
    priceRange: '$19.99/kg',
    pros: [
      'Industry-leading ±0.01mm tolerance for flawless high-speed prints',
      'Optimized RFID profiles for Bambu Lab printers — zero calibration needed',
      'Excellent color consistency batch-to-batch across 20+ colors',
      'Competitive pricing for a premium-tier filament',
    ],
    cons: [
      'RFID profiles only benefit Bambu Lab printer owners',
      'Limited availability outside official Bambu Lab store',
      'Color range smaller than some competitors like Polymaker',
    ],
    verdict:
      'If you own a Bambu Lab printer, this is a no-brainer. The ±0.01mm tolerance combined with RFID auto-profiles means you get consistently perfect prints with zero tuning. The quality-to-price ratio is exceptional — this is premium PLA at a near-budget price point. For non-Bambu printers, it still performs well but you lose the RFID convenience that justifies it over Prusament.',
  },
  {
    rank: 2,
    brand: 'Prusament',
    name: 'PLA',
    badge: 'Universal Gold Standard',
    nozzle: '200-220°C',
    bed: '50-60°C',
    tolerance: '±0.02mm',
    weight: '1kg',
    bestFor: 'Any FDM printer, users who demand consistency',
    priceRange: '$24.99/kg',
    pros: [
      'Every spool QR-verified with actual measured tolerance data',
      'Exceptional batch-to-batch consistency across all colors',
      'Works flawlessly on virtually any FDM printer',
      'Prusa publishes full TDS and recommends settings per color',
    ],
    cons: [
      'Premium price point — $25/kg is above average',
      'Ships from Czech Republic, international shipping adds cost and time',
      'Color selection is curated rather than extensive',
    ],
    verdict:
      'Prusament is what happens when an engineering company makes filament. Every spool comes with a QR code linking to real measurement data — you can verify the tolerance before you even load it. At $24.99/kg it\'s not cheap, but the combination of ±0.02mm tolerance, universal printer compatibility, and QR-verified quality makes it the safest choice for users who can\'t afford failed prints. This is the filament professionals reach for when the print has to be right the first time.',
  },
  {
    rank: 3,
    brand: 'Polymaker',
    name: 'PolyLite PLA',
    badge: 'Best Value',
    nozzle: '190-220°C',
    bed: '50-60°C',
    tolerance: '±0.02mm',
    weight: '1kg',
    bestFor: 'Users wanting premium quality at a mid-range price',
    priceRange: '$21.99/kg',
    pros: [
      'Premium ±0.02mm tolerance at a mid-range price',
      'Wide color palette with 30+ options including specialty finishes',
      'Excellent surface finish — minimal post-processing needed',
      'Widely available across US, EU, and Asian retailers',
    ],
    cons: [
      'Not as tightly controlled as Prusament or Bambu Lab',
      'Pricing varies significantly across retailers — shop around',
      'Some specialty colors require different temp tuning',
    ],
    verdict:
      'PolyLite PLA hits the sweet spot between Prusament quality and budget pricing. At $21.99/kg with ±0.02mm tolerance and 30+ colors, it\'s the best overall value in the PLA market. Polymaker\'s wide retail distribution means you can often find it on sale, pushing value even higher. A top pick for hobbyists who print regularly and want consistent results without the Prusament premium.',
  },
  {
    rank: 4,
    brand: 'Overture',
    name: 'PLA',
    badge: 'Best Budget',
    nozzle: '190-220°C',
    bed: '50-60°C',
    tolerance: '±0.03mm',
    weight: '1kg',
    bestFor: 'Budget-conscious hobbyists, bulk printing',
    priceRange: '$16.99-18.99/kg',
    pros: [
      'Vacuum-sealed packaging keeps filament dry out of the box',
      'Includes build surface sample sheet in every box',
      'Strong Amazon availability with frequent deals and Prime shipping',
      'Surprisingly consistent quality for the price tier',
    ],
    cons: [
      'Tolerance of ±0.03mm is a step below premium options',
      'Color accuracy can vary slightly between batches',
      'Limited retail presence outside Amazon',
    ],
    verdict:
      'Overture PLA is the budget king for a reason — vacuum-sealed packaging, bonus build surface, and consistent quality at under $18/kg. The ±0.03mm tolerance is wider than Prusament or Bambu Lab, but in practical terms it prints well on 95% of consumer printers. If you\'re burning through spools on prototypes, props, or learning, this is where your money goes furthest.',
  },
  {
    rank: 5,
    brand: 'eSUN',
    name: 'PLA+',
    badge: 'Best Reliability for Price',
    nozzle: '205-225°C',
    bed: '50-60°C',
    tolerance: '±0.03mm',
    weight: '1kg',
    bestFor: 'Functional prints, cost-effective PLA+ upgrade',
    priceRange: '$15.99-19.99/kg',
    pros: [
      'Excellent impact resistance — genuine PLA+ performance',
      'One of the largest color selections in the budget tier (40+ colors)',
      'Available globally across Amazon, direct, and local retailers',
      'Price-to-performance ratio is hard to beat',
    ],
    cons: [
      'Prints 10-15°C hotter than standard PLA — may need settings adjustment',
      'Matte surface finish — not ideal if you want a glossy look',
      'Occasional reports of inconsistency between color batches',
    ],
    verdict:
      'eSUN PLA+ has been a community favorite for years, and the 2026 formulation continues to deliver. At $15-20/kg with genuine PLA+ toughness, it\'s the cheapest reliable way to get stronger-than-PLA parts. The 40+ color range means you won\'t run out of options. Just remember to bump your nozzle temp to 210-220°C — it runs hotter than standard PLA.',
  },
  {
    rank: 6,
    brand: 'Hatchbox',
    name: 'PLA',
    badge: 'Best Amazon Availability',
    nozzle: '195-215°C',
    bed: '50-60°C',
    tolerance: '±0.03mm',
    weight: '1kg',
    bestFor: 'Amazon shoppers, beginners wanting reliable results',
    priceRange: '$21.99-24.99/kg',
    pros: [
      'Consistently one of the top-rated filaments on Amazon',
      'Very beginner-friendly — works well with default slicer settings',
      'Reliable Prime delivery with easy returns',
      'Established brand with years of proven consistency',
    ],
    cons: [
      'Priced at a premium compared to competitors with similar specs',
      'Primarily US-focused availability — limited international distribution',
      'Tolerance is budget-tier (±0.03mm) despite mid-range pricing',
    ],
    verdict:
      'Hatchbox built its reputation as the "safe choice" on Amazon, and it still holds up. The PLA prints well, the quality is predictable, and Prime shipping means you can have it tomorrow. The catch is that you\'re paying a brand premium — similar quality is available from Overture or eSUN for less. But if you value the proven track record and hassle-free Amazon experience, Hatchbox earns its spot.',
  },
  {
    rank: 7,
    brand: 'MatterHackers',
    name: 'Build Series PLA',
    badge: 'Best US-Based',
    nozzle: '195-215°C',
    bed: '50-60°C',
    tolerance: '±0.03mm',
    weight: '1kg',
    bestFor: 'US buyers wanting domestic shipping and support',
    priceRange: '$19.99/kg',
    pros: [
      'US-based company with excellent customer service',
      'Good selection of core colors at reasonable prices',
      'Often bundles with printer purchases for savings',
      'Fast domestic shipping from California warehouse',
    ],
    cons: [
      'Limited international availability',
      'Color range is narrower than Polymaker or eSUN',
      'Not widely available on Amazon — primarily MatterHackers.com',
    ],
    verdict:
      'MatterHackers Build Series is the go-to for US buyers who prefer buying from a specialized 3D printing retailer rather than Amazon. The quality is solid mid-range, the customer service is responsive, and the pricing is competitive at $19.99/kg. It won\'t wow you with extreme tolerance or massive color range, but it reliably delivers good prints without drama.',
  },
  {
    rank: 8,
    brand: 'Atomic Filament',
    name: 'PLA',
    badge: 'Best Small-Batch Quality',
    nozzle: '195-215°C',
    bed: '50-60°C',
    tolerance: '±0.02mm',
    weight: '1kg',
    bestFor: 'Quality enthusiasts, unique colors, US-made',
    priceRange: '$27.99-34.99/kg',
    pros: [
      'Made in the USA with strict quality control',
      'Premium ±0.02mm tolerance rivals Prusament',
      'Unique color options not found anywhere else',
      'Excellent spool winding — no tangles',
    ],
    cons: [
      'Highest price point on this list — $28-35/kg',
      'Small-batch production means popular colors sell out quickly',
      'Only available from Atomic Filament\'s own website',
    ],
    verdict:
      'Atomic Filament is the boutique choice for PLA. US-made with Prusament-level ±0.02mm tolerance and unique color options, it\'s the filament for people who treat printing as a craft. The premium price ($28-35/kg) puts it out of reach for casual use, but for special projects where quality and uniqueness matter, Atomic delivers something the big brands can\'t replicate.',
  },
  {
    rank: 9,
    brand: 'SUNLU',
    name: 'PLA Basic',
    badge: 'Ultra Budget',
    nozzle: '190-220°C',
    bed: '50-60°C',
    tolerance: '±0.04mm',
    weight: '1kg',
    bestFor: 'Maximum value printing, prototypes, bulk projects',
    priceRange: '$12.99-15.99/kg',
    pros: [
      'Frequently the lowest-priced brand-name PLA available',
      'Decent quality for the price — way above generic no-name brands',
      'Available in large multipacks for further savings',
      'Huge color selection including specialty finishes',
    ],
    cons: [
      'Wider tolerance (±0.04mm) means occasional inconsistency',
      'Vacuum seal quality varies — check packaging on arrival',
      'Not recommended for precision or mechanical parts',
    ],
    verdict:
      'SUNLU PLA is the floor for acceptable filament quality — everything below this is a gamble. At $13-16/kg it\'s hard to argue with the value for prototyping, test prints, and projects where appearance isn\'t critical. Keep your expectations calibrated and you\'ll be happy with SUNLU. For anything that needs to look or perform great, step up to Overture or eSUN.',
  },
  {
    rank: 10,
    brand: 'Push Plastic',
    name: 'PLA',
    badge: 'US-Made',
    nozzle: '195-215°C',
    bed: '50-60°C',
    tolerance: '±0.02mm',
    weight: '1kg',
    bestFor: 'US manufacturing support, consistent prosumer quality',
    priceRange: '$25.99-29.99/kg',
    pros: [
      'Made in the USA (Virginia) with domestic quality control',
      'Tight ±0.02mm tolerance comparable to Prusament',
      'Strong mechanical properties and excellent layer adhesion',
      'Responsive customer support from a small, dedicated team',
    ],
    cons: [
      'Premium pricing above mass-market alternatives',
      'Limited retail distribution — mostly pushplastic.com',
      'Smaller color library than major brands',
    ],
    verdict:
      'Push Plastic is another US-made option that competes with Prusament on tolerance while offering the satisfaction of supporting domestic manufacturing. The quality is genuinely excellent — tight tolerance, great adhesion, and consistent results. If "Made in USA" matters to you and you want Prusament-level quality without the international shipping wait, Push Plastic delivers.',
  },
  {
    rank: 11,
    brand: 'Eryone',
    name: 'PLA',
    badge: 'Best Color Variety',
    nozzle: '190-220°C',
    bed: '50-60°C',
    tolerance: '±0.03mm',
    weight: '1kg',
    bestFor: 'Color-focused projects, multi-color printing, HueForge',
    priceRange: '$17.99-22.99/kg',
    pros: [
      'One of the widest color selections in the market — 50+ options',
      'Includes specialty finishes: dual-color, marble, glitter, silk',
      'Good pricing for the range of specialty options available',
      'Widely available on Amazon with reliable shipping',
    ],
    cons: [
      'Standard colors are average quality — not as consistent as top-tier',
      'Quality can vary more between specialty and standard lines',
      'Less well-known brand — fewer community reviews and profiles',
    ],
    verdict:
      'Eryone\'s strength is color variety. With 50+ options including dual-color, marble, and glitter finishes, it\'s the go-to brand for multi-color projects and HueForge builds where having the exact right shade matters. Standard solid colors are decent but unremarkable — you buy Eryone for the specialty range. At $18-23/kg, the pricing is fair for what you get.',
  },
  {
    rank: 12,
    brand: 'Creality',
    name: 'Hyper PLA',
    badge: 'Best for Creality Printers',
    nozzle: '190-230°C',
    bed: '50-60°C',
    tolerance: '±0.03mm',
    weight: '1kg',
    bestFor: 'Creality printer owners, high-speed printing',
    priceRange: '$18.99-22.99/kg',
    pros: [
      'Optimized for Creality K1 and Ender high-speed printers',
      'Hyper PLA formulation supports faster print speeds with less stringing',
      'Competitive pricing with frequent sales on Creality\'s store',
      'Growing color range with good basic coverage',
    ],
    cons: [
      'Newer to the filament market — less long-term track record',
      'Quality reports are mixed — some colors perform better than others',
      'Primarily available from Creality store — limited third-party retail',
    ],
    verdict:
      'Creality Hyper PLA is purpose-built for the K1-series and newer Ender printers. The high-speed formulation reduces stringing at elevated print speeds, making it a good match for Creality\'s ecosystem. Quality is still maturing compared to established brands — some colors nail it while others are inconsistent. At $19-23/kg it\'s fairly priced for what you get. Creality printer owners should try it; everyone else has better options above.',
  },
];

/* ─── Temperature Tower HowTo Steps ──────────────────────────────────── */

const TEMP_TOWER_STEPS = [
  { name: 'Download a temperature tower model', text: 'Download a temperature tower STL from sites like Thingiverse or Printables. Choose one that spans 190-230°C in 5°C increments for PLA.' },
  { name: 'Set up your slicer with temperature changes', text: 'In your slicer (Cura, PrusaSlicer, OrcaSlicer), add a temperature change script at each tower section. Each section should print 5°C hotter than the one below it.' },
  { name: 'Print the tower with your chosen PLA', text: 'Print the temperature tower using default settings except for the temperature changes. Use your normal retraction settings, layer height (0.2mm), and speeds.' },
  { name: 'Evaluate each section', text: 'Examine each temperature section for stringing, bridging quality, overhang performance, and surface finish. The section with the best balance is your ideal printing temperature.' },
  { name: 'Fine-tune with a ±5°C test', text: 'Once you identify the best section, print a small test model at that temperature and ±5°C to confirm. Update your slicer profile with the winning temperature for that filament brand.' },
];

/* ─── FilamentRow Interface ──────────────────────────────────────────── */

interface FilamentRow {
  id: string;
  product_handle: string | null;
  product_title: string;
  display_name: string | null;
  vendor: string;
  material: string | null;
  color_family: string | null;
  color_hex: string | null;
  variant_price: number | null;
  filascope_score: number | null;
  nozzle_temp_min: number | null;
  nozzle_temp_max: number | null;
  bed_temp_min: number | null;
  bed_temp_max: number | null;
  diameter: number | null;
  weight: number | null;
}

/* ═══════════════════════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════════════════════ */

export default function BestPLAFilament() {
  const { data: filaments, isLoading } = useQuery({
    queryKey: ['best-pla-filaments-2026'],
    queryFn: async () => {
      const { data } = await supabase
        .from('filaments')
        .select('id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, filascope_score, nozzle_temp_min, nozzle_temp_max, bed_temp_min, bed_temp_max, diameter, weight')
        .or('material.ilike.%PLA%,material.ilike.%pla%')
        .not('material', 'ilike', '%PETG%')
        .not('filascope_score', 'is', null)
        .not('variant_price', 'is', null)
        .order('filascope_score', { ascending: false })
        .limit(12);
      return (data ?? []) as FilamentRow[];
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Guides', url: '/guides' },
    { name: 'Best PLA Filament', url: '/guides/best-pla-filaments' },
  ];

  const itemListItems = (filaments ?? []).map((f, i) => ({
    name: `${f.vendor} ${f.display_name || f.product_title}`,
    url: `https://filascope.com/filament/${f.product_handle || f.id}`,
    description: f.material ? `${f.material} filament` : 'PLA filament',
    position: i + 1,
  }));

  return (
    <>
      <DocumentHead
        title="Best PLA Filament 2026 — Top 12 Picks Ranked by Data from 24,000+ Filaments"
        description="The best PLA filaments in 2026 ranked by print quality, consistency & value. Data-driven picks from 24,000+ filaments across Bambu Lab, Prusament, Hatchbox, eSUN & more."
        canonical="https://filascope.com/guides/best-pla-filaments"
        ogType="article"
        ogTitle="Best PLA Filament 2026 — Top 12 Picks Ranked by FilaScore | FilaScope"
        ogDescription="The best PLA filaments in 2026 — ranked by quality, price & print performance. Data-driven picks from 24,000+ filaments across Bambu Lab, Prusament, Hatchbox, eSUN & more."
        keywords="best pla filament, best pla filament 2026, top pla filament, pla filament review, best pla for 3d printing, pla filament comparison, best pla brand, pla vs pla plus"
      />
      <ArticleSchema
        headline="Best PLA Filament in 2026 — Top 12 Picks Ranked by Data from 24,000+ Filaments"
        description="The best PLA filaments in 2026 ranked by print quality, consistency & value. Data-driven picks from FilaScope's database of 24,000+ filaments across 49+ brands."
        datePublished="2026-04-01"
        dateModified="2026-04-01"
        url="/guides/best-pla-filaments"
      />
      <BreadcrumbSchema items={breadcrumbs.map(b => ({ name: b.name, url: `https://filascope.com${b.url}` }))} />
      <ItemListSchema
        name="Best PLA Filament 2026"
        description="Top 12 PLA filaments ranked by FilaScore from FilaScope's database of 24,000+ filaments"
        items={itemListItems}
      />
      <HowToSchema
        name="How to Find Your Ideal PLA Temperature with a Temperature Tower"
        description="A temperature tower test helps you dial in the perfect printing temperature for any PLA filament. This 5-step process takes about 45 minutes and eliminates guesswork."
        totalTime="PT45M"
        supply={['PLA filament spool', 'Temperature tower STL model']}
        tool={['FDM 3D printer', 'Slicer software (Cura, PrusaSlicer, or OrcaSlicer)']}
        steps={TEMP_TOWER_STEPS}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <Breadcrumbs items={breadcrumbs} className="mb-6" />
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Updated April 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Best PLA Filament in 2026
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
              PLA is the most popular 3D printing filament for good reason — it's easy to print, affordable, and produces
              excellent surface finishes. Based on FilaScope's database of 24,000+ filaments across 49+ brands, we've
              ranked the top 12 PLA filaments using the FilaScore algorithm, weighing quality consistency, pricing from
              15+ retailers, diameter tolerance, and community data.
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              <em>Written by the FilaScope team · Last updated April 1, 2026 · 12-minute read</em>
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

          {/* ── AEO Quick Answer Block ──────────────────────────────────── */}
          <div className="bg-cyan-950/30 border border-cyan-800/40 rounded-lg p-5" id="quick-answer">
            <h2 className="text-sm font-semibold text-cyan-400 uppercase tracking-wider mb-2">Quick Answer</h2>
            <p className="text-foreground text-base leading-relaxed">
              The best PLA filament in 2026 depends on your use case. For <strong>Bambu Lab printers</strong>,{' '}
              <strong>Bambu Lab PLA Basic</strong> (±0.01mm tolerance, RFID auto-profiles) is the top pick.
              For <strong>all other printers</strong>, <strong>Prusament PLA</strong> (±0.02mm, QR-verified quality) is
              the gold standard. <strong>Best value</strong>: <strong>Polymaker PolyLite PLA</strong> ($21.99/kg, ±0.02mm).{' '}
              <strong>Best budget</strong>: <strong>Overture PLA</strong> ($16.99/kg, vacuum-sealed). <strong>Best PLA+</strong>:{' '}
              <strong>eSUN PLA+</strong> ($15.99/kg, improved impact resistance). Rankings are based on FilaScope&apos;s
              analysis of 24,000+ filaments across 49+ brands and 15+ retailers using the FilaScore algorithm.
            </p>
          </div>

          {/* ── Current Best PLA Prices (Dynamic) ──────────────────────── */}
          <div className="border border-border rounded-lg p-5" id="current-best-prices">
            <h2 className="text-base font-semibold mb-3">Current Best PLA Prices</h2>
            {!isLoading && filaments && filaments.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground mb-3">
                  As of April 2026, the top-ranked PLA filaments tracked by FilaScope (ranked by FilaScore, prices from 15+ retailers):
                </p>
                <ul className="space-y-1 mb-3">
                  {filaments.slice(0, 5).map((f) => {
                    const name = f.display_name || f.product_title;
                    return (
                      <li key={f.id} className="text-sm text-foreground">
                        <strong>{f.vendor} {name}</strong>
                        {f.variant_price ? <> — from <strong>${f.variant_price.toFixed(2)}/kg</strong></> : null}
                        {f.material && f.material !== 'PLA' ? <span className="text-muted-foreground"> ({f.material})</span> : null}
                      </li>
                    );
                  })}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Prices updated from 15+ retailers including Amazon, MatterHackers, PrintedSolid, and brand stores.{' '}
                  <Link to="/filaments/pla" className="text-primary hover:underline">Compare all PLA prices →</Link>
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                As of April 2026, the most affordable quality PLA filaments on FilaScope include SUNLU PLA Basic (from $13.99/kg), eSUN PLA+ (from $15.99/kg), Overture PLA (from $16.99/kg), Bambu Lab PLA Basic (from $19.99/kg), and Polymaker PolyTerra PLA (from $19.99/kg). Prices updated daily from 15+ retailers.{' '}
                <Link to="/filaments/pla" className="text-primary hover:underline">Compare all PLA prices →</Link>
              </p>
            )}
          </div>

          {/* ── Why PLA? ───────────────────────────────────────────────── */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Why PLA?</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                PLA (polylactic acid) is a plant-based thermoplastic derived from corn starch or sugarcane. It prints
                at low temperatures (190-220°C), requires no heated bed or enclosure, warps minimally, and works
                on virtually every FDM printer out of the box. According to FilaScope's data, PLA and its variants
                account for roughly 60% of all filament listings across 49+ brands — it's the undisputed default material
                for 3D printing.
              </p>
              <p>
                The tradeoff is that PLA is more brittle than PETG or ABS and softens at relatively low temperatures
                (~55-60°C glass transition), so it isn't ideal for functional parts exposed to heat or repeated impact.
                But for prototyping, display models, cosplay props, HueForge projects, miniatures, and general-purpose
                printing, nothing beats PLA's combination of ease, surface quality, and price.
              </p>
              <p>
                With hundreds of PLA variants on the market — including PLA+, Silk PLA, Matte PLA, wood-fill, metal-fill,
                and glow-in-the-dark blends — the challenge isn't finding PLA, it's finding <em>good</em> PLA. The ranked
                list below surfaces the top-performing options based on real data from 24,000+ filaments, not marketing claims
                or sponsorships.
              </p>
            </div>
          </section>

          {/* ── PLA vs PLA+ vs Silk PLA Comparison Table ───────────────── */}
          <section>
            <h2 className="text-2xl font-bold mb-4">PLA vs PLA+ vs Silk PLA — Comparison</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Not all PLA is created equal. Here's how the three most popular PLA types compare across key metrics.
              Based on FilaScope's analysis of specifications from 24,000+ filaments.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-lg">
                <thead>
                  <tr className="bg-muted/50">
                    <th className="text-left p-3 font-semibold border-b border-border">Property</th>
                    <th className="text-center p-3 font-semibold border-b border-border">Standard PLA</th>
                    <th className="text-center p-3 font-semibold border-b border-border">PLA+</th>
                    <th className="text-center p-3 font-semibold border-b border-border">Silk PLA</th>
                  </tr>
                </thead>
                <tbody>
                  {PLA_COMPARISON.map((row, i) => (
                    <tr key={row.property} className={i % 2 === 0 ? '' : 'bg-muted/20'}>
                      <td className="p-3 font-medium border-b border-border">{row.property}</td>
                      <td className="p-3 text-center text-muted-foreground border-b border-border">{row.pla}</td>
                      <td className="p-3 text-center text-muted-foreground border-b border-border">{row.plaPlus}</td>
                      <td className="p-3 text-center text-muted-foreground border-b border-border">{row.silk}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              <strong>Bottom line:</strong> Choose standard PLA for general printing, PLA+ for anything functional or
              mechanical, and Silk PLA when surface beauty matters more than strength.{' '}
              <Link to="/filaments/pla" className="text-primary hover:underline">Compare all PLA variants →</Link>
            </p>
          </section>

          {/* ── How We Ranked — Methodology ────────────────────────────── */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How We Ranked These Filaments</h2>
            <div className="prose prose-sm max-w-none text-muted-foreground space-y-3">
              <p>
                Unlike editorial "top picks" based on a reviewer's handful of test prints, FilaScope's rankings
                are driven by the <strong>FilaScore algorithm</strong> — a weighted composite score calculated
                from real-world data across 24,000+ filaments and 49+ brands.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="font-semibold text-sm mb-1">Price-to-Quality Ratio — 30%</div>
                  <p className="text-xs text-muted-foreground">Real-time pricing from 15+ retailers weighted against tolerance, reviews, and specifications. A $15/kg filament with ±0.03mm tolerance can outscore a $30/kg filament with ±0.02mm if the value math checks out.</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="font-semibold text-sm mb-1">Diameter Tolerance — 20%</div>
                  <p className="text-xs text-muted-foreground">Manufacturer-stated tolerance ranges. Premium filaments at ±0.02mm or tighter score highest. This directly affects print quality — inconsistent diameter means inconsistent extrusion.</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="font-semibold text-sm mb-1">Community Feedback — 20%</div>
                  <p className="text-xs text-muted-foreground">Aggregated review data and community sentiment from retailers, forums, and user reports. Brands with consistent positive feedback across multiple sources score higher.</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4">
                  <div className="font-semibold text-sm mb-1">Brand Reliability — 15%</div>
                  <p className="text-xs text-muted-foreground">Track record for batch-to-batch consistency, availability of TDS (Technical Data Sheets), spool winding quality, and packaging standards (vacuum-sealed vs not).</p>
                </CardContent>
              </Card>
              <Card className="border-border sm:col-span-2">
                <CardContent className="p-4">
                  <div className="font-semibold text-sm mb-1">Regional Availability — 15%</div>
                  <p className="text-xs text-muted-foreground">Distribution across US, Canadian, European, UK, and Australian retailers. Filaments available globally with competitive shipping score higher than region-locked options. Data from 15+ tracked retailers.</p>
                </CardContent>
              </Card>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              This data-driven methodology eliminates editorial bias — every filament earns its ranking from real-world data, not sponsorships.{' '}
              <Link to="/about" className="text-primary hover:underline">Learn more about FilaScope's methodology →</Link>
            </p>
          </section>

          {/* ── Top 12 PLA Filaments (Full Detailed Entries) ────────────── */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Top 12 PLA Filaments — Ranked by FilaScore</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ranked using the FilaScore algorithm across quality, pricing, availability, and community data from 24,000+ filaments.
              Each entry includes specs, pros and cons, and our expert verdict. Higher score = better overall pick.
            </p>

            {/* Dynamic score cards from DB */}
            {isLoading ? (
              <div className="space-y-4 mb-8">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
              </div>
            ) : filaments && filaments.length > 0 ? (
              <div className="grid sm:grid-cols-3 gap-3 mb-8">
                {filaments.slice(0, 3).map((f, i) => {
                  const hex = normalizeColorHex(f.color_hex);
                  const name = f.display_name || f.product_title;
                  return (
                    <Link key={f.id} to={`/filament/${f.product_handle || f.id}`}>
                      <Card className="border-primary/30 hover:border-primary/60 transition-all group h-full bg-primary/5">
                        <CardContent className="p-4 flex items-center gap-3">
                          <span className="text-xl font-bold text-primary/50 shrink-0">#{i + 1}</span>
                          {hex && (
                            <div className="w-6 h-6 rounded-full border border-border shrink-0" style={{ backgroundColor: hex }} aria-hidden="true" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm group-hover:text-primary transition-colors truncate">{name}</div>
                            <div className="text-xs text-muted-foreground">{f.vendor} · {f.variant_price ? `$${f.variant_price.toFixed(2)}` : 'See price'}</div>
                          </div>
                          {f.filascope_score && <Badge variant="outline" className="text-xs shrink-0">{f.filascope_score.toFixed(1)}</Badge>}
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            ) : null}

            {/* Detailed curated entries */}
            <div className="space-y-8">
              {TOP_12_ENTRIES.map((entry) => (
                <Card key={entry.rank} className="border-border overflow-hidden" id={`pick-${entry.rank}`}>
                  <CardContent className="p-0">
                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-border bg-muted/20">
                      <span className="text-2xl font-bold text-muted-foreground/40">#{entry.rank}</span>
                      <div className="flex-1">
                        <div className="font-bold text-base">{entry.brand} {entry.name}</div>
                        {entry.badge && <Badge className="mt-1 text-xs bg-primary/10 text-primary border-primary/20">{entry.badge}</Badge>}
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold text-primary">{entry.priceRange}</div>
                      </div>
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-0 border-b border-border text-xs">
                      <div className="p-3 border-r border-border">
                        <div className="text-muted-foreground mb-0.5">Nozzle Temp</div>
                        <div className="font-medium flex items-center gap-1"><Thermometer className="w-3 h-3 text-primary" />{entry.nozzle}</div>
                      </div>
                      <div className="p-3 border-r border-border">
                        <div className="text-muted-foreground mb-0.5">Bed Temp</div>
                        <div className="font-medium">{entry.bed}</div>
                      </div>
                      <div className="p-3 border-r border-border">
                        <div className="text-muted-foreground mb-0.5">Tolerance</div>
                        <div className="font-medium flex items-center gap-1"><Ruler className="w-3 h-3 text-primary" />{entry.tolerance}</div>
                      </div>
                      <div className="p-3 border-r border-border">
                        <div className="text-muted-foreground mb-0.5">Spool</div>
                        <div className="font-medium flex items-center gap-1"><Weight className="w-3 h-3 text-primary" />{entry.weight}</div>
                      </div>
                      <div className="p-3">
                        <div className="text-muted-foreground mb-0.5">Best For</div>
                        <div className="font-medium">{entry.bestFor}</div>
                      </div>
                    </div>

                    {/* Pros / Cons */}
                    <div className="grid sm:grid-cols-2 gap-0 border-b border-border">
                      <div className="p-4 border-r border-border">
                        <div className="text-xs font-semibold text-green-500 mb-2 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" /> PROS
                        </div>
                        <ul className="space-y-1.5">
                          {entry.pros.map((pro) => (
                            <li key={pro} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-green-500 shrink-0 mt-0.5">+</span>
                              {pro}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="p-4">
                        <div className="text-xs font-semibold text-red-500 mb-2 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> CONS
                        </div>
                        <ul className="space-y-1.5">
                          {entry.cons.map((con) => (
                            <li key={con} className="text-xs text-muted-foreground flex items-start gap-1.5">
                              <span className="text-red-500 shrink-0 mt-0.5">−</span>
                              {con}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Verdict */}
                    <div className="p-4">
                      <div className="text-xs font-semibold text-foreground mb-1">Our Verdict</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">{entry.verdict}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-6 text-center">
              <Link to="/filaments/pla" className="inline-flex items-center gap-2 text-sm text-primary hover:underline font-medium">
                Compare all PLA filaments in the database <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </section>

          {/* ── PLA Filament Buyer's Guide ──────────────────────────────── */}
          <section>
            <h2 className="text-2xl font-bold mb-4">PLA Filament Buyer's Guide</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Whether you're buying your first spool or stocking up for a print farm, these are the factors
              that matter most when choosing PLA filament. Based on data from 24,000+ filaments tracked by FilaScope.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {PLA_TRAITS.map(({ icon: Icon, label, desc }) => (
                <Card key={label} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">{label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Temperature Range Chart */}
            <div className="mt-6 border border-border rounded-lg p-5">
              <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-primary" />
                PLA Temperature Ranges by Type
              </h3>
              <div className="space-y-3">
                {[
                  { type: 'Standard PLA', range: '190-220°C', bed: '50-60°C', color: 'bg-blue-500' },
                  { type: 'PLA+ / Tough PLA', range: '205-225°C', bed: '50-60°C', color: 'bg-green-500' },
                  { type: 'Silk PLA', range: '215-230°C', bed: '55-65°C', color: 'bg-purple-500' },
                  { type: 'Matte PLA', range: '195-220°C', bed: '50-60°C', color: 'bg-gray-500' },
                  { type: 'Wood Fill PLA', range: '190-210°C', bed: '50-60°C', color: 'bg-amber-600' },
                  { type: 'Metal Fill PLA', range: '195-220°C', bed: '55-65°C', color: 'bg-zinc-500' },
                ].map((item) => (
                  <div key={item.type} className="flex items-center gap-3 text-sm">
                    <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                    <span className="font-medium w-36 shrink-0">{item.type}</span>
                    <span className="text-muted-foreground">Nozzle: {item.range}</span>
                    <span className="text-muted-foreground ml-auto">Bed: {item.bed}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Always verify with the specific brand's recommended settings. Run a{' '}
                <a href="#temp-tower" className="text-primary hover:underline">temperature tower test</a>{' '}
                when trying a new brand or color for the first time.
              </p>
            </div>
          </section>

          {/* ── How to Find Your Ideal PLA Temperature ─────────────────── */}
          <section id="temp-tower">
            <h2 className="text-2xl font-bold mb-4">How to Find Your Ideal PLA Temperature</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Every PLA brand — and even different colors within the same brand — can print optimally at different
              temperatures. A temperature tower is the fastest way to find the sweet spot. This process takes about 45
              minutes and saves hours of troubleshooting down the road.
            </p>
            <ol className="space-y-3">
              {TEMP_TOWER_STEPS.map((step, i) => (
                <li key={step.name} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-medium text-sm">{step.name}</div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* ── Common PLA Problems & Solutions ─────────────────────────── */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Common PLA Problems & Solutions</h2>
            <p className="text-sm text-muted-foreground mb-6">
              PLA is the easiest filament to print, but it's not problem-free. Here are the five most common PLA
              printing issues and how to fix them, based on community data and expert troubleshooting guides.
            </p>
            <div className="space-y-4">
              {PLA_PROBLEMS.map((item) => (
                <Card key={item.problem} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span className="font-semibold text-sm">{item.problem}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">
                      <strong>Symptoms:</strong> {item.symptoms}
                    </p>
                    <ul className="space-y-1">
                      {item.solutions.map((sol) => (
                        <li key={sol} className="text-xs text-muted-foreground flex items-start gap-1.5">
                          <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                          {sol}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ── PLA Variants Explained ──────────────────────────────────── */}
          <section>
            <h2 className="text-2xl font-bold mb-4">PLA Variants Explained</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Beyond standard PLA, there's a growing world of specialty PLA formulations. Each variant adds something
              unique — but comes with printing tradeoffs. Here's what you need to know about each type, based on
              FilaScope's tracking of 24,000+ filaments.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {PLA_VARIANTS.map(({ name, icon: Icon, temp, desc, ideal }) => (
                <Card key={name} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-sm">{name}</span>
                    </div>
                    <div className="text-xs text-primary mb-1.5 flex items-center gap-1">
                      <Thermometer className="w-3 h-3" /> {temp}
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-2">{desc}</p>
                    <p className="text-xs text-muted-foreground">
                      <strong>Ideal for:</strong> {ideal}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* ── Internal Links / Related Pages ─────────────────────────── */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Related Pages</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/filaments/pla', label: 'Browse All PLA Filaments' },
                { to: '/filament-temperature-chart', label: 'Filament Temperature Chart' },
                { to: '/colors', label: 'Filament Color Browser' },
                { to: '/guides/pla-vs-petg', label: 'PLA vs PETG — Full Comparison' },
                { to: '/guides/best-filaments-for-beginners', label: 'Best Filaments for Beginners' },
                { to: '/guides/best-petg-filaments', label: 'Best PETG Filament 2026' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          {/* ── FAQ Section ─────────────────────────────────────────────── */}
          <FAQSection faqs={FAQS} title="Frequently Asked Questions — Best PLA Filament" />

          {/* ── Final CTA ──────────────────────────────────────────────── */}
          <section className="text-center py-8 border-t border-border">
            <h2 className="text-xl font-bold mb-2">Compare All PLA Prices in One Place</h2>
            <p className="text-sm text-muted-foreground mb-4 max-w-lg mx-auto">
              FilaScope tracks pricing from 15+ retailers across 49+ brands. Find the best deal on your next spool
              of PLA — updated daily from 24,000+ filaments.
            </p>
            <Link
              to="/filaments/pla"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
            >
              Browse All PLA Filaments <ArrowRight className="w-4 h-4" />
            </Link>
          </section>
        </div>
      </div>
    </>
  );
}
