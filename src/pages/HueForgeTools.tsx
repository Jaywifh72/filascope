import { Link } from "react-router-dom";
import { ArrowRight, Wand2, Database, Pipette, TrendingUp, Layers, ClipboardCheck, Eye, RefreshCw, ClipboardList, Palette, ChevronDown, BookOpen, Trophy, Ruler, Sun } from "lucide-react";
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
        <details id="what-is-td" className="mt-4 max-w-2xl mx-auto group/td">
          <summary className="text-sm text-primary hover:text-primary/80 cursor-pointer inline-flex items-center gap-1 list-none [&::-webkit-details-marker]:hidden">
            What is TD (Transmissivity Data)?
            <ChevronDown className="w-3 h-3 transition-transform duration-200 group-open/td:rotate-180" />
          </summary>
          <div className="mt-3 p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground leading-relaxed text-left">
            TD (Transmissivity Data) measures how much light passes through a filament layer. Lower TD values mean more opaque filaments, higher TD values mean more translucent. HueForge uses TD values to calculate how colors blend when layered — making TD the single most important spec for planning your print.
            <Link to="/guides/what-is-hueforge-td" className="text-primary text-xs hover:underline mt-2 inline-flex items-center gap-1">
              Read the full guide <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </details>
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

      {/* Workflow Stepper */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-semibold mb-6">Your HueForge Workflow</h2>
        <p className="text-sm text-muted-foreground mb-8">Follow this proven workflow to plan, build, and print stunning HueForge projects.</p>
        <div className="flex flex-col md:flex-row md:items-start gap-0">
          {[
            { step: 1, title: "Plan Your Project", icon: ClipboardList, accent: "green", desc: "Start with the Project Planner to define your design and get a filament shopping list.", href: "/hueforge-project-planner" },
            { step: 2, title: "Find & Match Colors", icon: Pipette, accent: "rose", desc: "Use Color Matcher to find filaments that match your target colors by hex code or image.", href: "/hueforge-color-matcher" },
            { step: 3, title: "Build Your Palette", icon: Palette, accent: "amber", desc: "Combine filaments in the Palette Builder. Check TD coverage and identify gaps.", href: "/hueforge-palette-builder" },
            { step: 4, title: "Preview & Print", icon: Layers, accent: "violet", desc: "Visualize layer stacking, then print with confidence.", href: "/hueforge-layer-preview" },
          ].map((s, i, arr) => (
            <div key={s.step} className="flex flex-col md:flex-row md:items-start flex-1">
              <Link
                to={s.href}
                className={`group flex-1 p-4 rounded-lg bg-muted/50 border border-border transition-all duration-200 hover:bg-muted hover:border-${s.accent}-500/40`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className={`w-6 h-6 rounded-full bg-${s.accent}-500/10 text-${s.accent}-500 text-xs font-bold flex items-center justify-center`}>
                    {s.step}
                  </span>
                  <s.icon className={`w-4 h-4 text-${s.accent}-500`} />
                </div>
                <h3 className="text-sm font-semibold mb-1">{s.title}</h3>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </Link>
              {i < arr.length - 1 && (
                <>
                  {/* Desktop connector */}
                  <div className="hidden md:block border-t border-dashed border-border flex-none w-6 self-center mt-8" />
                  {/* Mobile connector */}
                  <div className="md:hidden border-l border-dashed border-border h-6 ml-3" />
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-semibold mb-5">Getting Started with HueForge</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Card 1 — Beginners */}
          <Link
            to="/hueforge-project-planner"
            className="group relative flex items-start gap-3 p-4 rounded-lg border border-green-500/30 bg-green-500/5 hover:border-green-500/50 hover:bg-green-500/10 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <span className="absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 border border-green-500/20">Recommended</span>
            <Wand2 className="w-5 h-5 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-200" />
            <div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors">I'm new to HueForge</span>
              <p className="text-xs text-muted-foreground mt-0.5">Start with the guided Project Planner</p>
            </div>
          </Link>
          {/* Card 2 — Intermediate */}
          <Link
            to="/hueforge-color-matcher"
            className="group flex items-start gap-3 p-4 rounded-lg border border-border border-l-2 border-l-rose-500/40 bg-card hover:border-primary/40 hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <Pipette className="w-5 h-5 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-200" />
            <div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors">I know what colors I need</span>
              <p className="text-xs text-muted-foreground mt-0.5">Jump to Color Matcher</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">For intermediate HueForge users</p>
            </div>
          </Link>
          {/* Card 3 — Experienced */}
          <Link
            to="/hueforge-td-database"
            className="group flex items-start gap-3 p-4 rounded-lg border border-border border-l-2 border-l-primary/40 bg-card hover:border-primary/40 hover:bg-muted/50 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            <Database className="w-5 h-5 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform duration-200" />
            <div>
              <span className="text-sm font-medium group-hover:text-primary transition-colors">I just need TD data</span>
              <p className="text-xs text-muted-foreground mt-0.5">Browse the TD Database</p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">For experienced makers</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Learn More */}
      <section className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-semibold mb-4">Learn More</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { name: "What is HueForge TD?", desc: "Understand transmissivity and why it matters", href: "/guides/what-is-hueforge-td", icon: BookOpen },
            { name: "Best Filaments for HueForge", desc: "Top-rated filaments ranked by TD accuracy", href: "/guides/best-filaments-for-hueforge", icon: Trophy },
            { name: "How to Measure TD", desc: "DIY methods to measure your filament's TD", href: "/guides/how-to-measure-filament-td", icon: Ruler },
            { name: "Best White Filaments for HueForge", desc: "The best base layers for vibrant prints", href: "/guides/best-white-filaments-for-hueforge", icon: Sun },
          ].map((g) => (
            <Link
              key={g.href}
              to={g.href}
              className="group p-3 rounded-lg border border-border bg-card hover:border-primary/30 hover:bg-muted/50 transition-all duration-200 flex flex-col gap-1"
            >
              <div className="flex items-center gap-2">
                <g.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{g.name}</span>
              </div>
              <p className="text-xs text-muted-foreground">{g.desc}</p>
              <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:translate-x-1 transition-transform mt-1" />
            </Link>
          ))}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
