import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { DocumentHead } from '@/components/seo/DocumentHead';
import { ArticleSchema, FAQSection, BreadcrumbSchema, DatasetSchema } from '@/components/seo';
import { Breadcrumbs } from '@/components/seo/Breadcrumbs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowRight, Search, Thermometer, ThermometerSun, Wind, Gauge, Shield, Info, ChevronDown, ChevronUp, AlertTriangle, CheckCircle, Flame, Snowflake } from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

interface FilamentTempData {
  material: string;
  category: string;
  nozzleMin: number;
  nozzleMax: number;
  bedMin: number;
  bedMax: number;
  enclosure: 'Required' | 'Recommended' | 'Optional' | 'Not needed';
  speedMin: number;
  speedMax: number;
  notes: string;
  link: string | null;
  highlight?: boolean;
}

const FILAMENT_DATA: FilamentTempData[] = [
  // --- Standard ---
  { material: 'PLA', category: 'Standard', nozzleMin: 190, nozzleMax: 220, bedMin: 50, bedMax: 60, enclosure: 'Not needed', speedMin: 40, speedMax: 100, notes: 'Easiest to print. 100% fan. Start at 210\u00B0C.', link: '/filaments/pla', highlight: true },
  { material: 'PLA+', category: 'Standard', nozzleMin: 205, nozzleMax: 230, bedMin: 55, bedMax: 65, enclosure: 'Not needed', speedMin: 40, speedMax: 80, notes: 'Tougher than PLA. Slightly higher temps needed.', link: '/filaments/pla-plus', highlight: true },
  { material: 'PLA Silk', category: 'Standard', nozzleMin: 200, nozzleMax: 230, bedMin: 50, bedMax: 65, enclosure: 'Not needed', speedMin: 30, speedMax: 70, notes: 'Glossy finish. Print slower for best sheen.', link: '/filaments/pla' },
  { material: 'PETG', category: 'Standard', nozzleMin: 230, nozzleMax: 250, bedMin: 70, bedMax: 85, enclosure: 'Optional', speedMin: 40, speedMax: 80, notes: 'Reduce fan to 30\u201350%. Sticks to PEI.', link: '/filaments/petg', highlight: true },
  { material: 'ABS', category: 'Standard', nozzleMin: 230, nozzleMax: 260, bedMin: 90, bedMax: 110, enclosure: 'Required', speedMin: 40, speedMax: 80, notes: 'Needs enclosure. Minimal fan. Warps easily.', link: '/filaments/abs', highlight: true },
  { material: 'ASA', category: 'Standard', nozzleMin: 240, nozzleMax: 265, bedMin: 90, bedMax: 110, enclosure: 'Required', speedMin: 40, speedMax: 80, notes: 'UV-resistant ABS alternative. Similar requirements.', link: '/filaments/asa' },
  // --- Flexible ---
  { material: 'TPU 95A', category: 'Flexible', nozzleMin: 220, nozzleMax: 250, bedMin: 40, bedMax: 60, enclosure: 'Not needed', speedMin: 20, speedMax: 40, notes: 'Direct drive required. Minimize retraction.', link: '/filaments/tpu', highlight: true },
  { material: 'TPU 85A', category: 'Flexible', nozzleMin: 225, nozzleMax: 255, bedMin: 40, bedMax: 60, enclosure: 'Not needed', speedMin: 15, speedMax: 30, notes: 'Very soft. Print extremely slowly.', link: '/filaments/tpu' },
  { material: 'TPE', category: 'Flexible', nozzleMin: 210, nozzleMax: 240, bedMin: 30, bedMax: 50, enclosure: 'Not needed', speedMin: 15, speedMax: 30, notes: 'Highly elastic. Bowden extruders struggle.', link: null },
  // --- Engineering ---
  { material: 'Nylon (PA6)', category: 'Engineering', nozzleMin: 240, nozzleMax: 270, bedMin: 70, bedMax: 90, enclosure: 'Required', speedMin: 30, speedMax: 60, notes: 'Hygroscopic \u2014 must dry before printing.', link: '/filaments/nylon' },
  { material: 'Nylon (PA12)', category: 'Engineering', nozzleMin: 240, nozzleMax: 280, bedMin: 70, bedMax: 100, enclosure: 'Required', speedMin: 30, speedMax: 60, notes: 'Lower moisture absorption than PA6.', link: '/filaments/nylon' },
  { material: 'Polycarbonate (PC)', category: 'Engineering', nozzleMin: 260, nozzleMax: 310, bedMin: 100, bedMax: 120, enclosure: 'Required', speedMin: 30, speedMax: 60, notes: 'Extremely strong. Needs all-metal hotend.', link: '/filaments/polycarbonate' },
  { material: 'PCTG', category: 'Engineering', nozzleMin: 240, nozzleMax: 260, bedMin: 70, bedMax: 90, enclosure: 'Recommended', speedMin: 30, speedMax: 60, notes: 'Tougher PETG variant. Better impact resistance.', link: null },
  { material: 'POM (Acetal)', category: 'Engineering', nozzleMin: 210, nozzleMax: 235, bedMin: 100, bedMax: 130, enclosure: 'Recommended', speedMin: 20, speedMax: 50, notes: 'Low friction. Very difficult bed adhesion.', link: null },
  { material: 'PP (Polypropylene)', category: 'Engineering', nozzleMin: 220, nozzleMax: 250, bedMin: 80, bedMax: 100, enclosure: 'Recommended', speedMin: 20, speedMax: 50, notes: 'Chemically resistant. Warps significantly.', link: null },
  // --- High-Temp ---
  { material: 'PEEK', category: 'High-Temperature', nozzleMin: 370, nozzleMax: 420, bedMin: 120, bedMax: 160, enclosure: 'Required', speedMin: 15, speedMax: 40, notes: 'Industrial-grade. Requires specialty printer.', link: null },
  { material: 'PEI (ULTEM)', category: 'High-Temperature', nozzleMin: 340, nozzleMax: 380, bedMin: 120, bedMax: 160, enclosure: 'Required', speedMin: 15, speedMax: 40, notes: 'Aerospace-grade. Very high temps needed.', link: null },
  // --- Support ---
  { material: 'PVA', category: 'Support', nozzleMin: 180, nozzleMax: 210, bedMin: 45, bedMax: 60, enclosure: 'Not needed', speedMin: 30, speedMax: 50, notes: 'Water-soluble support. Store sealed \u2014 hygroscopic.', link: null },
  { material: 'HIPS', category: 'Support', nozzleMin: 220, nozzleMax: 250, bedMin: 90, bedMax: 110, enclosure: 'Required', speedMin: 40, speedMax: 60, notes: 'Limonene-soluble support. Pairs with ABS.', link: null },
  { material: 'BVOH', category: 'Support', nozzleMin: 190, nozzleMax: 220, bedMin: 50, bedMax: 70, enclosure: 'Not needed', speedMin: 20, speedMax: 40, notes: 'Water-soluble. Faster dissolving than PVA.', link: null },
  // --- Composite ---
  { material: 'PLA Carbon Fiber', category: 'Composite', nozzleMin: 200, nozzleMax: 230, bedMin: 50, bedMax: 65, enclosure: 'Not needed', speedMin: 30, speedMax: 60, notes: 'Abrasive \u2014 use hardened steel nozzle.', link: '/filaments/pla' },
  { material: 'PETG Carbon Fiber', category: 'Composite', nozzleMin: 230, nozzleMax: 260, bedMin: 70, bedMax: 90, enclosure: 'Optional', speedMin: 30, speedMax: 60, notes: 'Stiff and light. Hardened nozzle required.', link: '/filaments/petg' },
  { material: 'Nylon Carbon Fiber', category: 'Composite', nozzleMin: 250, nozzleMax: 280, bedMin: 70, bedMax: 100, enclosure: 'Required', speedMin: 25, speedMax: 50, notes: 'Very strong. Must dry filament thoroughly.', link: '/filaments/nylon' },
  { material: 'PLA Wood Fill', category: 'Composite', nozzleMin: 190, nozzleMax: 220, bedMin: 50, bedMax: 60, enclosure: 'Not needed', speedMin: 30, speedMax: 60, notes: 'Higher temps darken the wood appearance.', link: '/filaments/pla' },
  { material: 'PLA Metal Fill', category: 'Composite', nozzleMin: 195, nozzleMax: 220, bedMin: 50, bedMax: 65, enclosure: 'Not needed', speedMin: 25, speedMax: 50, notes: 'Heavy filament. Abrasive \u2014 hardened nozzle.', link: '/filaments/pla' },
  // --- Specialty ---
  { material: 'PLA Glow-in-Dark', category: 'Specialty', nozzleMin: 195, nozzleMax: 225, bedMin: 50, bedMax: 65, enclosure: 'Not needed', speedMin: 30, speedMax: 60, notes: 'Abrasive particles. Use hardened nozzle.', link: '/filaments/pla' },
  { material: 'PLA Marble', category: 'Specialty', nozzleMin: 195, nozzleMax: 220, bedMin: 50, bedMax: 60, enclosure: 'Not needed', speedMin: 30, speedMax: 70, notes: 'Random marble pattern. No special requirements.', link: '/filaments/pla' },
  { material: 'PLA Color Change', category: 'Specialty', nozzleMin: 190, nozzleMax: 215, bedMin: 50, bedMax: 60, enclosure: 'Not needed', speedMin: 30, speedMax: 60, notes: 'Temp-reactive pigment. Avoid exceeding 220\u00B0C.', link: '/filaments/pla' },
];

