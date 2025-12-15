import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Check, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { parseSettings, getSettingLabel, getSettingUnit, type ParsedSettings } from '@/lib/settingsParser';
import { cn } from '@/lib/utils';

interface ImportSettingsModalProps {
  onImport: (settings: ParsedSettings) => void;
  trigger?: React.ReactNode;
}

export function ImportSettingsModal({ onImport, trigger }: ImportSettingsModalProps) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [parsing, setParsing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    settings: ParsedSettings;
    warnings: string[];
    errors: string[];
  } | null>(null);

  const handleParse = () => {
    setParsing(true);
    
    // Small delay for UX
    setTimeout(() => {
      const parsed = parseSettings(input);
      setResult(parsed);
      setParsing(false);
    }, 300);
  };

  const handleApply = () => {
    if (result?.success) {
      onImport(result.settings);
      setOpen(false);
      setInput('');
      setResult(null);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setInput('');
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); else setOpen(true); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Upload className="h-4 w-4" />
            <span className="hidden sm:inline">Import</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Import Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Paste settings from another source. Supports JSON, Markdown tables, or plain text.
          </p>

          <Textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setResult(null);
            }}
            placeholder={`Paste your settings here...

Examples:
• JSON: {"nozzle_temp": 210, "bed_temp": 60}
• Markdown: | Nozzle | 210°C |
• Plain text: Nozzle: 210, Bed: 60`}
            className="min-h-[150px] font-mono text-sm"
          />

          {!result && (
            <Button
              onClick={handleParse}
              disabled={!input.trim() || parsing}
              className="w-full"
            >
              {parsing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Parsing...
                </>
              ) : (
                'Parse Settings'
              )}
            </Button>
          )}

          {result && (
            <div className={cn(
              'rounded-lg border p-4 space-y-3',
              result.success ? 'border-green-500/30 bg-green-500/5' : 'border-destructive/30 bg-destructive/5'
            )}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <Check className="h-5 w-5 text-green-500" />
                    <span className="font-medium text-green-500">Parsed successfully!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span className="font-medium text-destructive">Could not parse settings</span>
                  </>
                )}
              </div>

              {result.success && (
                <div className="space-y-2">
                  {(Object.entries(result.settings) as [keyof ParsedSettings, number][]).map(([key, value]) => {
                    const hasWarning = result.warnings.some(w => w.toLowerCase().includes(key.toLowerCase()));
                    return (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{getSettingLabel(key)}</span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            'font-medium',
                            hasWarning ? 'text-amber-500' : 'text-foreground'
                          )}>
                            {value}{getSettingUnit(key)}
                          </span>
                          {hasWarning ? (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          ) : (
                            <Check className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-border/50">
                  {result.warnings.map((warning, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-amber-500">
                      <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.errors.length > 0 && (
                <div className="space-y-1">
                  {result.errors.map((error, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-destructive">
                      <XCircle className="h-3 w-3 mt-0.5 shrink-0" />
                      <span>{error}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.success && (
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleApply} className="flex-1">
                    Apply Settings
                  </Button>
                  <Button variant="outline" onClick={() => setResult(null)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
