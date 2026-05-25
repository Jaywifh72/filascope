import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { DocumentHead, ArticleSchema, BreadcrumbSchema, ItemListSchema, FAQSection } from '@/components/seo'
import { Breadcrumbs } from '@/components/seo/Breadcrumbs'
import { FilamentCard } from '@/components/FilamentCard'

// ── Types ────────────────────────────────────────────────────────────────────
interface FilamentRow {
  id: string
  product_handle: string
  display_name: string
  vendor: string
  material: string
  color_family: string
  variant_price: number | null
  filascope_score: number | null
  nozzle_temp_min: number | null
  nozzle_temp_max: number | null
}

// ── Data ─────────────────────────────────────────────────────────────────────


// ── Component ────────────────────────────────────────────────────────────────
export default function BestFilamentForCrealityEnder3V3() {
  const { data: filaments = [], isLoading } = useQuery({
    queryKey: ['best-filament-creality-ender-3-v3'],
    queryFn: async () => {
      const { data } = await supabase
        .from('filaments')
        .select('id, product_handle, display_name, vendor, material, color_family, variant_price, filascope_score, nozzle_temp_min, nozzle_temp_max')
        .in('material', ["PLA", "PLA+", "PETG", "TPU", "FLEX", "ABS"])
        .not('filascope_score', 'is', null)
        .not('variant_price', 'is', null)
        .order('filascope_score', { ascending: false })
        .limit(20)
      return (data ?? []) as FilamentRow[]
    },
    staleTime: 1000 * 60 * 60 * 24,
  })

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <DocumentHead
        title="Best Filament for Creality Ender-3 V3 in 2026 — FilaScope"
        description="The best filament for the Creality Ender-3 V3 in 2026 — top picks for PLA, PETG. Live prices, print settings & specs from FilaScope's database of 23,000+ filame"
        canonical="https://filascope.com/guides/best-filament-for-creality-ender-3-v3"
        ogType="article"
      />
      <ArticleSchema
        headline="Best Filament for Creality Ender-3 V3 in 2026 — FilaScope"
        description="The best filament for the Creality Ender-3 V3 in 2026 — top picks for PLA, PETG. Live prices, print settings & specs from FilaScope's database of 23,000+ filame"
        datePublished="2026-05-25"
        dateModified="2026-05-25"
        url="/guides/best-filament-for-creality-ender-3-v3"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Best Filament', url: '/guides/best-filament' },
        { name: 'Creality Ender-3 V3', url: '/guides/best-filament-for-creality-ender-3-v3' },
      ]} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Best Filament', href: '/guides/best-filament' },
        { label: 'Creality Ender-3 V3' },
      ]} />

      <h1 className="text-3xl font-bold mb-4">Best Filament for Creality Ender-3 V3 in 2026 — FilaScope</h1>

      ```tsx
{/* Opening Paragraph */}
<p className="text-lg leading-relaxed text-gray-700 mb-6">
  The Creality Ender-3 V3 handles PLA and PETG exceptionally well out of the box, making them the top recommendations for most users — but thanks to its all-metal hotend and 300°C max nozzle temperature, it's also fully capable of pushing into engineering-grade materials like ABS, ASA, Nylon, and even polycarbonate. Whether you're printing functional parts, flexible prototypes, or detailed hobby models, the Ender-3 V3 has the thermal headroom to get the job done. According to FilaScope's database of 23,000+ filaments, the vast majority of materials compatible with this printer fall comfortably within its temperature range, giving you one of the widest material selections in the budget printer category.
</p>

{/* Printer Specs Summary */}
<div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8">
  <h2 className="text-xl font-semibold text-slate-800 mb-3">Why These Materials Work With the Ender-3 V3</h2>
  <p className="text-gray-700 leading-relaxed">
    The Ender-3 V3's all-metal hotend is the key upgrade that separates it from older Ender models — it eliminates the PTFE tube from the hot zone entirely, meaning you can safely print above 240°C without degrading your hotend or releasing fumes. With a 300°C ceiling, materials like ABS (230–250°C), ASA (240–260°C), Nylon/PA12-CF (260–280°C), and PC (270–300°C) are all within reach. The trade-off is the lack of an enclosure: heat-sensitive materials like ABS, ASA, and PC will benefit significantly from a DIY enclosure or printing in a draft-free environment, since ambient temperature control is critical for layer adhesion and warping prevention on those materials.
  </p>
</div>

{/* Key Considerations */}
<div className="mb-8">
  <h2 className="text-xl font-semibold text-slate-800 mb-4">Key Considerations for the Ender-3 V3</h2>
  <ul className="space-y-3">
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></span>
      <span className="text-gray-700 leading-relaxed">
        <strong className="text-slate-800">No enclosure = warping risk on high-temp materials.</strong> ABS, ASA, PC, and Nylon are prone to warping and layer delamination without a stable ambient temperature. If you're printing these regularly, a cardboard or acrylic enclosure DIY build is a worthwhile weekend project before investing in premium filament.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></span>
      <span className="text-gray-700 leading-relaxed">
        <strong className="text-slate-800">All-metal hotend enables abrasive filaments — but check your nozzle.</strong> The stock brass nozzle that ships with the Ender-3 V3 will wear quickly with carbon-fiber or glass-fiber reinforced materials like PA12-CF. Upgrade to a hardened steel or ruby-tipped nozzle before printing any CF/GF composite filament.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></span>
      <span className="text-gray-700 leading-relaxed">
        <strong className="text-slate-800">PLA and PLA+ are the easiest wins.</strong> For most hobbyists, high-quality PLA+ filament hits the sweet spot of printability, strength, and price. According to FilaScope's database of 23,000+ filaments, PLA and PLA+ represent the largest category of in-stock, competitively priced options across 15+ tracked stores — so you'll always find live pricing on current stock.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500"></span>
      <span className="text-gray-700 leading-relaxed">
        <strong className="text-slate-800">TPU and flexible filaments require a direct drive setup.</strong> The Ender-3 V3 uses a direct drive extruder, which is great news — flexible filaments like TPU and FLEX print reliably without the buckling issues seen on Bowden-style setups. Stick to Shore hardness ratings of 95A or softer for best results, and slow your print speed down to 25–35 mm/s.
      </span>
    </li>
  </ul>
</div>

{/* FAQ Section */}
<div className="mb-8">
  <h2 className="text-xl font-semibold text-slate-800 mb-6">Frequently Asked Questions</h2>
  {FAQ_DATA.map((item, index) => (
    <div key={index} className="mb-5 border-b border-slate-100 pb-5 last:border-0">
      <h3 className="text-base font-semibold text-slate-800 mb-2">{item.q}</h3>
      <p className="text-gray-700 leading-relaxed text-sm">{item.a}</p>
    </div>
  ))}
</div>
```

