import { MATERIAL_CATEGORIES } from "@/lib/materialHierarchy";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { BreadcrumbSchema, DefinedTermSetSchema, FAQSection } from "@/components/seo";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { BookOpen, GitCompare, ArrowRight } from "lucide-react";
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
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleFamilyClick = (familyName: string) => {
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('expand-material-family', { detail: familyName }));
    }, 100);
  };

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
        { name: 'Learn', url: 'https://filascope.com/learn' },
        { name: 'Material Knowledge Base', url: 'https://filascope.com/reference/materials' },
      ]} />
      <DefinedTermSetSchema
        name="3D Printing Filament Materials"
        description="Comprehensive reference for 3D printing filament material types, properties, and recommended print settings."
        terms={materialTerms}
      />
      <FAQSection faqs={materialFaqs} />

      <div className="min-h-screen bg-background relative">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,207,232,0.03)_0%,_transparent_50%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,_rgba(255,0,85,0.02)_0%,_transparent_40%)] pointer-events-none" />

        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm mb-4" aria-label="Breadcrumb">
            <Link to="/learn" className="text-slate-400 hover:text-cyan-400 transition-colors">Learn</Link>
            <span className="text-slate-600">/</span>
            <span className="text-foreground font-medium">Material Knowledge Base</span>
          </nav>

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-8">
            <div className="flex-1 min-w-0">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-sm font-medium mb-4">
                <BookOpen className="w-4 h-4" />
                <span>KNOWLEDGE BASE</span>
              </div>

              {/* Title */}
              <h1 className="text-4xl font-bold text-foreground mb-3">
                3D Printing Material <span className="text-primary">Knowledge Base</span>
              </h1>

              {/* Subtitle */}
              <p className="text-muted-foreground text-lg mb-4">
                Deep-dive reference for every 3D printing material — from PLA basics to advanced engineering polymers. 236+ material types with print settings, strengths, weaknesses, and technical data.
              </p>

              {/* Quick Stats */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  236+ Material Types
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  15+ Property Categories
                </span>
                <span className="text-border">•</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Detailed Print Settings
                </span>
              </div>
            </div>

            {/* Material Families Quick Nav + Compare CTA */}
            <div className="hidden lg:flex flex-col gap-3 w-[280px] flex-shrink-0">
              <div className="bg-slate-800/30 border border-white/5 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-foreground mb-3">Material Families</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {MATERIAL_CATEGORIES.map((cat) => {
                    const shortName = cat.name.replace(/ Family$/i, '');
                    const slug = shortName.toLowerCase().replace(/\+/g, '-plus').replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
                    return (
                      <a
                        key={cat.id}
                        href={`/materials/${slug}`}
                        onClick={(e) => { e.preventDefault(); handleFamilyClick(cat.name); }}
                        className="text-xs px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 hover:bg-cyan-500/20 hover:text-cyan-300 cursor-pointer transition-colors"
                      >
                        {shortName}
                      </a>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-500">236+ materials · 15+ categories</p>
              </div>

              {/* Compare CTA */}
              <Link
                to="/compare"
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 hover:border-primary/30 transition-all group"
              >
                <GitCompare className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Compare filaments</p>
                  <p className="text-xs text-muted-foreground">Side-by-side specs &amp; pricing</p>
                </div>
                <ArrowRight className="w-4 h-4 text-primary/60 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Mobile compare CTA */}
          <div className="lg:hidden mb-6">
            <Link
              to="/compare"
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-primary/10 border border-primary/20 hover:bg-primary/15 hover:border-primary/30 transition-all group"
            >
              <GitCompare className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Compare specific filaments →</p>
                <p className="text-xs text-muted-foreground">Side-by-side specs &amp; pricing</p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/60 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Material Reference Content */}
          <MaterialReference />
        </div>
      </div>
    </>
  );
}
