import { Link } from "react-router-dom";
import { Palette, ArrowRight, Clipboard, Link2, Download, RotateCcw, Search, BarChart3, Layers, ShoppingCart } from "lucide-react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs, BreadcrumbSchema } from "@/components/seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SiteFooter } from "@/components/SiteFooter";
import { HueForgeToolsCrossLinks } from "@/components/hueforge/HueForgeToolsCrossLinks";
import { HueForgeToolsNav } from "@/components/hueforge/HueForgeToolsNav";
import { Select, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select";
import { toast } from "sonner";

export default function HueForgePaletteBuilder() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge Palette Builder — Build & Analyze Multi-Filament Palettes | FilaScope"
        description="Build and analyze multi-filament palettes for HueForge lithophane projects. Check TD coverage, find gaps, get filament suggestions, and create your shopping list."
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://filascope.com" },
          { name: "HueForge TD Database", url: "https://filascope.com/hueforge-td-database" },
          { name: "Palette Builder", url: "https://filascope.com/hueforge-palette-builder" },
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "HueForge TD Database", url: "/hueforge-td-database" },
          { name: "Palette Builder", url: "/hueforge-palette-builder" },
        ]}
        className="max-w-7xl mx-auto px-4 pt-6 pb-1"
      />
      <HueForgeToolsNav />

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <section className="text-center mb-12">
          <Badge variant="outline" className="mb-4 text-sm">
            <Palette className="w-3 h-3 mr-1 text-primary" />
            Palette Builder
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-primary bg-clip-text text-transparent">
            HueForge Palette Builder
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Build and analyze multi-filament palettes for your HueForge projects.
            Check TD coverage, find gaps, and share your palette — all in one place.
          </p>
        </section>

        {/* Toolbar */}
        <div className="flex items-center justify-between gap-2 mb-8 flex-wrap">
          <Select>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Load Preset" />
            </SelectTrigger>
            <SelectContent />
          </Select>
          <div className="flex items-center gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => toast.info("Nothing to copy yet")}>
              <Clipboard className="w-3.5 h-3.5" /> Copy Config
            </Button>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => toast.info("Nothing to share yet")}>
              <Link2 className="w-3.5 h-3.5" /> Copy Link
            </Button>
            <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => toast.info("Nothing to export yet")}>
              <Download className="w-3.5 h-3.5" /> Export CSV
            </Button>
            <Button variant="ghost" size="sm" className="text-xs gap-1 text-destructive hover:text-destructive" onClick={() => toast.info("Nothing to reset")}>
              <RotateCcw className="w-3.5 h-3.5" /> Reset
            </Button>
          </div>
        </div>

        {/* Main two-column grid */}
        <div className="grid md:grid-cols-5 gap-8">
          {/* Left column */}
          <div className="md:col-span-2 space-y-6">
            {/* Add Filaments */}
            <Card className="border-border/60">
              <CardContent className="p-4">
                <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-3">Add Filaments</h2>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Search filaments by name, brand, or color…" className="pl-9" disabled />
                </div>
              </CardContent>
            </Card>

            {/* Your Palette — empty state */}
            <Card className="border-border/60">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-6 self-start">Your Palette</h2>
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-muted-foreground" />
                </div>
                <h3 className="text-base font-semibold mb-1">Start Building Your Palette</h3>
                <p className="text-sm text-muted-foreground mb-5 max-w-xs">
                  Search for filaments above or load a preset to get started.
                </p>
                <div className="flex items-center gap-3 flex-wrap justify-center">
                  <Button variant="outline" size="sm">Load a Preset</Button>
                  <Button asChild size="sm">
                    <Link to="/hueforge-td-database">
                      Browse TD Database <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Summary bar */}
            <div className="rounded-lg border border-border/60 bg-muted/30 px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
              <span>0 filaments</span>
              <span className="text-border">|</span>
              <span>0 layers</span>
              <span className="text-border">|</span>
              <span>TD range: —</span>
            </div>
          </div>

          {/* Right column */}
          <div className="md:col-span-3 space-y-6">
            {[
              { heading: "Palette Analysis", icon: BarChart3, text: "Add filaments to see coverage analysis" },
              { heading: "Layer Preview", icon: Layers, text: "Add filaments to see layer stacking preview" },
              { heading: "Shopping List", icon: ShoppingCart, text: "Add filaments to see pricing and purchase links" },
            ].map((section) => (
              <Card key={section.heading} className="border-border/60">
                <CardContent className="p-6">
                  <h2 className="uppercase tracking-wide text-xs text-muted-foreground font-semibold mb-4">{section.heading}</h2>
                  <div className="min-h-[160px] flex flex-col items-center justify-center text-center">
                    <section.icon className="w-8 h-8 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground">{section.text}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Cross-links & footer */}
      <div className="max-w-5xl mx-auto px-4">
        <HueForgeToolsCrossLinks />
      </div>
      <SiteFooter />
    </div>
  );
}
