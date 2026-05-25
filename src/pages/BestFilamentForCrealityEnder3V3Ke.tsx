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
export default function BestFilamentForCrealityEnder3V3Ke() {
  const { data: filaments = [], isLoading } = useQuery({
    queryKey: ['best-filament-creality-ender-3-v3-ke'],
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
        title="Best Filament for Creality Ender 3 V3 KE in 2026 — FilaScope"
        description="The best filament for the Creality Ender 3 V3 KE in 2026 — top picks for PLA, PETG. Live prices, print settings & specs from FilaScope's database of 23,000+ fil"
        canonical="https://filascope.com/guides/best-filament-for-creality-ender-3-v3-ke"
        ogType="article"
      />
      <ArticleSchema
        headline="Best Filament for Creality Ender 3 V3 KE in 2026 — FilaScope"
        description="The best filament for the Creality Ender 3 V3 KE in 2026 — top picks for PLA, PETG. Live prices, print settings & specs from FilaScope's database of 23,000+ fil"
        datePublished="2026-05-25"
        dateModified="2026-05-25"
        url="/guides/best-filament-for-creality-ender-3-v3-ke"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Best Filament', url: '/guides/best-filament' },
        { name: 'Creality Ender 3 V3 KE', url: '/guides/best-filament-for-creality-ender-3-v3-ke' },
      ]} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Best Filament', href: '/guides/best-filament' },
        { label: 'Creality Ender 3 V3 KE' },
      ]} />

      <h1 className="text-3xl font-bold mb-4">Best Filament for Creality Ender 3 V3 KE in 2026 — FilaScope</h1>

      ```tsx
{/* Opening Paragraph */}
<p className="text-lg leading-relaxed text-gray-700 mb-6">
  The Creality Ender 3 V3 KE handles <strong>PLA and PLA+ best for everyday printing</strong>, but its all-metal hotend and 300°C max nozzle temperature unlock a genuinely wide material range — including PETG, TPU, ABS, ASA, Nylon, and even Polycarbonate. If you want one filament that balances ease of use, print quality, and value on this machine, <strong>PLA+ is the sweet spot</strong> for most makers. Push the hardware further and PETG becomes the go-to upgrade for functional parts that need heat and chemical resistance.
</p>

{/* Printer Specs Summary */}
<p className="text-base leading-relaxed text-gray-600 mb-8">
  The Ender 3 V3 KE ships with an <strong>all-metal hotend</strong> rated to <strong>300°C</strong>, which is the single biggest factor in its material compatibility. Unlike PTFE-lined hotends that cap out around 240°C (and degrade with ABS or higher-temp materials), the all-metal design lets you safely run ABS at 230–250°C, ASA at 240–260°C, Nylon at 240–280°C, and PC at up to 300°C without off-gassing concerns from the heat break. The trade-off is that the printer ships <strong>without an enclosure</strong>, which limits practical results with warp-prone materials like ABS, ASA, and PC unless you add one. According to FilaScope's database of 23,000+ filaments, the materials tagged as compatible with this printer span temperature windows from as low as 180°C (flexible TPU) to 300°C (Polycarbonate), giving you one of the broadest ranges in the Ender 3 lineup.
</p>

{/* Key Considerations */}
<section className="mb-10">
  <h2 className="text-2xl font-bold text-gray-900 mb-4">Key Considerations for the Ender 3 V3 KE</h2>
  <ul className="space-y-4 list-none pl-0">
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>No enclosure = warping risk for high-temp materials.</strong> ABS, ASA, and PC are technically within the hotend's range, but without a warm, draft-free enclosure, layer delamination and corner warping are common failure points. PETG gives you most of the functional benefits of ABS with far less warping on an open-frame machine.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>TPU and flexible filaments require a direct drive extruder.</strong> The V3 KE uses a direct drive setup, which is ideal for TPU (shore hardness 85A–98A) and other flex filaments — a major advantage over Bowden-style Ender 3 variants. Stick to print speeds of 20–35 mm/s for best results with softer flexibles.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>Nylon and PA12-CF need dry filament, full stop.</strong> Nylon is notoriously hygroscopic — even a few hours of ambient exposure can cause bubbling, stringing, and weak layer adhesion. If you're running PA12-CF or any Nylon variant, a filament dryer or sealed storage with desiccant is not optional, it's mandatory.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>Carbon fiber and abrasive composites will wear a brass nozzle fast.</strong> Materials like PA12-CF contain chopped carbon fiber that is highly abrasive. If you're printing CF-filled filaments regularly, upgrading to a hardened steel or Ruby-tipped nozzle will significantly extend nozzle life and maintain print quality over time.
      </span>
    </li>
  </ul>
</section>

{/* FAQ Section */}
<section className="mb-10">
  <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
  {(() => {
    const FAQ_DATA = [
      {
        q: "Can the Creality Ender 3 V3 KE print ABS without an enclosure?",
        a: "Technically yes — the all-metal hotend reaches the 230–250°C range ABS requires — but results are inconsistent on an open-frame machine. Drafts and ambient temperature swings cause warping and layer separation, especially on larger prints. If ABS is a priority, adding a DIY or aftermarket enclosure dramatically improves success rates."
      },
      {
        q: "What is the best filament for functional parts on the Ender 3 V3 KE?",
        a: "PETG is the top recommendation for functional parts on this printer. It offers a heat deflection temperature around 70–80°C, good chemical resistance, and low warping — all without needing an enclosure. According to FilaScope's database of 23,000+ filaments, PETG is one of the most-stocked materials across major retailers, making it easy to find at competitive prices."
      },
      {
        q: "Does the Ender 3 V3 KE support TPU and flexible filaments?",
        a: "Yes, and it does so reliably thanks to the direct drive extruder. The direct drive system gives you precise control over flexible filament feeding, which Bowden setups struggle with. TPU with a shore hardness of 85A–95A prints well at 220–240°C and 20–35 mm/s — just disable retraction or keep it minimal to avoid jams."
      },
      {
        q: "Can the Ender 3 V3 KE print Polycarbonate (PC)?",
        a: "Yes, the 300°C hotend rating makes PC possible, but the lack of an enclosure and an unheated chamber make it challenging. PC requires nozzle temps of 260–300°C and a bed at 90–110°C, but it's highly prone to warping and cracking without a controlled environment. For PC-like rigidity and strength with fewer headaches, consider PC-ABS blends or ASA as a stepping stone."
      },
      {
        q: "What filament should a beginner start with on the Ender 3 V3 KE?",
        a: "Start with PLA or PLA+. PLA prints at 180–220°C, requires no special bed surface preparation, and is the most forgiving material for dialing in first-layer calibration and slicer settings. According to FilaScope's database of 23,000+ filaments, PLA and PLA+ account for the largest share of available options across all tracked stores, so availability and pricing are always competitive."
      }
    ];

    return (
      <div className="space-y-6">
        {FAQ_DATA.map((item, index) => (
          <div key={index} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <h3 className="text-lg font-

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