import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Upload, ArrowLeft, Database, Search, Loader2, CheckCircle, XCircle, Clock, AlertCircle, RefreshCw, DollarSign, Sparkles, Cpu, Globe, FileCode, AppWindow, Trash2, AlertTriangle, BarChart3 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils"; // utility for conditional classnames
import { BRAND_REGIONAL_AVAILABILITY } from "@/lib/brandRegionalAvailability";
import PrinterDataComparisonPanel from "@/components/admin/PrinterDataComparisonPanel";

function BrandAvailabilityDisplay({ brand }: { brand: string }) {
  const availability = BRAND_REGIONAL_AVAILABILITY[brand];
  if (!availability) return <div className="text-xs text-muted-foreground p-2 bg-muted rounded">No regional data for {brand}</div>;
  const regions = [{ id: 'US', flag: '🇺🇸' }, { id: 'CA', flag: '🇨🇦' }, { id: 'UK', flag: '🇬🇧' }, { id: 'EU', flag: '🇪🇺' }, { id: 'AU', flag: '🇦🇺' }, { id: 'JP', flag: '🇯🇵' }] as const;
  return (
    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
      <div className="text-xs font-medium">{brand} Regional Availability</div>
      <div className="grid grid-cols-6 gap-2 text-xs">
        {regions.map(r => {
          const avail = availability[r.id];
          return (
            <div key={r.id} className="text-center space-y-1">
              <div className="font-medium">{r.flag}</div>
              <div className={avail.store ? "text-green-600" : "text-muted-foreground"}>{avail.store ? "✓" : "✗"} Store</div>
              <div className={avail.amazon ? "text-green-600" : "text-muted-foreground"}>{avail.amazon ? "✓" : "✗"} Amazon</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Admin page for importing printer data from CSV
 * 
 * Usage:
 * 1. Upload printers_master_standardized.csv file
 * 2. Click "Import Printers" to process
 * 3. Review import statistics
 * 
 * The CSV will be parsed and upserted into the database:
 * - Brands and series are automatically created/updated
 * - Printers are upserted based on printer_id
 * - All columns from CSV are preserved
 */
export default function AdminPrinters() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [selectedBrand, setSelectedBrand] = useState<string>("");
  const [discovering, setDiscovering] = useState(false);
  const [activeTab, setActiveTab] = useState("discover");
  const [selectedPrinters, setSelectedPrinters] = useState<Set<string>>(new Set());
  const [massRescraping, setMassRescraping] = useState(false);
  const [massRescrapeStats, setMassRescrapeStats] = useState<{ total: number; completed: number } | null>(null);
  const [editingUrl, setEditingUrl] = useState<{ printerId: string; url: string } | null>(null);
  const [cleaningDuplicates, setCleaningDuplicates] = useState(false);
  const [fetchingPrices, setFetchingPrices] = useState(false);
  const [priceStats, setPriceStats] = useState<{ total: number; successful: number; failed: number } | null>(null);
  const [aiSearching, setAiSearching] = useState(false);
  const [aiSearchStats, setAiSearchStats] = useState<{ total: number; successful: number; failed: number } | null>(null);
  const [aiSearchResults, setAiSearchResults] = useState<Array<{
    printer_id: string;
    model_name: string;
    brand: string;
    success: boolean;
    msrp_usd?: number;
    error?: string;
    ai_response?: string;
  }>>([]);
  const [priceFetchBrand, setPriceFetchBrand] = useState<string>("all");
  const [aiSearchBrand, setAiSearchBrand] = useState<string>("all");
  
  // Global price update state
  const [globalPriceUpdating, setGlobalPriceUpdating] = useState(false);
  const [globalPriceBrand, setGlobalPriceBrand] = useState<string>("all");
  const [globalPriceRegions, setGlobalPriceRegions] = useState<string[]>(["US"]);
  const [globalPriceLimit, setGlobalPriceLimit] = useState<number>(5);
  const [globalPriceResults, setGlobalPriceResults] = useState<any>(null);
  
  // Firmware and Software scraping state
  const [firmwareScrapingBrands, setFirmwareScrapingBrands] = useState<string[]>([]);
  const [firmwareScraping, setFirmwareScraping] = useState(false);
  const [currentScrapingBrand, setCurrentScrapingBrand] = useState<string>("");
  const [firmwareScrapeStats, setFirmwareScrapeStats] = useState<{ 
    total: number; 
    completed: number; 
    firmwareSuccessful: number;
    softwareSuccessful: number;
    softwareCleaned: number;
    mobileAppsFound: number;
    auditDeleted?: number;
    phase: 'cleanup' | 'firmware' | 'software' | 'audit' | 'done';
  } | null>(null);

  // Query ALL printers and count pricing status in memory for accuracy
  const { data: allPrinters, refetch: refetchAllPrinters } = useQuery({
    queryKey: ["all-printers-for-count"],
    queryFn: async () => {
      console.log('🔄 Fetching all printers for price count...');
      const { data, error } = await supabase
        .from("printers")
        .select("id, current_price_usd_store, current_price_usd_amazon, msrp_usd");
      
      if (error) {
        console.error('❌ Error fetching printers for count:', error);
        throw error;
      }
      
      console.log(`✅ Fetched ${data?.length || 0} printers for counting`);
      return data || [];
    },
    staleTime: 0,
    gcTime: 0, // Don't cache
    refetchInterval: fetchingPrices || aiSearching ? 2000 : false,
  });

  // Calculate price coverage for all price sources
  const priceProgressData = allPrinters ? (() => {
    const withStorePrice = allPrinters.filter(p => p.current_price_usd_store);
    const withAmazonPrice = allPrinters.filter(p => p.current_price_usd_amazon);
    const withMSRP = allPrinters.filter(p => p.msrp_usd);
    const withAnyPrice = allPrinters.filter(p => p.current_price_usd_store || p.current_price_usd_amazon || p.msrp_usd);
    const withNoPricing = allPrinters.filter(p => !p.current_price_usd_store && !p.current_price_usd_amazon && !p.msrp_usd);
    
    console.log('📊 Price coverage:', {
      total: allPrinters.length,
      withStorePrice: withStorePrice.length,
      withAmazonPrice: withAmazonPrice.length,
      withMSRP: withMSRP.length,
      withAnyPrice: withAnyPrice.length,
      withNoPricing: withNoPricing.length,
    });
    
    return {
      total: allPrinters.length,
      withStorePrice: withStorePrice.length,
      withAmazonPrice: withAmazonPrice.length,
      withMSRP: withMSRP.length,
      withAnyPrice: withAnyPrice.length,
      withNoPricing: withNoPricing.length,
    };
  })() : null;

  // Fetch printer brands
  const { data: brands, isLoading: brandsLoading } = useQuery({
    queryKey: ["printer-brands-admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_brands")
        .select("*")
        .order("brand");
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch discovery runs with models
  const { data: discoveryRuns, isLoading: runsLoading } = useQuery({
    queryKey: ["discovery-runs", selectedBrand],
    queryFn: async () => {
      let query = supabase
        .from("discovery_runs")
        .select(`
          *,
          printer_brands!inner(brand),
          discovery_models(
            id,
            model_name,
            was_new,
            discovered_at,
            printer_id
          )
        `)
        .order("started_at", { ascending: false })
        .limit(10);

      if (selectedBrand) {
        query = query.eq("brand_id", selectedBrand);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "history",
  });

  // Fetch pending printers
  const { data: pendingPrinters, isLoading: pendingLoading } = useQuery({
    queryKey: ["pending-printers", selectedBrand],
    queryFn: async () => {
      let query = supabase
        .from("printers")
        .select(`
          *,
          printer_brands!inner(brand)
        `)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (selectedBrand) {
        query = query.eq("brand_id", selectedBrand);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: activeTab === "review",
  });

  // Deep scrape mutation
  const deepScrapeMutation = useMutation({
    mutationFn: async (printerId: string) => {
      const { data, error } = await supabase.functions.invoke('deep-scrape-printer', {
        body: { printerId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Deep scrape completed" });
      queryClient.invalidateQueries({ queryKey: ["pending-printers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Deep scrape failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Re-scrape mutation (resets status and triggers new scrape)
  const rescrapeM = useMutation({
    mutationFn: async (printerId: string) => {
      // Reset scrape status
      const { error: resetError } = await supabase
        .from('printers')
        .update({ 
          scrape_status: 'not_started', 
          scraped_data: null, 
          scrape_error: null 
        })
        .eq('id', printerId);
      
      if (resetError) throw resetError;

      // Trigger new scrape
      const { data, error } = await supabase.functions.invoke('deep-scrape-printer', {
        body: { printerId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: "Re-scraping started" });
      queryClient.invalidateQueries({ queryKey: ["pending-printers"] });
    },
    onError: (error: any) => {
      toast({
        title: "Re-scrape failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Approve printer mutation
  const approveMutation = useMutation({
    mutationFn: async (printerIds: string[]) => {
      // Check for printers that are still being scraped
      const inProgressPrinters = printerIds.filter(id => {
        const printer = pendingPrinters?.find(p => p.id === id);
        return printer?.scrape_status === 'in_progress';
      });

      if (inProgressPrinters.length > 0) {
        throw new Error(`Cannot approve: ${inProgressPrinters.length} printer(s) are still being scraped. Please wait for scraping to complete.`);
      }

      // For each printer, merge scraped_data with the existing record
      for (const printerId of printerIds) {
        const printer = pendingPrinters?.find(p => p.id === printerId);
        
        if (printer?.scrape_status === 'completed' && printer?.scraped_data) {
          const specs = (printer.scraped_data as any).extracted_specs || {};
          
          // Filter out metadata fields that aren't database columns
          const { content_length, extraction_confidence, ...validSpecs } = specs;
          
          // Sanitize integer fields by rounding decimal values
          const integerFields = ['extruder_count', 'multi_material_max_spools', 'review_count_aggregated', 'onboard_storage_gb'];
          for (const field of integerFields) {
            if (validSpecs[field] !== null && validSpecs[field] !== undefined) {
              const value = parseFloat(validSpecs[field]);
              if (!isNaN(value)) {
                validSpecs[field] = Math.round(value);
              }
            }
          }
          
          const { error } = await supabase
            .from("printers")
            .update({ 
              ...validSpecs,
              status: "active",
              scraped_data: null,
              scrape_status: "imported",
            })
            .eq("id", printerId);
          if (error) throw error;
        } else {
          // Approve without scraped data (e.g., for printers that don't need scraping)
          const { error } = await supabase
            .from("printers")
            .update({ status: "active" })
            .eq("id", printerId);
          if (error) throw error;
        }
      }
    },
    onSuccess: (_, printerIds) => {
      queryClient.invalidateQueries({ queryKey: ["pending-printers"] });
      setSelectedPrinters(new Set());
      toast({ 
        title: "Printers imported", 
        description: `${printerIds.length} printer(s) imported with specifications.` 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to import",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reject printer mutation
  const rejectMutation = useMutation({
    mutationFn: async (printerIds: string[]) => {
      const { error } = await supabase
        .from("printers")
        .delete()
        .in("id", printerIds);
      
      if (error) throw error;
    },
    onSuccess: (_, printerIds) => {
      queryClient.invalidateQueries({ queryKey: ["pending-printers"] });
      setSelectedPrinters(new Set());
      toast({ 
        title: "Printers rejected", 
        description: `${printerIds.length} printer(s) have been deleted.` 
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to reject",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTogglePrinter = (printerId: string) => {
    setSelectedPrinters(prev => {
      const next = new Set(prev);
      if (next.has(printerId)) {
        next.delete(printerId);
      } else {
        next.add(printerId);
      }
      return next;
    });
  };

  const handleToggleAll = () => {
    if (!pendingPrinters) return;
    
    if (selectedPrinters.size === pendingPrinters.length) {
      setSelectedPrinters(new Set());
    } else {
      setSelectedPrinters(new Set(pendingPrinters.map(p => p.id)));
    }
  };

  const handleBulkApprove = () => {
    if (selectedPrinters.size === 0) return;
    approveMutation.mutate(Array.from(selectedPrinters));
  };

  const handleBulkReject = () => {
    if (selectedPrinters.size === 0) return;
    rejectMutation.mutate(Array.from(selectedPrinters));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStats(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    try {
      setImporting(true);
      
      // Read file as text
      const csvData = await file.text();
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke("import-printers", {
        body: { csvData },
      });

      if (error) throw error;

      if (data.success) {
        setStats(data.stats);
        queryClient.invalidateQueries({ queryKey: ["all-printers-for-count"] });
        queryClient.invalidateQueries({ queryKey: ["pricing-tab-count", "printer"] });
        queryClient.invalidateQueries({ queryKey: ["admin-pricing-data", "printer"] });
        queryClient.invalidateQueries({ queryKey: ["admin-printer-brands-map"] });
        toast({
          title: "Import successful",
          description: `Imported ${data.stats.printers_created} new, updated ${data.stats.printers_updated}. Check Pricing Data → Printers tab to verify.`,
        });
      } else {
        throw new Error("Import failed");
      }
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Import failed",
        description: error.message || "An error occurred during import",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleDiscoverModels = async () => {
    if (!selectedBrand) {
      toast({
        title: "No brand selected",
        description: "Please select a brand to discover models for",
        variant: "destructive",
      });
      return;
    }

    try {
      setDiscovering(true);
      
      // Call edge function
      const { data, error } = await supabase.functions.invoke("discover-printer-models", {
        body: { brand_id: selectedBrand },
      });

      if (error) throw error;

      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["discovery-runs"] });
        setActiveTab("history");
        toast({
          title: "Discovery started",
          description: `Model discovery for ${data.brand} has been started in the background. Check the History tab for progress.`,
        });
      } else {
        throw new Error(data.error || "Discovery failed");
      }
    } catch (error: any) {
      console.error("Discovery error:", error);
      toast({
        title: "Discovery failed",
        description: error.message || "An error occurred during discovery",
        variant: "destructive",
      });
    } finally {
      setDiscovering(false);
    }
  };

  const selectedBrandData = brands?.find(b => b.id === selectedBrand);

  const validateUrl = (url: string): boolean => {
    if (!url) return false;
    if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const { data: invalidUrlPrinters } = useQuery({
    queryKey: ['invalid-url-printers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('printers')
        .select('id, model_name, official_product_url, brand_id')
        .not('official_product_url', 'is', null);

      if (error) throw error;

      return data?.filter(printer => !validateUrl(printer.official_product_url || '')) || [];
    }
  });

  const { data: duplicatePrinters, refetch: refetchDuplicates } = useQuery({
    queryKey: ['duplicate-printers'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_duplicate_printers_with_3d_printer_suffix' as any);
      
      if (error) {
        // Fallback to manual query if RPC doesn't exist
        const { data: allPrinters, error: fetchError } = await supabase
          .from('printers')
          .select('id, model_name, brand_id')
          .like('model_name', '% 3D Printer');

        if (fetchError) throw fetchError;

        const duplicates = [];
        for (const printer of allPrinters || []) {
          const baseModelName = printer.model_name.replace(' 3D Printer', '');
          const { data: matchingPrinters, error: matchError } = await supabase
            .from('printers')
            .select('id, model_name')
            .eq('brand_id', printer.brand_id)
            .eq('model_name', baseModelName);

          if (!matchError && matchingPrinters && matchingPrinters.length > 0) {
            duplicates.push({
              id_with_suffix: printer.id,
              name_with_suffix: printer.model_name,
              id_without_suffix: matchingPrinters[0].id,
              name_without_suffix: matchingPrinters[0].model_name,
            });
          }
        }
        return duplicates;
      }

      return data || [];
    }
  });

  const removeDuplicatesMutation = useMutation({
    mutationFn: async (printerIds: string[]) => {
      const { error } = await supabase
        .from('printers')
        .delete()
        .in('id', printerIds);

      if (error) throw error;
    },
    onSuccess: (_, printerIds) => {
      refetchDuplicates();
      toast({ 
        title: "Duplicates removed", 
        description: `${printerIds.length} duplicate printer(s) have been deleted.` 
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove duplicates",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleRemoveAllDuplicates = async () => {
    if (!duplicatePrinters || duplicatePrinters.length === 0) return;

    setCleaningDuplicates(true);
    try {
      const idsToRemove = duplicatePrinters.map((dup: any) => dup.id_with_suffix);
      await removeDuplicatesMutation.mutateAsync(idsToRemove);
    } finally {
      setCleaningDuplicates(false);
    }
  };

  const updateUrlMutation = useMutation({
    mutationFn: async ({ printerId, newUrl }: { printerId: string; newUrl: string }) => {
      const { error } = await supabase
        .from('printers')
        .update({ official_product_url: newUrl })
        .eq('id', printerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invalid-url-printers'] });
      toast({ title: "URL updated successfully" });
      setEditingUrl(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update URL",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFetchPrices = async () => {
    try {
      setFetchingPrices(true);
      setPriceStats(null);

      toast({
        title: "Fetching prices (batch mode)",
        description: "Processing 5 printers at a time. Run multiple times to process all printers.",
      });

      // Call the fetch-printer-prices edge function
      const { data, error } = await supabase.functions.invoke('fetch-printer-prices', {
        body: { brand: priceFetchBrand === "all" ? undefined : priceFetchBrand },
      });

      if (error) throw error;

      setPriceStats({
        total: data.total_processed || 0,
        successful: data.successful || 0,
        failed: data.failed || 0,
      });

      if (data.successful > 0) {
        toast({
          title: "Batch completed",
          description: `Processed ${data.total_processed} printers: ${data.successful} successful, ${data.failed} failed. Run again to process more.`,
        });
        console.log('🔄 Invalidating queries and refetching printer counts...');
        await queryClient.invalidateQueries({ queryKey: ["printer-detail"] });
        await queryClient.invalidateQueries({ queryKey: ["all-printers-for-count"] });
        await refetchAllPrinters();
      } else {
        toast({
          title: "Batch completed",
          description: `Processed ${data.total_processed} printers but found no prices. Run again to continue.`,
          variant: "destructive",
        });
        console.log('🔄 Refetching printer counts after failed batch...');
        await queryClient.invalidateQueries({ queryKey: ["all-printers-for-count"] });
        await refetchAllPrinters();
      }
    } catch (error: any) {
      console.error("Price fetch error:", error);
      toast({
        title: "Price fetch failed",
        description: error.message || "An error occurred while fetching prices",
        variant: "destructive",
      });
    } finally {
      setFetchingPrices(false);
    }
  };

  const handleAiSearchMsrp = async () => {
    try {
      setAiSearching(true);
      setAiSearchStats(null);
      setAiSearchResults([]);

      toast({
        title: "AI searching for MSRP (batch mode)",
        description: "Using AI to find MSRP for 5 printers at a time. Run multiple times to process all printers.",
      });

      // Call the ai-search-msrp edge function
      const { data, error } = await supabase.functions.invoke('ai-search-msrp', {
        body: { brand: aiSearchBrand === "all" ? undefined : aiSearchBrand },
      });

      if (error) throw error;

      setAiSearchStats({
        total: data.total_processed || 0,
        successful: data.successful || 0,
        failed: data.failed || 0,
      });
      
      // Store the results for display
      setAiSearchResults(data.results || []);

      if (data.successful > 0) {
        toast({
          title: "AI search completed",
          description: `Found MSRP for ${data.successful} out of ${data.total_processed} printers. Run again to process more.`,
        });
        console.log('🔄 Invalidating queries and refetching printer counts...');
        await queryClient.invalidateQueries({ queryKey: ["printer-detail"] });
        await queryClient.invalidateQueries({ queryKey: ["all-printers-for-count"] });
        const result = await refetchAllPrinters();
        console.log('✅ Refetch complete, new data:', result.data?.length);
      } else {
        toast({
          title: "AI search completed",
          description: `Processed ${data.total_processed} printers but found no prices. Run again to continue.`,
          variant: "destructive",
        });
        console.log('🔄 Refetching printer counts after failed batch...');
        await queryClient.invalidateQueries({ queryKey: ["all-printers-for-count"] });
        await refetchAllPrinters();
      }
    } catch (error: any) {
      console.error("AI search error:", error);
      toast({
        title: "AI search failed",
        description: error.message || "An error occurred during AI search",
        variant: "destructive",
      });
    } finally {
      setAiSearching(false);
    }
  };

  const handleGlobalPriceUpdate = async () => {
    try {
      setGlobalPriceUpdating(true);
      setGlobalPriceResults(null);

      toast({
        title: "Price update started",
        description: `Scraping prices for ${globalPriceBrand === "all" ? "all brands" : globalPriceBrand}. This runs in the background and may take 2-3 minutes. Refresh the page to see results.`,
        duration: 10000,
      });

      const { data, error } = await supabase.functions.invoke('update-global-prices', {
        body: {
          brand: globalPriceBrand === "all" ? undefined : globalPriceBrand,
          regions: globalPriceRegions,
          limit: globalPriceLimit,
        },
      });

      if (error) {
        // Check if it's a timeout error (function still running in background)
        if (error.message?.includes('Failed to fetch') || error.message?.includes('timeout')) {
          toast({
            title: "Update running in background",
            description: "The price update is still running. Refresh the page in 2-3 minutes to see updated prices.",
            duration: 15000,
          });
          return;
        }
        throw error;
      }

      setGlobalPriceResults(data);

      if (data.updated > 0) {
        toast({
          title: "Global prices updated",
          description: `Updated ${data.updated} printers with regional prices. ${data.failed} failed.`,
        });
        await queryClient.invalidateQueries({ queryKey: ["all-printers-for-count"] });
        await refetchAllPrinters();
      } else {
        toast({
          title: "No prices found",
          description: "Could not find any prices from the specified regions.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Global price update error:", error);
      // Handle timeout errors gracefully
      if (error.message?.includes('Failed to fetch') || error.message?.includes('timeout') || error.name === 'FunctionsFetchError') {
        toast({
          title: "Update running in background",
          description: "The price update is still running. Refresh the page in 2-3 minutes to see updated prices.",
          duration: 15000,
        });
      } else {
        toast({
          title: "Price update failed",
          description: error.message || "An error occurred during price update",
          variant: "destructive",
        });
      }
    } finally {
      setGlobalPriceUpdating(false);
    }
  };

  const handleBatchFirmwareAndSoftwareScrape = async () => {
    if (firmwareScrapingBrands.length === 0) {
      toast({
        title: "No brands selected",
        description: "Please select at least one brand to scrape firmware and software for",
        variant: "destructive",
      });
      return;
    }

    try {
      setFirmwareScraping(true);
      setFirmwareScrapeStats(null);

      // Gather all printers from all selected brands
      const selectedBrandObjs = brands?.filter(b => firmwareScrapingBrands.includes(b.id)) || [];
      if (selectedBrandObjs.length === 0) {
        throw new Error("No brands found");
      }

      const { data: allBrandPrinters, error: fetchError } = await supabase
        .from('printers')
        .select('id, model_name, brand_id')
        .in('brand_id', firmwareScrapingBrands)
        .eq('status', 'active');

      if (fetchError) throw fetchError;

      if (!allBrandPrinters || allBrandPrinters.length === 0) {
        toast({
          title: "No printers found",
          description: `No active printers found for selected brands`,
          variant: "destructive",
        });
        return;
      }

      // Group printers by brand for processing
      const printersByBrand = new Map<string, typeof allBrandPrinters>();
      for (const printer of allBrandPrinters) {
        const brandId = printer.brand_id!;
        if (!printersByBrand.has(brandId)) {
          printersByBrand.set(brandId, []);
        }
        printersByBrand.get(brandId)!.push(printer);
      }

      // Phase 1: Clean up software entries from firmware table
      setFirmwareScrapeStats({ 
        total: allBrandPrinters.length, 
        completed: 0, 
        firmwareSuccessful: 0,
        softwareSuccessful: 0,
        softwareCleaned: 0,
        mobileAppsFound: 0,
        phase: 'cleanup'
      });

      toast({
        title: "Cleaning up misplaced software entries",
        description: `Checking firmware table for software entries to remove...`,
      });

      // Software keywords to detect misplaced entries in firmware table
      const softwareKeywords = ['studio', 'slicer', 'handy', 'app', 'software', 'orca', 'cura', 'prusa'];
      
      let softwareCleaned = 0;
      for (const printer of allBrandPrinters) {
        // Fetch firmware entries for this printer
        const { data: firmwareEntries, error: fwError } = await supabase
          .from('printer_firmware')
          .select('id, version, release_notes')
          .eq('printer_id', printer.id);
        
        if (!fwError && firmwareEntries) {
          // Find entries that look like software (not firmware)
          const softwareEntries = firmwareEntries.filter(fw => {
            const versionLower = (fw.version || '').toLowerCase();
            const notesLower = (fw.release_notes || '').toLowerCase();
            return softwareKeywords.some(kw => 
              versionLower.includes(kw) || notesLower.includes(kw)
            );
          });
          
          if (softwareEntries.length > 0) {
            const idsToDelete = softwareEntries.map(e => e.id);
            const { error: deleteError } = await supabase
              .from('printer_firmware')
              .delete()
              .in('id', idsToDelete);
            
            if (!deleteError) {
              softwareCleaned += softwareEntries.length;
              console.log(`Cleaned ${softwareEntries.length} software entries from firmware for ${printer.model_name}`);
            }
          }
        }
      }

      setFirmwareScrapeStats(prev => prev ? { 
        ...prev, 
        softwareCleaned,
        phase: 'firmware'
      } : null);

      if (softwareCleaned > 0) {
        toast({
          title: "Cleanup complete",
          description: `Removed ${softwareCleaned} software entries from firmware table`,
        });
      }

      const batchSize = 3;
      let completed = 0;
      let firmwareSuccessful = 0;
      let softwareSuccessful = 0;
      let mobileAppsFound = 0;

      // Phase 2: Scrape firmware for all brands
      for (const [brandId, brandPrinters] of printersByBrand) {
        const brandObj = selectedBrandObjs.find(b => b.id === brandId);
        if (!brandObj) continue;

        setCurrentScrapingBrand(brandObj.brand);
        toast({
          title: "Firmware scraping",
          description: `Scraping firmware for ${brandPrinters.length} ${brandObj.brand} printers...`,
        });

        for (let i = 0; i < brandPrinters.length; i += batchSize) {
          const batch = brandPrinters.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (printer) => {
              try {
                const { data, error } = await supabase.functions.invoke('scrape-printer-firmware', {
                  body: {
                    printerId: printer.id,
                    brandName: brandObj.brand,
                    printerName: printer.model_name,
                  },
                });

                if (!error && data?.firmware_count > 0) {
                  firmwareSuccessful++;
                }
                completed++;
                setFirmwareScrapeStats(prev => prev ? { 
                  ...prev, 
                  completed, 
                  firmwareSuccessful,
                  phase: 'firmware'
                } : null);
              } catch (error) {
                console.error(`Failed to scrape firmware for ${printer.model_name}:`, error);
                completed++;
                setFirmwareScrapeStats(prev => prev ? { 
                  ...prev, 
                  completed, 
                  firmwareSuccessful,
                  phase: 'firmware'
                } : null);
              }
            })
          );

          if (i + batchSize < brandPrinters.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      // Phase 3: Scrape software for all brands
      setFirmwareScrapeStats(prev => prev ? { 
        ...prev, 
        completed: 0,
        phase: 'software'
      } : null);

      completed = 0;

      for (const [brandId, brandPrinters] of printersByBrand) {
        const brandObj = selectedBrandObjs.find(b => b.id === brandId);
        if (!brandObj) continue;

        setCurrentScrapingBrand(brandObj.brand);
        toast({
          title: "Software scraping",
          description: `Scraping software for ${brandPrinters.length} ${brandObj.brand} printers...`,
        });

        for (let i = 0; i < brandPrinters.length; i += batchSize) {
          const batch = brandPrinters.slice(i, i + batchSize);

          await Promise.all(
            batch.map(async (printer) => {
              try {
                const { data, error } = await supabase.functions.invoke('scrape-printer-software', {
                  body: {
                    printerId: printer.id,
                    brandName: brandObj.brand,
                    printerName: printer.model_name,
                  },
                });

              if (!error && data?.software_count > 0) {
                softwareSuccessful++;
                // Count mobile apps from the response
                if (data?.software && Array.isArray(data.software)) {
                  const appCount = data.software.filter((sw: any) => sw.is_mobile_app === true).length;
                  mobileAppsFound += appCount;
                }
              }
              completed++;
              setFirmwareScrapeStats(prev => prev ? { 
                ...prev, 
                completed, 
                softwareSuccessful,
                mobileAppsFound,
                phase: 'software'
              } : null);
            } catch (error) {
              console.error(`Failed to scrape software for ${printer.model_name}:`, error);
              completed++;
              setFirmwareScrapeStats(prev => prev ? { 
                ...prev, 
                completed, 
                softwareSuccessful,
                mobileAppsFound,
                phase: 'software'
              } : null);
            }
            })
          );

          if (i + batchSize < brandPrinters.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      setCurrentScrapingBrand("");

      // Phase 4: Global firmware audit - validate ALL firmware entries across ALL brands
      setFirmwareScrapeStats(prev => prev ? { 
        ...prev, 
        completed: 0,
        phase: 'audit'
      } : null);

      toast({
        title: "Auditing firmware entries",
        description: `Validating all firmware entries across all brands...`,
      });

      // Brand-specific firmware version patterns (whitelist)
      const BRAND_FIRMWARE_PATTERNS: Record<string, RegExp[]> = {
        'Bambu Lab': [/^0[0-9]\.\d{2}\.\d{2}\.\d{2}$/], // 01.xx.xx.xx format
        'Prusa Research': [/^[345]\.\d+\.\d+(-\w+)?$/], // 5.x.x, 4.x.x, 3.x.x
        'Creality': [/^[12]\.\d+\.\d+(\.\d+)?$/, /^V?[12]\.\d+\.\d+$/i, /^Marlin/i],
        'Anycubic': [/^V?[12]\.\d+\.\d+$/i],
        'QIDI': [/^V?[23]\.\d+\.\d+$/i],
        'Elegoo': [/^V?[12]\.\d+\.\d+$/i],
        'Sovol': [/^V?[12]\.\d+\.\d+$/i],
        'FlashForge': [/^V?[12]\.\d+\.\d+$/i],
        'Raise3D': [/^[12]\.\d+\.\d+(\.\d+)?$/],
        'UltiMaker': [/^[0-9]+\.\d+\.\d+$/],
      };

      // Invalid patterns that should NEVER be in firmware
      const INVALID_FIRMWARE_PATTERNS = [
        /^[23]\.\d+\.\d+(\.\d+)?$/, // Software versions (2.x.x, 3.x.x) except for brands that use them
        /forum\.bambulab\.com/i,
        /user_avatar/i,
        /letter_avatar/i,
        /\d+\s*views.*\d+\s*likes/i,
        /bambu\s*studio/i,
        /orca\s*slicer/i,
        /prusa\s*slicer/i,
        /bambu\s*handy/i,
        /farm\s*manager/i,
      ];

      // Fetch all firmware with brand info
      const { data: allFirmware, error: fwFetchError } = await supabase
        .from('printer_firmware')
        .select(`
          id, 
          version, 
          release_notes,
          printer_id,
          printers!inner(
            id,
            model_name,
            printer_brands(brand)
          )
        `);

      let invalidEntriesDeleted = 0;
      const invalidEntryIds: string[] = [];

      if (!fwFetchError && allFirmware) {
        for (const fw of allFirmware) {
          const brandName = (fw.printers as any)?.printer_brands?.brand || '';
          const version = (fw.version || '').trim();
          const notes = (fw.release_notes || '').toLowerCase();
          
          let isInvalid = false;
          let reason = '';

          // Check if version matches brand-specific firmware pattern (whitelist)
          const firmwarePatterns = BRAND_FIRMWARE_PATTERNS[brandName];
          if (firmwarePatterns) {
            const v = version.replace(/^v/i, '');
            const matchesFirmware = firmwarePatterns.some(p => p.test(v) || p.test(version));
            if (!matchesFirmware) {
              // For brands with patterns, version MUST match
              isInvalid = true;
              reason = `Version "${version}" doesn't match ${brandName} firmware pattern`;
            }
          }

          // Check against invalid patterns (blacklist)
          for (const pattern of INVALID_FIRMWARE_PATTERNS) {
            if (pattern.test(version) || pattern.test(notes)) {
              // But don't flag Prusa/Creality versions that look like x.x.x
              if (brandName === 'Prusa Research' || brandName === 'Creality') {
                if (/^[345]\.\d+\.\d+/.test(version)) continue;
              }
              isInvalid = true;
              reason = `Matches invalid pattern: ${pattern}`;
              break;
            }
          }

          // Check for forum junk content
          if (notes.includes('views') && notes.includes('likes') && notes.includes('users')) {
            isInvalid = true;
            reason = 'Contains forum metadata';
          }

          if (isInvalid) {
            console.log(`[Audit] Invalid firmware: ${brandName} - ${version} - ${reason}`);
            invalidEntryIds.push(fw.id);
          }
        }

        // Delete all invalid entries
        if (invalidEntryIds.length > 0) {
          const { error: deleteError } = await supabase
            .from('printer_firmware')
            .delete()
            .in('id', invalidEntryIds);
          
          if (!deleteError) {
            invalidEntriesDeleted = invalidEntryIds.length;
            console.log(`[Audit] Deleted ${invalidEntriesDeleted} invalid firmware entries`);
          }
        }
      }

      setFirmwareScrapeStats(prev => prev ? { 
        ...prev, 
        auditDeleted: invalidEntriesDeleted,
        phase: 'done'
      } : null);

      toast({
        title: "Firmware & Software scraping completed",
        description: `Firmware: ${firmwareSuccessful}/${allBrandPrinters.length} | Software: ${softwareSuccessful}/${allBrandPrinters.length} | Mobile Apps: ${mobileAppsFound} | Cleaned: ${softwareCleaned} | Audit deleted: ${invalidEntriesDeleted}`,
      });

      queryClient.invalidateQueries({ queryKey: ["printer-firmware"] });
      queryClient.invalidateQueries({ queryKey: ["printer-software"] });
    } catch (error: any) {
      console.error("Firmware/Software scrape error:", error);
      toast({
        title: "Scraping failed",
        description: error.message || "An error occurred during scraping",
        variant: "destructive",
      });
    } finally {
      setFirmwareScraping(false);
    }
  };

  const handleMassRescrape = async () => {
    try {
      setMassRescraping(true);
      setMassRescrapeStats(null);

      // Fetch all ACTIVE printers with official_product_url (not pending ones)
      const { data: allPrinters, error: fetchError } = await supabase
        .from('printers')
        .select('id, model_name, official_product_url, status')
        .not('official_product_url', 'is', null)
        .eq('status', 'active');

      if (fetchError) throw fetchError;

      if (!allPrinters || allPrinters.length === 0) {
        toast({
          title: "No printers to scrape",
          description: "No active printers found with product URLs",
          variant: "destructive",
        });
        return;
      }

      // Filter for valid URLs only
      const printersToScrape = allPrinters.filter(printer => {
        const url = printer.official_product_url;
        if (!url) return false;
        
        // Check if URL starts with http:// or https://
        if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
        
        // Try to parse as URL
        try {
          new URL(url);
          return true;
        } catch {
          console.log(`Skipping printer ${printer.model_name} - invalid URL: ${url}`);
          return false;
        }
      });

      if (printersToScrape.length === 0) {
        toast({
          title: "No valid URLs found",
          description: "All printers have invalid product URLs",
          variant: "destructive",
        });
        return;
      }

      const skippedCount = allPrinters.length - printersToScrape.length;
      if (skippedCount > 0) {
        toast({
          title: "Invalid URLs detected",
          description: `Skipping ${skippedCount} printer(s) with invalid URLs`,
        });
      }

      setMassRescrapeStats({ total: printersToScrape.length, completed: 0 });

      toast({
        title: "Mass re-scrape started",
        description: `Updating ${printersToScrape.length} existing printers with fresh data...`,
      });

      // Process printers in batches to avoid overwhelming the system
      const batchSize = 5;
      let completed = 0;
      let updated = 0;

      for (let i = 0; i < printersToScrape.length; i += batchSize) {
        const batch = printersToScrape.slice(i, i + batchSize);
        
        await Promise.all(
          batch.map(async (printer) => {
            try {
              // Reset scrape status
              await supabase
                .from('printers')
                .update({ 
                  scrape_status: 'not_started', 
                  scrape_error: null 
                })
                .eq('id', printer.id);

              // Trigger deep scrape
              const { data: scrapeResult } = await supabase.functions.invoke('deep-scrape-printer', {
                body: { printerId: printer.id, autoApply: true },
              });

              // Wait a bit for scraping to complete
              await new Promise(resolve => setTimeout(resolve, 2000));

              // Fetch the scraped data
              const { data: scrapedPrinter } = await supabase
                .from('printers')
                .select('scraped_data, scrape_status')
                .eq('id', printer.id)
                .single();

              // If scraping completed successfully, auto-apply the data
              if (scrapedPrinter?.scrape_status === 'completed' && scrapedPrinter?.scraped_data) {
                const specs = (scrapedPrinter.scraped_data as any).extracted_specs || {};
                
                // Filter out metadata fields
                const { content_length, extraction_confidence, ...validSpecs } = specs;
                
                // Sanitize integer fields
                const integerFields = ['extruder_count', 'multi_material_max_spools', 'review_count_aggregated', 'onboard_storage_gb'];
                for (const field of integerFields) {
                  if (validSpecs[field] !== null && validSpecs[field] !== undefined) {
                    const value = parseFloat(validSpecs[field]);
                    if (!isNaN(value)) {
                      validSpecs[field] = Math.round(value);
                    }
                  }
                }
                
                // Update printer with scraped data (keep status as active, clear scraped_data)
                await supabase
                  .from('printers')
                  .update({ 
                    ...validSpecs,
                    scraped_data: null,
                    scrape_status: 'imported',
                  })
                  .eq('id', printer.id);

                updated++;
              }

              completed++;
              setMassRescrapeStats({ total: printersToScrape.length, completed });
            } catch (error) {
              console.error(`Failed to scrape ${printer.model_name}:`, error);
            }
          })
        );

        // Small delay between batches
        if (i + batchSize < printersToScrape.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      toast({
        title: "Mass re-scrape completed",
        description: `Successfully updated ${updated} existing printers with fresh data`,
      });

      queryClient.invalidateQueries({ queryKey: ["pending-printers"] });
    } catch (error: any) {
      console.error("Mass rescrape error:", error);
      toast({
        title: "Mass re-scrape failed",
        description: error.message || "An error occurred during mass re-scrape",
        variant: "destructive",
      });
    } finally {
      setMassRescraping(false);
    }
  };

  // Helper to render spec fields with status indicator
  const renderSpecField = (label: string, value: any, unit?: string) => {
    const hasValue = value !== null && value !== undefined && value !== '';
    const displayValue = typeof value === 'boolean' 
      ? (value ? 'Yes' : 'No')
      : value !== null && value !== undefined && value !== ''
        ? `${value}${unit ? ' ' + unit : ''}`
        : 'Not found';
    
    return (
      <div className="flex items-center gap-2 py-1">
        {hasValue ? (
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
        ) : (
          <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
        )}
        <span className={hasValue ? 'text-foreground' : 'text-muted-foreground'}>
          <span className="font-medium">{label}:</span> {displayValue}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/admin")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin
          </Button>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Manage Printers</h1>
          <p className="text-muted-foreground">
            Import printer data from CSV or discover new models from brand websites
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discover">Discover</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="review">
              Review
              {pendingPrinters && pendingPrinters.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {pendingPrinters.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comparison" className="gap-1">
              <BarChart3 className="h-4 w-4" />
              Comparison
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discover" className="space-y-6">
            {/* Model Discovery Section */}
            <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Discover New Models
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Automatically discover new printer models from brand websites. Select a brand and click discover to scrape their product pages for new models.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Brand</label>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a brand..." />
                  </SelectTrigger>
                  <SelectContent>
                    {brandsLoading ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Loading brands...
                      </div>
                    ) : brands && brands.length > 0 ? (
                      brands.map((brand) => (
                        <SelectItem key={brand.id} value={brand.id}>
                          {brand.brand}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No brands found
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Action</label>
                <Button
                  onClick={handleDiscoverModels}
                  disabled={!selectedBrand || discovering || brandsLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {discovering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Discovering...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Discover New Models
                    </>
                  )}
                </Button>
              </div>
            </div>

            {selectedBrandData && (
              <div className="mt-4 space-y-4">
                <div className="p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Discovery Run:</span>
                    <span className="font-medium">
                      {selectedBrandData.last_discovery_run_at 
                        ? new Date(selectedBrandData.last_discovery_run_at).toLocaleString()
                        : "Never"}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">New Models Found:</span>
                    <span className="font-medium">
                      {selectedBrandData.new_models_found_count || 0}
                    </span>
                  </div>
                </div>

                {!selectedBrandData.scrape_config && (
                  <Alert variant="destructive">
                    <AlertDescription className="space-y-3">
                      <div className="font-semibold">Setup Required: Configure Scraping</div>
                      <p className="text-sm">
                        To discover models, you need to add a <code className="bg-background/50 px-1 py-0.5 rounded">scrape_config</code> JSON to this brand's database record.
                      </p>
                      <div className="space-y-2 text-xs">
                        <div className="font-medium">Example configuration:</div>
                        <pre className="bg-background/50 p-2 rounded overflow-x-auto">
{`{
  "model_list_url": "https://brand.com/products",
  "model_url_pattern": "https://brand.com/product/{model}",
  "selectors": {
    "model_name": ".product-title",
    "model_link": "a.product-link",
    "specs": {
      "build_volume": ".spec-build-volume",
      "max_temp": ".spec-temperature"
    }
  }
}`}
                        </pre>
                      </div>
                      <p className="text-xs">
                        Add this via SQL: <code className="bg-background/50 px-1 py-0.5 rounded text-xs">
                          UPDATE printer_brands SET scrape_config = '...' WHERE id = '{selectedBrandData.id}'
                        </code>
                      </p>
                    </AlertDescription>
                  </Alert>
              )}
            </div>
          )}
            </CardContent>
            </Card>

            <Separator />

            {/* Mass Re-scrape Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Fetch Missing Prices
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Automatically scrape current prices from official product pages for printers without price data. This will update MSRP and store prices where available.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    <strong>AI Search Priority:</strong> 1) Store price for printers with no prices → 2) Amazon price if store fails → 3) Amazon price for printers missing Amazon data.
                  </p>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Brand</label>
                    <Select value={priceFetchBrand} onValueChange={setPriceFetchBrand}>
                      <SelectTrigger className="w-full md:w-[280px]">
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {brands?.map((b) => (
                          <SelectItem key={b.brand} value={b.brand}>
                            {b.brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {priceProgressData && priceProgressData.total > 0 && (
                  <div className="space-y-4 p-4 bg-muted rounded-lg">
                    {/* Store Prices */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Printers with store prices:</span>
                        <span className="text-muted-foreground">
                          {priceProgressData.withStorePrice} / {priceProgressData.total}
                        </span>
                      </div>
                      <Progress 
                        value={(priceProgressData.withStorePrice / priceProgressData.total) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* Amazon Prices */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Printers with Amazon prices:</span>
                        <span className="text-muted-foreground">
                          {priceProgressData.withAmazonPrice} / {priceProgressData.total}
                        </span>
                      </div>
                      <Progress 
                        value={(priceProgressData.withAmazonPrice / priceProgressData.total) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* MSRP Data */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">Printers with MSRP data:</span>
                        <span className="text-muted-foreground">
                          {priceProgressData.withMSRP} / {priceProgressData.total}
                        </span>
                      </div>
                      <Progress 
                        value={(priceProgressData.withMSRP / priceProgressData.total) * 100} 
                        className="h-2"
                      />
                    </div>

                    {/* No Pricing */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-destructive">Printers with no pricing at all:</span>
                        <span className="text-muted-foreground">
                          {priceProgressData.withNoPricing} / {priceProgressData.total}
                        </span>
                      </div>
                      <Progress 
                        value={(priceProgressData.withNoPricing / priceProgressData.total) * 100} 
                        className="h-2 [&>div]:bg-destructive"
                      />
                    </div>

                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                      {priceProgressData.withAnyPrice} printers have at least one price source
                    </div>
                  </div>
                )}

                {priceStats && (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-semibold">Price Fetch Results:</div>
                        <div className="text-sm">
                          <span className="text-green-600">✓ {priceStats.successful} successful</span>
                          {priceStats.failed > 0 && (
                            <span className="text-destructive ml-3">✗ {priceStats.failed} failed</span>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {aiSearchStats && (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-1">
                        <div className="font-semibold">AI MSRP Search Results:</div>
                        <div className="text-sm">
                          <span className="text-green-600">✓ {aiSearchStats.successful} successful</span>
                          {aiSearchStats.failed > 0 && (
                            <span className="text-destructive ml-3">✗ {aiSearchStats.failed} failed</span>
                          )}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {aiSearchResults.length > 0 && (
                  <Card className="bg-muted/50">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">Processed Printers</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {aiSearchResults.map((result, index) => (
                        <div
                          key={`${result.printer_id}-${index}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-background border"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                              )}
                              <div>
                                <div className="font-medium text-sm">
                                  {result.brand} {result.model_name}
                                </div>
                                {result.success && result.msrp_usd && (
                                  <div className="text-xs text-green-600 font-semibold">
                                    MSRP: ${result.msrp_usd.toFixed(2)}
                                  </div>
                                )}
                                {!result.success && result.error && (
                                  <div className="text-xs text-muted-foreground">
                                    {result.error}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <div className="space-y-2">
                  <label className="text-sm font-medium">AI Search - Filter by Brand</label>
                  <Select value={aiSearchBrand} onValueChange={setAiSearchBrand}>
                    <SelectTrigger className="w-full md:w-[280px]">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands?.map((b) => (
                        <SelectItem key={b.brand} value={b.brand}>
                          {b.brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleAiSearchMsrp}
                  disabled={aiSearching || fetchingPrices}
                  className="w-full gap-2"
                  size="lg"
                  variant="secondary"
                >
                  {aiSearching ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      AI Searching MSRP...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      AI Search MSRP {aiSearchBrand !== "all" && `(${aiSearchBrand})`}
                    </>
                  )}
                </Button>

                <Button
                  onClick={handleFetchPrices}
                  disabled={fetchingPrices || aiSearching}
                  className="w-full gap-2"
                  size="lg"
                  variant="default"
                >
                  {fetchingPrices ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Fetching Prices...
                    </>
                  ) : (
                    <>
                      <DollarSign className="h-4 w-4" />
                      Scrape Prices from Product Pages
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Separator />

            {/* Global Price Update Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Global Price Update
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Scrape current prices from brand stores and Amazon across multiple regions. Regions are automatically skipped when the brand doesn't operate there.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Brand</label>
                    <Select value={globalPriceBrand} onValueChange={setGlobalPriceBrand}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Brands" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Brands</SelectItem>
                        {brands?.map((b) => (
                          <SelectItem key={b.brand} value={b.brand}>
                            {b.brand}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Printers per batch</label>
                    <Select value={String(globalPriceLimit)} onValueChange={(v) => setGlobalPriceLimit(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 printers</SelectItem>
                        <SelectItem value="5">5 printers</SelectItem>
                        <SelectItem value="10">10 printers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Regions to scrape</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "US", label: "🇺🇸 US (USD)" },
                      { id: "CA", label: "🇨🇦 Canada (CAD)" },
                      { id: "UK", label: "🇬🇧 UK (GBP)" },
                      { id: "EU", label: "🇪🇺 EU (EUR)" },
                      { id: "AU", label: "🇦🇺 Australia (AUD)" },
                      { id: "JP", label: "🇯🇵 Japan (JPY)" },
                    ].map((region) => (
                      <Button
                        key={region.id}
                        variant={globalPriceRegions.includes(region.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          if (globalPriceRegions.includes(region.id)) {
                            setGlobalPriceRegions(globalPriceRegions.filter(r => r !== region.id));
                          } else {
                            setGlobalPriceRegions([...globalPriceRegions, region.id]);
                          }
                        }}
                      >
                        {region.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unavailable regions for the selected brand will be automatically skipped.
                  </p>
                </div>

                {/* Brand Availability Table */}
                {globalPriceBrand !== "all" && (
                  <BrandAvailabilityDisplay brand={globalPriceBrand} />
                )}

                {globalPriceResults && (
                  <Alert>
                    <AlertDescription>
                      <div className="space-y-2">
                        <div className="font-semibold">Global Price Update Results:</div>
                        <div className="text-sm flex gap-4">
                          <span className="text-green-600">✓ {globalPriceResults.updated} updated</span>
                          {globalPriceResults.failed > 0 && (
                            <span className="text-destructive">✗ {globalPriceResults.failed} failed</span>
                          )}
                          {globalPriceResults.skipped > 0 && (
                            <span className="text-muted-foreground">⊘ {globalPriceResults.skipped} skipped</span>
                          )}
                        </div>
                        {globalPriceResults.results?.length > 0 && (
                          <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                            {globalPriceResults.results.map((r: any, i: number) => (
                              <div key={i} className="text-xs flex items-center gap-2 p-1 rounded bg-muted/50">
                                {r.success ? (
                                  <CheckCircle className="h-3 w-3 text-green-600 shrink-0" />
                                ) : (
                                  <XCircle className="h-3 w-3 text-destructive shrink-0" />
                                )}
                                <span className="font-medium">{r.brand} {r.model_name}</span>
                                {r.prices && Object.entries(r.prices).length > 0 && (
                                  <span className="text-muted-foreground">
                                    {Object.entries(r.prices).map(([key, val]: [string, any]) => 
                                      `${key}: ${val.currency} ${val.price}`
                                    ).join(", ")}
                                  </span>
                                )}
                                {r.skipped_regions && r.skipped_regions.length > 0 && (
                                  <span className="text-muted-foreground text-xs">
                                    (skipped: {r.skipped_regions.map((s: any) => s.region).join(", ")})
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleGlobalPriceUpdate}
                  disabled={globalPriceUpdating || globalPriceRegions.length === 0}
                  className="w-full gap-2"
                  size="lg"
                >
                  {globalPriceUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating Global Prices...
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      Update Global Prices {globalPriceBrand !== "all" && `(${globalPriceBrand})`}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Separator />

            {/* Batch Firmware and Software Scraping Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCode className="h-5 w-5" />
                  Batch Firmware & Software Scraping
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Comprehensive firmware & software discovery for all printers of a selected brand:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1 ml-4 list-disc">
                    <li><span className="font-medium text-foreground">Firmware:</span> All firmware versions, release notes, changelogs, and download links</li>
                    <li><span className="font-medium text-foreground">Software:</span> Slicers, studio apps, plugins with version history and downloads</li>
                    <li><span className="font-medium text-foreground">Mobile Apps:</span> iOS/Android apps with App Store and Google Play links</li>
                  </ul>
                  <p className="text-xs text-muted-foreground italic">
                    Also cleans up any software entries incorrectly placed in the firmware table.
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Select Brands ({firmwareScrapingBrands.length} selected)</label>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFirmwareScrapingBrands(brands?.map(b => b.id) || [])}
                        disabled={brandsLoading || firmwareScraping}
                        className="text-xs h-7"
                      >
                        Select All
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFirmwareScrapingBrands([])}
                        disabled={brandsLoading || firmwareScraping}
                        className="text-xs h-7"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto bg-background">
                    {brandsLoading ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        Loading brands...
                      </div>
                    ) : brands && brands.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {brands.map((brand) => (
                          <label
                            key={brand.id}
                            className={cn(
                              "flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-muted transition-colors",
                              firmwareScrapingBrands.includes(brand.id) && "bg-muted"
                            )}
                          >
                            <Checkbox
                              checked={firmwareScrapingBrands.includes(brand.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFirmwareScrapingBrands([...firmwareScrapingBrands, brand.id]);
                                } else {
                                  setFirmwareScrapingBrands(firmwareScrapingBrands.filter(id => id !== brand.id));
                                }
                              }}
                              disabled={firmwareScraping}
                            />
                            <span className="text-sm">{brand.brand}</span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="p-2 text-center text-sm text-muted-foreground">
                        No brands found
                      </div>
                    )}
                  </div>
                </div>

                {firmwareScrapeStats && (
                  <div className="space-y-3 p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        Phase: {firmwareScrapeStats.phase === 'cleanup' ? 'Cleaning up...' : 
                               firmwareScrapeStats.phase === 'firmware' ? `Scraping Firmware${currentScrapingBrand ? ` (${currentScrapingBrand})` : ''}...` : 
                               firmwareScrapeStats.phase === 'software' ? `Scraping Software${currentScrapingBrand ? ` (${currentScrapingBrand})` : ''}...` : 
                               firmwareScrapeStats.phase === 'audit' ? 'Auditing All Brands...' : 'Complete'}
                      </span>
                      <span className="text-muted-foreground">
                        {firmwareScrapeStats.phase === 'audit' ? 'Validating entries...' : 
                          `${firmwareScrapeStats.completed} / ${firmwareScrapeStats.total} printers`}
                      </span>
                    </div>
                    <Progress 
                      value={firmwareScrapeStats.phase === 'audit' ? 100 : 
                        (firmwareScrapeStats.completed / firmwareScrapeStats.total) * 100} 
                      className="h-2"
                    />
                    <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Trash2 className="h-3 w-3" />
                        Cleaned: {firmwareScrapeStats.softwareCleaned}
                      </div>
                      <div className="flex items-center gap-1">
                        <FileCode className="h-3 w-3" />
                        Firmware: {firmwareScrapeStats.firmwareSuccessful}
                      </div>
                      <div className="flex items-center gap-1">
                        <AppWindow className="h-3 w-3" />
                        Software: {firmwareScrapeStats.softwareSuccessful}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.5 1.917a6.4 6.4 0 0 0-5.5 3.3 6.4 6.4 0 0 0-5.5-3.3A6.8 6.8 0 0 0 0 8.617c0 7.8 12 13.5 12 13.5s12-5.7 12-13.5a6.8 6.8 0 0 0-6.5-6.7z"/>
                        </svg>
                        Apps: {firmwareScrapeStats.mobileAppsFound || 0}
                      </div>
                      <div className="flex items-center gap-1 text-destructive">
                        <AlertTriangle className="h-3 w-3" />
                        Audit: {firmwareScrapeStats.auditDeleted || 0}
                      </div>
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleBatchFirmwareAndSoftwareScrape}
                  disabled={firmwareScrapingBrands.length === 0 || firmwareScraping || brandsLoading}
                  className="w-full gap-2"
                  size="lg"
                >
                  {firmwareScraping ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {firmwareScrapeStats?.phase === 'cleanup' ? 'Cleaning Up...' :
                       firmwareScrapeStats?.phase === 'firmware' ? `Scraping Firmware${currentScrapingBrand ? ` (${currentScrapingBrand})` : ''}...` :
                       firmwareScrapeStats?.phase === 'software' ? `Scraping Software${currentScrapingBrand ? ` (${currentScrapingBrand})` : ''}...` : 
                       firmwareScrapeStats?.phase === 'audit' ? 'Auditing...' : 'Processing...'}
                    </>
                  ) : (
                    <>
                      <FileCode className="h-4 w-4" />
                      Scrape Firmware & Software
                      {firmwareScrapingBrands.length > 0 && brands && (
                        <span className="opacity-70">
                          ({firmwareScrapingBrands.length} brand{firmwareScrapingBrands.length > 1 ? 's' : ''})
                        </span>
                      )}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Cpu className="h-5 w-5" />
                  Dynamic Nozzle Scraper
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Dynamically scrapes nozzle data from brand store pages with URL validation and QC reporting.
                  </p>
                  <p className="text-xs text-muted-foreground italic">
                    Supported: Bambu Lab, Prusa Research, Creality, E3D (Shopify stores with dynamic discovery)
                  </p>
                </div>

                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a brand to scrape..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bambu Lab">Bambu Lab (Dynamic Scraping)</SelectItem>
                    <SelectItem value="Creality">Creality (Dynamic Scraping)</SelectItem>
                    <SelectItem value="E3D">E3D (Dynamic Scraping)</SelectItem>
                    <SelectItem value="Prusa Research">Prusa Research (Dynamic Scraping)</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={async () => {
                    if (!selectedBrand) {
                      toast({
                        title: "No brand selected",
                        description: "Please select a brand to scrape",
                        variant: "destructive",
                      });
                      return;
                    }

                    try {
                      setDiscovering(true);
                      
                      const { data, error } = await supabase.functions.invoke('scrape-brand-nozzles', {
                        body: { 
                          brandName: selectedBrand,
                          validateUrls: true,
                        },
                      });

                      if (error) throw error;

                      const qc = data.qc_report;
                      toast({
                        title: "Dynamic scrape complete",
                        description: `Discovered ${qc.total_discovered} nozzles, ${qc.url_validated} valid URLs, ${qc.inserted} inserted. Check edge function logs for full QC report.`,
                      });

                      queryClient.invalidateQueries({ queryKey: ["brands"] });
                    } catch (error: any) {
                      console.error('Dynamic nozzle scrape error:', error);
                      toast({
                        title: "Scrape failed",
                        description: error.message || "Failed to scrape nozzles",
                        variant: "destructive",
                      });
                    } finally {
                      setDiscovering(false);
                    }
                  }}
                  disabled={!selectedBrand || discovering}
                  className="w-full gap-2"
                  size="lg"
                >
                  {discovering ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scraping & Validating...
                    </>
                  ) : (
                    <>
                      <Cpu className="h-4 w-4" />
                      Scrape Nozzles (Dynamic)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Separator />
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Mass Re-scrape Product Images
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Re-scrape all printers to extract product images using the improved image detection logic. This will update the scraped_data for all printers with official product URLs.
                  </p>
                </div>

                {massRescrapeStats && (
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Progress:</span>
                      <span className="text-sm">
                        {massRescrapeStats.completed} / {massRescrapeStats.total}
                      </span>
                    </div>
                    <div className="mt-2 w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(massRescrapeStats.completed / massRescrapeStats.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleMassRescrape}
                  disabled={massRescraping}
                  className="w-full gap-2"
                  size="lg"
                  variant="secondary"
                >
                  {massRescraping ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Re-scraping... {massRescrapeStats && `(${massRescrapeStats.completed}/${massRescrapeStats.total})`}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Re-scrape All Printers
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Separator />

            {/* Duplicate Cleanup Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Remove Duplicate Printers
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Find and remove duplicate printers where one version has "3D Printer" suffix. The system will keep the cleaner name version.
                  </p>
                </div>

                {duplicatePrinters && duplicatePrinters.length > 0 && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="text-sm font-medium">Found {duplicatePrinters.length} duplicate(s):</div>
                    <div className="space-y-1 text-sm">
                      {duplicatePrinters.map((dup: any) => (
                        <div key={dup.id_with_suffix} className="flex items-center gap-2">
                          <span className="text-destructive line-through">{dup.name_with_suffix}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-green-600">{dup.name_without_suffix}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleRemoveAllDuplicates}
                  disabled={!duplicatePrinters || duplicatePrinters.length === 0 || cleaningDuplicates}
                  className="w-full gap-2"
                  size="lg"
                  variant={duplicatePrinters && duplicatePrinters.length > 0 ? "destructive" : "outline"}
                >
                  {cleaningDuplicates ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Removing Duplicates...
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4" />
                      Remove All Duplicates ({duplicatePrinters?.length || 0})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Separator />

            {/* URL Cleanup Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Fix Invalid URLs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Find and fix printers with invalid official product URLs. Invalid URLs prevent proper scraping and data enrichment.
                  </p>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      size="lg"
                    >
                      <AlertCircle className="h-4 w-4" />
                      View Invalid URLs ({invalidUrlPrinters?.length || 0})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Printers with Invalid URLs</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {invalidUrlPrinters && invalidUrlPrinters.length > 0 ? (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Model Name</TableHead>
                              <TableHead>Current URL</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {invalidUrlPrinters.map(printer => (
                              <TableRow key={printer.id}>
                                <TableCell className="font-medium">{printer.model_name}</TableCell>
                                <TableCell>
                                  {editingUrl?.printerId === printer.id ? (
                                    <Input
                                      value={editingUrl.url}
                                      onChange={(e) => setEditingUrl({ ...editingUrl, url: e.target.value })}
                                      placeholder="https://example.com/product"
                                      className="max-w-md"
                                    />
                                  ) : (
                                    <span className="text-destructive">{printer.official_product_url}</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  {editingUrl?.printerId === printer.id ? (
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        onClick={() => {
                                          if (validateUrl(editingUrl.url)) {
                                            updateUrlMutation.mutate({ printerId: printer.id, newUrl: editingUrl.url });
                                          } else {
                                            toast({
                                              title: "Invalid URL",
                                              description: "Please enter a valid URL starting with http:// or https://",
                                              variant: "destructive",
                                            });
                                          }
                                        }}
                                        disabled={updateUrlMutation.isPending}
                                      >
                                        Save
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setEditingUrl(null)}
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingUrl({ printerId: printer.id, url: printer.official_product_url || '' })}
                                    >
                                      Edit
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No printers with invalid URLs found
                        </p>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            <Separator />

        {/* CSV Import Section */}

        {/* Instructions */}
        <Card className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Database className="h-5 w-5 mt-0.5 text-primary" />
            <div className="space-y-2 flex-1">
              <h3 className="font-semibold">How to import printers</h3>
              <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                <li>Select the <code className="bg-muted px-1 py-0.5 rounded">printers_master_standardized.csv</code> file</li>
                <li>Click "Import Printers" to begin processing</li>
                <li>The import will upsert data based on <code className="bg-muted px-1 py-0.5 rounded">printer_id</code></li>
                <li>Brands and series are automatically created if they don't exist</li>
                <li>Existing printers are updated with new data</li>
              </ol>
            </div>
          </div>
        </Card>

        {/* Upload Section */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label
                htmlFor="csv-upload"
                className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
              >
                <Upload className="h-4 w-4" />
                <span>Choose CSV File</span>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
              {file && (
                <div className="flex-1 text-sm text-muted-foreground">
                  Selected: <span className="font-medium text-foreground">{file.name}</span>
                </div>
              )}
            </div>

            <Button
              onClick={handleImport}
              disabled={!file || importing}
              className="w-full"
              size="lg"
            >
              {importing ? "Importing..." : "Import Printers"}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {stats && (
          <Card className="p-6 space-y-4">
            <h3 className="font-semibold text-lg">Import Results</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.brands_created}
                </div>
                <div className="text-sm text-muted-foreground">Brands Created</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.brands_updated}
                </div>
                <div className="text-sm text-muted-foreground">Brands Updated</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.printers_created}
                </div>
                <div className="text-sm text-muted-foreground">Printers Created</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.printers_updated}
                </div>
                <div className="text-sm text-muted-foreground">Printers Updated</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.series_created}
                </div>
                <div className="text-sm text-muted-foreground">Series Created</div>
              </div>
              
              <div className="p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.errors.length}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
            </div>

            {stats.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertDescription>
                  <div className="font-semibold mb-2">Errors occurred during import:</div>
                  <ul className="list-disc list-inside space-y-1 text-sm max-h-40 overflow-y-auto">
                    {stats.errors.slice(0, 10).map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                    {stats.errors.length > 10 && (
                      <li className="font-semibold">
                        ... and {stats.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </Card>
        )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Discovery History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {runsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : discoveryRuns && discoveryRuns.length > 0 ? (
                  <div className="space-y-4">
                    {discoveryRuns.map((run) => (
                      <div key={run.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {run.printer_brands?.brand}
                              </span>
                              {run.status === "completed" && (
                                <Badge variant="default" className="gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  Completed
                                </Badge>
                              )}
                              {run.status === "failed" && (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Failed
                                </Badge>
                              )}
                              {run.status === "running" && (
                                <Badge variant="secondary" className="gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Running
                                </Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Started: {new Date(run.started_at).toLocaleString()}
                            </div>
                            {run.completed_at && (
                              <div className="text-sm text-muted-foreground">
                                Completed: {new Date(run.completed_at).toLocaleString()}
                              </div>
                            )}
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Found:</span>{" "}
                              <span className="font-semibold">{run.models_found || 0}</span>
                            </div>
                            <div className="text-sm">
                              <span className="text-muted-foreground">Added:</span>{" "}
                              <span className="font-semibold text-green-600">{run.models_added || 0}</span>
                            </div>
                          </div>
                        </div>

                        {run.error_message && (
                          <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-sm">
                              {run.error_message}
                            </AlertDescription>
                          </Alert>
                        )}

                        {run.discovery_models && run.discovery_models.length > 0 && (
                          <div className="space-y-2">
                            <div className="text-sm font-medium">Discovered Models:</div>
                            <div className="max-h-40 overflow-y-auto space-y-1">
                              {run.discovery_models.map((model) => (
                                <div
                                  key={model.id}
                                  className="flex items-center justify-between text-sm py-1 px-2 bg-muted rounded"
                                >
                                  <span>{model.model_name}</span>
                                  {model.was_new ? (
                                    <Badge variant="default" className="text-xs">New</Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-xs">Existing</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No discovery runs yet. Start a discovery to see logs here.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="review" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    Review Pending Printers
                  </CardTitle>
                  {pendingPrinters && pendingPrinters.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        onClick={handleBulkApprove}
                        disabled={selectedPrinters.size === 0 || approveMutation.isPending}
                        variant="default"
                        size="sm"
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Approve Selected ({selectedPrinters.size})
                      </Button>
                      <Button
                        onClick={handleBulkReject}
                        disabled={selectedPrinters.size === 0 || rejectMutation.isPending}
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        Reject Selected ({selectedPrinters.size})
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {pendingLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : pendingPrinters && pendingPrinters.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <input
                        type="checkbox"
                        checked={selectedPrinters.size === pendingPrinters.length}
                        onChange={handleToggleAll}
                        className="h-4 w-4 rounded border-input"
                      />
                      <span className="text-sm font-medium">
                        Select All ({pendingPrinters.length} printers)
                      </span>
                    </div>

                    {pendingPrinters.map((printer) => (
                      <div key={printer.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start gap-3">
                          <input
                            type="checkbox"
                            checked={selectedPrinters.has(printer.id)}
                            onChange={() => handleTogglePrinter(printer.id)}
                            className="h-5 w-5 rounded border-input mt-1"
                          />
                           <div className="flex-1 space-y-3">
                            <div className="space-y-1">
                              <div className="font-semibold text-lg">
                                {printer.model_name}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Brand: {printer.printer_brands?.brand}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Discovered: {new Date(printer.created_at).toLocaleString()}
                              </div>
                              {printer.official_product_url && (
                                <a
                                  href={printer.official_product_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                >
                                  View Product Page →
                                </a>
                              )}
                            </div>

                            {/* Deep Scrape Actions */}
                            <div className="flex items-center gap-2 pt-2">
                              {printer.scrape_status === 'not_started' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deepScrapeMutation.mutate(printer.id)}
                                  disabled={deepScrapeMutation.isPending}
                                >
                                  {deepScrapeMutation.isPending ? 'Scraping...' : 'Deep Scrape'}
                                </Button>
                              )}
                              {printer.scrape_status === 'in_progress' && (
                                <Badge variant="secondary" className="gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Scraping...
                                </Badge>
                              )}
                              {printer.scrape_status === 'completed' && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="default" className="gap-1">
                                    <CheckCircle className="h-3 w-3" />
                                    Scrape Complete
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => rescrapeM.mutate(printer.id)}
                                    disabled={rescrapeM.isPending}
                                  >
                                    Re-Scrape
                                  </Button>
                                </div>
                              )}
                              {printer.scrape_status === 'failed' && (
                                <div className="flex items-center gap-2">
                                  <Badge variant="destructive" className="gap-1">
                                    <XCircle className="h-3 w-3" />
                                    Failed
                                  </Badge>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => deepScrapeMutation.mutate(printer.id)}
                                  >
                                    Retry
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Scrape Report */}
                            {printer.scrape_status === 'completed' && printer.scraped_data && (
                              <details className="border rounded-lg">
                                <summary className="cursor-pointer p-3 hover:bg-muted/50 font-medium text-sm">
                                  📊 Scrape Report ({(printer.scraped_data as any)?.extraction_quality?.specs_found || 0} specs found)
                                </summary>
                                <div className="p-4 space-y-3 border-t">
                                  <div>
                                    <div className="font-semibold mb-2">Extraction Quality</div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="bg-muted p-2 rounded">
                                        <div className="text-xs text-muted-foreground">Specs</div>
                                        <div className="text-lg font-bold">
                                          {(printer.scraped_data as any)?.extraction_quality?.specs_found || 0}
                                        </div>
                                      </div>
                                      <div className="bg-muted p-2 rounded">
                                        <div className="text-xs text-muted-foreground">Images</div>
                                        <div className="text-lg font-bold">
                                          {(printer.scraped_data as any)?.extraction_quality?.images_found || 0}
                                        </div>
                                      </div>
                                      <div className="bg-muted p-2 rounded">
                                        <div className="text-xs text-muted-foreground">Docs</div>
                                        <div className="text-lg font-bold">
                                          {(printer.scraped_data as any)?.extraction_quality?.documents_found || 0}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {(printer.scraped_data as any)?.extracted_specs && (
                                    <div className="space-y-4">
                                      <div className="font-semibold mb-2">Extracted Specifications</div>
                                      
                                      {/* Dimensions */}
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Build Volume & Dimensions</h5>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                          {renderSpecField('Build Volume X', (printer.scraped_data as any).extracted_specs.build_volume_x_mm, 'mm')}
                                          {renderSpecField('Build Volume Y', (printer.scraped_data as any).extracted_specs.build_volume_y_mm, 'mm')}
                                          {renderSpecField('Build Volume Z', (printer.scraped_data as any).extracted_specs.build_volume_z_mm, 'mm')}
                                          {renderSpecField('Machine Width', (printer.scraped_data as any).extracted_specs.machine_width_mm, 'mm')}
                                          {renderSpecField('Machine Depth', (printer.scraped_data as any).extracted_specs.machine_depth_mm, 'mm')}
                                          {renderSpecField('Machine Height', (printer.scraped_data as any).extracted_specs.machine_height_mm, 'mm')}
                                          {renderSpecField('Weight', (printer.scraped_data as any).extracted_specs.machine_weight_kg, 'kg')}
                                        </div>
                                      </div>

                                      {/* Temperatures */}
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Temperature Capabilities</h5>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                          {renderSpecField('Max Nozzle Temp', (printer.scraped_data as any).extracted_specs.max_nozzle_temp_c, '°C')}
                                          {renderSpecField('Bed Max Temp', (printer.scraped_data as any).extracted_specs.bed_max_temp_c, '°C')}
                                          {renderSpecField('Sustained Temp', (printer.scraped_data as any).extracted_specs.sustained_nozzle_temp_c, '°C')}
                                        </div>
                                      </div>

                                      {/* Speed & Performance */}
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Speed & Performance</h5>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                          {renderSpecField('Max Print Speed', (printer.scraped_data as any).extracted_specs.max_print_speed_mms, 'mm/s')}
                                          {renderSpecField('Recommended Speed', (printer.scraped_data as any).extracted_specs.recommended_quality_speed_mms, 'mm/s')}
                                          {renderSpecField('Acceleration', (printer.scraped_data as any).extracted_specs.max_acceleration_xy_mmss, 'mm/s²')}
                                        </div>
                                      </div>

                                      {/* Extruder & Nozzle */}
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Extruder & Nozzle</h5>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                          {renderSpecField('Nozzle Diameter', (printer.scraped_data as any).extracted_specs.stock_nozzle_diameter_mm, 'mm')}
                                          {renderSpecField('Filament Diameter', (printer.scraped_data as any).extracted_specs.filament_diameter_mm, 'mm')}
                                          {renderSpecField('Extruder Count', (printer.scraped_data as any).extracted_specs.extruder_count)}
                                        </div>
                                      </div>

                                      {/* Connectivity */}
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Connectivity</h5>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                          {renderSpecField('WiFi', (printer.scraped_data as any).extracted_specs.has_wifi)}
                                          {renderSpecField('Ethernet', (printer.scraped_data as any).extracted_specs.has_ethernet)}
                                          {renderSpecField('Bluetooth', (printer.scraped_data as any).extracted_specs.has_bluetooth)}
                                          {renderSpecField('USB-A Port', (printer.scraped_data as any).extracted_specs.has_usb_a_port)}
                                          {renderSpecField('USB-C Port', (printer.scraped_data as any).extracted_specs.has_usb_c_port)}
                                          {renderSpecField('SD Card', (printer.scraped_data as any).extracted_specs.has_sd_card)}
                                        </div>
                                      </div>

                                      {/* Features */}
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Features</h5>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                          {renderSpecField('Auto Bed Leveling', (printer.scraped_data as any).extracted_specs.auto_bed_leveling)}
                                          {renderSpecField('ABL Method', (printer.scraped_data as any).extracted_specs.auto_bed_leveling_method)}
                                          {renderSpecField('Z-Offset Support', (printer.scraped_data as any).extracted_specs.z_offset_supported)}
                                          {renderSpecField('Enclosure', (printer.scraped_data as any).extracted_specs.has_enclosure)}
                                          {renderSpecField('Heated Enclosure', (printer.scraped_data as any).extracted_specs.enclosure_heated)}
                                          {renderSpecField('Multi-Material', (printer.scraped_data as any).extracted_specs.multi_material_supported)}
                                          {renderSpecField('Abrasive Support', (printer.scraped_data as any).extracted_specs.abrasive_materials_supported)}
                                          {renderSpecField('Remote Monitoring', (printer.scraped_data as any).extracted_specs.remote_monitoring_supported)}
                                          {renderSpecField('Remote Control', (printer.scraped_data as any).extracted_specs.remote_control_supported)}
                                          {renderSpecField('Input Shaping', (printer.scraped_data as any).extracted_specs.input_shaping_supported)}
                                          {renderSpecField('Power Loss Recovery', (printer.scraped_data as any).extracted_specs.power_loss_recovery)}
                                        </div>
                                      </div>

                                      {/* Advanced Features */}
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Advanced Features</h5>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                          {renderSpecField('Pressure Advance', (printer.scraped_data as any).extracted_specs.pressure_advance_supported)}
                                          {renderSpecField('Flow Calibration', (printer.scraped_data as any).extracted_specs.flow_calibration_supported)}
                                          {renderSpecField('Filament Runout', (printer.scraped_data as any).extracted_specs.filament_runout_detection)}
                                          {renderSpecField('Entanglement Detect', (printer.scraped_data as any).extracted_specs.filament_entanglement_detection)}
                                          {renderSpecField('AI Spaghetti Detect', (printer.scraped_data as any).extracted_specs.ai_spaghetti_detection)}
                                          {renderSpecField('Object Skip', (printer.scraped_data as any).extracted_specs.object_skip_supported)}
                                          {renderSpecField('Area Leveling', (printer.scraped_data as any).extracted_specs.area_leveling_supported)}
                                        </div>
                                      </div>

                                      {/* Hotend Details */}
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Hotend Details</h5>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                          {renderSpecField('Hotend Type', (printer.scraped_data as any).extracted_specs.hotend_type)}
                                          {renderSpecField('Material Composition', (printer.scraped_data as any).extracted_specs.hotend_material_composition)}
                                          {renderSpecField('Quick Release', (printer.scraped_data as any).extracted_specs.quick_release_hotend)}
                                          {renderSpecField('Supported Nozzles', (printer.scraped_data as any).extracted_specs.supported_nozzle_diameters_mm)}
                                          {renderSpecField('Extruder Type', (printer.scraped_data as any).extracted_specs.extruder_type)}
                                        </div>
                                      </div>

                                      {/* Package Specifications */}
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Package Specifications</h5>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                          {renderSpecField('Package Width', (printer.scraped_data as any).extracted_specs.package_width_mm, 'mm')}
                                          {renderSpecField('Package Depth', (printer.scraped_data as any).extracted_specs.package_depth_mm, 'mm')}
                                          {renderSpecField('Package Height', (printer.scraped_data as any).extracted_specs.package_height_mm, 'mm')}
                                          {renderSpecField('Package Weight', (printer.scraped_data as any).extracted_specs.package_weight_kg, 'kg')}
                                        </div>
                                      </div>

                                      {/* Display & System */}
                                      <div>
                                        <h5 className="text-sm font-medium mb-2">Display & System</h5>
                                        <div className="grid grid-cols-2 gap-1 text-sm">
                                          {renderSpecField('Screen Type', (printer.scraped_data as any).extracted_specs.screen_type)}
                                          {renderSpecField('Screen Size', (printer.scraped_data as any).extracted_specs.screen_size_inch, '"')}
                                          {renderSpecField('Bed Type', (printer.scraped_data as any).extracted_specs.bed_type)}
                                          {renderSpecField('Firmware', (printer.scraped_data as any).extracted_specs.firmware_family)}
                                          {renderSpecField('Languages', (printer.scraped_data as any).extracted_specs.ui_language_options)}
                                          {renderSpecField('Noise Level', (printer.scraped_data as any).extracted_specs.noise_level_printing_db, 'dB')}
                                          {renderSpecField('Technology', (printer.scraped_data as any).extracted_specs.printer_technology)}
                                          {renderSpecField('Supported Materials', (printer.scraped_data as any).extracted_specs.official_supported_materials)}
                                          {renderSpecField('MSRP', (printer.scraped_data as any).extracted_specs.msrp_usd, 'USD')}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {(printer.scraped_data as any)?.images?.product_images?.length > 0 && (
                                    <div>
                                      <div className="font-semibold mb-2">Product Images Found</div>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {(printer.scraped_data as any).images.product_images.slice(0, 5).map((img: string, i: number) => (
                                          <a 
                                            key={i}
                                            href={img} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="block text-xs text-primary hover:underline truncate"
                                          >
                                            {img}
                                          </a>
                                        ))}
                                        {(printer.scraped_data as any).images.product_images.length > 5 && (
                                          <div className="text-xs text-muted-foreground">
                                            + {(printer.scraped_data as any).images.product_images.length - 5} more
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </details>
                            )}

                            {printer.scrape_error && (
                              <Alert variant="destructive">
                                <AlertDescription className="text-sm">
                                  {printer.scrape_error}
                                </AlertDescription>
                              </Alert>
                            )}

                            {/* Specs Preview */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                              {printer.build_volume_x_mm && (
                                <div className="bg-muted p-2 rounded">
                                  <div className="text-xs text-muted-foreground">Build Volume</div>
                                  <div className="font-medium">
                                    {printer.build_volume_x_mm}×{printer.build_volume_y_mm}×{printer.build_volume_z_mm}mm
                                  </div>
                                </div>
                              )}
                              {printer.max_nozzle_temp_c && (
                                <div className="bg-muted p-2 rounded">
                                  <div className="text-xs text-muted-foreground">Max Nozzle Temp</div>
                                  <div className="font-medium">{printer.max_nozzle_temp_c}°C</div>
                                </div>
                              )}
                              {printer.bed_max_temp_c && (
                                <div className="bg-muted p-2 rounded">
                                  <div className="text-xs text-muted-foreground">Max Bed Temp</div>
                                  <div className="font-medium">{printer.bed_max_temp_c}°C</div>
                                </div>
                              )}
                              {printer.has_enclosure !== null && (
                                <div className="bg-muted p-2 rounded">
                                  <div className="text-xs text-muted-foreground">Enclosure</div>
                                  <div className="font-medium">
                                    {printer.has_enclosure ? "Yes" : "No"}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No pending printers to review. All discovered models have been processed.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-6">
            <PrinterDataComparisonPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}