import { useNavigate, Link } from 'react-router-dom';
import { useBrandCompare } from '@/hooks/useBrandCompare';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, Scale, Package, Star, Zap, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandCompareBarProps {
  className?: string;
}

export function BrandCompareBar({ className }: BrandCompareBarProps) {
  const { selectedBrands, removeBrand, clearAll, count, maxBrands } = useBrandCompare();
  const navigate = useNavigate();

  if (count === 0) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-md border-t border-gray-700 shadow-2xl transition-transform duration-300',
        count === 0 ? 'translate-y-full' : 'translate-y-0',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Selected brands */}
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
            <div className="flex items-center gap-2 text-sm text-gray-400 shrink-0">
              <Scale className="w-4 h-4" />
              <span>Compare ({count}/{maxBrands})</span>
            </div>
            
            <div className="flex gap-2">
              {selectedBrands.map((brand) => (
                <div
                  key={brand.name}
                  className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5 border border-gray-700"
                >
                  {brand.logoUrl ? (
                    <img
                      src={brand.logoUrl}
                      alt={brand.name}
                      className="w-6 h-6 object-contain"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-400">
                      {brand.name.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm text-white font-medium whitespace-nowrap">
                    {brand.name}
                  </span>
                  <button
                    onClick={() => removeBrand(brand.name)}
                    className="text-gray-500 hover:text-white transition-colors"
                    aria-label={`Remove ${brand.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-gray-400 hover:text-white"
            >
              Clear
            </Button>
            <Button
              onClick={() => navigate('/brands/compare')}
              disabled={count < 2}
              className="gap-2"
            >
              Compare
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main comparison page component
export function BrandComparisonView() {
  const { selectedBrands, removeBrand, clearAll } = useBrandCompare();
  const navigate = useNavigate();

  if (selectedBrands.length < 2) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto text-center py-16">
          <Scale className="w-16 h-16 text-gray-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Compare Brands</h1>
          <p className="text-gray-400 mb-8">
            Select at least 2 brands to compare. You can add brands from the{' '}
            <Link to="/brands" className="text-primary hover:underline">
              Brands page
            </Link>.
          </p>
          <Button onClick={() => navigate('/brands')}>
            Browse Brands
          </Button>
        </div>
      </div>
    );
  }

  // Calculate max values for visual comparison bars
  const maxProductCount = Math.max(...selectedBrands.map(b => b.productCount));
  const maxMaterials = Math.max(...selectedBrands.map(b => b.materials.length));
  const prices = selectedBrands.filter(b => b.avgPricePerKg).map(b => b.avgPricePerKg!);
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Brand Comparison</h1>
            <p className="text-gray-400">
              Comparing {selectedBrands.length} brands side-by-side
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={clearAll}>
              Clear All
            </Button>
            <Button variant="outline" onClick={() => navigate('/brands')}>
              Add More
            </Button>
          </div>
        </div>

        {/* Comparison Grid */}
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${selectedBrands.length}, minmax(0, 1fr))` }}>
          {selectedBrands.map((brand) => (
            <Card key={brand.name} className="bg-gray-800/50 border-gray-700 relative">
              <button
                onClick={() => removeBrand(brand.name)}
                className="absolute top-3 right-3 text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
                aria-label={`Remove ${brand.name}`}
              >
                <X className="w-4 h-4" />
              </button>
              
              <CardContent className="p-6">
                {/* Brand Logo & Name */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 bg-gray-700/50 rounded-lg flex items-center justify-center p-3">
                    {brand.logoUrl ? (
                      <img
                        src={brand.logoUrl}
                        alt={brand.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-gray-500">
                        {brand.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-semibold text-white">{brand.name}</h2>
                  <Link
                    to={`/brands/${encodeURIComponent(brand.name)}`}
                    className="text-sm text-primary hover:underline"
                  >
                    View Details
                  </Link>
                </div>

                {/* Stats */}
                <div className="space-y-5">
                  {/* Product Count */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <Package className="w-4 h-4" />
                        Products
                      </span>
                      <span className="text-white font-medium">{brand.productCount}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${(brand.productCount / maxProductCount) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Materials */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400">Materials</span>
                      <span className="text-white font-medium">{brand.materials.length}</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500 rounded-full transition-all"
                        style={{ width: `${(brand.materials.length / maxMaterials) * 100}%` }}
                      />
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {brand.materials.slice(0, 4).map((m) => (
                        <Badge key={m} variant="secondary" className="text-xs">
                          {m}
                        </Badge>
                      ))}
                      {brand.materials.length > 4 && (
                        <Badge variant="outline" className="text-xs">
                          +{brand.materials.length - 4}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Average Price */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-400 flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        Avg Price/kg
                      </span>
                      <span className="text-white font-medium">
                        {brand.avgPricePerKg ? `$${brand.avgPricePerKg.toFixed(2)}` : '—'}
                      </span>
                    </div>
                    {brand.avgPricePerKg && maxPrice > 0 && (
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all"
                          style={{ width: `${(brand.avgPricePerKg / maxPrice) * 100}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Star className="w-4 h-4" />
                      Rating
                    </span>
                    <span className="text-white font-medium flex items-center gap-1">
                      {brand.rating ? (
                        <>
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          {brand.rating.toFixed(1)}
                        </>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>

                  {/* High Speed */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      High Speed
                    </span>
                    <span className={cn(
                      'font-medium',
                      brand.hasHighSpeed ? 'text-green-400' : 'text-gray-500'
                    )}>
                      {brand.hasHighSpeed ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {/* CTA */}
                <div className="mt-6">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate(`/brands/${encodeURIComponent(brand.name)}`)}
                  >
                    View Filaments
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
