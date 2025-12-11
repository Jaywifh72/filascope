import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Package, Database, Wrench, Square, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthMetrics {
  filaments: { total: number; score: number };
  printers: { total: number; score: number };
  hotends: { total: number; score: number };
  buildPlates: { total: number; score: number };
  overallScore: number;
}

interface HealthScoreWidgetProps {
  metrics: HealthMetrics | null;
  loading: boolean;
}

export function HealthScoreWidget({ metrics, loading }: HealthScoreWidgetProps) {
  if (loading || !metrics) {
    return (
      <Card className="p-6 bg-card border-border">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4"></div>
          <div className="h-24 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  const categories = [
    { name: "Filaments", icon: Package, score: metrics.filaments.score, total: metrics.filaments.total },
    { name: "Printers", icon: Database, score: metrics.printers.score, total: metrics.printers.total },
    { name: "Hotends", icon: Wrench, score: metrics.hotends.score, total: metrics.hotends.total },
    { name: "Build Plates", icon: Square, score: metrics.buildPlates.score, total: metrics.buildPlates.total },
  ];

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">Database Health</h3>
      </div>
      
      {/* Overall Score */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-32 h-32">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-muted"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={`${metrics.overallScore * 3.52} 352`}
              className={getScoreColor(metrics.overallScore)}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("text-3xl font-bold", getScoreColor(metrics.overallScore))}>
              {metrics.overallScore}%
            </span>
            <span className="text-xs text-muted-foreground">Overall</span>
          </div>
        </div>
      </div>

      {/* Category Scores */}
      <div className="grid grid-cols-2 gap-4">
        {categories.map((cat) => (
          <div key={cat.name} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <cat.icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-foreground">{cat.name}</span>
              </div>
              <span className={cn("text-sm font-medium", getScoreColor(cat.score))}>
                {cat.score}%
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all", getProgressColor(cat.score))}
                style={{ width: `${cat.score}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{cat.total} items</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
