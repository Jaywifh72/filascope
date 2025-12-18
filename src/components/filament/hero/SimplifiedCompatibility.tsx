import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, ChevronDown, ChevronUp, Flame, ThermometerSun, Settings, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface PrinterInfo {
  model_name: string;
  brand: { brand: string } | string | null;
}

interface CompatibilityData {
  overallRating: 'green' | 'orange' | 'red';
  summary: string;
  limitations: string[];
  recommendations: {
    slicer: {
      nozzle_temp_range: string;
      bed_temp_range: string;
      notes: string[];
    };
    nozzle: {
      size: string[];
      material: string;
      notes: string | null;
    };
    warnings: string[];
  };
}

interface SimplifiedCompatibilityProps {
  printer: PrinterInfo;
  compatibility: CompatibilityData;
  className?: string;
}

// Simple inline compatibility badge to avoid type issues
function SimpleCompatBadge({ rating }: { rating: 'green' | 'orange' | 'red' }) {
  if (rating === 'green') {
    return (
      <Badge className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30">
        <CheckCircle className="w-3 h-3 mr-1" /> Compatible
      </Badge>
    );
  }
  if (rating === 'orange') {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
        <AlertCircle className="w-3 h-3 mr-1" /> Usable
      </Badge>
    );
  }
  return (
    <Badge className="bg-destructive/20 text-destructive border-destructive/30">
      <XCircle className="w-3 h-3 mr-1" /> Limited
    </Badge>
  );
}

export function SimplifiedCompatibility({ 
  printer, 
  compatibility,
  className 
}: SimplifiedCompatibilityProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const printerBrand = typeof printer.brand === 'object' && printer.brand !== null && 'brand' in printer.brand 
    ? printer.brand.brand 
    : (typeof printer.brand === 'string' ? printer.brand : 'Selected Printer');

  return (
    <Card className={cn(
      "bg-gradient-to-br from-primary/10 via-card to-primary/5 border-primary/30 overflow-hidden",
      className
    )}>
      <CardContent className="p-4 sm:p-6">
        {/* Header Row - Always visible */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Printer className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-sm sm:text-base">
                {printerBrand} {printer.model_name}
              </div>
              <div className="text-xs text-muted-foreground">
                Printer compatibility
              </div>
            </div>
          </div>
          <SimpleCompatBadge rating={compatibility.overallRating} />
        </div>

        {/* Essential Settings - Always visible */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          <div className="p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Flame className="w-3 h-3" />
              Nozzle
            </div>
            <div className="font-bold text-orange-500 text-sm">
              {compatibility.recommendations.slicer.nozzle_temp_range}
            </div>
          </div>
          <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <ThermometerSun className="w-3 h-3" />
              Bed
            </div>
            <div className="font-bold text-blue-500 text-sm">
              {compatibility.recommendations.slicer.bed_temp_range}
            </div>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg border border-primary/20 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
              <Settings className="w-3 h-3" />
              Nozzle Type
            </div>
            <div className="font-bold text-primary text-sm">
              {compatibility.recommendations.nozzle.material}
            </div>
          </div>
        </div>

        {/* Expandable Details */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t border-border/50 animate-in slide-in-from-top-2 duration-200">
            {/* Nozzle sizes */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground">Recommended sizes:</span>
              {compatibility.recommendations.nozzle.size.map((size, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {size}
                </Badge>
              ))}
            </div>

            {/* Warnings */}
            {compatibility.recommendations.warnings.length > 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <div className="text-xs font-semibold text-yellow-600 mb-1">⚠️ Warnings</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {compatibility.recommendations.warnings.slice(0, 2).map((warning, i) => (
                    <li key={i}>• {warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Limitations */}
            {compatibility.limitations.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="text-xs font-semibold text-destructive mb-1">✗ Limitations</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {compatibility.limitations.slice(0, 2).map((limitation, i) => (
                    <li key={i}>• {limitation}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Slicer Notes */}
            {compatibility.recommendations.slicer.notes.length > 0 && (
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-3">
                <div className="text-xs font-semibold text-primary mb-1">💡 Tips</div>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {compatibility.recommendations.slicer.notes.slice(0, 2).map((note, i) => (
                    <li key={i}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Change Printer Link */}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <Printer className="w-3 h-3 mr-1.5" />
                  Change Printer
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 py-2 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <>
              Show Less <ChevronUp className="w-4 h-4" />
            </>
          ) : (
            <>
              View Full Compatibility <ChevronDown className="w-4 h-4" />
            </>
          )}
        </button>
      </CardContent>
    </Card>
  );
}
