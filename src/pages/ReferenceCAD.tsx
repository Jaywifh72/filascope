import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Check, X, DollarSign, Monitor, FileType, Wifi, Box, Users, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { cadData } from "@/lib/cadData";
import Navbar from "@/components/Navbar";

const recommendationMatrix = [
  {
    profile: "Mechanical Engineer (Pro)",
    recommendation: "SolidWorks",
    rationale: "Industry standard, robust simulation, manufacturing integration."
  },
  {
    profile: "Mechanical Engineer (Hobby)",
    recommendation: "Fusion 360",
    rationale: "Powerful free tier, integrated CAM/Mesh tools, vast community resources."
  },
  {
    profile: "Artistic Sculptor",
    recommendation: "ZBrush",
    rationale: "Unrivaled poly count handling, industry standard for figurines."
  },
  {
    profile: "Cosplay / Prop Maker",
    recommendation: "Blender",
    rationale: "Free, powerful organic modeling, great plugins (3D Print Toolbox)."
  },
  {
    profile: "Concept Artist (Hard Surface)",
    recommendation: "Plasticity",
    rationale: "Fast workflow, perpetual license, great fillet engine."
  },
  {
    profile: "Architect",
    recommendation: "Rhino 3D",
    rationale: "ShrinkWrap feature (Rhino 8) solves printing issues; Grasshopper for patterns."
  },
  {
    profile: "Educator / Beginner",
    recommendation: "Tinkercad",
    rationale: "Zero barrier to entry, reliable solid exports."
  },
  {
    profile: "Code / Math Enthusiast",
    recommendation: "OpenSCAD",
    rationale: "Precise, version-controllable, lightweight."
  },
  {
    profile: "Mobile / Tablet User",
    recommendation: "Shapr3D / Nomad",
    rationale: "Shapr3D for parts (Pro required for quality); Nomad for art."
  }
];

const ReferenceCAD = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
          
          <div className="flex items-center gap-3 mb-2">
            <Box className="w-8 h-8 text-cyan-400" />
            <h1 className="text-3xl font-bold font-mono text-foreground">3D Modeling / CAD Software Reference</h1>
          </div>
          <p className="text-muted-foreground">
            Comprehensive guide to CAD and 3D modeling software for additive manufacturing
          </p>
        </div>

        {/* Recommendation Matrix */}
        <div className="mb-8 border border-border rounded-lg bg-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-amber-400" />
            <h2 className="text-xl font-bold font-mono text-foreground">Recommendation Matrix</h2>
          </div>
          <p className="text-muted-foreground text-sm mb-4">
            Quick reference guide to find the best CAD software based on your user profile and needs.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      User Profile
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Primary Recommendation
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-amber-400" />
                      Strategic Rationale
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {recommendationMatrix.map((row, index) => (
                  <tr 
                    key={index} 
                    className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-foreground">{row.profile}</span>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="secondary" className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30 font-mono">
                        {row.recommendation}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground">{row.rationale}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <Accordion type="multiple" className="space-y-4">
          {cadData.map((software, index) => (
            <AccordionItem 
              key={software.id} 
              value={software.id}
              className="border border-border rounded-lg bg-card px-4"
            >
              <AccordionTrigger className="hover:no-underline py-4">
                <div className="flex items-center gap-4 text-left">
                  <span className="text-2xl font-bold text-cyan-400 font-mono">{index + 1}.</span>
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{software.name}</h2>
                    <p className="text-sm text-muted-foreground line-clamp-1">{software.summary}</p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="space-y-6">
                  {/* Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Summary</h3>
                    <p className="text-muted-foreground">{software.summary}</p>
                  </div>

                  {/* Architecture Overview */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Architecture & Market Position</h3>
                    <p className="text-muted-foreground">{software.architectureOverview}</p>
                  </div>

                  {/* Additive Manufacturing Workflow */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Additive Manufacturing Workflow</h3>
                    <ul className="space-y-2">
                      {software.additiveWorkflow.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-muted-foreground">
                          <span className="text-cyan-400 mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Pricing Table */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Pricing & Licensing</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-2 px-3 text-sm font-medium text-foreground">License Tier</th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-foreground">Cost</th>
                            <th className="text-left py-2 px-3 text-sm font-medium text-foreground">Features & Limitations</th>
                          </tr>
                        </thead>
                        <tbody>
                          {software.pricing.map((tier, i) => (
                            <tr key={i} className="border-b border-border/50">
                              <td className="py-2 px-3 text-sm font-medium text-cyan-400">{tier.tier}</td>
                              <td className="py-2 px-3 text-sm text-amber-400 font-mono">{tier.cost}</td>
                              <td className="py-2 px-3 text-sm text-muted-foreground">{tier.features}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Check className="w-5 h-5 text-green-500" />
                        Strengths
                      </h3>
                      <ul className="space-y-2">
                        {software.strengths.map((strength, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
                        <X className="w-5 h-5 text-red-500" />
                        Weaknesses
                      </h3>
                      <ul className="space-y-2">
                        {software.weaknesses.map((weakness, i) => (
                          <li key={i} className="flex items-start gap-2 text-muted-foreground text-sm">
                            <span className="text-red-500 mt-0.5">✗</span>
                            <span>{weakness}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Technical Specifications */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Technical Specifications</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <DollarSign className="w-3 h-3" />
                          Price
                        </div>
                        <p className="text-sm font-medium text-foreground">{software.technicalSpecs.price}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Monitor className="w-3 h-3" />
                          Supported OS
                        </div>
                        <p className="text-sm font-medium text-foreground">{software.technicalSpecs.supportedOS}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <FileType className="w-3 h-3" />
                          File Support
                        </div>
                        <p className="text-sm font-medium text-foreground">{software.technicalSpecs.fileSupport}</p>
                      </div>
                      <div className="bg-muted/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                          <Wifi className="w-3 h-3" />
                          Connectivity
                        </div>
                        <p className="text-sm font-medium text-foreground">{software.technicalSpecs.connectivity}</p>
                      </div>
                    </div>
                  </div>

                  {/* Important Links */}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Important Links</h3>
                    <div className="flex flex-wrap gap-2">
                      {software.links.website && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={software.links.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Website
                          </a>
                        </Button>
                      )}
                      {software.links.download && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={software.links.download} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Download
                          </a>
                        </Button>
                      )}
                      {software.links.source && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={software.links.source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Source Code
                          </a>
                        </Button>
                      )}
                      {software.links.documentation && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={software.links.documentation} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            Documentation
                          </a>
                        </Button>
                      )}
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

export default ReferenceCAD;
