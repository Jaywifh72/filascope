import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { ItemListSchema } from "@/components/seo/ItemListSchema";
import { PageLoadingSkeleton } from "@/components/skeletons/PageLoadingSkeleton";
import { FilamentCard } from "@/components/FilamentCard";
import { Thermometer, Scale, Tag, Layers } from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Slug → DB materials mapping
// ──────────────────────────────────────────────────────────────
interface SlugConfig {
  label: string;
  materials: string[];
  ilike?: string; // optional ILIKE pattern (e.g. '%silk%')
  relatedSlugs: string[];
  relatedMaterials: string[];
  guides: { label: string; href: string }[];
}

export const MATERIAL_SLUG_CONFIG: Record<string, SlugConfig> = {
  pla: {
    label: "PLA",
    materials: ["PLA", "PLA+", "PLA-HS", "HTPLA", "PLA Pro", "PLA-CF", "Matte PLA", "Marble PLA", "Wood PLA", "Rainbow PLA"],
    relatedSlugs: ["petg", "abs", "silk-pla", "pla-plus"],
    relatedMaterials: ["PETG", "ABS", "Silk PLA", "PLA+"],
    guides: [
      { label: "Best PLA Filaments", href: "/guides/best-pla-filaments" },
      { label: "PLA vs PETG", href: "/pla-vs-petg" },
      { label: "PLA+ vs PLA Pro", href: "/guides/pla-plus-vs-pla-pro" },
    ],
  },
  petg: {
    label: "PETG",
    materials: ["PETG", "PCTG", "PETG-CF", "PETG+", "Co-Polyester"],
    relatedSlugs: ["pla", "abs", "asa"],
    relatedMaterials: ["PLA", "ABS", "ASA"],
    guides: [
      { label: "Best PETG Filaments", href: "/guides/best-petg-filaments" },
      { label: "PLA vs PETG", href: "/pla-vs-petg" },
    ],
  },
  abs: {
    label: "ABS",
    materials: ["ABS", "ABS+", "ABS-CF", "ABS Pro"],
    relatedSlugs: ["asa", "petg", "pc"],
    relatedMaterials: ["ASA", "PETG", "PC"],
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
    guides: [
      { label: "ASA vs ABS for Outdoor Printing", href: "/guides/asa-vs-abs-outdoor-printing" },
    ],
  },
  tpu: {
    label: "TPU",
    materials: ["TPU", "TPU-95A", "TPU-98A", "TPE", "Flexible"],
    relatedSlugs: ["pla", "petg", "nylon"],
    relatedMaterials: ["PLA", "PETG", "Nylon"],
    guides: [],
  },
  "pla-plus": {
    label: "PLA+",
    materials: ["PLA+", "PLA Pro", "PLA-HS"],
    relatedSlugs: ["pla", "petg"],
    relatedMaterials: ["PLA", "PETG"],
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
    guides: [
      { label: "Silk PLA Comparison", href: "/guides/silk-pla-comparison" },
    ],
  },
  nylon: {
    label: "Nylon",
    materials: ["PA", "PA-CF", "PA-GF", "PA6", "PA12", "Nylon", "Nylon-CF"],
    relatedSlugs: ["petg", "pc", "abs"],
    relatedMaterials: ["PETG", "PC", "ABS"],
    guides: [],
  },
  pc: {
    label: "PC",
    materials: ["PC", "PC-CF", "PC-ABS", "PCTG", "Polycarbonate"],
    relatedSlugs: ["abs", "asa", "nylon"],
    relatedMaterials: ["ABS", "ASA", "Nylon"],
    guides: [],
  },
};

