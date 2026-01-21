import React from 'react';
import { ChevronDown, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SpecsDrawerProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  preview: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SpecsDrawer: React.FC<SpecsDrawerProps> = ({
  id,
  icon,
  title,
  preview,
  isExpanded,
  onToggle,
  children,
}) => {
  return (
    <div className="w-full overflow-hidden rounded-xl">
      {/* Drawer Header */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`drawer-content-${id}`}
        className={cn(
          "w-full px-5 py-4 flex items-center gap-3 cursor-pointer transition-all duration-200 text-left rounded-xl",
          isExpanded
            ? "bg-muted/50 border border-border/60"
            : "bg-muted/30 border border-border/40 hover:bg-muted/40 hover:border-border/60"
        )}
      >
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center">
          {icon}
        </div>

        {/* Title */}
        <span className="text-sm font-semibold text-foreground whitespace-nowrap">
          {title}
        </span>

        {/* Preview Text - Hidden on mobile */}
        <span className="hidden md:block text-sm text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {preview}
        </span>

        {/* Toggle Icon */}
        <div
          className={cn(
            "w-5 h-5 text-muted-foreground flex-shrink-0 ml-auto flex items-center justify-center transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        >
          <ChevronDown className="w-5 h-5" />
        </div>
      </button>

      {/* Drawer Content */}
      <div
        id={`drawer-content-${id}`}
        aria-hidden={!isExpanded}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out rounded-b-xl",
          "bg-muted/20 border-x border-b border-border/40",
          isExpanded
            ? "max-h-[2000px] opacity-100 p-5 md:p-6 mt-1"
            : "max-h-0 opacity-0 p-0 border-none"
        )}
      >
        {children}
      </div>
    </div>
  );
};

// Sub-components for drawer content

export const SpecTable: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex flex-col">
    {/* Table header */}
    <div className="hidden md:flex justify-between py-2 border-b border-border/40 mb-1">
      <span className="text-xs text-muted-foreground font-medium">Parameter</span>
      <span className="text-xs text-muted-foreground font-medium">Value</span>
    </div>
    {children}
  </div>
);

export const SpecRow: React.FC<{
  label: string;
  value: any;
  unit?: string;
}> = ({ label, value, unit }) => {
  // Format value
  let displayValue: string;
  if (value === null || value === undefined || value === '') {
    displayValue = '—';
  } else if (typeof value === 'boolean') {
    displayValue = value ? 'Yes' : 'No';
  } else {
    displayValue = String(value) + (unit || '');
  }

  const isEnabled = typeof value === 'boolean' && value;
  const isDisabled = typeof value === 'boolean' && !value;

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center py-3 border-b border-border/20 last:border-b-0 gap-1 md:gap-0 hover:bg-muted/30 px-2 -mx-2 rounded-lg transition-colors">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className={cn(
        "text-sm font-medium md:text-right",
        isEnabled && "text-green-500",
        isDisabled && "text-muted-foreground/60",
        !isEnabled && !isDisabled && "text-foreground"
      )}>
        {displayValue}
      </div>
    </div>
  );
};

export const FeatureList: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">{children}</div>
);

export const FeatureItem: React.FC<{
  text: string;
  available?: boolean;
}> = ({ text, available = true }) => (
  <div className="flex items-center gap-2.5">
    <div className={cn(
      "w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center",
      available ? "bg-green-500/20 text-green-500" : "bg-muted/50 text-muted-foreground/50"
    )}>
      {available ? (
        <Check className="w-3 h-3" />
      ) : (
        <X className="w-3 h-3" />
      )}
    </div>
    <span className={cn(
      "text-sm",
      available ? "text-foreground" : "text-muted-foreground/60"
    )}>
      {text}
    </span>
  </div>
);

export const ContentSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="mb-6 last:mb-0">
    <div className="flex items-center gap-2 mb-4">
      <h4 className="text-sm font-semibold text-foreground">
        {title}
      </h4>
      <div className="flex-1 h-px bg-border/40" />
    </div>
    {children}
  </div>
);

export default SpecsDrawer;
