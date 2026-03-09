import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { ItemListSchema } from "@/components/seo/ItemListSchema";
import { ArticleSchema } from "@/components/seo/ArticleSchema";
import { DefinedTermSetSchema } from "@/components/seo/DefinedTermSetSchema";
import { PageLoadingSkeleton } from "@/components/skeletons/PageLoadingSkeleton";
import { FilamentCard } from "@/components/FilamentCard";
import { Thermometer, Scale, Tag, Layers, Wind, Droplets, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { getMaterialReference } from "@/lib/materialReferenceData";
import { MaterialBrandComparisonTable } from "@/components/filament/MaterialBrandComparisonTable";
import { RelatedSearchesSection } from "@/components/seo/RelatedSearchesSection";
import { slugToMaterialName, slugToMaterialNames } from "@/lib/materialSlugUtils";

// ──────────────────────────────────────────────────────────────
// Slug → DB materials mapping
// ──────────────────────────────────────────────────────────────
interface SlugConfig {
  label: string;
  materials: string[];
  ilike?: string;
  relatedSlugs: string[];
  relatedMaterials: string[];
  guides: { label: string; href: string }[];
  /** Popular color family slugs for this material (links to /colors/:slug) */
  colorSlugs?: string[];
}

export const MATERIAL_SLUG_CONFIG: Record<string, SlugConfig> = {
  pla: {
    label: "PLA",
    materials: ["PLA", "PLA+", "PLA-HS", "HTPLA", "PLA Pro", "PLA-CF", "Matte PLA", "Marble PLA", "Wood PLA", "Rainbow PLA"],
    relatedSlugs: ["petg", "abs", "silk-pla", "pla-plus"],
    relatedMaterials: ["PETG", "ABS", "Silk PLA", "PLA+"],
    colorSlugs: ["white", "black", "grey", "blue", "red", "transparent"],
    guides: [
      { label: "Best PLA Filaments", href: "/guides/best-pla-filaments" },
      { label: "PLA vs PETG", href: "/guides/pla-vs-petg" },
      { label: "PLA+ vs PLA Pro", href: "/guides/pla-plus-vs-pla-pro" },
    ],
  },
  petg: {
    label: "PETG",
    materials: ["PETG", "PCTG", "PETG-CF", "PETG+", "Co-Polyester"],
    relatedSlugs: ["pla", "abs", "asa"],
    relatedMaterials: ["PLA", "ABS", "ASA"],
    colorSlugs: ["white", "black", "clear", "blue", "red"],
    guides: [
      { label: "Best PETG Filaments", href: "/guides/best-petg-filaments" },
      { label: "PLA vs PETG", href: "/guides/pla-vs-petg" },
    ],
  },
  abs: {
    label: "ABS",
    materials: ["ABS", "ABS+", "ABS-CF", "ABS Pro"],
    relatedSlugs: ["asa", "petg", "pc"],
    relatedMaterials: ["ASA", "PETG", "PC"],
    colorSlugs: ["black", "white", "grey", "red"],
    guides: [
      { label: "Best ABS Filaments", href: "/guides/best-abs-filaments" },
      { label: "ASA vs ABS Outdoor Printing", href: "/guides/asa-vs-abs-outdoor-printing" },
    ],
  },
  asa: {
    label: "ASA",
    materials: ["ASA", "ASA+", "ASA-CF"],
    relatedSlugs: ["abs", "petg", "pla"],
    relatedMaterials: ["ABS", "PETG", "PLA"],
    colorSlugs: ["black", "white", "grey"],
    guides: [
      { label: "ASA vs ABS for Outdoor Printing", href: "/guides/asa-vs-abs-outdoor-printing" },
    ],
  },
  tpu: {
    label: "TPU",
    materials: ["TPU", "TPU-95A", "TPU-98A", "TPE", "Flexible"],
    relatedSlugs: ["pla", "petg", "nylon"],
    relatedMaterials: ["PLA", "PETG", "Nylon"],
    colorSlugs: ["black", "white", "blue", "red"],
    guides: [],
  },
  "pla-plus": {
    label: "PLA+",
    materials: ["PLA+", "PLA Pro", "PLA-HS"],
    relatedSlugs: ["pla", "petg"],
    relatedMaterials: ["PLA", "PETG"],
    colorSlugs: ["white", "black", "grey", "blue"],
    guides: [
      { label: "PLA+ vs PLA Pro", href: "/guides/pla-plus-vs-pla-pro" },
    ],
  },
  "silk-pla": {
    label: "Silk PLA",
    materials: ["Silk PLA", "Silk PLA+", "Silk"],
    ilike: "%silk%",
    relatedSlugs: ["pla", "pla-plus"],
    relatedMaterials: ["PLA", "PLA+"],
    colorSlugs: ["gold", "silver", "blue", "red"],
    guides: [
      { label: "Silk PLA Comparison", href: "/guides/silk-pla-comparison" },
    ],
  },
  nylon: {
    label: "Nylon",
    materials: ["PA", "PA-CF", "PA-GF", "PA6", "PA12", "Nylon", "Nylon-CF"],
    relatedSlugs: ["petg", "pc", "abs"],
    relatedMaterials: ["PETG", "PC", "ABS"],
    colorSlugs: ["black", "white", "natural"],
    guides: [],
  },
  pc: {
    label: "PC",
    materials: ["PC", "PC-CF", "PC-ABS", "PCTG", "Polycarbonate"],
    relatedSlugs: ["abs", "asa", "nylon"],
    relatedMaterials: ["ABS", "ASA", "Nylon"],
    colorSlugs: ["clear", "black", "white"],
    guides: [],
  },
  polycarbonate: {
    label: "PC",
    materials: ["PC", "PC-CF", "PC-ABS", "PCTG", "Polycarbonate"],
    relatedSlugs: ["abs", "asa", "nylon"],
    relatedMaterials: ["ABS", "ASA", "Nylon"],
    colorSlugs: ["clear", "black", "white"],
    guides: [],
  },
  "high-speed-pla": {
    label: "High Speed PLA",
    materials: ["PLA-HS", "PLA High Speed", "High Speed PLA", "Premium PLA High Speed"],
    relatedSlugs: ["pla", "pla-plus", "petg"],
    relatedMaterials: ["PLA", "PLA+", "PETG"],
    colorSlugs: ["white", "black", "grey"],
    guides: [],
  },
  "petg-cf": {
    label: "PETG-CF",
    materials: ["PETG-CF", "PETG-GF", "Carbon Fiber PETG"],
    relatedSlugs: ["petg", "abs", "nylon"],
    relatedMaterials: ["PETG", "ABS", "Nylon"],
    colorSlugs: ["black", "dark-grey"],
    guides: [],
  },
  wood: {
    label: "Wood PLA",
    materials: ["Wood PLA", "Wood Fill", "Wood Filled PLA", "PLA-Wood", "Woodfill", "Wood Filament"],
    ilike: "%wood%",
    relatedSlugs: ["pla", "silk-pla", "pla-plus"],
    relatedMaterials: ["PLA", "Silk PLA", "PLA+"],
    colorSlugs: [],
    guides: [
      { label: "Best Wood PLA Filaments", href: "/guides/best-wood-pla-filaments" },
    ],
  },
  "carbon-fiber": {
    label: "Carbon Fiber",
    materials: ["PLA-CF", "PETG-CF", "ABS-CF", "ASA-CF", "PA-CF", "Nylon-CF", "Carbon Fiber PLA", "Carbon Fiber PETG", "Carbon Fiber Nylon", "Carbon Fiber ABS"],
    ilike: "%carbon%",
    relatedSlugs: ["petg-cf", "nylon", "petg", "abs"],
    relatedMaterials: ["PETG-CF", "Nylon", "PETG", "ABS"],
    colorSlugs: ["black"],
    guides: [
      { label: "Best Carbon Fiber Filaments", href: "/guides/best-carbon-fiber-filaments" },
    ],
  },
  "glow-in-the-dark": {
    label: "Glow in the Dark",
    materials: ["Glow in the Dark PLA", "Glow PLA", "Photoluminescent PLA", "Glow in Dark"],
    ilike: "%glow%",
    relatedSlugs: ["silk-pla", "pla", "pla-plus"],
    relatedMaterials: ["Silk PLA", "PLA", "PLA+"],
    colorSlugs: ["green", "blue", "yellow"],
    guides: [],
  },
};

// ──────────────────────────────────────────────────────────────
// Build dynamic config for slugs not in MATERIAL_SLUG_CONFIG
// ──────────────────────────────────────────────────────────────
function buildDynamicConfig(slug: string): SlugConfig | null {
  const names = slugToMaterialNames(slug);
  if (names.length === 0) return null;
  const materialName = slugToMaterialName(slug);
  return {
    label: materialName || names[0],
    materials: names,
    relatedSlugs: [],
    relatedMaterials: [],
    guides: [],
  };
}

// ──────────────────────────────────────────────────────────────
// Enhanced FAQ helper with material-specific questions
// ──────────────────────────────────────────────────────────────
function getMaterialFAQs(slug: string, label: string, count: number, brandCount: number, reference: any): { question: string; answer: string }[] {
  const isPlaFamily = slug === "pla" || slug === "pla-plus" || slug === "silk-pla" || slug === "high-speed-pla";

  const nozzleTemp = reference?.printSettings?.nozzleTemp
    ? `${reference.printSettings.nozzleTemp.min}–${reference.printSettings.nozzleTemp.max}°C`
    : null;
  const bedTemp = reference?.printSettings?.bedTemp
    ? `${reference.printSettings.bedTemp.min}–${reference.printSettings.bedTemp.max}°C`
    : null;
  const tempStr = nozzleTemp ? `Print at ${nozzleTemp} nozzle${bedTemp ? ` and ${bedTemp} bed` : ""}.` : "";

  const matFaqs: Record<string, { question: string; answer: string }[]> = {
    pla: [
      {
        question: "What temperature should I print PLA filament at?",
        answer: `PLA filament prints best at a nozzle temperature of 190–220°C and bed temperature of 35–60°C. Use 100% cooling fan speed. PLA does not require an enclosed printer. Start at 205°C nozzle and 50°C bed, then adjust for your specific filament brand.`,
      },
      {
        question: "Is PLA filament good for HueForge lithophanes?",
        answer: `Yes, PLA is the most popular material for HueForge lithophanes. Standard PLA has TD values ranging from 0.5–6.0mm, giving excellent control over light transmission. Based on FilaScope's HueForge TD database, which tracks transmission distance values for 500+ filaments, you can find the perfect PLA match for your HueForge project.`,
      },
      {
        question: "What are the strengths of PLA filament?",
        answer: `PLA is biodegradable, has low warping, produces a pleasant smell when printing, and offers excellent detail reproduction. It's the easiest material to print with — no heated bed required (though recommended), no enclosure needed, and a wide color selection available.`,
      },
      {
        question: "Can PLA parts be used outdoors?",
        answer: `PLA is not recommended for outdoor use. It has poor UV resistance and a low heat deflection temperature (~60°C), meaning it can soften and deform in direct sunlight. For outdoor applications, consider ASA or PETG instead.`,
      },
      {
        question: "Is PLA food safe for 3D printing?",
        answer: `While PLA is derived from plant-based materials and is technically food-safe as a raw material, 3D printed PLA objects are generally NOT considered food safe. The layer lines create microscopic gaps where bacteria can grow, and many PLA filaments contain additives and colorants that are not food-grade.`,
      },
      {
        question: "How do I store PLA filament properly?",
        answer: `PLA is hygroscopic and absorbs moisture from the air. Store PLA filament in airtight containers or vacuum-sealed bags with desiccant packets. If PLA becomes brittle or produces popping sounds during printing, dry it at 40–50°C for 4–6 hours before use.`,
      },
      {
        question: "What is the difference between PLA and PLA+?",
        answer: `PLA+ (also called PLA Pro) is a modified PLA with improved impact resistance and flexibility. It's slightly tougher than standard PLA while maintaining similar ease of printing. PLA+ typically has a slightly higher price point. Compare PLA and PLA+ filaments side by side on FilaScope.`,
      },
      {
        question: `How many PLA filaments does FilaScope track?`,
        answer: `According to FilaScope's database of ${count.toLocaleString()} PLA filaments from ${brandCount}+ brands, real-time pricing is tracked from 15+ retailers. We also track HueForge TD values for PLA filaments to help with lithophane and color mixing projects.`,
      },
    ],
    petg: [
      {
        question: "What temperature should I print PETG filament at?",
        answer: `PETG filament typically prints at 230–250°C nozzle temperature and 70–85°C bed temperature. ${tempStr} An enclosure is not required but helps with consistency. Use a PEI or glass bed for best adhesion.`,
      },
      {
        question: "Why does PETG stick too strongly to the print bed?",
        answer: `PETG adheres extremely well to PEI sheets and can rip the coating on removal. Use a thin layer of glue stick, hairspray, or Windex on PEI to create a release layer. This prevents PETG from over-adhering and damaging your build plate.`,
      },
      {
        question: "Is PETG stronger than PLA?",
        answer: `PETG is more impact-resistant and has better layer adhesion than PLA. PLA is stiffer (higher tensile modulus) but more brittle. PETG handles repeated stress and flexing better, making it preferred for functional mechanical parts.`,
      },
      {
        question: "Can PETG be used outdoors?",
        answer: `PETG has better UV resistance than PLA but is not ideal for prolonged outdoor use. For outdoor applications in direct sunlight or extreme temperatures, ASA is the recommended material due to its excellent UV stability.`,
      },
      {
        question: "Why does my PETG string so much?",
        answer: `PETG is prone to stringing due to its high viscosity and oozing. Increase retraction settings (4–6mm for Bowden, 1–2mm for direct drive), lower temperature by 5°C, and enable coasting in your slicer. Drying wet filament also significantly reduces stringing.`,
      },
      {
        question: `How many PETG filaments does FilaScope track?`,
        answer: `According to FilaScope's database, it tracks ${count.toLocaleString()} PETG filaments from ${brandCount}+ brands with real-time pricing across 15+ stores.`,
      },
    ],
    abs: [
      {
        question: "Do I need an enclosure to print ABS filament?",
        answer: `Yes, an enclosure is highly recommended for ABS. It maintains consistent chamber temperature (40–50°C), prevents warping from thermal shock, and reduces styrene fume emissions. Even a simple cardboard enclosure significantly improves print success.`,
      },
      {
        question: "What temperature does ABS filament print at?",
        answer: `ABS filament typically prints at 220–260°C nozzle temperature and 100–110°C bed temperature. ${tempStr} Higher nozzle temps (240–260°C) improve layer adhesion. An enclosed printer with a heated chamber is strongly recommended.`,
      },
      {
        question: "Is ABS safe to print at home?",
        answer: `ABS emits styrene fumes and ultrafine particles when printing. Always print ABS in a well-ventilated area or in an enclosed printer with a HEPA/activated-carbon filtration system. Avoid prolonged exposure, especially in small rooms.`,
      },
      {
        question: "Why does my ABS keep warping?",
        answer: `ABS warping is caused by uneven cooling and thermal stress. Solutions: use an enclosure, increase bed temperature to 100–110°C, use ABS slurry or glue stick for adhesion, add a brim to small parts, and ensure no drafts hit the print. Draft shields in your slicer also help.`,
      },
      {
        question: "Can ABS be post-processed with acetone?",
        answer: `Yes — acetone smoothing is one of ABS's best features. Exposure to acetone vapors melts the outer layer slightly, creating a glossy, smooth surface and strengthening the part. ABS can also be acetone-welded and machined, drilled, or threaded.`,
      },
      {
        question: `How many ABS filaments does FilaScope track?`,
        answer: `According to FilaScope's database, it tracks ${count.toLocaleString()} ABS filaments from ${brandCount}+ brands with real-time pricing across 15+ stores.`,
      },
    ],
    asa: [
      {
        question: "What makes ASA better than ABS for outdoor use?",
        answer: `ASA has significantly better UV resistance than ABS — it won't yellow, become brittle, or degrade in direct sunlight. ASA is ideal for outdoor functional parts like enclosures, car parts, brackets, and garden hardware. It also has similar mechanical properties to ABS.`,
      },
      {
        question: "What temperature does ASA filament print at?",
        answer: `ASA typically prints at 230–260°C nozzle and 90–110°C bed temperature. ${tempStr} An enclosure is strongly recommended to prevent warping. ASA has slightly more warping than ABS and benefits from a draft shield.`,
      },
      {
        question: "Do I need an enclosure for ASA?",
        answer: `Yes — ASA warps significantly without an enclosure. A heated chamber of 40–50°C is recommended. ASA also emits fumes similar to ABS, so ensure good ventilation or use an enclosed printer with a filtration system.`,
      },
      {
        question: `How many ASA filaments does FilaScope track?`,
        answer: `According to FilaScope's database, it tracks ${count.toLocaleString()} ASA filaments from ${brandCount}+ brands with real-time pricing across 15+ stores.`,
      },
    ],
    tpu: [
      {
        question: "What print speed should I use for TPU filament?",
        answer: `Print TPU slowly — typically 15–30mm/s. Faster speeds cause the flexible filament to buckle and jam, especially in Bowden tube setups. Direct drive extruders handle TPU significantly better than Bowden systems. Start slow and increase only if needed.`,
      },
      {
        question: "Should I use retraction with TPU?",
        answer: `Minimize or completely disable retraction for TPU. Flexible filaments compress and buckle in retraction, causing jams and blobs. If retraction is needed, use very short distances (0.5–2mm) at low speed. Coasting in your slicer can help reduce oozing instead.`,
      },
      {
        question: "What is the difference between TPU 85A, 90A, and 95A?",
        answer: `Shore hardness indicates flexibility: 85A is softer (very flexible), 90A is medium-flex, and 95A is semi-rigid. Softer TPU is harder to print but more elastic. 95A is the most common and easiest to print while still offering good flexibility and durability.`,
      },
      {
        question: `How many TPU filaments does FilaScope track?`,
        answer: `According to FilaScope's database, it tracks ${count.toLocaleString()} TPU and flexible filaments from ${brandCount}+ brands with real-time pricing across 15+ stores.`,
      },
    ],
    nylon: [
      {
        question: "Why do my nylon prints come out weak?",
        answer: `Nylon is highly hygroscopic and absorbs moisture rapidly from air. Wet nylon produces weak, brittle prints with visible bubbling, popping sounds, and poor layer adhesion. Always dry nylon at 70–80°C for 4–6 hours before printing, even with freshly opened spools.`,
      },
      {
        question: "What temperature does nylon filament print at?",
        answer: `Nylon typically prints at 230–270°C nozzle and 70–90°C bed temperature. ${tempStr} An enclosure is strongly recommended to prevent warping and maintain consistent temperatures.`,
      },
      {
        question: "What bed surface works best for nylon?",
        answer: `Nylon adheres best to Garolite (G10) sheets, glue stick on glass, or specialized adhesives like Magigoo PA. Standard PEI often provides insufficient adhesion for nylon. Some nylon formulas also work well with hairspray on glass.`,
      },
      {
        question: `How many nylon filaments does FilaScope track?`,
        answer: `According to FilaScope's database, it tracks ${count.toLocaleString()} nylon and PA filaments from ${brandCount}+ brands with real-time pricing across 15+ stores.`,
      },
    ],
    pc: [
      {
        question: "What temperature does polycarbonate filament print at?",
        answer: `Polycarbonate requires 260–310°C nozzle and 100–120°C bed temperature. ${tempStr} An all-metal hotend is essential — PTFE-lined hotends cannot safely reach these temperatures. A fully enclosed heated chamber is strongly recommended.`,
      },
      {
        question: "Why is polycarbonate so difficult to print?",
        answer: `PC warps severely, requires extreme temperatures, and is highly hygroscopic. Always dry PC at 80–90°C for 4–8 hours before printing. Use a fully enclosed printer, all-metal hotend, and hardened nozzle for CF-filled variants. Chamber temps of 50–80°C significantly improve results.`,
      },
      {
        question: `How many PC filaments does FilaScope track?`,
        answer: `According to FilaScope's database, it tracks ${count.toLocaleString()} polycarbonate filaments from ${brandCount}+ brands with real-time pricing across 15+ stores.`,
      },
    ],
    "pla-plus": [
      {
        question: "Is PLA+ actually stronger than PLA?",
        answer: `PLA+ typically offers higher impact resistance and reduced brittleness vs standard PLA, but the improvement varies significantly by brand. Many PLA+ products have 20–30% better impact strength. Check the FilaScope specs comparison for actual tensile data per brand.`,
      },
      {
        question: "What temperature should I print PLA+ at?",
        answer: `PLA+ generally prints 5–10°C hotter than standard PLA. Most brands recommend 205–230°C nozzle and 55–65°C bed. ${tempStr} Check your brand's specific datasheet as formulations vary considerably.`,
      },
      {
        question: "Is PLA+ good for HueForge?",
        answer: `PLA+ works for HueForge, though its TD values can differ from standard PLA. Based on FilaScope's HueForge TD database, which tracks transmission distance values for 500+ filaments, you can find accurate TD values for PLA+ to build precise HueForge profiles.`,
      },
      {
        question: `How many PLA+ filaments does FilaScope track?`,
        answer: `According to FilaScope's database, it tracks ${count.toLocaleString()} PLA+ filaments from ${brandCount}+ brands with real-time pricing across 15+ stores.`,
      },
    ],
    "silk-pla": [
      {
        question: "Why does my silk PLA look dull?",
        answer: `Silk PLA needs a slightly higher print temperature (215–230°C) for best sheen. Slow down outer wall speed to 30–40mm/s and reduce cooling fan to 50–80% for a more glossy finish. Very high fan speeds or low temps prevent the material from developing its characteristic shimmer.`,
      },
      {
        question: "Is silk PLA good for HueForge lithophanes?",
        answer: `Yes — silk PLA typically has high TD values (often 5.0+mm), making it highly translucent. It's excellent for highlight and accent layers in HueForge stacks. Based on FilaScope's HueForge TD database, which tracks transmission distance values for 500+ filaments, you can find precise silk PLA TD values for HueForge profiling.`,
      },
      {
        question: "Can silk PLA be used for functional parts?",
        answer: `Silk PLA is primarily aesthetic. It's slightly more brittle than standard PLA due to its additive formulation and not ideal for load-bearing or structural applications. Use standard PLA or PLA+ for functional parts.`,
      },
      {
        question: `How many silk PLA filaments does FilaScope track?`,
        answer: `According to FilaScope's database, it tracks ${count.toLocaleString()} silk PLA filaments from ${brandCount}+ brands with real-time pricing and TD values across 15+ stores.`,
      },
    ],
    "high-speed-pla": [
      {
        question: "What makes high-speed PLA different from regular PLA?",
        answer: `High-speed PLA is formulated with additives that allow printing at 200–600mm/s without significant quality loss. It maintains better flow at high speeds and bonds well at faster print speeds. It's optimized for modern fast printers like Bambu Lab X1/P1 series and Creality K1.`,
      },
      {
        question: "Can I print high-speed PLA on a standard printer?",
        answer: `Yes — high-speed PLA works at regular speeds too. You won't get the speed benefits but quality should be similar to standard PLA. Consider it if you're planning to upgrade to a faster printer in the future.`,
      },
      {
        question: `How many high-speed PLA filaments does FilaScope track?`,
        answer: `According to FilaScope's database, it tracks ${count.toLocaleString()} high-speed PLA filaments from ${brandCount}+ brands with real-time pricing across 15+ stores.`,
      },
    ],
    "petg-cf": [
      {
        question: "Do I need a hardened nozzle for PETG-CF?",
        answer: `Yes — PETG-CF (carbon fiber reinforced PETG) is highly abrasive. Standard brass nozzles will wear out within a few hundred grams. Use hardened steel, ruby, or tungsten carbide nozzles. Stainless steel nozzles are not hard enough for CF composites.`,
      },
      {
        question: "What temperature does PETG-CF print at?",
        answer: `PETG-CF typically prints at 240–260°C nozzle and 70–85°C bed temperature. ${tempStr} An enclosure is not required but helps with layer adhesion. Slow down print speeds slightly vs regular PETG for better mechanical properties.`,
      },
      {
        question: `How many PETG-CF filaments does FilaScope track?`,
        answer: `According to FilaScope's database, it tracks ${count.toLocaleString()} PETG-CF filaments from ${brandCount}+ brands with real-time pricing across 15+ stores.`,
      },
    ],
  };

  const base = [
    {
      question: `How should I store ${label} filament?`,
      answer: `Store ${label} filament in a cool, dry place away from direct sunlight. Use an airtight container with desiccant packets (silica gel) to prevent moisture absorption.${isPlaFamily ? " While PLA is less sensitive than engineering materials, proper storage significantly extends shelf life and print quality." : " This material is particularly hygroscopic — always re-seal immediately after use and consider a dry box for active printing."}`,
    },
    {
      question: `What nozzle should I use for ${label}?`,
      answer: slug === "petg-cf" || label.includes("CF") || label.includes("Carbon Fiber")
        ? `${label} is abrasive and requires a hardened steel, ruby, or tungsten carbide nozzle. Standard brass nozzles will wear out rapidly. Never use brass nozzles with fiber-reinforced composites.`
        : `Standard brass nozzles work well for ${label}. For ${label} variants that include carbon fiber or glass fiber additives, use hardened steel, ruby, or tungsten carbide nozzles to prevent accelerated wear.`,
    },
  ];

  return [...(matFaqs[slug] || []), ...base];
}

// ──────────────────────────────────────────────────────────────
// Knowledge Base Sections — rendered expanded for SEO
// ──────────────────────────────────────────────────────────────

function KBSection({ title, id, children }: { title: string; id: string; children: React.ReactNode }) {
  return (
    <section className="mb-10" aria-labelledby={id}>
      <h2 id={id} className="text-xl font-semibold mb-4 text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function KBSubSection({ title }: { title: string }) {
  return <h3 className="text-base font-semibold mb-2 text-foreground/90">{title}</h3>;
}

function KBList({ items }: { items?: string[] }) {
  if (!items || items.length === 0) return <p className="text-sm text-muted-foreground italic">No data available.</p>;
  return (
    <ul className="space-y-1 mb-4">
      {items.map((item, i) => (
        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/60 flex-shrink-0" />
          {item}
        </li>
      ))}
    </ul>
  );
}

function PrintSettingsSection({ reference, label }: { reference: any; label: string }) {
  const ps = reference.printSettings;
  if (!ps) return null;
  return (
    <KBSection title={`Quick Start — ${label} Print Settings`} id="print-settings-h2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {ps.nozzleTemp && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="w-4 h-4 text-red-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Nozzle Temp</span>
            </div>
            <p className="text-base font-bold text-foreground">{ps.nozzleTemp.min}–{ps.nozzleTemp.max}°C</p>
            {ps.nozzleTemp.optimal && <p className="text-xs text-muted-foreground">Optimal: {ps.nozzleTemp.optimal}°C</p>}
          </div>
        )}
        {ps.bedTemp && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Bed Temp</span>
            </div>
            <p className="text-base font-bold text-foreground">{ps.bedTemp.min}–{ps.bedTemp.max}°C</p>
            {ps.bedTemp.optimal && <p className="text-xs text-muted-foreground">Optimal: {ps.bedTemp.optimal}°C</p>}
          </div>
        )}
        {ps.coolingFan && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <Wind className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Cooling Fan</span>
            </div>
            <p className="text-base font-bold text-foreground">{typeof ps.coolingFan === 'object' ? `${ps.coolingFan.min ?? 0}–${ps.coolingFan.max ?? 100}%` : ps.coolingFan}</p>
          </div>
        )}
        {ps.enclosure !== undefined && (
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Enclosure</span>
            </div>
            <p className="text-base font-bold text-foreground flex items-center gap-1.5">
              {ps.enclosure === false || ps.enclosure === 'not_required'
                ? <><XCircle className="w-4 h-4 text-muted-foreground" /> Not required</>
                : ps.enclosure === true || ps.enclosure === 'required'
                ? <><CheckCircle className="w-4 h-4 text-green-500" /> Required</>
                : <><CheckCircle className="w-4 h-4 text-yellow-500" /> Recommended</>
              }
            </p>
          </div>
        )}
      </div>

      {ps.drying && (
        <div className="mb-4">
          <KBSubSection title="Drying Instructions" />
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-foreground">
                {ps.drying.recommended === false ? `${label} does not typically require drying` : `Dry at ${ps.drying.tempC || '60'}°C for ${ps.drying.hours || '4–8'} hours`}
              </span>
            </div>
            {ps.drying.notes && <p className="text-sm text-muted-foreground">{ps.drying.notes}</p>}
          </div>
        </div>
      )}

      {ps.bedSurfaces && ps.bedSurfaces.length > 0 && (
        <div>
          <KBSubSection title="Bed Surface Compatibility" />
          <div className="flex flex-wrap gap-2">
            {ps.bedSurfaces.map((s: string, i: number) => (
              <span key={i} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium border border-primary/20">{s}</span>
            ))}
          </div>
        </div>
      )}
    </KBSection>
  );
}

