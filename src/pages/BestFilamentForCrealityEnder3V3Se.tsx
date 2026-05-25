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
export default function BestFilamentForCrealityEnder3V3Se() {
  const { data: filaments = [], isLoading } = useQuery({
    queryKey: ['best-filament-creality-ender-3-v3-se'],
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
        title="Best Filament for Creality Ender 3 V3 SE in 2026 — FilaScope"
        description="The best filament for the Creality Ender 3 V3 SE in 2026 — top picks for PLA, PETG. Live prices, print settings & specs from FilaScope's database of 23,000+ fil"
        canonical="https://filascope.com/guides/best-filament-for-creality-ender-3-v3-se"
        ogType="article"
      />
      <ArticleSchema
        headline="Best Filament for Creality Ender 3 V3 SE in 2026 — FilaScope"
        description="The best filament for the Creality Ender 3 V3 SE in 2026 — top picks for PLA, PETG. Live prices, print settings & specs from FilaScope's database of 23,000+ fil"
        datePublished="2026-05-25"
        dateModified="2026-05-25"
        url="/guides/best-filament-for-creality-ender-3-v3-se"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Best Filament', url: '/guides/best-filament' },
        { name: 'Creality Ender 3 V3 SE', url: '/guides/best-filament-for-creality-ender-3-v3-se' },
      ]} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Best Filament', href: '/guides/best-filament' },
        { label: 'Creality Ender 3 V3 SE' },
      ]} />

      <h1 className="text-3xl font-bold mb-4">Best Filament for Creality Ender 3 V3 SE in 2026 — FilaScope</h1>

      ```tsx
{/* Opening Paragraph */}
<p className="text-lg leading-relaxed text-gray-700 mb-6">
  The <strong>best filaments for the Creality Ender 3 V3 SE</strong> are PLA and PLA+ — they're the sweet spot for this printer's PTFE-lined hotend and open-frame design, delivering reliable prints with minimal tuning right out of the box. PETG is an excellent step-up material if you need more heat resistance or toughness, and TPU/flexible filaments are supported for those who want to push into functional prints. According to FilaScope's database of 23,000+ filaments, the vast majority of community-recommended options for the Ender 3 V3 SE fall into these four categories, covering everything from budget-friendly everyday spools to engineering-grade specialty materials.
</p>

{/* Printer Specs Summary */}
<div className="bg-slate-50 border border-slate-200 rounded-xl p-6 mb-8">
  <h2 className="text-xl font-semibold text-slate-800 mb-3">Why These Materials Work With the Ender 3 V3 SE</h2>
  <p className="text-gray-700 leading-relaxed">
    The Ender 3 V3 SE tops out at a <strong>260°C max nozzle temperature</strong> and ships with a <strong>PTFE-lined hotend</strong> that runs all the way to the nozzle — a setup that's perfectly matched for PLA (195–220°C), PLA+ (200–230°C), PETG (220–250°C), and most flexible/TPU filaments (210–240°C). The PTFE liner is what keeps retraction smooth and stringing in check at these temperatures, but it also means you should avoid sustained printing above ~240°C to prevent the liner from degrading over time. The printer's <strong>lack of an enclosure</strong> is the main limiting factor: materials like ABS, ASA, or Nylon that need a temperature-stable environment to prevent warping and layer delamination are generally not recommended without significant printer modifications.
  </p>
</div>

{/* Key Considerations */}
<div className="mb-8">
  <h2 className="text-xl font-semibold text-slate-800 mb-4">Key Considerations for the Ender 3 V3 SE</h2>
  <ul className="space-y-3">
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
      <span className="text-gray-700">
        <strong>Stay within the PTFE safe zone.</strong> The PTFE-lined hotend performs best below 240°C for sustained prints. Occasional peaks up to 260°C are technically possible, but long print sessions at high temps accelerate liner wear and can introduce particle contamination. Stick to PLA, PLA+, and PETG for daily driving — they all operate comfortably within the safe window.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
      <span className="text-gray-700">
        <strong>No enclosure means no ABS — but PETG fills the gap.</strong> Without an enclosed build chamber, temperature-sensitive materials will warp and crack as ambient air cools the print unevenly. PETG gives you significantly better heat resistance (HDT ~70–80°C vs. PLA's ~55–60°C) and toughness without needing an enclosure, making it the de facto "upgrade" material for this printer.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">3</span>
      <span className="text-gray-700">
        <strong>TPU requires a slow, deliberate approach.</strong> The V3 SE's Bowden-style extruder setup means flexible filaments need to be printed slowly (typically 20–30 mm/s) to avoid buckling in the tube. Shore hardness matters here — harder TPUs (95A and above) are much more forgiving than ultra-soft variants (85A or lower), which can be genuinely difficult on a Bowden-drive machine.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">4</span>
      <span className="text-gray-700">
        <strong>Moisture is the silent print-killer.</strong> PLA and especially PETG are hygroscopic — they absorb ambient humidity and start stringing, popping, and underextruding fast. According to FilaScope's database of 23,000+ filaments, moisture sensitivity is one of the top user-reported issues across all filament categories. Store your spools in airtight containers with desiccant, and dry any filament that's been sitting open for more than a few days before running a long print.
      </span>
    </li>
  </ul>
</div>

{/* FAQ Section */}
{(() => {
  const FAQ_DATA = [
    {
      q: 'What is the best filament for beginners using the Creality Ender 3 V3 SE?',
      a: 'PLA is the best starting point for beginners on the Ender 3 V3 SE — it prints at low temperatures (195–220°C), requires no enclosure, and is very forgiving with bed adhesion on the standard build surface. According to FilaScope\'s database of 23,000+ filaments, PLA consistently ranks as the most user-friendly material across all FDM printers in this class. Once you\'re comfortable dialing in retraction and cooling, PLA+ is a natural next step for slightly stronger, less brittle results.'
    },
    {
      q: 'Can the Ender 3 V3 SE print PETG reliably?',
      a: 'Yes — PETG is fully compatible with the Ender 3 V3 SE and is one of the best material upgrades you can make on this printer. It prints comfortably between 220–245°C, well within the PTFE hotend\'s safe operating range, and doesn\'t require an enclosure as long as you reduce part cooling fan speed to around 30–50%. The main gotcha is bed adhesion: PETG bonds aggressively to glass and PEI surfaces, so a thin release layer (glue stick or hairspray) is strongly recommended.'
    },
    {
      q: 'Is the Ender 3 V3 SE capable of printing TPU and flexible filaments?',
      a: 'The Ender 3 V3 SE can print TPU, but its Bowden extruder setup makes it more challenging than on a direct-drive machine. Harder Shore 95A TPU variants print most reliably — expect to drop print speeds to 20–30 mm/s and increase retraction distance slightly to manage stringing. Softer TPUs (85A or below) are significantly harder to run without buckling in the Bowden tube, and most makers find the results inconsistent without hardware modifications.'
    },
    {
      q: 'Can you print ABS or ASA on the Ender 3 V3 SE?',
      a: 'ABS and ASA are not recommended for the stock Ender 3 V3 SE — both materials require a consistent, enclosed build environment to prevent warping and layer splitting, which this open-frame printer cannot

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