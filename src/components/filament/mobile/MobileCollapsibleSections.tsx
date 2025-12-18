import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MobileSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: string | number;
  highlight?: boolean;
  content: React.ReactNode;
}

interface MobileCollapsibleSectionsProps {
  sections: MobileSection[];
  defaultOpenId?: string;
  className?: string;
}

const MobileCollapsibleSections: React.FC<MobileCollapsibleSectionsProps> = ({
  sections,
  defaultOpenId,
  className
}) => {
  const [openSectionId, setOpenSectionId] = useState<string | null>(defaultOpenId || null);

  const toggleSection = (id: string) => {
    setOpenSectionId(prev => prev === id ? null : id);
  };

  return (
    <div className={cn("bg-background", className)}>
      {sections.map((section) => {
        const isOpen = openSectionId === section.id;
        
        return (
          <div 
            key={section.id}
            className="border-b border-border/30 last:border-b-0"
          >
            <button
              onClick={() => toggleSection(section.id)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-4",
                "transition-all duration-200",
                "active:bg-secondary/50",
                isOpen && "bg-primary/5 border-l-[3px] border-l-primary",
                !isOpen && "border-l-[3px] border-l-transparent"
              )}
              aria-expanded={isOpen}
              aria-controls={`section-content-${section.id}`}
            >
              {/* Icon */}
              <div 
                className={cn(
                  "flex items-center justify-center w-9 h-9 rounded-lg",
                  section.highlight 
                    ? "bg-amber-500/10 text-amber-500" 
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {section.icon}
              </div>
              
              {/* Title */}
              <span className="flex-1 text-[15px] font-semibold text-foreground text-left">
                {section.title}
              </span>
              
              {/* Badge */}
              {section.badge && (
                <span 
                  className={cn(
                    "px-2.5 py-1 rounded-full text-xs font-bold",
                    section.highlight 
                      ? "bg-amber-500/15 text-amber-500" 
                      : "bg-secondary text-muted-foreground"
                  )}
                >
                  {section.badge}
                </span>
              )}
              
              {/* Chevron */}
              <div 
                className={cn(
                  "flex items-center text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-90"
                )}
              >
                <ChevronRight size={20} />
              </div>
            </button>
            
            {/* Content */}
            <div 
              id={`section-content-${section.id}`}
              className={cn(
                "overflow-hidden transition-all duration-300",
                isOpen ? "max-h-[2000px]" : "max-h-0"
              )}
            >
              <div className="px-4 pb-4">
                {section.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default MobileCollapsibleSections;