function StrengthsSection({ reference, label }: { reference: any; label: string }) {
  const s = reference.strengths;
  if (!s) return null;
  return (
    <KBSection title={`${label} Strengths`} id="strengths-h2">
      {s.uniqueProperties && s.uniqueProperties.length > 0 && (
        <div className="mb-4">
          <KBSubSection title="Unique Properties" />
          <KBList items={s.uniqueProperties} />
        </div>
      )}
      {s.bestUseScenarios && s.bestUseScenarios.length > 0 && (
        <div className="mb-4">
          <KBSubSection title="Best Use Scenarios" />
          <KBList items={s.bestUseScenarios} />
        </div>
      )}
      {s.advantagesOverCompetitors && s.advantagesOverCompetitors.length > 0 && (
        <div className="mb-4">
          <KBSubSection title="Advantages Over Alternatives" />
          <KBList items={s.advantagesOverCompetitors} />
        </div>
      )}
    </KBSection>
  );
}

function WeaknessesSection({ reference, label }: { reference: any; label: string }) {
  const w = reference.weaknesses;
  if (!w) return null;
  return (
    <KBSection title={`${label} Weaknesses`} id="weaknesses-h2">
      {w.limitations && w.limitations.length > 0 && (
        <div className="mb-4">
          <KBSubSection title="Limitations" />
          <KBList items={w.limitations} />
        </div>
      )}
      {w.avoidFor && w.avoidFor.length > 0 && (
        <div className="mb-4">
          <KBSubSection title={`Avoid Using ${label} For`} />
          <KBList items={w.avoidFor} />
        </div>
      )}
    </KBSection>
  );
}

