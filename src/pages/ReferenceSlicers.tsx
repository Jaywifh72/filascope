import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Scissors, DollarSign, Monitor, FileCode, Wifi, Clock, Check, X, Star, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { slicerData } from "@/lib/slicerData";
import Navbar from "@/components/Navbar";

const slicerComparison = [
  { name: "UltiMaker Cura", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 5, control: 5, support: 4, speed: 3, ui: 5, connectivity: "Cloud/LAN/USB", step: "Paid Plugin", multiMat: 5, standout: "Marketplace Ecosystem" },
  { name: "PrusaSlicer", price: "Free", focus: "Both", os: "Win/Mac/Lin", ease: 5, control: 5, support: 5, speed: 5, ui: 5, connectivity: "LAN/USB", step: "Yes", multiMat: 5, standout: "Organic Supports" },
  { name: "OrcaSlicer", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 4, control: 5, support: 5, speed: 5, ui: 5, connectivity: "LAN/WiFi", step: "Yes", multiMat: 5, standout: "Built-in Calibration" },
  { name: "Bambu Studio", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 5, control: 4, support: 4, speed: 5, ui: 5, connectivity: "Cloud/LAN", step: "Yes", multiMat: 5, standout: "Multi-Color Painting" },
  { name: "Simplify3D", price: "Paid", focus: "FDM", os: "Win/Mac/Lin", ease: 3, control: 5, support: 4, speed: 5, ui: 3, connectivity: "USB", step: "No", multiMat: 4, standout: "Process Architecture" },
  { name: "Creality Print", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 3, control: 3, support: 3, speed: 4, ui: 4, connectivity: "Cloud/LAN", step: "Yes", multiMat: 3, standout: "Cloud Model Integration" },
  { name: "ideaMaker", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 4, control: 4, support: 4, speed: 4, ui: 4, connectivity: "Cloud/LAN", step: "Yes", multiMat: 5, standout: "Texture Generation" },
  { name: "SuperSlicer", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 2, control: 5, support: 4, speed: 4, ui: 3, connectivity: "LAN/USB", step: "Yes", multiMat: 4, standout: "Dense Infill Control" },
  { name: "FlashPrint", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 4, control: 2, support: 3, speed: 3, ui: 4, connectivity: "Cloud/USB", step: "No", multiMat: 4, standout: "Dimensional Compensation" },
  { name: "Anycubic Slicer", price: "Free", focus: "FDM", os: "Win/Mac", ease: 4, control: 4, support: 4, speed: 4, ui: 4, connectivity: "Cloud", step: "Yes", multiMat: 3, standout: "High Speed Optimization" },
  { name: "Lychee Slicer", price: "Freemium", focus: "Both", os: "Win/Mac/Lin", ease: 5, control: 4, support: 5, speed: 3, ui: 5, connectivity: "WiFi", step: "No", multiMat: 3, standout: "Magic Menu Automation" },
  { name: "ChiTuBox", price: "Freemium", focus: "SLA", os: "Win/Mac/Lin", ease: 3, control: 4, support: 4, speed: 3, ui: 3, connectivity: "LAN", step: "Pro Only", multiMat: 1, standout: "Native Hardware Support" },
  { name: "VoxelDance Tango", price: "Paid", focus: "SLA", os: "Win/Mac", ease: 4, control: 5, support: 5, speed: 5, ui: 4, connectivity: "WiFi", step: "Yes", multiMat: 1, standout: "Smart Support Scripts" },
  { name: "Repetier-Host", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 2, control: 5, support: 3, speed: 3, ui: 2, connectivity: "USB/Server", step: "No", multiMat: 3, standout: "Host Manual Control" },
  { name: "Slic3r", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 2, control: 3, support: 2, speed: 2, ui: 2, connectivity: "Offline", step: "No", multiMat: 3, standout: "Command Line Interface" },
  { name: "KISSlicer", price: "Freemium", focus: "FDM", os: "Win/Mac/Lin", ease: 1, control: 5, support: 3, speed: 4, ui: 1, connectivity: "Offline", step: "No", multiMat: 2, standout: "Stepover Control" },
  { name: "MatterControl", price: "Free", focus: "FDM", os: "Win/Mac/Lin", ease: 4, control: 3, support: 3, speed: 3, ui: 4, connectivity: "USB/Cloud", step: "No", multiMat: 3, standout: "Integrated Design Apps" },
  { name: "CraftWare", price: "Freemium", focus: "FDM", os: "Win/Mac/Lin", ease: 4, control: 4, support: 4, speed: 5, ui: 4, connectivity: "Cloud", step: "No", multiMat: 5, standout: "G-Code Visualizer" },
  { name: "Kiri:Moto", price: "Free", focus: "All", os: "Browser", ease: 4, control: 3, support: 2, speed: 3, ui: 4, connectivity: "Export/Onshape", step: "No", multiMat: 2, standout: "Browser-Based CAM" },
  { name: "3DPrinterOS", price: "Paid", focus: "FDM", os: "Web", ease: 5, control: 3, support: 3, speed: 3, ui: 4, connectivity: "Cloud", step: "Yes", multiMat: 3, standout: "Fleet Management" },
];

