import { type ChartAnnotation as ChartAnnotationType } from '@/lib/performanceProfileService';
import { cn } from '@/lib/utils';

interface ChartAnnotationProps {
  annotations: ChartAnnotationType[];
  className?: string;
}

export function ChartAnnotations({ annotations, className }: ChartAnnotationProps) {
  if (!annotations.length) return null;

  return (
    <div className={cn("hidden lg:block", className)}>
      {annotations.map((annotation, index) => (
        <div
          key={index}
          className={cn(
            "absolute text-xs max-w-[140px] transition-opacity",
            annotation.position === 'top' && "top-4 left-1/2 -translate-x-1/2 text-center",
            annotation.position === 'left' && "left-0 top-1/2 -translate-y-1/2 text-left",
            annotation.position === 'right' && "right-0 top-1/2 -translate-y-1/2 text-right"
          )}
        >
          <p className="font-medium text-foreground/80 leading-tight">
            {annotation.text}
          </p>
          <p className="text-muted-foreground text-[10px] mt-0.5">
            {annotation.subtext}
          </p>
        </div>
      ))}
    </div>
  );
}

// Inline annotations component for simpler layout
export function InlineAnnotations({ annotations }: { annotations: ChartAnnotationType[] }) {
  if (!annotations.length) return null;

  return (
    <div className="hidden lg:flex flex-col gap-2 mt-3">
      {annotations.map((annotation, index) => (
        <div 
          key={index}
          className="flex items-center gap-2 text-xs"
        >
          <span className="text-primary">→</span>
          <span className="text-foreground/80">{annotation.text}</span>
          <span className="text-muted-foreground">{annotation.subtext}</span>
        </div>
      ))}
    </div>
  );
}
