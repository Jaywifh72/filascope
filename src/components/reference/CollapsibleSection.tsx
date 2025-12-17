import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
  id?: string;
}

export function CollapsibleSection({ 
  title, 
  subtitle, 
  defaultExpanded = true, 
  children,
  className,
  id 
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <section id={id} className={cn('max-w-[1400px] mx-auto px-10 py-[60px] max-md:px-5 max-md:py-10', className)}>
      <div 
        className="flex items-start justify-between mb-6 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div>
          <h2 className="text-xl font-bold text-foreground max-md:text-lg">{title}</h2>
          {subtitle && (
            <p className="text-[15px] font-medium text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>

        <button
          className={cn(
            'bg-transparent border-none text-muted-foreground text-sm font-semibold',
            'inline-flex items-center gap-2 transition-colors hover:text-primary'
          )}
        >
          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
          <ChevronDown 
            size={16} 
            className={cn(
              'transition-transform duration-200',
              !isExpanded && '-rotate-90'
            )}
          />
        </button>
      </div>

      <div className={cn(
        'grid transition-all duration-300 ease-out',
        isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
      )}>
        <div className="overflow-hidden">
          {children}
        </div>
      </div>
    </section>
  );
}
