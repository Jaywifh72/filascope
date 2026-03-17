import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Search, CheckCircle2, Star, ExternalLink, Package,
  CheckSquare, Square, Link, Zap, Globe,
} from 'lucide-react';
import {
  useAmazonSync, DiscoveryResult, DiscoveryCandidate,
  AmazonSearchResult, RegionSearchResults,
} from '@/hooks/useAmazonSync';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

const MARKETPLACES = [
  { value: 'all', label: 'All Amazon Regions' },
  { value: 'US', label: 'Amazon.com (US)' },
  { value: 'UK', label: 'Amazon.co.uk (UK)' },
  { value: 'DE', label: 'Amazon.de (Germany)' },
  { value: 'CA', label: 'Amazon.ca (Canada)' },
  { value: 'FR', label: 'Amazon.fr (France)' },
  { value: 'IT', label: 'Amazon.it (Italy)' },
  { value: 'ES', label: 'Amazon.es (Spain)' },
  { value: 'AU', label: 'Amazon.com.au (Australia)' },
  { value: 'JP', label: 'Amazon.co.jp (Japan)' },
  { value: 'NL', label: 'Amazon.nl (Netherlands)' },
  { value: 'BE', label: 'Amazon.com.be (Belgium)' },
];

const MARKETPLACE_DOMAINS: Record<string, string> = {
  US: 'amazon.com', UK: 'amazon.co.uk', DE: 'amazon.de',
  CA: 'amazon.ca', FR: 'amazon.fr', IT: 'amazon.it',
  ES: 'amazon.es', AU: 'amazon.com.au', JP: 'amazon.co.jp',
  NL: 'amazon.nl', BE: 'amazon.com.be',
};

const MARKETPLACE_LINK_COLUMNS: Record<string, string> = {
  US: 'amazon_link_us', UK: 'amazon_link_uk', DE: 'amazon_link_de',
  CA: 'amazon_link_ca', FR: 'amazon_link_fr', IT: 'amazon_link_it',
  ES: 'amazon_link_es', AU: 'amazon_link_au', JP: 'amazon_link_jp',
  NL: 'amazon_link_nl', BE: 'amazon_link_be',
};

// All regions supported by the find-amazon-products edge function
const SEARCHABLE_REGIONS = ['US', 'UK', 'DE', 'CA', 'FR', 'IT', 'ES', 'JP', 'AU'];

function extractAsinFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/(?:dp|gp\/product)\/([A-Z0-9]{10})/i);
  return match ? match[1].toUpperCase() : null;
}

function detectMarketplaceFromUrl(url: string): string | null {
  const domainToMarketplace: Array<[string, string]> = [
    ['amazon.com.au', 'AU'], ['amazon.com.be', 'BE'], ['amazon.co.uk', 'UK'],
    ['amazon.co.jp', 'JP'], ['amazon.ca', 'CA'], ['amazon.de', 'DE'],
    ['amazon.fr', 'FR'], ['amazon.it', 'IT'], ['amazon.es', 'ES'],
    ['amazon.nl', 'NL'], ['amazon.com', 'US'],
  ];
  for (const [domain, mp] of domainToMarketplace) {
    if (url.includes(domain)) return mp;
  }
  return null;
}

function buildAmazonSearchUrl(productName: string, marketplace: string): string {
  const domain = MARKETPLACE_DOMAINS[marketplace] || 'amazon.com';
  return `https://www.${domain}/s?k=${encodeURIComponent(productName)}`;
}

type ViewFilter = 'all' | 'mapped' | 'unmapped';

