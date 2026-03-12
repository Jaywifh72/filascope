import { Check, Search, GitCompare, Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Phase } from '@/hooks/useCatalogSync';

interface Props {
  phase: Phase;
  scanStats?: { discovered?: number; newCount?: number } | null;
  importStats?: { imported?: number } | null;
}

const STEPS = [
  {
    key: 'scan',
    label: 'Scan Store',
    icon: Search,
    tooltip: 'Discover all filament products from the brand\'s online store',
    phases: ['select', 'scanning', 'processing'] as Phase[],
  },
  {
    key: 'delta',
    label: 'Review Delta',
    icon: GitCompare,
    tooltip: 'Compare discovered products against the existing database to find new and changed items',
    phases: ['delta'] as Phase[],
  },
  {
    key: 'import',
    label: 'Import',
    icon: Download,
    tooltip: 'Create or update filament records in the database with all extracted data',
    phases: ['importing', 'complete'] as Phase[],
  },
] as const;

function getStepState(stepPhases: readonly Phase[], currentPhase: Phase) {
  const phaseOrder: Phase[] = ['select', 'scanning', 'processing', 'delta', 'importing', 'complete'];
  const currentIdx = phaseOrder.indexOf(currentPhase);

  // A step is complete if the current phase is past ALL of its phases
  const stepLastPhaseIdx = Math.max(...stepPhases.map(p => phaseOrder.indexOf(p)));
  const stepFirstPhaseIdx = Math.min(...stepPhases.map(p => phaseOrder.indexOf(p)));

  if (currentIdx > stepLastPhaseIdx) return 'complete';
  if (stepPhases.includes(currentPhase) || (currentIdx >= stepFirstPhaseIdx && currentIdx <= stepLastPhaseIdx)) return 'active';
  return 'pending';
}

export function PhaseStepperBar({ phase, scanStats, importStats }: Props) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-0 mb-6">
        {STEPS.map((step, idx) => {
          const state = getStepState(step.phases, phase);
          const Icon = step.icon;

          // Subtitle based on completion
          let subtitle = '';
          if (state === 'complete' && step.key === 'scan' && scanStats?.discovered) {
            subtitle = `${scanStats.discovered} found`;
          }
          if (state === 'complete' && step.key === 'delta' && scanStats?.newCount != null) {
            subtitle = `${scanStats.newCount} new`;
          }
          if (state === 'complete' && step.key === 'import' && importStats?.imported != null) {
            subtitle = `${importStats.imported} imported`;
          }

          return (
            <div key={step.key} className="flex items-center flex-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2.5">
                    {/* Circle */}
                    <div
                      className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-semibold transition-colors',
                        state === 'complete' && 'bg-green-500 border-green-500 text-white',
                        state === 'active' && 'bg-blue-500 border-blue-500 text-white',
                        state === 'pending' && 'bg-muted border-border text-muted-foreground',
                      )}
                    >
                      {state === 'complete' ? <Check className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>

                    {/* Label */}
                    <div className="flex flex-col">
                      <span
                        className={cn(
                          'text-sm font-medium',
                          state === 'active' && 'text-foreground',
                          state === 'complete' && 'text-green-600 dark:text-green-400',
                          state === 'pending' && 'text-muted-foreground',
                        )}
                      >
                        {step.label}
                      </span>
                      {subtitle && (
                        <span className="text-xs text-muted-foreground">{subtitle}</span>
                      )}
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="max-w-xs text-xs">{step.tooltip}</p>
                </TooltipContent>
              </Tooltip>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-4',
                    state === 'complete' ? 'bg-green-500' : 'bg-border',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
