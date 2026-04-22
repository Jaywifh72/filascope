import { useParams, Navigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { BreadcrumbSchema } from "@/components/seo/BreadcrumbSchema";
import { CollectionPageSchema } from "@/components/seo/CollectionPageSchema";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { FAQSection } from "@/components/seo/FAQSection";
import { ItemListSchema } from "@/components/seo/ItemListSchema";
import { PageLoadingSkeleton } from "@/components/skeletons/PageLoadingSkeleton";
import { FilamentCard } from "@/components/FilamentCard";
import { Zap } from "lucide-react";

// ──────────────────────────────────────────────────────────────
// Color slug → color_family DB values
// ──────────────────────────────────────────────────────────────
interface ColorConfig {
  label: string;
  families: string[];
  hex: string; // representative color for swatch
  hueforgeRelevant?: boolean;
}

export const COLOR_SLUG_CONFIG: Record<string, ColorConfig> = {
  white:   { label: "White",   families: ["White"],                    hex: "#FFFFFF", hueforgeRelevant: true },
  black:   { label: "Black",   families: ["Black"],                    hex: "#1A1A1A" },
  blue:    { label: "Blue",    families: ["Blue"],                     hex: "#2563EB" },
  red:     { label: "Red",     families: ["Red"],                      hex: "#DC2626" },
  green:   { label: "Green",   families: ["Green"],                    hex: "#16A34A" },
  gray:    { label: "Gray",    families: ["Gray", "Grey", "Light Grey", "Dark Grey", "Silver Gray"], hex: "#6B7280" },
  yellow:  { label: "Yellow",  families: ["Yellow"],                   hex: "#EAB308" },
  orange:  { label: "Orange",  families: ["Orange"],                   hex: "#EA580C" },
  purple:  { label: "Purple",  families: ["Purple", "Violet"],         hex: "#7C3AED" },
  brown:   { label: "Brown",   families: ["Brown", "Tan", "Beige"],    hex: "#92400E" },
  natural: { label: "Natural", families: ["Natural", "Beige", "Cream"], hex: "#D4C5A9", hueforgeRelevant: true },
  pink:    { label: "Pink",    families: ["Pink", "Rose", "Magenta"],  hex: "#EC4899" },
  clear:   { label: "Clear",   families: ["Clear", "Transparent", "Natural Clear"], hex: "#E0F2FE", hueforgeRelevant: true },
  gold:    { label: "Gold",    families: ["Gold", "Bronze"],           hex: "#D97706" },
  silver:  { label: "Silver",  families: ["Silver", "Chrome", "Metallic"], hex: "#94A3B8" },
};

const ALL_COLOR_SLUGS = Object.keys(COLOR_SLUG_CONFIG);

// ──────────────────────────────────────────────────────────────
// FAQ helper
// ──────────────────────────────────────────────────────────────
function getColorFAQs(slug: string, label: string, count: number): { question: string; answer: string }[] {
  const base = [
    {
      question: `How do I choose the best ${label.toLowerCase()} filament?`,
      answer: `Compare ${label.toLowerCase()} filaments by brand, material type, price, and HueForge TD value. Our filascope score combines data completeness, multi-region pricing, and brand reputation to help you find the best option.`,
    },
    {
      question: `What materials are available in ${label.toLowerCase()}?`,
      answer: `${label} filaments are available across most material types including PLA, PETG, ABS, ASA, TPU, and specialty variants. PLA has the widest ${label.toLowerCase()} selection with the most brand options.`,
    },
    {
      question: `Do ${label.toLowerCase()} filaments print the same as other colors?`,
      answer: `Most ${label.toLowerCase()} filaments use the same print settings as their base material. However, pigment loading can affect flow — check each brand's specific datasheet. Some dark pigments absorb more heat and may need slightly lower temperatures.`,
    },
  ];

  const colorSpecific: Record<string, { question: string; answer: string }[]> = {
    white: [
      { question: "Why is white filament important for HueForge?", answer: "White filament acts as the 'light source' layer in HueForge lithophanes. Its TD (Transmission Distance) value is critical — lower TD = more opaque, higher TD = more transparent. Most HueForge projects use white PLA as the base layer." },
      { question: "What TD value should white PLA have for HueForge?", answer: "For HueForge, most community members target white PLA with TD values between 1.5–2.5 mm for a good balance of light transmission and opacity. Check our HueForge TD Database for tested values across 500+ filaments." },
    ],
    natural: [
      { question: "Is natural filament the same as white?", answer: "No — natural filament is uncolored (no pigment added) and appears slightly off-white or cream. It typically has higher light transmission than white filament, giving it a higher TD value useful for HueForge base layers." },
    ],
    clear: [
      { question: "What is clear/transparent filament used for?", answer: "Clear filament is popular for light diffusion, display cases, lenses, HueForge projects, and aesthetic parts. PETG and PC are commonly used for transparent prints due to their clarity when printed at optimal settings." },
      { question: "How do I get clearer results with transparent filament?", answer: "For maximum clarity: use a high print temp, slow speed, and disable part cooling. Use smooth Ironing on top surfaces. PETG and PC offer better optical clarity than transparent PLA." },
    ],
    black: [
      { question: "Does black filament absorb more UV heat?", answer: "Yes — black filament absorbs significantly more heat from sunlight due to its pigment. This makes black ASA and ABS good for outdoor parts, but also means prints can warp more easily during printing if fan cooling is aggressive." },
    ],
  };

  return [...(colorSpecific[slug] || []), ...base];
}

// ──────────────────────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────────────────────
export default function ColorFamilyPage() {
  const { family: slug } = useParams<{ family: string }>();
  const config = slug ? COLOR_SLUG_CONFIG[slug] : null;

  // Products query
  const { data: filaments, isLoading } = useQuery({
    queryKey: ["color-family-page", slug],
    enabled: !!config,
    queryFn: async () => {
      if (!config) return [] as any[];
      const { data } = await (supabase as any)
        .from("filaments")
        .select("id, product_handle, product_title, display_name, vendor, material, color_family, color_hex, variant_price, price_cad, price_eur, price_gbp, price_aud, price_jpy, net_weight_g, pack_quantity, featured_image, td_value, filascope_score, diameter_nominal_mm, variant_available")
        .in("color_family", config.families)
        .order("filascope_score", { ascending: false, nullsFirst: false })
        .limit(48);
      return (data ?? []) as any[];
    },
  });

  // Count query (separate for accuracy)
  const { data: totalCount } = useQuery({
    queryKey: ["color-family-count", slug],
    enabled: !!config,
    queryFn: async () => {
      if (!config) return 0;
      const { count } = await supabase
        .from("filaments")
        .select("id", { count: "exact", head: true })
        .in("color_family", config.families);
      return count ?? 0;
    },
  });

  // noindex / redirect for unknown slugs
  if (!config) return <Navigate to="/colors" replace />;

  // Thin content guard
  if (!isLoading && filaments && filaments.length < 3) {
    return <Navigate to="/colors" replace />;
  }

  if (isLoading) return <PageLoadingSkeleton />;

  const label = config.label;
  const count = totalCount ?? filaments?.length ?? 0;

  // Build title/description
  let description: string;
  if (slug === "white" || slug === "natural" || slug === "clear") {
    description = `Browse ${count.toLocaleString()}+ ${label.toLowerCase()} 3D printer filaments. Compare prices, specs, HueForge TD values & printer compatibility across brands on FilaScope. Essential for lithophanes.`;
  } else {
    description = `Browse ${count.toLocaleString()}+ ${label.toLowerCase()} 3D printer filaments. Compare prices, specs, HueForge TD values & printer compatibility across brands on FilaScope.`;
  }
  const title = `${label} 3D Printer Filaments — Compare ${count.toLocaleString()}+ Options | FilaScope`;

  const breadcrumbItems = [
    { name: "Home", url: "/" },
    { name: "Color Finder", url: "/colors" },
    { name: `${label} Filaments`, url: `/colors/${slug}` },
  ];

  const itemListItems = (filaments ?? []).slice(0, 10).map((f, i) => ({
    name: f.display_name || f.product_title || "Filament",
    url: `https://filascope.com/filament/${f.product_handle || f.id}`,
    image: f.featured_image ?? undefined,
    description: [f.vendor, f.material, f.color].filter(Boolean).join(" · "),
    position: i + 1,
  }));

  // Unique hex swatches (up to 20)
  const swatchHexes = [
    ...new Set(
      (filaments ?? [])
        .map((f) => f.color_hex)
        .filter((h): h is string => !!h && h.length === 7)
    ),
  ].slice(0, 20);

  const faqs = getColorFAQs(slug ?? "", label, count);

  // Sibling color links (exclude current)
  const siblingColors = ALL_COLOR_SLUGS.filter((s) => s !== slug).slice(0, 8);

  return (
    <>
      <DocumentHead
        title={title}
        description={description}
        canonical={`https://filascope.com/colors/${slug}`}
      />
      <BreadcrumbSchema items={breadcrumbItems} />
      <CollectionPageSchema
        name={`${label} 3D Printer Filaments`}
        description={`Browse all ${label.toLowerCase()} 3D printer filaments. Compare specs, prices, and HueForge TD values across brands on FilaScope.`}
        url={`https://filascope.com/colors/${slug}`}
        numberOfItems={count}
      />
      {itemListItems.length > 0 && (
        <ItemListSchema
          name={`${label} 3D Printer Filaments`}
          items={itemListItems}
          itemListOrder="Ascending"
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Breadcrumbs items={breadcrumbItems.slice(1)} className="mb-4" />

        {/* H1 + swatch */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-8 h-8 rounded-full border border-border/50 shrink-0 shadow-sm"
            style={{ backgroundColor: config.hex }}
            aria-hidden="true"
          />
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {label} 3D Printer Filaments
          </h1>
        </div>
        <p className="text-muted-foreground mb-4 max-w-2xl">{description}</p>

        {/* HueForge callout for white/natural/clear */}
        {config.hueforgeRelevant && (
          <div className="flex items-start gap-3 mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5">
            <Zap className="w-5 h-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-foreground mb-1">HueForge TD Values</p>
              <p className="text-sm text-muted-foreground">
                {label} filament is commonly used in HueForge lithophane projects. TD values are shown on each product card.{" "}
                <Link to="/hueforge-td-database" className="text-primary hover:underline">
                  Browse our HueForge TD Database →
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Color swatch preview */}
        {swatchHexes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-8">
            {swatchHexes.map((hex) => (
              <div
                key={hex}
                className="w-7 h-7 rounded-full border border-border/40 shadow-sm"
                style={{ backgroundColor: hex }}
                title={hex}
              />
            ))}
            {count > 20 && (
              <div className="w-7 h-7 rounded-full border border-border bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground">
                +{count - 20}
              </div>
            )}
          </div>
        )}

        {/* Product grid */}
        {filaments && filaments.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4">
              {label} Filaments — {count.toLocaleString()} Options
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filaments.map((f) => (
                <FilamentCard key={f.id} filament={f as any} />
              ))}
            </div>
            {count > 48 && (
              <div className="mt-6 text-center">
                <Link
                  to={`/colors?family=${slug}`}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-sm font-medium"
                >
                  Browse all {count.toLocaleString()} {label.toLowerCase()} filaments →
                </Link>
              </div>
            )}
          </section>
        )}

        {/* Explore other colors */}
        <section className="mb-10">
          <h2 className="text-xl font-semibold mb-4">Explore Other Colors</h2>
          <div className="flex flex-wrap gap-3">
            {siblingColors.map((s) => {
              const c = COLOR_SLUG_CONFIG[s];
              return (
                <Link
                  key={s}
                  to={`/colors/${s}`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-sm font-medium"
                >
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-border/40"
                    style={{ backgroundColor: c.hex }}
                    aria-hidden="true"
                  />
                  {c.label}
                </Link>
              );
            })}
            <Link
              to="/colors"
              className="px-4 py-2 rounded-lg border border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors text-sm font-medium"
            >
              Color Finder →
            </Link>
          </div>
        </section>

        {/* FAQ */}
        <FAQSection faqs={faqs} title={`${label} Filament FAQ`} />
      </div>
    </>
  );
}