```ts
const FAQ_DATA = [
  {
    q: "Can the Creality Ender-3 V3 print ABS?",
    a: "Yes — the Ender-3 V3's all-metal hotend and 300°C max nozzle temperature make it technically capable of printing ABS, which typically requires 230–250°C. However, without an enclosure, you'll likely experience warping and layer splitting due to draft and ambient temperature fluctuations, so a DIY enclosure is strongly recommended for consistent ABS results.",
  },
  {
    q: "What is the best filament for beginners using the Ender-3 V3?",
    a: "PLA+ is the best starting point for Ender-3 V3 beginners — it prints at 190–230°C, requires no enclosure, adheres well to the stock build plate, and produces strong, detailed prints with minimal tuning. According to FilaScope's database of 23,000+ filaments, PLA+ is consistently one of the most widely available and price-competitive materials across tracked retailers.",
  },
  {
    q: "Can the Ender-3 V3 print PETG?",
    a: "Absolutely — PETG is one of the best filament choices for the Ender-3 V3, printing reliably at 230–250°C with excellent layer adhesion and moderate flexibility. It's ideal for functional parts that need more impact resistance than PLA, and it doesn't require an enclosure, making it a natural upgrade from PLA for intermediate users.",
  },
  {
    q: "Does the Ender-3 V3 support carbon fiber filaments like PA12-CF?",
    a: "The Ender-3 V3 can print PA12-CF and similar carbon-fiber composites thanks to its all-metal hotend reaching up to 300°C, which covers the 260–280°C range these materials require. You must upgrade to a hardened steel nozzle first, as carbon-fiber particles will wear through a stock brass nozzle within a few hundred grams of material.",
  },
  {
    q: "How does the Ender-3 V3 handle flexible filaments like TPU

      {isLoading ? (
        <div className="text-white/40 text-center py-8">Loading top filaments…</div>
      ) : (
        <div className="space-y-3 mt-6">
          {filaments.map(f => (
            <FilamentCard key={f.id} filament={f} />
          ))}
        </div>
      )}

      <FAQSection faqs={FAQ_DATA} />
    </div>
  )
}