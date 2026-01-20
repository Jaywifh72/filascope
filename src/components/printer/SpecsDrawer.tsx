import React from 'react';
import { ChevronDown } from 'lucide-react';
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
    <div className="w-full overflow-hidden">
      {/* Drawer Header */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`drawer-content-${id}`}
        className={cn(
          "w-full h-[56px] md:h-[60px] px-4 md:px-5 flex items-center gap-3 cursor-pointer transition-all duration-200 text-left",
          isExpanded
            ? "bg-[#0A0C10] border border-primary/30"
            : "bg-[#0A0C10] border border-white/10 hover:border-primary/30 hover:translate-x-[2px]"
        )}
      >
        {/* Icon */}
        <div className="w-5 h-5 text-primary flex-shrink-0 flex items-center justify-center">
          {icon}
        </div>

        {/* Title */}
        <span className="font-mono text-xs md:text-[13px] font-bold text-white uppercase tracking-[0.15em] whitespace-nowrap">
          {title}
        </span>

        {/* Preview Text - Hidden on mobile */}
        <span className="hidden md:block font-mono text-xs text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {preview}
        </span>

        {/* Toggle Icon */}
        <div
          className={cn(
            "w-5 h-5 text-primary/60 flex-shrink-0 ml-auto flex items-center justify-center transition-transform duration-200",
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
          "overflow-hidden transition-all duration-300 ease-out",
          "bg-[#0A0C10]/80 border-x border-b border-primary/20",
          isExpanded
            ? "max-h-[2000px] opacity-100 p-5 md:p-6"
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
    <div className="hidden md:flex justify-between py-2 border-b border-primary/20 mb-1">
      <span className="font-mono text-[10px] text-primary/60 uppercase tracking-[0.2em]">PARAMETER</span>
      <span className="font-mono text-[10px] text-primary/60 uppercase tracking-[0.2em]">VALUE</span>
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
    displayValue = value ? 'ENABLED' : 'DISABLED';
  } else {
    displayValue = String(value) + (unit || '');
  }

  const isEnabled = typeof value === 'boolean' && value;
  const isDisabled = typeof value === 'boolean' && !value;

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center py-2.5 border-b border-white/5 last:border-b-0 gap-1 md:gap-0 hover:bg-primary/5 px-2 -mx-2 transition-colors">
      <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={cn(
        "font-mono text-xs font-semibold md:text-right",
        isEnabled && "text-green-500",
        isDisabled && "text-muted-foreground/50",
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
      "w-4 h-4 flex-shrink-0 flex items-center justify-center font-mono text-[10px]",
      available ? "text-green-500" : "text-red-500/50"
    )}>
      {available ? (
        <span>[✓]</span>
      ) : (
        <span>[✗]</span>
      )}
    </div>
    <span className={cn(
      "font-mono text-xs",
      available ? "text-foreground" : "text-muted-foreground/50"
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
      <span className="font-mono text-[10px] text-primary/60 uppercase tracking-wider">&gt;&gt;</span>
      <h4 className="font-mono text-xs font-bold text-primary uppercase tracking-[0.15em]">
        {title}
      </h4>
      <div className="flex-1 h-px bg-primary/20" />
    </div>
    {children}
  </div>
);

export default SpecsDrawer;
