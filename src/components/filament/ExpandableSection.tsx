import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExpandableSectionProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: string | number;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  onToggle?: (id: string, isExpanded: boolean) => void;
  className?: string;
}

export function ExpandableSection({
  id,
  title,
  icon,
  badge,
  defaultExpanded = false,
  children,
  onToggle,
  className
}: ExpandableSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [contentHeight, setContentHeight] = useState<number>(defaultExpanded ? 1000 : 0);
  const contentRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  // Measure content height
  const measureHeight = useCallback(() => {
    if (contentRef.current) {
      const height = contentRef.current.scrollHeight;
      setContentHeight(height);
    }
  }, []);

  // Update height when expanded state changes
  useEffect(() => {
    if (isExpanded) {
      measureHeight();
    }
  }, [isExpanded, measureHeight]);

  // ResizeObserver for dynamic content
  useEffect(() => {
    if (!isExpanded || !contentRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      measureHeight();
    });
    
    resizeObserver.observe(contentRef.current);
    return () => resizeObserver.disconnect();
  }, [isExpanded, measureHeight]);

  // Skip animation on initial mount if defaultExpanded
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (defaultExpanded && contentRef.current) {
        setContentHeight(contentRef.current.scrollHeight);
      }
    }
  }, [defaultExpanded]);

  const handleToggle = () => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    onToggle?.(id, newState);
    
    // Track section toggle for analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', newState ? 'section_expand' : 'section_collapse', {
        section_id: id
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div 
      className={cn(
        "border rounded-2xl overflow-hidden transition-all duration-300",
        isExpanded 
          ? "border-primary/20 bg-primary/[0.02]" 
          : "border-white/[0.08] bg-white/[0.01]",
        "hover:border-white/15 hover:bg-white/[0.02]",
        isExpanded && "hover:border-primary/30 hover:bg-primary/[0.03]",
        className
      )}
    >
      {/* Header */}
      <div
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-controls={`section-content-${id}`}
        className={cn(
          "flex items-center justify-between",
          "px-6 py-[18px] cursor-pointer",
          "transition-colors duration-200",
          "hover:bg-white/[0.02]",
          "focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-[-2px] focus-visible:rounded-2xl",
          "max-[600px]:px-[18px] max-[600px]:py-4"
        )}
      >
        <div className="flex items-center gap-3.5">
          {/* Icon */}
          <div className={cn(
            "flex items-center justify-center",
            "w-10 h-10 rounded-[10px]",
            "text-lg transition-all duration-300",
            isExpanded 
              ? "bg-primary/15 text-primary" 
              : "bg-white/5 text-muted-foreground",
            "max-[600px]:w-9 max-[600px]:h-9 max-[600px]:text-base"
          )}>
            {icon}
          </div>
          
          {/* Title */}
          <span className="text-base font-bold text-foreground max-[600px]:text-[15px]">
            {title}
          </span>
          
          {/* Badge */}
          {badge && (
            <span className={cn(
              "px-2.5 py-1 rounded-full",
              "bg-violet-500/15 text-violet-400",
              "text-xs font-bold",
              "max-[600px]:px-2 max-[600px]:py-0.5 max-[600px]:text-[11px]"
            )}>
              {badge}
            </span>
          )}
        </div>
        
        {/* Expand Icon */}
        <div className={cn(
          "flex items-center justify-center",
          "w-8 h-8 rounded-lg",
          "bg-white/5",
          "transition-all duration-300",
          isExpanded ? "text-primary" : "text-muted-foreground"
        )}>
          <ChevronDown 
            size={20} 
            className={cn(
              "transition-transform duration-300",
              isExpanded && "rotate-180"
            )}
          />
        </div>
      </div>
      
      {/* Content */}
      <div
        id={`section-content-${id}`}
        aria-hidden={!isExpanded}
        style={{ 
          height: isExpanded ? `${contentHeight}px` : '0px',
          opacity: isExpanded ? 1 : 0
        }}
        className={cn(
          "overflow-hidden transition-all duration-300 ease-out",
          "motion-reduce:transition-none"
        )}
      >
        <div ref={contentRef} className="px-6 pb-6 max-[600px]:px-[18px] max-[600px]:pb-[18px]">
          {children}
        </div>
      </div>
    </div>
  );
}
