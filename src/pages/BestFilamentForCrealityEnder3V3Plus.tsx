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
export default function BestFilamentForCrealityEnder3V3Plus() {
  const { data: filaments = [], isLoading } = useQuery({
    queryKey: ['best-filament-creality-ender-3-v3-plus'],
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
        title="Best Filament for Creality Ender 3 V3 Plus in 2026 — FilaScope"
        description="The best filament for the Creality Ender 3 V3 Plus in 2026 — top picks for PLA, PETG. Live prices, print settings & specs from FilaScope's database of 23,000+ f"
        canonical="https://filascope.com/guides/best-filament-for-creality-ender-3-v3-plus"
        ogType="article"
      />
      <ArticleSchema
        headline="Best Filament for Creality Ender 3 V3 Plus in 2026 — FilaScope"
        description="The best filament for the Creality Ender 3 V3 Plus in 2026 — top picks for PLA, PETG. Live prices, print settings & specs from FilaScope's database of 23,000+ f"
        datePublished="2026-05-25"
        dateModified="2026-05-25"
        url="/guides/best-filament-for-creality-ender-3-v3-plus"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Best Filament', url: '/guides/best-filament' },
        { name: 'Creality Ender 3 V3 Plus', url: '/guides/best-filament-for-creality-ender-3-v3-plus' },
      ]} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Best Filament', href: '/guides/best-filament' },
        { label: 'Creality Ender 3 V3 Plus' },
      ]} />

      <h1 className="text-3xl font-bold mb-4">Best Filament for Creality Ender 3 V3 Plus in 2026 — FilaScope</h1>

      ```tsx
<>
  {/* Opening Paragraph */}
  <p className="text-lg leading-relaxed mb-6">
    The <strong>best filaments for the Creality Ender 3 V3 Plus</strong> are PLA and PLA+ for
    everyday printing, PETG for parts needing heat resistance or flexibility, and TPU/FLEX for
    functional, rubbery components — all confirmed compatible with this printer's 300°C max nozzle
    and PTFE-lined hotend. If you're picking just one filament to start, a quality PLA+ hits the
     sweet spot of ease, strength, and reliability on this machine. According to FilaScope's
    database of 23,000+ filaments, the overwhelming majority of community-rated top performers for
    the Ender 3 V3 Plus fall into these four material categories.
  </p>

  {/* Printer Specs Summary */}
  <section className="mb-8">
    <h2 className="text-2xl font-bold mb-3">
      Why These Materials Work on the Ender 3 V3 Plus
    </h2>
    <p className="leading-relaxed">
      The Ender 3 V3 Plus ships with a <strong>PTFE-lined hotend</strong> that handles temperatures
      up to <strong>300°C</strong> — enough headroom for PLA (190–220°C), PLA+ (200–230°C),
      PETG (230–250°C), and most TPU/FLEX blends (220–240°C) without issue. The PTFE liner is the
      key constraint here: while 300°C is technically achievable, sustained printing above ~240°C
      degrades the PTFE tube over time and can release fumes, which is why engineering-grade
      materials like ABS, ASA, or Nylon are <em>not</em> recommended for this printer without
      a hotend upgrade. The lack of a built-in enclosure further rules out warp-prone materials —
      sticking to the compatible list means fewer headaches and longer hotend life.
    </p>
  </section>

  {/* Key Considerations */}
  <section className="mb-8">
    <h2 className="text-2xl font-bold mb-4">
      Key Considerations for the Ender 3 V3 Plus
    </h2>
    <ul className="space-y-3 list-none pl-0">
      <li className="flex gap-3">
        <span className="mt-1 text-blue-500 font-bold shrink-0">→</span>
        <span>
          <strong>Respect the PTFE ceiling.</strong> Even though the hotend is rated to 300°C,
          keep your print temps at or below 240°C for sustained runs. Pushing higher shortens tube
          lifespan and introduces potential off-gassing — none of the recommended materials
          (PLA, PLA+, PETG, TPU) require going above that threshold in normal use.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="mt-1 text-blue-500 font-bold shrink-0">→</span>
        <span>
          <strong>No enclosure means no ABS or ASA.</strong> Without a heated chamber to
          stabilize ambient temperature, warp-prone materials will fight you on every print.
          PETG is the best "step up" from PLA on this printer if you need heat resistance
          (glass transition ~80°C vs. PLA's ~60°C) — it doesn't need an enclosure and bonds
          well at 230–250°C.
        </span>
      </li>
      <li className="flex gap-3">
        <span className="mt-1 text-blue-500 font-bold shrink-0">→</span>
        <span>
          <strong>TPU requires dialing in retraction.</strong> The Ender 3 V3 Plus uses a
          direct drive extruder, which is actually well-suited for flexible filaments — but
          you'll still want to reduce retraction distance (0.5–1.5mm is a good starting range)
          and slow your print speed (≤30mm/s) to prevent jams with softer TPU Shore ratings
          (85A or below).
        </span>
      </li>
      <li className="flex gap-3">
        <span className="mt-1 text-blue-500 font-bold shrink-0">→</span>
        <span>
          <strong>Bed adhesion varies by material.</strong> PLA grips a clean PEI spring steel
          sheet (stock on this printer) with almost no prep. PETG can be <em>too</em> grippy on
          bare PEI — a thin layer of glue stick or hairspray acts as a release agent and protects
          your sheet. TPU generally releases cleanly from PEI once cooled.
        </span>
      </li>
    </ul>
  </section>

  {/* FAQ Section — rendered by parent component, data defined below */}
</>
```

