import { Check } from "lucide-react";
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
        "w-7 h-7 rounded-md flex items-center justify-center transition-all duration-200 cursor-pointer",
        // Unchecked state
        !checked && !isDisabledNotChecked && [
          "bg-white/5 border-2 border-primary/40",
          "hover:bg-primary/12 hover:border-primary/60 hover:scale-105",
        ],
        // Checked state
        checked && [
          "bg-primary border-2 border-primary",
          "hover:scale-105 hover:shadow-[0_2px_8px_hsl(var(--primary)/0.4)]",
        ],
        // Disabled state
        isDisabledNotChecked && [
          "bg-muted/5 border-2 border-muted/20",
          "cursor-not-allowed opacity-50",
        ],
        className
      )}
    >
      {checked && (
        <Check className="h-4 w-4 text-primary-foreground" strokeWidth={3} />
      )}
    </div>
  );

  // Wrap with tooltip only when disabled
  if (isDisabledNotChecked) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>{checkbox}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="bg-card border-border text-xs font-medium"
          >
            Maximum 4 printers
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return checkbox;
}