const RatingDots = ({ rating }: { rating: number }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${
            i <= rating
              ? rating >= 4 ? "bg-emerald-400" : rating >= 3 ? "bg-amber-400" : "bg-red-400"
              : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
};

const StepBadge = ({ value }: { value: string }) => {
  if (value === "Yes") return <Check className="w-4 h-4 text-emerald-400" />;
  if (value === "No") return <X className="w-4 h-4 text-muted-foreground" />;
  return <span className="text-xs text-amber-400">{value}</span>;
};

const ReferenceSlicers = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/30">
              <Scissors className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground font-mono">3D Slicer Software</h1>
              <p className="text-muted-foreground">Complete reference guide to FDM & Resin slicing software</p>
            </div>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
              {slicerData.length} Slicers
            </Badge>
            <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
              FDM & Resin
            </Badge>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
              Free & Premium
            </Badge>
          </div>
        </div>

        {/* Comparative Features Table */}
        <div className="mb-8 border border-border rounded-lg bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl font-bold font-mono text-foreground">Comparative Features Matrix</h2>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <p className="text-muted-foreground text-sm">
              Side-by-side comparison of slicer capabilities, ratings (1-5), and standout features.
            </p>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-muted-foreground">Rating:</span>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-muted-foreground">4-5 (Excellent)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-muted-foreground">3 (Average)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-muted-foreground">1-2 (Limited)</span>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2 px-3 font-semibold text-foreground sticky left-0 bg-muted/30 z-10">Software</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Price</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Focus</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">OS</th>
                  <th className="text-center py-2 px-3 font-semibold text-foreground">Ease</th>
                  <th className="text-center py-2 px-3 font-semibold text-foreground">Control</th>
                  <th className="text-center py-2 px-3 font-semibold text-foreground">Supports</th>
                  <th className="text-center py-2 px-3 font-semibold text-foreground">Speed</th>
                  <th className="text-center py-2 px-3 font-semibold text-foreground">UI</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Connect</th>
                  <th className="text-center py-2 px-3 font-semibold text-foreground">STEP</th>
                  <th className="text-center py-2 px-3 font-semibold text-foreground">Multi-Mat</th>
                  <th className="text-left py-2 px-3 font-semibold text-foreground">Standout Feature</th>
                </tr>
              </thead>
              <tbody>
                {slicerComparison.map((slicer, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-2 px-3 font-medium text-foreground sticky left-0 bg-card z-10 whitespace-nowrap">{slicer.name}</td>
                    <td className="py-2 px-3">
                      <Badge 
                        variant="outline" 
                        className={
                          slicer.price === "Free" 
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                            : slicer.price === "Freemium"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30"
                        }
                      >
                        {slicer.price}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-muted-foreground">{slicer.focus}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{slicer.os}</td>
                    <td className="py-2 px-3"><RatingDots rating={slicer.ease} /></td>
                    <td className="py-2 px-3"><RatingDots rating={slicer.control} /></td>
                    <td className="py-2 px-3"><RatingDots rating={slicer.support} /></td>
                    <td className="py-2 px-3"><RatingDots rating={slicer.speed} /></td>
                    <td className="py-2 px-3"><RatingDots rating={slicer.ui} /></td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{slicer.connectivity}</td>
                    <td className="py-2 px-3 text-center"><StepBadge value={slicer.step} /></td>
                    <td className="py-2 px-3"><RatingDots rating={slicer.multiMat} /></td>
                    <td className="py-2 px-3 text-cyan-400 text-xs whitespace-nowrap">{slicer.standout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slicer List */}
        <Accordion type="single" collapsible className="space-y-3">
          {slicerData.map((slicer, index) => (
            <AccordionItem 
              key={slicer.id} 
              value={slicer.id}
              className="border border-border/50 rounded-lg bg-card/50 backdrop-blur-sm px-4 data-[state=open]:border-emerald-500/30"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-4 text-left">
                  <span className="text-xs font-mono text-muted-foreground w-6">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{slicer.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1 max-w-2xl">
                      {slicer.summary.substring(0, 100)}...
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              
              <AccordionContent className="pb-6">
                <div className="space-y-6 pt-2">
                  {/* Summary */}
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wide mb-2">Summary</h4>
                    <p className="text-muted-foreground leading-relaxed">{slicer.summary}</p>
                  </div>

                  {/* History */}
                  <div>
                    <h4 className="text-sm font-semibold text-blue-400 uppercase tracking-wide mb-2 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      History
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">{slicer.history}</p>
                  </div>

                  {/* Key Strengths */}
                  <div>
                    <h4 className="text-sm font-semibold text-amber-400 uppercase tracking-wide mb-3">Key Strengths</h4>
                    <div className="grid gap-3 md:grid-cols-3">
                      {slicer.keyStrengths.map((strength, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-background/50 border border-border/30">
                          <h5 className="font-medium text-foreground mb-1">{strength.title}</h5>
                          <p className="text-sm text-muted-foreground">{strength.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Technical Specifications */}
                  <div>
                    <h4 className="text-sm font-semibold text-cyan-400 uppercase tracking-wide mb-3">Technical Specifications</h4>
                    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <DollarSign className="w-3 h-3" />
                          Price
                        </div>
                        <p className="text-sm text-foreground">{slicer.technicalSpecs.price}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Monitor className="w-3 h-3" />
                          Supported OS
                        </div>
                        <p className="text-sm text-foreground">{slicer.technicalSpecs.supportedOS}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <FileCode className="w-3 h-3" />
                          File Support
                        </div>
                        <p className="text-sm text-foreground">{slicer.technicalSpecs.fileSupport}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-background/50 border border-border/30">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Wifi className="w-3 h-3" />
                          Connectivity
                        </div>
                        <p className="text-sm text-foreground">{slicer.technicalSpecs.connectivity}</p>
                      </div>
                    </div>
                    {slicer.technicalSpecs.status && (
                      <div className="mt-3">
                        <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30">
                          {slicer.technicalSpecs.status}
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Links */}
                  <div>
                    <h4 className="text-sm font-semibold text-purple-400 uppercase tracking-wide mb-3">Important Links</h4>
                    <div className="flex flex-wrap gap-2">
                      {slicer.links.map((link, idx) => (
                        <Button
                          key={idx}
                          variant="outline"
                          size="sm"
                          asChild
                          className="gap-2"
                        >
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            {link.label}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
};

export default ReferenceSlicers;
