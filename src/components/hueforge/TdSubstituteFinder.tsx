import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, RefreshCw, ArrowRight, ShoppingCart, DollarSign, Palette, Search } from 'lucide-react';
import { SubstituteFilamentPicker, type TDFilament } from './SubstituteFilamentPicker';
import { SubstituteResultCard, getMatchBadge } from './SubstituteResultCard';
import { SubstituteComparisonStrip } from './SubstituteComparisonStrip';
import { SubstitutePriceTable } from './SubstitutePriceTable';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  filaments: TDFilament[];
  compact?: boolean;
}

const USE_CASE_PILLS = [
  { icon: ShoppingCart, label: 'Out of Stock' },
  { icon: DollarSign, label: 'Find Cheaper' },
  { icon: Palette, label: 'Match a Color' },
];

const EXAMPLE_SEARCHES = [
  { vendor: 'Overture', colorFamily: 'Black', label: 'Overture PLA Black' },
  { vendor: 'Bambu Lab', colorFamily: 'White', label: 'Bambu Lab PLA Basic White' },
  { vendor: 'eSUN', colorFamily: 'Green', label: 'eSUN PLA+ Pine Green' },
  { vendor: 'Hatchbox', colorFamily: 'Red', label: 'Hatchbox PLA Red' },
];

