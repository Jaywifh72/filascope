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
export default function BestFilamentForCrealityK1Max() {
  const { data: filaments = [], isLoading } = useQuery({
    queryKey: ['best-filament-creality-k1-max'],
    queryFn: async () => {
      const { data } = await supabase
        .from('filaments')
        .select('id, product_handle, display_name, vendor, material, color_family, variant_price, filascope_score, nozzle_temp_min, nozzle_temp_max')
        .in('material', ["PLA", "PLA+", "PETG", "TPU", "FLEX"])
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
        title="Best Filament for Creality K1 Max in 2026 — FilaScope"
        description="The best filament for the Creality K1 Max in 2026 — top picks for PLA, PETG, ABS & ASA. Live prices, print settings & specs from FilaScope's database of 23,000+"
        canonical="https://filascope.com/guides/best-filament-for-creality-k1-max"
        ogType="article"
      />
      <ArticleSchema
        headline="Best Filament for Creality K1 Max in 2026 — FilaScope"
        description="The best filament for the Creality K1 Max in 2026 — top picks for PLA, PETG, ABS & ASA. Live prices, print settings & specs from FilaScope's database of 23,000+"
        datePublished="2026-05-25"
        dateModified="2026-05-25"
        url="/guides/best-filament-for-creality-k1-max"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Best Filament', url: '/guides/best-filament' },
        { name: 'Creality K1 Max', url: '/guides/best-filament-for-creality-k1-max' },
      ]} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Best Filament', href: '/guides/best-filament' },
        { label: 'Creality K1 Max' },
      ]} />

      <h1 className="text-3xl font-bold mb-4">Best Filament for Creality K1 Max in 2026 — FilaScope</h1>

      ```tsx
{/* Opening Paragraph */}
<section className="prose prose-lg max-w-none mb-8">
  <p>
    The Creality K1 Max works best with <strong>PLA, PLA+, and PETG</strong> for
    everyday printing, while its enclosed build chamber and 300°C max nozzle
    temperature also unlock reliable results with TPU and flexible filaments.
    Whether you're printing functional prototypes or detailed display pieces,
    this printer's spec sheet is a strong match for the most popular filament
    categories on the market today.
  </p>
</section>

{/* Printer Specs Summary */}
<section className="prose prose-lg max-w-none mb-8">
  <h2 className="text-2xl font-bold mb-4">
    Why These Materials Work With the K1 Max
  </h2>
  <p>
    The K1 Max runs a <strong>PTFE-lined hotend</strong> with a maximum nozzle
    temperature of <strong>300°C</strong>, which comfortably covers the full
    processing range for PLA (180–230°C), PLA+ (190–240°C), PETG (220–250°C),
    and most TPU/flexible blends (220–240°C). The PTFE liner means you'll want
    to stay below ~260°C for extended prints to avoid liner degradation — so
    materials like standard nylon or ABS can technically hit the target temp,
    but they're not officially recommended for this hotend over long runs.
    Meanwhile, the <strong>enclosed build chamber</strong> gives a meaningful
    boost to PETG and flexible filament adhesion by reducing drafts and keeping
    ambient temperatures stable throughout a print.
  </p>
</section>

{/* Key Considerations */}
<section className="mb-8">
  <h2 className="text-2xl font-bold mb-4">
    Key Considerations for the Creality K1 Max
  </h2>
  <ul className="space-y-3 list-none p-0">
    <li className="flex items-start gap-3">
      <span className="text-blue-500 font-bold text-lg mt-0.5">•</span>
      <span>
        <strong>Respect the PTFE ceiling.</strong> The K1 Max's PTFE-lined
        hotend performs best when nozzle temps stay at or below 260°C for
        extended sessions. According to FilaScope's database of 23,000+
        filaments, the vast majority of PLA, PLA+, PETG, and TPU options print
        well within this window — so you have plenty of choices without
        stressing the liner.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="text-blue-500 font-bold text-lg mt-0.5">•</span>
      <span>
        <strong>Use the enclosure strategically.</strong> The enclosed chamber
        is a real asset for PETG and flexible filaments, helping reduce warping
        and layer delamination. For PLA, you may actually want to crack the
        enclosure door slightly on longer prints to prevent heat creep at the
        hotend.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="text-blue-500 font-bold text-lg mt-0.5">•</span>
      <span>
        <strong>Dial in retraction for high-speed printing.</strong> The K1 Max
        is built for speed — and that means retraction settings matter more than
        on slower machines. PETG in particular is prone to stringing at high
        travel speeds, so budget time to tune retraction distance and speed for
        your specific filament brand.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="text-blue-500 font-bold text-lg mt-0.5">•</span>
      <span>
        <strong>Check spool compatibility for large builds.</strong> The K1 Max
        has a generous 300 × 300 × 300 mm build volume, which means big prints
        that can chew through filament fast. Make sure your chosen filament is
        available in 1 kg or 2 kg spools to avoid mid-print swaps — FilaScope's
        filters let you sort by spool weight across all 23,000+ listings.
      </span>
    </li>
  </ul>
</section>

{/* FAQ Section */}
<section className="mb-8">
  <h2 className="text-2xl font-bold mb-6">
    Frequently Asked Questions
  </h2>
  {FAQ_DATA.map((item, index) => (
    <div key={index} className="mb-6 border-b border-gray-200 pb-6 last:border-0">
      <h3 className="text-lg font-semibold mb-2">{item.q}</h3>
      <p className="text-gray-700 leading-relaxed">{item.a}</p>
    </div>
  ))}
</section>
```

