import { useEffect, useRef } from 'react';
import { X, BarChart3, ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCADComparison, SelectedCADSoftware } from '@/contexts/CADComparisonContext';
import { PriceBadge, ScoreDisplay, SkillIcon } from '@/components/reference/CADBadges';
import { cadLogos, needsBrightness } from '@/lib/cadLogos';

// Comparison rows configuration
const comparisonRows = [
  { 
    label: 'Price Model', 
    key: 'price',
    getValue: (sw: SelectedCADSoftware) => {
      if (sw.priceType === 'free') return 'Free';
      if (sw.priceType === 'freemium') return 'Freemium';
      if (sw.priceType === 'paid') return 'Paid';
      if (sw.priceType === 'subscription') return 'Subscription';
      if (sw.priceType === 'perpetual') return 'Perpetual';
      return sw.priceType;
    }
  },
  { 
    label: 'Modeling Type', 
    key: 'type',
    getValue: (sw: SelectedCADSoftware) => sw.type
  },
  { 
    label: 'Platform', 
    key: 'os',
    getValue: (sw: SelectedCADSoftware) => sw.os
  },
  { 
    label: 'Overall Score', 
    key: 'overallScore',
    getValue: (sw: SelectedCADSoftware) => `⭐ ${sw.overallScore.toFixed(1)}/10`,
    highlight: true
  },
  { 
    label: 'Ease of Use', 
    key: 'ease',
    getValue: (sw: SelectedCADSoftware) => renderRating(sw.ease),
    isRating: true
  },
  { 
    label: 'Precision', 
    key: 'precision',
    getValue: (sw: SelectedCADSoftware) => renderRating(sw.precision),
    isRating: true
  },
  { 
    label: 'Sculpting', 
    key: 'sculpt',
    getValue: (sw: SelectedCADSoftware) => renderRating(sw.sculpt),
    isRating: true
  },
  { 
    label: 'Print Ready', 
    key: 'printReady',
    getValue: (sw: SelectedCADSoftware) => renderRating(sw.printReady),
    isRating: true
  },
  { 
    label: 'Parametric', 
    key: 'parametric',
    getValue: (sw: SelectedCADSoftware) => renderRating(sw.parametric),
    isRating: true
  },
  { 
    label: 'Cloud Sync', 
    key: 'cloud',
    getValue: (sw: SelectedCADSoftware) => sw.cloud === 'Yes' ? '✓ Yes' : sw.cloud === 'Partial' ? '◐ Partial' : '✗ No'
  },
  { 
    label: 'Perpetual License', 
    key: 'perpetual',
    getValue: (sw: SelectedCADSoftware) => sw.perpetual === 'Yes' ? '✓ Yes' : sw.perpetual === 'N/A' ? '—' : '✗ No'
  },
  { 
    label: 'Standout Feature', 
    key: 'standout',
    getValue: (sw: SelectedCADSoftware) => sw.standout
  }
];

// Render star rating
function renderRating(value: number) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={12}
          className={cn(
            i < value ? "fill-amber-400 text-amber-400" : "fill-muted text-muted"
          )}
        />
      ))}
    </div>
  );
}

interface CADComparisonModalProps {
  onViewDetails?: (cadDataId: string) => void;
}

// Name to cadData ID mapping
const nameToCadDataId: Record<string, string> = {
  "Fusion 360": "fusion-360",
  "Blender": "blender",
  "ZBrush": "zbrush",
  "FreeCAD": "freecad",
  "Rhino 3D": "rhino-3d",
  "SketchUp": "sketchup",
  "Onshape": "onshape",
  "Tinkercad": "tinkercad",
  "Maya": "maya",
  "Plasticity": "plasticity",
  "Shapr3D": "shapr3d",
  "SolidWorks": "solidworks",
  "Meshmixer": "meshmixer",
  "OpenSCAD": "openscad",
  "3ds Max": "3ds-max",
  "Cinema 4D": "cinema-4d",
  "Nomad Sculpt": "nomad-sculpt",
  "AutoCAD": "autocad",
  "SelfCAD": "selfcad",
  "BlocksCAD": "blockscad",
};

