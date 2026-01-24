import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { SlidersHorizontal, Clock, ArrowLeft } from "lucide-react";
import SubscribeForUpdates from "@/components/SubscribeForUpdates";

const GuidePrintSettings = () => {
  return (
    <>
      <Helmet>
        <title>Print Settings Guide | FilaScope</title>
        <meta name="description" content="Learn optimal print settings for different materials. Master layer height, print speed, temperature, and more." />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          {/* Background effects */}
          <div className="absolute inset-0 bg-gradient-to-b from-gray-900/50 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          
          <div className="container mx-auto px-4 relative z-10">
            <Link 
              to="/learn" 
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
              
              <h2 className="text-2xl font-bold mb-4">Coming Soon</h2>
              
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
              
              <Link 
                to="/learn"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-lg text-primary font-medium transition-colors"
              >
                Explore Other Guides
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default GuidePrintSettings;
