import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Trophy, Lightbulb, Check, RefreshCw, Filter, AlertCircle, ArrowRight } from 'lucide-react';
import { useWizardRecommendations, type WizardAnswers } from '@/hooks/useWizardRecommendations';
import { WizardProductCard } from '@/components/wizard/WizardProductCard';
import { trackWizardComplete } from '@/lib/analytics';

interface WizardResultsProps {
  answers: WizardAnswers;
  onRefine: () => void;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {[0, 1, 2].map((i) => (
        <Card key={i} className="p-6">
          <div className="flex gap-6">
            <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-64" />
              <div className="flex gap-3 overflow-hidden">
                {[0, 1, 2].map((j) => (
                  <Skeleton key={j} className="w-[180px] h-[280px] rounded-xl flex-shrink-0" />
                ))}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function WizardResults({ answers, onRefine }: WizardResultsProps) {
  const navigate = useNavigate();
  const { results, isLoading, error } = useWizardRecommendations(answers);

  // Fire wizard_complete once results are loaded
  useEffect(() => {
    if (!isLoading && results.length > 0) {
      trackWizardComplete({
        topMaterial: results[0]?.material ?? '',
        useCase: answers.use_case as string | undefined,
        printer: answers.printer as string | undefined,
        priority: answers.priority as string | undefined,
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-6">
              <Trophy className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs uppercase tracking-wider text-primary">
                Finding Your Matches...
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">Analyzing Products</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Searching thousands of filaments to find your perfect match
            </p>
          </div>
          <LoadingSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">We couldn't load product recommendations right now.</p>
          <div className="flex gap-4 justify-center">
            <Button variant="outline" onClick={onRefine}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button onClick={() => navigate('/finder')}>
              <Filter className="mr-2 h-4 w-4" />
              Browse All Filaments
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Results Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/5 mb-6">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-mono text-xs uppercase tracking-wider text-primary">
              Top {results.length} Recommendations
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-3">Your Perfect Filaments</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Based on your answers, here are the best materials with real products and pricing
          </p>
        </div>

        {/* Recommendations */}
        <div className="space-y-6 mb-10">
          {results.map((rec, index) => (
            <Card
              key={rec.material}
              className={`p-6 transition-all duration-200 hover:shadow-lg ${
                index === 0 ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : ''
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start gap-6">
                {/* Match Badge */}
                <div className="flex-shrink-0">
                  <div className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center ${
                    index === 0
                      ? 'bg-gradient-to-br from-primary to-primary/70 text-background'
                      : 'bg-muted text-foreground'
                  }`}>
                    <span className="text-2xl font-bold">{rec.matchPercent}%</span>
                    <span className="text-[10px] uppercase tracking-wider opacity-80">Match</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        {index === 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                            Best Match
                          </span>
                        )}
                        <h3 className="text-xl font-bold">{rec.material}</h3>
                      </div>
                      <p className="text-muted-foreground text-sm">{rec.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-medium">{rec.formattedPriceRange}</div>
                      <div className={`text-xs ${
                        rec.difficulty === 'Easy' ? 'text-emerald-400' :
                        rec.difficulty === 'Moderate' ? 'text-yellow-400' : 'text-orange-400'
                      }`}>
                        {rec.difficulty} to print
                      </div>
                    </div>
                  </div>

                  {/* Why Recommended */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Why we recommend this</span>
                    </div>
                    <ul className="space-y-1">
                      {rec.whyRecommended.map((reason, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Check className="h-3 w-3 text-primary flex-shrink-0" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Product Cards Row */}
                  {rec.products.length > 0 ? (
                    <div className="relative -mx-2">
                      <div className="flex gap-3 overflow-x-auto pb-2 px-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
                        {rec.products.map((product) => (
                          <WizardProductCard key={product.id} product={product} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center">
                      <p className="text-sm text-muted-foreground">
                        No products currently available for {rec.material} in your budget range.
                      </p>
                    </div>
                  )}

                  {/* Browse more link */}
                  <div className="mt-3">
                    <Button variant="ghost" size="sm" asChild className="text-xs text-muted-foreground hover:text-primary gap-1 h-7 px-2">
                      <Link to={rec.finderUrl}>
                        Browse all {rec.material} filaments
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={onRefine}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Refine Results
          </Button>
          <Button
            onClick={() => navigate('/finder')}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Browse All Filaments
          </Button>
        </div>
      </div>
    </div>
  );
}
