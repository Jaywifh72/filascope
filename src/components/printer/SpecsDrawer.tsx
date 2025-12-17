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
    <div className="w-full rounded-[10px] overflow-hidden">
      {/* Drawer Header */}
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={`drawer-content-${id}`}
        className={cn(
          "w-full h-[60px] px-5 flex items-center gap-3 cursor-pointer transition-all duration-200 text-left",
          "md:h-[60px] h-[56px] md:px-5 px-4",
          isExpanded
            ? "bg-primary/10 border border-primary/30 rounded-t-[10px] rounded-b-none"
            : "bg-white/5 border border-white/10 rounded-[10px] hover:bg-white/[0.08] hover:border-primary/30 hover:translate-x-[2px]"
        )}
      >
        {/* Icon */}
        <div className="w-5 h-5 text-primary flex-shrink-0 flex items-center justify-center">
          {icon}
        </div>

        {/* Title */}
        <span className="text-[15px] md:text-[15px] text-[14px] font-bold text-white uppercase tracking-[0.03em] whitespace-nowrap">
          {title}
        </span>

        {/* Preview Text - Hidden on mobile */}
        <span className="hidden md:block text-sm font-medium text-slate-400 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
          {preview}
        </span>

        {/* Toggle Icon */}
        <div
          className={cn(
            "w-6 h-6 text-slate-500 flex-shrink-0 ml-auto flex items-center justify-center transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
        >
          <ChevronDown className="w-6 h-6" />
        </div>
      </button>

      {/* Drawer Content */}
      <div
        id={`drawer-content-${id}`}
        aria-hidden={!isExpanded}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          "bg-primary/5 border-x border-b border-primary/30 rounded-b-[10px]",
          isExpanded
            ? "max-h-[2000px] opacity-100 p-6 md:p-6 p-5"
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
  <div className="flex flex-col gap-3">{children}</div>
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

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center py-2.5 border-b border-white/5 last:border-b-0 gap-1 md:gap-0">
      <div className="text-sm font-medium text-slate-300 md:min-w-[200px]">{label}</div>
      <div className="text-sm font-semibold text-white md:text-right">{displayValue}</div>
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
      "w-4 h-4 flex-shrink-0 flex items-center justify-center",
      available ? "text-green-500" : "text-red-500"
    )}>
      {available ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      )}
    </div>
    <span className={cn(
      "text-sm font-medium",
      available ? "text-slate-200" : "text-slate-500"
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
    <h4 className="text-[13px] font-bold text-primary uppercase tracking-[0.05em] mb-3">
      {title}
    </h4>
    {children}
  </div>
);

export default SpecsDrawer;
