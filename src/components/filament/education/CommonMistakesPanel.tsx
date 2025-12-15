import { getMistakesForMaterial, SEVERITY_CONFIG, CommonMistake } from '@/lib/commonMistakes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, XCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CommonMistakesPanelProps {
  material: string;
  className?: string;
  compact?: boolean;
  maxItems?: number;
}

export function CommonMistakesPanel({ 
  material, 
  className,
  compact = false,
  maxItems = 5
}: CommonMistakesPanelProps) {
  const mistakes = getMistakesForMaterial(material);
  const [isExpanded, setIsExpanded] = useState(false);

  if (mistakes.length === 0) {
    return null;
  }

  const displayedMistakes = compact && !isExpanded 
    ? mistakes.slice(0, maxItems) 
    : mistakes;

  const hasMore = compact && mistakes.length > maxItems;

  const getSeverityIcon = (severity: CommonMistake['severity']) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-400" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-400" />;
    }
  };

  return (
    <Card className={cn('bg-card/50', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
          Common Mistakes with {material}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedMistakes.map((mistake) => {
            const severityConfig = SEVERITY_CONFIG[mistake.severity];
            
            return (
              <div 
                key={mistake.id}
                className={cn(
                  'p-3 rounded-lg border',
                  severityConfig.bg,
                  severityConfig.border
                )}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 shrink-0">
                    {getSeverityIcon(mistake.severity)}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium text-sm">
                        ❌ {mistake.mistake}
                      </p>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded', severityConfig.color, severityConfig.bg)}>
                        {severityConfig.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {mistake.consequence}
                    </p>
                    <div className="flex items-start gap-1.5 pt-1">
                      <CheckCircle className="h-3 w-3 text-green-400 mt-0.5 shrink-0" />
                      <p className="text-xs text-green-400">
                        <span className="font-medium">Fix:</span> {mistake.fix}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-3"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show {mistakes.length - maxItems} More Mistakes
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// Inline warning component for use in settings
export function MistakeWarning({ mistake }: { mistake: CommonMistake }) {
  const severityConfig = SEVERITY_CONFIG[mistake.severity];
  
  return (
    <div className={cn(
      'text-xs p-2 rounded border flex items-start gap-2',
      severityConfig.bg,
      severityConfig.border
    )}>
      <AlertTriangle className={cn('h-3 w-3 shrink-0 mt-0.5', severityConfig.color)} />
      <div>
        <span className="font-medium">{mistake.mistake}</span>
        <span className="text-muted-foreground"> — {mistake.fix}</span>
      </div>
    </div>
  );
}
