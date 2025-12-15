import { useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { PRINTING_GLOSSARY, GLOSSARY_CATEGORIES, GlossaryTerm as GlossaryTermType } from '@/lib/printingGlossary';
import { BookOpen, ExternalLink } from 'lucide-react';
import { useAchievements } from '@/hooks/useAchievements';
import { cn } from '@/lib/utils';

interface GlossaryTermProps {
  termId: string;
  children?: React.ReactNode;
  className?: string;
}

export function GlossaryTerm({ termId, children, className }: GlossaryTermProps) {
  const term = PRINTING_GLOSSARY[termId];
  const { incrementStat } = useAchievements();
  const [hasTracked, setHasTracked] = useState(false);

  if (!term) {
    return <span>{children}</span>;
  }

  const category = GLOSSARY_CATEGORIES[term.category];

  const handleOpen = () => {
    if (!hasTracked) {
      incrementStat('glossary_lookups');
      setHasTracked(true);
    }
  };

  return (
    <HoverCard onOpenChange={(open) => open && handleOpen()}>
      <HoverCardTrigger asChild>
        <span
          className={cn(
            'border-b border-dashed border-primary/50 cursor-help hover:border-primary transition-colors',
            className
          )}
        >
          {children || term.title}
        </span>
      </HoverCardTrigger>
      <HoverCardContent className="w-80" align="start">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <h4 className="font-semibold text-sm">{term.title}</h4>
            </div>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {category.icon} {category.label}
            </span>
          </div>
          
          <p className="text-sm text-muted-foreground leading-relaxed">
            {term.description}
          </p>

          {term.relatedTerms && term.relatedTerms.length > 0 && (
            <div className="pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground mb-1">Related terms:</p>
              <div className="flex flex-wrap gap-1">
                {term.relatedTerms.map(relatedId => {
                  const relatedTerm = PRINTING_GLOSSARY[relatedId];
                  return relatedTerm ? (
                    <span
                      key={relatedId}
                      className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                    >
                      {relatedTerm.title}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {term.learnMoreUrl && (
            <a
              href={term.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
            >
              Learn more about {term.title.toLowerCase()}
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// Helper component for inline usage
export function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  return <GlossaryTerm termId={id}>{children}</GlossaryTerm>;
}
