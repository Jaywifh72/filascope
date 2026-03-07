import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Wand2, ChevronDown, Loader2, CheckCircle2, XCircle, AlertTriangle, Trash2, Zap, Settings2, Info, Ban, Sparkles, Filter, BookOpen, Copy, Check, Layers } from "lucide-react";
import { useBrandSyncManager } from "@/hooks/useBrandSyncManager";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Slider } from "@/components/ui/slider";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { PostSyncCheckPanel } from "./PostSyncCheckPanel";
import { BRAND_SYNC_DOCS, SHARED_FILTER_RULES } from "@/config/brand-sync-docs";

// Brands with custom enrichment defaults files in _shared/
const BRANDS_WITH_CUSTOM_DEFAULTS = [
  '3dfuel', '3dhojor', '3dxtech', 'amolen', 'anycubic', 'atomic', 'azurefilm',
  'bambulab', 'colorfabb', 'creality', 'duramic', 'elegoo', 'eryone', 'esun',
  'extrudr', 'fiberlogy', 'fillamentum', 'formfutura', 'fusion-filaments',
  'geeetech', 'gizmodorks', 'hatchbox', 'ic3d', 'kingroon', 'matter3d',
  'ninjatek', 'numakers', 'overture', 'paramount', 'polymaker', 'protopasta',
  'prusament', 'pushplastic', 'recreus', 'sirayatech', 'sovol', 'spectrum',
  'sunlu', 'treed', 'ultimaker', 'voxelpla', 'yousu', 'ziro',
];

// Onboarding constants
const PROMPT_TEMPLATE = `## [Brand Name] Integration Request

### Platform Context
- **Website URL**: https://[brand].com
- **Platform**: [Shopify/BigCommerce/WooCommerce/OpenCart/Odoo/Custom]
- **Region**: [US/EU/Global]
- **Currency**: [USD/EUR/GBP]
- **Database Slug**: [brand-slug]

### Attached CSV Data
- **CSV Uploaded**: ✅ [filename.csv]
- **Total Products**: [X] color variants
- **Product Lines**: [Y] material groups

### Product Line Structure
| Material | Count | Finish Type |
|----------|-------|-------------|
| PLA | 26 | Standard |
| PLA Silk | 12 | Silk |
| PETG | 15 | Standard |

### Brand Characteristics
- **Specialty Finishes**: [Silk, Matte, Galaxy, Glow, etc.]
- **High-Speed Variants**: [Yes/No]
- **Abrasive Materials**: [Yes/No - list CF/GF variants]
- **TDS Documents**: [Available/Not Available]
- **Image Architecture**: [Shared per line / Unique per color]

### Required Implementation
1. Create \`[brand]-seed.ts\` with CSV data
2. Create \`[brand]-defaults.ts\` with enrichment logic
3. Update \`sync-[brand]-products/index.ts\`
4. Add to \`brand-sync-config.ts\`
5. Add Post Sync Check customizations`;

const CSV_FORMAT_EXAMPLE = `material,title,color,hexCode,productUrl,imageUrl,price,finish
PLA,PLA Standard,White,#FFFFFF,https://brand.com/pla?v=white,https://cdn.brand.com/pla-white.jpg,19.99,Standard
PLA Silk,PLA Silk,Gold,#FFD700,https://brand.com/pla-silk?v=gold,https://cdn.brand.com/silk-gold.jpg,24.99,Silk`;

const CSV_SEEDED_BRANDS = [
  { name: 'Eryone', slug: 'eryone', products: 420 },
  { name: 'FormFutura', slug: 'formfutura', products: 460 },
  { name: 'Fiberlogy', slug: 'fiberlogy', products: 274 },
  { name: 'Fillamentum', slug: 'fillamentum', products: 194 },
  { name: 'Geeetech', slug: 'geeetech', products: 168 },
  { name: 'Gizmo Dorks', slug: 'gizmo-dorks', products: 131 },
  { name: 'Extrudr', slug: 'extrudr', products: 131 },
  { name: 'Fusion', slug: 'fusion-filaments', products: 123 },
  { name: 'Creality', slug: 'creality', products: 122 },
];

