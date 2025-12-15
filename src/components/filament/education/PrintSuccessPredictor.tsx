import { Printer, CheckCircle, AlertTriangle, XCircle, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePrinterSelection } from '@/hooks/usePrinterSelection';
import { checkPrinterFilamentCompatibility } from '@/lib/printerCompatibility';
import { calculatePrintSuccess } from '@/lib/scoreEducation';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type Filament = Database['public']['Tables']['filaments']['Row'];

interface PrintSuccessPredictorProps {
  filament: Filament;
  easeScore: number | null;
  strengthScore: number | null;
  valueScore: number | null;
}

export function PrintSuccessPredictor({ 
  filament, 
  easeScore, 
  strengthScore, 
  valueScore 
}: PrintSuccessPredictorProps) {
  const { selectedPrinter, selectedPrinterId } = usePrinterSelection();
  
  // Calculate printer compatibility if printer is selected
  const printerCompatibility = selectedPrinter 
    ? checkPrinterFilamentCompatibility(selectedPrinter, filament)
    : null;
  
  // Get success prediction
  const prediction = calculatePrintSuccess(
    easeScore,
    strengthScore,
    valueScore,
    printerCompatibility ? {
      is_supported: printerCompatibility.is_supported,
      ease_rating: printerCompatibility.ease_rating,
      warnings: printerCompatibility.recommendations.warnings,
    } : null
  );
  
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-cyan-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };
  
  const getBarColor = (score: number) => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-cyan-500';
    if (score >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };
  
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 50) return 'Moderate';
    return 'Challenging';
  };
  
  return (
    <div className="bg-muted/30 rounded-xl p-4 border border-border">
      <div className="flex items-center gap-2 mb-4">
        <Printer className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-semibold text-foreground">Print Success Predictor</h3>
      </div>
      
      {/* Overall Success */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-muted-foreground">Overall Likelihood</span>
          <span className={cn("text-lg font-bold tabular-nums", getScoreColor(prediction.overall))}>
            {prediction.overall}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className={cn("h-full rounded-full transition-all duration-500", getBarColor(prediction.overall))}
            style={{ width: `${prediction.overall}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {getScoreLabel(prediction.overall)} chance of successful prints
        </p>
      </div>
      
      {/* With Printer */}
      {selectedPrinter && prediction.withPrinter !== null ? (
        <div className="bg-background/50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-foreground font-medium">
              With {selectedPrinter.model_name}
            </span>
            <span className={cn("text-lg font-bold tabular-nums", getScoreColor(prediction.withPrinter))}>
              {prediction.withPrinter}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn("h-full rounded-full transition-all duration-500", getBarColor(prediction.withPrinter))}
              style={{ width: `${prediction.withPrinter}%` }}
            />
          </div>
          {prediction.printerBonus && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {prediction.printerBonus}
            </p>
          )}
        </div>
      ) : (
        <Link 
          to="/finder"
          className="block bg-background/50 rounded-lg p-3 mb-4 text-center hover:bg-background transition-colors group"
        >
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground group-hover:text-foreground">
            <HelpCircle className="w-3.5 h-3.5" />
            Select a printer for personalized prediction
          </div>
        </Link>
      )}
      
      {/* Factors */}
      {prediction.factors.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Factors</p>
          {prediction.factors.map((factor, idx) => (
            <div key={idx} className="flex items-start gap-2">
              {factor.type === 'positive' && (
                <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0 mt-0.5" />
              )}
              {factor.type === 'warning' && (
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              {factor.type === 'negative' && (
                <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p className="text-xs text-muted-foreground">{factor.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
