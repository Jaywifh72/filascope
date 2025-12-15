import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, Printer, ArrowRight, Trash2, RotateCcw, GitCompare } from 'lucide-react';
import { format } from 'date-fns';
import { useSettingsHistory } from '@/hooks/useSettingsHistory';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface SettingsHistoryModalProps {
  filamentId: string;
  filamentName: string;
  onRestore: (settings: {
    nozzleTemp: number;
    bedTemp: number;
    printSpeed?: number;
    cooling?: number;
  }) => void;
  trigger?: React.ReactNode;
}

export function SettingsHistoryModal({ 
  filamentId, 
  filamentName, 
  onRestore,
  trigger 
}: SettingsHistoryModalProps) {
  const [open, setOpen] = useState(false);
  const [comparing, setComparing] = useState<[string, string] | null>(null);
  const { history, isLoading, deleteEntry } = useSettingsHistory(filamentId);

  const handleRestore = (settings: {
    nozzleTemp: number;
    bedTemp: number;
    printSpeed?: number;
    cooling?: number;
  }) => {
    onRestore(settings);
    setOpen(false);
  };

  const handleCompare = (id1: string, id2: string) => {
    setComparing([id1, id2]);
  };

  const entry1 = comparing ? history.find(h => h.id === comparing[0]) : null;
  const entry2 = comparing ? history.find(h => h.id === comparing[1]) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Settings History
          </DialogTitle>
        </DialogHeader>

        {comparing && entry1 && entry2 ? (
          <div className="space-y-4 py-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setComparing(null)}
              className="gap-2"
            >
              <ArrowRight className="h-4 w-4 rotate-180" />
              Back to history
            </Button>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="font-medium text-muted-foreground">Setting</div>
              <div className="text-center font-medium">
                {format(new Date(entry1.created_at), 'MMM d')}
              </div>
              <div className="text-center font-medium">
                {format(new Date(entry2.created_at), 'MMM d')}
              </div>

              <div>Nozzle Temp</div>
              <div className="text-center">{entry1.settings.nozzleTemp}°C</div>
              <div className={cn(
                'text-center',
                entry2.settings.nozzleTemp !== entry1.settings.nozzleTemp && 'text-primary font-medium'
              )}>
                {entry2.settings.nozzleTemp}°C
                {entry2.settings.nozzleTemp !== entry1.settings.nozzleTemp && (
                  <span className="text-xs ml-1">
                    ({entry2.settings.nozzleTemp > entry1.settings.nozzleTemp ? '+' : ''}
                    {entry2.settings.nozzleTemp - entry1.settings.nozzleTemp}°)
                  </span>
                )}
              </div>

              <div>Bed Temp</div>
              <div className="text-center">{entry1.settings.bedTemp}°C</div>
              <div className={cn(
                'text-center',
                entry2.settings.bedTemp !== entry1.settings.bedTemp && 'text-primary font-medium'
              )}>
                {entry2.settings.bedTemp}°C
                {entry2.settings.bedTemp !== entry1.settings.bedTemp && (
                  <span className="text-xs ml-1">
                    ({entry2.settings.bedTemp > entry1.settings.bedTemp ? '+' : ''}
                    {entry2.settings.bedTemp - entry1.settings.bedTemp}°)
                  </span>
                )}
              </div>

              {(entry1.settings.printSpeed || entry2.settings.printSpeed) && (
                <>
                  <div>Print Speed</div>
                  <div className="text-center">{entry1.settings.printSpeed || '—'} mm/s</div>
                  <div className={cn(
                    'text-center',
                    entry2.settings.printSpeed !== entry1.settings.printSpeed && 'text-primary font-medium'
                  )}>
                    {entry2.settings.printSpeed || '—'} mm/s
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px] pr-4">
            <div className="space-y-3 py-4">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No settings history yet</p>
                  <p className="text-sm">Your saved settings will appear here</p>
                </div>
              ) : (
                history.map((entry, index) => (
                  <div
                    key={entry.id}
                    className={cn(
                      'rounded-lg border p-4 space-y-2',
                      index === 0 && 'border-primary/30 bg-primary/5'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {format(new Date(entry.created_at), 'MMM d, yyyy')}
                        </span>
                        {index === 0 && (
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            Current
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(entry.created_at), 'h:mm a')}
                      </span>
                    </div>

                    {entry.printer_id && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Printer className="h-4 w-4" />
                        {entry.printer_id}
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <span>Nozzle: <strong>{entry.settings.nozzleTemp}°C</strong></span>
                      <span>Bed: <strong>{entry.settings.bedTemp}°C</strong></span>
                      {entry.settings.printSpeed && (
                        <span>Speed: <strong>{entry.settings.printSpeed} mm/s</strong></span>
                      )}
                    </div>

                    {entry.notes && (
                      <p className="text-sm text-muted-foreground italic">
                        "{entry.notes}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRestore(entry.settings)}
                        className="gap-1"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Use These
                      </Button>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompare(history[0].id, entry.id)}
                          className="gap-1"
                        >
                          <GitCompare className="h-3 w-3" />
                          Compare
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry.mutate(entry.id)}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}
