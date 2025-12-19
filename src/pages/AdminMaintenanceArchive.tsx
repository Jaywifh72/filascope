import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { Loader2, Database, Image, CheckCircle, XCircle, AlertTriangle, Download, Globe, Upload, Link as LinkIcon, Sparkles, Package, Printer, FileText, ArrowLeft } from "lucide-react";

interface PrinterImageResult {
  printerId: string;
  printerName: string;
  status: "success" | "failed" | "skipped";
  imagesFound: number;
  error?: string;
}

interface CleanupResult {
  total_checked: number;
  invalid_found: number;
  fixed: number;
  errors: string[];
  invalid_records: Array<{
    id: string;
    product_title: string;
    vendor: string;
    featured_image: string;
  }>;
}

interface ScrapeResult {
  total_processed: number;
  images_found: number;
  images_uploaded: number;
  images_updated: number;
  errors: string[];
  processed_records: Array<{
    id: string;
    product_title: string;
    vendor: string;
    status: 'success' | 'no_url' | 'no_image_found' | 'upload_failed' | 'error';
    image_url?: string;
  }>;
}

const AdminMaintenanceArchive = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<CleanupResult | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeResult, setScrapeResult] = useState<ScrapeResult | null>(null);
  const [scrapeLimit, setScrapeLimit] = useState("50");
  const [forceRescrape, setForceRescrape] = useState(false);
  const [vendorFilter, setVendorFilter] = useState("all");
  const [selectedFilaments, setSelectedFilaments] = useState<string[]>([]);
  const [manualVendorFilter, setManualVendorFilter] = useState("all");
  const [editingFilament, setEditingFilament] = useState<{ id: string; title: string; currentImage: string | null } | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [accessoryImageType, setAccessoryImageType] = useState("all");
  const [isScrapingAccessoryImages, setIsScrapingAccessoryImages] = useState(false);
  const [accessoryImageResult, setAccessoryImageResult] = useState<{
    updated: number;
    failed: number;
    skipped: number;
    details: Array<{ name: string; status: string; image?: string }>;
  } | null>(null);
  const [forceAccessoryUpdate, setForceAccessoryUpdate] = useState(false);
  const [isScrapingPrinterImages, setIsScrapingPrinterImages] = useState(false);
  const [printerImageLimit, setPrinterImageLimit] = useState("10");
  const [forcePrinterRescrape, setForcePrinterRescrape] = useState(false);
  const [printerImageResult, setPrinterImageResult] = useState<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
    results: PrinterImageResult[];
  } | null>(null);
  const [isEnrichingPrinters, setIsEnrichingPrinters] = useState(false);
  const [printerEnrichLimit, setPrinterEnrichLimit] = useState("10");
  const [forceEnrichUpdate, setForceEnrichUpdate] = useState(false);
  const [printerEnrichResult, setPrinterEnrichResult] = useState<{
    success: boolean;
    total_processed: number;
    enriched: number;
    failed: number;
    results: Array<{
      id: string;
      model_name: string;
      brand: string;
      status: string;
      fields_updated: number;
      error?: string;
    }>;
  } | null>(null);
  const [isScrapingOverture, setIsScrapingOverture] = useState(false);
  const [overtureResult, setOvertureResult] = useState<{
    total: number;
    updated: number;
    failed: number;
    results: Array<{ id: string; title: string; status: string; image?: string }>;
  } | null>(null);
  const [isScrapingColorFabb, setIsScrapingColorFabb] = useState(false);
  const [colorFabbResult, setColorFabbResult] = useState<{
    total: number;
    updated: number;
    failed: number;
    skipped: number;
    details: Array<{ title: string; status: string; url?: string; image?: string }>;
  } | null>(null);
  const [isScrapingMatterHackers, setIsScrapingMatterHackers] = useState(false);
  const [matterHackersResult, setMatterHackersResult] = useState<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
    results: Array<{ id: string; title: string; status: string; image?: string }>;
  } | null>(null);
  const [isScrapingPrusament, setIsScrapingPrusament] = useState(false);
  const [prusamentResult, setPrusamentResult] = useState<{
    total: number;
    updated: number;
    failed: number;
    skipped: number;
    details: Array<{ title: string; status: string; url?: string; image?: string }>;
  } | null>(null);
  const [isScrapingTaulman, setIsScrapingTaulman] = useState(false);
  const [taulmanResult, setTaulmanResult] = useState<{
    total: number;
    updated: number;
    results: Array<{ id: string; title: string; status: string; image?: string }>;
  } | null>(null);
  const [isScrapingFillamentum, setIsScrapingFillamentum] = useState(false);
  const [fillamentumResult, setFillamentumResult] = useState<{
    processed: number;
    updated: number;
    errors: number;
    results: Array<{ id: string; title: string; status: string; image?: string }>;
  } | null>(null);
  const [isScrapingNewBrands, setIsScrapingNewBrands] = useState(false);
  const [newBrandLimit, setNewBrandLimit] = useState("50");
  const [newBrandForce, setNewBrandForce] = useState(false);
  const [newBrandResult, setNewBrandResult] = useState<{
    total: number;
    success: number;
    failed: number;
    results: Array<{ id: string; title: string; status: string; image?: string }>;
  } | null>(null);
  const [isScrapingParamount, setIsScrapingParamount] = useState(false);
  const [paramountLimit, setParamountLimit] = useState("50");
  const [paramountForce, setParamountForce] = useState(false);
  const [paramountResult, setParamountResult] = useState<{
    total: number;
    updated: number;
    failed: number;
    results: Array<{ id: string; title: string; price: number | null; temps: boolean; error?: string }>;
  } | null>(null);
  
  // Accessory TDS scraping state
  const [isScrapingAccessoryTds, setIsScrapingAccessoryTds] = useState(false);
  const [accessoryTdsType, setAccessoryTdsType] = useState("all");
  const [accessoryTdsLimit, setAccessoryTdsLimit] = useState("10");
  const [forceAccessoryTdsRescrape, setForceAccessoryTdsRescrape] = useState(false);
  const [accessoryTdsResult, setAccessoryTdsResult] = useState<{
    success: boolean;
    total_processed: number;
    tds_found: number;
    specs_extracted: number;
    failed: number;
    results: Array<{ id: string; name: string; status: string; tds_url?: string; specs_extracted?: number; error?: string }>;
  } | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all vendors
  const { data: vendors } = useQuery({
    queryKey: ['all-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('filaments')
        .select('vendor')
        .not('vendor', 'is', null)
        .order('vendor');
      
      if (error) throw error;
      
      const uniqueVendors = [...new Set(data.map(f => f.vendor))].filter(Boolean) as string[];
      return uniqueVendors.sort();
    },
  });

  // Fetch filaments for selected vendor (scraper)
  const { data: vendorFilaments } = useQuery({
    queryKey: ['vendor-filaments', vendorFilter],
    queryFn: async () => {
      if (vendorFilter === "all") return [];
      
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, featured_image, vendor')
        .eq('vendor', vendorFilter)
        .order('product_title');
      
      if (error) throw error;
      return data;
    },
    enabled: vendorFilter !== "all",
  });

  // Fetch filaments for manual management
  const { data: manualFilaments } = useQuery({
    queryKey: ['manual-filaments', manualVendorFilter],
    queryFn: async () => {
      if (manualVendorFilter === "all") return [];
      
      const { data, error } = await supabase
        .from('filaments')
        .select('id, product_title, featured_image, vendor')
        .eq('vendor', manualVendorFilter)
        .order('product_title');
      
      if (error) throw error;
      return data;
    },
    enabled: manualVendorFilter !== "all",
  });

  const runImageCleanup = async () => {
    setIsRunning(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('cleanup-images', {
        method: 'POST'
      });

      if (error) throw error;

      if (data.result) {
        setResult(data.result);
        toast({
          title: "Cleanup Complete",
          description: data.message,
        });
      }
    } catch (error) {
      console.error('Cleanup error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run cleanup",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };

  const updateImageMutation = useMutation({
    mutationFn: async ({ filamentId, imageUrl }: { filamentId: string; imageUrl: string }) => {
      const { error } = await supabase
        .from('filaments')
        .update({ featured_image: imageUrl })
        .eq('id', filamentId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manual-filaments'] });
      toast({
        title: "Success",
        description: "Image updated successfully",
      });
      setEditingFilament(null);
      setNewImageUrl("");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update image",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = async (filamentId: string, file: File) => {
    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${filamentId}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('filament-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('filament-images')
        .getPublicUrl(filePath);

      await updateImageMutation.mutateAsync({ filamentId, imageUrl: publicUrl });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to upload image",
        variant: "destructive",
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const runImageScraper = async () => {
    setIsScraping(true);
    setScrapeResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-images', {
        method: 'POST',
        body: { 
          limit: selectedFilaments.length > 0 ? selectedFilaments.length : parseInt(scrapeLimit),
          forceRescrape: forceRescrape,
          vendor: vendorFilter === "all" ? null : vendorFilter,
          filamentIds: selectedFilaments.length > 0 ? selectedFilaments : undefined
        }
      });

      if (error) throw error;

      if (data.result) {
        setScrapeResult(data.result);
        toast({
          title: "Scraping Complete",
          description: data.message,
        });
      }
    } catch (error) {
      console.error('Scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run scraper",
        variant: "destructive",
      });
    } finally {
      setIsScraping(false);
    }
  };

  const runAccessoryImageScraper = async () => {
    setIsScrapingAccessoryImages(true);
    setAccessoryImageResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-accessory-images', {
        method: 'POST',
        body: { 
          accessoryType: accessoryImageType === "all" ? null : accessoryImageType,
          forceUpdate: forceAccessoryUpdate
        }
      });

      if (error) throw error;

      setAccessoryImageResult(data);
      toast({
        title: "AI Image Scraping Complete",
        description: `Updated ${data.updated} accessories, ${data.skipped} skipped, ${data.failed} failed`,
      });
    } catch (error) {
      console.error('Accessory image scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run AI image scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingAccessoryImages(false);
    }
  };

  const runPrinterImageScraper = async () => {
    setIsScrapingPrinterImages(true);
    setPrinterImageResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('scrape-printer-images', {
        method: 'POST',
        body: { 
          limit: parseInt(printerImageLimit),
          forceRescrape: forcePrinterRescrape
        }
      });

      if (error) throw error;

      setPrinterImageResult(data.summary ? { ...data.summary, results: data.results } : data);
      toast({
        title: "Printer Image Scraping Complete",
        description: `Success: ${data.summary?.success || 0}, Failed: ${data.summary?.failed || 0}, Skipped: ${data.summary?.skipped || 0}`,
      });
    } catch (error) {
      console.error('Printer image scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run printer image scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingPrinterImages(false);
    }
  };

  const runPrinterEnrichment = async () => {
    setIsEnrichingPrinters(true);
    setPrinterEnrichResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('enrich-printer-data', {
        method: 'POST',
        body: { 
          limit: parseInt(printerEnrichLimit),
          forceUpdate: forceEnrichUpdate
        }
      });

      if (error) throw error;

      setPrinterEnrichResult(data);
      toast({
        title: "Printer Enrichment Complete",
        description: `Enriched: ${data.enriched}, Failed: ${data.failed}`,
      });
    } catch (error) {
      console.error('Printer enrichment error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run printer enrichment",
        variant: "destructive",
      });
    } finally {
      setIsEnrichingPrinters(false);
    }
  };

  const runOvertureImageScraper = async () => {
    setIsScrapingOverture(true);
    setOvertureResult(null);

    toast({
      title: "Overture Scraping Started",
      description: "This processes 47 filaments and takes 2-3 minutes.",
    });

    try {
      const { data, error } = await supabase.functions.invoke('scrape-overture-images', {
        method: 'POST',
        body: {}
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('FunctionsFetchError')) {
          toast({
            title: "Running in Background",
            description: "The scraper is still running. Refresh in 2-3 minutes to see updated images.",
          });
          return;
        }
        throw error;
      }

      setOvertureResult(data);
      toast({
        title: "Overture Image Scraping Complete",
        description: `Updated: ${data.updated}, Failed: ${data.failed}`,
      });
    } catch (error) {
      console.error('Overture scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run Overture image scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingOverture(false);
    }
  };

  const runColorFabbImageScraper = async () => {
    setIsScrapingColorFabb(true);
    setColorFabbResult(null);

    toast({
      title: "ColorFabb Scraping Started",
      description: "This processes 32 filaments with web scraping. It may take 2-3 minutes.",
    });

    try {
      const { data, error } = await supabase.functions.invoke('scrape-colorfabb-images', {
        method: 'POST',
        body: {}
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('FunctionsFetchError')) {
          toast({
            title: "Running in Background",
            description: "The scraper is still running. Refresh in 2-3 minutes to see updated images.",
          });
          return;
        }
        throw error;
      }

      setColorFabbResult(data);
      toast({
        title: "ColorFabb Image Scraping Complete",
        description: `Updated: ${data.updated}, Failed: ${data.failed}, Skipped: ${data.skipped}`,
      });
    } catch (error) {
      console.error('ColorFabb scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run ColorFabb image scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingColorFabb(false);
    }
  };

  const runMatterHackersImageScraper = async () => {
    setIsScrapingMatterHackers(true);
    setMatterHackersResult(null);

    toast({
      title: "MatterHackers Scraping Started",
      description: "Scraping product images from MatterHackers product pages...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('scrape-matterhackers-images', {
        method: 'POST',
        body: {}
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('FunctionsFetchError')) {
          toast({
            title: "Running in Background",
            description: "The scraper is still running. Refresh in 1-2 minutes to see updated images.",
          });
          return;
        }
        throw error;
      }

      setMatterHackersResult(data);
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      toast({
        title: "MatterHackers Image Scraping Complete",
        description: `Success: ${data.success}, Failed: ${data.failed}, Skipped: ${data.skipped}`,
      });
    } catch (error) {
      console.error('MatterHackers scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run MatterHackers image scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingMatterHackers(false);
    }
  };

  const runPrusamentImageScraper = async () => {
    setIsScrapingPrusament(true);
    setPrusamentResult(null);

    toast({
      title: "Prusament Scraping Started",
      description: "Scraping product images from Prusament product pages...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('scrape-prusament-images', {
        method: 'POST',
        body: { forceUpdate: true }
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('FunctionsFetchError')) {
          toast({
            title: "Running in Background",
            description: "The scraper is still running. Refresh in 2-3 minutes to see updated images.",
          });
          return;
        }
        throw error;
      }

      setPrusamentResult(data);
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      toast({
        title: "Prusament Image Scraping Complete",
        description: `Updated: ${data.updated}, Failed: ${data.failed}, Skipped: ${data.skipped}`,
      });
    } catch (error) {
      console.error('Prusament scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run Prusament image scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingPrusament(false);
    }
  };

  const runTaulmanImageScraper = async () => {
    setIsScrapingTaulman(true);
    setTaulmanResult(null);

    toast({
      title: "Taulman3D Scraping Started",
      description: "Scraping product images from 3dmakerworld product pages...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('scrape-taulman-images', {
        method: 'POST'
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('FunctionsFetchError')) {
          toast({
            title: "Running in Background",
            description: "The scraper is still running. Refresh in 2-3 minutes to see updated images.",
          });
          return;
        }
        throw error;
      }

      setTaulmanResult(data);
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      toast({
        title: "Taulman3D Image Scraping Complete",
        description: `Updated: ${data.updated}/${data.total} images`,
      });
    } catch (error) {
      console.error('Taulman3D scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run Taulman3D image scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingTaulman(false);
    }
  };

  const runFillamentumImageScraper = async () => {
    setIsScrapingFillamentum(true);
    setFillamentumResult(null);

    toast({
      title: "Fillamentum Scraping Started",
      description: "Scraping product images from Fillamentum collection pages...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('fix-fillamentum-images', {
        method: 'POST',
        body: {}
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('FunctionsFetchError')) {
          toast({
            title: "Running in Background",
            description: "The scraper is still running. Refresh in 2-3 minutes to see updated images.",
          });
          return;
        }
        throw error;
      }

      setFillamentumResult({
        processed: data.stats?.processed || 0,
        updated: data.stats?.updated || 0,
        errors: data.stats?.errors || 0,
        results: data.results || []
      });
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      toast({
        title: "Fillamentum Image Scraping Complete",
        description: `Updated: ${data.stats?.updated || 0}/${data.stats?.processed || 0} images`,
      });
    } catch (error) {
      console.error('Fillamentum scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run Fillamentum image scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingFillamentum(false);
    }
  };

  const runNewBrandImageScraper = async () => {
    setIsScrapingNewBrands(true);
    setNewBrandResult(null);

    toast({
      title: "New Brand Image Scraping Started",
      description: "Scraping product images for VoxelPLA, 3DFuel, Eryone, Inland, Fiberlogy, Ziro, and Paramount 3D...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('scrape-new-brand-images', {
        method: 'POST',
        body: { 
          limit: parseInt(newBrandLimit),
          force: newBrandForce,
          brands: ["VoxelPLA", "3DFuel", "Eryone", "Inland", "Fiberlogy", "Ziro", "Paramount 3D"]
        }
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('FunctionsFetchError')) {
          toast({
            title: "Running in Background",
            description: "The scraper is still running. Refresh in 2-3 minutes to see updated images.",
          });
          return;
        }
        throw error;
      }

      setNewBrandResult(data);
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      toast({
        title: "New Brand Image Scraping Complete",
        description: `Success: ${data.success}, Failed: ${data.failed}`,
      });
    } catch (error) {
      console.error('New brand scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run new brand image scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingNewBrands(false);
    }
  };

  const runParamountPriceScraper = async () => {
    setIsScrapingParamount(true);
    setParamountResult(null);

    toast({
      title: "Paramount 3D Price Scraping Started",
      description: "Scraping prices and temperature specs from product pages...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('scrape-paramount-prices', {
        method: 'POST',
        body: { 
          limit: parseInt(paramountLimit),
          force: paramountForce,
        }
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('FunctionsFetchError')) {
          toast({
            title: "Running in Background",
            description: "The scraper is still running. Refresh in 2-3 minutes to see updated prices.",
          });
          return;
        }
        throw error;
      }

      setParamountResult(data);
      queryClient.invalidateQueries({ queryKey: ['filaments'] });
      toast({
        title: "Paramount 3D Price Scraping Complete",
        description: `Updated: ${data.updated}, Failed: ${data.failed}`,
      });
    } catch (error) {
      console.error('Paramount scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run Paramount 3D price scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingParamount(false);
    }
  };

  const runAccessoryTdsScraper = async () => {
    setIsScrapingAccessoryTds(true);
    setAccessoryTdsResult(null);

    toast({
      title: "Accessory TDS Scraping Started",
      description: "Discovering TDS links and extracting specifications with AI...",
    });

    try {
      const { data, error } = await supabase.functions.invoke('scrape-accessory-tds', {
        method: 'POST',
        body: { 
          accessoryType: accessoryTdsType === "all" ? null : accessoryTdsType,
          forceRescrape: forceAccessoryTdsRescrape,
          limit: parseInt(accessoryTdsLimit)
        }
      });

      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('FunctionsFetchError')) {
          toast({
            title: "Running in Background",
            description: "The scraper is still running. Refresh in 2-3 minutes to see results.",
          });
          return;
        }
        throw error;
      }

      setAccessoryTdsResult(data);
      toast({
        title: "Accessory TDS Scraping Complete",
        description: `Found: ${data.tds_found} TDS, Extracted specs: ${data.specs_extracted}, Failed: ${data.failed}`,
      });
    } catch (error) {
      console.error('Accessory TDS scraping error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to run accessory TDS scraper",
        variant: "destructive",
      });
    } finally {
      setIsScrapingAccessoryTds(false);
    }
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="flex items-center gap-4">
        <Link to="/admin/maintenance">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Scraping
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold mb-2">Maintenance Archive</h1>
          <p className="text-muted-foreground">
            Legacy scrapers and maintenance tools for various brands
          </p>
        </div>
      </div>

      {/* Image Cleanup Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            <CardTitle>Featured Image Cleanup</CardTitle>
          </div>
          <CardDescription>
            Identifies and fixes filament records with invalid featured_image URLs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={runImageCleanup} 
            disabled={isRunning}
            className="w-full sm:w-auto"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Running Cleanup...
              </>
            ) : (
              <>
                <Database className="w-4 h-4 mr-2" />
                Run Image Cleanup
              </>
            )}
          </Button>

          {result && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-2xl font-bold">{result.total_checked}</div>
                  <div className="text-sm text-muted-foreground">Records Checked</div>
                </div>
                <div className="bg-orange-500/10 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-500" />
                    <div className="text-2xl font-bold">{result.invalid_found}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Invalid Found</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="text-2xl font-bold">{result.fixed}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Fixed</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div className="text-2xl font-bold">{result.errors.length}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Image Scraper */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <CardTitle>Product Image Scraper</CardTitle>
          </div>
          <CardDescription>
            Automatically scrape and download product images from vendor websites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Number of filaments to process</Label>
              <Input
                type="number"
                value={scrapeLimit}
                onChange={(e) => setScrapeLimit(e.target.value)}
                min="1"
                max="200"
                disabled={selectedFilaments.length > 0}
              />
            </div>
            <div className="space-y-2">
              <Label>Vendor filter</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All vendors</SelectItem>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>{vendor}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="force-rescrape"
              checked={forceRescrape}
              onChange={(e) => setForceRescrape(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <Label htmlFor="force-rescrape">Force rescrape</Label>
          </div>

          <Button onClick={runImageScraper} disabled={isScraping}>
            {isScraping ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scraping...</> : <><Download className="w-4 h-4 mr-2" />Scrape Images</>}
          </Button>
        </CardContent>
      </Card>

      {/* Brand-specific scrapers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Overture */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-lg">Overture 3D</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={runOvertureImageScraper} disabled={isScrapingOverture} size="sm">
              {isScrapingOverture ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Scrape
            </Button>
          </CardContent>
        </Card>

        {/* ColorFabb */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-purple-500" />
              <CardTitle className="text-lg">ColorFabb</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={runColorFabbImageScraper} disabled={isScrapingColorFabb} size="sm">
              {isScrapingColorFabb ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Scrape
            </Button>
          </CardContent>
        </Card>

        {/* MatterHackers */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-lg">MatterHackers</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={runMatterHackersImageScraper} disabled={isScrapingMatterHackers} size="sm">
              {isScrapingMatterHackers ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Scrape
            </Button>
          </CardContent>
        </Card>

        {/* Prusament */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-orange-600" />
              <CardTitle className="text-lg">Prusament</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={runPrusamentImageScraper} disabled={isScrapingPrusament} size="sm">
              {isScrapingPrusament ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Scrape
            </Button>
          </CardContent>
        </Card>

        {/* Taulman3D */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-green-500" />
              <CardTitle className="text-lg">Taulman3D</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={runTaulmanImageScraper} disabled={isScrapingTaulman} size="sm">
              {isScrapingTaulman ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Scrape
            </Button>
          </CardContent>
        </Card>

        {/* Fillamentum */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-red-500" />
              <CardTitle className="text-lg">Fillamentum</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={runFillamentumImageScraper} disabled={isScrapingFillamentum} size="sm">
              {isScrapingFillamentum ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Scrape
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Printer Image Scraper */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            <CardTitle>Printer Image Scraper</CardTitle>
          </div>
          <CardDescription>
            Scrape product images for 3D printers from manufacturer websites
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Limit</Label>
              <Input
                type="number"
                value={printerImageLimit}
                onChange={(e) => setPrinterImageLimit(e.target.value)}
                min="1"
                max="100"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="force-printer-rescrape"
              checked={forcePrinterRescrape}
              onCheckedChange={(checked) => setForcePrinterRescrape(checked === true)}
            />
            <Label htmlFor="force-printer-rescrape">Force rescrape</Label>
          </div>
          <Button onClick={runPrinterImageScraper} disabled={isScrapingPrinterImages}>
            {isScrapingPrinterImages ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scraping...</> : <><Printer className="w-4 h-4 mr-2" />Scrape Printer Images</>}
          </Button>
        </CardContent>
      </Card>

      {/* Printer Enrichment */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <CardTitle>AI Printer Enrichment</CardTitle>
          </div>
          <CardDescription>
            Use AI to enrich printer specifications from product pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Limit</Label>
              <Input
                type="number"
                value={printerEnrichLimit}
                onChange={(e) => setPrinterEnrichLimit(e.target.value)}
                min="1"
                max="50"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="force-enrich-update"
              checked={forceEnrichUpdate}
              onCheckedChange={(checked) => setForceEnrichUpdate(checked === true)}
            />
            <Label htmlFor="force-enrich-update">Force update</Label>
          </div>
          <Button onClick={runPrinterEnrichment} disabled={isEnrichingPrinters}>
            {isEnrichingPrinters ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enriching...</> : <><Sparkles className="w-4 h-4 mr-2" />Enrich Printers</>}
          </Button>
        </CardContent>
      </Card>

      {/* New Brand Image Scraper */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <CardTitle>Multi-Brand Image Scraper</CardTitle>
          </div>
          <CardDescription>
            VoxelPLA, 3DFuel, Eryone, Inland, Fiberlogy, Ziro, Paramount 3D
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Limit</Label>
            <Input
              type="number"
              value={newBrandLimit}
              onChange={(e) => setNewBrandLimit(e.target.value)}
              min="1"
              max="200"
              className="w-32"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="new-brand-force"
              checked={newBrandForce}
              onCheckedChange={(checked) => setNewBrandForce(checked === true)}
            />
            <Label htmlFor="new-brand-force">Force rescrape</Label>
          </div>
          <Button onClick={runNewBrandImageScraper} disabled={isScrapingNewBrands}>
            {isScrapingNewBrands ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scraping...</> : <><Package className="w-4 h-4 mr-2" />Scrape Multi-Brand Images</>}
          </Button>
        </CardContent>
      </Card>

      {/* Paramount 3D Price Scraper */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            <CardTitle>Paramount 3D Price Scraper</CardTitle>
          </div>
          <CardDescription>
            Scrape prices and temperature specifications from Paramount 3D product pages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Limit</Label>
            <Input
              type="number"
              value={paramountLimit}
              onChange={(e) => setParamountLimit(e.target.value)}
              min="1"
              max="150"
              className="w-32"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="paramount-force"
              checked={paramountForce}
              onCheckedChange={(checked) => setParamountForce(checked === true)}
            />
            <Label htmlFor="paramount-force">Force rescrape</Label>
          </div>
          <Button onClick={runParamountPriceScraper} disabled={isScrapingParamount}>
            {isScrapingParamount ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scraping...</> : <><Package className="w-4 h-4 mr-2" />Scrape Paramount Prices</>}
          </Button>
        </CardContent>
      </Card>

      {/* Accessory AI Image Scraper */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            <CardTitle>Accessory AI Image Scraper</CardTitle>
          </div>
          <CardDescription>
            Use AI to discover and download accessory product images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Accessory Type</Label>
              <Select value={accessoryImageType} onValueChange={setAccessoryImageType}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hotend">Hotends</SelectItem>
                  <SelectItem value="build_plate">Build Plates</SelectItem>
                  <SelectItem value="ams_mmu">AMS/MMU</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="force-accessory-update"
              checked={forceAccessoryUpdate}
              onCheckedChange={(checked) => setForceAccessoryUpdate(checked === true)}
            />
            <Label htmlFor="force-accessory-update">Force update</Label>
          </div>
          <Button onClick={runAccessoryImageScraper} disabled={isScrapingAccessoryImages}>
            {isScrapingAccessoryImages ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scraping...</> : <><Sparkles className="w-4 h-4 mr-2" />Scrape Accessory Images</>}
          </Button>
        </CardContent>
      </Card>

      {/* Accessory TDS Scraper */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <CardTitle>Accessory TDS Scraper</CardTitle>
          </div>
          <CardDescription>
            Discover Technical Data Sheet links and extract specifications using AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={accessoryTdsType} onValueChange={setAccessoryTdsType}>
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hotend">Hotends</SelectItem>
                  <SelectItem value="build_plate">Build Plates</SelectItem>
                  <SelectItem value="ams_mmu">AMS/MMU</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Limit</Label>
              <Input
                type="number"
                value={accessoryTdsLimit}
                onChange={(e) => setAccessoryTdsLimit(e.target.value)}
                min="1"
                max="50"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="force-tds-rescrape"
              checked={forceAccessoryTdsRescrape}
              onCheckedChange={(checked) => setForceAccessoryTdsRescrape(checked === true)}
            />
            <Label htmlFor="force-tds-rescrape">Force rescrape</Label>
          </div>
          <Button onClick={runAccessoryTdsScraper} disabled={isScrapingAccessoryTds}>
            {isScrapingAccessoryTds ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scraping...</> : <><FileText className="w-4 h-4 mr-2" />Scrape Accessory TDS</>}
          </Button>
        </CardContent>
      </Card>

      {/* Manual Image Management Dialog */}
      <Dialog open={!!editingFilament} onOpenChange={() => { setEditingFilament(null); setNewImageUrl(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Image</DialogTitle>
            <DialogDescription>
              {editingFilament?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingFilament?.currentImage && (
              <div className="aspect-square w-32 mx-auto bg-muted rounded overflow-hidden">
                <img src={editingFilament.currentImage} alt="Current" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-2">
              <Label>Image URL</Label>
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Or upload file</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && editingFilament) {
                    handleImageUpload(editingFilament.id, file);
                  }
                }}
                disabled={uploadingImage}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditingFilament(null); setNewImageUrl(""); }}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingFilament && newImageUrl) {
                  updateImageMutation.mutate({ filamentId: editingFilament.id, imageUrl: newImageUrl });
                }
              }}
              disabled={!newImageUrl || updateImageMutation.isPending}
            >
              {updateImageMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Save URL
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMaintenanceArchive;