interface Brand {
  id: string;
  brand_slug: string;
  brand_name: string;
  display_name: string;
  platform_type: string;
  product_count: number | null;
  last_scrape_at: string | null;
  scraping_enabled: boolean;
}

export function BrandSyncManager() {
  const [selectedBrandSlug, setSelectedBrandSlug] = useState<string>("");
  const [dryRun, setDryRun] = useState(true);
  const [cleanSlate, setCleanSlate] = useState(false);
  const [materialFilter, setMaterialFilter] = useState("");
  const [limit, setLimit] = useState<number>(500);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [syncDocsOpen, setSyncDocsOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [filamentDetailsOpen, setFilamentDetailsOpen] = useState(false);

  const {
    executeSync,
    deleteAllProducts,
    detectSyncFunction,
    hasBrandSpecificFunction,
    isLoading,
    isDeleting,
    progress,
    result,
    error,
    reset,
  } = useBrandSyncManager();

  // Fetch all brands
  const { data: brands = [], isLoading: brandsLoading } = useQuery({
    queryKey: ['automated-brands-for-sync'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automated_brands')
        .select('id, brand_slug, brand_name, display_name, platform_type, product_count, last_scrape_at, scraping_enabled')
        .eq('scraping_enabled', true)
        .order('display_name');
      
      if (error) throw error;
      return data as Brand[];
    },
  });

  const selectedBrand = brands.find(b => b.brand_slug === selectedBrandSlug);
  const syncType = selectedBrandSlug ? detectSyncFunction(selectedBrandSlug) : null;

  // Fetch filament counts by material for selected brand
  const { data: filamentDetails } = useQuery({
    queryKey: ['filament-details', selectedBrand?.brand_name],
    queryFn: async () => {
      if (!selectedBrand?.brand_name) return null;
      
      const { data, error } = await supabase
        .from('filaments')
        .select('material')
        .ilike('vendor', selectedBrand.brand_name);
      
      if (error) throw error;
      
      // Aggregate counts by material
      const materialCounts: Record<string, number> = {};
      data?.forEach(f => {
        const mat = f.material || 'Unknown';
        materialCounts[mat] = (materialCounts[mat] || 0) + 1;
      });
      
      // Sort by count descending
      const sorted = Object.entries(materialCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([material, count]) => ({ material, count }));
      
      return {
        byMaterial: sorted,
        total: data?.length || 0
      };
    },
    enabled: !!selectedBrand?.brand_name,
  });

  const handleSync = async () => {
    if (!selectedBrand) return;
    
    await executeSync({
      brandSlug: selectedBrand.brand_slug,
      brandName: selectedBrand.brand_name,
      dryRun,
      cleanSlate,
      materialFilter: materialFilter || undefined,
      limit,
    });
  };

  const handleDeleteOnly = async () => {
    if (!selectedBrand) return;
    await deleteAllProducts(selectedBrand.brand_name);
  };

  const getSyncTypeBadge = () => {
    if (!syncType) return null;
    
    switch (syncType) {
      case 'specific':
        return (
          <Badge variant="default" className="bg-green-600">
            <Zap className="w-3 h-3 mr-1" />
            High-Fidelity Pipeline
          </Badge>
        );
      case 'special':
        return (
          <Badge variant="secondary" className="bg-blue-600 text-white">
            <Settings2 className="w-3 h-3 mr-1" />
            Dedicated Tab
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            Generic Sync
          </Badge>
        );
    }
  };

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          <CardTitle>Brand Sync Manager</CardTitle>
        </div>
        <CardDescription className="flex items-center justify-between">
          <span>Execute high-fidelity sync pipelines for any brand. Brands with dedicated sync functions will use optimized enrichment.</span>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="ml-3 shrink-0 cursor-help">
                  {brands.filter(b => BRANDS_WITH_CUSTOM_DEFAULTS.includes(b.brand_slug)).length}/{brands.length} full enrichment
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p>Full = custom enrichment with known print settings and TDS patterns. Generic = fallback temperature defaults only.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Onboarding Section */}
        <Collapsible open={onboardingOpen} onOpenChange={setOnboardingOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 w-full justify-start border-dashed">
              <ChevronDown className={`w-4 h-4 transition-transform ${onboardingOpen ? 'rotate-180' : ''}`} />
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-medium">Onboarding: Add a New Brand</span>
              <Badge variant="secondary" className="ml-auto">Template</Badge>
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-4">
            <div className="bg-muted/30 rounded-lg p-4 space-y-6 text-sm border">
              {/* Prompt Template */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                    Ideal Prompt Template
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(PROMPT_TEMPLATE);
                      setCopiedSection('prompt');
                      setTimeout(() => setCopiedSection(null), 2000);
                    }}
                  >
                    {copiedSection === 'prompt' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copiedSection === 'prompt' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <pre className="bg-background rounded-md p-3 text-xs overflow-x-auto whitespace-pre-wrap font-mono border">
{PROMPT_TEMPLATE}
                </pre>
              </div>

              {/* CSV Format */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold flex items-center gap-2">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                    Ideal CSV Format
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => {
                      navigator.clipboard.writeText(CSV_FORMAT_EXAMPLE);
                      setCopiedSection('csv');
                      setTimeout(() => setCopiedSection(null), 2000);
                    }}
                  >
                    {copiedSection === 'csv' ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                    {copiedSection === 'csv' ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Required Columns</h5>
                    <ul className="space-y-1 text-xs">
                      <li><code className="bg-muted px-1 rounded">material</code> - PLA, PETG, ABS</li>
                      <li><code className="bg-muted px-1 rounded">title</code> - Product display name</li>
                      <li><code className="bg-muted px-1 rounded">color</code> - Color variant name</li>
                      <li><code className="bg-muted px-1 rounded">productUrl</code> - Full URL</li>
                      <li><code className="bg-muted px-1 rounded">imageUrl</code> - CDN image URL</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">Recommended Columns</h5>
                    <ul className="space-y-1 text-xs">
                      <li><code className="bg-muted px-1 rounded">hexCode</code> - #RRGGBB format</li>
                      <li><code className="bg-muted px-1 rounded">price</code> - Numeric value</li>
                      <li><code className="bg-muted px-1 rounded">finish</code> - Silk, Matte, etc.</li>
                      <li><code className="bg-muted px-1 rounded">sku</code> - Product SKU/MPN</li>
                    </ul>
                  </div>
                </div>
                <pre className="bg-background rounded-md p-3 text-xs overflow-x-auto font-mono border">
{CSV_FORMAT_EXAMPLE}
                </pre>
              </div>

              {/* Current Brands Reference */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                  Current CSV-Seeded Brands
                </h4>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {CSV_SEEDED_BRANDS.map((brand) => (
                    <div key={brand.slug} className="bg-background rounded p-2 border flex justify-between items-center">
                      <span className="font-medium">{brand.name}</span>
                      <Badge variant="outline" className="text-xs">{brand.products}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Tips */}
              <div className="space-y-2 pt-3 border-t">
                <h4 className="font-semibold text-xs text-muted-foreground">Quick Tips</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• <strong>One row per color variant</strong> — Essential for color swatches</li>
                  <li>• <strong>Include hex codes</strong> — Reduces reliance on color mapping</li>
                  <li>• <strong>Full product URLs</strong> — Include variant IDs where applicable</li>
                  <li>• <strong>Reference: Eryone</strong> — Gold standard with 420 products, 54 lines</li>
                </ul>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Brand Selector */}
        <div className="space-y-2">
          <Label>Select Brand</Label>
          <div className="flex items-center gap-3">
            <Select 
              value={selectedBrandSlug} 
              onValueChange={(value) => {
                setSelectedBrandSlug(value);
                reset();
              }}
              disabled={brandsLoading}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Choose a brand to sync..." />
              </SelectTrigger>
              <SelectContent>
                {brands.map((brand) => (
                  <SelectItem key={brand.id} value={brand.brand_slug}>
                    <div className="flex items-center gap-2">
                      <span>{brand.display_name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({brand.platform_type})
                      </span>
                      {hasBrandSpecificFunction(brand.brand_slug) && (
                        <Zap className="w-3 h-3 text-green-500" />
                      )}
                      {BRANDS_WITH_CUSTOM_DEFAULTS.includes(brand.brand_slug) ? (
                        <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-green-600 hover:bg-green-600">Full</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 text-yellow-600 border-yellow-500">Generic</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {getSyncTypeBadge()}
          </div>
        </div>

        {/* Brand Info */}
        {selectedBrand && (
          <div className="flex items-center gap-6 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            <div>
              <span className="font-medium">Platform:</span> {selectedBrand.platform_type}
            </div>
            <div>
              <span className="font-medium">Products:</span> {selectedBrand.product_count || 0}
            </div>
            <div>
              <span className="font-medium">Last Sync:</span> {formatLastSync(selectedBrand.last_scrape_at)}
            </div>
          </div>
        )}

        {/* Filament Details Section */}
        {selectedBrand && filamentDetails && (
          <Collapsible open={filamentDetailsOpen} onOpenChange={setFilamentDetailsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 w-full justify-start">
                <ChevronDown className={`w-4 h-4 transition-transform ${filamentDetailsOpen ? 'rotate-180' : ''}`} />
                <Layers className="w-4 h-4" />
                <span>Filament Details</span>
                <Badge variant="secondary" className="ml-2">
                  {filamentDetails.total} total
                </Badge>
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <div className="bg-muted/30 rounded-lg p-4 space-y-3 text-sm">
                {/* Grand Total */}
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="font-semibold">Total Filaments</span>
                  <span className="text-lg font-bold">{filamentDetails.total}</span>
                </div>
                
                {/* Material Breakdown Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2">
                  {filamentDetails.byMaterial.map(({ material, count }) => (
                    <div key={material} className="bg-background rounded p-2 border text-center">
                      <div className="font-medium text-xs truncate" title={material}>
                        {material}
                      </div>
                      <div className="text-lg font-semibold tabular-nums">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Brand-Specific Sync Logic Documentation */}
        {selectedBrand && (
          <Collapsible open={syncDocsOpen} onOpenChange={setSyncDocsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 w-full justify-start">
                <ChevronDown className={`w-4 h-4 transition-transform ${syncDocsOpen ? 'rotate-180' : ''}`} />
                <Info className="w-4 h-4" />
                <span>Sync Logic Notes</span>
                {BRAND_SYNC_DOCS[selectedBrandSlug]?.exclusions && (
                  <Badge variant="destructive" className="ml-2">
                    {BRAND_SYNC_DOCS[selectedBrandSlug].exclusions!.length} exclusions
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3 space-y-4">
              <div className="bg-muted/30 rounded-lg p-4 space-y-4 text-sm">
                {/* Brand-Specific Exclusions */}
                {BRAND_SYNC_DOCS[selectedBrandSlug]?.exclusions && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-destructive">
                      <Ban className="w-4 h-4" />
                      Product Exclusions
                    </h4>
                    <div className="space-y-1.5 ml-6">
                      {BRAND_SYNC_DOCS[selectedBrandSlug].exclusions!.map((e) => (
                        <div key={e.name} className="flex items-start gap-2">
                          <XCircle className="w-3.5 h-3.5 text-destructive mt-0.5 shrink-0" />
                          <div>
                            <span className="font-medium">{e.name}</span>
                            <span className="text-muted-foreground"> — {e.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brand-Specific Behaviors */}
                {BRAND_SYNC_DOCS[selectedBrandSlug]?.specialBehaviors && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2 text-blue-500">
                      <Sparkles className="w-4 h-4" />
                      Special Behaviors
                    </h4>
                    <div className="space-y-1.5 ml-6">
                      {BRAND_SYNC_DOCS[selectedBrandSlug].specialBehaviors!.map((b) => (
                        <div key={b.name} className="flex items-start gap-2">
                          <Zap className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                          <div>
                            <span className="font-medium">{b.name}</span>
                            <span className="text-muted-foreground"> — {b.description}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brand-Specific Notes */}
                {BRAND_SYNC_DOCS[selectedBrandSlug]?.notes && (
                  <div className="space-y-1.5 ml-6 text-muted-foreground">
                    {BRAND_SYNC_DOCS[selectedBrandSlug].notes!.map((note, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-xs">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* No docs available */}
                {!BRAND_SYNC_DOCS[selectedBrandSlug] && (
                  <p className="text-muted-foreground italic">No brand-specific documentation available.</p>
                )}

                {/* Shared Filter Rules - Always shown */}
                <div className="space-y-2 pt-3 border-t border-border">
                  <h4 className="font-medium flex items-center gap-2 text-muted-foreground">
                    <Filter className="w-4 h-4" />
                    Standard Filters (All Brands)
                  </h4>
                  <div className="space-y-1 ml-6 text-muted-foreground">
                    {SHARED_FILTER_RULES.map((rule) => (
                      <div key={rule.name} className="flex items-start gap-2">
                        <span className="text-xs">•</span>
                        <span><span className="font-medium">{rule.name}:</span> {rule.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Basic Options */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch
              id="dry-run"
              checked={dryRun}
              onCheckedChange={setDryRun}
            />
            <Label htmlFor="dry-run" className="cursor-pointer">
              Dry Run
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="clean-slate"
              checked={cleanSlate}
              onCheckedChange={setCleanSlate}
            />
            <Label htmlFor="clean-slate" className="cursor-pointer text-destructive">
              Clean Slate (Delete First)
            </Label>
          </div>
        </div>

        {/* Advanced Options */}
        <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <ChevronDown className={`w-4 h-4 transition-transform ${advancedOpen ? 'rotate-180' : ''}`} />
              Advanced Options
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Material Filter</Label>
                <Input
                  placeholder="e.g., PLA, PETG"
                  value={materialFilter}
                  onChange={(e) => setMaterialFilter(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Product Limit: {limit}</Label>
                <Slider
                  value={[limit]}
                  onValueChange={([val]) => setLimit(val)}
                  min={10}
                  max={500}
                  step={10}
                />
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleSync}
            disabled={!selectedBrandSlug || isLoading || isDeleting || syncType === 'special'}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Execute Sync
              </>
            )}
          </Button>
          
          <Button
            variant="destructive"
            onClick={handleDeleteOnly}
            disabled={!selectedBrandSlug || isLoading || isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            Delete Products Only
          </Button>
        </div>

        {/* Special Brand Warning */}
        {syncType === 'special' && (
          <div className="flex items-center gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-blue-500" />
            <span>
              {selectedBrandSlug === 'bambu-lab' 
                ? 'Bambu Lab has a dedicated sync tab with material selection and queue support.'
                : 'Elegoo has a dedicated sync tab with region selection and catalog discovery.'}
            </span>
          </div>
        )}

        {/* Progress */}
        {progress && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border">
            {/* Header with stage */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="font-medium">{progress.stage}</span>
              </div>
              {/* Only show percentage when we have real progress data */}
              {progress.isRealProgress && progress.total > 0 && (
                <Badge variant="secondary" className="tabular-nums">
                  {Math.round((progress.current / progress.total) * 100)}%
                </Badge>
              )}
            </div>
            
            {/* Progress bar - indeterminate when no real data */}
            <div className="space-y-1">
              {progress.isRealProgress && progress.total > 0 ? (
                <>
                  <Progress 
                    value={Math.round((progress.current / progress.total) * 100)} 
                    className="h-3" 
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{progress.current} of {progress.total} products</span>
                    <span>{progress.total - progress.current} remaining</span>
                  </div>
                </>
              ) : (
                <>
                  {/* Indeterminate progress - animated sliding effect */}
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full w-1/3 bg-primary rounded-full animate-indeterminate" />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Processing products...</span>
                    <span className="animate-pulse">Please wait</span>
                  </div>
                </>
              )}
            </div>
            
            {/* Current operation message */}
            {progress.message && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-background/50 rounded px-3 py-2">
                <span className="truncate">{progress.message}</span>
              </div>
            )}
            
            {/* Live stats grid - only when we have real data */}
            {progress.isRealProgress && (progress.productsProcessed !== undefined || progress.variantsFound !== undefined || 
              progress.created !== undefined || progress.updated !== undefined || progress.errors !== undefined) && (
              <div className="grid grid-cols-5 gap-2 pt-2 border-t">
                {progress.productsProcessed !== undefined && (
                  <div className="text-center p-2 bg-background/50 rounded">
                    <div className="text-lg font-semibold tabular-nums">{progress.productsProcessed}</div>
                    <div className="text-xs text-muted-foreground">Processed</div>
                  </div>
                )}
                {progress.variantsFound !== undefined && (
                  <div className="text-center p-2 bg-background/50 rounded">
                    <div className="text-lg font-semibold tabular-nums">{progress.variantsFound}</div>
                    <div className="text-xs text-muted-foreground">Variants</div>
                  </div>
                )}
                {progress.created !== undefined && (
                  <div className="text-center p-2 bg-green-500/10 rounded">
                    <div className="text-lg font-semibold tabular-nums text-green-600">{progress.created}</div>
                    <div className="text-xs text-green-600/80">Created</div>
                  </div>
                )}
                {progress.updated !== undefined && (
                  <div className="text-center p-2 bg-blue-500/10 rounded">
                    <div className="text-lg font-semibold tabular-nums text-blue-600">{progress.updated}</div>
                    <div className="text-xs text-blue-600/80">Updated</div>
                  </div>
                )}
                {progress.errors !== undefined && (
                  <div className="text-center p-2 bg-destructive/10 rounded">
                    <div className="text-lg font-semibold tabular-nums text-destructive">{progress.errors}</div>
                    <div className="text-xs text-destructive/80">Errors</div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className={`p-4 rounded-lg border ${result.success ? 'bg-green-500/10 border-green-500/20' : 'bg-destructive/10 border-destructive/20'}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                ) : (
                  <XCircle className="w-6 h-6 text-destructive" />
                )}
                <div>
                  <span className="font-semibold text-lg">
                    {result.success ? 'Sync Completed Successfully' : 'Sync Failed'}
                  </span>
                  {result.summary && (
                    <p className="text-sm text-muted-foreground">
                      {(result.summary.created || 0) + (result.summary.updated || 0)} products synced
                      {result.summary.total && ` of ${result.summary.total} discovered`}
                    </p>
                  )}
                </div>
              </div>
              {result.duration_ms != null && (
                <Badge variant="outline" className="tabular-nums">
                  {(result.duration_ms / 1000).toFixed(1)}s
                </Badge>
              )}
            </div>
            
            {/* Summary Stats */}
            {result.summary && (
              <div className="grid grid-cols-5 gap-3 mb-4">
                {result.summary.total !== undefined && (
                  <div className="text-center p-3 bg-background/50 rounded-lg border">
                    <div className="text-2xl font-bold tabular-nums">{result.summary.total}</div>
                    <div className="text-xs text-muted-foreground">Discovered</div>
                  </div>
                )}
                <div className="text-center p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <div className="text-2xl font-bold tabular-nums text-green-600">{result.summary.created || 0}</div>
                  <div className="text-xs text-green-600/80">Created</div>
                </div>
                <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                  <div className="text-2xl font-bold tabular-nums text-blue-600">{result.summary.updated || 0}</div>
                  <div className="text-xs text-blue-600/80">Updated</div>
                </div>
                <div className="text-center p-3 bg-muted/50 rounded-lg border">
                  <div className="text-2xl font-bold tabular-nums text-muted-foreground">{result.summary.skipped || 0}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="text-center p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                  <div className="text-2xl font-bold tabular-nums text-destructive">{result.summary.errors || 0}</div>
                  <div className="text-xs text-destructive/80">Errors</div>
                </div>
              </div>
            )}

            {/* Success Rate Bar */}
            {result.summary && (result.summary.total || (result.summary.created || 0) + (result.summary.updated || 0) + (result.summary.skipped || 0) + (result.summary.errors || 0)) > 0 && (
              <div className="mb-4 space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Success Rate</span>
                  <span>
                    {(() => {
                      const total = result.summary.total || ((result.summary.created || 0) + (result.summary.updated || 0) + (result.summary.skipped || 0) + (result.summary.errors || 0));
                      const success = (result.summary.created || 0) + (result.summary.updated || 0);
                      return total > 0 ? `${Math.round((success / total) * 100)}%` : '0%';
                    })()}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden flex">
                  {(() => {
                    const total = result.summary.total || ((result.summary.created || 0) + (result.summary.updated || 0) + (result.summary.skipped || 0) + (result.summary.errors || 0));
                    const created = result.summary.created || 0;
                    const updated = result.summary.updated || 0;
                    const skipped = result.summary.skipped || 0;
                    const errors = result.summary.errors || 0;
                    return (
                      <>
                        {created > 0 && <div className="h-full bg-green-500" style={{ width: `${(created / total) * 100}%` }} />}
                        {updated > 0 && <div className="h-full bg-blue-500" style={{ width: `${(updated / total) * 100}%` }} />}
                        {skipped > 0 && <div className="h-full bg-muted-foreground/30" style={{ width: `${(skipped / total) * 100}%` }} />}
                        {errors > 0 && <div className="h-full bg-destructive" style={{ width: `${(errors / total) * 100}%` }} />}
                      </>
                    );
                  })()}
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-green-500 rounded-full"></span> Created</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Updated</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-muted-foreground/30 rounded-full"></span> Skipped</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 bg-destructive rounded-full"></span> Errors</span>
                </div>
              </div>
            )}

            {/* Field Coverage */}
            {result.fieldCoverage && Object.keys(result.fieldCoverage).length > 0 && (
              <div className="pt-4 border-t border-border space-y-3">
                <div className="text-sm font-medium">Field Coverage</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(result.fieldCoverage).map(([field, value]) => {
                    let percent: number;
                    let count: number | undefined;
                    if (typeof value === 'number') {
                      percent = value;
                    } else if (value && typeof value === 'object' && 'percent' in value) {
                      percent = (value as { percent: number; count?: number }).percent;
                      count = (value as { count?: number }).count;
                    } else {
                      percent = 0;
                    }
                    const colorClass = percent >= 90 ? 'text-green-600' : percent >= 70 ? 'text-yellow-600' : 'text-destructive';
                    return (
                      <div key={field} className="flex items-center justify-between p-2 bg-background/50 rounded border">
                        <span className="text-sm capitalize">{field}</span>
                        <div className="flex items-center gap-2">
                          {count !== undefined && (
                            <span className="text-xs text-muted-foreground">{count}</span>
                          )}
                          <Badge variant="outline" className={`tabular-nums ${colorClass}`}>
                            {percent}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {result.message && !result.summary && (
              <p className="text-sm text-muted-foreground mt-2">{result.message}</p>
            )}
          </div>
        )}

        {/* Timeout Warning */}
        {result?.timedOut && (
          <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-sm">
            <AlertTriangle className="w-4 h-4 text-yellow-500" />
            <span>
              The sync request timed out on the client side but likely completed in the background. 
              Run <strong>Post Sync Check</strong> below to verify the data.
            </span>
          </div>
        )}

        {/* Post Sync Check - always visible when brand is selected */}
        {selectedBrand && (
          <PostSyncCheckPanel 
            brandSlug={selectedBrand.brand_slug}
            brandName={selectedBrand.brand_name}
            disabled={isLoading}
          />
        )}

        {/* Error */}
        {error && !result && (
          <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
            <XCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
