import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Scissors, DollarSign, Monitor, FileCode, Wifi, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { slicerData } from "@/lib/slicerData";

const ReferenceSlicers = () => {
  return (
    <div className="min-h-screen bg-background">
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
