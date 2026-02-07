import { useMemo } from 'react';
import { BarChart3, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCompare } from '@/hooks/useCompare';
import { useEnhancedSimilarFilaments } from '@/hooks/useEnhancedSimilarFilaments';
import { 
  getPerformanceData, 
  calculateOverallScore,
  generateChartAnnotations,
  type SuggestedComparison 
} from '@/lib/performanceProfileService';
import { computePricePerKg } from '@/lib/resolveFilamentPrice';
import { PerformanceRadarChart } from './PerformanceRadarChart';
import { MetricBreakdownCard } from './MetricBreakdownCard';
import { PerformanceProfile } from './PerformanceProfile';
import { CategoryPositionBar } from './CategoryPositionBar';
import { PerformanceNarrative } from './PerformanceNarrative';
import { DecisionFramework } from './DecisionFramework';
import { ScenarioGuidance } from './ScenarioGuidance';
import { ComparisonLandscape } from './ComparisonLandscape';
import { InlineAnnotations } from './ChartAnnotation';

interface PerformanceAtAGlanceProps {
  filamentId: string;
  filamentName: string;
  material: string | null;
  vendor: string | null;
  ease_of_printing_score: number | null;
  printability_index: number | null;
  strength_index: number | null;
  value_score: number | null;
  variant_price: number | null;
  net_weight_g: number | null;
  pack_quantity: number | null;
}

export function PerformanceAtAGlance({
  filamentId,
  filamentName,
  material,
  vendor,
  ease_of_printing_score,
  printability_index,
  strength_index,
  value_score,
  variant_price,
  net_weight_g,
  pack_quantity
}: PerformanceAtAGlanceProps) {
  const { addItem, items } = useCompare();

  // Calculate price per kg using canonical utility
  const pricePerKg = variant_price
    ? computePricePerKg(variant_price, net_weight_g, pack_quantity)
    : null;

  // Get similar filaments for comparison suggestions
  const { recommendations, isLoading: loadingSimilar } = useEnhancedSimilarFilaments(
    filamentId,
    material,
    vendor,
    pricePerKg,
    {
      ease_of_printing_score: ease_of_printing_score || undefined,
      printability_index: printability_index || undefined,
      strength_index: strength_index || undefined,
      value_score: value_score || undefined
    },
    { limit: 6 }
  );

  // Build performance data
  const performanceData = useMemo(() => {
    const scores = {
      ease_of_printing_score,
      printability_index,
      strength_index,
      value_score,
      material
    };

    // Transform recommendations into suggested comparisons
    const suggestedComparisons: SuggestedComparison[] = recommendations
      .slice(0, 3)
      .map(rec => ({
        id: rec.id,
        name: rec.product_title,
        price: rec.variant_price,
        pricePerKg: rec.pricePerKg,
        overallScore: rec.overallScore || calculateOverallScore({
          ease_of_printing_score: rec.printability_index,
          strength_index: rec.strength_index,
          value_score: rec.value_score,
          material: rec.material
        }),
        differentiator: getDifferentiator(rec, pricePerKg),
        featured_image: rec.featured_image,
        material: rec.material
      }));

    return getPerformanceData(scores, suggestedComparisons);
  }, [
    ease_of_printing_score, 
    printability_index, 
    strength_index, 
    value_score, 
    material, 
    recommendations,
    pricePerKg
  ]);

  // Generate chart annotations
  const annotations = useMemo(() => {
    return generateChartAnnotations(performanceData.metrics, material);
  }, [performanceData.metrics, material]);

  // Don't render if no metrics
  if (!performanceData.metrics.length) {
    return null;
  }

  const handleAddToComparison = () => {
    if (!items.find(i => i.id === filamentId)) {
      addItem({
        id: filamentId,
        product_title: filamentName,
        vendor: vendor,
        material: material,
        color_hex: null,
        variant_price: variant_price,
        net_weight_g: net_weight_g,
        featured_image: null
      });
    }
  };

  return (
    <section 
      className="bg-primary/[0.03] border border-primary/15 rounded-2xl p-6 sm:p-8 space-y-8"
      aria-label="Performance at a Glance"
    >
      {/* Section Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">
            Performance at a Glance
          </h2>
        </div>
        <p className="text-sm text-muted-foreground">
          See how this material stacks up against alternatives
        </p>
      </div>

      {/* Performance Narrative - Leads with the story */}
      <PerformanceNarrative
        ease_of_printing_score={ease_of_printing_score}
        printability_index={printability_index}
        strength_index={strength_index}
        value_score={value_score}
        material={material}
        pricePerKg={pricePerKg}
      />

      {/* Main Content - Two Columns on Desktop */}
      <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left: Radar Chart with Annotations */}
        <div className="space-y-4">
          <PerformanceRadarChart 
            metrics={performanceData.metrics}
            categoryName={performanceData.categoryComparison.category}
          />
          
          {/* Inline Annotations for context */}
          <InlineAnnotations annotations={annotations} />
          
          {/* Category Position Bar */}
          <CategoryPositionBar comparison={performanceData.categoryComparison} />
        </div>

        {/* Right: Metrics Breakdown */}
        <div className="space-y-4">
          {/* Overall Score & Profile */}
          <PerformanceProfile 
            overallScore={performanceData.overallScore}
            profile={performanceData.performanceProfile}
            profileLabel={performanceData.profileLabel}
            profileDescription={performanceData.profileDescription}
          />

          {/* Individual Metrics */}
          <div className="space-y-3">
            {performanceData.metrics.map(metric => (
              <MetricBreakdownCard key={metric.id} metric={metric} />
            ))}
          </div>
        </div>
      </div>

      {/* Decision Framework */}
      <DecisionFramework
        ease_of_printing_score={ease_of_printing_score}
        printability_index={printability_index}
        strength_index={strength_index}
        value_score={value_score}
        material={material}
      />

      {/* Scenario Guidance - Use This If / Consider Alternatives If */}
      <ScenarioGuidance
        ease_of_printing_score={ease_of_printing_score}
        printability_index={printability_index}
        strength_index={strength_index}
        value_score={value_score}
        material={material}
      />

      {/* Comparison Landscape - Budget / Balanced / Premium */}
      {!loadingSimilar && recommendations.length > 0 && (
        <ComparisonLandscape
          currentId={filamentId}
          currentName={filamentName}
          currentPrice={pricePerKg}
          currentScore={performanceData.overallScore}
          recommendations={performanceData.suggestedComparisons}
        />
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button 
          variant="outline"
          className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
          onClick={handleAddToComparison}
        >
          Add to Comparison
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <Link to="/compare" className="flex-1">
          <Button 
            variant="ghost"
            className="w-full text-muted-foreground hover:text-foreground"
          >
            View Comparison Table
          </Button>
        </Link>
      </div>
    </section>
  );
}

// Helper to determine differentiator for comparison suggestions
function getDifferentiator(
  rec: { pricePerKg: number | null; overallScore?: number; material?: string | null },
  currentPricePerKg: number | null
): string {
  if (currentPricePerKg && rec.pricePerKg) {
    if (rec.pricePerKg < currentPricePerKg * 0.85) return 'Cheaper';
    if (rec.pricePerKg > currentPricePerKg * 1.15) return 'Premium';
  }
  
  if (rec.overallScore && rec.overallScore >= 8) return 'Top Rated';
  if (rec.material?.toLowerCase().includes('cf')) return 'Stronger';
  if (rec.material?.toLowerCase().includes('petg')) return 'Stronger';
  
  return 'Alternative';
}
