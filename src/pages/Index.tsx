import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Search, Layers, TrendingUp, Zap } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 hero-gradient opacity-10"></div>
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center space-y-8">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              Find Your Perfect
              <span className="block hero-gradient bg-clip-text text-transparent">
                3D Printer Filament
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Compare hundreds of filaments by material, printer compatibility, mechanical properties, 
              and price. Make informed decisions with comprehensive technical data.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="text-lg px-8">
                <Link to="/finder">
                  <Search className="mr-2 h-5 w-5" />
                  Browse Filaments
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/wizard">
                  <Zap className="mr-2 h-5 w-5" />
                  Filament Wizard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Powerful Tools for Filament Selection
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-elevated bg-card p-8 rounded-xl">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Advanced Filtering</h3>
              <p className="text-muted-foreground">
                Filter by material type, printer model, mechanical properties, print settings, 
                and budget to find exactly what you need.
              </p>
            </div>

            <div className="card-elevated bg-card p-8 rounded-xl">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Layers className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Compatibility Matrix</h3>
              <p className="text-muted-foreground">
                Check printer-filament compatibility at a glance, including AMS fit and 
                brass-safe requirements.
              </p>
            </div>

            <div className="card-elevated bg-card p-8 rounded-xl">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Price Tracking</h3>
              <p className="text-muted-foreground">
                Monitor price history and get notified of regional deals to save on your 
                filament purchases.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Find Your Filament?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start comparing hundreds of filaments with detailed technical specifications
          </p>
          <Button asChild size="lg" className="text-lg px-8">
            <Link to="/finder">
              Get Started
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
