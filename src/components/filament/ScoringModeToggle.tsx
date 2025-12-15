import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Globe, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export type ScoringMode = 'absolute' | 'relative';

interface ScoringModeToggleProps {
  mode: ScoringMode;
  onModeChange: (mode: ScoringMode) => void;
  material: string | null;
}

export function ScoringModeToggle({ mode, onModeChange, material }: ScoringModeToggleProps) {
  const baseMaterial = material?.split('-')[0]?.split(' ')[0] || 'this material';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">Compare:</span>
      <TooltipProvider>
        <ToggleGroup 
          type="single" 
          value={mode} 
          onValueChange={(value) => value && onModeChange(value as ScoringMode)}
          className="bg-muted/30 rounded-lg p-0.5"
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value="absolute" 
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-all",
                  mode === 'absolute' 
                    ? "bg-background text-foreground shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Globe className="w-3.5 h-3.5 mr-1.5" />
                vs All
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p className="text-xs">Compare against all materials in the database</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <ToggleGroupItem 
                value="relative" 
                className={cn(
                  "px-3 py-1.5 text-xs rounded-md transition-all",
                  mode === 'relative' 
                    ? "bg-background text-cyan-400 shadow-sm" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Layers className="w-3.5 h-3.5 mr-1.5" />
                vs {baseMaterial}
              </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p className="text-xs">Compare within {baseMaterial} materials only</p>
            </TooltipContent>
          </Tooltip>
        </ToggleGroup>
      </TooltipProvider>
    </div>
  );
}
