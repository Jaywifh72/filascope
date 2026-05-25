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
export default function BestFilamentForCreality1() {
  const { data: filaments = [], isLoading } = useQuery({
    queryKey: ['best-filament-creality-K1C'],
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
        title="Best Filament for Creality K1C in 2026 — FilaScope"
        description="The best filament for the Creality K1C in 2026 — top picks for PLA, PETG, ABS & ASA. Live prices, print settings & specs from FilaScope's database of 23,000+ fi"
        canonical="https://filascope.com/guides/best-filament-for-creality-K1C"
        ogType="article"
      />
      <ArticleSchema
        headline="Best Filament for Creality K1C in 2026 — FilaScope"
        description="The best filament for the Creality K1C in 2026 — top picks for PLA, PETG, ABS & ASA. Live prices, print settings & specs from FilaScope's database of 23,000+ fi"
        datePublished="2026-05-25"
        dateModified="2026-05-25"
        url="/guides/best-filament-for-creality-K1C"
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: '/' },
        { name: 'Best Filament', url: '/guides/best-filament' },
        { name: 'Creality K1C', url: '/guides/best-filament-for-creality-K1C' },
      ]} />
      <Breadcrumbs items={[
        { label: 'Home', href: '/' },
        { label: 'Best Filament', href: '/guides/best-filament' },
        { label: 'Creality K1C' },
      ]} />

      <h1 className="text-3xl font-bold mb-4">Best Filament for Creality K1C in 2026 — FilaScope</h1>

      ```tsx
{/* Opening Paragraph */}
<p className="text-lg leading-relaxed text-gray-700 mb-6">
  The Creality K1C handles PLA, PETG, and ABS exceptionally well right out of the box, but its all-metal hotend and enclosed build chamber make it one of the most versatile mid-range printers for engineering-grade filaments like PA-CF, PC, and ASA. If you're looking for the single best all-around filament for everyday printing, PLA+ hits the sweet spot of ease, strength, and speed on the K1C — but the real story is how far this printer can push harder materials. With a 300°C nozzle ceiling and a sealed enclosure, the K1C is genuinely capable of materials most printers in its price class simply can't touch.
</p>

{/* Printer Specs Summary */}
<p className="text-base leading-relaxed text-gray-600 mb-8">
  The K1C's all-metal hotend is the key unlock here. Unlike PTFE-lined hotends that cap out around 240°C before off-gassing becomes a concern, the K1C can safely sustain the 260–300°C temperatures that engineering filaments like Nylon, Polycarbonate, and carbon-fiber composites demand. The built-in enclosure maintains ambient heat during printing, which dramatically reduces warping on high-shrinkage materials like ABS and ASA — a problem that plagues open-frame printers even when using the same filament. According to FilaScope's database of 23,000+ filaments, materials like PA12-CF and PC-ABS typically require both a hotend above 260°C <em>and</em> an enclosed build environment, meaning the K1C clears both prerequisites with room to spare.
</p>

{/* Key Considerations */}
<div className="mb-10">
  <h2 className="text-2xl font-semibold text-gray-800 mb-4">Key Considerations for the Creality K1C</h2>
  <ul className="space-y-3 list-none">
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>Match your nozzle to your material.</strong> The K1C ships with a hardened steel nozzle rated for abrasive filaments, so you're already set for carbon-fiber and glow-in-the-dark composites — but if you swap to a brass nozzle for any reason, stick to standard PLA, PETG, and ABS to avoid accelerated wear.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>Use the enclosure intentionally.</strong> For PLA and PLA+, cracking the door or printing with the top open can actually improve results by reducing heat creep. For ABS, ASA, PA, and PC, keep it fully sealed and let the chamber warm up before starting your print.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>Dry your filament before printing hygroscopic materials.</strong> Nylon (PA), PA12-CF, and PC are notorious moisture absorbers — according to FilaScope's database of 23,000+ filaments, nearly all PA and PC variants list moisture sensitivity as a primary print-quality factor. A filament dryer isn't optional with these materials; it's required.
      </span>
    </li>
    <li className="flex items-start gap-3">
      <span className="mt-1 flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></span>
      <span className="text-gray-700">
        <strong>Don't overlook TPU and FLEX on a fast printer.</strong> The K1C's CoreXY motion system is tuned for speed, which can cause under-extrusion with flexible filaments if you print too fast. Dial your speed back to 25–40mm/s for TPU and FLEX to get clean, reliable results — the material compatibility is there, it just needs a slower touch.
      </span>
    </li>
  </ul>
</div>

{/* FAQ Data */}
const FAQ_DATA = [
  {
    q: "What is the best filament for the Creality K1C for beginners?",
    a: "PLA+ is the best starting point for most K1C users — it prints cleanly at 220–235°C, doesn't require the enclosure, and produces stronger parts than standard PLA with very little added complexity. According to FilaScope's database of 23,000+ filaments, PLA+ is one of the most widely available filament types with options spanning nearly every major brand and price point. Once you've dialed in your settings with PLA+, the K1C's hardware is ready to grow with you into PETG, ABS, and beyond."
  },
  {
    q: "Can the Creality K1C print carbon fiber filaments?",
    a: "Yes — the K1C is well-suited for carbon-fiber composite filaments like PA-CF and PA12-CF thanks to its hardened steel nozzle and 300°C maximum nozzle temperature. These materials typically print at 260–290°C and require an enclosed build environment to prevent warping, both of which the K1C supports natively. Always ensure your filament is thoroughly dried before printing, as PA-CF variants are highly hygroscopic and moisture will cause visible print defects."
  },
  {
    q: "Is the Creality K1C good for printing ABS and ASA?",
    a: "The K1C is a strong performer for both ABS and ASA specifically because of its enclosed build chamber, which holds ambient heat and reduces the edge warping and layer delamination that makes these materials frustrating on open-frame printers. ABS typically prints at 230–250°C on the K1C, while ASA runs slightly higher at 240–260°C — both well within the printer's 300°C ceiling. ASA is generally the better choice between the two for outdoor or UV-exposed parts, as it adds UV resistance without significantly changing the print process."
  },
  {
    q: "Can the Creality K1C print flexible filaments like TPU?",
    a: "Yes, TPU and other flexible filaments are officially supported on the K1C, but the printer's high-speed CoreXY system requires some tuning to get good results. Reduce your print speed to 25–40mm/s and ensure your retraction settings are conservative to prevent the filament from bunching in the extruder path. According to FilaScope's database of 23,000+ filaments, TPU variants with Shore hardness ratings of 95A and above tend to feed more reliably on direct-drive systems like the K1C's compared to softer formulations."
  },
  {
    q: "Does the Creality K1C need an enclosure to print Nylon or Polycarbonate?",
    a: "The K1C already includes a built-in enclosure, which is one of the main reasons it can handle engineering-grade materials like Nylon (PA), PC, and PC-ABS without major modifications. These filaments require both high nozzle temperatures — typically 260–300°C — and a warm, stable ambient environment to prevent warping and layer separation, and the K1C's sealed chamber addresses both needs. Drying your filament is still essential, as Nylon and PC absorb moisture from the air quickly and even a few hours of exposure can degrade print quality noticeably."
  }
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