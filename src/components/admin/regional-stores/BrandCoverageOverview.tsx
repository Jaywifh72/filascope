import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { REGIONS } from '@/config/regions';
import { RegionCode } from '@/types/regional';

interface BrandWithCoverage {
  id: string;
  brand_name: string;
  brand_slug: string;
  logo_url: string | null;
  storeCount: number;
  activeStoreCount: number;
  regions: string[];
  coverageScore: number;
}

interface Props {
  brands: BrandWithCoverage[] | undefined;
  onFilterRegion: (region: RegionCode) => void;
}

const MAIN_REGIONS: RegionCode[] = ['US', 'CA', 'EU', 'UK', 'AU', 'JP', 'CN'];

export function BrandCoverageOverview({ brands, onFilterRegion }: Props) {
  if (!brands) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {MAIN_REGIONS.map(region => (
          <div key={region} className="h-32 bg-muted/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  const totalBrands = brands.length;

  // Calculate coverage for each region
  const regionStats = MAIN_REGIONS.map(region => {
    const brandsWithRegion = brands.filter(b => b.regions.includes(region));
    const count = brandsWithRegion.length;
    const percentage = totalBrands > 0 ? Math.round((count / totalBrands) * 100) : 0;
    
    return {
      region,
      count,
      percentage,
      config: REGIONS[region],
    };
  });

  const getCoverageColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-500';
    if (percentage >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getCoverageBg = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500/10 border-green-500/20';
    if (percentage >= 50) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {regionStats.map(({ region, count, percentage, config }) => (
          <Card 
            key={region} 
            className={`p-4 text-center border ${getCoverageBg(percentage)} cursor-pointer hover:scale-105 transition-transform`}
            onClick={() => onFilterRegion(region)}
          >
            <div className="text-3xl mb-2">{config?.flag}</div>
            <div className="text-sm font-medium text-foreground">{config?.name}</div>
            <div className={`text-2xl font-bold mt-2 ${getCoverageColor(percentage)}`}>
              {percentage}%
            </div>
            <div className="text-xs text-muted-foreground">
              {count} of {totalBrands} brands
            </div>
          </Card>
        ))}
      </div>

      {/* Summary stats */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Coverage Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-muted-foreground">Excellent Coverage (80%+)</div>
            <div className="text-2xl font-bold text-green-500">
              {regionStats.filter(r => r.percentage >= 80).length} regions
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Moderate Coverage (50-79%)</div>
            <div className="text-2xl font-bold text-amber-500">
              {regionStats.filter(r => r.percentage >= 50 && r.percentage < 80).length} regions
            </div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Needs Attention (&lt;50%)</div>
            <div className="text-2xl font-bold text-red-500">
              {regionStats.filter(r => r.percentage < 50).length} regions
            </div>
          </div>
        </div>
      </Card>

      {/* Top brands by coverage */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Brands with Best Coverage</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {brands
            .filter(b => b.storeCount >= 5)
            .sort((a, b) => b.storeCount - a.storeCount)
            .slice(0, 12)
            .map(brand => (
              <div 
                key={brand.id} 
                className="flex items-center gap-2 p-2 bg-muted/50 rounded-md"
              >
                {brand.logo_url ? (
                  <img 
                    src={brand.logo_url} 
                    alt={brand.brand_name}
                    className="w-6 h-6 rounded object-contain"
                  />
                ) : (
                  <div className="w-6 h-6 rounded bg-muted flex items-center justify-center text-xs">
                    {brand.brand_name.charAt(0)}
                  </div>
                )}
                <span className="text-sm truncate">{brand.brand_name}</span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {brand.storeCount}
                </span>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}
