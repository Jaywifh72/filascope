import { BarChart3, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
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

const CADComparisonMobile = () => {
  const { selectedSoftware, canCompare, openComparison } = useCADComparison();
  
  const isVisible = selectedSoftware.length > 0;

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
        "h-[70px] px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom))]",
        "bg-background/98 backdrop-blur-xl border-t border-border",
        "shadow-[0_-4px_20px_rgba(0,0,0,0.3)]",
        "flex items-center gap-3",
        "transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
      )}
    >
      {/* Icon */}
      <div className="w-11 h-11 flex-shrink-0 rounded-lg bg-cyan-400/15 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
        <BarChart3 size={20} />
      </div>

      {/* Avatars */}
      <div className="flex items-center">
        {selectedSoftware.slice(0, 4).map((item, index) => (
          <div
            key={item.id}
            className={cn(
              "w-8 h-8 rounded-lg bg-white/5 border-2 border-background p-1 flex items-center justify-center",
              index > 0 && "-ml-2"
            )}
            style={{ zIndex: 10 - index }}
          >
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
        ))}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-foreground">
          Comparing ({selectedSoftware.length})
        </div>
        <div className="text-xs font-medium text-muted-foreground">
          {canCompare ? 'Tap to compare' : 'Add 1 more to compare'}
        </div>
      </div>

      {/* Compare Button */}
      <button
        onClick={canCompare ? openComparison : undefined}
        disabled={!canCompare}
        className={cn(
          "h-11 px-5 flex-shrink-0 rounded-lg font-bold text-sm flex items-center gap-1.5 transition-all",
          canCompare 
            ? "bg-cyan-400 text-background active:scale-[0.98]" 
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
        aria-label={canCompare ? `Compare ${selectedSoftware.length} items` : 'Need at least 2 items'}
      >
        Compare
        <ChevronRight size={16} />
      </button>
    </div>
  );
};

export default CADComparisonMobile;
