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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Database, Image, CheckCircle, XCircle, AlertTriangle, Download, Globe, Upload, Link as LinkIcon } from "lucide-react";

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

const AdminMaintenance = () => {
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
      
      // Get unique vendors
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

      if (error) {
        throw error;
      }

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

      if (error) {
        throw error;
      }

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

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Database Maintenance</h1>
        <p className="text-muted-foreground">
          Tools for maintaining and cleaning up database records
        </p>
      </div>

      {/* Image Cleanup Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Image className="w-5 h-5" />
            <CardTitle>Featured Image Cleanup</CardTitle>
          </div>
          <CardDescription>
            Identifies and fixes filament records with invalid featured_image URLs (timestamps, broken links, etc.)
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

              {result.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="font-semibold mb-2">Errors encountered:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {result.errors.slice(0, 5).map((error, i) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                      {result.errors.length > 5 && (
                        <li className="text-sm">... and {result.errors.length - 5} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {result.invalid_records.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Invalid Records Fixed:</h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {result.invalid_records.map((record) => (
                      <div key={record.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="font-medium">{record.product_title}</div>
                            <div className="text-muted-foreground">
                              <Badge variant="outline" className="text-xs">{record.vendor}</Badge>
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground font-mono max-w-xs truncate">
                            {record.featured_image}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Image Scraper Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            <CardTitle>Product Image Scraper</CardTitle>
          </div>
          <CardDescription>
            Automatically scrape and download product images from vendor websites for filaments with missing images
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scrape-limit">Number of filaments to process</Label>
              <Input
                id="scrape-limit"
                type="number"
                value={scrapeLimit}
                onChange={(e) => setScrapeLimit(e.target.value)}
                min="1"
                max="200"
                className="w-full"
                disabled={selectedFilaments.length > 0}
              />
              <p className="text-xs text-muted-foreground">
                {selectedFilaments.length > 0 
                  ? `${selectedFilaments.length} filament(s) selected`
                  : "Processing many filaments may take several minutes"
                }
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vendor-filter">Vendor filter (optional)</Label>
              <Select value={vendorFilter} onValueChange={setVendorFilter}>
                <SelectTrigger id="vendor-filter" className="w-full bg-background">
                  <SelectValue placeholder="All vendors" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  <SelectItem value="all">All vendors</SelectItem>
                  {vendors?.map((vendor) => (
                    <SelectItem key={vendor} value={vendor}>
                      {vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select a specific vendor or leave as "All vendors"
              </p>
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
            <Label htmlFor="force-rescrape" className="cursor-pointer">
              Force rescrape (overwrite existing images)
            </Label>
          </div>

          <Button 
            onClick={runImageScraper} 
            disabled={isScraping}
            className="w-full sm:w-auto"
          >
            {isScraping ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Scraping Images...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                {selectedFilaments.length > 0 
                  ? `Scrape ${selectedFilaments.length} Selected`
                  : "Scrape & Download Images"
                }
              </>
            )}
          </Button>

          {vendorFilter !== "all" && vendorFilaments && vendorFilaments.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-sm">Filaments for {vendorFilter}</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFilaments(vendorFilaments.map(f => f.id))}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFilaments([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
                {vendorFilaments.map((filament) => (
                  <div
                    key={filament.id}
                    className={`relative rounded-lg border-2 p-2 cursor-pointer transition-all ${
                      selectedFilaments.includes(filament.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => {
                      setSelectedFilaments(prev =>
                        prev.includes(filament.id)
                          ? prev.filter(id => id !== filament.id)
                          : [...prev, filament.id]
                      );
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedFilaments.includes(filament.id)}
                      onChange={() => {}}
                      className="absolute top-2 right-2 w-4 h-4 z-10"
                    />
                    <div className="aspect-square bg-muted rounded overflow-hidden mb-2">
                      {filament.featured_image ? (
                        <img
                          src={filament.featured_image}
                          alt={filament.product_title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Image className="w-8 h-8" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs line-clamp-2 text-center">{filament.product_title}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {scrapeResult && (
            <div className="space-y-4 pt-4 border-t">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="text-2xl font-bold">{scrapeResult.total_processed}</div>
                  <div className="text-sm text-muted-foreground">Processed</div>
                </div>
                <div className="bg-blue-500/10 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <Image className="w-5 h-5 text-blue-500" />
                    <div className="text-2xl font-bold">{scrapeResult.images_found}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Images Found</div>
                </div>
                <div className="bg-green-500/10 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div className="text-2xl font-bold">{scrapeResult.images_updated}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Updated</div>
                </div>
                <div className="bg-red-500/10 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-red-500" />
                    <div className="text-2xl font-bold">{scrapeResult.errors.length}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
              </div>

              {scrapeResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertDescription>
                    <div className="font-semibold mb-2">Errors encountered:</div>
                    <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                      {scrapeResult.errors.slice(0, 10).map((error, i) => (
                        <li key={i} className="text-sm">{error}</li>
                      ))}
                      {scrapeResult.errors.length > 10 && (
                        <li className="text-sm">... and {scrapeResult.errors.length - 10} more</li>
                      )}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {scrapeResult.processed_records.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Processing Results:</h3>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {scrapeResult.processed_records.map((record) => (
                      <div key={record.id} className="bg-muted/50 rounded-lg p-3 text-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="font-medium">{record.product_title}</div>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="text-xs">{record.vendor}</Badge>
                              <Badge 
                                variant={
                                  record.status === 'success' ? 'default' : 
                                  record.status === 'no_url' || record.status === 'no_image_found' ? 'secondary' : 
                                  'destructive'
                                } 
                                className="text-xs"
                              >
                                {record.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                                {record.status === 'error' && <XCircle className="w-3 h-3 mr-1" />}
                                {record.status === 'no_image_found' && <AlertTriangle className="w-3 h-3 mr-1" />}
                                {record.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            {record.image_url && (
                              <div className="text-xs text-muted-foreground font-mono truncate max-w-md">
                                {record.image_url}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Image Management Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            <CardTitle>Manual Image Management</CardTitle>
          </div>
          <CardDescription>
            Manually upload or link images for individual filaments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-vendor-filter">Select vendor</Label>
            <Select value={manualVendorFilter} onValueChange={setManualVendorFilter}>
              <SelectTrigger id="manual-vendor-filter" className="w-full bg-background">
                <SelectValue placeholder="Select a vendor" />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">Select a vendor</SelectItem>
                {vendors?.map((vendor) => (
                  <SelectItem key={vendor} value={vendor}>
                    {vendor}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {manualVendorFilter !== "all" && manualFilaments && manualFilaments.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm">Filaments for {manualVendorFilter} ({manualFilaments.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                {manualFilaments.map((filament) => (
                  <div
                    key={filament.id}
                    className="rounded-lg border p-4 space-y-3"
                  >
                    <div className="aspect-square bg-muted rounded overflow-hidden">
                      {filament.featured_image ? (
                        <img
                          src={filament.featured_image}
                          alt={filament.product_title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Image className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm font-medium line-clamp-2">{filament.product_title}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setEditingFilament({
                          id: filament.id,
                          title: filament.product_title,
                          currentImage: filament.featured_image
                        })}
                      >
                        <LinkIcon className="w-3 h-3 mr-1" />
                        Link URL
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        disabled={uploadingImage}
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              handleImageUpload(filament.id, file);
                            }
                          };
                          input.click();
                        }}
                      >
                        <Upload className="w-3 h-3 mr-1" />
                        Upload
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Link Image Dialog */}
      <Dialog open={!!editingFilament} onOpenChange={(open) => {
        if (!open) {
          setEditingFilament(null);
          setNewImageUrl("");
        }
      }}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Link New Image URL</DialogTitle>
            <DialogDescription>
              {editingFilament?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingFilament?.currentImage && (
              <div>
                <Label className="text-sm">Current Image</Label>
                <div className="mt-2 aspect-video bg-muted rounded overflow-hidden">
                  <img
                    src={editingFilament.currentImage}
                    alt="Current"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-image-url">New Image URL</Label>
              <Input
                id="new-image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
            </div>
            {newImageUrl && (
              <div>
                <Label className="text-sm">Preview</Label>
                <div className="mt-2 aspect-video bg-muted rounded overflow-hidden">
                  <img
                    src={newImageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditingFilament(null);
                setNewImageUrl("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (editingFilament && newImageUrl) {
                  updateImageMutation.mutate({
                    filamentId: editingFilament.id,
                    imageUrl: newImageUrl
                  });
                }
              }}
              disabled={!newImageUrl || updateImageMutation.isPending}
            >
              {updateImageMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Image"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminMaintenance;