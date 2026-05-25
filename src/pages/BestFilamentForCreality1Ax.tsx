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
export default function BestFilamentForCreality1Ax() {
  const { data: filaments = [], isLoading } = useQuery({
    queryKey: ['best-filament-creality-K1 Max'],
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
        title="Best Filament for Creality K1 Max in 2026 — FilaScope"
        description="The best filament for the Creality K1 Max in 2026 — top picks for PLA, PETG, ABS & ASA. Live prices, print settings & specs from FilaScope's database of 23,000+"
        canonical="https://filascope.com/guides/best-filament-for-creality-K1 Max"
        ogType="article"
      />
      <ArticleSchema
        headline="Best Filament for Creality K1 Max in 2026 — FilaScope"
        description="The best filament for the Creality K1 Max in 2026 — top picks for PLA, PETG, ABS & ASA. Live prices, print settings & specs from FilaScope's database of 23,000+"
        datePublished="2026-05-25"
        dateModified="2026-05-25"
        url="/guides/best-filament-for-creality-K1 Max"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Best Filament', url: '/guides/best-filament' },
        { name: 'Creality K1 Max', url: '/guides/best-filament-for-creality-K1 Max' },
      ]} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Best Filament', href: '/guides/best-filament' },
        { label: 'Creality K1 Max' },
      ]} />

      <h1 className="text-3xl font-bold mb-4">Best Filament for Creality K1 Max in 2026 — FilaScope</h1>

      ```tsx
{/* Opening Paragraph */}
<p className="text-lg leading-relaxed text-gray-700 mb-6">
  The Creality K1 Max works best with PLA, PETG, and ABS/ASA as everyday workhorse materials, but its all-metal hotend and enclosed build chamber unlock serious engineering-grade options like PA, PC, and carbon-fiber composites that most printers simply can't touch. If you want a single recommendation to start with, PETG hits the sweet spot of ease-of-use and functional strength on this machine. That said, the K1 Max's hardware headroom means you can confidently step up to ABS, ASA, or even PA-CF as your skills grow — without swapping a single component.
</p>

{/* Printer Specs Summary */}
<p className="text-base leading-relaxed text-gray-600 mb-8">
  The K1 Max tops out at a 300 °C nozzle temperature and pairs that with a fully enclosed print chamber — a combination that makes a measurable difference in material compatibility. The all-metal hotend eliminates the PTFE liner found in budget printers, which typically caps usable temperatures around 240 °C and degrades when pushed higher. Because of this, the K1 Max can safely run high-temp materials like Polycarbonate (typically 260–300 °C), Nylon/PA (240–270 °C), and carbon-fiber-reinforced composites that demand both heat and abrasion resistance. The enclosure adds passive chamber heat that reduces warping in shrinkage-prone materials like ABS and ASA — a problem that plagues open-frame printers even when nozzle temps are sufficient. In short: this printer's specs aren't marketing fluff; they're why 14 distinct material families are legitimately compatible with it.
</p>

{/* Key Considerations */}
<div className="mb-10">
  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Key Considerations for the Creality K1 Max</h2>
  <ul className="space-y-3 list-none">
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>Abrasive filaments require a hardened nozzle.</strong> Materials like PA-CF and PA12-CF contain chopped carbon fiber that will wear through a standard brass nozzle in hours. Before printing any CF or GF composite, swap to a hardened steel or ruby-tipped nozzle — it's a $10–25 upgrade that protects a much more expensive machine. According to FilaScope's database of 23,000+ filaments, the majority of CF-reinforced listings explicitly flag hardened nozzle as a requirement.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>Moisture control matters more than most people think.</strong> Hygroscopic materials — Nylon, PA-CF, PETG, and PC — absorb ambient humidity and print with stringing, bubbling, and weak layer adhesion as a result. The K1 Max's enclosure helps retain heat but doesn't dry filament. Store spools in sealed bags with desiccant and consider a filament dryer for any print session longer than a few hours with moisture-sensitive materials.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>The enclosure is an asset — use it deliberately.</strong> For ABS and ASA, keep the enclosure closed for the entire print to trap radiant heat and prevent layer delamination. For PLA, you may actually want to crack the enclosure open slightly or add a cooling fan boost, since PLA prefers cooler ambient temps and can soften in a warm chamber during long prints.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>Match bed surface to material.</strong> The K1 Max ships with a textured PEI plate that works well for PLA, PETG, and ABS. For high-temp materials like PC or PA, a smooth PEI or garolite surface often provides better adhesion. Using the wrong bed surface is one of the most common reasons prints fail on otherwise well-configured machines — a small detail with a big impact on first-layer success.
      </span>
    </li>
  </ul>
</div>

{/* FAQ Data */}
const FAQ_DATA = [
  {
    q: "What is the best all-around filament for the Creality K1 Max?",
    a: "PETG is the best all-around choice for most K1 Max users — it's easy to dial in, produces strong and slightly flexible parts, and handles temperatures the printer manages comfortably (typically 230–250 °C nozzle, 70–85 °C bed). It bridges the gap between beginner-friendly PLA and more demanding engineering materials. According to FilaScope's database of 23,000+ filaments, PETG is one of the most widely stocked filament types across 15+ tracked retailers, meaning price competition keeps costs reasonable."
  },
  {
    q: "Can the Creality K1 Max print ABS and ASA reliably?",
    a: "Yes — the K1 Max's enclosed build chamber makes it one of the more capable prosumer printers for ABS and ASA, materials notorious for warping on open-frame machines. ABS typically runs at 230–250 °C nozzle and 90–110 °C bed, while ASA is similar but offers better UV resistance for outdoor parts. Keep the enclosure sealed throughout the print and ensure good bed adhesion with a PEI surface or thin layer of ABS slurry for best results."
  },
  {
    q: "Is the K1 Max capable of printing carbon fiber reinforced filaments?",
    a: "The K1 Max can print CF-reinforced materials like PA-CF and PA12-CF, but you must replace the stock brass nozzle with a hardened steel alternative first — CF composites will abrade a brass nozzle within a single spool. These materials typically require nozzle temps of 250–280 °C, well within the K1 Max's 300 °C ceiling. FilaScope's database of 23,000+ filaments includes dozens of PA-CF and PA12-CF options with live pricing so you can compare cost per kilogram before committing."
  },
  {
    q: "Does the Creality K1 Max need any upgrades to print Nylon (PA)?",
    a: "No hardware upgrades are strictly required for standard Nylon/PA — the all-metal hotend and enclosure handle it natively at typical print temps of 240–270 °C nozzle and 70–90 °C bed. The most important prep step is thorough filament drying, as Nylon is extremely hygroscopic and even a few hours of ambient exposure can ruin print quality. A filament dryer running during the print is the single most effective upgrade for Nylon success on any printer, including the K1 Max."
  },
  {
    q: "What filament should a beginner start with on the Creality K1 Max?",
    a: "PLA or PLA+ is the right starting point — it's forgiving with temperatures (typically 190–220 °C nozzle, 50–60 °C bed), doesn't require an enclosure, and produces clean results while you learn the machine's slicer settings and calibration quirks. PLA+ adds slightly improved layer adhesion and

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