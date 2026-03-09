import { Link } from "react-router-dom";
import { useRef, useEffect, useState, useCallback } from "react";
import { ArrowRight, Wand2, Database, Pipette, TrendingUp, Layers, ClipboardCheck, Eye, RefreshCw, ClipboardList, Palette, ChevronDown, BookOpen, Trophy, Ruler, Sun } from "lucide-react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs } from "@/components/seo";
import { Badge } from "@/components/ui/badge";
import { HUEFORGE_TOOLS } from "@/components/hueforge/HueForgeToolsData";
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
    q: "What is HueForge and how does it work?",
    a: "HueForge is a software tool that lets you create stunning multi-color 3D prints by stacking filament layers of different colors and opacities. It uses Transmission Distance (TD) values to calculate how light passes through each layer, predicting exactly how colors will blend in the finished print. This lets you create lithophanes, portraits, and artistic prints with remarkable color depth using a standard single-extruder 3D printer.",
  },
  {
    q: "What are HueForge TD values and why do they matter?",
    a: "TD (Transmission Distance) values measure how far light travels through a single layer of filament, expressed in millimeters. Lower TD means more opaque filament, higher TD means more translucent. TD values are the single most important specification for HueForge projects because they determine how colors blend when layered. Without accurate TD values, your print colors won't match your design — making a reliable TD database essential for every HueForge artist.",
  },
  {
    q: "Where can I find HueForge TD values for my filament?",
    a: "Based on FilaScope's HueForge TD database, which tracks transmission distance values for 500+ filaments across 48+ brands, it is the largest public collection of filament Transmission Distance values. You can search by brand, material type, color, or TD range. Each filament entry includes verified TD values alongside pricing, material specs, and retailer availability. Visit the TD Value Database to search for your filament.",
  },
  {
    q: "What is the best filament for HueForge?",
    a: "The best filament for HueForge depends on your project. For base layers, you want high-TD (translucent) filaments — white PLA typically works best. For top detail layers, you want low-TD (opaque) filaments for strong contrast. Popular choices include Polymaker PolyTerra PLA for its consistent TD values, Bambu Lab PLA Basic for affordability, and SUNLU PLA for wide color selection. Use FilaScope's Palette Builder to check TD coverage for any combination of filaments.",
  },
  {
    q: "How do I measure my filament's TD value?",
    a: "You can measure TD by printing a calibration model (a thin-wall test print) and measuring light transmission with a lux meter or the HueForge calibration tool built into the software. Alternatively, you can use FilaScope's TD Value Database which tracks community-verified TD values so you don't need to measure every spool yourself. For filaments not yet in the database, our guide on How to Measure TD walks you through the DIY process step by step.",
  },
  {
    q: "How do I get started with HueForge?",
    a: "Start by choosing an image, then use FilaScope's Project Planner to plan your layers and generate a filament shopping list. Next, use the Color Matcher to find filaments matching your target colors filtered by TD value. Build your palette in the Palette Builder to check TD coverage and identify gaps. Finally, preview your layer stacking before printing. FilaScope's tools guide you through every step — from first project to advanced multi-layer prints.",
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
  const gridRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  const reveal = useCallback(() => setRevealed(true), []);

  useEffect(() => {
    // Respect reduced motion
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) { reveal(); return; }

    // Fallback: force-show after 1s
    const timeout = setTimeout(reveal, 1000);

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { reveal(); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (gridRef.current) observer.observe(gridRef.current);

    return () => { clearTimeout(timeout); observer.disconnect(); };
  }, [reveal]);

  // ItemList schema for the 6 tools
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "HueForge Tools & Transmissivity Data",
    description: "The most complete HueForge toolkit on the web.",
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

  // SoftwareApplication schema for all 6 tools
  useJsonLd({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "FilaScope TD Value Database",
        description: "Search and filter HueForge Transmission Distance (TD) values for 111+ filaments across 48+ brands. The largest public filament TD database for HueForge project planning.",
        url: `${BASE_URL}/hueforge-td-database`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "FilaScope", url: BASE_URL },
      },
      {
        "@type": "SoftwareApplication",
        name: "FilaScope HueForge Palette Builder",
        description: "Build and analyze multi-filament palettes for HueForge. Check TD coverage across your selected filaments, identify gaps, and share your palette with other makers.",
        url: `${BASE_URL}/hueforge-palette-builder`,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "FilaScope", url: BASE_URL },
      },
      {
        "@type": "SoftwareApplication",
        name: "FilaScope HueForge Project Planner",
        description: "Step-by-step wizard to plan your HueForge project. Define your design, select filament layers, and generate a complete shopping list with TD-optimized filament recommendations.",
        url: `${BASE_URL}/hueforge-project-planner`,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "FilaScope", url: BASE_URL },
      },
      {
        "@type": "SoftwareApplication",
        name: "FilaScope Layer Stacking Preview",
        description: "Visualize how filament layers blend based on TD values before you print. Preview color mixing and opacity for HueForge multi-layer 3D prints.",
        url: `${BASE_URL}/hueforge-layer-preview`,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "FilaScope", url: BASE_URL },
      },
      {
        "@type": "SoftwareApplication",
        name: "FilaScope HueForge Color Matcher",
        description: "Find 3D printing filaments matching any hex color or image sample, filtered by Transmission Distance (TD) value for HueForge compatibility.",
        url: `${BASE_URL}/hueforge-color-matcher`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "FilaScope", url: BASE_URL },
      },
      {
        "@type": "SoftwareApplication",
        name: "FilaScope Filament Substitution Finder",
        description: "Find TD-equivalent filament alternatives from other brands when your filament is out of stock. Match by Transmission Distance value for seamless HueForge substitutions.",
        url: `${BASE_URL}/hueforge-filament-substitute-finder`,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        publisher: { "@type": "Organization", name: "FilaScope", url: BASE_URL },
      },
    ],
  });

  // HowTo schema for the workflow section
  useJsonLd({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: "How to Plan and Print a HueForge Project",
    description: "A step-by-step workflow to plan, build, and print stunning HueForge multi-color 3D prints using FilaScope's free tools and TD value database.",
    step: [
      { "@type": "HowToStep", position: 1, name: "Plan Your Project", text: "Start with FilaScope's Project Planner to define your HueForge design. Upload your reference image, set your layer count, and the planner generates a complete filament shopping list with TD-optimized recommendations.", url: `${BASE_URL}/hueforge-project-planner` },
      { "@type": "HowToStep", position: 2, name: "Find and Match Colors", text: "Use FilaScope's Color Matcher to find filaments that match your target colors by hex code or image sample. Results are filtered by TD value to ensure HueForge compatibility.", url: `${BASE_URL}/hueforge-color-matcher` },
      { "@type": "HowToStep", position: 3, name: "Build Your Palette", text: "Combine your selected filaments in the Palette Builder. Check TD coverage across your palette, identify opacity gaps, and verify that your layer stack will produce the expected color blending.", url: `${BASE_URL}/hueforge-palette-builder` },
      { "@type": "HowToStep", position: 4, name: "Preview and Print", text: "Visualize your layer stacking with the Layer Stacking Preview tool to see how colors will blend based on TD values. Once satisfied, print your HueForge project with confidence.", url: `${BASE_URL}/hueforge-layer-preview` },
    ],
    tool: [
      { "@type": "HowToTool", name: "FilaScope TD Value Database" },
      { "@type": "HowToTool", name: "FilaScope Project Planner" },
      { "@type": "HowToTool", name: "FilaScope Color Matcher" },
      { "@type": "HowToTool", name: "FilaScope Palette Builder" },
      { "@type": "HowToTool", name: "FilaScope Layer Stacking Preview" },
    ],
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge Tools — TD Database, Palette Builder, Color Matcher & More | FilaScope"
        description="Free HueForge tools and the web's largest filament Transmission Distance (TD) database. Search 111+ filament TD values, build palettes, preview layer stacking, match colors, find substitutes, and plan HueForge projects."
        ogImage="https://filascope.com/og-hueforge-tools.png"
        ogImageWidth="1200"
        ogImageHeight="630"
        ogImageAlt="FilaScope HueForge Tools — TD Value Database, Palette Builder, Color Matcher, Layer Preview, and Project Planner for HueForge 3D printing"
        twitterImage="https://filascope.com/og-hueforge-tools.png"
        author="FilaScope"
        keywords="HueForge, HueForge tools, TD values, transmissivity data, filament TD database, HueForge palette builder, HueForge color matcher, filament transmissivity, 3D printing filament, HueForge filament, layer stacking preview, filament substitution"
      />
      <Breadcrumbs
        items={[{ name: "HueForge Tools", url: "/hueforge-tools" }]}
        className="max-w-5xl mx-auto px-4 pt-6 pb-1"
      />

      {/* Hero */}
      <header className="relative max-w-5xl mx-auto px-4 pt-8 pb-10 text-center overflow-hidden">
        {/* Radial gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 30%, hsl(var(--primary) / 0.07), transparent 70%)" }}
          aria-hidden="true"
        />
        {/* Dot pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03] dark:opacity-[0.03]" aria-hidden="true">
          <defs>
            <pattern id="hero-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-dots)" />
        </svg>
        <h1 className="relative text-3xl md:text-4xl font-bold mb-3 hero-shimmer">
          HueForge Tools &amp; Transmissivity Data
        </h1>
        <p className="relative text-muted-foreground max-w-2xl mx-auto text-base leading-relaxed">
          The most complete HueForge toolkit on the web. Search the largest filament TD value database, build multi-filament palettes, preview layer stacking, match colors by hex or image, and plan your next HueForge project — all free, all in one place.
        </p>
        <p className="relative text-xs text-muted-foreground/60 mt-3">
          Last updated: <time dateTime="2026-03">March 2026</time> · 111+ filaments with TD values · 48+ brands tracked
        </p>
        <section id="what-is-td" className="relative mt-6 max-w-2xl mx-auto text-left">
          <h2 className="text-lg font-semibold text-foreground mb-3">What is TD (Transmissivity Data)?</h2>
          <div className="p-4 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground leading-relaxed space-y-3">
            <p>
              TD (Transmission Distance) measures how far light travels through a single layer of 3D printing filament, expressed in millimeters. It's the single most important specification for HueForge projects because it determines how colors blend, overlap, and show through when layers are stacked.
            </p>
            <p>
              A filament with a low TD value (under 1.0 mm) is more opaque — ideal for solid top layers and high-contrast details. A filament with a high TD value (above 3.0 mm) is more translucent — perfect for base layers where you want underlying colors to show through. HueForge uses these TD values to calculate exactly how your final lithophane or multi-color print will look before you print it.
            </p>
            <p>
              FilaScope's TD Value Database tracks verified Transmission Distance values for 111+ filaments across 48+ brands — the largest public TD dataset available. Whether you're planning your first HueForge print or optimizing a complex 8-layer palette, accurate TD data is the foundation of every successful project.
            </p>
            <Link to="/guides/what-is-hueforge-td" className="text-primary text-xs hover:underline mt-2 inline-flex items-center gap-1">
              Read the full guide <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </section>
      </header>

      {/* Authority Stats Bar */}
      <div className="max-w-5xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-muted/50 border border-border">
          {[
            { value: "111+", label: "Filaments with TD Data" },
            { value: "48+", label: "Brands Tracked" },
            { value: "40,000+", label: "Monthly TD Lookups" },
            { value: "6", label: "Free HueForge Tools" },
          ].map((stat) => (
            <div key={stat.label} className="text-center py-2">
              <div className="text-xl md:text-2xl font-bold text-primary">{stat.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tool Grid */}
      <section className="max-w-5xl mx-auto px-4 pb-12">
        <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {HUEFORGE_TOOLS.map((tool, i) => (
            <Link
              key={tool.key}
              to={tool.href}
              style={!revealed ? { opacity: 0, transform: "translateY(1rem)", willChange: "transform, opacity", transition: `opacity 400ms ease-out ${i * 80}ms, transform 400ms ease-out ${i * 80}ms` } : { opacity: 1, transform: "translateY(0)", transition: `opacity 400ms ease-out ${i * 80}ms, transform 400ms ease-out ${i * 80}ms` }}
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

      {/* FAQ Section */}
      <section id="faq" className="max-w-5xl mx-auto px-4 pb-16">
        <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions About HueForge &amp; TD Values</h2>
        <div className="space-y-6">
          {FAQ_DATA.map((faq) => (
            <div key={faq.q}>
              <h3 className="text-sm font-semibold text-foreground mb-1.5">{faq.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