/* ------------------------------------------------------------------ */
/*  Glass Transition Temperature Data                                  */
/* ------------------------------------------------------------------ */

interface TgData {
  material: string;
  tgCelsius: number;
  tgFahrenheit: number;
  printTempMin: number;
  printTempMax: number;
  thermalStability: 'Low' | 'Medium' | 'High' | 'Very High';
  practicalImplication: string;
}

const TG_DATA: TgData[] = [
  { material: 'PLA', tgCelsius: 60, tgFahrenheit: 140, printTempMin: 190, printTempMax: 220, thermalStability: 'Low', practicalImplication: 'Deforms in a hot car or direct sunlight. Not suitable for outdoor or high-heat applications.' },
  { material: 'PLA+', tgCelsius: 65, tgFahrenheit: 149, printTempMin: 205, printTempMax: 230, thermalStability: 'Low', practicalImplication: 'Slightly better heat resistance than standard PLA but still unsuitable for high-temp environments.' },
  { material: 'PETG', tgCelsius: 80, tgFahrenheit: 176, printTempMin: 230, printTempMax: 250, thermalStability: 'Medium', practicalImplication: 'Handles moderate heat well. Safe for kitchen tools and outdoor use in most climates.' },
  { material: 'ABS', tgCelsius: 105, tgFahrenheit: 221, printTempMin: 230, printTempMax: 260, thermalStability: 'Medium', practicalImplication: 'Good heat resistance for automotive and electronics housings. Withstands boiling water.' },
  { material: 'ASA', tgCelsius: 110, tgFahrenheit: 230, printTempMin: 240, printTempMax: 265, thermalStability: 'Medium', practicalImplication: 'UV-stable with good heat resistance. Ideal for outdoor enclosures and signage.' },
  { material: 'TPU 95A', tgCelsius: -50, tgFahrenheit: -58, printTempMin: 220, printTempMax: 250, thermalStability: 'Low', practicalImplication: 'Stays flexible at very low temps. Great for cold-weather applications and gaskets.' },
  { material: 'Nylon PA6', tgCelsius: 50, tgFahrenheit: 122, printTempMin: 240, printTempMax: 270, thermalStability: 'High', practicalImplication: 'Despite low Tg, crystalline structure provides stability up to 180\u00B0C under load.' },
  { material: 'Nylon PA12', tgCelsius: 41, tgFahrenheit: 106, printTempMin: 240, printTempMax: 280, thermalStability: 'High', practicalImplication: 'Similar to PA6 but with lower moisture absorption and better dimensional stability.' },
  { material: 'Polycarbonate', tgCelsius: 147, tgFahrenheit: 297, printTempMin: 260, printTempMax: 310, thermalStability: 'Very High', practicalImplication: 'Excellent heat resistance. Used in automotive headlights, safety equipment, and electronics.' },
  { material: 'PCTG', tgCelsius: 82, tgFahrenheit: 180, printTempMin: 240, printTempMax: 260, thermalStability: 'Medium', practicalImplication: 'Similar to PETG with slightly better impact resistance and chemical resistance.' },
  { material: 'POM (Acetal)', tgCelsius: -85, tgFahrenheit: -121, printTempMin: 210, printTempMax: 235, thermalStability: 'High', practicalImplication: 'Low-friction engineering plastic. Gears, bearings, and mechanical parts. Works at sub-zero temps.' },
  { material: 'PEI (ULTEM)', tgCelsius: 217, tgFahrenheit: 423, printTempMin: 340, printTempMax: 380, thermalStability: 'Very High', practicalImplication: 'Aerospace-grade thermal performance. Autoclavable for medical use. Withstands 200\u00B0C continuously.' },
  { material: 'PEEK', tgCelsius: 143, tgFahrenheit: 289, printTempMin: 370, printTempMax: 420, thermalStability: 'Very High', practicalImplication: 'Extreme thermal and chemical resistance. Used in aerospace, medical implants, and oil/gas.' },
];

/* ------------------------------------------------------------------ */
/*  Brand-Specific Temperature Defaults                                */
/* ------------------------------------------------------------------ */

interface BrandTempDefaults {
  brand: string;
  material: string;
  nozzleMin: number;
  nozzleMax: number;
  bedMin: number;
  bedMax: number;
  source: string;
}

const BRAND_TEMP_DEFAULTS: BrandTempDefaults[] = [
  // Bambu Lab
  { brand: 'Bambu Lab', material: 'PLA Basic', nozzleMin: 190, nozzleMax: 220, bedMin: 55, bedMax: 65, source: 'Bambu Lab Wiki' },
  { brand: 'Bambu Lab', material: 'PETG Basic', nozzleMin: 230, nozzleMax: 250, bedMin: 70, bedMax: 80, source: 'Bambu Lab Wiki' },
  { brand: 'Bambu Lab', material: 'TPU 95A', nozzleMin: 220, nozzleMax: 240, bedMin: 35, bedMax: 50, source: 'Bambu Lab Wiki' },
  { brand: 'Bambu Lab', material: 'ABS', nozzleMin: 240, nozzleMax: 260, bedMin: 90, bedMax: 100, source: 'Bambu Lab Wiki' },
  { brand: 'Bambu Lab', material: 'PLA-CF', nozzleMin: 210, nozzleMax: 230, bedMin: 55, bedMax: 65, source: 'Bambu Lab Wiki' },
  // Prusament
  { brand: 'Prusament', material: 'PLA', nozzleMin: 205, nozzleMax: 225, bedMin: 50, bedMax: 60, source: 'Prusa Material Guide' },
  { brand: 'Prusament', material: 'PETG', nozzleMin: 230, nozzleMax: 250, bedMin: 80, bedMax: 90, source: 'Prusa Material Guide' },
  { brand: 'Prusament', material: 'ASA', nozzleMin: 240, nozzleMax: 260, bedMin: 100, bedMax: 110, source: 'Prusa Material Guide' },
  { brand: 'Prusament', material: 'PC Blend', nozzleMin: 265, nozzleMax: 280, bedMin: 100, bedMax: 115, source: 'Prusa Material Guide' },
  { brand: 'Prusament', material: 'PVB', nozzleMin: 205, nozzleMax: 225, bedMin: 65, bedMax: 75, source: 'Prusa Material Guide' },
  // eSUN
  { brand: 'eSUN', material: 'PLA+', nozzleMin: 205, nozzleMax: 225, bedMin: 55, bedMax: 65, source: 'eSUN Datasheet' },
  { brand: 'eSUN', material: 'PETG', nozzleMin: 230, nozzleMax: 250, bedMin: 70, bedMax: 80, source: 'eSUN Datasheet' },
  { brand: 'eSUN', material: 'TPU 95A', nozzleMin: 210, nozzleMax: 230, bedMin: 40, bedMax: 60, source: 'eSUN Datasheet' },
  { brand: 'eSUN', material: 'ABS+', nozzleMin: 230, nozzleMax: 260, bedMin: 95, bedMax: 110, source: 'eSUN Datasheet' },
  { brand: 'eSUN', material: 'ePA (Nylon)', nozzleMin: 250, nozzleMax: 270, bedMin: 75, bedMax: 90, source: 'eSUN Datasheet' },
  // Polymaker
  { brand: 'Polymaker', material: 'PolyTerra PLA', nozzleMin: 190, nozzleMax: 220, bedMin: 25, bedMax: 60, source: 'Polymaker TDS' },
  { brand: 'Polymaker', material: 'PolyLite PLA', nozzleMin: 190, nozzleMax: 220, bedMin: 25, bedMax: 60, source: 'Polymaker TDS' },
  { brand: 'Polymaker', material: 'PolyMax PLA', nozzleMin: 195, nozzleMax: 220, bedMin: 25, bedMax: 60, source: 'Polymaker TDS' },
  { brand: 'Polymaker', material: 'PolyLite PETG', nozzleMin: 230, nozzleMax: 250, bedMin: 70, bedMax: 80, source: 'Polymaker TDS' },
  { brand: 'Polymaker', material: 'PolyLite ABS', nozzleMin: 245, nozzleMax: 265, bedMin: 95, bedMax: 105, source: 'Polymaker TDS' },
  // Hatchbox
  { brand: 'Hatchbox', material: 'PLA', nozzleMin: 180, nozzleMax: 210, bedMin: 50, bedMax: 60, source: 'Hatchbox Spool Label' },
  { brand: 'Hatchbox', material: 'PETG', nozzleMin: 220, nozzleMax: 245, bedMin: 65, bedMax: 80, source: 'Hatchbox Spool Label' },
  { brand: 'Hatchbox', material: 'ABS', nozzleMin: 210, nozzleMax: 240, bedMin: 80, bedMax: 110, source: 'Hatchbox Spool Label' },
  { brand: 'Hatchbox', material: 'TPU', nozzleMin: 225, nozzleMax: 245, bedMin: 30, bedMax: 60, source: 'Hatchbox Spool Label' },
  // Sunlu
  { brand: 'Sunlu', material: 'PLA', nozzleMin: 190, nozzleMax: 220, bedMin: 50, bedMax: 60, source: 'Sunlu Product Page' },
  { brand: 'Sunlu', material: 'PLA+', nozzleMin: 200, nozzleMax: 230, bedMin: 55, bedMax: 65, source: 'Sunlu Product Page' },
  { brand: 'Sunlu', material: 'PETG', nozzleMin: 230, nozzleMax: 250, bedMin: 70, bedMax: 85, source: 'Sunlu Product Page' },
  { brand: 'Sunlu', material: 'ABS', nozzleMin: 230, nozzleMax: 260, bedMin: 80, bedMax: 110, source: 'Sunlu Product Page' },
  { brand: 'Sunlu', material: 'TPU', nozzleMin: 210, nozzleMax: 240, bedMin: 40, bedMax: 60, source: 'Sunlu Product Page' },
  // Atomic Filament
  { brand: 'Atomic Filament', material: 'PLA', nozzleMin: 195, nozzleMax: 220, bedMin: 50, bedMax: 65, source: 'Atomic Filament Product Page' },
  { brand: 'Atomic Filament', material: 'PETG', nozzleMin: 235, nozzleMax: 255, bedMin: 75, bedMax: 85, source: 'Atomic Filament Product Page' },
  { brand: 'Atomic Filament', material: 'ABS', nozzleMin: 240, nozzleMax: 260, bedMin: 100, bedMax: 110, source: 'Atomic Filament Product Page' },
];

