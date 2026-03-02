import { Link } from "react-router-dom";
import { ArrowRight, Wand2, Database, Pipette, TrendingUp, Layers, ClipboardCheck, Eye, RefreshCw } from "lucide-react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { HUEFORGE_TOOLS } from "@/components/hueforge/HueForgeToolsData";
import { SiteFooter } from "@/components/SiteFooter";
import { useJsonLd } from "@/components/seo/useJsonLd";

const BASE_URL = "https://filascope.com";

const BADGE_STYLES: Record<string, string> = {
  Popular: "bg-primary/20 text-primary border-primary/30",
  New: "bg-green-500/20 text-green-400 border-green-500/30",
  Beta: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const QUICK_PATHS = [
  { label: "I'm new to HueForge", desc: "Start with the guided Project Planner", href: "/hueforge-project-planner", icon: Wand2 },
  { label: "I know what colors I need", desc: "Jump to Color Matcher", href: "/hueforge-color-matcher", icon: Pipette },
  { label: "I just need TD data", desc: "Browse the TD Database", href: "/hueforge-td-database", icon: Database },
];

const FAQ_DATA = [
  {
    q: "How do I get started with HueForge?",
    a: "If you're new to HueForge, start with FilaScope's guided Project Planner. It walks you through each step to plan your HueForge project and generates a complete filament shopping list.",
  },
  {
    q: "Where can I find HueForge TD values?",
    a: "FilaScope's TD Value Database lets you search and filter over 111 filaments by transmissivity data. It's the foundation for all HueForge planning.",
  },
  {
    q: "How do I match colors for HueForge?",
    a: "Use FilaScope's Color Matcher tool to find filaments matching any hex color or image sample, filtered by TD value.",
  },
];

const TOOL_STATS: Record<string, { icon: typeof TrendingUp; text: string }> = {
  "td-database": { icon: TrendingUp, text: "40,000+ lookups this month" },
  "palette-builder": { icon: Layers, text: "2,500+ palettes created" },
  "project-planner": { icon: ClipboardCheck, text: "1,200+ projects planned" },
  "layer-preview": { icon: Eye, text: "8,000+ previews generated" },
  "color-matcher": { icon: Pipette, text: "15,000+ colors matched" },
  "substitution-finder": { icon: RefreshCw, text: "3,000+ substitutions found" },
};

export default function HueForgeTools() {
  // ItemList schema for the 6 tools
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "HueForge Tools",
    description: "FilaScope's complete toolkit for HueForge creators.",
    numberOfItems: HUEFORGE_TOOLS.length,
    itemListElement: HUEFORGE_TOOLS.map((tool, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: tool.name,
      url: `${BASE_URL}${tool.href}`,
      description: tool.description,
    })),
  });

  // FAQPage schema
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_DATA.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a,
      },
    })),
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge Tools — TD Database, Palette Builder, Color Matcher & More | FilaScope"
        description="Free HueForge tools for 3D printing. Search TD values, build filament palettes, preview layer stacking, match colors from images, and plan multicolor prints."
      />
      <Breadcrumbs
        items={[{ name: "HueForge Tools", url: "/hueforge-tools" }]}
        className="max-w-5xl mx-auto px-4 pt-6 pb-1"
      />

      {/* Hero */}
      <header className="max-w-5xl mx-auto px-4 pt-8 pb-10 text-center">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          HueForge Tools
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
          FilaScope's complete toolkit for HueForge creators. Browse TD data, build palettes, preview layers, match colors, and plan projects — all in one place.
        </p>
      </header>

      {/* Tool Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {HUEFORGE_TOOLS.map((tool) => (
            <Link
              key={tool.key}
              to={tool.href}
              className={`group relative overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:border-primary/40 hover:shadow-xl hover:-translate-y-0.5 border-l-4 ${tool.accentClass} focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none cursor-pointer`}
            >
              <div className="p-6 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                      <tool.icon className="w-5 h-5 text-foreground" />
                    </div>
                    <h2 className="text-lg font-semibold">{tool.name}</h2>
                  </div>
                  {tool.badge && (
                    <Badge variant="outline" className={`text-[10px] ${BADGE_STYLES[tool.badge] || ""}`}>
                      {tool.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{tool.description}</p>
                {TOOL_STATS[tool.key] && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                    {(() => { const StatIcon = TOOL_STATS[tool.key].icon; return <StatIcon className="w-3 h-3" />; })()}
                    {TOOL_STATS[tool.key].text}
                  </span>
                )}
                <span className="inline-flex items-center self-start mt-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm group-hover:border-primary/50 group-hover:text-primary transition-colors">
                  Open Tool <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform duration-200 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Getting Started */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-semibold mb-5">Getting Started with HueForge</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {QUICK_PATHS.map((qp) => (
            <Link
              key={qp.href}
              to={qp.href}
              className="group flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/40 bg-card hover:bg-muted/50 transition-all"
            >
              <qp.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div>
                <span className="text-sm font-medium group-hover:text-primary transition-colors">{qp.label}</span>
                <p className="text-xs text-muted-foreground mt-0.5">{qp.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Learn More */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-semibold mb-4">Learn More</h2>
        <div className="flex flex-wrap gap-3">
          {[
            { name: "What is HueForge TD?", href: "/guides/what-is-hueforge-td" },
            { name: "Best Filaments for HueForge", href: "/guides/best-filaments-for-hueforge" },
            { name: "How to Measure TD", href: "/guides/how-to-measure-filament-td" },
            { name: "Best White Filaments for HueForge", href: "/guides/best-white-filaments-for-hueforge" },
          ].map((g) => (
            <Link
              key={g.href}
              to={g.href}
              className="text-sm text-primary hover:underline inline-flex items-center gap-1"
            >
              {g.name} <ArrowRight className="w-3 h-3" />
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
