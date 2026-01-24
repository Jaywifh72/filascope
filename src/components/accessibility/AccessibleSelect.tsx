import { forwardRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface SelectOption {
  value: string;
  label: string;
}

interface AccessibleSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  label: string; // Required for accessibility
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

/**
 * Accessible Select wrapper that ensures proper ARIA labeling
 * for WCAG 2.1 AA compliance.
 */
export const AccessibleSelect = forwardRef<HTMLButtonElement, AccessibleSelectProps>(
  (
    {
      value,
      onValueChange,
      options,
      placeholder = "Select an option...",
      label,
      className,
      triggerClassName,
      disabled = false,
    },
    ref
  ) => {
    return (
      <div className={cn("relative", className)}>
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger
            ref={ref}
            className={cn(
              "w-full h-11 bg-gray-800 border-gray-700 text-white text-sm",
              triggerClassName
            )}
            aria-label={label}
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent className="bg-gray-800 border-gray-700 z-[100]">
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                className="text-sm text-white hover:bg-gray-700 min-h-[44px]"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
);

AccessibleSelect.displayName = "AccessibleSelect";

export default AccessibleSelect;
