import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import type { ImportProgress } from '@/types/priceImport';

interface ImportProgressBarProps {
  progress: ImportProgress;
}

export function ImportProgressBar({ progress }: ImportProgressBarProps) {
  const { current, total, status, message } = progress;
  
  if (status === 'idle') return null;

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          {status === 'processing' && (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          )}
          {status === 'completed' && (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
          {status === 'error' && (
            <XCircle className="w-5 h-5 text-destructive" />
          )}
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                {status === 'processing' && `Processing ${current.toLocaleString()} of ${total.toLocaleString()}...`}
                {status === 'completed' && 'Import completed'}
                {status === 'error' && 'Import failed'}
              </span>
              <span className="text-sm text-muted-foreground">{percentage}%</span>
            </div>
            
            <Progress 
              value={percentage} 
              className={status === 'error' ? 'bg-destructive/20' : undefined}
            />
            
            {message && (
              <p className="text-xs text-muted-foreground mt-2">{message}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
