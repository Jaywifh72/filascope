import { X, BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCADComparison } from '@/contexts/CADComparisonContext';
import { Button } from '@/components/ui/button';

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

export function CADCompareTray() {
  const { 
    selectedSoftware, 
    removeSoftware, 
    clearAll,
    canCompare, 
    openComparison,
    maxSoftware 
  } = useCADComparison();
  
  const isVisible = selectedSoftware.length > 0;

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-[70]",
        "hidden lg:flex items-center gap-4",
        "px-5 py-3 rounded-2xl",
        "bg-gray-900/95 backdrop-blur-xl border border-gray-700",
        "shadow-2xl shadow-black/40",
        "transition-all duration-300",
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0 pointer-events-none"
      )}
    >
      {/* Icon */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
          <BarChart3 size={20} />
        </div>
        <div>
          <div className="text-sm font-semibold text-foreground">
            Compare CAD Software
          </div>
          <div className="text-xs text-muted-foreground">
            {selectedSoftware.length} of {maxSoftware} selected
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-gray-700" />

      {/* Selected Items */}
      <div className="flex items-center gap-2">
        {selectedSoftware.map((item) => (
          <div
            key={item.id}
            className="group relative flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600 hover:border-primary/50 transition-colors"
          >
            {cadLogos[item.name] && (
              <img
                src={cadLogos[item.name]}
                alt={item.name}
                className={cn(
                  "w-5 h-5 object-contain",
                  needsBrightness(item.name) && "brightness-150 invert"
                )}
              />
            )}
            <span className="text-sm font-medium text-foreground max-w-[100px] truncate">
              {item.name}
            </span>
            <button
              onClick={() => removeSoftware(item.id)}
              className="ml-1 p-0.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              aria-label={`Remove ${item.name} from comparison`}
            >
              <X size={14} />
            </button>
          </div>
        ))}
        
        {/* Empty slots */}
        {Array.from({ length: maxSoftware - selectedSoftware.length }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-700 flex items-center justify-center"
          >
            <span className="text-xs text-muted-foreground">+</span>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-10 bg-gray-700" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="text-muted-foreground hover:text-destructive text-xs"
        >
          Clear
        </Button>
        <Button
          onClick={openComparison}
          disabled={!canCompare}
          className={cn(
            "px-4 py-2 font-semibold text-sm transition-all",
            canCompare 
              ? "bg-primary text-primary-foreground hover:bg-primary/90" 
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          Compare Now
        </Button>
      </div>
    </div>
  );
}

export default CADCompareTray;
