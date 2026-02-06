import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { FileText, Clock, ArrowLeft, Download, Layers, Printer, Package } from "lucide-react";
import SubscribeForUpdates from "@/components/SubscribeForUpdates";

const PLANNED_SLICERS = [
  { name: "PrusaSlicer", icon: "🟠" },
  { name: "OrcaSlicer", icon: "🐋" },
  { name: "Bambu Studio", icon: "🎋" },
  { name: "Cura", icon: "🔵" },
  { name: "SuperSlicer", icon: "⚡" },
];

const ResourcesProfiles = () => {
  return (
    <>
      <Helmet>
        <title>Print Profiles | FilaScope</title>
        <meta name="description" content="Download optimized slicer profiles for popular 3D printers and materials. Ready-to-use profiles for Cura, PrusaSlicer, and more." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <Link 
              to="/reference/slicers" 
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Slicer Directory
            </Link>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Resources
              </span>
            </div>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Print Profiles
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Download optimized slicer profiles for your printer and favorite materials.
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
              
              <h2 className="text-2xl font-bold mb-4">Profile Library Coming Soon</h2>
              
              <p className="text-muted-foreground mb-6">
                We're curating a library of optimized print profiles tested on real hardware.
              </p>
              
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {PLANNED_SLICERS.map((slicer) => (
                  <span 
                    key={slicer.name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border border-border/50 rounded-lg text-sm text-muted-foreground"
                  >
                    <span>{slicer.icon}</span>
                    {slicer.name}
                  </span>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link 
                  to="/reference/slicers"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary font-medium transition-colors"
                >
                  Browse Slicers
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* What to Expect Section */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <Layers className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">What to Expect</h2>
            </div>
            
            <p className="text-muted-foreground mb-8">
              Our upcoming profile library will include ready-to-use configurations organized by printer and material, so you can get great prints without hours of tuning.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-900/50 border border-border/50 rounded-xl p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Printer className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Printer-Specific</h3>
                <p className="text-sm text-muted-foreground">
                  Profiles tuned for popular printers like Bambu Lab, Prusa, Creality, Voron, and more.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-border/50 rounded-xl p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Package className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Material-Optimized</h3>
                <p className="text-sm text-muted-foreground">
                  Dialed-in settings for PLA, PETG, ABS, TPU, specialty materials, and brand-specific filaments.
                </p>
              </div>

              <div className="bg-gray-900/50 border border-border/50 rounded-xl p-6">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Download className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">One-Click Import</h3>
                <p className="text-sm text-muted-foreground">
                  Download profiles ready to import directly into PrusaSlicer, OrcaSlicer, Bambu Studio, or Cura.
                </p>
              </div>
            </div>

            {/* Newsletter Signup */}
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 md:p-8">
              <h3 className="text-lg font-semibold mb-2">Get Notified When Profiles Launch</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Join our newsletter to be the first to know when the profile library goes live, plus get tips on optimizing your prints.
              </p>
              <SubscribeForUpdates topic="print profiles" className="text-left" />
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default ResourcesProfiles;