```ts
const FAQ_DATA = [
  {
    q: "Can the Creality K1 Max print ABS or ASA filament?",
    a: "Technically the K1 Max can reach the temperatures needed for ABS and ASA (230–260°C), but Creality does not officially recommend these materials because the PTFE-lined hotend can degrade and off-gas at sustained temps above 260°C. If you do attempt ABS or ASA, keep print times short, ensure good ventilation, and monitor closely — most makers on this printer stick with PETG as a higher-temperature alternative that's fully within spec.",
  },
  {
    q: "What is the best filament for functional parts on the K1 Max?",
    a: "PETG is the go-to choice for functional parts on the K1 Max — it offers significantly better impact resistance, heat tolerance (up to ~80°C), and layer bonding than standard PLA, while staying well within the printer's safe operating range. According to FilaScope's database of 23,000+ filaments, PETG is one of the most widely stocked materials across major retailers, so you'll have no shortage of options at competitive price points.",
  },
  {
    q: "Does the K1 Max support flexible filaments like TPU?",
    a: "Yes, the K1 Max is compatible with TPU and other flexible filaments rated in the 220–240°C printing range, which the printer handles comfortably. The main watchpoint is slowing down print speed significantly for flexibles — the K1 Max's high-speed direct drive can cause feeding issues with very soft TPU (Shore hardness below 85A) if speeds aren't dialed back to 20–30 mm/s for the first few layers.",
  },
  {
    q: "Is PLA+ worth using over standard PLA on the K1 Max?",
    a: "For most use cases, PLA+ is a worthwhile upgrade over standard PLA — it typically offers better impact resistance, slightly higher heat deflection, and reduced brittleness, all while printing at similar temperatures (190–240°C) that are ideal for the K1 Max's PTFE hotend. The price difference between PLA and PLA+ has narrowed considerably; FilaScope's live pricing data shows the gap is often just a few dollars per kilogram, making PLA+ the better value for anything beyond purely decorative prints.",
  },
  {
    q: "What filament diameter should I use with the Creality K1 Max?",
    a: "The Creality K1 Max uses standard <strong>1.75 mm</strong> filament — this is the universal diameter for consumer FDM printers and covers virtually every PLA, PLA+, PETG, TPU, and flex filament you'll find on the market. When browsing FilaScope's database, filtering to 1.75 mm will surface all compatible options, and you'll find that nearly all filaments listed across 15+ stores are available in this size.",
  },
];
```

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