const CADComparisonModal = ({ onViewDetails }: CADComparisonModalProps) => {
  const { selectedSoftware, isComparisonOpen, closeComparison } = useCADComparison();
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle body scroll and focus trap
  useEffect(() => {
    if (!isComparisonOpen) return;
    
    document.body.style.overflow = 'hidden';
    
    // Focus trap implementation
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      const modal = modalRef.current;
      if (!modal) return;
      
      const focusableElements = modal.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements.length === 0) return;
      
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isComparisonOpen]);

  const handleViewDetails = (softwareName: string) => {
    closeComparison();
    const cadDataId = nameToCadDataId[softwareName];
    if (cadDataId && onViewDetails) {
      onViewDetails(cadDataId);
    }
  };

  return (
    <Dialog open={isComparisonOpen} onOpenChange={(open) => !open && closeComparison()}>
      <DialogContent 
        ref={modalRef}
        className="max-w-[95vw] md:max-w-[1000px] max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0"
        aria-describedby={undefined}
      >
        <DialogHeader className="p-5 md:p-6 border-b border-border flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-3">
            <BarChart3 size={24} className="text-cyan-400" />
            Compare CAD Software
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div 
            className="grid min-w-[600px]"
            style={{ 
              gridTemplateColumns: `140px repeat(${selectedSoftware.length}, 1fr)` 
            }}
          >
            {/* Header Row */}
            <div className="contents">
              <div className="p-4 bg-muted/30 border-b-2 border-cyan-400/20" />
              {selectedSoftware.map(item => (
                <div 
                  key={item.id}
                  className="p-4 bg-muted/30 border-b-2 border-cyan-400/20 flex flex-col items-center text-center gap-3"
                >
                  <div className="w-14 h-14 rounded-xl bg-white/5 p-2 flex items-center justify-center">
                    {cadLogos[item.name] && (
                      <img
                        src={cadLogos[item.name]}
                        alt={item.name}
                        className={cn(
                          "w-full h-full object-contain",
                          needsBrightness(item.name) && "brightness-150 invert"
                        )}
                      />
                    )}
                  </div>
                  <div className="font-bold text-foreground text-sm md:text-base">
                    {item.name}
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <PriceBadge type={item.priceType} />
                    <ScoreDisplay score={item.overallScore} size="sm" />
                  </div>
                </div>
              ))}
            </div>

            {/* Data Rows */}
            {comparisonRows.map(row => (
              <div key={row.key} className="contents group">
                <div className="p-4 bg-muted/10 border-b border-border/30 text-xs font-bold text-muted-foreground uppercase tracking-wide flex items-center group-hover:bg-muted/20 transition-colors">
                  {row.label}
                </div>
                {selectedSoftware.map(item => (
                  <div 
                    key={`${item.id}-${row.key}`}
                    className={cn(
                      "p-4 border-b border-border/30 flex items-center justify-center text-center text-sm font-medium",
                      "group-hover:bg-muted/10 transition-colors",
                      row.highlight && "text-cyan-400 font-semibold"
                    )}
                  >
                    {row.isRating ? row.getValue(item) : (
                      <span className="text-foreground/90">{row.getValue(item)}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}

            {/* Footer Row - View Details */}
            <div className="contents">
              <div className="p-5 bg-muted/30 border-t border-border" />
              {selectedSoftware.map(item => (
                <div 
                  key={`footer-${item.id}`}
                  className="p-5 bg-muted/30 border-t border-border flex items-center justify-center"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(item.name)}
                    className="border-cyan-400/30 text-cyan-400 hover:bg-cyan-400/10 hover:border-cyan-400"
                  >
                    View Details
                    <ArrowRight size={14} className="ml-1.5" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CADComparisonModal;
