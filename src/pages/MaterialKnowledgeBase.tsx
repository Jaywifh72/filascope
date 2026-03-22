import { DocumentHead } from "@/components/seo/DocumentHead";
import { BreadcrumbSchema, DefinedTermSetSchema, FAQSection } from "@/components/seo";
import { Link } from "react-router-dom";
import MaterialReference from "@/components/MaterialReference";

const materialTerms = [
  { name: 'PLA (Polylactic Acid)', description: 'The most popular 3D printing material. Biodegradable, easy to print, low odor. Glass transition ~60°C.', url: 'https://filascope.com/reference/materials?material=pla' },
  { name: 'PETG (Polyethylene Terephthalate Glycol)', description: 'Durable, chemical-resistant filament. Good balance of strength and ease of printing. Glass transition ~80°C.', url: 'https://filascope.com/reference/materials?material=petg' },
  { name: 'ABS (Acrylonitrile Butadiene Styrene)', description: 'Strong engineering plastic with good heat resistance up to 100°C. Requires enclosed printer and ventilation.', url: 'https://filascope.com/reference/materials?material=abs' },
  { name: 'TPU (Thermoplastic Polyurethane)', description: 'Flexible, rubber-like material for parts that need to bend, stretch, or absorb impact. Shore hardness 85A–95A.', url: 'https://filascope.com/reference/materials?material=tpu' },
  { name: 'ASA (Acrylonitrile Styrene Acrylate)', description: 'UV-resistant alternative to ABS. Excellent for outdoor applications with good mechanical properties.', url: 'https://filascope.com/reference/materials?material=asa' },
  { name: 'PA / Nylon (Polyamide)', description: 'Engineering-grade filament with high strength, flexibility, and abrasion resistance. Hygroscopic — requires dry storage.', url: 'https://filascope.com/reference/materials?material=pa' },
  { name: 'PET-CF (Carbon Fiber Reinforced PET)', description: 'Carbon fiber composite offering high stiffness and dimensional stability. Requires hardened nozzle.', url: 'https://filascope.com/reference/materials?material=pet-cf' },
  { name: 'PVA (Polyvinyl Alcohol)', description: 'Water-soluble support material for dual-extrusion printers. Dissolves cleanly for complex overhangs.', url: 'https://filascope.com/reference/materials?material=pva' },
  { name: 'PC (Polycarbonate)', description: 'High-performance engineering plastic with excellent impact resistance and heat deflection up to 140°C.', url: 'https://filascope.com/reference/materials?material=pc' },
  { name: 'HIPS (High Impact Polystyrene)', description: 'Limonene-soluble support material for ABS. Also used standalone for lightweight, easy-to-print parts.', url: 'https://filascope.com/reference/materials?material=hips' },
];

const materialFaqs = [
  { question: 'What temperature does PLA print at?', answer: 'PLA typically prints at 190–220°C nozzle temperature with a bed temperature of 50–60°C. Most PLA filaments work well at 205°C nozzle and 55°C bed. No heated enclosure is required.' },
  { question: 'Is PETG stronger than PLA?', answer: 'Yes, PETG is generally stronger and more durable than PLA. PETG has higher impact resistance, better chemical resistance, and a higher glass transition temperature (~80°C vs ~60°C). PLA is stiffer but more brittle.' },
  { question: 'What is the easiest filament to print with?', answer: "PLA is widely considered the easiest 3D printing filament. It prints at lower temperatures, doesn't require a heated bed or enclosure, produces minimal odor, and has excellent bed adhesion. It's the recommended starting material for beginners." },
  { question: 'Can I use PETG for outdoor parts?', answer: 'PETG has better UV resistance than PLA but is not ideal for prolonged outdoor use. For outdoor applications, ASA is the recommended material due to its excellent UV stability and weathering resistance.' },
  { question: 'What filament needs a hardened nozzle?', answer: 'Carbon fiber (CF), glass fiber (GF), and other abrasive composite filaments require a hardened steel or ruby-tipped nozzle. Standard brass nozzles will wear out rapidly with these materials.' },
];

export default function MaterialKnowledgeBase() {
  return (
    <>
      <DocumentHead
        title="3D Printing Materials Guide — PLA, PETG, ABS & More | FilaScope"
        description="Complete guide to 3D printing filament materials. Compare PLA, PETG, ABS, TPU, ASA, Nylon & specialty materials. Properties, temperatures, use cases & recommendations."
        ogTitle="3D Printing Materials Guide — PLA, PETG, ABS & More | FilaScope"
        ogDescription="Complete guide to 3D printing filament materials. Compare PLA, PETG, ABS, TPU, ASA, Nylon & specialty materials. Properties, temperatures, use cases & recommendations."
      />
      <BreadcrumbSchema items={[
        { name: 'Home', url: 'https://filascope.com/' },
        { name: 'Guides', url: 'https://filascope.com/guides' },
        { name: 'Material Knowledge Base', url: 'https://filascope.com/reference/materials' },
      ]} />
      <DefinedTermSetSchema
        name="3D Printing Filament Materials"
        description="Comprehensive reference for 3D printing filament material types, properties, and recommended print settings."
        terms={materialTerms}
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
            <Link to="/guides" className="text-slate-400 hover:text-cyan-400 transition-colors">Guides</Link>
            <span className="text-slate-600">/</span>
            <span className="text-foreground font-medium">Material Knowledge Base</span>
          </nav>

          {/* Compact header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
              Material Knowledge Base
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Reference for 236+ 3D printing materials with print settings, properties, and compatibility data. Select a material family to explore.
            </p>
          </div>

          {/* Material Reference Content — the primary tool */}
          <MaterialReference />

          {/* FAQ below the tool content */}
          <div className="mt-12 max-w-3xl">
            <FAQSection faqs={materialFaqs} />
          </div>
        </div>
      </div>
    </>
  );
}
