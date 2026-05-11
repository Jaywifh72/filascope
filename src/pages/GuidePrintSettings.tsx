import { DocumentHead } from "@/components/seo/DocumentHead";
import { ArticleSchema } from "@/components/seo/ArticleSchema";
import { HowToSchema } from "@/components/seo/HowToSchema";
import { Link } from "react-router-dom";
import { SlidersHorizontal, Clock, ArrowLeft, BookOpen } from "lucide-react";
import SubscribeForUpdates from "@/components/SubscribeForUpdates";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const QUICK_REFERENCE_DATA = [
  { material: "PLA", nozzleTemp: "190-220°C", bedTemp: "50-60°C", speed: "40-60 mm/s" },
  { material: "PETG", nozzleTemp: "230-250°C", bedTemp: "70-85°C", speed: "30-50 mm/s" },
  { material: "ABS", nozzleTemp: "230-260°C", bedTemp: "95-110°C", speed: "40-60 mm/s" },
  { material: "ASA", nozzleTemp: "240-260°C", bedTemp: "90-110°C", speed: "40-50 mm/s" },
  { material: "TPU", nozzleTemp: "220-250°C", bedTemp: "40-60°C", speed: "15-30 mm/s" },
  { material: "Nylon", nozzleTemp: "240-270°C", bedTemp: "70-90°C", speed: "30-50 mm/s" },
];

const GuidePrintSettings = () => {
  return (
    <>
      <DocumentHead
        title="3D Print Settings Guide 2026 — Speed, Temp & Layer Height"
        description="Complete 3D print settings guide: optimal layer height, print speed, nozzle temperature, bed temperature, and retraction settings for PLA, PETG, ABS, TPU, ASA, and Nylon. Updated 2026."
        canonical="https://filascope.com/guides/print-settings"
        ogType="article"
        keywords="3D print settings, print speed settings, layer height guide, nozzle temperature settings, retraction settings, filament print settings"
      />
      <HowToSchema
        name="How to Dial In 3D Print Settings for Any Filament"
        description="Step-by-step guide to setting optimal print settings for any 3D printing filament material."
        steps={[
          { name: "Set nozzle temperature", text: "Start with the manufacturer's recommended nozzle temperature. For PLA, this is typically 200–220°C. For PETG, 230–250°C. For ABS, 240–260°C." },
          { name: "Set bed temperature", text: "Set the heated bed temperature: PLA 50–60°C, PETG 70–85°C, ABS 90–110°C, TPU 30–60°C. No heated bed required for PLA if printing slowly." },
          { name: "Choose layer height", text: "Use 0.2mm layer height for most prints. Use 0.1mm for detail prints. Use 0.3mm for fast structural prints. Layer height must be 75% or less of nozzle diameter." },
          { name: "Set print speed", text: "Start at 50mm/s for PLA, 45mm/s for PETG, 40mm/s for ABS. Modern high-speed printers (Bambu Lab, Creality K1) can run PLA at 200–300mm/s with high-speed filament." },
          { name: "Configure retraction", text: "For direct drive: 0.5–1mm retraction at 35mm/s. For Bowden: 4–7mm retraction at 45mm/s. Too much retraction causes clogs. Too little causes stringing." },
        ]}
      />
      <ArticleSchema
        headline="3D Print Settings Guide 2026"
        description="Complete 3D print settings guide: optimal layer height, print speed, nozzle temperature, bed temperature, and retraction settings for PLA, PETG, ABS, TPU, ASA, and Nylon."
        url="https://filascope.com/guides/print-settings"
        datePublished="2025-01-15"
        dateModified="2026-05-11"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <Link
              to="/guides"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Learning Center
            </Link>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <SlidersHorizontal className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Guide
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Print Settings Guide
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Master the art of dialing in perfect print settings for any material.
            </p>
          </div>
        </section>

        {/* Coming Soon Card */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900/50 border border-border/50 rounded-xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Full Guide Coming Soon</h2>
              
              <p className="text-muted-foreground mb-6">
                We're working on a comprehensive guide covering everything you need to know about print settings:
              </p>
              
              <ul className="text-left text-sm text-muted-foreground space-y-2 mb-8 max-w-sm mx-auto">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Layer height optimization
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Print speed vs quality tradeoffs
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Temperature tuning by material
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Retraction settings explained
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  First layer adhesion tips
                </li>
              </ul>

              <SubscribeForUpdates topic="the print settings guide" className="mb-8 text-left" />
            </div>
          </div>
        </section>

        {/* Quick Reference Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Quick Reference</h2>
            </div>
            
            <p className="text-muted-foreground mb-6">
              While we work on the full guide, here are recommended starting settings for the most common materials:
            </p>

            <div className="bg-gray-900/50 border border-border/50 rounded-xl overflow-hidden mb-8">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="text-foreground font-semibold">Material</TableHead>
                    <TableHead className="text-foreground font-semibold">Nozzle Temp</TableHead>
                    <TableHead className="text-foreground font-semibold">Bed Temp</TableHead>
                    <TableHead className="text-foreground font-semibold">Print Speed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {QUICK_REFERENCE_DATA.map((row) => (
                    <TableRow key={row.material} className="border-border/50">
                      <TableCell className="font-medium text-primary">{row.material}</TableCell>
                      <TableCell className="text-muted-foreground">{row.nozzleTemp}</TableCell>
                      <TableCell className="text-muted-foreground">{row.bedTemp}</TableCell>
                      <TableCell className="text-muted-foreground">{row.speed}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Full guide with per-filament profiles coming soon. In the meantime, check our Material Knowledge Base for detailed specs on hundreds of filaments.
                  </p>
                  <Link 
                    to="/reference/materials"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Browse Material Knowledge Base
                    <ArrowLeft className="w-4 h-4 rotate-180" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default GuidePrintSettings;
