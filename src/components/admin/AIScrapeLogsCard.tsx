import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Bot, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronRight,
  Clock,
  Sparkles,
  Users,
  ListTodo
} from "lucide-react";
import { format } from "date-fns";
import { useAIScrapeLogs, ScrapeJobWithAI, AISummary } from "@/hooks/useAIScrapeLogs";

function HealthScoreBar({ score }: { score: number }) {
  const getColor = () => {
    if (score >= 80) return "bg-green-500";
    if (score >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Health:</span>
      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${getColor()} transition-all`} 
          style={{ width: `${score}%` }} 
        />
      </div>
      <span className="text-xs font-medium">{score}%</span>
    </div>
  );
}

function ScrapeLogEntry({ job }: { job: ScrapeJobWithAI }) {
  const [isOpen, setIsOpen] = useState(false);
  const aiSummary = job.ai_summary as AISummary | null;
  const hasAISummary = !!aiSummary?.summary;

  const statusIcon = job.status === 'completed' 
    ? <CheckCircle2 className="w-4 h-4 text-green-500" /> 
    : job.status === 'failed' 
      ? <XCircle className="w-4 h-4 text-red-500" />
      : <Clock className="w-4 h-4 text-yellow-500" />;

  const statusBadge = job.status === 'completed' 
    ? <Badge variant="secondary" className="bg-green-500/10 text-green-600 text-xs">Completed</Badge>
    : job.status === 'failed'
      ? <Badge variant="destructive" className="text-xs">Failed</Badge>
      : <Badge variant="secondary" className="text-xs">Running</Badge>;

  const materialsLabel = job.materials?.join(', ') || 'Unknown';
  const dateLabel = job.started_at 
    ? format(new Date(job.started_at), 'MMM d, yyyy h:mm a')
    : 'Unknown';

  // Fallback summary when AI hasn't processed the job yet
  const fallbackSummary = {
    headline: job.status === 'completed' 
      ? `Scrape completed for ${materialsLabel}`
      : job.status === 'failed'
        ? `Scrape failed: ${job.error || 'Unknown error'}`
        : 'Scrape in progress...',
    whatWentRight: job.results?.filamentsCreated 
      ? [`${job.results.filamentsCreated} filaments created`, `${job.results.filamentsUpdated || 0} filaments updated`]
      : [],
    whatWentWrong: job.results?.errors?.slice(0, 3) || (job.error ? [job.error] : []),
    userImpact: job.status === 'completed' 
      ? 'Product data has been updated with the latest information.'
      : job.status === 'failed'
        ? 'Some product data may be outdated until the next successful scrape.'
        : 'Updates in progress...',
    actionsNeeded: job.status === 'failed' ? ['Retry the scrape or investigate the error'] : [],
    healthScore: job.status === 'completed' 
      ? (job.results?.errors?.length ? 70 : 100)
      : job.status === 'failed' ? 20 : 50,
  };

  const summary = hasAISummary ? aiSummary.summary : fallbackSummary;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="border rounded-lg p-3 cursor-pointer hover:bg-accent/50 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {statusIcon}
              <span className="text-sm font-medium">{materialsLabel}</span>
              {job.dry_run && (
                <Badge variant="outline" className="text-xs">Dry Run</Badge>
              )}
              {hasAISummary && (
                <Sparkles className="w-3 h-3 text-primary" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {statusBadge}
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{dateLabel}</p>
          <p className="text-sm mt-2 line-clamp-1">{summary.headline}</p>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="border border-t-0 rounded-b-lg p-4 space-y-4 bg-card/50">
          {/* Headline */}
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1">
              🎯 Summary
            </h4>
            <p className="text-sm text-muted-foreground mt-1">{summary.headline}</p>
          </div>

          {/* What went right */}
          {summary.whatWentRight.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-1 text-green-600">
                <CheckCircle2 className="w-3 h-3" /> What went right
              </h4>
              <ul className="mt-1 space-y-1">
                {summary.whatWentRight.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-green-500">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* What went wrong */}
          {summary.whatWentWrong.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-1 text-yellow-600">
                <AlertTriangle className="w-3 h-3" /> What went wrong
              </h4>
              <ul className="mt-1 space-y-1">
                {summary.whatWentWrong.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-yellow-500">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* User Impact */}
          <div>
            <h4 className="text-sm font-semibold flex items-center gap-1">
              <Users className="w-3 h-3" /> User Impact
            </h4>
            <p className="text-sm text-muted-foreground mt-1">{summary.userImpact}</p>
          </div>

          {/* Actions Needed */}
          {summary.actionsNeeded.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold flex items-center gap-1 text-primary">
                <ListTodo className="w-3 h-3" /> Actions Needed
              </h4>
              <ul className="mt-1 space-y-1">
                {summary.actionsNeeded.map((item, idx) => (
                  <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">•</span> {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Health Score */}
          <HealthScoreBar score={summary.healthScore} />

          {/* AI Generation Info */}
          {hasAISummary && (
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Generated by {aiSummary.model} at {format(new Date(aiSummary.generatedAt), 'h:mm a')}
            </p>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AIScrapeLogsCard() {
  const { data: jobs, isLoading, refetch, isRefetching } = useAIScrapeLogs(15);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI Scrape Logs
        </CardTitle>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No scrape jobs found. Run a scrape to see AI-generated summaries.
          </p>
        ) : (
          <ScrollArea className="h-[500px] pr-4">
            <div className="space-y-3">
              {jobs.map((job) => (
                <ScrapeLogEntry key={job.id} job={job} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
