import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, RefreshCw } from 'lucide-react';
import { SubstituteFilamentPicker, type TDFilament } from './SubstituteFilamentPicker';
import { SubstituteResultCard, getMatchBadge } from './SubstituteResultCard';
import { SubstituteComparisonStrip } from './SubstituteComparisonStrip';
import { SubstitutePriceTable } from './SubstitutePriceTable';
import { useCurrency } from '@/hooks/useCurrency';

interface Props {
  filaments: TDFilament[];
  compact?: boolean;
}

export function TdSubstituteFinder({ filaments, compact = false }: Props) {
  const [searchParams] = useSearchParams();
  const { formatPrice } = useCurrency();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [groupByBrand, setGroupByBrand] = useState(false);
  const [showSameColorExpanded, setShowSameColorExpanded] = useState(false);

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

  const { exactMatches, closeMatches, sameColorDiffTd } = useMemo(() => {
    if (!source || source.transmission_distance == null) {
      return { exactMatches: [], closeMatches: [], sameColorDiffTd: [] };
    }
    const srcTd = source.transmission_distance;
    const srcColor = source.color_family;
    const srcPrice = source.variant_price;

    const exact: TDFilament[] = [];
    const close: TDFilament[] = [];
    const sameColor: TDFilament[] = [];

    for (const f of filaments) {
      if (f.id === source.id || f.transmission_distance == null) continue;
      const diff = Math.abs(f.transmission_distance - srcTd);
      const colorMatch = f.color_family === srcColor && !!srcColor;

      if (colorMatch && diff <= 0.1) exact.push(f);
      else if (colorMatch && diff <= 0.5) close.push(f);
      else if (colorMatch && diff > 0.5) sameColor.push(f);
    }

    const sortByDiffThenPrice = (a: TDFilament, b: TDFilament) => {
      const da = Math.abs((a.transmission_distance ?? 0) - srcTd);
      const db = Math.abs((b.transmission_distance ?? 0) - srcTd);
      if (da !== db) return da - db;
      return (a.variant_price ?? Infinity) - (b.variant_price ?? Infinity);
    };

    exact.sort(sortByDiffThenPrice);
    close.sort(sortByDiffThenPrice);
    sameColor.sort(sortByDiffThenPrice);

    return { exactMatches: exact, closeMatches: close, sameColorDiffTd: sameColor };
  }, [source, filaments]);

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

  const srcTd = source?.transmission_distance ?? 0;
  const srcColor = source?.color_family ?? null;
  const srcPrice = source?.variant_price ?? null;

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold mb-1 flex items-center gap-2">
          <RefreshCw className="w-6 h-6 text-primary" />
          Find a TD-Matched Substitute
        </h2>
        <p className="text-muted-foreground">
          Have a filament but need an alternative? Find filaments with similar TD values and colors from other brands.
        </p>
      </div>

      <SubstituteFilamentPicker
        filaments={filaments}
        selectedId={selectedId}
        onSelect={handleSelect}
      />

      {source && (
        <div className="space-y-4">
          {/* Reference card */}
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

          {/* Exact Matches */}
          <div>
            <h3 className="text-lg font-semibold mb-2">
              Exact TD Matches
              <span className="text-sm font-normal text-muted-foreground ml-2">within ±0.1 TD, same color</span>
            </h3>
            {exactMatches.length === 0 ? (
              <p className="text-sm text-muted-foreground py-3">No exact matches found. See close matches below.</p>
            ) : groupByBrand && brandGroups ? (
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
                    badge={getMatchBadge(f, srcTd, srcColor, srcPrice)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Close Matches */}
          {closeMatches.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Close Matches
                <span className="text-sm font-normal text-muted-foreground ml-2">within ±0.5 TD, same color</span>
              </h3>
              <div className="space-y-2">
                {closeMatches.slice(0, compact ? 5 : 20).map((f) => (
                  <SubstituteResultCard
                    key={f.id}
                    filament={f}
                    sourceTd={srcTd}
                    badge={getMatchBadge(f, srcTd, srcColor, srcPrice)}
                    formatPrice={formatPrice}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Same Color, Different TD */}
          {sameColorDiffTd.length > 0 && (
            <Collapsible open={showSameColorExpanded} onOpenChange={setShowSameColorExpanded}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between">
                  <span>Show {sameColorDiffTd.length} more in {srcColor}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSameColorExpanded ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-2 mt-2">
                  {sameColorDiffTd.slice(0, 20).map((f) => (
                    <SubstituteResultCard
                      key={f.id}
                      filament={f}
                      sourceTd={srcTd}
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