const BRAND_NAMES = [...new Set(BRAND_TEMP_DEFAULTS.map(b => b.brand))];

const ENCLOSURE_COLORS: Record<string, string> = {
  'Required': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Recommended': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Optional': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Not needed': 'bg-green-500/10 text-green-400 border-green-500/20',
};

const CATEGORY_COLORS: Record<string, string> = {
  'Standard': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Flexible': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Engineering': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'High-Temperature': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Support': 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  'Composite': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Specialty': 'bg-pink-500/10 text-pink-400 border-pink-500/20',
};

const TG_STABILITY_COLORS: Record<string, string> = {
  'Low': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Medium': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'High': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Very High': 'bg-green-500/10 text-green-400 border-green-500/20',
};

const CATEGORIES = [...new Set(FILAMENT_DATA.map(f => f.category))];

/* ------------------------------------------------------------------ */
/*  FAQ Data (Expanded from 5 to 15)                                   */
/* ------------------------------------------------------------------ */

const FAQS = [
  {
    question: 'What is the best nozzle temperature for PLA filament?',
    answer: 'Most PLA filaments print best between 200\u2013215\u00B0C. Start at 210\u00B0C and adjust in 5\u00B0C increments. PLA+ and silk PLA variants typically need 5\u201310\u00B0C higher. Always check the temperature range printed on your spool label, as values vary between brands by up to 15\u00B0C. For example, Hatchbox PLA recommends 180\u2013210\u00B0C while Bambu Lab PLA ranges 190\u2013220\u00B0C.',
  },
  {
    question: 'Do I need a heated bed for all filament types?',
    answer: 'No. PLA can print without a heated bed (though 50\u201360\u00B0C improves adhesion). PETG, ABS, ASA, Nylon, and Polycarbonate all require heated beds ranging from 70\u00B0C to 120\u00B0C. Flexible filaments like TPU only need 40\u201360\u00B0C. Check the chart above for each material\u2019s bed temperature range.',
  },
  {
    question: 'Which filaments require an enclosed 3D printer?',
    answer: 'ABS, ASA, Nylon, Polycarbonate, and PEEK all require an enclosed printer to prevent warping and layer splitting caused by drafts and temperature fluctuations. PETG and some composites benefit from an enclosure but can print without one. PLA should generally be printed without an enclosure, as excess ambient heat can cause heat creep in PTFE-lined hotends.',
  },
  {
    question: 'How do I find the right temperature for a new filament brand?',
    answer: 'Start at the midpoint of the range printed on your spool label. Print a temperature tower (most slicers include a built-in plugin) to test 5\u00B0C increments across the full range. Evaluate each section for surface quality, layer adhesion, stringing, and bridging. The section with the best overall quality is your target temperature. Check our brand-specific defaults table above for manufacturer-recommended starting points.',
  },
  {
    question: 'What is the difference between nozzle temperature and bed temperature?',
    answer: 'Nozzle temperature (also called hotend temperature) controls how fully the filament melts as it is extruded. It affects layer adhesion, surface finish, and stringing. Bed temperature controls first-layer adhesion and warping prevention. Both must be set correctly for a successful print \u2014 wrong nozzle temp causes extrusion issues, while wrong bed temp causes adhesion failures or warping.',
  },
  {
    question: 'What is glass transition temperature (Tg) and why does it matter for 3D printing?',
    answer: 'Glass transition temperature (Tg) is the point where a polymer transitions from a rigid, glassy state to a soft, rubbery one. For 3D printed parts, Tg determines the maximum temperature your print can withstand before deforming. PLA has a Tg of just 60\u00B0C, meaning parts warp in a hot car. PETG (80\u00B0C), ABS (105\u00B0C), and Polycarbonate (147\u00B0C) offer progressively better heat resistance. If your part will be exposed to heat, choose a material with a Tg above your expected operating temperature.',
  },
  {
    question: 'How do I print a temperature tower?',
    answer: 'A temperature tower is a calibration model that prints at different temperatures in stacked sections. In OrcaSlicer or Cura, use the built-in temperature tower calibration tool. In PrusaSlicer, download a temperature tower STL and add temperature change G-code at each layer height. Start at the highest recommended temperature for your filament and decrease by 5\u00B0C per section. After printing, examine each section for stringing, layer adhesion, bridging, and surface quality to find your optimal temperature.',
  },
  {
    question: 'What is the ideal temperature for bridging?',
    answer: 'Bridging (printing across open gaps without support) works best at the lower end of a filament\u2019s temperature range with maximum cooling fan speed. For PLA, try 195\u2013200\u00B0C with 100% fan. For PETG, use 225\u2013235\u00B0C with 50\u201370% fan. Lower temperatures increase viscosity, preventing the molten filament from sagging as it spans the gap. Combine lower temps with slower bridge speeds (15\u201325 mm/s) for best results.',
  },
  {
    question: 'Does ambient room temperature affect my print settings?',
    answer: 'Yes, significantly. Cold rooms (below 18\u00B0C/64\u00B0F) can cause warping, poor bed adhesion, and layer splitting \u2014 especially with ABS, ASA, and Nylon. Hot rooms (above 30\u00B0C/86\u00B0F) can cause heat creep in PTFE-lined hotends and make PLA difficult to print. If your printing environment is cold, consider an enclosure even for materials that don\u2019t normally require one. In summer, avoid printing PLA in non-air-conditioned spaces above 32\u00B0C.',
  },
  {
    question: 'How does print speed interact with nozzle temperature?',
    answer: 'Higher print speeds require higher nozzle temperatures to maintain adequate melt flow. When you increase speed, the filament spends less time in the melt zone, so it may not fully melt at your original temperature. As a rule of thumb, increase nozzle temperature by 5\u201310\u00B0C when increasing speed by 50% or more. Modern high-speed printers like the Bambu Lab X1C use this principle, running PLA at 220\u2013240\u00B0C at 200+ mm/s speeds.',
  },
  {
    question: 'Can I use the same temperature settings for different brands of the same material?',
    answer: 'Not always. Different brands add different additives, colorants, and modifiers that affect optimal temperature. For example, Hatchbox PLA prints at 180\u2013210\u00B0C while Bambu Lab PLA recommends 190\u2013220\u00B0C \u2014 a 10\u00B0C difference. Even color variations within the same brand can require 3\u20135\u00B0C adjustment (darker colors often need slightly higher temps). Always run a temperature tower for each new spool, especially when switching brands.',
  },
  {
    question: 'How do I know if I\u2019m printing too hot or too cold?',
    answer: 'Too hot: excessive stringing/oozing, blobby surfaces, shiny/glossy appearance where it shouldn\u2019t be, elephant\u2019s foot on first layer, and weak overhangs that droop. Too cold: visible layer lines, poor layer adhesion (layers separate easily), under-extrusion, rough/matte surface texture, and filament grinding or clicking from the extruder. Print a temperature tower to identify the sweet spot \u2014 it\u2019s where both stringing and layer adhesion issues are minimized.',
  },
  {
    question: 'What\u2019s the difference between all-metal and PTFE-lined hotends for temperature?',
    answer: 'PTFE-lined hotends (common on budget printers) have a PTFE tube that extends into the heat break. PTFE degrades above 240\u00B0C and releases toxic fumes above 260\u00B0C, limiting you to PLA, PETG, and TPU. All-metal hotends replace the PTFE tube with a metal heat break, allowing temperatures up to 300\u00B0C+ for materials like ABS, ASA, Nylon, Polycarbonate, and beyond. If you want to print engineering materials, an all-metal hotend upgrade is essential.',
  },
  {
    question: 'Should I lower the temperature for small or detailed prints?',
    answer: 'Yes, for very small prints or fine details, reduce nozzle temperature by 5\u201310\u00B0C from your normal setting. Small parts have very short layer times, meaning each layer gets printed while the previous one is still hot. This can cause deformation, blobbing, and loss of detail. Alternatively, print multiple copies of the same part to increase layer time, or use your slicer\u2019s minimum layer time setting (typically 8\u201315 seconds) to automatically slow down the printer.',
  },
  {
    question: 'How does filament moisture affect print temperature?',
    answer: 'Wet filament behaves as though you\u2019re printing too hot. Moisture in the filament turns to steam in the hotend, causing popping sounds, bubbles in the extrusion, rough surface finish, stringing, and poor layer adhesion. You might be tempted to lower the temperature, but the real fix is drying the filament. Dry PLA at 45\u201350\u00B0C for 4\u20136 hours, PETG at 65\u00B0C for 4\u20136 hours, and Nylon at 80\u00B0C for 8\u201312 hours. Always store opened filament with desiccant, and consider printing from a dry box for hygroscopic materials.',
  },
];

