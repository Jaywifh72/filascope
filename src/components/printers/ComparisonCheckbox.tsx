import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={isDisabledNotChecked}
      aria-label={`${checked ? "Remove" : "Add"} ${printerName} ${checked ? "from" : "to"} comparison`}
      tabIndex={0}
      title={
        isDisabledNotChecked
          ? "Maximum 4 printers"
          : checked
            ? "Remove from Compare"
            : "Add to Compare"
      }
      className={cn(
        "w-7 h-7 rounded-full flex items-center justify-center cursor-pointer",
        "transition-all duration-200",
        checked && [
          "bg-cyan-500/20 border border-cyan-500",
        ],
        !checked && !isDisabledNotChecked && [
          "bg-gray-800/80 border border-gray-700",
          "hover:border-cyan-500/50 hover:bg-gray-700",
        ],
        isDisabledNotChecked && [
          "bg-gray-800/40 border border-gray-700/40",
          "cursor-not-allowed opacity-30",
        ],
        className
      )}
    >
      {checked ? (
        <Check className="h-3.5 w-3.5 text-cyan-400" strokeWidth={3} />
      ) : (
        <Plus className="h-3.5 w-3.5 text-gray-400" />
      )}
    </div>
  );
}
