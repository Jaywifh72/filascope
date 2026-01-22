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
        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer",
        // Unchecked state
        !checked && !isDisabledNotChecked && [
          "bg-transparent border-2 border-gray-600",
          "hover:bg-primary/10 hover:border-primary/60 hover:scale-105",
        ],
        // Checked state
        checked && [
          "bg-primary border-2 border-primary",
          "shadow-[0_0_12px_rgba(0,207,232,0.4)]",
          "hover:scale-105",
        ],
        // Disabled state
        isDisabledNotChecked && [
          "bg-transparent border-2 border-gray-700",
          "cursor-not-allowed opacity-50",
        ],
        className
      )}
    >
      {checked && (
        <Check className="h-3.5 w-3.5 text-primary-foreground" strokeWidth={3} />
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
