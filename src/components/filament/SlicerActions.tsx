import { Download, Copy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface SlicerActionsProps {
  onDownload: (slicerType: 'prusaslicer' | 'orcaslicer' | 'cura' | 'bambu') => void;
  onCopy: () => void;
}

export function SlicerActions({ onDownload, onCopy }: SlicerActionsProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">For Your Slicer</span>
      
      <div className="flex flex-wrap items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                "inline-flex items-center gap-2",
                "text-[15px] text-primary",
                "hover:underline hover:opacity-90",
                "transition-opacity",
                "focus:outline-none focus:underline"
              )}
            >
              <Download className="w-4 h-4" />
              <span>Download Profile</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-popover border-border">
            <DropdownMenuItem onClick={() => onDownload('prusaslicer')} className="cursor-pointer">
              <span className="font-medium">PrusaSlicer</span>
              <span className="ml-auto text-xs text-muted-foreground">.ini</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload('orcaslicer')} className="cursor-pointer">
              <span className="font-medium">OrcaSlicer</span>
              <span className="ml-auto text-xs text-muted-foreground">.json</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload('cura')} className="cursor-pointer">
              <span className="font-medium">Cura</span>
              <span className="ml-auto text-xs text-muted-foreground">.fdm_material</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDownload('bambu')} className="cursor-pointer">
              <span className="font-medium">Bambu Studio</span>
              <span className="ml-auto text-xs text-muted-foreground">.json</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <button
          onClick={onCopy}
          className={cn(
            "inline-flex items-center gap-2",
            "text-[15px] text-primary",
            "hover:underline hover:opacity-90",
            "transition-opacity",
            "focus:outline-none focus:underline"
          )}
        >
          <Copy className="w-4 h-4" />
          <span>Copy Settings</span>
        </button>
      </div>
    </div>
  );
}
