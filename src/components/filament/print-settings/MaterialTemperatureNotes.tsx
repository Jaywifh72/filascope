import { FileText, Flame, Flag, Zap, Info } from "lucide-react";
import { MATERIAL_TEMP_NOTES, MaterialTemperatureNote } from "@/lib/printSettingsData";
import { cn } from "@/lib/utils";

interface MaterialTemperatureNotesProps {
  material: string;
  productTitle: string;
  baseNozzleTemp: number;
}

export function MaterialTemperatureNotes({ material, productTitle, baseNozzleTemp }: MaterialTemperatureNotesProps) {
  // Try to find material-specific notes, fall back to base material
  const baseMaterial = material?.split('-')[0]?.split(' ')[0]?.toUpperCase() || 'PLA';
  const notes = MATERIAL_TEMP_NOTES[baseMaterial] || MATERIAL_TEMP_NOTES['PLA'];
  
  if (!notes) return null;

  return (
    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <FileText className="w-5 h-5 text-primary" />
        <span className="font-medium text-foreground">
          Temperature Tips for {productTitle || material}
        </span>
      </div>
      
      <div className="space-y-3">
        {/* General tip */}
        <div className="flex items-start gap-2 text-sm">
          <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <span className="text-muted-foreground">{notes.generalTip}</span>
        </div>
        
        {/* First layers */}
        {notes.firstLayers.count > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Flame className="w-4 h-4 text-orange-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-foreground font-medium">
                First {notes.firstLayers.count} layers: Print {notes.firstLayers.adjustment}°C hotter ({baseNozzleTemp + notes.firstLayers.adjustment}°C)
              </span>
              <span className="text-muted-foreground"> — {notes.firstLayers.reason}</span>
            </div>
          </div>
        )}
        
        {/* Last layers */}
        {notes.lastLayers.count > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <Flag className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-foreground font-medium">
                Last {notes.lastLayers.count} layers: Print {Math.abs(notes.lastLayers.adjustment)}°C cooler ({baseNozzleTemp + notes.lastLayers.adjustment}°C)
              </span>
              <span className="text-muted-foreground"> — {notes.lastLayers.reason}</span>
            </div>
          </div>
        )}
        
        {/* High speed printing */}
        {notes.highSpeed && (
          <div className="flex items-start gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
            <div>
              <span className="text-foreground font-medium">
                High-speed printing (&gt;{notes.highSpeed.threshold}mm/s): Add {notes.highSpeed.adjustment}°C
              </span>
              <span className="text-muted-foreground"> — Higher flow rate needs more heat</span>
            </div>
          </div>
        )}
        
        {/* Specific notes */}
        {notes.specificNotes && notes.specificNotes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border">
            <div className="flex flex-wrap gap-2">
              {notes.specificNotes.map((note, i) => (
                <span 
                  key={i}
                  className={cn(
                    "text-xs px-2 py-1 rounded",
                    "bg-muted/50 text-muted-foreground"
                  )}
                >
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