export function AmazonDiscoveryPanel() {
  const { toast } = useToast();
  const {
    discoverProducts, isDiscovering,
    searchAmazon, searchingFilaments,
    importDiscoveryResults, isImporting,
  } = useAmazonSync();

  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState('US');
  const [results, setResults] = useState<DiscoveryResult[]>([]);
  const [selections, setSelections] = useState<Map<string, DiscoveryCandidate>>(new Map());
  const [manualUrls, setManualUrls] = useState<Map<string, string>>(new Map());
  const [viewFilter, setViewFilter] = useState<ViewFilter>('all');
  const [isBatchSearching, setIsBatchSearching] = useState(false);
  const [batchSearchProgress, setBatchSearchProgress] = useState<{ done: number; total: number } | null>(null);

  // Fetch all brands from filaments table with Amazon link counts
  const { data: brands } = useQuery({
    queryKey: ['discovery-brands-with-amazon-counts'],
    queryFn: async () => {
      const { data: filaments, error } = await supabase
        .from('filaments')
        .select('vendor, amazon_link_us, amazon_link_uk, amazon_link_de, amazon_link_ca, amazon_link_fr, amazon_link_it, amazon_link_es, amazon_link_au, amazon_link_jp, amazon_link_nl, amazon_link_be');
      if (error) throw error;

      const brandMap = new Map<string, { total: number; withLinks: number }>();
      for (const f of (filaments || [])) {
        if (!f.vendor) continue;
        const entry = brandMap.get(f.vendor) || { total: 0, withLinks: 0 };
        entry.total++;
        const hasAnyLink = [
          f.amazon_link_us, f.amazon_link_uk, f.amazon_link_de,
          f.amazon_link_ca, f.amazon_link_fr, f.amazon_link_it,
          f.amazon_link_es, f.amazon_link_au, f.amazon_link_jp,
          f.amazon_link_nl, f.amazon_link_be,
        ].some(link => link != null && link !== '');
        if (hasAnyLink) entry.withLinks++;
        brandMap.set(f.vendor, entry);
      }

      return Array.from(brandMap.entries())
        .map(([vendor, counts]) => ({ vendor, total: counts.total, withLinks: counts.withLinks }))
        .sort((a, b) => {
          if (a.withLinks > 0 && b.withLinks === 0) return -1;
          if (a.withLinks === 0 && b.withLinks > 0) return 1;
          return a.vendor.localeCompare(b.vendor);
        });
    },
  });

  const handleDiscover = async () => {
    if (!selectedBrand) return;

    if (selectedMarketplace === 'all') {
      const allResults: DiscoveryResult[] = [];
      const seenFilaments = new Set<string>();

      for (const mp of Object.keys(MARKETPLACE_LINK_COLUMNS)) {
        const res = await discoverProducts({ brandSlug: selectedBrand, marketplace: mp });
        for (const result of res) {
          if (!seenFilaments.has(result.filamentId)) {
            seenFilaments.add(result.filamentId);
            allResults.push(result);
          } else {
            const existing = allResults.find(r => r.filamentId === result.filamentId);
            if (existing) {
              for (const c of result.candidates) {
                if (!existing.candidates.some(ec => ec.asin === c.asin)) {
                  existing.candidates.push(c);
                }
              }
            }
          }
        }
      }
      setResults(allResults);
    } else {
      const res = await discoverProducts({ brandSlug: selectedBrand, marketplace: selectedMarketplace });
      setResults(res);
    }

    setSelections(new Map());
    setManualUrls(new Map());
  };

  /** Convert Amazon search results into DiscoveryCandidates and add them to a result */
  const addSearchResultsToFilament = (
    filamentId: string,
    regionResults: RegionSearchResults[],
  ) => {
    setResults(prev => {
      const next = [...prev];
      const result = next.find(r => r.filamentId === filamentId);
      if (!result) return prev;

      for (const region of regionResults) {
        if (region.error || region.results.length === 0) continue;
        const mp = region.region;
        const domain = MARKETPLACE_DOMAINS[mp] || 'amazon.com';

        for (const sr of region.results) {
          const asin = extractAsinFromUrl(sr.link);
          if (!asin) continue;
          if (result.candidates.some(c => c.asin === asin)) continue;

          // Parse price string like "$24.99" or "24,99 €"
          let priceNum: number | null = null;
          if (sr.price) {
            const cleaned = sr.price.replace(/[^0-9.,]/g, '').replace(',', '.');
            const parsed = parseFloat(cleaned);
            if (!isNaN(parsed)) priceNum = parsed;
          }

          result.candidates.push({
            asin,
            title: sr.title,
            price: priceNum,
            currency: mp === 'US' ? 'USD' : mp === 'UK' ? 'GBP' : mp === 'CA' ? 'CAD' : mp === 'AU' ? 'AUD' : mp === 'JP' ? 'JPY' : 'EUR',
            imageUrl: sr.thumbnail || null,
            rating: null,
            reviewCount: null,
            url: `https://www.${domain}/dp/${asin}`,
            confidence: 70,
            confidenceLabel: 'Medium',
            matchReasons: [`Amazon ${mp} search result`],
          });
        }
      }
      return next;
    });
  };

  /** Search Amazon for a single filament */
  const handleSearchFilament = async (filamentId: string, productName: string) => {
    const regions = selectedMarketplace === 'all'
      ? SEARCHABLE_REGIONS
      : [selectedMarketplace].filter(mp => SEARCHABLE_REGIONS.includes(mp));

    if (regions.length === 0) {
      // Fallback: open browser search
      window.open(buildAmazonSearchUrl(productName, selectedMarketplace === 'all' ? 'US' : selectedMarketplace), '_blank');
      return;
    }

    const regionResults = await searchAmazon(productName, regions, filamentId);

    if (regionResults.length === 0) {
      // Edge function failed — fall back to opening browser search
      toast({
        title: 'API search unavailable',
        description: 'Opening Amazon search in browser instead...',
      });
      window.open(buildAmazonSearchUrl(productName, selectedMarketplace === 'all' ? 'US' : selectedMarketplace), '_blank');
      return;
    }

    const totalFound = regionResults.reduce((sum, r) => sum + r.results.length, 0);
    addSearchResultsToFilament(filamentId, regionResults);

    if (totalFound > 0) {
      toast({
        title: 'Search Complete',
        description: `Found ${totalFound} Amazon products across ${regionResults.filter(r => r.results.length > 0).length} regions.`,
      });
    } else {
      toast({
        title: 'No Results',
        description: 'No Amazon products found. Try a different search term.',
      });
    }
  };

  /** Batch search all unmapped filaments */
  const handleBatchSearch = async () => {
    const unmapped = results.filter(r => r.candidates.length === 0);
    if (unmapped.length === 0) return;

    setIsBatchSearching(true);
    setBatchSearchProgress({ done: 0, total: unmapped.length });

    const regions = selectedMarketplace === 'all'
      ? SEARCHABLE_REGIONS
      : [selectedMarketplace].filter(mp => SEARCHABLE_REGIONS.includes(mp));

    let searched = 0;
    let totalFound = 0;

    for (const result of unmapped) {
      const regionResults = await searchAmazon(result.filamentName, regions, result.filamentId);

      if (regionResults.length > 0) {
        const found = regionResults.reduce((sum, r) => sum + r.results.length, 0);
        totalFound += found;
        addSearchResultsToFilament(result.filamentId, regionResults);

        // Auto-select the first candidate if found
        if (found > 0) {
          const updatedResult = results.find(r => r.filamentId === result.filamentId);
          if (updatedResult && updatedResult.candidates.length > 0) {
            setSelections(prev => {
              const next = new Map(prev);
              next.set(result.filamentId, updatedResult.candidates[0]);
              return next;
            });
          }
        }
      }

      searched++;
      setBatchSearchProgress({ done: searched, total: unmapped.length });

      // Rate limit: 2s between searches to avoid SerpApi quota issues
      if (searched < unmapped.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setIsBatchSearching(false);
    setBatchSearchProgress(null);

    toast({
      title: 'Batch Search Complete',
      description: `Searched ${searched} filaments, found ${totalFound} Amazon products.`,
    });
  };

  const handleToggleSelection = (filamentId: string, candidate: DiscoveryCandidate) => {
    const next = new Map(selections);
    if (next.has(filamentId) && next.get(filamentId)?.asin === candidate.asin) {
      next.delete(filamentId);
    } else {
      next.set(filamentId, candidate);
    }
    setSelections(next);
  };

  const handleManualUrlChange = (filamentId: string, url: string) => {
    const next = new Map(manualUrls);
    next.set(filamentId, url);
    setManualUrls(next);

    const asin = extractAsinFromUrl(url);
    if (asin) {
      const result = results.find(r => r.filamentId === filamentId);
      if (!result) return;

      const detectedMp = detectMarketplaceFromUrl(url);
      const actualMp = detectedMp || (selectedMarketplace === 'all' ? 'US' : selectedMarketplace);
      const domain = MARKETPLACE_DOMAINS[actualMp] || 'amazon.com';

      const candidate: DiscoveryCandidate = {
        asin,
        title: result.filamentName,
        price: null,
        currency: actualMp === 'US' ? 'USD' : actualMp === 'UK' ? 'GBP' : actualMp === 'CA' ? 'CAD' : actualMp === 'AU' ? 'AUD' : actualMp === 'JP' ? 'JPY' : 'EUR',
        imageUrl: null,
        rating: null,
        reviewCount: null,
        url: `https://www.${domain}/dp/${asin}`,
        confidence: 80,
        confidenceLabel: 'Medium',
        matchReasons: ['Manually entered URL'],
      };

      if (!result.candidates.some(c => c.asin === asin)) {
        result.candidates.push(candidate);
        setResults([...results]);
      }

      const selNext = new Map(selections);
      selNext.set(filamentId, candidate);
      setSelections(selNext);
    }
  };

  const handleSelectAll = () => {
    const selectableResults = filteredResults.filter(r => r.candidates.length > 0);
    const allSelectable = selectableResults.every(r => selections.has(r.filamentId));

    if (allSelectable) {
      setSelections(new Map());
    } else {
      const next = new Map(selections);
      for (const result of selectableResults) {
        if (result.candidates.length > 0) {
          next.set(result.filamentId, result.candidates[0]);
        }
      }
      setSelections(next);
    }
  };

  const handleImport = async () => {
    const items = Array.from(selections.entries()).map(([filamentId, candidate]) => {
      let marketplace = selectedMarketplace;
      if (marketplace === 'all') {
        marketplace = detectMarketplaceFromUrl(candidate.url) || 'US';
      }
      return { filamentId, candidate, marketplace };
    });

    if (items.length === 0) {
      toast({ title: 'No selections', description: 'Select at least one candidate to import.' });
      return;
    }

    await importDiscoveryResults(items);
    setSelections(new Map());
  };

  const getConfidenceBadge = (label: string) => {
    switch (label) {
      case 'High':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">High</Badge>;
      case 'Medium':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Medium</Badge>;
      case 'Already Mapped':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Already Mapped</Badge>;
      default:
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Low</Badge>;
    }
  };

  // Filter results
  const filteredResults = results.filter(r => {
    if (viewFilter === 'mapped') return r.candidates.length > 0;
    if (viewFilter === 'unmapped') return r.candidates.length === 0;
    return true;
  });

  const mappedCount = results.filter(r => r.candidates.length > 0).length;
  const unmappedCount = results.filter(r => r.candidates.length === 0).length;
  const selectableCount = filteredResults.filter(r => r.candidates.length > 0).length;
  const allSelected = selectableCount > 0 && filteredResults.filter(r => r.candidates.length > 0).every(r => selections.has(r.filamentId));

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-card/50 border-border/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Discover &amp; Map Amazon Products
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Browse all filaments for a brand and map them to Amazon listings.
            Uses AI-powered search to find matching products across all Amazon regions.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-72">
                <SelectValue placeholder="Select a brand..." />
              </SelectTrigger>
              <SelectContent>
                {brands?.map((b) => (
                  <SelectItem key={b.vendor} value={b.vendor}>
                    <span className="flex items-center gap-2">
                      {b.vendor}
                      <span className="text-xs text-muted-foreground">({b.total})</span>
                      {b.withLinks > 0 && (
                        <span className="text-xs text-green-400">{b.withLinks} linked</span>
                      )}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMarketplace} onValueChange={setSelectedMarketplace}>
              <SelectTrigger className="w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MARKETPLACES.map(mp => (
                  <SelectItem key={mp.value} value={mp.value}>{mp.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handleDiscover} disabled={!selectedBrand || isDiscovering}>
              {isDiscovering ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Search className="h-4 w-4 mr-2" />}
              Discover Products
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <>
          {/* Stats & Controls Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h3 className="text-lg font-semibold">
                {results.length} Filaments
              </h3>

              {/* View Filter Tabs */}
              <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
                <Button
                  variant={viewFilter === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewFilter('all')}
                >
                  All ({results.length})
                </Button>
                <Button
                  variant={viewFilter === 'mapped' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewFilter('mapped')}
                >
                  Mapped ({mappedCount})
                </Button>
                <Button
                  variant={viewFilter === 'unmapped' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setViewFilter('unmapped')}
                >
                  Unmapped ({unmappedCount})
                </Button>
              </div>

              {selectableCount > 0 && (
                <Button variant="outline" size="sm" onClick={handleSelectAll} className="gap-2">
                  {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                  {allSelected ? 'Deselect All' : 'Select All Mapped'}
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Batch AI Search button */}
              {unmappedCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleBatchSearch}
                  disabled={isBatchSearching}
                  className="gap-2"
                >
                  {isBatchSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Searching {batchSearchProgress?.done}/{batchSearchProgress?.total}...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      <Globe className="h-4 w-4 -ml-1" />
                      Search All Unmapped ({unmappedCount})
                    </>
                  )}
                </Button>
              )}

              <Button
                onClick={handleImport}
                disabled={selections.size === 0 || isImporting}
                className="gap-2"
              >
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Import {selections.size} Selected
              </Button>
            </div>
          </div>

          {/* Batch search progress bar */}
          {isBatchSearching && batchSearchProgress && (
            <div className="w-full bg-muted/30 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${(batchSearchProgress.done / batchSearchProgress.total) * 100}%` }}
              />
            </div>
          )}

          <div className="space-y-3">
            {filteredResults.map(result => {
              const isSearching = searchingFilaments.has(result.filamentId);

              return (
                <Card key={result.filamentId} className="bg-card/50 border-border/50">
                  <CardHeader className="py-3 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span>{result.filamentName}</span>
                      {isSearching && (
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 ml-auto text-[10px] gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Searching...
                        </Badge>
                      )}
                      {!isSearching && result.candidates.length > 0 && (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30 ml-auto text-[10px]">
                          {result.candidates.length} match{result.candidates.length > 1 ? 'es' : ''}
                        </Badge>
                      )}
                      {!isSearching && result.candidates.length === 0 && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 ml-auto text-[10px]">
                          Unmapped
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-2">
                    {/* Candidates */}
                    {result.candidates.map(candidate => {
                      const isSelected = selections.get(result.filamentId)?.asin === candidate.asin;
                      return (
                        <div
                          key={`${candidate.asin}-${candidate.url}`}
                          className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                            isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border/50 hover:border-border'
                          }`}
                          onClick={() => handleToggleSelection(result.filamentId, candidate)}
                        >
                          <Checkbox checked={isSelected} className="mt-1" />

                          {candidate.imageUrl && (
                            <img
                              src={candidate.imageUrl}
                              alt=""
                              className="w-12 h-12 object-contain rounded bg-white/5"
                            />
                          )}

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{candidate.title}</p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                              <span className="font-mono">{candidate.asin}</span>
                              {candidate.price != null && (
                                <span className="font-semibold text-foreground">
                                  {candidate.currency === 'USD' ? '$' :
                                   candidate.currency === 'GBP' ? '£' :
                                   candidate.currency === 'EUR' ? '€' :
                                   candidate.currency === 'JPY' ? '¥' :
                                   candidate.currency === 'CAD' ? 'C$' :
                                   candidate.currency === 'AUD' ? 'A$' :
                                   candidate.currency}
                                  {candidate.price.toFixed(2)}
                                </span>
                              )}
                              {candidate.rating != null && (
                                <span className="flex items-center gap-0.5">
                                  <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                  {candidate.rating} ({candidate.reviewCount?.toLocaleString()})
                                </span>
                              )}
                            </div>
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {candidate.matchReasons.map((r, i) => (
                                <Badge key={i} variant="outline" className="text-[10px] px-1 py-0">{r}</Badge>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {getConfidenceBadge(candidate.confidenceLabel)}
                            <a
                              href={candidate.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </div>
                        </div>
                      );
                    })}

                    {/* Unmapped: Search + Manual URL */}
                    {result.candidates.length === 0 && !isSearching && (
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs shrink-0"
                          disabled={isBatchSearching}
                          onClick={() => handleSearchFilament(result.filamentId, result.filamentName)}
                        >
                          <Zap className="h-3 w-3" />
                          Search Amazon
                        </Button>
                        <div className="flex-1 relative">
                          <Link className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input
                            placeholder="Or paste Amazon product URL..."
                            className="pl-8 h-8 text-xs"
                            value={manualUrls.get(result.filamentId) || ''}
                            onChange={e => handleManualUrlChange(result.filamentId, e.target.value)}
                            onClick={e => e.stopPropagation()}
                          />
                        </div>
                        {manualUrls.get(result.filamentId) && !extractAsinFromUrl(manualUrls.get(result.filamentId) || '') && (
                          <span className="text-xs text-red-400 shrink-0">Invalid URL</span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