```ts
const FAQ_DATA = [
  {
    q: "What is the best filament to start with on the Creality Ender 3 V3 Plus?",
    a: "PLA or PLA+ is the best starting point for most users — it prints at 190–230°C, well within the Ender 3 V3 Plus's safe PTFE range, requires no enclosure, and is forgiving of speed and temperature variation. According to FilaScope's database of 23,000+ filaments, PLA and PLA+ account for the largest share of highly-rated filaments compatible with this printer. Once you're comfortable, PETG is a natural next step for parts that need more durability or heat resistance.",
  },
  {
    q: "Can the Ender 3 V3 Plus print PETG?",
    a: "Yes — PETG is fully compatible with the Ender 3 V3 Plus and is one of the recommended materials for this machine. It prints best in the 230–250°C range, which stays safely below the PTFE degradation threshold, and it doesn't require an enclosure, making it ideal for an open-frame printer like this one. Just watch out for PETG's tendency to over-stick to bare PEI; a release agent like glue stick is recommended.",
  },
  {
    q: "Can I print TPU or flexible filaments on the Ender 3 V3 Plus?",
    a: "Yes — the Ender 3 V3 Plus's direct drive extruder makes it genuinely capable with TPU and other flexible filaments, unlike Bowden-tube setups that struggle with soft materials. For best results, use a TPU rated 95A or softer, drop your print speed to 25–35mm/s, and reduce retraction to around 0.5–1.5mm. FilaScope's database flags TPU as a compatible material class for this printer across multiple verified filament listings.",
  },
  {
    q: "Why can't the Ender 3 V3 Plus print ABS or ASA?",
    a: "Two reasons: the PTFE-lined hotend and the lack of an enclosure. ABS and ASA both print above 240°C (typically 230–260°C), where sustained heat begins to degrade PTFE tubing and can release potentially harmful fumes — a risk not worth taking without an all-metal hotend upgrade. Additionally, both materials require a stable, warm ambient environment (an enclosure) to prevent warping and layer delamination, which the open-frame Ender 3 V3 Plus cannot provide out of the box.",
  },
  {
    q: "Does filament brand matter for the Ender 3 V3 Plus?",
    a: "Brand consistency matters more than any specific brand name — tightly toleranced filament diameter (±0.02–0.05mm) is the single biggest factor in reliable extrusion on any FDM printer, including the Ender 3 V3 Plus. FilaScope's database of 23,000+ filaments includes live pricing and specs from 15+ stores, so

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