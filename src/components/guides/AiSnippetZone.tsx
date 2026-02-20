import { Zap } from 'lucide-react';

interface PickItem {
  name: string;
  brand: string;
  reason: string;
}

interface AiSnippetZoneProps {
  summaryText: string;
  topPick: PickItem;
  runnerUp: PickItem;
  budgetPick?: PickItem;
}

const picks: Array<{
  key: keyof Pick<AiSnippetZoneProps, 'topPick' | 'runnerUp' | 'budgetPick'>;
  emoji: string;
  label: string;
}> = [
  { key: 'topPick',   emoji: '🏆', label: 'Our top pick' },
  { key: 'runnerUp',  emoji: '🥈', label: 'Runner-up'    },
  { key: 'budgetPick',emoji: '💰', label: 'Budget pick'  },
];

export function AiSnippetZone({ summaryText, topPick, runnerUp, budgetPick }: AiSnippetZoneProps) {
  const pickData: Record<string, PickItem | undefined> = { topPick, runnerUp, budgetPick };

  return (
    <div role="region" aria-label="Quick answer summary" className="mb-8" data-ai-summary="true">
      <div className="rounded-lg border border-border bg-card/60 border-l-2 border-l-primary pl-0 overflow-hidden">
        <div className="pl-4 pr-5 py-4">
          {/* Header */}
          <header className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span className="text-primary text-xs font-semibold uppercase tracking-wider">
              Quick Answer
            </span>
          </header>

          {/* Summary paragraph */}
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {summaryText}
          </p>

          {/* Picks list */}
          <ul className="space-y-2" aria-label="Top picks">
            {picks.map(({ key, emoji, label }) => {
              const item = pickData[key];
              if (!item) return null;
              return (
                <li key={key} className="flex items-start gap-2 text-sm">
                  <span aria-hidden="true" className="shrink-0 mt-0.5">{emoji}</span>
                  <span className="text-muted-foreground">
                    <span className="font-medium text-foreground/70">{label}:</span>{' '}
                    <strong className="font-semibold text-foreground">{item.name}</strong>
                    {' '}by{' '}
                    <em className="not-italic text-foreground/80">{item.brand}</em>
                    {' — '}
                    {item.reason}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Screen-reader / AI-crawler hidden copy */}
      <p className="sr-only">
        Quick Answer: {summaryText} Top pick: {topPick.name} by {topPick.brand} — {topPick.reason}.
        Runner-up: {runnerUp.name} by {runnerUp.brand} — {runnerUp.reason}.
        {budgetPick && ` Budget pick: ${budgetPick.name} by ${budgetPick.brand} — ${budgetPick.reason}.`}
      </p>
    </div>
  );
}
