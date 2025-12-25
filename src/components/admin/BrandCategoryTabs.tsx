import { useState, useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Search, ChevronDown, Store, Globe, ShoppingCart, Package, Flame, Star } from "lucide-react";
import { BrandSyncPanel } from "./BrandSyncPanel";
import { useAllBrandsDataQuality } from "@/hooks/useBrandDataQuality";

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  shopify: Store,
  woocommerce: ShoppingCart,
  bigcommerce: Package,
  amazon: ShoppingCart,
  firecrawl: Flame,
};

const PLATFORM_LABELS: Record<string, string> = {
  shopify: 'Shopify',
  woocommerce: 'WooCommerce',
  bigcommerce: 'BigCommerce',
  amazon: 'Amazon',
  firecrawl: 'Firecrawl',
};

const FEATURED_BRANDS = ['bambu-lab', 'elegoo'];

export function BrandCategoryTabs() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPlatforms, setExpandedPlatforms] = useState<Set<string>>(new Set(['shopify']));
  const { data: brands, isLoading, refetch } = useAllBrandsDataQuality();

  const filteredBrands = useMemo(() => {
    if (!brands) return [];
    if (!searchQuery.trim()) return brands;
    
    const query = searchQuery.toLowerCase();
    return brands.filter(b => 
      b.brand_name.toLowerCase().includes(query) ||
      b.display_name.toLowerCase().includes(query)
    );
  }, [brands, searchQuery]);

  const brandsByPlatform = useMemo(() => {
    const grouped: Record<string, typeof filteredBrands> = {};
    filteredBrands.forEach(brand => {
      const platform = brand.platform_type || 'other';
      if (!grouped[platform]) grouped[platform] = [];
      grouped[platform].push(brand);
    });
    return grouped;
  }, [filteredBrands]);

  const featuredBrands = useMemo(() => {
    return filteredBrands.filter(b => FEATURED_BRANDS.includes(b.brand_slug));
  }, [filteredBrands]);

  const togglePlatform = (platform: string) => {
    setExpandedPlatforms(prev => {
      const next = new Set(prev);
      if (next.has(platform)) {
        next.delete(platform);
      } else {
        next.add(platform);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-pulse text-muted-foreground">Loading brands...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search brands..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="all" className="gap-1">
            <Globe className="w-4 h-4" />
            All ({brands?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="featured" className="gap-1">
            <Star className="w-4 h-4" />
            Featured
          </TabsTrigger>
          {Object.entries(brandsByPlatform).map(([platform, platformBrands]) => {
            const Icon = PLATFORM_ICONS[platform] || Globe;
            return (
              <TabsTrigger key={platform} value={platform} className="gap-1">
                <Icon className="w-4 h-4" />
                {PLATFORM_LABELS[platform] || platform} ({platformBrands.length})
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* All Brands - Grouped by Platform */}
        <TabsContent value="all" className="mt-4">
          <ScrollArea className="h-[600px] pr-4">
            <div className="space-y-4">
              {Object.entries(brandsByPlatform).map(([platform, platformBrands]) => {
                const Icon = PLATFORM_ICONS[platform] || Globe;
                const isExpanded = expandedPlatforms.has(platform);

                return (
                  <Collapsible
                    key={platform}
                    open={isExpanded}
                    onOpenChange={() => togglePlatform(platform)}
                  >
                    <CollapsibleTrigger className="flex items-center justify-between w-full p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <div className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{PLATFORM_LABELS[platform] || platform}</span>
                        <Badge variant="secondary">{platformBrands.length}</Badge>
                      </div>
                      <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-3">
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {platformBrands.map(brand => (
                          <BrandSyncPanel
                            key={brand.brand_slug}
                            brand={brand}
                            onSyncComplete={() => refetch()}
                          />
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Featured Brands */}
        <TabsContent value="featured" className="mt-4">
          <div className="grid gap-4 md:grid-cols-2">
            {featuredBrands.map(brand => (
              <BrandSyncPanel
                key={brand.brand_slug}
                brand={brand}
                onSyncComplete={() => refetch()}
              />
            ))}
          </div>
        </TabsContent>

        {/* Platform-Specific Tabs */}
        {Object.entries(brandsByPlatform).map(([platform, platformBrands]) => (
          <TabsContent key={platform} value={platform} className="mt-4">
            <ScrollArea className="h-[600px] pr-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {platformBrands.map(brand => (
                  <BrandSyncPanel
                    key={brand.brand_slug}
                    brand={brand}
                    onSyncComplete={() => refetch()}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