function TechnicalSpecsSection({ reference, label }: { reference: any; label: string }) {
  const tds = reference.technicalData;
  const adhesion = reference.adhesion;
  if (!tds && !adhesion) return null;

  return (
    <KBSection title="Technical Specifications" id="tech-specs-h2">
      {tds && (
        <div className="mb-6">
          <KBSubSection title="Technical Data Sheet Profile" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {tds.tensileStrength && (
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Tensile Strength</div>
                <div className="font-semibold text-foreground">{tds.tensileStrength}</div>
              </div>
            )}
            {tds.flexuralStrength && (
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Flexural Strength</div>
                <div className="font-semibold text-foreground">{tds.flexuralStrength}</div>
              </div>
            )}
            {tds.heatDeflection && (
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Heat Deflection Temp</div>
                <div className="font-semibold text-foreground">{tds.heatDeflection}</div>
              </div>
            )}
            {tds.glassTg && (
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Glass Transition (Tg)</div>
                <div className="font-semibold text-foreground">{tds.glassTg}</div>
              </div>
            )}
            {tds.density && (
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Density</div>
                <div className="font-semibold text-foreground">{tds.density}</div>
              </div>
            )}
            {tds.elongationAtBreak && (
              <div className="bg-card border border-border rounded-xl p-3">
                <div className="text-xs text-muted-foreground">Elongation at Break</div>
                <div className="font-semibold text-foreground">{tds.elongationAtBreak}</div>
              </div>
            )}
          </div>
        </div>
      )}
      {adhesion && (
        <div>
          <KBSubSection title={`Adhesion & Multi-Material Compatibility`} />
          {adhesion.bedSurfaceRatings && (
            <div className="mb-3">
              <p className="text-sm text-muted-foreground mb-2">Recommended bed surfaces:</p>
              <KBList items={Object.entries(adhesion.bedSurfaceRatings).map(([s, r]: [string, any]) => `${s}: ${r}`)} />
            </div>
          )}
          {adhesion.compatibleWith && adhesion.compatibleWith.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Compatible multi-material combinations:</p>
              <div className="flex flex-wrap gap-2">
                {adhesion.compatibleWith.map((m: string, i: number) => (
                  <Link key={i} to={`/materials/${m.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`} className="px-3 py-1 rounded-full bg-card border border-border text-sm hover:border-primary/30 hover:bg-primary/5 transition-colors">
                    {m}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </KBSection>
  );
}

function PracticalGuideSection({ reference, label }: { reference: any; label: string }) {
  const practical = reference.practicalContext;
  const postProc = reference.postProcessing;
  const safety = reference.safety;
  if (!practical && !postProc && !safety) return null;

  return (
    <KBSection title={`${label} Practical Guide`} id="practical-guide-h2">
      {practical && (
        <div className="mb-6">
          <KBSubSection title="Practical Context" />
          {practical.whenToUse && <p className="text-sm text-muted-foreground mb-2">{practical.whenToUse}</p>}
          {practical.commonUses && practical.commonUses.length > 0 && (
            <KBList items={practical.commonUses} />
          )}
        </div>
      )}
      {postProc && (
        <div className="mb-6">
          <KBSubSection title="Post-Processing" />
          {postProc.methods && postProc.methods.length > 0 && (
            <KBList items={postProc.methods} />
          )}
          {postProc.notes && <p className="text-sm text-muted-foreground">{postProc.notes}</p>}
        </div>
      )}
      {safety && (
        <div>
          <KBSubSection title="Safety & Sustainability" />
          {safety.fumesRisk && <p className="text-sm text-muted-foreground mb-1"><strong>Fumes:</strong> {safety.fumesRisk}</p>}
          {safety.ventilationRequired && <p className="text-sm text-muted-foreground mb-1"><strong>Ventilation:</strong> {safety.ventilationRequired ? "Required" : "Not required"}</p>}
          {safety.recyclable !== undefined && <p className="text-sm text-muted-foreground"><strong>Recyclable:</strong> {safety.recyclable ? "Yes" : "Not widely recyclable"}</p>}
        </div>
      )}
    </KBSection>
  );
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────
export default function MaterialHub() {
  const { slug } = useParams<{ slug: string }>();
  const config = slug ? (MATERIAL_SLUG_CONFIG[slug] ?? buildDynamicConfig(slug)) : null;

  // Stats query: count, avg price, brand count, TD range
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["material-hub-stats", slug],
    enabled: !!config,
    queryFn: async () => {
      if (!config) return null;
      const materials = config.materials;
      const db = supabase as any;
      let q = db.from("filaments")
        .select("id, vendor, variant_price, transmission_distance", { count: "exact" })
        .in("material", materials);
      if (config.ilike) {
        q = db.from("filaments")
          .select("id, vendor, variant_price, transmission_distance", { count: "exact" })
          .or(materials.map((m: string) => `material.eq.${m}`).join(",") + `,material.ilike.${config.ilike}`);
      }
      const { data, count } = await q.limit(1000);
      if (!data) return null;
      const prices = (data as any[]).map((d: any) => d.variant_price).filter(Boolean) as number[];
      const tds = (data as any[]).map((d: any) => d.transmission_distance).filter(Boolean) as number[];
      const brands = new Set((data as any[]).map((d: any) => d.vendor).filter(Boolean));
      return {
        count: count ?? data.length,
        avgPrice: prices.length ? prices.reduce((a: number, b: number) => a + b, 0) / prices.length : null,
        brandCount: brands.size,
        tdMin: tds.length ? Math.min(...tds) : null,
        tdMax: tds.length ? Math.max(...tds) : null,
      };
    },
  });

  // Top 5 by filascope_score
  const { data: topFilaments, isLoading: topLoading } = useQuery({
    queryKey: ["material-hub-top", slug],
    enabled: !!config,
    queryFn: async () => {
      if (!config) return [] as any[];
      const { data } = await (supabase as any)
        .from("filaments")
        .select("id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, featured_image, transmission_distance, filascope_score, diameter_nominal_mm")
        .in("material", config.materials)
        .not("filascope_score", "is", null)
        .order("filascope_score", { ascending: false })
        .limit(5);
      return (data ?? []) as any[];
    },
  });

  // Paginated product grid
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ["material-hub-products", slug],
    enabled: !!config,
    queryFn: async () => {
      if (!config) return [] as any[];
      const { data } = await (supabase as any)
        .from("filaments")
        .select("id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, featured_image, transmission_distance, filascope_score, diameter_nominal_mm, variant_available")
        .in("material", config.materials)
        .order("filascope_score", { ascending: false, nullsFirst: false })
        .limit(24);
      return (data ?? []) as any[];
    },
  });

  // Top brands by product count for this material
  const { data: topBrands } = useQuery({
    queryKey: ["material-hub-top-brands", slug],
    enabled: !!config,
    queryFn: async () => {
      if (!config) return [] as { vendor: string; count: number }[];
      const { data } = await (supabase as any)
        .from("filaments")
        .select("vendor")
        .in("material", config.materials)
        .not("vendor", "is", null)
        .limit(500);
      if (!data) return [];
      const counts: Record<string, number> = {};
      for (const row of data as any[]) {
        if (row.vendor) counts[row.vendor] = (counts[row.vendor] || 0) + 1;
      }
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([vendor, count]) => ({ vendor, count }));
    },
  });

  const isLoading = statsLoading || topLoading || productsLoading;

  // noindex / redirect for unknown slugs
  if (!config) return <Navigate to="/" replace />;

  // noindex for thin content (< 3 products)
  if (!isLoading && stats && stats.count < 3) return <Navigate to="/filament-database" replace />;

  if (isLoading) return <PageLoadingSkeleton />;

  const count = stats?.count ?? 0;
  const label = config.label;

  // Get Knowledge Base reference data
  const materialName = config.materials[0];
  const reference = getMaterialReference(materialName);

  // Build enhanced meta with temperature data when available
  const nozzleRange = reference?.printSettings?.nozzleTemp
    ? `${reference.printSettings.nozzleTemp.min}–${reference.printSettings.nozzleTemp.max}°C`
    : null;
  const bedRange = reference?.printSettings?.bedTemp
    ? `${reference.printSettings.bedTemp.min}–${reference.printSettings.bedTemp.max}°C`
    : null;

  const title = reference
    ? `${label} Filament Guide — Properties, Settings & Best Uses | FilaScope`
    : `${label} Filament Guide — What It Is & When to Use It | FilaScope`;

  let description: string;
  if (reference && nozzleRange) {
    description = `Complete ${label} filament guide. Nozzle temp ${nozzleRange}${bedRange ? `, bed ${bedRange}` : ""}. Learn about ${label} properties, strengths, weaknesses, and best use cases for 3D printing.`;
  } else {
    description = `Everything you need to know about ${label} 3D printing filament — material properties, recommended settings, pros & cons, and practical usage tips.`;
  }
  if (description.length > 160) description = description.slice(0, 157) + "...";

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Materials", url: "/reference/materials" },
    { name: `${label} Filaments`, url: `/materials/${slug}` },
  ];

  const itemListItems = (topFilaments ?? []).map((f, i) => ({
    name: f.display_name || f.product_title || "Filament",
    url: `https://filascope.com/filament/${f.product_handle || f.id}`,
    image: f.featured_image ?? undefined,
    description: [f.vendor, f.material, f.color_family].filter(Boolean).join(" · "),
    position: i + 1,
  }));

  const faqs = getMaterialFAQs(slug ?? "", label, count, stats?.brandCount ?? 0, reference);

  // Filament listing link for this material
  const filamentListingSlug = slug === "pc" ? "polycarbonate" : slug;

  return (
    <>
      <DocumentHead
        title={title}
        description={description}
        canonical={`https://filascope.com/materials/${slug}`}
      />
      {reference && (
        <ArticleSchema
          headline={`${label} Filament Guide — Properties, Settings & Best Uses`}
          description={description}
          datePublished="2025-01-01T00:00:00Z"
          url={`/materials/${slug}`}
        />
      )}
      {reference && (
        <DefinedTermSetSchema
          name="3D Printing Materials"
          terms={[{
            name: `${label} (${reference.fullName})`,
            description: reference.strengths.whyChooseThis ||
              (reference.strengths.uniqueProperties || []).slice(0, 3).join('. '),
            url: `https://filascope.com/materials/${slug}`,
          }]}
        />
      )}
      {itemListItems.length > 0 && (
        <ItemListSchema
          name={`Best ${label} Filaments`}
          items={itemListItems}
          itemListOrder="Ascending"
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={breadcrumbItems.slice(1)} className="mb-4" />

        {/* H1 */}
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
          {label} Filament Guide — Properties, Settings & Best Uses
        </h1>
        <p className="text-muted-foreground mb-4 max-w-2xl">
          Everything you need to know about {label} filament — print temperatures, mechanical properties, strengths, weaknesses, and when to choose {label} over other materials.
        </p>

        {/* CTA: cross-link to catalog page */}
        <Link
          to={`/filaments/${slug === "pc" ? "polycarbonate" : slug}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors text-sm font-medium mb-6"
        >
          <Layers className="w-4 h-4" />
          Browse all {count.toLocaleString()} {label} filaments →
        </Link>

        {/* Stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard icon={<Layers className="w-4 h-4" />} label="Total Products" value={count.toLocaleString()} />
          <StatCard icon={<Tag className="w-4 h-4" />} label="Brands" value={stats?.brandCount ? `${stats.brandCount}+` : "—"} />
          <StatCard
            icon={<Scale className="w-4 h-4" />}
            label="Avg. Price"
            value={stats?.avgPrice ? `$${stats.avgPrice.toFixed(2)}` : "—"}
          />
          <StatCard
            icon={<Thermometer className="w-4 h-4" />}
            label="TD Range"
            value={stats?.tdMin != null && stats?.tdMax != null ? `${stats.tdMin}–${stats.tdMax} mm` : "—"}
          />
        </div>

        {/* Top 5 */}
        {topFilaments && topFilaments.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Top-Rated {label} Filaments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {topFilaments.map((f) => (
                <FilamentCard key={f.id} filament={f as any} />
              ))}
            </div>
          </section>
        )}

        {/* Full product grid */}
        {products && products.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Popular {label} Filaments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((f) => (
                <FilamentCard key={f.id} filament={f as any} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                to={`/filaments/${filamentListingSlug}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors text-sm font-medium"
              >
                Browse all {count.toLocaleString()} {label} filaments
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </section>
        )}

        {/* Knowledge Base content sections — always expanded for SEO */}
        {reference && (
          <>
            <PrintSettingsSection reference={reference} label={label} />
            <StrengthsSection reference={reference} label={label} />
            <WeaknessesSection reference={reference} label={label} />
            <TechnicalSpecsSection reference={reference} label={label} />
            <PracticalGuideSection reference={reference} label={label} />
          </>
        )}

        {/* Compare related materials */}
        {config.relatedSlugs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Compare Related Materials</h2>
            <div className="flex flex-wrap gap-3">
              {config.relatedSlugs.map((s, i) => (
                <Link
                  key={s}
                  to={`/materials/${s}`}
                  className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-sm font-medium"
                >
                  {config.relatedMaterials[i]} Filaments →
                </Link>
              ))}
              <Link
                to="/materials/compare"
                className="px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors text-sm font-medium"
              >
                Full Material Comparison →
              </Link>
            </div>
          </section>
        )}

        {/* Relevant guides */}
        {config.guides.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Relevant {label} Guides</h2>
            <div className="flex flex-wrap gap-3">
              {config.guides.map((g) => (
                <Link
                  key={g.href}
                  to={g.href}
                  className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-sm font-medium"
                >
                  {g.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Top brands for this material */}
        {topBrands && topBrands.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Top {label} Brands</h2>
            <div className="flex flex-wrap gap-3">
              {topBrands.map(({ vendor }) => (
                <Link
                  key={vendor}
                  to={`/brands/${vendor.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                  className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-sm font-medium"
                >
                  {vendor}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Brand comparison table for this material */}
        {topBrands && topBrands.length >= 2 && (
          <MaterialBrandComparisonTable topBrands={topBrands} material={label} />
        )}

        {/* Color-specific pages for this material */}
        {config.colorSlugs && config.colorSlugs.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Shop by Color</h2>
            <div className="flex flex-wrap gap-3">
              {config.colorSlugs.map((colorSlug) => {
                const colorLabel = colorSlug.charAt(0).toUpperCase() + colorSlug.slice(1).replace(/-/g, ' ');
                return (
                  <Link
                    key={colorSlug}
                    to={`/colors/${colorSlug}`}
                    className="px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary/30 transition-colors text-sm font-medium"
                  >
                    {colorLabel} {label}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Related Searches for SEO */}
        <RelatedSearchesSection materialSlug={slug} materialLabel={label} />

        {/* FAQ */}
        <FAQSection faqs={faqs} title={`${label} Filament FAQ`} />
      </div>
    </>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
      <span className="mt-0.5 text-muted-foreground">{icon}</span>
      <div>
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</div>
        <div className="text-base font-bold text-foreground">{value}</div>
      </div>
    </div>
  );
}
