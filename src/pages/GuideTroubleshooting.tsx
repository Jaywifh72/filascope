import { DocumentHead } from "@/components/seo/DocumentHead";
import { Link } from "react-router-dom";
import { AlertCircle, Clock, ArrowLeft, Wrench } from "lucide-react";
import SubscribeForUpdates from "@/components/SubscribeForUpdates";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArticleSchema, HowToSchema, Breadcrumbs } from "@/components/seo";

const COMMON_ISSUES = [
  {
    id: "stringing",
    title: "Stringing / Oozing",
    icon: "🕸️",
    quickFix: "Increase retraction distance (start with 5-6mm for Bowden, 1-2mm for direct drive) and retraction speed (40-60 mm/s). Lower your nozzle temperature by 5-10°C. Enable 'Wipe' or 'Coasting' in your slicer."
  },
  {
    id: "bed-adhesion",
    title: "Poor Bed Adhesion",
    icon: "📐",
    quickFix: "Level your bed and ensure proper Z-offset (paper should have slight resistance). Clean your bed with IPA. Increase bed temperature by 5-10°C. Use a brim or raft. For stubborn materials, try glue stick or hairspray."
  },
  {
    id: "warping",
    title: "Warping / Lifting Corners",
    icon: "🌊",
    quickFix: "Use an enclosure for ABS/ASA/Nylon. Increase bed temperature. Add a brim (8-10mm). Reduce cooling fan speed for first 5-10 layers. Ensure no drafts near your printer."
  },
  {
    id: "layer-shifting",
    title: "Layer Shifting",
    icon: "📊",
    quickFix: "Check belt tension—belts should twang like a guitar string. Reduce print speed and acceleration. Ensure stepper motors aren't overheating. Check for loose set screws on pulleys and couplers."
  },
  {
    id: "under-extrusion",
    title: "Under-Extrusion",
    icon: "🔻",
    quickFix: "Calibrate your extruder e-steps. Check for partial clogs (do a cold pull). Increase nozzle temperature by 5-10°C. Ensure filament diameter is correct in slicer. Check for worn or damaged PTFE tube."
  },
  {
    id: "clogged-nozzle",
    title: "Clogged Nozzle",
    icon: "🚫",
    quickFix: "Perform a cold pull with nylon or cleaning filament. Heat nozzle to max temp and push filament through manually. Use an acupuncture needle to clear debris. For stubborn clogs, soak nozzle in acetone (brass only) or replace it."
  },
];

const BASE_URL = 'https://filascope.com';

const GuideTroubleshooting = () => {
  return (
    <>
      <DocumentHead
        title="Troubleshooting Guide | FilaScope"
        description="Diagnose and fix common 3D printing problems. Solutions for stringing, warping, layer adhesion, and more."
      />
      <ArticleSchema
        headline="3D Printing Troubleshooting Guide"
        description="Diagnose and fix common 3D printing problems. Solutions for stringing, warping, layer adhesion, under-extrusion, clogged nozzles, and more."
        datePublished="2024-11-01"
        url="/troubleshooting"
      />
      <HowToSchema
        name="How to Diagnose and Fix Common 3D Printing Problems"
        description="Step-by-step troubleshooting for the most common 3D printing issues including stringing, bed adhesion, warping, layer shifting, under-extrusion, and clogged nozzles."
        totalTime="PT30M"
        tool={['3D Printer']}
        supply={['Filament']}
        steps={COMMON_ISSUES.map((issue) => ({
          name: `Fix ${issue.title}`,
          text: issue.quickFix,
        }))}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-4">
          <Breadcrumbs
            items={[
              { name: 'Guides', url: '/guides' },
              { name: 'Troubleshooting Guide', url: '/troubleshooting' },
            ]}
          />
        </div>

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
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <AlertCircle className="w-6 h-6 text-orange-500" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-500">
                Troubleshooting
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Troubleshooting Guide
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Diagnose and fix common 3D printing problems with our comprehensive troubleshooting guide.
            </p>
          </div>
        </section>

        {/* Coming Soon Card */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-900/50 border border-border/50 rounded-xl p-8 md:p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
              
              <h2 className="text-2xl font-bold mb-4">Full Database Coming Soon</h2>
              
              <p className="text-muted-foreground mb-6">
                We're building a comprehensive troubleshooting resource with visual diagnosis tools and step-by-step solutions.
              </p>

              <SubscribeForUpdates topic="the troubleshooting guide" className="mb-8 text-left" />
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link 
                  to="/diagnose"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 font-medium transition-colors"
                >
                  <Wrench className="w-4 h-4" />
                  Try Print Diagnoser
                </Link>
                <Link
                  to="/guides"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary font-medium transition-colors"
                >
                  Explore Other Guides
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Common Issues Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <AlertCircle className="w-5 h-5 text-orange-500" />
              </div>
              <h2 className="text-2xl font-bold">Common Issues & Quick Fixes</h2>
            </div>
            
            <p className="text-muted-foreground mb-6">
              While we work on the full database, here are quick fixes for the most common 3D printing problems:
            </p>

            <div className="bg-gray-900/50 border border-border/50 rounded-xl overflow-hidden">
              <Accordion type="single" collapsible className="w-full">
                {COMMON_ISSUES.map((issue) => (
                  <AccordionItem key={issue.id} value={issue.id} className="border-border/50">
                    <AccordionTrigger className="px-6 py-4 hover:bg-gray-800/50 hover:no-underline">
                      <div className="flex items-center gap-3 text-left">
                        <span className="text-2xl">{issue.icon}</span>
                        <span className="font-medium">{issue.title}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4">
                      <div className="pl-11 text-muted-foreground">
                        {issue.quickFix}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            <p className="text-sm text-muted-foreground mt-6 text-center italic">
              Comprehensive troubleshooting database with visual examples coming soon.
            </p>
          </div>
        </section>
      </div>
    </>
  );
};

export default GuideTroubleshooting;
