import { X, BarChart3, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCADComparison } from '@/contexts/CADComparisonContext';

// Logo mapping
const cadLogos: Record<string, string> = {
  "Fusion 360": "/images/cad/fusion360.png",
  "Blender": "/images/cad/blender.png",
  "SolidWorks": "/images/cad/solidworks.png",
  "Tinkercad": "/images/cad/tinkercad.png",
  "ZBrush": "/images/cad/zbrush.png",
  "Meshmixer": "/images/cad/meshmixer.png",
  "FreeCAD": "/images/cad/freecad.svg",
  "Rhino 3D": "/images/cad/rhino3d.png",
  "OpenSCAD": "/images/cad/openscad.png",
  "Onshape": "/images/cad/onshape.png",
  "Shapr3D": "/images/cad/shapr3d.png",
  "SketchUp": "/images/cad/sketchup.png",
  "Plasticity": "/images/cad/plasticity.png",
  "Maya": "/images/cad/maya.png",
  "3ds Max": "/images/cad/3dsmax.svg",
  "Cinema 4D": "/images/cad/cinema4d.png",
  "Nomad Sculpt": "/images/cad/nomadsculpt.png",
  "AutoCAD": "/images/cad/autocad.svg",
  "SelfCAD": "/images/cad/selfcad.png",
  "BlocksCAD": "/images/cad/blockscad.png",
};

const darkLogos = ["Fusion 360", "AutoCAD", "3ds Max", "Maya", "Meshmixer"];
const needsBrightness = (name: string) => darkLogos.includes(name);

const CADComparisonSidebar = () => {
  const { 
    selectedSoftware, 
    removeSoftware, 
    clearAll, 
    canCompare, 
    openComparison,
    maxSoftware 
  } = useCADComparison();
  
  const isVisible = selectedSoftware.length > 0;
  const emptySlots = Math.max(0, maxSoftware - selectedSoftware.length);

  return (
    <aside
      className={cn(
        "fixed top-24 right-5 z-50 w-[280px]",
        "bg-background/98 backdrop-blur-xl border border-border rounded-2xl",
        "shadow-xl shadow-black/30 transition-all duration-300",
        "hidden lg:block",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-[320px] opacity-0 pointer-events-none"
      )}
    >
      {/* Header */}
      <div className="p-5 border-b border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <BarChart3 size={18} className="text-cyan-400" />
          Compare Software
        </h3>
        <p className="text-xs font-medium text-muted-foreground mt-1">
          Select 2-4 items to compare
        </p>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3">
        {selectedSoftware.map(item => (
          <div
            key={item.id}
            className="flex items-center gap-3 p-3 bg-card/50 border border-border rounded-lg hover:bg-card/80 transition-colors"
          >
            <div className="w-9 h-9 rounded-md bg-white/5 p-1.5 flex-shrink-0 flex items-center justify-center">
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
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {item.name}
              </div>
              <div className="text-xs font-medium text-muted-foreground">
                {item.priceType === 'free' ? 'Free' : 
                 item.priceType === 'freemium' ? 'Freemium' : 
                 item.priceType === 'paid' ? 'Paid' : item.priceType}
              </div>
            </div>
            <button
              onClick={() => removeSoftware(item.id)}
              className={cn(
                "w-7 h-7 flex-shrink-0 rounded-md border border-border",
                "flex items-center justify-center text-muted-foreground",
                "hover:bg-destructive/15 hover:border-destructive/30 hover:text-destructive",
                "transition-colors"
              )}
              aria-label={`Remove ${item.name} from comparison`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {/* Empty slots */}
        {Array.from({ length: emptySlots }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="flex items-center justify-center gap-2 h-[60px] border border-dashed border-border/50 rounded-lg text-xs font-medium text-muted-foreground"
          >
            <Plus size={14} />
            <span>Add another item</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 pt-0 border-t border-border mt-auto">
        <Button
          onClick={canCompare ? openComparison : undefined}
          disabled={!canCompare}
          className={cn(
            "w-full h-12 font-bold transition-all",
            canCompare 
              ? "bg-cyan-400 hover:bg-cyan-300 text-background" 
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          <BarChart3 size={18} className="mr-2" />
          Compare Now ({selectedSoftware.length})
        </Button>
        
        {selectedSoftware.length > 0 && (
          <button
            onClick={clearAll}
            className="w-full mt-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive transition-colors"
          >
            Clear All
          </button>
        )}
      </div>
    </aside>
  );
};

export default CADComparisonSidebar;