// ──────────────────────────────────────────────────────────────
// FAQ helper
// ──────────────────────────────────────────────────────────────
function getMaterialFAQs(slug: string): { question: string; answer: string }[] {
  const base = [
    {
      question: "How should I store this filament?",
      answer:
        "Store filament in a cool, dry place away from direct sunlight. Use an airtight container with desiccant packets to prevent moisture absorption. Hygroscopic materials like Nylon, PETG, and TPU require especially careful storage.",
    },
    {
      question: "What nozzle should I use?",
      answer:
        "Standard brass nozzles work for most non-abrasive filaments. For carbon-fiber, glass-fiber, or metal-filled variants, use hardened steel, ruby, or tungsten carbide nozzles to prevent wear.",
    },
  ];

  const matFaqs: Record<string, { question: string; answer: string }[]> = {
    pla: [
      { question: "What temperature should I print PLA at?", answer: "Most PLA prints well between 190–220 °C nozzle and 50–60 °C bed. Start at 210 °C and adjust based on your brand's datasheet." },
      { question: "Can PLA parts be used outdoors?", answer: "PLA has a low glass-transition temperature (~60 °C) and will deform in hot environments. For outdoor or heat-exposed parts, use PETG, ASA, or ABS instead." },
      { question: "Is PLA food safe?", answer: "PLA is generally food-safe as a material, but FDM layer lines can harbor bacteria. Use food-safe coatings for food-contact applications." },
    ],
    petg: [
      { question: "Why does PETG string so much?", answer: "PETG is prone to stringing. Increase retraction distance (4–6 mm for Bowden, 1–2 mm for direct drive), lower printing temperature by 5 °C, and enable coasting in your slicer." },
      { question: "Does PETG need an enclosure?", answer: "PETG prints well without an enclosure. Avoid drafts, but full enclosure is not required unlike ABS. Bed temp of 70–85 °C and a PEI sheet work well." },
    ],
    abs: [
      { question: "Do I need an enclosure to print ABS?", answer: "Yes, an enclosure is highly recommended for ABS to maintain consistent chamber temperature, prevent warping, and reduce fume emissions." },
      { question: "Is ABS safe to print at home?", answer: "ABS emits styrene fumes. Always print in a well-ventilated area or use an enclosure with a HEPA/activated-carbon filter." },
    ],
    asa: [
      { question: "What makes ASA better than ABS outdoors?", answer: "ASA has significantly better UV resistance than ABS, making it ideal for outdoor functional parts like enclosures, brackets, and automotive components." },
      { question: "Do I need an enclosure for ASA?", answer: "Yes, like ABS, ASA benefits greatly from an enclosure to prevent warping. Chamber temps of 40–50 °C improve layer adhesion." },
    ],
    tpu: [
      { question: "How fast can I print TPU?", answer: "Print TPU at 15–30 mm/s. Faster speeds cause the flexible filament to buckle, especially in Bowden setups. Direct drive extruders handle TPU much better." },
      { question: "Should I use retraction with TPU?", answer: "Minimize or disable retraction for TPU. Flexible filaments jam easily when retracted. If needed, limit retraction to 0.5–2 mm at low speed." },
    ],
    nylon: [
      { question: "Why do my nylon prints come out weak?", answer: "Nylon is highly hygroscopic. Wet filament produces weak, brittle prints with visible bubbling. Always dry nylon at 70–80 °C for 4–6 hours before printing." },
      { question: "What bed adhesion works for nylon?", answer: "Nylon adheres well to Garolite (G10), glue stick on glass, or specialized adhesives like Magigoo PA. PEI alone usually provides insufficient adhesion." },
    ],
    pc: [
      { question: "What temperature does PC require?", answer: "Polycarbonate typically requires 260–310 °C nozzle and 100–120 °C bed temperatures. An all-metal hotend and enclosure are necessary." },
      { question: "Why is PC so difficult to print?", answer: "PC warps severely without an enclosure and requires very high temperatures. Use a hardened nozzle for CF-filled variants and ensure your printer can reach 300 °C+" },
    ],
    "pla-plus": [
      { question: "Is PLA+ actually stronger than PLA?", answer: "PLA+ typically offers higher impact resistance and reduced brittleness vs standard PLA, but the difference varies significantly by brand. Check our specs comparison for actual tensile data." },
      { question: "Can I use the same settings as PLA?", answer: "PLA+ generally prints 5–10 °C hotter than standard PLA and may need slightly higher bed temps (60–65 °C). Check your brand's recommended settings." },
    ],
    "silk-pla": [
      { question: "Why does my silk PLA look dull?", answer: "Silk PLA needs a slightly higher print temp (215–230 °C) for best sheen. Slow down outer wall speed to 30–40 mm/s and reduce cooling for a glossy finish." },
      { question: "Can silk PLA be used for functional parts?", answer: "Silk PLA is primarily aesthetic. It's slightly more brittle than standard PLA and not ideal for structural or load-bearing applications." },
    ],
  };

  return [...(matFaqs[slug] || []), ...base];
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────
export default function MaterialHub() {
  const { slug } = useParams<{ slug: string }>();
  const config = slug ? MATERIAL_SLUG_CONFIG[slug] : null;

  // Stats query: count, avg price, brand count, TD range
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["material-hub-stats", slug],
    enabled: !!config,
    queryFn: async () => {
      if (!config) return null;
      const materials = config.materials;
      const db = supabase as any;
      let q = db.from("filaments")
        .select("id, vendor, variant_price, td_value", { count: "exact" })
        .in("material", materials);
      if (config.ilike) {
        q = db.from("filaments")
          .select("id, vendor, variant_price, td_value", { count: "exact" })
          .or(materials.map((m: string) => `material.eq.${m}`).join(",") + `,material.ilike.${config.ilike}`);
      }
      const { data, count } = await q.limit(1000);
      if (!data) return null;
      const prices = (data as any[]).map((d: any) => d.variant_price).filter(Boolean) as number[];
      const tds = (data as any[]).map((d: any) => d.td_value).filter(Boolean) as number[];
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
        .select("id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, featured_image, td_value, filascope_score, diameter_nominal_mm")
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
        .select("id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, featured_image, td_value, filascope_score, diameter_nominal_mm, variant_available")
        .in("material", config.materials)
        .order("filascope_score", { ascending: false, nullsFirst: false })
        .limit(24);
      return (data ?? []) as any[];
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
  const title = `${label} Filament — Compare ${count.toLocaleString()} Products | FilaScope`;
  const description = `Browse ${count.toLocaleString()} ${label} 3D printer filaments from ${stats?.brandCount ?? ""}+ brands. Compare specs, prices, and HueForge TD values on FilaScope.`;

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

  const faqs = getMaterialFAQs(slug ?? "");

  return (
    <>
      <DocumentHead
        title={title}
        description={description}
        canonical={`https://filascope.com/materials/${slug}`}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
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
          {label} Filament — Compare {count.toLocaleString()} Products
        </h1>
        <p className="text-muted-foreground mb-6 max-w-2xl">
          Browse all {count.toLocaleString()} {label} filaments from {stats?.brandCount}+ brands. Compare prices, specs, and HueForge TD values to find the best {label} for your printer.
        </p>

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
            <h2 className="text-xl font-semibold mb-4">Best {label} Filaments</h2>
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
            <h2 className="text-xl font-semibold mb-4">All {label} Filaments</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map((f) => (
                <FilamentCard key={f.id} filament={f as any} />
              ))}
            </div>
            <div className="mt-6 text-center">
              <Link
                to={`/?material=${slug}`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-sm font-medium"
              >
                Browse all {count.toLocaleString()} {label} filaments →
              </Link>
            </div>
          </section>
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
            <h2 className="text-xl font-semibold mb-4">Relevant Guides</h2>
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
