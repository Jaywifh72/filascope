import { X, Check, Info, RotateCcw, ArrowRight, ExternalLink, GitCompare } from 'lucide-react';
import { PrinterQuizEmptyState } from '@/components/empty-states';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuizResults, ScoredPrinter } from '@/lib/printerQuizService';
import { getPrinterImage } from '@/lib/printerCardUtils';
import { usePrinterQuizAnalytics } from '@/hooks/usePrinterQuizAnalytics';
import { toast } from 'sonner';

interface PrinterQuizResultsProps {
  results: QuizResults;
  onClose: () => void;
  onRetake: () => void;
  onAddToCompare?: (printerId: string) => void;
}

const PrinterQuizResults = ({ results, onClose, onRetake, onAddToCompare }: PrinterQuizResultsProps) => {
  const navigate = useNavigate();
  const analytics = usePrinterQuizAnalytics();
  const { topPrinters, totalMatches } = results;

  const handleViewDetails = (printer: ScoredPrinter, rank: number) => {
    analytics.trackRecommendationClicked(printer.printer.id, printer.printer.model_name || '', rank, 'view_details');
    onClose();
    navigate(`/printers/${printer.printer.printer_id || printer.printer.id}`);
  };

  const handleAddToCompare = (printer: ScoredPrinter, rank: number) => {
    if (onAddToCompare) {
      analytics.trackRecommendationClicked(printer.printer.id, printer.printer.model_name || '', rank, 'add_to_compare');
      onAddToCompare(printer.printer.id);
      toast.success(`${printer.printer.model_name} added to comparison`);
    }
  };

  const handleCompareAll = () => {
    if (onAddToCompare && topPrinters.length > 0) {
      const printerIds = topPrinters.map(p => p.printer.id);
      analytics.trackCompareAllClicked(printerIds);
      
      topPrinters.forEach(printer => {
        onAddToCompare(printer.printer.id);
      });
      
      toast.success(`Added ${topPrinters.length} printers to comparison`);
    }
  };

  const handleRetake = () => {
    analytics.trackQuizRetaken();
    onRetake();
  };

  const getRankLabel = (index: number) => {
    switch (index) {
      case 0: return '🏆 BEST MATCH';
      case 1: return 'RUNNER-UP';
      case 2: return 'ALTERNATIVE';
      default: return `#${index + 1}`;
    }
  };

  const getPrinterPrice = (printer: ScoredPrinter['printer']) => {
    return printer.current_price_usd_store ?? 
           printer.current_price_usd_amazon ?? 
           printer.msrp_usd ?? 
           null;
  };

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-start justify-center p-4 md:p-6 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="results-title"
    >
      <div 
        className="w-full max-w-[900px] my-4 md:my-8 bg-card border border-border rounded-2xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start px-5 md:px-8 py-5 md:py-6 border-b border-border">
          <div className="flex gap-4 md:gap-5 items-start">
            <span className="text-4xl md:text-5xl" aria-hidden="true">🎉</span>
            <div>
              <h2 id="results-title" className="text-xl md:text-[28px] font-bold text-foreground">
                We Found Your Perfect Printers!
              </h2>
              <p className="text-sm md:text-base text-muted-foreground mt-1">
                Based on your answers, here are your top {topPrinters.length} personalized matches from {totalMatches} options
              </p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-10 w-10 rounded-lg hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
            aria-label="Close results"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Results Body */}
        <div className="px-5 md:px-8 py-5 md:py-6 space-y-5 md:space-y-6">
          {topPrinters.map((scored, index) => (
            <RecommendationCard
              key={scored.printer.id}
              scored={scored}
              rank={index}
              rankLabel={getRankLabel(index)}
              price={getPrinterPrice(scored.printer)}
              onViewDetails={() => handleViewDetails(scored, index)}
              onAddToCompare={onAddToCompare ? () => handleAddToCompare(scored, index) : undefined}
            />
          ))}

          {topPrinters.length === 0 && (
            <PrinterQuizEmptyState onRetake={handleRetake} />
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center px-5 md:px-8 py-5 md:py-6 border-t border-border">
          <Button
            variant="ghost"
            onClick={handleRetake}
            className="h-12 px-6 font-semibold"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Retake Quiz
          </Button>

          {onAddToCompare && topPrinters.length > 1 && (
            <Button
              variant="outline"
              onClick={handleCompareAll}
              className="h-12 px-6 font-semibold border-primary/40 text-primary hover:bg-primary/10"
            >
              <GitCompare className="mr-2 h-4 w-4" />
              Compare All {topPrinters.length}
            </Button>
          )}
          
          <Button
            variant="outline"
            onClick={onClose}
            className="h-12 px-6 font-semibold"
          >
            Browse All Printers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

interface RecommendationCardProps {
  scored: ScoredPrinter;
  rank: number;
  rankLabel: string;
  price: number | null;
  onViewDetails: () => void;
  onAddToCompare?: () => void;
}

const RecommendationCard = ({ 
  scored, 
  rank, 
  rankLabel, 
  price,
  onViewDetails,
  onAddToCompare 
}: RecommendationCardProps) => {
  const { printer, matchPercentage, matchReasons, considerations } = scored;
  const isTopPick = rank === 0;
  const brandName = printer.brand?.brand || 'Unknown';
  const imageUrl = getPrinterImage(printer as any);

  return (
    <article 
      className={`
        rounded-2xl border-2 p-5 md:p-6 transition-all
        ${isTopPick 
          ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-primary/30' 
          : 'bg-muted/30 border-border'
        }
      `}
      aria-label={`Recommendation ${rank + 1}: ${printer.model_name}, ${matchPercentage}% match`}
    >
      {/* Rank Badge */}
      <div className={`
        inline-flex items-center justify-between w-full mb-4 md:mb-5 px-3 md:px-4 py-2 md:py-2.5 rounded-lg
        ${isTopPick 
          ? 'bg-primary/15 border border-primary/30' 
          : 'bg-muted/50 border border-border'
        }
      `}>
        <span className={`text-xs font-bold tracking-wider ${isTopPick ? 'text-primary' : 'text-muted-foreground'}`}>
          {rankLabel}
        </span>
        <span className="text-sm font-bold text-foreground">
          {matchPercentage}% Match
        </span>
      </div>

      {/* Printer Info */}
      <div className="flex flex-col sm:flex-row gap-4 md:gap-5 mb-5 md:mb-6">
        <div className="w-full sm:w-28 h-32 sm:h-28 rounded-xl bg-muted/50 border border-border p-3 flex-shrink-0 flex items-center justify-center">
          <img 
            src={imageUrl || '/placeholder.svg'} 
            alt={printer.model_name || 'Printer'} 
            width={112}
            height={112}
            className="max-w-full max-h-full object-contain"
            loading="lazy"
            decoding="async"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder.svg';
            }}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-primary uppercase tracking-wider">
            {brandName}
          </p>
          <h3 className="text-lg md:text-xl font-bold text-foreground mt-1 truncate">
            {printer.model_name || 'Unknown Model'}
          </h3>
          {price && (
            <p className="text-xl md:text-2xl font-bold text-foreground mt-2">
              ${price.toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {/* Match Reasons */}
      {matchReasons.length > 0 && (
        <div className="mb-4 md:mb-5 p-3 md:p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 md:mb-3">
            Why We Recommend
          </p>
          <div className="space-y-1.5 md:space-y-2">
            {matchReasons.map((reason, i) => (
              <div key={i} className="flex items-start gap-2 md:gap-2.5 text-sm text-foreground/90">
                <Check className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" strokeWidth={3} />
                <span>{reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Considerations */}
      {considerations.length > 0 && (
        <div className="mb-4 md:mb-5 p-3 md:p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-2 md:mb-3">
            Considerations
          </p>
          <div className="space-y-1.5 md:space-y-2">
            {considerations.map((consideration, i) => (
              <div key={i} className="flex items-start gap-2 md:gap-2.5 text-sm text-muted-foreground">
                <Info className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
                <span>{consideration}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={onViewDetails}
          className="flex-1 h-11 font-semibold"
        >
          View Full Details
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
        
        {onAddToCompare && (
          <Button
            variant="outline"
            onClick={onAddToCompare}
            className="flex-1 h-11 font-semibold border-primary/40 text-primary hover:bg-primary/10"
          >
            Add to Comparison
          </Button>
        )}
      </div>
    </article>
  );
};

export default PrinterQuizResults;
