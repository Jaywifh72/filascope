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
import { ArrowLeft, Search, Package, ExternalLink, Image as ImageIcon, Trash2, Barcode, Loader2 } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

type Filament = Tables<"filaments">;

const AdminFilaments = () => {
  const { isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [filaments, setFilaments] = useState<Filament[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilaments, setSelectedFilaments] = useState<Set<string>>(new Set());
  const [scrapingUpcs, setScrapingUpcs] = useState(false);
  const [upcDialogOpen, setUpcDialogOpen] = useState(false);
  const [selectedBrandsForUpc, setSelectedBrandsForUpc] = useState<Set<string>>(new Set());
  const [showMissingUpcOnly, setShowMissingUpcOnly] = useState(false);
  const [showMissingSkuOnly, setShowMissingSkuOnly] = useState(false);
  const [forceUpdateScrape, setForceUpdateScrape] = useState(false);
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
    const { data, error } = await supabase
      .from("filaments")
      .select("*")
      .order("vendor", { ascending: true })
      .order("product_title", { ascending: true });

    if (error) {
      toast.error("Failed to fetch filaments");
      console.error(error);
    } else {
      setFilaments(data || []);
    }
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

  // Get unique vendors for UPC dialog
  const uniqueVendorsList = useMemo(() => {
    return Array.from(new Set(filaments.map((f) => f.vendor).filter(Boolean))).sort() as string[];
  }, [filaments]);

  const toggleBrandForUpc = (brand: string) => {
    setSelectedBrandsForUpc((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(brand)) {
        newSet.delete(brand);
      } else {
        newSet.add(brand);
      }
      return newSet;
    });
  };

  const handleScrapeUpcs = async () => {
    if (selectedBrandsForUpc.size === 0) {
      toast.error("Please select at least one brand");
      return;
    }

    setScrapingUpcs(true);
    setUpcDialogOpen(false);
    
    try {
      toast.info(`Scraping UPC codes for ${selectedBrandsForUpc.size} brand(s)...`);
      const { data, error } = await supabase.functions.invoke('scrape-filament-upcs', {
        body: { 
          brands: Array.from(selectedBrandsForUpc),
          limit: 200, 
          forceUpdate: forceUpdateScrape 
        }
      });

      if (error) throw error;

      toast.success(`Scraped UPCs: ${data.updated} updated, ${data.skipped} skipped, ${data.failed} failed`);
      setSelectedBrandsForUpc(new Set());
      fetchFilaments();
    } catch (error: any) {
      toast.error(error.message || "Failed to scrape UPC codes");
      console.error(error);
    } finally {
      setScrapingUpcs(false);
    }
  };

  const handleScrapeSelectedUpcs = async () => {
    // Use selected filaments if any are selected, otherwise use filtered filaments missing UPC
    const idsToScrape = selectedFilaments.size > 0 
      ? Array.from(selectedFilaments)
      : filteredFilaments.filter(f => !f.upc).map(f => f.id);

    if (idsToScrape.length === 0) {
      toast.error("No filaments to scrape");
      return;
    }

    setScrapingUpcs(true);
    
    try {
      toast.info(`Scraping UPC codes for ${idsToScrape.length} filament(s)...`);
      const { data, error } = await supabase.functions.invoke('scrape-filament-upcs', {
        body: { 
          filamentIds: idsToScrape,
          forceUpdate: forceUpdateScrape 
        }
      });

      if (error) throw error;

      toast.success(`Scraped UPCs: ${data.updated} updated, ${data.skipped} skipped, ${data.failed} failed`);
      fetchFilaments();
    } catch (error: any) {
      toast.error(error.message || "Failed to scrape UPC codes");
      console.error(error);
    } finally {
      setScrapingUpcs(false);
    }
  };

  const filteredFilaments = filaments.filter((f) => {
    const matchesSearch =
      f.product_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.vendor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.material?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesUpcFilter = showMissingUpcOnly ? !f.upc : true;
    const matchesSkuFilter = showMissingSkuOnly ? !f.variant_sku : true;
    const matchesVendor = vendorFilter === "all" || f.vendor === vendorFilter;
    
    return matchesSearch && matchesUpcFilter && matchesSkuFilter && matchesVendor;
  });

  // Stats
  const totalFilaments = filaments.length;
  const filamentsWithImages = filaments.filter((f) => f.featured_image).length;
  const filamentsWithPrices = filaments.filter((f) => f.variant_price).length;
  const filamentsWithTDS = filaments.filter((f) => f.tds_url).length;
  const filamentsWithUpc = filaments.filter((f) => f.upc).length;
  const filamentsWithSku = filaments.filter((f) => f.variant_sku).length;
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

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Filaments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalFilaments}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{filamentsWithImages}</p>
              <p className="text-xs text-muted-foreground">
                {totalFilaments > 0
                  ? Math.round((filamentsWithImages / totalFilaments) * 100)
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With Prices
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{filamentsWithPrices}</p>
              <p className="text-xs text-muted-foreground">
                {totalFilaments > 0
                  ? Math.round((filamentsWithPrices / totalFilaments) * 100)
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                With TDS
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{filamentsWithTDS}</p>
              <p className="text-xs text-muted-foreground">
                {totalFilaments > 0
                  ? Math.round((filamentsWithTDS / totalFilaments) * 100)
                  : 0}
                %
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Vendors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{uniqueVendors}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
            <SelectContent className="bg-background border z-50">
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
          <Dialog open={upcDialogOpen} onOpenChange={setUpcDialogOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                disabled={scrapingUpcs}
              >
                {scrapingUpcs ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Barcode className="w-4 h-4 mr-2" />
                )}
                Scrape UPCs
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Scrape UPC Codes</DialogTitle>
                <DialogDescription>
                  Select brands to scrape UPC codes from their Shopify stores.
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="max-h-[300px] pr-4">
                <div className="space-y-2">
                  {uniqueVendorsList.map((brand) => (
                    <div key={brand} className="flex items-center space-x-2">
                      <Checkbox
                        id={`brand-${brand}`}
                        checked={selectedBrandsForUpc.has(brand)}
                        onCheckedChange={() => toggleBrandForUpc(brand)}
                      />
                      <label
                        htmlFor={`brand-${brand}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {brand}
                      </label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Checkbox
                  id="force-update"
                  checked={forceUpdateScrape}
                  onCheckedChange={(checked) => setForceUpdateScrape(checked === true)}
                />
                <label htmlFor="force-update" className="text-sm cursor-pointer">
                  Force update (re-scrape even if UPC exists, useful for fetching missing SKUs)
                </label>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setUpcDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleScrapeUpcs}
                  disabled={selectedBrandsForUpc.size === 0}
                >
                  Scrape {selectedBrandsForUpc.size} Brand(s)
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {(selectedFilaments.size > 0 || filteredFilaments.length > 0) && (
            <Button
              variant="secondary"
              onClick={handleScrapeSelectedUpcs}
              disabled={scrapingUpcs}
            >
              {scrapingUpcs ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Barcode className="w-4 h-4 mr-2" />
              )}
              Scrape UPCs ({selectedFilaments.size > 0 ? selectedFilaments.size : filteredFilaments.filter(f => !f.upc).length})
            </Button>
          )}
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Weight</TableHead>
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
                        {filament.variant_sku || "-"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {filament.variant_price
                        ? `$${filament.variant_price.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {filament.net_weight_g ? `${filament.net_weight_g}g` : "-"}
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
