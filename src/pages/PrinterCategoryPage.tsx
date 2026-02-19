import { useState, useMemo } from "react";
import { useParams, useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { BreadcrumbSchema, ItemListSchema, FAQSection } from "@/components/seo";
import { FAQSchema } from "@/components/seo/FAQSchema";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import MediumStandardPrinterCard from "@/components/printers/MediumStandardPrinterCard";
import { PrinterCardSkeletonGrid } from "@/components/printers/PrinterCardSkeleton";
import { usePrinterCompare } from "@/hooks/usePrinterCompare";
import type { Database } from "@/integrations/supabase/types";

type Printer = Database["public"]["Tables"]["printers"]["Row"] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

const getPrice = (p: Printer) =>
  p.current_price_usd_store || p.current_price_usd_amazon || p.msrp_usd || Infinity;

const isCoreXY = (p: Printer) => {
  const motion = (p.motion_system_notes || "").toLowerCase();
  const style = (p.machine_style || "").toLowerCase();
  return motion.includes("corexy") || style.includes("corexy");
};

// ---------------------------------------------------------------------------
// Category configurations
// ---------------------------------------------------------------------------
type FAQItem = { question: string; answer: string };

type CategoryConfig = {
  label: string;
  h1: (count: number) => string;
  title: (count: number) => string;
  description: (count: number) => string;
  intro: string;
  filter: (p: Printer) => boolean;
  aboutHeading: string;
  aboutParagraphs: string[];
  faqItems: FAQItem[];
};

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  "enclosed": {
    label: "Enclosed 3D Printers",
    h1: (n) => `Enclosed 3D Printers — ${n} Models Compared`,
    title: (n) => `Enclosed 3D Printers — Compare ${n} Models | FilaScope`,
    description: (n) => `Compare ${n} enclosed 3D printers with heated chambers. Better ABS & PETG printing, reduced warping. Filter by brand, speed, and price on FilaScope.`,
    intro: "Enclosed 3D printers feature a sealed build chamber that maintains consistent temperature, reducing warping and enabling reliable printing with ABS, PETG, and engineering materials.",
    filter: (p) => !!p.has_enclosure,
    aboutHeading: "About Enclosed 3D Printers",
    aboutParagraphs: [
      "An enclosed 3D printer surrounds the build area with solid panels or a sealed frame, trapping heat inside the build chamber. This controlled environment is essential for printing engineering-grade materials like ABS, ASA, Nylon, and Polycarbonate that warp badly when exposed to ambient drafts.",
      "Beyond material compatibility, enclosures also reduce noise, keep print particles contained, and protect prints from dust and pets. Many enclosed printers also include HEPA and activated carbon filters for safer indoor printing.",
      "If you primarily print PLA, an enclosure is optional. But if you plan to explore ABS, functional parts, or specialty filaments, an enclosed printer is a worthwhile investment that significantly broadens your material options.",
    ],
    faqItems: [
      {
        question: "Do I need an enclosed 3D printer for ABS?",
        answer: "Yes. ABS requires a consistently warm ambient temperature (around 40–60°C) during printing to prevent warping and layer delamination. An enclosed printer traps heat from the bed and hotend, creating the stable environment ABS needs. Printing ABS on an open-frame printer almost always results in warping.",
      },
      {
        question: "Can I print PLA in an enclosed printer?",
        answer: "Yes, but you may need to open vents or panels to prevent the chamber from getting too hot. PLA prints best between 15–25°C ambient. Most enclosed printers have vents or panels that can be opened. With proper ventilation, enclosed printers work great for PLA.",
      },
      {
        question: "What is the best enclosed 3D printer for beginners?",
        answer: "The Bambu Lab A1 Mini Combo and Bambu Lab P1S are popular enclosed printers for beginners due to their fast print speeds, auto bed leveling, and user-friendly software. The Creality K1C is another well-regarded option with good value.",
      },
    ],
  },
  "multi-color": {
    label: "Multi-Color 3D Printers",
    h1: (n) => `Multi-Color 3D Printers — ${n} Models Compared`,
    title: (n) => `Multi-Color 3D Printers — Compare ${n} Models | FilaScope`,
    description: (n) => `Compare ${n} multi-color 3D printers with AMS and multi-filament systems. Print up to 16 colors in one print. Specs, prices, and filament compatibility.`,
    intro: "Multi-color 3D printers use automatic material systems (AMS) or multi-filament units to switch between multiple filaments during a print, enabling multi-color and multi-material objects without manual filament swaps.",
    filter: (p) => !!p.multi_material_supported,
    aboutHeading: "About Multi-Color 3D Printers",
    aboutParagraphs: [
      "Multi-color 3D printing has been transformed by Automatic Material Systems (AMS) popularized by Bambu Lab. These systems can hold 4, 8, or even 16 filament spools and automatically switch between them during a print, creating vibrant multi-color models without manual intervention.",
      "Common use cases include HueForge lithophanes, multi-material models with support interfaces in easy-to-remove filament, and artistic multi-color prints. The purge waste from color changes is a trade-off — expect 10–30% extra filament usage.",
      "Beyond Bambu Lab's AMS, other systems include Prusa's MMU3, Mosaic's Palette, and various IDEX (Independent Dual Extruder) designs. Each has different strengths in speed, reliability, and material compatibility.",
    ],
    faqItems: [
      {
        question: "How many colors can a multi-color 3D printer use?",
        answer: "Depending on the system, multi-color printers can use 2 to 16+ colors in a single print. Bambu Lab's AMS supports 4 spools per unit, and multiple AMS units can be chained for up to 16 colors. IDEX printers typically support 2 independent colors or materials.",
      },
      {
        question: "Is multi-color 3D printing worth it?",
        answer: "If you print decorative models, HueForge lithophanes, or functional parts that benefit from multi-material (like dissolvable supports), yes. Multi-color printing adds significant creative possibilities. The main trade-offs are higher printer cost and filament waste from purging during color changes.",
      },
    ],
  },
  "high-speed": {
    label: "High Speed 3D Printers",
    h1: (n) => `High Speed 3D Printers — ${n} Models Compared`,
    title: (n) => `High Speed 3D Printers — Compare ${n} Models | FilaScope`,
    description: (n) => `Compare ${n} high speed 3D printers capable of 300–600mm/s. Fast printing without sacrificing quality. Filter by brand, build volume, and price.`,
    intro: "High-speed 3D printers use CoreXY motion systems, input shaping (resonance compensation), and high-flow hotends to print at 300–600mm/s — 5–10× faster than traditional printers — without sacrificing print quality.",
    filter: (p) => (p.max_print_speed_mms || 0) >= 300,
    aboutHeading: "About High Speed 3D Printers",
    aboutParagraphs: [
      "The high-speed 3D printing revolution was catalyzed by Bambu Lab's X1 Carbon in 2022, which demonstrated that 500mm/s printing with excellent quality was achievable at consumer prices. Today, most major brands offer high-speed models.",
      "Three key technologies enable high-speed printing: CoreXY kinematics (moving only the toolhead, not the heavy bed), input shaping (vibration compensation using accelerometers), and high-flow hotends capable of melting filament fast enough to keep up.",
      "Real-world print speeds are often limited by print quality requirements rather than maximum speed. Most users find 200–400mm/s to be the sweet spot for quality and speed. Maximum rated speeds are achievable but usually produce rougher surfaces.",
    ],
    faqItems: [
      {
        question: "How fast can high-speed 3D printers actually print?",
        answer: "While rated speeds of 500–600mm/s are achievable, most users print at 200–400mm/s for quality reasons. Bambu Lab's X1C and P1S regularly print functional parts at 300–400mm/s with excellent results. Speed depends heavily on the filament type, layer height, and part geometry.",
      },
      {
        question: "Is a high-speed printer necessary for everyday printing?",
        answer: "Not necessarily. A 500mm/s printer printing at 300mm/s is still 5–6× faster than a traditional 50mm/s printer. For anyone who prints regularly, the time savings are significant. High-speed printers also tend to have better motion systems and components overall.",
      },
    ],
  },
  "large-format": {
    label: "Large Format 3D Printers",
    h1: (n) => `Large Format 3D Printers — ${n} Models Compared`,
    title: (n) => `Large Format 3D Printers — Compare ${n} Models | FilaScope`,
    description: (n) => `Compare ${n} large format 3D printers with build volumes over 300mm. Print bigger models in fewer pieces. Filter by brand, speed, and features.`,
    intro: "Large format 3D printers offer build volumes with at least one dimension exceeding 300mm, letting you print large models, functional parts, and assemblies in fewer pieces.",
    filter: (p) =>
      Math.max(p.build_volume_x_mm || 0, p.build_volume_y_mm || 0, p.build_volume_z_mm || 0) >= 300,
    aboutHeading: "About Large Format 3D Printers",
    aboutParagraphs: [
      "Large format printers are defined by build volumes where at least one dimension exceeds 300mm. This opens up printing of life-size props, large functional enclosures, architectural models, and full-size replacement parts that smaller printers would require splitting into multiple pieces.",
      "The trade-offs include longer print times, higher filament costs per print, and more demanding bed leveling. Large beds are harder to keep uniformly level and heated, so large format printers often have more advanced automatic bed leveling systems.",
      "Popular large format options include the Creality Ender 5 S1, Artillery Genius Pro, and dedicated professional models from Raise3D and UltiMaker. Some CoreXY designs like the Voron 2.4 can be built in large configurations.",
    ],
    faqItems: [
      {
        question: "What counts as a large format 3D printer?",
        answer: "Generally, printers with a build volume where at least one dimension exceeds 300mm are considered large format. The most common large format FDM printers have build volumes of 300×300×300mm or larger. Some specialized printers reach 500×500×500mm or more.",
      },
    ],
  },
  "corexy": {
    label: "CoreXY 3D Printers",
    h1: (n) => `CoreXY 3D Printers — ${n} Models Compared`,
    title: (n) => `CoreXY 3D Printers — Compare ${n} Models | FilaScope`,
    description: (n) => `Compare ${n} CoreXY 3D printers. Faster, more accurate motion system for high-quality printing. Specs, prices, and filament compatibility on FilaScope.`,
    intro: "CoreXY printers use a belt-driven motion system where only the print head moves in X and Y, while the bed moves only in Z. This reduces moving mass, enabling faster print speeds and better print quality than traditional Cartesian designs.",
    filter: isCoreXY,
    aboutHeading: "About CoreXY 3D Printers",
    aboutParagraphs: [
      "In a CoreXY kinematic system, the toolhead is driven by two motors working together through a crossed-belt arrangement. The result is a lighter moving mass compared to bed-slinger designs, which allows for faster acceleration and higher print speeds without ringing artifacts.",
      "CoreXY designs are the foundation of most high-performance 3D printers, including Bambu Lab's entire lineup, Voron printers, Creality's K1 series, and many others. The trade-off is more mechanical complexity compared to simple Cartesian designs.",
      "For serious 3D printing — especially at high speeds or with quality-critical parts — CoreXY is generally the preferred kinematic system. Input shaping (resonance compensation) also pairs especially well with CoreXY designs.",
    ],
    faqItems: [
      {
        question: "What is the difference between CoreXY and bed slinger printers?",
        answer: "In CoreXY printers, only the toolhead moves in X and Y axes while the bed moves only in Z. In bed slingers (like the original Ender 3), the bed moves back and forth in Y. CoreXY moves less mass, enabling faster printing and better quality at high speeds. Bed slingers are simpler and cheaper but slower.",
      },
    ],
  },
  "bed-slinger": {
    label: "Bed Slinger 3D Printers",
    h1: (n) => `Bed Slinger 3D Printers — ${n} Models Compared`,
    title: (n) => `Bed Slinger 3D Printers — Compare ${n} Models | FilaScope`,
    description: (n) => `Compare ${n} bed slinger 3D printers. Simple Cartesian design, great for beginners and budget printing. Specs, prices, and filament compatibility.`,
    intro: "Bed slinger 3D printers use a traditional Cartesian design where the print bed moves along the Y-axis. This simple, reliable design is the foundation of popular printers like the Creality Ender series and Prusa MK4.",
    filter: (p) => {
      const motion = (p.motion_system_notes || "").toLowerCase();
      const style = (p.machine_style || "").toLowerCase();
      return motion.includes("bed slinger") || style.includes("bed slinger") ||
        motion.includes("cartesian") || style.includes("cartesian");
    },
    aboutHeading: "About Bed Slinger 3D Printers",
    aboutParagraphs: [
      "Bed slinger printers move the print bed in the Y direction while the toolhead moves in X, with the Z axis moving the entire X gantry up. This Cartesian design is mechanically simple, easy to troubleshoot, and inexpensive to manufacture — which is why the original Prusa i3 design became so popular.",
      "The limitation of bed slingers is that moving the bed (which carries the printed part) limits maximum print speed. At high speeds, the inertia of the bed and part causes vibrations and ringing artifacts. Most bed slingers top out at 100–150mm/s for quality prints.",
      "For beginners and budget-conscious makers, bed slingers remain excellent value. The Creality Ender 3 series, Prusa MK4, and Bambu Lab A1 (which uses a modified bed-slinger approach) are all popular options.",
    ],
    faqItems: [
      {
        question: "Are bed slinger printers good for beginners?",
        answer: "Yes. Bed slinger printers like the Creality Ender 3 V3 SE are excellent for beginners. They are affordable, simple to understand and maintain, have huge communities, and there are thousands of guides and mods available. The main limitation is lower maximum print speed compared to CoreXY designs.",
      },
    ],
  },
  "direct-drive": {
    label: "Direct Drive 3D Printers",
    h1: (n) => `Direct Drive 3D Printers — ${n} Models Compared`,
    title: (n) => `Direct Drive 3D Printers — Compare ${n} Models | FilaScope`,
    description: (n) => `Compare ${n} direct drive 3D printers. Better flexible filament printing and retraction. Specs, prices, and filament compatibility on FilaScope.`,
    intro: "Direct drive 3D printers mount the extruder motor directly on the print head, next to the hotend. This enables better flexible filament printing, shorter retraction distances, and more responsive filament control.",
    filter: (p) => {
      const notes = (p.motion_system_notes || "").toLowerCase();
      const extruder = (p.extruder_type || "").toLowerCase();
      return notes.includes("direct") || extruder.includes("direct");
    },
    aboutHeading: "About Direct Drive 3D Printers",
    aboutParagraphs: [
      "In a direct drive system, the extruder gear and motor sit directly above the hotend, feeding filament from above with a very short path to the melt zone. This direct coupling gives much better control over the filament, especially important for flexible materials like TPU that would buckle in a long Bowden tube.",
      "The trade-off is additional weight on the print head, which increases the moving mass and can limit maximum print speed or introduce ringing at high speeds. Modern input shaping can compensate for this, and many high-speed printers like the Bambu Lab X1C use direct drive successfully.",
      "For printing TPU, flexible filaments, or specialty materials requiring precise retraction, direct drive is the recommended choice. For PLA, PETG, and rigid materials, either direct drive or Bowden work well.",
    ],
    faqItems: [
      {
        question: "Is direct drive better than Bowden for TPU?",
        answer: "Yes. Direct drive extruders are significantly better for TPU and flexible filaments. Bowden setups require long tubing between the extruder and hotend, and flexible filaments can stretch and buckle in that tube, causing under-extrusion and jams. Direct drive's short filament path eliminates these issues.",
      },
    ],
  },
  "under-300": {
    label: "3D Printers Under $300",
    h1: (n) => `3D Printers Under $300 — ${n} Models Compared`,
    title: (n) => `Best 3D Printers Under $300 — ${n} Options | FilaScope`,
    description: (n) => `Compare ${n} 3D printers under $300 with detailed specs and filament compatibility. Find the best budget printer for your needs. Updated pricing daily.`,
    intro: "Budget 3D printers under $300 have improved dramatically in recent years. Today's sub-$300 options often include auto bed leveling, direct drive extruders, and decent print speeds that were reserved for $1,000+ machines just a few years ago.",
    filter: (p) => getPrice(p) <= 300,
    aboutHeading: "About Budget 3D Printers Under $300",
    aboutParagraphs: [
      "The sub-$300 3D printer market is dominated by Creality, Elegoo, and Anycubic, with Bambu Lab's A1 Mini competing at the top of this price range. At this price point, you can expect reliable FDM printing with PLA, PETG, and basic materials.",
      "Key features to look for at this price point include auto bed leveling (saves significant setup frustration), direct drive extruder (for better filament control), and at least 220×220mm build volume for most projects.",
      "Resin (MSLA) printers are also highly competitive under $300, with Elegoo Mars and Anycubic Photon series offering excellent detail for miniatures, jewelry, and dental applications.",
    ],
    faqItems: [
      {
        question: "Can you get a good 3D printer under $300?",
        answer: "Yes. The Bambu Lab A1 Mini (~$199–$299) offers excellent print quality and user experience at this price. The Creality Ender 3 V3 SE (~$179) is another solid option with auto bed leveling. The Elegoo Saturn 3 Ultra 12K is an excellent resin option under $300.",
      },
      {
        question: "What should I avoid in cheap 3D printers?",
        answer: "Avoid printers without auto bed leveling (manual leveling is frustrating for beginners), printers without heated beds (limits you to PLA only), and very old designs that lack community support. Stick to established brands like Creality, Elegoo, Anycubic, or Bambu Lab for reliable support.",
      },
    ],
  },
  "under-500": {
    label: "3D Printers Under $500",
    h1: (n) => `3D Printers Under $500 — ${n} Models Compared`,
    title: (n) => `Best 3D Printers Under $500 — ${n} Options | FilaScope`,
    description: (n) => `Compare ${n} 3D printers under $500 with detailed specs and filament compatibility. Find the best budget printer for your needs. Updated pricing daily.`,
    intro: "The under-$500 range is the sweet spot for hobbyist 3D printers, offering fast print speeds, enclosed options, auto features, and solid build quality without breaking the bank.",
    filter: (p) => getPrice(p) <= 500,
    aboutHeading: "About 3D Printers Under $500",
    aboutParagraphs: [
      "The $300–$500 tier has been transformed by Bambu Lab's A1 and P1P, Creality's K1 series, and Elegoo's Neptune line. At this price, you can expect high print speeds (300mm/s+), auto bed leveling, and multi-color capability in some models.",
      "For enclosed printing under $500, the Creality K1C and Bambu Lab P1P (occasionally on sale) are strong options. The Bambu Lab A1 Combo with AMS adds multi-color capability at the top of this price range.",
      "Resin printing under $500 offers access to the excellent Elegoo Saturn series with large build plates and high resolution, ideal for miniature painters and jewelry designers.",
    ],
    faqItems: [
      {
        question: "What is the best 3D printer under $500 in 2026?",
        answer: "The Bambu Lab A1 Mini Combo (~$399) offers exceptional value with multi-color AMS support, 500mm/s max speed, and excellent software. The Creality K1C (~$299) is a strong CoreXY option with an enclosed design and direct drive. For resin, the Elegoo Saturn 4 Ultra offers a massive print area.",
      },
    ],
  },
  "under-1000": {
    label: "3D Printers Under $1,000",
    h1: (n) => `3D Printers Under $1,000 — ${n} Models Compared`,
    title: (n) => `Best 3D Printers Under $1,000 — ${n} Options | FilaScope`,
    description: (n) => `Compare ${n} 3D printers under $1,000 with detailed specs and filament compatibility. Pro features at consumer prices. Updated pricing daily.`,
    intro: "The under-$1,000 range includes professional-grade printers with fully enclosed chambers, high-speed motion systems, multi-color capability, and advanced features previously found only in $3,000+ industrial machines.",
    filter: (p) => getPrice(p) <= 1000,
    aboutHeading: "About 3D Printers Under $1,000",
    aboutParagraphs: [
      "Between $500 and $1,000, you gain access to fully enclosed, high-speed printers with professional build quality. The Bambu Lab P1S ($699) and Prusa MK4S ($599) lead this segment with excellent material compatibility and ecosystem support.",
      "At this price point, you should expect: full enclosure with chamber heating capability, multi-color compatibility (or the option to add it), WiFi connectivity with camera monitoring, and print speeds of 300mm/s or higher.",
      "Professional Resin options like the Phrozen Sonic Mega 8K and Elegoo Saturn 4 Ultra also fall in this range, offering exceptional print detail for miniatures, dental, and jewelry applications.",
    ],
    faqItems: [
      {
        question: "Is a $1,000 3D printer worth it over a $300 model?",
        answer: "For serious makers, yes. The step from $300 to $1,000 brings significantly better build quality, faster speeds, enclosed chambers (enabling ABS/ASA printing), better software ecosystems, and more reliable operation. If you print frequently, the time savings and broader material options justify the cost.",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Brand configurations
// ---------------------------------------------------------------------------
type BrandConfig = {
  displayName: string;
  intro: string;
  faqItems: FAQItem[];
};

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  "bambu-lab": {
    displayName: "Bambu Lab",
    intro: "Bambu Lab has rapidly become one of the most popular 3D printer brands, known for fast print speeds, multi-color AMS systems, and user-friendly operation from first-print to advanced multi-material projects.",
    faqItems: [
      {
        question: "What is the best Bambu Lab printer for beginners?",
        answer: "The Bambu Lab A1 Mini is the best entry-level option, offering easy setup, 500mm/s max speed, and optional multi-color AMS support at around $199–$299. For a larger build volume, the A1 offers a 256mm build plate at similar pricing.",
      },
      {
        question: "Does Bambu Lab use proprietary filament?",
        answer: "No. Bambu Lab printers work with standard 1.75mm filament from any brand. While Bambu Lab sells their own filament and RFID-tagged spools for the AMS, third-party filaments work perfectly well. The AMS does require RFID tags for automatic identification, but you can manually set filament parameters.",
      },
    ],
  },
  "creality": {
    displayName: "Creality",
    intro: "Creality is one of the world's largest 3D printer manufacturers, offering a wide range of FDM printers from the iconic Ender series to the high-speed K1 CoreXY lineup, covering budgets from $150 to $1,000+.",
    faqItems: [
      {
        question: "What is the difference between Creality Ender and K1 series?",
        answer: "The Ender series uses traditional Cartesian (bed slinger) kinematics and is known for simplicity, modifiability, and low cost. The K1 series uses CoreXY motion for significantly faster print speeds (600mm/s on K1 Max) and enclosed designs that support more materials. K1 printers are more expensive but offer better performance.",
      },
    ],
  },
  "prusa-research": {
    displayName: "Prusa Research",
    intro: "Prusa Research, founded by Josef Průša, is renowned for open-source 3D printers with excellent print quality, active community support, and the Original Prusa MK4S and Mini+ as their flagship consumer models.",
    faqItems: [
      {
        question: "Are Prusa printers worth the premium price?",
        answer: "For many users, yes. Prusa printers are known for exceptional print quality out of the box, thorough documentation, and outstanding customer support. The open-source design means a large community of users sharing settings and improvements. If reliability and print quality are priorities over lowest cost, Prusa is a strong choice.",
      },
    ],
  },
  "elegoo": {
    displayName: "Elegoo",
    intro: "Elegoo specializes in resin (MSLA) and FDM 3D printers, known for excellent value in the Saturn and Mars resin printer lines that deliver professional print quality at consumer prices.",
    faqItems: [
      {
        question: "What is Elegoo best known for?",
        answer: "Elegoo is particularly well-regarded for their Saturn and Mars resin printer series, which offer large build plates and high resolution at competitive prices. They also make FDM printers in the Neptune series. Elegoo's Saturn 4 Ultra is especially popular among miniature painters.",
      },
    ],
  },
  "anycubic": {
    displayName: "Anycubic",
    intro: "Anycubic produces a wide range of FDM and resin 3D printers, including the Kobra series (FDM) and Photon series (resin), offering good feature sets at competitive prices across beginner to intermediate markets.",
    faqItems: [
      {
        question: "Is Anycubic a good 3D printer brand?",
        answer: "Yes. Anycubic is a well-established brand with millions of printers in use worldwide. Their Kobra FDM series offers good auto-leveling and features for the price, while their Photon resin series is popular for miniature printing. Customer support has improved significantly in recent years.",
      },
    ],
  },
  "flashforge": {
    displayName: "FlashForge",
    intro: "FlashForge produces reliable FDM 3D printers including the popular Adventurer and Creator series, known for enclosed designs and dual-extrusion capabilities that make them popular in educational and professional settings.",
    faqItems: [],
  },
  "snapmaker": {
    displayName: "Snapmaker",
    intro: "Snapmaker makes modular multi-function machines that combine 3D printing, laser engraving, and CNC carving in one platform, popular with makers who want versatile digital fabrication in a single device.",
    faqItems: [],
  },
  "qidi-tech": {
    displayName: "QIDI Tech",
    intro: "QIDI Tech (also known as QIDI) produces enclosed FDM printers known for their ability to print high-temperature engineering materials like ABS, ASA, PA, and PC at competitive prices.",
    faqItems: [],
  },
  "raise3d": {
    displayName: "Raise3D",
    intro: "Raise3D manufactures professional-grade FDM 3D printers used in engineering, manufacturing, and industrial applications, known for large build volumes, dual extrusion, and industrial material compatibility.",
    faqItems: [],
  },
  "ultimaker": {
    displayName: "UltiMaker",
    intro: "UltiMaker (formerly Ultimaker) produces professional desktop 3D printers and the popular Cura slicing software, widely used in engineering, education, and professional design environments globally.",
    faqItems: [],
  },
  "voron-design": {
    displayName: "Voron Design",
    intro: "Voron Design is an open-source 3D printer project producing high-performance CoreXY printers that users build themselves from kits or scratch. Known for exceptional print quality, high speeds, and an active enthusiast community.",
    faqItems: [],
  },
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function PrinterCategoryPage() {
  const { category, brand } = useParams<{ category?: string; brand?: string }>();
  const { pathname } = useLocation();

  const { addPrinter, removePrinter, isSelected, isMaxReached } = usePrinterCompare();

  const { data: printers, isLoading } = useQuery({
    queryKey: ["printers-list-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printers")
        .select(`*, brand:printer_brands!brand_id(brand), series:printer_series!series_id(series_name)`)
        .order("model_name");
      if (error) throw error;
      return data as Printer[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const isBrandPage = !!brand;
  const slugKey = brand || category || "";

  // Resolve config
  const categoryConfig = !isBrandPage ? CATEGORY_CONFIGS[slugKey] : null;
  const brandConfig = isBrandPage ? BRAND_CONFIGS[slugKey] : null;

  // Filter printers
  const filteredPrinters = useMemo(() => {
    if (!printers) return [];
    if (isBrandPage) {
      if (!brandConfig) return [];
      const displayName = brandConfig.displayName.toLowerCase();
      return printers.filter(
        (p) => (p.brand?.brand || "").toLowerCase() === displayName
      );
    }
    if (!categoryConfig) return [];
    return printers.filter(categoryConfig.filter);
  }, [printers, categoryConfig, brandConfig, isBrandPage]);

  const count = filteredPrinters.length;

  // Resolve display values
  const h1 = isBrandPage
    ? `${brandConfig?.displayName || slugKey} 3D Printers — ${count} Models Compared`
    : categoryConfig?.h1(count) || `${slugKey} 3D Printers`;

  const title = isBrandPage
    ? `${brandConfig?.displayName || slugKey} 3D Printers — All ${count} Models | FilaScope`
    : categoryConfig?.title(count) || h1;

  const description = isBrandPage
    ? `Compare all ${count} ${brandConfig?.displayName || slugKey} 3D printers with specs, pricing, and filament compatibility on FilaScope. Updated daily.`
    : categoryConfig?.description(count) || "";

  const intro = isBrandPage ? brandConfig?.intro || "" : categoryConfig?.intro || "";

  const aboutHeading = isBrandPage
    ? `About ${brandConfig?.displayName || slugKey} 3D Printers`
    : categoryConfig?.aboutHeading || "";

  const aboutParagraphs = isBrandPage ? [] : categoryConfig?.aboutParagraphs || [];

  const faqItems: FAQItem[] = isBrandPage
    ? brandConfig?.faqItems || []
    : categoryConfig?.faqItems || [];

  const label = isBrandPage
    ? `${brandConfig?.displayName || slugKey} 3D Printers`
    : categoryConfig?.label || slugKey;

  const canonicalUrl = `https://filascope.com${pathname}`;

  const breadcrumbItems = [
    { name: "Home", url: "https://filascope.com/" },
    { name: "3D Printers", url: "https://filascope.com/printers" },
    { name: label, url: canonicalUrl },
  ];

  const toggleCompareSelection = (printer: Printer) => {
    const scrapedData = printer.scraped_data as Record<string, unknown> | null;
    const images = scrapedData?.images as Record<string, unknown> | null;
    const productImages = images?.product_images as string[] | null;
    const productImage = productImages?.[0] || null;

    if (isSelected(printer.id)) {
      removePrinter(printer.id);
    } else {
      addPrinter({
        id: printer.id,
        name: `${printer.brand?.brand || ""} ${printer.model_name}`.trim(),
        imageUrl: productImage,
        brand: printer.brand?.brand || null,
      });
    }
  };

  // 404-like state for unknown categories
  if (!isLoading && !categoryConfig && !brandConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">Category Not Found</h1>
          <p className="text-muted-foreground mb-4">This printer category doesn't exist.</p>
          <Link to="/printers" className="text-primary hover:underline">Browse all 3D printers →</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <DocumentHead
        title={title}
        description={description}
        ogTitle={title}
        ogDescription={description}
        canonical={canonicalUrl}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      {filteredPrinters.length > 0 && (
        <ItemListSchema
          name={label}
          description={description}
          items={filteredPrinters.slice(0, 50).map((p, i) => ({
            name: `${p.brand?.brand || ""} ${p.model_name}`.trim(),
            url: `https://filascope.com/printers/${p.printer_id || p.id}`,
            position: i + 1,
          }))}
        />
      )}
      {faqItems.length > 0 && <FAQSchema faqs={faqItems} />}

      <div className="min-h-screen bg-background pb-16">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 pt-24 sm:pt-28">
          {/* Breadcrumbs */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link to="/printers" className="hover:text-foreground transition-colors">3D Printers</Link>
            <span>/</span>
            <span className="text-foreground">{label}</span>
          </nav>

          {/* H1 + intro */}
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-3 leading-tight">
            {h1}
          </h1>
          {intro && (
            <p className="text-muted-foreground leading-relaxed mb-8 max-w-3xl">
              {intro}
            </p>
          )}

          {/* Grid label */}
          <section aria-labelledby="listing-h2">
            <h2 id="listing-h2" className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              All {label} — {isLoading ? "…" : count} Models
            </h2>

            {isLoading ? (
              <PrinterCardSkeletonGrid count={12} />
            ) : filteredPrinters.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <p className="text-lg mb-2">No printers found in this category.</p>
                <Link to="/printers" className="text-primary hover:underline">Browse all 3D printers →</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {filteredPrinters.map((printer) => (
                  <MediumStandardPrinterCard
                    key={printer.id}
                    printer={printer}
                    isSelected={isSelected(printer.id)}
                    isMaxReached={isMaxReached}
                    onToggleCompare={() => toggleCompareSelection(printer)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* SEO Content: About this category */}
          {(aboutParagraphs.length > 0) && (
            <section className="mt-16 max-w-3xl" aria-labelledby="about-h2">
              <h2 id="about-h2" className="text-xl font-semibold text-foreground mb-4">
                {aboutHeading}
              </h2>
              <div className="space-y-4">
                {aboutParagraphs.map((para, i) => (
                  <p key={i} className="text-muted-foreground leading-relaxed">{para}</p>
                ))}
              </div>
            </section>
          )}

          {/* Popular brands section (non-brand pages only) */}
          {!isBrandPage && (
            <section className="mt-10 max-w-3xl" aria-labelledby="brands-h2">
              <h2 id="brands-h2" className="text-xl font-semibold text-foreground mb-4">
                Popular Brands
              </h2>
              <div className="flex flex-wrap gap-2">
                {["bambu-lab", "creality", "prusa-research", "elegoo", "anycubic"].map((slug) => {
                  const bc = BRAND_CONFIGS[slug];
                  return (
                    <Link
                      key={slug}
                      to={`/printers/brand/${slug}`}
                      className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                      {bc?.displayName || slug}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* FAQ */}
          {faqItems.length > 0 && (
            <div className="max-w-3xl">
              <FAQSection faqs={faqItems} title={`${label} — FAQ`} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
