import { Lightbulb, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export function HueForgeEducation() {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 shrink-0">
          <Lightbulb className="w-5 h-5 text-amber-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">What is HueForge?</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            HueForge is a technique for creating full-color 3D prints by stacking layers of translucent filament.
            By carefully choosing filaments with specific <strong className="text-foreground">Transmissivity (TD)</strong> values
            and arranging them from light (bottom) to dark (top), light passes through the layers to create
            vivid, painting-like artwork — all from a standard single-extruder FDM printer.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The <strong className="text-foreground">TD value</strong> measures how much light passes through a filament.
            Lower values (1–2) are more opaque, while higher values (6+) are more translucent.
            The bottom layer is typically white (high TD) and the top layer is black (low TD).
          </p>
          <div className="flex items-center gap-3 pt-1">
            <Link
              to="/compare#reference"
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
            >
              Material Knowledge Base <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
