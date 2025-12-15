import { Lightbulb } from 'lucide-react';

interface PerformanceInsightsProps {
  insights: string[];
}

export function PerformanceInsights({ insights }: PerformanceInsightsProps) {
  if (!insights.length) return null;

  return (
    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-amber-500" />
        <h4 className="font-semibold text-amber-400">Performance Insights</h4>
      </div>
      
      <ul className="space-y-2">
        {insights.map((insight, index) => (
          <li 
            key={index}
            className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed"
          >
            <span className="text-amber-500 mt-0.5">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
