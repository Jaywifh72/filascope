import { useMemo } from 'react';
import { BookOpen } from 'lucide-react';
import { generatePerformanceNarrative } from '@/lib/performanceProfileService';

interface PerformanceNarrativeProps {
  ease_of_printing_score: number | null;
  printability_index: number | null;
  strength_index: number | null;
  value_score: number | null;
  material: string | null;
  pricePerKg: number | null;
}

export function PerformanceNarrative({
  ease_of_printing_score,
  printability_index,
  strength_index,
  value_score,
  material,
  pricePerKg
}: PerformanceNarrativeProps) {
  const narrative = useMemo(() => {
    const scores = {
      ease_of_printing_score,
      printability_index,
      strength_index,
      value_score,
      material
    };
    
    return generatePerformanceNarrative(scores, pricePerKg);
  }, [ease_of_printing_score, printability_index, strength_index, value_score, material, pricePerKg]);

  if (!narrative) return null;

  // Parse markdown-style bold text
  const parseNarrative = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <span key={index} className="font-semibold text-primary">
            {part.slice(2, -2)}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          The Story
        </h4>
      </div>
      
      <p className="text-base leading-relaxed text-foreground/90">
        {parseNarrative(narrative)}
      </p>
    </div>
  );
}