/* ------------------------------------------------------------------ */
/*  Quick Reference Cards                                              */
/* ------------------------------------------------------------------ */

const QUICK_REF = FILAMENT_DATA.filter(f => f.highlight).slice(0, 7);

function QuickRefCard({ data }: { data: FilamentTempData }) {
  return (
    <Card className="border-border hover:border-primary/30 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-foreground text-lg">
            {data.link ? (
              <Link to={data.link} className="text-primary hover:underline">{data.material}</Link>
            ) : data.material}
          </h3>
          <Badge variant="outline" className={CATEGORY_COLORS[data.category]}>{data.category}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Thermometer className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span>Nozzle: <span className="font-mono font-medium text-foreground">{data.nozzleMin}\u2013{data.nozzleMax}\u00B0C</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <ThermometerSun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Bed: <span className="font-mono font-medium text-foreground">{data.bedMin}\u2013{data.bedMax}\u00B0C</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Gauge className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Speed: <span className="font-mono font-medium text-foreground">{data.speedMin}\u2013{data.speedMax} mm/s</span></span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-green-400 shrink-0" />
            <span>Enclosure: <span className="font-medium text-foreground">{data.enclosure}</span></span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Temperature Bar Visualization                                      */
/* ------------------------------------------------------------------ */

function TempBar({ min, max, globalMin, globalMax, color }: { min: number; max: number; globalMin: number; globalMax: number; color: string }) {
  const range = globalMax - globalMin;
  const left = ((min - globalMin) / range) * 100;
  const width = ((max - min) / range) * 100;

  return (
    <div className="relative w-full h-5 bg-muted/30 rounded-sm overflow-hidden" title={`${min}\u2013${max}\u00B0C`}>
      <div
        className={`absolute top-0 h-full rounded-sm ${color}`}
        style={{ left: `${left}%`, width: `${Math.max(width, 2)}%` }}
      />
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-mono font-medium text-foreground leading-none">
        {min}\u2013{max}\u00B0C
      </span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsible Section Component                                      */
/* ------------------------------------------------------------------ */

function CollapsibleSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
      >
        <span className="font-semibold text-foreground">{title}</span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page Component                                                     */
/* ------------------------------------------------------------------ */

export default function FilamentTemperatureChart() {
  const canonical = 'https://filascope.com/filament-temperature-chart';
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [enclosureFilter, setEnclosureFilter] = useState<string | null>(null);
  const [activeBrand, setActiveBrand] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let results = FILAMENT_DATA;
    if (activeCategory) {
      results = results.filter(f => f.category === activeCategory);
    }
    if (enclosureFilter) {
      results = results.filter(f => f.enclosure === enclosureFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      results = results.filter(f =>
        f.material.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        f.notes.toLowerCase().includes(q)
      );
    }
    return results;
  }, [search, activeCategory, enclosureFilter]);

  const filteredBrandDefaults = useMemo(() => {
    if (!activeBrand) return BRAND_TEMP_DEFAULTS;
    return BRAND_TEMP_DEFAULTS.filter(b => b.brand === activeBrand);
  }, [activeBrand]);

  const nozzleGlobalMin = 170;
  const nozzleGlobalMax = 430;
  const bedGlobalMin = 20;
  const bedGlobalMax = 170;

  return (
    <>
      <DocumentHead
        title="Filament Temperature Chart 2026 — All Materials & Brand Defaults"
        description="Complete filament temperature guide with glass transition temps, brand-specific defaults, and troubleshooting. Covers PLA, PETG, ABS, TPU, Nylon & 20+ more materials."
        canonical={canonical}
        ogTitle="Filament Temperature Chart 2026 — Nozzle & Bed Temps for 28+ Materials"
        ogDescription="Free filament temperature chart with brand-specific defaults, glass transition temperatures, troubleshooting, and optimization tips for PLA, PETG, ABS, TPU, Nylon, PC and 20+ materials."
        keywords="filament temperature chart, 3d printer temperature settings, nozzle temperature guide, bed temperature chart, PLA temperature, PETG temperature, ABS temperature, glass transition temperature filament, brand temperature defaults, filament print settings 2026, temperature tower guide"
      />
      <ArticleSchema
        headline="3D Printer Filament Temperature Chart — Complete Guide with Brand Defaults & Tg Values"
        description="Comprehensive 3D filament temperature chart with nozzle and bed temp settings, glass transition temperatures, brand-specific defaults, troubleshooting, and optimization tips for PLA, PETG, ABS, TPU, Nylon, ASA, PC and 20+ materials. Updated April 2026."
        datePublished="2026-03-20"
        dateModified="2026-05-11"
        url="/filament-temperature-chart"
        articleType="TechArticle"
        about={{ '@type': 'Thing', name: '3D Printer Filament Temperature Settings' }}
        proficiencyLevel="Beginner"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://filascope.com/' },
        { name: 'Guides', url: 'https://filascope.com/guides' },
        { name: 'Filament Temperature Chart', url: 'https://filascope.com/filament-temperature-chart' },
      ]} />
      <DatasetSchema
        name="3D Printer Filament Temperature Chart"
        description={`Comprehensive temperature settings reference for ${FILAMENT_DATA.length} 3D printer filament materials including PLA, PETG, ABS, TPU, ASA, Nylon, and Polycarbonate. Includes nozzle temperature, bed temperature, print speed, enclosure requirements, glass transition temperatures, and brand-specific manufacturer defaults from ${BRAND_NAMES.length} major brands.`}
        url="https://filascope.com/filament-temperature-chart"
        keywords={['filament temperature', '3D printer settings', 'PLA temperature', 'PETG temperature', 'ABS temperature', 'nozzle temperature', 'bed temperature', 'glass transition temperature', 'brand temperature defaults']}
        creator={{ '@type': 'Organization', name: 'FilaScope', url: 'https://filascope.com' }}
        recordCount={FILAMENT_DATA.length}
        variableMeasured={[
          { '@type': 'PropertyValue', name: 'Nozzle Temperature', unitText: '°C' },
          { '@type': 'PropertyValue', name: 'Bed Temperature', unitText: '°C' },
          { '@type': 'PropertyValue', name: 'Print Speed', unitText: 'mm/s' },
          { '@type': 'PropertyValue', name: 'Glass Transition Temperature', unitText: '°C' },
        ]}
        dateModified="2026-05-11"
      />
      {/* ItemList schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "3D Printer Filament Temperature Chart",
            description: `Comprehensive temperature settings for ${FILAMENT_DATA.length} 3D printer filament materials including nozzle temperature, bed temperature, print speed, and enclosure requirements.`,
            numberOfItems: FILAMENT_DATA.length,
            itemListElement: FILAMENT_DATA.map((f, i) => ({
              "@type": "ListItem",
              position: i + 1,
              name: `${f.material} Temperature Settings`,
              description: `${f.material}: Nozzle ${f.nozzleMin}–${f.nozzleMax}°C, Bed ${f.bedMin}–${f.bedMax}°C, Speed ${f.speedMin}–${f.speedMax} mm/s. Enclosure: ${f.enclosure}. ${f.notes}`,
            })),
          }),
        }}
      />
      {/* FAQPage schema */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQS.map(faq => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer,
          },
        })),
      }) }} />
      {/* HowTo schema for temperature tower tutorial */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "How to Print a Temperature Tower for 3D Printing",
        "description": "Step-by-step guide to printing and reading a temperature tower to find the optimal nozzle temperature for any 3D printer filament.",
        "totalTime": "PT1H30M",
        "estimatedCost": {
          "@type": "MonetaryAmount",
          "currency": "USD",
          "value": "0.50"
        },
        "supply": [
          { "@type": "HowToSupply", "name": "Filament spool to calibrate" },
          { "@type": "HowToSupply", "name": "Build plate adhesion (glue stick or PEI sheet)" },
        ],
        "tool": [
          { "@type": "HowToTool", "name": "3D printer with adjustable nozzle temperature" },
          { "@type": "HowToTool", "name": "Slicer software (OrcaSlicer, Cura, or PrusaSlicer)" },
        ],
        "step": [
          {
            "@type": "HowToStep",
            "name": "Download or generate a temperature tower model",
            "text": "Use your slicer's built-in calibration tool (OrcaSlicer and Cura have this), or download a temperature tower STL from Thingiverse or Printables. Choose a model with 5°C increments.",
          },
          {
            "@type": "HowToStep",
            "name": "Set the temperature range",
            "text": "Configure the tower to span the full recommended range for your filament. For PLA, this is typically 190–220°C. Start at the highest temperature at the bottom.",
          },
          {
            "@type": "HowToStep",
            "name": "Slice and print the tower",
            "text": "Slice the model with your normal print settings. The slicer should automatically insert temperature changes at each section. Print the tower and let it complete fully.",
          },
          {
            "@type": "HowToStep",
            "name": "Evaluate each section",
            "text": "Examine each section for: stringing (too hot), poor layer adhesion (too cold), surface quality, bridging performance, and overhang quality. The best section is your optimal temperature.",
          },
          {
            "@type": "HowToStep",
            "name": "Fine-tune your temperature",
            "text": "Once you identify the best 5°C range, optionally print a second tower with 1–2°C increments within that range for precise calibration. Record the result on your spool for future reference.",
          },
        ],
      }) }} />

      <div className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <Breadcrumbs items={[
            { name: 'Guides', url: '/guides' },
            { name: 'Filament Temperature Chart', url: '/filament-temperature-chart' },
          ]} />
        </div>

        {/* Hero */}
        <section className="bg-gradient-to-b from-primary/5 to-transparent py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Reference Chart &middot; Updated April 2026</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              3D Printer Filament Temperature Chart
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
              The most comprehensive filament temperature reference on the web. Find the right nozzle temperature,
              bed temperature, print speed, and enclosure requirements for {FILAMENT_DATA.length} materials — plus glass transition
              temperatures, brand-specific defaults from {BRAND_NAMES.length} manufacturers, and troubleshooting guides.
              Backed by our database of 21,000+ filament listings.
            </p>
          </div>
        </section>

        <div className="max-w-6xl mx-auto px-4 py-10 space-y-14">

          {/* Quick Reference — 7 Most Common Materials */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Quick Reference — Most Common Materials</h2>
            <p className="text-sm text-muted-foreground mb-4">
              The seven filament types you will use most often. For the full chart with {FILAMENT_DATA.length} materials, scroll down.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {QUICK_REF.map(data => (
                <QuickRefCard key={data.material} data={data} />
              ))}
            </div>
          </section>

          {/* Q&A Answer Sections — AI-citable direct answers */}
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-bold mb-2">What temperature should I print PLA at?</h2>
              <p className="text-muted-foreground leading-relaxed">
                PLA filament prints best at <strong>190–220°C nozzle temperature</strong> with a <strong>50–60°C heated bed</strong>. Start at 210°C and adjust in 5°C increments. Too low causes under-extrusion and poor layer adhesion; too high causes stringing and oozing. Specialty PLA variants like silk PLA and PLA+ typically run 5–10°C higher than standard PLA. Always check the manufacturer-recommended range on the spool label, as values vary by up to 15°C between brands. High-speed PLA formulations (like Bambu Lab's PLA Basic at 200+ mm/s) may run at 220–240°C to maintain adequate melt flow.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">What temperature does PETG print at?</h2>
              <p className="text-muted-foreground leading-relaxed">
                PETG requires <strong>230–250°C nozzle temperature</strong> and a <strong>70–85°C bed</strong>. Start at 240°C. PETG is sensitive to over-extrusion and stringing — reduce fan speed to 30–50% (unlike PLA which runs full fan) and try dropping flow rate to 95% if you see stringing. PETG bonds well to PEI build surfaces and does not require an enclosure, though one can improve consistency. With a glass transition temperature of 80°C, PETG printed parts handle moderate heat well — making them suitable for kitchen tools and outdoor applications.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">What temperature does ABS require?</h2>
              <p className="text-muted-foreground leading-relaxed">
                ABS requires <strong>230–260°C nozzle temperature</strong>, a <strong>90–110°C heated bed</strong>, and a <strong>fully enclosed printer</strong>. Without enclosure, ABS will warp, crack, and delaminate due to drafts and ambient temperature fluctuations. Run minimal or zero part cooling fan. ABS is best suited for functional parts that need heat resistance (Tg of 105°C) or impact toughness. Its higher temperature requirements mean you need an all-metal hotend — PTFE-lined hotends degrade above 240°C.
              </p>
            </div>
            <div>
              <h2 className="text-xl font-bold mb-2">Which filament has the lowest print temperature?</h2>
              <p className="text-muted-foreground leading-relaxed">
                <strong>PLA has the lowest print temperature</strong> of all common 3D printing filaments at <strong>190–220°C</strong>. PVA support material is the only common filament with a lower range (180–210°C), but it is rarely used as a primary material. This low temperature means PLA works on virtually any printer — including basic models without all-metal hotends — and requires no heated enclosure. For an even lower-temp option, some brands offer PLA that prints as low as 180°C.
              </p>
            </div>
          </section>

          {/* ================================================================ */}
          {/* NEW SECTION: Temperature Fundamentals                            */}
          {/* ================================================================ */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Temperature Fundamentals for 3D Printing</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Understanding how temperature works in FDM 3D printing is essential for getting good results. Every filament is a thermoplastic — a polymer that becomes moldable above a specific temperature and solidifies upon cooling. Getting this temperature right is the difference between a strong, beautiful print and a stringy mess.
            </p>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-3">
                  <Thermometer className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold">What Is Nozzle Temperature?</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The nozzle (or hotend) temperature is the heat applied to the filament as it passes through the printer's extruder. A thermistor inside the heat block measures and regulates this temperature. The filament must be heated above its melting point to flow through the 0.4mm nozzle opening. Too cold and the filament won't extrude properly; too hot and you'll get stringing, oozing, and degraded material properties. Most consumer filaments print between 190°C and 260°C.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-3">
                  <ThermometerSun className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold">What Is Bed Temperature?</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The bed temperature controls the heated build plate that your print sits on. Its primary purpose is first-layer adhesion — warm plastic bonds better to the build surface. For materials like ABS and Nylon, the heated bed also reduces the thermal gradient between the print and the plate, preventing warping and layer separation. Bed temperatures range from unheated (for basic PLA) to 160°C (for PEEK). Using the wrong bed temperature is the number one cause of prints popping off mid-print.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-3">
                  <Wind className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-semibold">The Role of Cooling Fans</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Part cooling fans blow air directly onto the freshly extruded filament, solidifying it quickly. PLA benefits from 100% fan speed for sharp overhangs and bridges. PETG needs reduced fan (30–50%) to prevent layer adhesion issues. ABS and ASA need minimal or zero fan to maintain inter-layer bonding — drafts cause cracking and delamination. The cooling rate directly affects layer adhesion, surface finish, and bridging capability. Think of fan speed as "temperature control from the outside."
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-5 h-5 text-orange-400" />
                  <h3 className="font-semibold">Thermal Mass & Temperature Ramping</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your printer's hotend has thermal mass — it takes time to heat up and cool down. When switching between materials in a multi-material setup, allow 30–60 seconds for the hotend to stabilize at the new temperature. Temperature ramping (gradually changing temperature across layers) can improve surface quality: starting slightly hotter for first-layer adhesion and reducing by 5°C for the remainder of the print. Some advanced slicers support per-layer temperature profiles for this purpose.
                </p>
              </div>
            </div>
          </section>

          {/* Full Temperature Chart */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Complete Filament Temperature Chart</h2>
            <p className="text-sm text-muted-foreground mb-5">
              All {FILAMENT_DATA.length} filament types with nozzle temperatures, bed temperatures, speed ranges, enclosure requirements, and usage notes.
              Temperature bars show the relative range visually. Click a material name to view brand-specific temperatures in our{' '}
              <Link to="/filaments" className="text-primary hover:underline">filament database</Link>.
            </p>

            {/* Filters */}
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search materials..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              {/* Category filters */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center mr-1">Category:</span>
                <button
                  onClick={() => setActiveCategory(null)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    activeCategory === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  All ({FILAMENT_DATA.length})
                </button>
                {CATEGORIES.map(cat => {
                  const count = FILAMENT_DATA.filter(f => f.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                        activeCategory === cat
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/30'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>
              {/* Enclosure filters */}
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-muted-foreground self-center mr-1">Enclosure:</span>
                <button
                  onClick={() => setEnclosureFilter(null)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                    enclosureFilter === null
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/30'
                  }`}
                >
                  All
                </button>
                {['Not needed', 'Optional', 'Recommended', 'Required'].map(enc => (
                  <button
                    key={enc}
                    onClick={() => setEnclosureFilter(enclosureFilter === enc ? null : enc)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      enclosureFilter === enc
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/30'
                    }`}
                  >
                    {enc} ({FILAMENT_DATA.filter(f => f.enclosure === enc).length})
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Table */}
            <Card className="border-border overflow-hidden">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[960px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold w-[160px]">Material</th>
                      <th className="text-left p-3 font-semibold">Category</th>
                      <th className="text-left p-3 font-semibold w-[200px]">
                        <span className="flex items-center gap-1"><Thermometer className="w-3.5 h-3.5 text-red-400" /> Nozzle Temp</span>
                      </th>
                      <th className="text-left p-3 font-semibold w-[200px]">
                        <span className="flex items-center gap-1"><ThermometerSun className="w-3.5 h-3.5 text-amber-400" /> Bed Temp</span>
                      </th>
                      <th className="text-left p-3 font-semibold">
                        <span className="flex items-center gap-1"><Gauge className="w-3.5 h-3.5 text-blue-400" /> Speed</span>
                      </th>
                      <th className="text-left p-3 font-semibold">Enclosure</th>
                      <th className="text-left p-3 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-muted-foreground">
                          No materials match your search. Try a different term.
                        </td>
                      </tr>
                    )}
                    {filtered.map((row) => (
                      <tr key={row.material} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">
                          {row.link ? (
                            <Link to={row.link} className="text-primary hover:underline">{row.material}</Link>
                          ) : (
                            row.material
                          )}
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${CATEGORY_COLORS[row.category]}`}>
                            {row.category}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <TempBar min={row.nozzleMin} max={row.nozzleMax} globalMin={nozzleGlobalMin} globalMax={nozzleGlobalMax} color="bg-red-500/40" />
                        </td>
                        <td className="p-3">
                          <TempBar min={row.bedMin} max={row.bedMax} globalMin={bedGlobalMin} globalMax={bedGlobalMax} color="bg-amber-500/40" />
                        </td>
                        <td className="p-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {row.speedMin}&ndash;{row.speedMax} mm/s
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${ENCLOSURE_COLORS[row.enclosure]}`}>
                            {row.enclosure}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground max-w-[200px]">{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <p className="text-xs text-muted-foreground mt-3 flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Temperature ranges shown are typical starting points. Actual values vary between brands by up to 15&deg;C.
              Check the spool label and print a temperature tower for best results. See our{' '}
              <Link to="/filaments" className="text-primary hover:underline">filament database</Link> for 21,000+ brand-specific temperature listings.
            </p>
          </section>

          {/* ================================================================ */}
          {/* NEW SECTION: Material Science & Glass Transition Temperatures     */}
          {/* ================================================================ */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Glass Transition Temperatures (Tg) for 3D Printing Filaments</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Glass transition temperature (Tg) is the temperature at which a polymer transitions from a hard, glassy state to a soft, rubbery one. It's a critical property that determines the <strong>maximum operating temperature</strong> of your 3D printed parts. Unlike melting point, Tg is a gradual transition — parts begin to soften and deform as they approach this temperature.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-6">
              For practical purposes: if your 3D printed part will be exposed to heat (hot car interior, dishwasher, outdoor sun exposure, machinery), you need a material with a Tg above the expected temperature. A PLA phone mount left on a dashboard in summer (60°C+) will sag and deform. A PETG mount would survive, and an ABS mount wouldn't even notice.
            </p>

            <div className="rounded-lg border border-border p-5 bg-card/50 mb-6">
              <h3 className="font-semibold mb-3">Tg vs. Melting Point — What's the Difference?</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Tg (glass transition) is when a material starts to <em>soften</em>. The melting point is when it becomes <em>fully liquid</em>. For 3D printing, Tg matters more for end-use parts because your part deforms long before it melts. The nozzle temperature must exceed the melting point for the filament to flow during extrusion, but your finished part only needs to stay below Tg during use.
              </p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <strong>Semi-crystalline polymers</strong> (Nylon, POM, PEEK) behave differently from <strong>amorphous polymers</strong> (PLA, ABS, PC). Semi-crystalline materials have both a Tg and a distinct melting point, and their crystalline structure provides mechanical stability even above Tg. That's why Nylon parts remain functional at temperatures well above their low Tg of 50°C.
              </p>
            </div>

            {/* Tg Table */}
            <Card className="border-border overflow-hidden mb-4">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[800px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Material</th>
                      <th className="text-left p-3 font-semibold">Tg (°C)</th>
                      <th className="text-left p-3 font-semibold">Tg (°F)</th>
                      <th className="text-left p-3 font-semibold">Print Temp Range</th>
                      <th className="text-left p-3 font-semibold">Thermal Stability</th>
                      <th className="text-left p-3 font-semibold">Practical Implication</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TG_DATA.map((row) => (
                      <tr key={row.material} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{row.material}</td>
                        <td className="p-3 font-mono">{row.tgCelsius}°C</td>
                        <td className="p-3 font-mono text-muted-foreground">{row.tgFahrenheit}°F</td>
                        <td className="p-3 font-mono text-xs">{row.printTempMin}–{row.printTempMax}°C</td>
                        <td className="p-3">
                          <Badge variant="outline" className={`text-[10px] ${TG_STABILITY_COLORS[row.thermalStability]}`}>
                            {row.thermalStability}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs text-muted-foreground max-w-[280px]">{row.practicalImplication}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Tg values are approximate and vary by specific formulation and additives. Semi-crystalline materials (Nylon, POM, PEEK) retain structural integrity well above their Tg due to crystalline regions.
            </p>
          </section>

          {/* ================================================================ */}
          {/* NEW SECTION: Brand-Specific Temperature Defaults                 */}
          {/* ================================================================ */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Brand-Specific Temperature Defaults</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Different filament brands recommend different temperatures, even for the same material type. These variations come from
              differences in polymer formulations, additives, colorants, and manufacturing processes. The table below shows manufacturer-recommended
              temperature settings from {BRAND_NAMES.length} major filament brands. Use these as starting points and fine-tune with a temperature tower.
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              <strong>Pro tip:</strong> When switching brands, don't assume your old temperature settings will work. Hatchbox PLA at 195°C might
              print perfectly while the same temperature causes under-extrusion with Prusament PLA (which prefers 210°C). Always check the
              manufacturer defaults below, then fine-tune.
            </p>

            {/* Brand filter */}
            <div className="flex flex-wrap gap-2 mb-5">
              <span className="text-xs text-muted-foreground self-center mr-1">Filter by brand:</span>
              <button
                onClick={() => setActiveBrand(null)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                  activeBrand === null
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/30'
                }`}
              >
                All Brands ({BRAND_TEMP_DEFAULTS.length})
              </button>
              {BRAND_NAMES.map(brand => {
                const count = BRAND_TEMP_DEFAULTS.filter(b => b.brand === brand).length;
                return (
                  <button
                    key={brand}
                    onClick={() => setActiveBrand(activeBrand === brand ? null : brand)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                      activeBrand === brand
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/30'
                    }`}
                  >
                    {brand} ({count})
                  </button>
                );
              })}
            </div>

            <Card className="border-border overflow-hidden mb-4">
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-3 font-semibold">Brand</th>
                      <th className="text-left p-3 font-semibold">Material</th>
                      <th className="text-left p-3 font-semibold">Nozzle (°C)</th>
                      <th className="text-left p-3 font-semibold">Bed (°C)</th>
                      <th className="text-left p-3 font-semibold">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrandDefaults.map((row, i) => (
                      <tr key={`${row.brand}-${row.material}-${i}`} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-medium">{row.brand}</td>
                        <td className="p-3">{row.material}</td>
                        <td className="p-3 font-mono text-xs">{row.nozzleMin}–{row.nozzleMax}°C</td>
                        <td className="p-3 font-mono text-xs">{row.bedMin}–{row.bedMax}°C</td>
                        <td className="p-3 text-xs text-muted-foreground">{row.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              Brand defaults sourced from manufacturer product pages, technical data sheets (TDS), and spool labels as of April 2026. For real-time brand-specific temperatures,
              browse our <Link to="/filaments" className="text-primary hover:underline">filament database</Link> with 21,000+ listings.
            </p>
          </section>

          {/* ================================================================ */}
          {/* NEW SECTION: Troubleshooting Temperature Issues                   */}
          {/* ================================================================ */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Troubleshooting Temperature Issues</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Temperature is the root cause of many 3D printing failures. Before adjusting retraction, flow rate, or speed, check whether
              your temperature settings are correct. Here are the most common temperature-related problems and how to fix them.
            </p>

            <div className="space-y-4">
              <CollapsibleSection title="🔥 Printing Too Hot — Symptoms & Solutions" defaultOpen>
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-amber-400" /> Symptoms
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
                        <li>Excessive stringing and oozing between travel moves</li>
                        <li>Blobby, bumpy surface finish</li>
                        <li>Shiny/glossy surface where it should be matte</li>
                        <li>Drooping overhangs and poor bridging</li>
                        <li>Elephant's foot on the first layer (squished base)</li>
                        <li>Burnt or discolored filament</li>
                        <li>Material curling up at the nozzle tip</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-green-400" /> Solutions
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
                        <li>Lower nozzle temperature by 5°C increments</li>
                        <li>Increase part cooling fan speed (except for ABS/ASA)</li>
                        <li>Reduce print speed to give layers more cooling time</li>
                        <li>Enable coasting in your slicer (stops extrusion slightly before the end of a path)</li>
                        <li>Increase retraction distance by 0.5mm increments</li>
                        <li>For elephant's foot: lower bed temp by 5°C or add a chamfer</li>
                        <li>Check if the thermistor is reading accurately (offset calibration)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="❄️ Printing Too Cold — Symptoms & Solutions">
                <div className="space-y-3 text-sm text-muted-foreground">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-blue-400" /> Symptoms
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
                        <li>Visible layer lines with poor inter-layer adhesion</li>
                        <li>Layers separate easily when bent or stressed</li>
                        <li>Under-extrusion (thin, gappy lines)</li>
                        <li>Rough, matte surface texture</li>
                        <li>Extruder clicking or grinding sounds (filament can't flow)</li>
                        <li>Nozzle clogs during long prints</li>
                        <li>Poor first-layer adhesion despite correct bed temp</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground mb-2 flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-green-400" /> Solutions
                      </h4>
                      <ul className="list-disc list-inside space-y-1.5 leading-relaxed">
                        <li>Raise nozzle temperature by 5°C increments</li>
                        <li>Reduce print speed (less flow demand = less heat needed)</li>
                        <li>Check for heat creep: is the heatsink fan running properly?</li>
                        <li>Verify the filament diameter matches your slicer profile (1.75 vs 2.85mm)</li>
                        <li>Ensure the hotend heat block screws are tight (loose = heat loss)</li>
                        <li>Try a cold pull to clear any partial clogs</li>
                        <li>For first layer: increase bed temp by 5°C and slow first layer to 50%</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="🌡️ Inconsistent Temperatures & Thermal Runaway">
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    If your print quality varies throughout the print — good at the start, bad in the middle — you may have temperature inconsistency.
                    Common causes include:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5">
                    <li><strong>Loose thermistor:</strong> The temperature sensor has shifted position in the heat block. It reads incorrectly, causing PID regulation to over- or under-shoot. Re-seat and tighten it.</li>
                    <li><strong>Worn heater cartridge:</strong> Old heater cartridges lose efficiency. If your hotend struggles to reach or maintain temperature, replace the cartridge.</li>
                    <li><strong>Thermal runaway protection:</strong> Modern firmware (Marlin, Klipper) monitors temperature deviations. If the temperature drops more than 15°C unexpectedly or rises uncontrollably, the printer shuts down to prevent fire. This is a safety feature — do not disable it.</li>
                    <li><strong>Drafts and ambient temperature:</strong> A cold draft from an AC vent or open window can cool one side of your print, causing warping on that side. An enclosure eliminates this.</li>
                    <li><strong>PID tuning:</strong> If temperature oscillates ±5°C or more during printing, run PID autotune. In Marlin: <code className="bg-muted px-1 rounded">M303 E0 S210 C8</code>. In Klipper: <code className="bg-muted px-1 rounded">PID_CALIBRATE HEATER=extruder TARGET=210</code>.</li>
                  </ul>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="🔻 Warping & First-Layer Adhesion Issues">
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Warping happens when cooling plastic contracts unevenly, pulling corners up from the build plate. Temperature is the primary lever for fixing this:
                  </p>
                  <ul className="list-disc list-inside space-y-1.5">
                    <li><strong>Increase bed temperature by 5–10°C</strong> to keep the base of the print warm longer</li>
                    <li><strong>Slow first-layer speed to 20–25 mm/s</strong> for better adhesion</li>
                    <li><strong>Use an enclosure</strong> for ABS, ASA, Nylon, and PC — these materials warp severely without one</li>
                    <li><strong>Add a brim</strong> (8–10mm wide) to increase the contact area with the build plate</li>
                    <li><strong>Check bed surface:</strong> PEI sheets, glass with glue stick, or textured PEI provide different adhesion characteristics</li>
                    <li><strong>Reduce cooling fan for the first 3–5 layers</strong> to prevent premature cooling of the base</li>
                    <li><strong>Level the bed:</strong> An unlevel bed causes inconsistent first-layer squish, leading to one corner lifting</li>
                  </ul>
                </div>
              </CollapsibleSection>

              <CollapsibleSection title="🕸️ Stringing vs. Under-Extrusion — Temperature Diagnosis">
                <div className="text-sm text-muted-foreground leading-relaxed space-y-3">
                  <p>
                    Stringing and under-extrusion are opposite ends of the temperature spectrum. Here's how to tell them apart and fix each one:
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="rounded-lg border border-border p-4">
                      <h4 className="font-semibold text-foreground mb-2">Stringing (Too Hot)</h4>
                      <p className="text-xs mb-2">Thin threads of filament stretched between parts of your print during travel moves.</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Lower nozzle temp by 5–10°C</li>
                        <li>Increase retraction distance (0.5–1mm direct drive, 3–6mm Bowden)</li>
                        <li>Increase retraction speed to 25–45 mm/s</li>
                        <li>Enable "wipe" in your slicer</li>
                        <li>Increase travel speed to 150+ mm/s</li>
                      </ul>
                    </div>
                    <div className="rounded-lg border border-border p-4">
                      <h4 className="font-semibold text-foreground mb-2">Under-Extrusion (Too Cold)</h4>
                      <p className="text-xs mb-2">Gaps in walls, thin/missing layers, inconsistent extrusion width.</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Raise nozzle temp by 5–10°C</li>
                        <li>Reduce print speed by 20%</li>
                        <li>Check for partial nozzle clog (cold pull)</li>
                        <li>Verify extruder tension and gear condition</li>
                        <li>Ensure filament isn't tangled on the spool</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </CollapsibleSection>
            </div>
          </section>

          {/* ================================================================ */}
          {/* NEW SECTION: Advanced Temperature Optimization                    */}
          {/* ================================================================ */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Advanced Temperature Optimization</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Once you have basic temperature settings dialed in, these advanced techniques will help you get the best possible results for specific use cases like strong functional parts, beautiful surface finishes, or high-speed printing.
            </p>

            {/* Temperature Tower Tutorial */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-6 mb-6">
              <h3 className="text-xl font-bold mb-3">How to Print a Temperature Tower — Step-by-Step</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                A temperature tower is the single most important calibration print for any new filament. It's a model printed at different nozzle temperatures in stacked sections, letting you visually compare the effects of each temperature on print quality.
              </p>
              <ol className="space-y-4 text-sm text-muted-foreground">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">1</span>
                  <div>
                    <strong className="text-foreground">Get a temperature tower model.</strong>{' '}
                    OrcaSlicer has a built-in calibration tool under Calibration → Temperature. Cura has a similar plugin. PrusaSlicer users can download STLs from Printables.com and add temperature-change G-code at each section height.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">2</span>
                  <div>
                    <strong className="text-foreground">Set the temperature range.</strong>{' '}
                    Use the full recommended range for your filament. For PLA, that's typically 190–220°C in 5°C steps. Start at the highest temperature at the bottom of the tower (it prints first) and decrease as you go up.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">3</span>
                  <div>
                    <strong className="text-foreground">Print with your normal settings.</strong>{' '}
                    Don't change any other parameters — speed, flow rate, layer height should all be your defaults. You want to isolate temperature as the only variable.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">4</span>
                  <div>
                    <strong className="text-foreground">Evaluate each section.</strong>{' '}
                    Look for: stringing between the towers, bridging sag, overhang quality, layer visibility, and surface smoothness. Try to snap each section — the one with the best layer adhesion that still looks clean is your target.
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">5</span>
                  <div>
                    <strong className="text-foreground">Fine-tune (optional).</strong>{' '}
                    If the best section was at 210°C, run a second tower from 207–213°C in 2°C steps for precision. Write the optimal temperature on the spool with a marker for future reference.
                  </div>
                </li>
              </ol>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold mb-3">Print Speed vs. Temperature Tradeoffs</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Higher print speeds demand higher nozzle temperatures. When you increase speed, filament spends less time in the melt zone. If the temperature is too low for the speed, you'll see:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Under-extrusion and gaps in walls</li>
                  <li>Poor layer adhesion (weak parts)</li>
                  <li>Extruder skipping/grinding</li>
                </ul>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  <strong>Rule of thumb:</strong> For every 50% speed increase, raise nozzle temp by 5–10°C. High-speed printers (Bambu Lab, Creality K-series) run PLA at 220–240°C for 200+ mm/s speeds.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold mb-3">Layer Height & Temperature Adjustments</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Thicker layers require more heat to melt and bond properly. When printing at 0.28mm or 0.32mm layer heights (for fast, rough prints), increase nozzle temperature by 5°C compared to your standard 0.20mm setting.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Conversely, very thin layers (0.08–0.12mm for high detail) benefit from 5°C lower temps. The smaller volume of plastic per layer needs less heat to fully melt, and lower temps reduce oozing artifacts that become more visible at fine resolutions.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold mb-3">Ambient Temperature & Seasonal Effects</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  Your room temperature directly affects print quality. In winter (cold rooms below 18°C), you may need to:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Increase bed temperature by 5–10°C for adhesion</li>
                  <li>Use an enclosure even for materials that don't normally need one</li>
                  <li>Raise nozzle temperature by 5°C to compensate for faster cooling</li>
                </ul>
                <p className="text-sm text-muted-foreground leading-relaxed mt-3">
                  In summer (rooms above 30°C), PLA becomes difficult to print as heat creep causes jams. Lower nozzle temp by 5°C, ensure the hotend's cooling fan runs at 100%, and consider air conditioning the print room.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold mb-3">Per-Material Optimization Tips</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>PLA:</strong> Prioritize cooling. 100% fan, lower end of temp range for detail work, higher end for strength.<br />
                  <strong>PETG:</strong> Reduce fan to 30–50%. Drop flow to 95–97% if stringing. Avoid Z-hop (causes more stringing).<br />
                  <strong>ABS:</strong> Enclosure is non-negotiable. Stabilize chamber at 45–60°C. Zero fan for first 10 layers, then 10–20% max.<br />
                  <strong>TPU:</strong> Slow and hot. Direct drive required. Retraction under 2mm. Higher temps (240°C+) improve layer bonding.<br />
                  <strong>Nylon:</strong> Dry thoroughly (80°C, 8–12 hours). Print from dry box. Use PVA glue stick on build plate.
                </p>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* NEW SECTION: Printer-Specific Considerations                     */}
          {/* ================================================================ */}
          <section>
            <h2 className="text-2xl font-bold mb-4">Printer-Specific Temperature Considerations</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Not all printers handle temperature the same way. Your printer's hardware — extruder type, hotend design, and enclosure — directly
              affects which temperatures work and which materials you can print.
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold mb-2">Bowden vs. Direct Drive Extruders</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>Bowden extruders</strong> (motor mounted on frame, long PTFE tube to hotend) need 3–6mm retraction and slightly higher temperatures because
                  the filament path is longer and has more friction. They struggle with flexible filaments like TPU.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  <strong>Direct drive extruders</strong> (motor mounted on printhead) need only 0.5–2mm retraction and handle flexibles well. Temperature
                  requirements are similar, but the shorter filament path means more responsive extrusion.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold mb-2">All-Metal vs. PTFE-Lined Hotends</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>PTFE-lined hotends</strong> have a PTFE tube extending into the heat break. Maximum safe temperature: <strong>240°C</strong>.
                  Above this, PTFE releases toxic fumes and degrades. Limited to PLA, PETG, and TPU.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  <strong>All-metal hotends</strong> replace PTFE with a metal heat break, supporting temperatures up to <strong>300°C+</strong>.
                  Required for ABS, ASA, Nylon, Polycarbonate, and any engineering filament. Upgrading to all-metal is the single most impactful mod for material versatility.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold mb-2">Enclosed vs. Open-Frame Printers</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>Open-frame printers</strong> (Ender 3, Prusa MK3/MK4) work great for PLA and PETG but struggle with ABS and Nylon due to
                  drafts and rapid cooling. Adding a simple enclosure (even a cardboard box or IKEA LACK enclosure) dramatically improves results.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed mt-2">
                  <strong>Enclosed printers</strong> (Bambu Lab X1C, Voron 2.4, Prusa Enclosure) maintain stable ambient temperatures of 40–60°C, essential
                  for ABS, ASA, Nylon, and PC. Heated chamber printers (Voron with chamber heater) enable PEEK and PEI at 80–120°C ambient.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold mb-2">Heated Chamber Effects</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A heated chamber goes beyond a basic enclosure. It actively heats the build volume to a controlled temperature, providing:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                  <li>Virtually zero warping on ABS/ASA/Nylon</li>
                  <li>Better layer adhesion throughout the print</li>
                  <li>Required for PEEK (80°C+ chamber) and PEI (120°C+ chamber)</li>
                  <li>Consistent mechanical properties across the entire part</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold mb-2">Firmware Thermal Protection</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Modern firmware includes thermal protection features that you should <strong>never disable</strong>:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                  <li><strong>Thermal runaway detection:</strong> Shuts down if temp drops unexpectedly (heater failure) or rises uncontrollably (MOSFET stuck on)</li>
                  <li><strong>Maximum temperature limits:</strong> Prevents setting temps beyond safe limits for your hotend</li>
                  <li><strong>PID autotuning:</strong> Optimizes heating algorithm for stable, accurate temperature control</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <h3 className="font-semibold mb-2">High-Speed Printer Considerations</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  High-speed printers (Bambu Lab, Creality K-series, Qidi) print at 200–500 mm/s using high-flow hotends that can melt 30–50 mm³/s of filament.
                  These printers need:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2">
                  <li>Higher nozzle temps (PLA at 220–240°C, PETG at 250–260°C)</li>
                  <li>Special high-flow nozzles with larger melt zones</li>
                  <li>Input shaping to handle vibrations at speed</li>
                  <li>Powerful part cooling to handle the faster extrusion rate</li>
                </ul>
              </div>
            </div>
          </section>

          {/* ================================================================ */}
          {/* NEW SECTION: Temperature vs Material Properties                   */}
          {/* ================================================================ */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How Temperature Affects Print Properties</h2>
            <p className="text-muted-foreground leading-relaxed mb-6">
              Temperature doesn't just determine whether your print succeeds or fails — it directly controls the mechanical and visual properties
              of the finished part. Understanding these relationships helps you tune temperature for your specific application.
            </p>

            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border p-4 bg-card/50">
                  <h3 className="font-semibold text-sm mb-2">Layer Adhesion (Inter-Layer Bonding)</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Higher nozzle temperatures improve layer adhesion because the new layer partially re-melts the previous one, creating stronger inter-layer bonds.
                    For structural parts where Z-axis strength matters, print at the upper end of the temperature range. Parts printed too cold may snap cleanly along layer lines under stress.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4 bg-card/50">
                  <h3 className="font-semibold text-sm mb-2">Surface Finish</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Moderate temperatures produce the best surface finish. Too hot creates blobbing and shine; too cold creates rough, matte texture with visible layer lines.
                    For display pieces, target the middle of the temperature range and use moderate cooling (50–70% fan for PLA).
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4 bg-card/50">
                  <h3 className="font-semibold text-sm mb-2">Bridging Performance</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bridges (horizontal spans without support) perform best at lower temperatures with maximum cooling. The higher viscosity at lower temps prevents sagging.
                    Use the bottom 25% of the temperature range for models with significant bridging, combined with reduced bridge speed (15–25 mm/s).
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4 bg-card/50">
                  <h3 className="font-semibold text-sm mb-2">Overhang Quality</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Overhangs (printing at an angle without support) benefit from lower nozzle temperatures and maximum cooling fan. The faster the extruded plastic solidifies,
                    the less it droops. Below 45° overhangs are fine at any temperature; 45–60° benefits from lower temps; above 60° typically needs support regardless.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4 bg-card/50">
                  <h3 className="font-semibold text-sm mb-2">Dimensional Accuracy</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Higher temperatures cause more thermal expansion and shrinkage during cooling, reducing dimensional accuracy. For parts that need tight tolerances (gears,
                    snap-fits, assemblies), use the lower end of the temperature range and ensure consistent ambient temperature throughout the print.
                  </p>
                </div>
                <div className="rounded-lg border border-border p-4 bg-card/50">
                  <h3 className="font-semibold text-sm mb-2">Support Material Temperature</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Support structures should bond enough to the model to stay in place, but not so much that they're impossible to remove. Print supports 5–10°C cooler
                    than the model material. For dissolvable supports (PVA, BVOH), use the manufacturer's recommended temperature exactly — too hot causes them to bond permanently.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How to Read This Chart */}
          <section>
            <h2 className="text-2xl font-bold mb-4">How to Read This Temperature Chart</h2>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Thermometer className="w-5 h-5 text-red-400" />
                  <h3 className="font-semibold">Nozzle Temperature</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The hotend temperature at which the filament melts and is extruded. Start at the midpoint of the range shown in the chart,
                  then adjust in 5°C increments based on print quality. The red bars show the range visually so you can compare materials at a glance.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <ThermometerSun className="w-5 h-5 text-amber-400" />
                  <h3 className="font-semibold">Bed Temperature</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The heated build plate temperature for first-layer adhesion. Too low causes prints to pop off mid-print; too high makes them
                  fuse permanently to the bed. The amber bars show the relative range for easy comparison across material types.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-5 h-5 text-blue-400" />
                  <h3 className="font-semibold">Print Speed</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  The recommended speed range in millimeters per second. Flexible filaments require much slower speeds than rigid materials.
                  Higher speeds may require slightly higher nozzle temperatures to maintain proper melt flow.
                </p>
              </div>
              <div className="rounded-lg border border-border p-5 bg-card/50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <h3 className="font-semibold">Enclosure Requirement</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Whether the material needs an enclosed build chamber. Required means the material will warp or delaminate without one.
                  Recommended means it helps with consistency but is not strictly necessary. PLA should not be enclosed.
                </p>
              </div>
            </div>
          </section>

          {/* Visual Temperature Map */}
          <section>
            <h2 className="text-2xl font-bold mb-2">Temperature Comparison by Category</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Side-by-side nozzle temperature ranges grouped by category. Engineering and high-temperature materials
              require significantly hotter nozzles than standard materials.
            </p>
            <div className="space-y-6">
              {CATEGORIES.map(cat => {
                const items = FILAMENT_DATA.filter(f => f.category === cat);
                return (
                  <Card key={cat} className="border-border">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Badge variant="outline" className={CATEGORY_COLORS[cat]}>{cat}</Badge>
                        <span className="text-muted-foreground font-normal">{items.length} material{items.length !== 1 ? 's' : ''}</span>
                      </h3>
                      <div className="space-y-2">
                        {items.map(item => (
                          <div key={item.material} className="flex items-center gap-3">
                            <span className="text-xs font-medium w-[130px] shrink-0 truncate text-muted-foreground">{item.material}</span>
                            <div className="flex-1">
                              <TempBar min={item.nozzleMin} max={item.nozzleMax} globalMin={nozzleGlobalMin} globalMax={nozzleGlobalMax} color="bg-red-500/40" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Related Links */}
          <section className="bg-muted/30 rounded-xl p-6 border border-border">
            <h2 className="text-lg font-semibold mb-4">Related Guides & Tools</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { to: '/guides/filament-temperature-guide', label: 'Filament Temperature Guide (in-depth)' },
                { to: '/filaments', label: 'Browse 21,000+ filaments with brand-specific temps' },
                { to: '/colors', label: 'Filament Color Finder — match any color' },
                { to: '/guides/best-pla-filaments', label: 'Best PLA Filaments 2026' },
                { to: '/guides/pla-vs-petg', label: 'PLA vs PETG Comparison' },
                { to: '/guides/petg-vs-tpu', label: 'PETG vs TPU — which to choose?' },
                { to: '/guides/tpu-vs-petg', label: 'TPU vs PETG Comparison' },
                { to: '/hueforge-td-database', label: 'HueForge TD Database' },
                { to: '/matrix', label: 'Printer\u2013Filament Compatibility Matrix' },
                { to: '/compare', label: 'Compare filaments side by side' },
                { to: '/guides/how-to-choose-3d-printer-filament', label: 'How to Choose 3D Printer Filament' },
                { to: '/guides/3d-printer-filament-types-explained', label: 'Filament Types Explained' },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors">
                  <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0" />
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <FAQSection faqs={FAQS} />
        </div>
      </div>
    </>
  );
}
