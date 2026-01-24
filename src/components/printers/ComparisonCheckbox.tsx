import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComparisonCheckboxProps {
  checked: boolean;
  disabled: boolean;
  onChange: () => void;
  printerName: string;
  className?: string;
}

export default function ComparisonCheckbox({
  checked,
  disabled,
  onChange,
  printerName,
  className,
}: ComparisonCheckboxProps) {
  const isDisabledNotChecked = disabled && !checked;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDisabledNotChecked) {
      onChange();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      e.stopPropagation();
      if (!isDisabledNotChecked) {
        onChange();
      }
    }
  };

  const checkbox = (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={isDisabledNotChecked}
      aria-label={`${checked ? "Remove" : "Add"} ${printerName} ${checked ? "from" : "to"} comparison`}
      tabIndex={0}
      className={cn(
        "rounded-full flex items-center justify-center cursor-pointer",
        "transition-all duration-200 ease-out",
        // Checked state - always visible with glow and animation
        checked && [
          "w-6 h-6 bg-primary border-2 border-primary",
          "shadow-[0_0_12px_rgba(0,207,232,0.4)]",
        ],
        // Unchecked state - subtle but visible
        !checked && !isDisabledNotChecked && [
          "w-5 h-5 bg-gray-800/60 border border-gray-600/60 opacity-50",
          // Hover state - prominent
          "group-hover:w-6 group-hover:h-6 group-hover:opacity-100",
          "group-hover:border-primary/60 group-hover:bg-primary/20",
          "hover:!opacity-100 hover:!scale-110 hover:!border-primary hover:!bg-primary/30",
        ],
        // Disabled state
        isDisabledNotChecked && [
          "w-5 h-5 bg-gray-800/40 border border-gray-700/40",
          "cursor-not-allowed opacity-30",
        ],
        className
      )}
    >
      {checked ? (
        <Check className="h-3.5 w-3.5 text-primary-foreground animate-check-draw" strokeWidth={3} />
      ) : (
        <Plus className={cn(
          "text-gray-400 transition-all duration-200",
          "w-3 h-3 group-hover:w-3.5 group-hover:h-3.5 group-hover:text-primary"
        )} />
      )}
    </div>
  );

  // Wrap with tooltip
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{checkbox}</TooltipTrigger>
        <TooltipContent
          side="top"
          className="bg-slate-800 border-gray-700 text-xs font-medium"
        >
          {isDisabledNotChecked 
            ? "Maximum 4 printers" 
            : checked 
              ? "Remove from compare" 
              : "Add to Compare"
          }
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