export function TdSubstituteFinder({ filaments, compact = false }: Props) {
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [groupByBrand, setGroupByBrand] = useState(false);
  const [showSameColorExpanded, setShowSameColorExpanded] = useState(false);

  // Filter controls
  const [sameColor, setSameColor] = useState(true);
  const [sameMaterial, setSameMaterial] = useState(true);
  const [tdTolerance, setTdTolerance] = useState(0.5);

  // Pre-select from URL param
  useEffect(() => {
    const paramId = searchParams.get('filament');
    if (paramId && filaments.some((f) => f.id === paramId)) {
      setSelectedId(paramId);
    }
  }, [searchParams, filaments]);

  const source = useMemo(
    () => filaments.find((f) => f.id === selectedId) ?? null,
    [filaments, selectedId]
  );

  const { exactMatches, closeMatches, similarRange } = useMemo(() => {
    if (!source || source.transmission_distance == null) {
      return { exactMatches: [], closeMatches: [], similarRange: [] };
    }
    const srcTd = source.transmission_distance;
    const srcColor = source.color_family;

    const exact: TDFilament[] = [];
    const close: TDFilament[] = [];
    const similar: TDFilament[] = [];

    const exactThreshold = tdTolerance * 0.2;
    const closeThreshold = tdTolerance;
    const similarThreshold = tdTolerance * 2.0;

    for (const f of filaments) {
      if (f.id === source.id || f.transmission_distance == null) continue;

      if (sameColor && f.color_family !== srcColor) continue;
      if (sameMaterial && f.material !== source.material) continue;

      const diff = Math.abs(f.transmission_distance - srcTd);

      if (diff <= exactThreshold) exact.push(f);
      else if (diff <= closeThreshold) close.push(f);
      else if (diff <= similarThreshold) similar.push(f);
    }

    const sortByDiffThenPrice = (a: TDFilament, b: TDFilament) => {
      const da = Math.abs((a.transmission_distance ?? 0) - srcTd);
      const db = Math.abs((b.transmission_distance ?? 0) - srcTd);
      if (da !== db) return da - db;
      return (a.variant_price ?? Infinity) - (b.variant_price ?? Infinity);
    };

    exact.sort(sortByDiffThenPrice);
    close.sort(sortByDiffThenPrice);
    similar.sort(sortByDiffThenPrice);

    return { exactMatches: exact, closeMatches: close, similarRange: similar };
  }, [source, filaments, sameColor, sameMaterial, tdTolerance]);

  const allSubstitutes = useMemo(
    () => [...exactMatches, ...closeMatches],
    [exactMatches, closeMatches]
  );

  // Brand grouping for full page mode
  const brandGroups = useMemo(() => {
    if (!groupByBrand) return null;
    const groups: Record<string, TDFilament[]> = {};
    for (const f of allSubstitutes) {
      const brand = f.vendor || 'Unknown';
      (groups[brand] ??= []).push(f);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [allSubstitutes, groupByBrand]);

  const handleSelect = (f: TDFilament | null) => {
    setSelectedId(f?.id ?? null);
    setShowSameColorExpanded(false);
  };

  const findExample = (vendor: string, colorFamily: string) => {
    return filaments.find(
      (f) =>
        f.vendor?.toLowerCase().includes(vendor.toLowerCase()) &&
        f.color_family?.toLowerCase().includes(colorFamily.toLowerCase()) &&
        f.transmission_distance != null
    );
  };

  const srcTd = source?.transmission_distance ?? 0;
  const srcColor = source?.color_family ?? null;
  const srcPrice = source?.variant_price ?? null;
  const totalResults = exactMatches.length + closeMatches.length + similarRange.length;

  return (
    <section className="space-y-6">
      {/* Hero */}
      {!compact && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 flex items-center gap-2">
              <RefreshCw className="w-6 h-6 text-primary" />
              Find a TD-Matched Substitute
            </h2>
            <p className="text-muted-foreground max-w-2xl">
              Out of stock? Trying a new brand? Find filaments with matching TD values and similar colors — perfect drop-in replacements for your HueForge projects.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {USE_CASE_PILLS.map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border border-border/50 text-sm text-muted-foreground"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {compact && (
        <div>
          <h2 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-primary" />
            Find a TD-Matched Substitute
          </h2>
          <p className="text-muted-foreground">
            Have a filament but need an alternative? Find filaments with similar TD values and colors from other brands.
          </p>
        </div>
      )}

      {/* Search */}
      <SubstituteFilamentPicker
        filaments={filaments}
        selectedId={selectedId}
        onSelect={handleSelect}
      />

      {/* Filter Controls */}
      {source && (
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 p-3 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2">
            <Switch checked={sameColor} onCheckedChange={setSameColor} id="same-color" />
            <label htmlFor="same-color" className="text-sm cursor-pointer">Same color family</label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={sameMaterial} onCheckedChange={setSameMaterial} id="same-material" />
            <label htmlFor="same-material" className="text-sm cursor-pointer">Same material</label>
          </div>
          <div className="flex items-center gap-2 min-w-[200px] flex-1 max-w-xs">
            <span className="text-sm text-muted-foreground shrink-0">TD ±</span>
            <Slider
              value={[tdTolerance]}
              onValueChange={([v]) => setTdTolerance(v)}
              min={0.1}
              max={2.0}
              step={0.1}
              className="flex-1"
            />
            <span className="text-sm font-medium w-8 text-right">{tdTolerance.toFixed(1)}</span>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!source && (
        <div className="py-8 space-y-8">
          {/* Visual diagram */}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { label: 'Your Filament', sub: 'Select above', icon: Search },
              { label: 'TD Match', sub: 'Same transmissivity', icon: RefreshCw },
              { label: 'Substitute', sub: 'Drop-in replacement', icon: Palette },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-3">
                <div className="flex flex-col items-center gap-1.5 p-4 rounded-xl border border-border/50 bg-card w-[140px]">
                  <step.icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{step.label}</span>
                  <span className="text-[11px] text-muted-foreground">{step.sub}</span>
                </div>
                {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>

          {/* Popular searches */}
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">Popular substitution searches:</p>
            <div className="flex flex-wrap justify-center gap-2">
              {EXAMPLE_SEARCHES.map((ex) => {
                const match = findExample(ex.vendor, ex.colorFamily);
                if (!match) return null;
                return (
                  <Button
                    key={ex.label}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSelect(match)}
                  >
                    {match.color_hex && (
                      <span
                        className="w-3 h-3 rounded-full border shrink-0 inline-block mr-1.5"
                        style={{ backgroundColor: match.color_hex }}
                      />
                    )}
                    {ex.label} → alternatives
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {source && (
        <div className="space-y-4">
          {/* Reference card */}
          <div>
            <p className="text-xs uppercase tracking-wider text-primary mb-1.5 font-medium">Your Filament</p>
            <Card className="border-primary">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full border-2 border-primary shrink-0"
                    style={{ backgroundColor: source.color_hex || '#666' }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{source.vendor} — {source.product_title}</p>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold">TD {srcTd.toFixed(2)}</span>
                      {source.color_family && <Badge variant="outline" className="text-xs">{source.color_family}</Badge>}
                      {source.material && <Badge variant="outline" className="text-xs">{source.material}</Badge>}
                      {source.variant_price != null && (
                        <span className="text-sm text-muted-foreground">{formatPrice(source.variant_price)}</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison strip */}
          <SubstituteComparisonStrip source={source} substitutes={allSubstitutes} />

          {/* Full page controls */}
          {!compact && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={groupByBrand} onCheckedChange={setGroupByBrand} id="group-brand" />
                <label htmlFor="group-brand" className="text-sm cursor-pointer">Compare by Brand</label>
              </div>
            </div>
          )}

          {/* No results */}
          {totalResults === 0 && (
            <div className="text-center py-8 space-y-3">
              <p className="text-muted-foreground">No substitutes found within your tolerance range.</p>
              <p className="text-sm text-muted-foreground">
                Try widening the TD tolerance or removing the color/material filters.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to={`/hueforge-td-database`}>
                  Browse all filaments in this TD range →
                </Link>
              </Button>
            </div>
          )}

          {/* 🎯 Exact Matches */}
          {exactMatches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                🎯 Exact TD Match
                <span className="text-sm font-normal text-muted-foreground ml-2">within ±{(tdTolerance * 0.2).toFixed(2)} TD</span>
              </h3>
              {groupByBrand && brandGroups ? (
                brandGroups
                  .filter(([, items]) => items.some((f) => exactMatches.includes(f)))
                  .map(([brand, items]) => (
                    <div key={brand} className="mb-3">
                      <p className="text-sm font-medium text-muted-foreground mb-1">{brand}</p>
                      <div className="space-y-2">
                        {items
                          .filter((f) => exactMatches.includes(f))
                          .map((f) => (
                            <SubstituteResultCard
                              key={f.id}
                              filament={f}
                              sourceTd={srcTd}
                              sourcePrice={srcPrice}
                              badge={getMatchBadge(f, srcTd, srcColor, srcPrice)}
                              formatPrice={formatPrice}
                            />
                          ))}
                      </div>
                    </div>
                  ))
              ) : (
                <div className="space-y-2">
                  {exactMatches.slice(0, compact ? 5 : 20).map((f) => (
                    <SubstituteResultCard
                      key={f.id}
                      filament={f}
                      sourceTd={srcTd}
                      sourcePrice={srcPrice}
                      badge={getMatchBadge(f, srcTd, srcColor, srcPrice)}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ✅ Close Matches */}
          {closeMatches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                ✅ Close Match
                <span className="text-sm font-normal text-muted-foreground ml-2">within ±{tdTolerance.toFixed(1)} TD</span>
              </h3>
              <div className="space-y-2">
                {closeMatches.slice(0, compact ? 5 : 20).map((f) => (
                  <SubstituteResultCard
                    key={f.id}
                    filament={f}
                    sourceTd={srcTd}
                    sourcePrice={srcPrice}
                    badge={getMatchBadge(f, srcTd, srcColor, srcPrice)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 🔄 Similar Range */}
          {similarRange.length > 0 && (
            <Collapsible open={showSameColorExpanded} onOpenChange={setShowSameColorExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>🔄 Similar Range — {similarRange.length} more within ±{(tdTolerance * 2).toFixed(1)} TD</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSameColorExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2">
                  {similarRange.slice(0, 20).map((f) => (
                    <SubstituteResultCard
                      key={f.id}
                      filament={f}
                      sourceTd={srcTd}
                      sourcePrice={srcPrice}
                      badge={getMatchBadge(f, srcTd, srcColor, srcPrice)}
                      formatPrice={formatPrice}
                    />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Price Table (full page only) */}
          {!compact && allSubstitutes.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Price Comparison</h3>
              <SubstitutePriceTable
                source={source}
                substitutes={allSubstitutes}
                formatPrice={formatPrice}
              />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
