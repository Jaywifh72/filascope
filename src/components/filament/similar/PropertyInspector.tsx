import { useState } from "react";
import { HelpCircle, BookOpen, Lightbulb, X } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { getMetricDefinition, type MetricDefinition } from "@/lib/metricGlossary";
import type { EnhancedDifferentiator } from "@/lib/filamentDifferentiators";

interface PropertyInspectorProps {
  differentiator: EnhancedDifferentiator;
  children: React.ReactNode;
}

export function PropertyInspector({ differentiator, children }: PropertyInspectorProps) {
  const [open, setOpen] = useState(false);
  
  // Try to get metric definition based on the differentiator metric
  const definition = getMetricDefinition(differentiator.metric || differentiator.text);
  
  if (!definition) {
    // If no definition found, just render children without popup
    return <>{children}</>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button 
          className="w-full text-left cursor-help hover:bg-muted/30 rounded-md transition-colors -mx-1 px-1"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-card border-border/50"
        side="right"
        align="start"
        onClick={(e) => e.stopPropagation()}
      >
        <PropertyEducationCard definition={definition} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}

interface PropertyEducationCardProps {
  definition: MetricDefinition;
  onClose: () => void;
}

function PropertyEducationCard({ definition, onClose }: PropertyEducationCardProps) {
  return (
    <div className="divide-y divide-border/50">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 p-3 bg-primary/5">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h4 className="font-semibold text-sm text-foreground">{definition.name}</h4>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 -mr-1 -mt-1"
          onClick={onClose}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Content */}
      <div className="p-3 space-y-3">
        {/* Short description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          {definition.shortDescription}
        </p>

        {/* Full explanation */}
        <div className="text-xs text-foreground/80 leading-relaxed">
          {definition.fullExplanation}
        </div>

        {/* Why it matters */}
        <div className="rounded-md bg-primary/5 p-2.5">
          <p className="text-xs font-medium text-primary mb-1">Why this matters:</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {definition.whyMatters}
          </p>
        </div>

        {/* Scale */}
        {definition.scale && (
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">Scale:</span>{" "}
            {definition.scale}
          </div>
        )}

        {/* Tips */}
        {definition.tips && definition.tips.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-400">
              <Lightbulb className="h-3 w-3" />
              <span>Quick Tips</span>
            </div>
            <ul className="space-y-1">
              {definition.tips.slice(0, 3).map((tip, idx) => (
                <li key={idx} className="text-xs text-muted-foreground pl-3 relative">
                  <span className="absolute left-0">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
