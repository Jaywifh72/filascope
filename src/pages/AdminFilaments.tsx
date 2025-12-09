import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Search, Package, ExternalLink, Image as ImageIcon, Trash2, Barcode, Loader2, Tag, Copy, GitBranch, Database, Palette } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type Filament = Tables<"filaments">;

// Helper to get percentage color class
const getPercentageColor = (percent: number): string => {
  if (percent >= 95) return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
  if (percent >= 50) return "bg-orange-500/20 text-orange-400 border-orange-500/30";
  if (percent >= 35) return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/20 text-red-400 border-red-500/30";
};

// Sleek stat card component
const StatCard = ({ label, value, total }: { label: string; value: number; total?: number }) => {
  const percent = total ? Math.round((value / total) * 100) : null;
  
  return (
    <div className="bg-card border rounded-lg p-3 flex flex-col">
      <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex items-end justify-between mt-1">
        <span className="text-xl font-bold tabular-nums">{value.toLocaleString()}</span>
        {percent !== null && (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${getPercentageColor(percent)}`}>
            {percent}%
          </span>
        )}
      </div>
    </div>
  );
};

const AdminFilaments = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilaments, setSelectedFilaments] = useState<Set<string>>(new Set());
  const [scrapingUpcs, setScrapingUpcs] = useState(false);
  const [scrapingMpns, setScrapingMpns] = useState(false);
  const [copyingSkuToMpn, setCopyingSkuToMpn] = useState(false);
  const [derivingIdentifiers, setDerivingIdentifiers] = useState(false);
  const [lookingUpBarcodes, setLookingUpBarcodes] = useState(false);
  const [populatingHexColors, setPopulatingHexColors] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState({ current: 0, total: 0 });
  const [showMissingUpcOnly, setShowMissingUpcOnly] = useState(false);
  const [showMissingSkuOnly, setShowMissingSkuOnly] = useState(false);
  const [showMissingEanOnly, setShowMissingEanOnly] = useState(false);
  const [showMissingGtinOnly, setShowMissingGtinOnly] = useState(false);
  const [showMissingMpnOnly, setShowMissingMpnOnly] = useState(false);
  const [showMissingHexOnly, setShowMissingHexOnly] = useState(false);
  const [vendorFilter, setVendorFilter] = useState<string>("all");

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      navigate("/auth");
    }
  }, [isAdmin, authLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchFilaments();
    }
  }, [isAdmin]);

  const fetchFilaments = async () => {
    setLoading(true);
    
    // Fetch all filaments (bypassing default 1000 row limit)
    let allFilaments: Filament[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;
    
    while (hasMore) {
      const { data, error } = await supabase
        .from("filaments")
        .select("*")
        .order("vendor", { ascending: true })
        .order("product_title", { ascending: true })
        .range(from, from + batchSize - 1);

      if (error) {
        toast.error("Failed to fetch filaments");
        console.error(error);
        break;
      }
      
      if (data && data.length > 0) {
        allFilaments = [...allFilaments, ...data];
        from += batchSize;
        hasMore = data.length === batchSize;
      } else {
        hasMore = false;
      }
    }
    
    setFilaments(allFilaments);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("filaments").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete filament");
      console.error(error);
    } else {
      toast.success("Filament deleted");
      setFilaments((prev) => prev.filter((f) => f.id !== id));
      setSelectedFilaments((prev) => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
    }
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selectedFilaments);
    if (ids.length === 0) return;

    const { error } = await supabase.from("filaments").delete().in("id", ids);
    if (error) {
      toast.error("Failed to delete filaments");
      console.error(error);
    } else {
      toast.success(`Deleted ${ids.length} filaments`);
      setFilaments((prev) => prev.filter((f) => !selectedFilaments.has(f.id)));
      setSelectedFilaments(new Set());
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedFilaments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedFilaments.size === filteredFilaments.length) {
      setSelectedFilaments(new Set());
    } else {
      setSelectedFilaments(new Set(filteredFilaments.map((f) => f.id)));
    }
  };

  // Get unique vendors for dropdown
  const uniqueVendorsList = useMemo(() => {
    return Array.from(new Set(filaments.map((f) => f.vendor).filter(Boolean))).sort() as string[];
  }, [filaments]);

  // Batch size for UPC scraping (edge function max is 25)
  const BATCH_SIZE = 25;

  const handleScrapeSelectedUpcs = async () => {
    const idsToScrape = selectedFilaments.size > 0 
      ? Array.from(selectedFilaments)
      : filteredFilaments.filter(f => !f.upc).map(f => f.id);

    if (idsToScrape.length === 0) {
      toast.error("No filaments to scrape");
      return;
    }

    setScrapingUpcs(true);
    setScrapeProgress({ current: 0, total: idsToScrape.length });
    
    try {
      let totalUpdated = 0;
      let totalSkipped = 0;
      let totalFailed = 0;

      for (let i = 0; i < idsToScrape.length; i += BATCH_SIZE) {
        const batch = idsToScrape.slice(i, i + BATCH_SIZE);
        
        const { data, error } = await supabase.functions.invoke('scrape-filament-upcs', {
          body: { 
            filamentIds: batch,
            forceUpdate: false 
          }
        });

        if (error) {
          console.error(`Error in batch:`, error);
          totalFailed += batch.length;
        } else {
          totalUpdated += data.updated || 0;
          totalSkipped += data.skipped || 0;
          totalFailed += data.failed || 0;
        }

        setScrapeProgress({ current: Math.min(i + BATCH_SIZE, idsToScrape.length), total: idsToScrape.length });
        
        // Small delay between batches
        if (i + BATCH_SIZE < idsToScrape.length) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      toast.success(`Scrape complete: ${totalUpdated} updated, ${totalSkipped} skipped, ${totalFailed} failed`);
      fetchFilaments();
    } catch (error: any) {
      toast.error(error.message || "Failed to scrape UPC codes");
      console.error(error);
    } finally {
      setScrapingUpcs(false);
      setScrapeProgress({ current: 0, total: 0 });
    }
  };

  const handleScrapeMpns = async () => {
    if (vendorFilter === "all") {
      toast.error("Please select a specific vendor to scrape MPNs");
      return;
    }

    setScrapingMpns(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-filament-upcs', {
        body: { brands: [vendorFilter], scrapeMpnOnly: true }
      });

      if (error) {
        throw error;
      }

      toast.success(`MPN scrape complete: ${data.updated || 0} updated, ${data.skipped || 0} skipped`);
      fetchFilaments();
    } catch (error: any) {
      toast.error(error.message || "Failed to scrape MPNs");
      console.error(error);
    } finally {
      setScrapingMpns(false);
    }
  };

  // Bulk copy SKU to MPN for filaments missing MPN
  const handleCopySkuToMpn = async () => {
    setCopyingSkuToMpn(true);
    
    try {
      // Count how many will be affected
      const { count, error: countError } = await supabase
        .from('filaments')
        .select('*', { count: 'exact', head: true })
        .is('mpn', null)
        .not('variant_sku', 'is', null);
      
      if (countError) throw countError;
      
      if (!count || count === 0) {
        toast.info("No filaments found with SKU but missing MPN");
        return;
      }
      
      // Perform the update - fetch IDs first, then update in batches
      const { data: filamentsToCopy, error: fetchError } = await supabase
        .from('filaments')
        .select('id, variant_sku')
        .is('mpn', null)
        .not('variant_sku', 'is', null);
      
      if (fetchError) throw fetchError;
      
      let updated = 0;
      for (const f of filamentsToCopy || []) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ mpn: f.variant_sku })
          .eq('id', f.id);
        
        if (!updateError) updated++;
      }
      
      toast.success(`Copied SKU to MPN for ${updated} filaments`);
      fetchFilaments();
    } catch (error: any) {
      toast.error(error.message || "Failed to copy SKU to MPN");
      console.error(error);
    } finally {
      setCopyingSkuToMpn(false);
    }
  };

  // Derive EAN from 13-digit UPC and GTIN from 14-digit UPC
  const handleDeriveIdentifiers = async () => {
    setDerivingIdentifiers(true);
    
    try {
      // Fetch filaments with UPC but missing EAN or GTIN
      const { data: filamentsWithUpc, error: fetchError } = await supabase
        .from('filaments')
        .select('id, upc, ean, gtin')
        .not('upc', 'is', null);
      
      if (fetchError) throw fetchError;
      
      let eanUpdated = 0;
      let gtinUpdated = 0;
      
      for (const f of filamentsWithUpc || []) {
        const cleanUpc = f.upc?.replace(/[^0-9]/g, '') || '';
        const updates: { ean?: string; gtin?: string } = {};
        
        // 13-digit UPC → EAN (if EAN is missing)
        if (cleanUpc.length === 13 && !f.ean) {
          updates.ean = f.upc;
        }
        
        // 14-digit UPC → GTIN (if GTIN is missing)
        if (cleanUpc.length === 14 && !f.gtin) {
          updates.gtin = f.upc;
        }
        
        if (Object.keys(updates).length > 0) {
          const { error: updateError } = await supabase
            .from('filaments')
            .update(updates)
            .eq('id', f.id);
          
          if (!updateError) {
            if (updates.ean) eanUpdated++;
            if (updates.gtin) gtinUpdated++;
          }
        }
      }
      
      toast.success(`Derived ${eanUpdated} EAN values and ${gtinUpdated} GTIN values from UPC`);
      fetchFilaments();
    } catch (error: any) {
      toast.error(error.message || "Failed to derive identifiers");
      console.error(error);
    } finally {
      setDerivingIdentifiers(false);
    }
  };

  // Lookup barcodes using external database
  const handleLookupBarcodes = async () => {
    // Use selected filaments if any, otherwise use filtered filaments
    const baseFilaments = selectedFilaments.size > 0 
      ? filteredFilaments.filter(f => selectedFilaments.has(f.id))
      : filteredFilaments;
    
    // Filter to filaments that could benefit from barcode lookup
    const targetFilaments = baseFilaments.filter(f => 
      (f.variant_sku || (f as any).mpn) && (!f.upc || !(f as any).ean || !(f as any).gtin)
    );
    
    if (targetFilaments.length === 0) {
      toast.info("No filaments with SKU/MPN missing barcodes in selection");
      return;
    }

    setLookingUpBarcodes(true);
    setScrapeProgress({ current: 0, total: targetFilaments.length });
    
    try {
      const batchSize = 10;
      let totalFound = 0;
      let totalUpdated = 0;
      let totalProcessed = 0;
      
      for (let i = 0; i < targetFilaments.length; i += batchSize) {
        const batch = targetFilaments.slice(i, i + batchSize);
        setScrapeProgress({ current: i, total: targetFilaments.length });
        
        const { data, error } = await supabase.functions.invoke('lookup-barcodes', {
          body: {
            filamentIds: batch.map(f => f.id),
            limit: batchSize,
          }
        });
        
        if (error) {
          console.error('Batch error:', error);
          continue;
        }
        
        if (data?.stats) {
          totalFound += data.stats.found || 0;
          totalUpdated += data.stats.updated || 0;
          totalProcessed += data.stats.processed || 0;
        }
        
        // Rate limit between batches
        if (i + batchSize < targetFilaments.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      toast.success(`Looked up ${totalProcessed} filaments: found ${totalFound} barcodes, updated ${totalUpdated}`);
      fetchFilaments();
    } catch (error: any) {
      toast.error(error.message || "Failed to lookup barcodes");
      console.error(error);
    } finally {
      setLookingUpBarcodes(false);
      setScrapeProgress({ current: 0, total: 0 });
    }
  };

  const handlePopulateHexColors = async () => {
    setPopulatingHexColors(true);
    try {
      const { data, error } = await supabase.functions.invoke('populate-hex-colors', {
        body: { limit: 100, vendor: vendorFilter !== 'all' ? vendorFilter : null, useAI: true }
      });
      
      if (error) throw error;
      
      if (data?.success) {
        toast.success(`Updated ${data.updated} filaments with hex colors`, {
          description: `Dictionary: ${data.by_method?.dictionary || 0}, Pattern: ${data.by_method?.pattern || 0}, AI: ${data.by_method?.ai || 0}`
        });
        fetchFilaments();
      } else {
        throw new Error(data?.error || 'Failed to populate hex colors');
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to populate hex colors");
      console.error(error);
    } finally {
      setPopulatingHexColors(false);
    }
  };

  const filteredFilaments = filaments.filter((f) => {
    const matchesSearch =
      f.product_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.material?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUpcFilter = showMissingUpcOnly ? !f.upc : true;
    const matchesSkuFilter = showMissingSkuOnly ? !f.variant_sku : true;
    const matchesEanFilter = showMissingEanOnly ? !(f as any).ean : true;
    const matchesGtinFilter = showMissingGtinOnly ? !(f as any).gtin : true;
    const matchesMpnFilter = showMissingMpnOnly ? !(f as any).mpn : true;
    const matchesHexFilter = showMissingHexOnly ? !f.color_hex : true;
    const matchesVendor = vendorFilter === "all" || f.vendor === vendorFilter;
    
    return matchesSearch && matchesUpcFilter && matchesSkuFilter && matchesEanFilter && matchesGtinFilter && matchesMpnFilter && matchesHexFilter && matchesVendor;
  });

  // Count for lookup barcodes button
  const lookupBarcodesCount = useMemo(() => {
    const baseFilaments = selectedFilaments.size > 0 
      ? filteredFilaments.filter(f => selectedFilaments.has(f.id))
      : filteredFilaments;
    return baseFilaments.filter(f => 
      (f.variant_sku || (f as any).mpn) && (!f.upc || !(f as any).ean || !(f as any).gtin)
    ).length;
  }, [filteredFilaments, selectedFilaments]);

  // Stats
  const totalFilaments = filaments.length;
  const filamentsWithImages = filaments.filter((f) => f.featured_image).length;
  const filamentsWithPrices = filaments.filter((f) => f.variant_price).length;
  const filamentsWithTDS = filaments.filter((f) => f.tds_url).length;
  const filamentsWithUpc = filaments.filter((f) => f.upc).length;
  const filamentsWithSku = filaments.filter((f) => f.variant_sku).length;
  const filamentsWithEan = filaments.filter((f) => (f as any).ean).length;
  const filamentsWithGtin = filaments.filter((f) => (f as any).gtin).length;
  const filamentsWithMpn = filaments.filter((f) => (f as any).mpn).length;
  const filamentsWithHex = filaments.filter((f) => f.color_hex).length;
  const uniqueVendors = new Set(filaments.map((f) => f.vendor).filter(Boolean)).size;

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Admin Dashboard
        </Button>

        <div className="flex items-center gap-3 mb-6">
          <Package className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold">Manage Filaments</h1>
        </div>

        {/* Stats Dashboard */}
        <div className="grid grid-cols-3 md:grid-cols-7 gap-3 mb-6">
          <StatCard label="Total" value={totalFilaments} />
          <StatCard label="Images" value={filamentsWithImages} total={totalFilaments} />
          <StatCard label="Prices" value={filamentsWithPrices} total={totalFilaments} />
          <StatCard label="SKUs" value={filamentsWithSku} total={totalFilaments} />
          <StatCard label="UPCs" value={filamentsWithUpc} total={totalFilaments} />
          <StatCard label="Hex" value={filamentsWithHex} total={totalFilaments} />
          <StatCard label="TDS" value={filamentsWithTDS} total={totalFilaments} />
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search filaments by name, vendor, or material..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={vendorFilter} onValueChange={setVendorFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Vendors" />
            </SelectTrigger>
            <SelectContent className="bg-background border z-50 max-h-[300px] overflow-y-auto">
              <SelectItem value="all">All Vendors</SelectItem>
              {uniqueVendorsList.map((vendor) => (
                <SelectItem key={vendor} value={vendor}>
                  {vendor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <Checkbox
              id="missing-upc"
              checked={showMissingUpcOnly}
              onCheckedChange={(checked) => setShowMissingUpcOnly(checked === true)}
            />
            <label htmlFor="missing-upc" className="text-sm cursor-pointer whitespace-nowrap">
              Missing UPC ({totalFilaments - filamentsWithUpc})
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="missing-sku"
              checked={showMissingSkuOnly}
              onCheckedChange={(checked) => setShowMissingSkuOnly(checked === true)}
            />
            <label htmlFor="missing-sku" className="text-sm cursor-pointer whitespace-nowrap">
              Missing SKU ({totalFilaments - filamentsWithSku})
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="missing-ean"
              checked={showMissingEanOnly}
              onCheckedChange={(checked) => setShowMissingEanOnly(checked === true)}
            />
            <label htmlFor="missing-ean" className="text-sm cursor-pointer whitespace-nowrap">
              Missing EAN ({totalFilaments - filamentsWithEan})
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="missing-gtin"
              checked={showMissingGtinOnly}
              onCheckedChange={(checked) => setShowMissingGtinOnly(checked === true)}
            />
            <label htmlFor="missing-gtin" className="text-sm cursor-pointer whitespace-nowrap">
              Missing GTIN ({totalFilaments - filamentsWithGtin})
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="missing-mpn"
              checked={showMissingMpnOnly}
              onCheckedChange={(checked) => setShowMissingMpnOnly(checked === true)}
            />
            <label htmlFor="missing-mpn" className="text-sm cursor-pointer whitespace-nowrap">
              Missing MPN ({totalFilaments - filamentsWithMpn})
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 mb-6">
          <div className="flex flex-col gap-1">
            <Button
              variant="secondary"
              onClick={handleScrapeSelectedUpcs}
              disabled={scrapingUpcs || scrapingMpns || filteredFilaments.length === 0}
            >
              {scrapingUpcs ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Barcode className="w-4 h-4 mr-2" />
              )}
              {scrapingUpcs 
                ? `Scraping ${scrapeProgress.current}/${scrapeProgress.total}` 
                : `Scrape UPCs (${selectedFilaments.size > 0 ? selectedFilaments.size : filteredFilaments.length})`}
            </Button>
            {scrapingUpcs && scrapeProgress.total > 0 && (
              <Progress value={(scrapeProgress.current / scrapeProgress.total) * 100} className="h-1 w-full" />
            )}
          </div>
          <Button
            variant="secondary"
            onClick={handleScrapeMpns}
            disabled={scrapingMpns || scrapingUpcs || vendorFilter === "all"}
            title={vendorFilter === "all" ? "Select a vendor first" : `Scrape MPNs for ${vendorFilter}`}
          >
            {scrapingMpns ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Tag className="w-4 h-4 mr-2" />
            )}
            {scrapingMpns ? "Scraping MPNs..." : "Scrape MPNs"}
          </Button>
          <Button
            variant="outline"
            onClick={handleCopySkuToMpn}
            disabled={copyingSkuToMpn || scrapingMpns || scrapingUpcs}
            title="Copy existing SKU values to MPN for all filaments missing MPN"
          >
            {copyingSkuToMpn ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Copy className="w-4 h-4 mr-2" />
            )}
            {copyingSkuToMpn ? "Copying..." : "SKU → MPN"}
          </Button>
          <Button
            variant="outline"
            onClick={handleDeriveIdentifiers}
            disabled={derivingIdentifiers || copyingSkuToMpn || scrapingMpns || scrapingUpcs}
            title="Derive EAN from 13-digit UPC and GTIN from 14-digit UPC values"
          >
            {derivingIdentifiers ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <GitBranch className="w-4 h-4 mr-2" />
            )}
            {derivingIdentifiers ? "Deriving..." : "UPC → EAN/GTIN"}
          </Button>
          <div className="flex flex-col gap-1">
            <Button
              variant="outline"
              onClick={handleLookupBarcodes}
              disabled={lookingUpBarcodes || derivingIdentifiers || copyingSkuToMpn || scrapingMpns || scrapingUpcs || lookupBarcodesCount === 0}
              title="Search external barcode databases using SKU/MPN to find UPC/EAN/GTIN"
            >
              {lookingUpBarcodes ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Database className="w-4 h-4 mr-2" />
              )}
              {lookingUpBarcodes 
                ? `Looking up ${scrapeProgress.current}/${scrapeProgress.total}` 
                : `Lookup Barcodes (${lookupBarcodesCount})`}
            </Button>
            {lookingUpBarcodes && scrapeProgress.total > 0 && (
              <Progress value={(scrapeProgress.current / scrapeProgress.total) * 100} className="h-1 w-full" />
            )}
          </div>
          <Button
            variant="outline"
            onClick={handlePopulateHexColors}
            disabled={populatingHexColors || (totalFilaments - filamentsWithHex) === 0}
            title="Populate missing hex color codes using AI"
          >
            {populatingHexColors ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Palette className="w-4 h-4 mr-2" />
            )}
            {populatingHexColors ? "Populating..." : `Hex Colors (${totalFilaments - filamentsWithHex})`}
          </Button>
          {selectedFilaments.size > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete {selectedFilaments.size} Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete {selectedFilaments.size} filaments?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the selected filaments.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Filaments Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={
                        filteredFilaments.length > 0 &&
                        selectedFilaments.size === filteredFilaments.length
                      }
                      onChange={toggleSelectAll}
                      className="rounded border-input"
                    />
                  </TableHead>
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead>UPC</TableHead>
                  <TableHead>EAN</TableHead>
                  <TableHead>GTIN</TableHead>
                  <TableHead>MPN</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFilaments.slice(0, 100).map((filament) => (
                  <TableRow key={filament.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedFilaments.has(filament.id)}
                        onChange={() => toggleSelection(filament.id)}
                        className="rounded border-input"
                      />
                    </TableCell>
                    <TableCell>
                      {filament.featured_image ? (
                        <img
                          src={filament.featured_image}
                          alt={filament.product_title}
                          className="w-10 h-10 object-cover rounded"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate font-medium">
                        {filament.product_title}
                      </div>
                      {filament.product_url && (
                        <a
                          href={filament.product_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          View <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{filament.vendor || "Unknown"}</Badge>
                    </TableCell>
                    <TableCell>
                      {filament.material && (
                        <Badge variant="secondary">{filament.material}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {filament.upc || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {(filament as any).ean || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {(filament as any).gtin || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {(filament as any).mpn || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {filament.variant_sku || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {filament.variant_price
                        ? `$${filament.variant_price.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete filament?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{filament.product_title}".
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(filament.id)}>
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredFilaments.length > 100 && (
              <div className="p-4 text-center text-sm text-muted-foreground border-t">
                Showing first 100 of {filteredFilaments.length} results. Use search to narrow down.
              </div>
            )}
            {filteredFilaments.length === 0 && (
              <div className="p-8 text-center text-muted-foreground">
                No filaments found matching your search.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminFilaments;
