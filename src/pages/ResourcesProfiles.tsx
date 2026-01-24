import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { FileText, Clock, ArrowLeft, Download } from "lucide-react";
import SubscribeForUpdates from "@/components/SubscribeForUpdates";

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
              
              <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
              
              <p className="text-muted-foreground mb-6">
                We're curating a library of optimized print profiles including:
              </p>
              
              <ul className="text-left text-sm text-muted-foreground space-y-2 mb-8 max-w-sm mx-auto">
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  PrusaSlicer profiles
                </li>
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  Cura profiles
                </li>
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  Bambu Studio profiles
                </li>
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  OrcaSlicer profiles
                </li>
                <li className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-primary" />
                  Material-specific settings
                </li>
              </ul>

              <SubscribeForUpdates topic="print profiles" className="mb-8 text-left" />
              
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
      </div>
    </>
  );
};

export default ResourcesProfiles;
