import { Link } from "react-router-dom";
import { Palette, Bell, ArrowRight, Layers, Search, Share2, BarChart3 } from "lucide-react";
import { DocumentHead } from "@/components/seo/DocumentHead";
import { Breadcrumbs, BreadcrumbSchema } from "@/components/seo";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteFooter } from "@/components/SiteFooter";
import { HueForgeToolsCrossLinks } from "@/components/hueforge/HueForgeToolsCrossLinks";

const PLANNED_FEATURES = [
  { icon: Layers, title: "Multi-Filament Palettes", desc: "Build palettes of 4–12 filaments and see TD coverage at a glance." },
  { icon: Search, title: "Gap Analysis", desc: "Instantly spot missing TD ranges so your palette covers every opacity zone." },
  { icon: BarChart3, title: "TD Distribution Chart", desc: "Visualize how your palette maps across the 0–10 TD spectrum." },
  { icon: Share2, title: "Share & Export", desc: "Share palettes via URL or export as CSV for your HueForge workflow." },
];

export default function HueForgePaletteBuilder() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <DocumentHead
        title="HueForge Palette Builder — Build & Analyze Filament Palettes | FilaScope"
        description="Build multi-filament palettes for HueForge projects. Analyze TD coverage, find gaps, and share your palette with other creators."
      />
      <BreadcrumbSchema
        items={[
          { name: "HueForge Tools", url: "/hueforge-tools" },
          { name: "Palette Builder", url: "/hueforge-palette-builder" },
        ]}
      />
      <Breadcrumbs
        items={[
          { name: "HueForge Tools", url: "/hueforge-tools" },
          { name: "Palette Builder", url: "/hueforge-palette-builder" },
        ]}
        className="max-w-5xl mx-auto px-4 pt-6 pb-1"
      />

      {/* Hero */}
      <header className="max-w-3xl mx-auto px-4 pt-10 pb-8 text-center">
        <Badge variant="outline" className="mb-4 bg-amber-500/10 text-amber-400 border-amber-500/30">
          Coming Soon
        </Badge>
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Palette className="w-6 h-6 text-amber-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Palette Builder</h1>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
          Build and analyze multi-filament palettes for your HueForge projects.
          Check TD coverage, find gaps, and share your palette — all in one place.
        </p>
      </header>

      {/* Feature Preview */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-xl font-semibold mb-5 text-center">What's Coming</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLANNED_FEATURES.map((f) => (
            <Card key={f.title} className="border-border/60">
              <CardContent className="p-5 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <f.icon className="w-4.5 h-4.5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{f.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-12 text-center">
        <p className="text-sm text-muted-foreground mb-4">
          In the meantime, explore the other HueForge tools:
        </p>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <Button asChild variant="default" size="sm">
            <Link to="/hueforge-td-database">
              Browse TD Database <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to="/hueforge-color-matcher">
              Try Color Matcher <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Cross-links */}
      <div className="max-w-5xl mx-auto px-4">
        <HueForgeToolsCrossLinks />
      </div>

      <SiteFooter />
    </div>
  );
}
