import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, RefreshCw, ExternalLink, BarChart3 } from 'lucide-react';
import type { ImportResult } from '@/hooks/useCatalogSync';

interface Props {
  result: ImportResult;
  brandSlug: string;
  onReset: () => void;
}

export function ImportCompleteCard({ result, brandSlug, onReset }: Props) {
  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardContent className="pt-6 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="text-lg font-semibold">Import Complete</h3>
            <p className="text-sm text-muted-foreground">
              {result.imported} filament{result.imported !== 1 ? 's' : ''} imported
              {result.updatedPrices > 0 && `, ${result.updatedPrices} prices updated`}
            </p>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <MiniStat label="Imported" value={result.imported} icon={<CheckCircle2 className="w-3.5 h-3.5 text-green-500" />} />
          <MiniStat label="Price Updates" value={result.updatedPrices} icon={<BarChart3 className="w-3.5 h-3.5 text-blue-500" />} />
          <MiniStat label="Price History" value={result.priceHistoryCount} icon={<BarChart3 className="w-3.5 h-3.5 text-muted-foreground" />} />
          <MiniStat
            label="Avg Quality"
            value={`${result.avgQualityScore}%`}
            icon={
              result.avgQualityScore >= 70
                ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            }
          />
        </div>

        {/* Errors */}
        {result.errors > 0 && (
          <div className="flex items-center gap-2 p-2 rounded bg-red-500/10 border border-red-500/20">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-400">{result.errors} error{result.errors !== 1 ? 's' : ''} during import</span>
          </div>
        )}

        {/* Broken URLs */}
        {result.urlsBroken.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-amber-500">
              {result.urlsBroken.length} broken URL{result.urlsBroken.length !== 1 ? 's' : ''} detected:
            </p>
            <div className="max-h-[100px] overflow-y-auto text-xs text-muted-foreground">
              {result.urlsBroken.map((url, i) => (
                <div key={i} className="truncate">{url}</div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-border/50">
          <Button onClick={onReset} variant="outline" size="sm" className="gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Start New Scan
          </Button>
          {brandSlug && (
            <a
              href={`/brands/${brandSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline inline-flex items-center gap-1"
            >
              View Brand Page <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 rounded-md bg-muted/50">
      {icon}
      <div>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm font-bold">{value}</div>
      </div>
    </div>
  );
}
