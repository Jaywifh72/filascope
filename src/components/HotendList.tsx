import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Thermometer, CircleDot, Package, Trash2, ImageIcon, X, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { useAuth } from "@/hooks/useAuth";

type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

interface ScrapeResult {
  success: boolean;
  message: string;
  updated: number;
  failed: number;
  skipped: number;
  details: { name: string; status: string; image?: string }[];
}

// Extract base name by removing diameter patterns like "0.2mm", "0.4 mm", etc.
const getBaseName = (name: string): string => {
  return name
    .replace(/\b0\.\d+\s*mm\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// Extract diameter from name or specs
const getDiameter = (hotend: Accessory): number | null => {
  const specs = hotend.specs as Record<string, unknown> | null;
  if (specs?.diameter) {
    return parseFloat(String(specs.diameter));
  }
  const match = hotend.name.match(/\b(0\.\d+)\s*mm\b/i);
  return match ? parseFloat(match[1]) : null;
};

interface GroupedHotend {
  baseName: string;
  brand: string;
  variants: Accessory[];
  diameters: number[];
  primaryVariant: Accessory;
}

export default function HotendList() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Get filter values from URL params
  const searchTerm = searchParams.get("search") || "";
  const selectedBrand = searchParams.get("brand") || "all";
  
  // Update URL params when filters change
  const setSearchTerm = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set("search", value);
    } else {
      newParams.delete("search");
    }
    newParams.set("tab", "hotends");
    setSearchParams(newParams, { replace: true });
  };
  
  const setSelectedBrand = (value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "all") {
      newParams.set("brand", value);
    } else {
      newParams.delete("brand");
    }
    newParams.set("tab", "hotends");
    setSearchParams(newParams, { replace: true });
  };
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingHotend, setEditingHotend] = useState<Accessory | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeResult | null>(null);

  // Fetch all nozzles
  const { data: nozzles, isLoading } = useQuery({
    queryKey: ["hotends-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("accessory_type", "hotend")
        .order("brand")
        .order("name");

      if (error) throw error;
      return data as Accessory[];
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("printer_accessories")
        .delete()
        .in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nozzles-list"] });
      setSelectedIds(new Set());
      toast.success("Selected hotends deleted successfully");
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
    },
  });

  // Update image mutation
  const updateImageMutation = useMutation({
    mutationFn: async ({ id, imageUrl }: { id: string; imageUrl: string }) => {
      const { error } = await supabase
        .from("printer_accessories")
        .update({ image_url: imageUrl || null })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["nozzles-list"] });
      setEditingHotend(null);
      setNewImageUrl("");
      toast.success("Image updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update image: ${error.message}`);
    },
  });

  // Get unique brands
  const brands = useMemo(() => {
    if (!nozzles) return [];
    const brandSet = new Set<string>();
    nozzles.forEach(n => {
      if (n.brand) brandSet.add(n.brand);
    });
    return Array.from(brandSet).sort();
  }, [nozzles]);

  // Filter nozzles
  const filteredNozzles = useMemo(() => {
    if (!nozzles) return [];

    return nozzles.filter(nozzle => {
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!nozzle.name.toLowerCase().includes(search) &&
            !nozzle.brand?.toLowerCase().includes(search) &&
            !nozzle.model?.toLowerCase().includes(search)) {
          return false;
        }
      }

      if (selectedBrand !== "all" && nozzle.brand !== selectedBrand) {
        return false;
      }

      return true;
    });
  }, [nozzles, searchTerm, selectedBrand]);

  // Group hotends by base name (combining diameter variants)
  const groupedHotends = useMemo(() => {
    const groups: Record<string, GroupedHotend> = {};
    
    filteredNozzles.forEach(nozzle => {
      const brand = nozzle.brand || "Unknown";
      const baseName = getBaseName(nozzle.name);
      const key = `${brand}::${baseName}`;
      const diameter = getDiameter(nozzle);
      
      if (!groups[key]) {
        groups[key] = {
          baseName,
          brand,
          variants: [],
          diameters: [],
          primaryVariant: nozzle, // Use first found as primary (will be updated to 0.4mm if available)
        };
      }
      
      groups[key].variants.push(nozzle);
      if (diameter !== null && !groups[key].diameters.includes(diameter)) {
        groups[key].diameters.push(diameter);
      }
      
      // Prefer 0.4mm as primary variant (most common)
      if (diameter === 0.4) {
        groups[key].primaryVariant = nozzle;
      }
    });
    
    // Sort diameters for each group
    Object.values(groups).forEach(group => {
      group.diameters.sort((a, b) => a - b);
    });
    
    return groups;
  }, [filteredNozzles]);

  // Group by brand for display
  const groupedByBrand = useMemo(() => {
    const byBrand: Record<string, GroupedHotend[]> = {};
    
    Object.values(groupedHotends).forEach(group => {
      if (!byBrand[group.brand]) {
        byBrand[group.brand] = [];
      }
      byBrand[group.brand].push(group);
    });
    
    // Sort groups within each brand by base name
    Object.values(byBrand).forEach(groups => {
      groups.sort((a, b) => a.baseName.localeCompare(b.baseName));
    });
    
    return byBrand;
  }, [groupedHotends]);

  const sortedBrands = Object.keys(groupedByBrand).sort();
  
  // Count unique grouped hotends
  const groupedCount = Object.keys(groupedHotends).length;

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const selectAll = () => {
    if (selectedIds.size === filteredNozzles.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNozzles.map(n => n.id)));
    }
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.size} hotend(s)?`)) {
      deleteMutation.mutate(Array.from(selectedIds));
    }
  };

  const openImageEditor = (hotend: Accessory, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingHotend(hotend);
    setNewImageUrl(hotend.image_url || "");
  };

  const handleImageSave = () => {
    if (!editingHotend) return;
    updateImageMutation.mutate({ id: editingHotend.id, imageUrl: newImageUrl });
  };

  // Count hotends missing images
  const missingImageCount = useMemo(() => {
    if (!nozzles) return 0;
    return nozzles.filter(n => !n.image_url || n.image_url === '').length;
  }, [nozzles]);

  // Bulk scrape images
  const handleBulkScrape = async () => {
    setIsScraping(true);
    setScrapeProgress(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('scrape-accessory-images', {
        body: {
          accessoryType: 'nozzle',
          forceUpdate: false,
          limit: 10
        }
      });

      if (error) throw error;
      
      setScrapeProgress(data as ScrapeResult);
      
      if (data.updated > 0) {
        toast.success(`Updated ${data.updated} hotend images`);
        queryClient.invalidateQueries({ queryKey: ["nozzles-list"] });
      } else {
        toast.info(data.message || "No images needed updating");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to scrape images";
      toast.error(msg);
    } finally {
      setIsScraping(false);
    }
  };

  // Scrape images for selected hotends
  const handleScrapeSelected = async () => {
    if (selectedIds.size === 0) return;
    
    setIsScraping(true);
    setScrapeProgress(null);
    
    const allResults: ScrapeResult = {
      success: true,
      message: "",
      updated: 0,
      failed: 0,
      skipped: 0,
      details: []
    };

    try {
      for (const id of selectedIds) {
        const { data, error } = await supabase.functions.invoke('scrape-accessory-images', {
          body: {
            accessoryId: id,
            forceUpdate: true,
            limit: 1
          }
        });

        if (error) {
          allResults.failed++;
          allResults.details.push({ name: id, status: "error" });
        } else if (data) {
          allResults.updated += data.updated || 0;
          allResults.failed += data.failed || 0;
          allResults.skipped += data.skipped || 0;
          allResults.details.push(...(data.details || []));
        }
      }

      setScrapeProgress(allResults);
      
      if (allResults.updated > 0) {
        toast.success(`Updated ${allResults.updated} hotend images`);
        queryClient.invalidateQueries({ queryKey: ["nozzles-list"] });
      }
      setSelectedIds(new Set());
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to scrape images";
      toast.error(msg);
    } finally {
      setIsScraping(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          type="text"
          placeholder="Search hotends..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="md:col-span-2"
        />

        <Select value={selectedBrand} onValueChange={setSelectedBrand}>
          <SelectTrigger>
            <SelectValue placeholder="Select brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Brands</SelectItem>
            {brands.map(brand => (
              <SelectItem key={brand} value={brand}>{brand}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Results Count & Admin Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">
            {groupedCount} <span className="text-muted-foreground font-normal">hotends</span>
            <span className="text-sm text-muted-foreground font-normal ml-2">({filteredNozzles.length} variants)</span>
          </h2>
          {missingImageCount > 0 && (
            <Badge variant="outline" className="text-muted-foreground">
              {missingImageCount} missing images
            </Badge>
          )}
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkScrape}
              disabled={isScraping || missingImageCount === 0}
            >
              {isScraping ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-1" />
              )}
              Scrape Missing Images
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
            >
              {selectedIds.size === filteredNozzles.length ? "Deselect All" : "Select All"}
            </Button>
            
            {selectedIds.size > 0 && (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleScrapeSelected}
                  disabled={isScraping}
                >
                  {isScraping ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  Scrape Selected ({selectedIds.size})
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDelete}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete ({selectedIds.size})
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Hotends by Brand */}
      {filteredNozzles.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No hotends found matching your criteria</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedBrands.map(brand => (
            <div key={brand} className="space-y-4">
              {/* Brand Header */}
              <div className="flex items-center gap-4 border-b pb-2">
                {getBrandLogo(brand) && (
                  <img
                    src={getBrandLogo(brand)!}
                    alt={`${brand} logo`}
                    className="h-8 w-auto object-contain"
                  />
                )}
                <h3 className="text-xl font-semibold">{brand}</h3>
                <Badge variant="secondary">{groupedByBrand[brand].length}</Badge>
              </div>

              {/* Hotend Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupedByBrand[brand].map(group => {
                  const nozzle = group.primaryVariant;
                  const specs = nozzle.specs as Record<string, unknown> | null;
                  const isSelected = group.variants.some(v => selectedIds.has(v.id));
                  
                  return (
                    <div key={`${group.brand}::${group.baseName}`} className="relative">
                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {
                              // Toggle all variants
                              const newSet = new Set(selectedIds);
                              if (isSelected) {
                                group.variants.forEach(v => newSet.delete(v.id));
                              } else {
                                group.variants.forEach(v => newSet.add(v.id));
                              }
                              setSelectedIds(newSet);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-background/80 backdrop-blur-sm"
                          />
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-7 w-7 bg-background/80 backdrop-blur-sm"
                            onClick={(e) => openImageEditor(nozzle, e)}
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}

                      <Link to={`/hotends/${nozzle.id}`}>
                        <Card className={`p-4 hover:shadow-lg transition-shadow cursor-pointer h-full ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                          {/* Image */}
                          <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                            {nozzle.image_url ? (
                              <img
                                src={nozzle.image_url}
                                alt={nozzle.name}
                                className="w-full h-full object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`flex flex-col items-center justify-center text-muted-foreground ${nozzle.image_url ? 'hidden' : ''}`}>
                              <CircleDot className="h-12 w-12 mb-2 opacity-30" />
                              <span className="text-xs">No image</span>
                            </div>
                          </div>

                          {/* Name - Use base name */}
                          <h4 className="font-semibold text-sm line-clamp-2 mb-2">{group.baseName}</h4>

                          {/* Available Diameters */}
                          {group.diameters.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                              {group.diameters.map(d => (
                                <Badge 
                                  key={d} 
                                  variant="secondary" 
                                  className="text-xs px-2 py-0.5"
                                >
                                  {d}mm
                                </Badge>
                              ))}
                            </div>
                          )}

                          {/* Quick Specs */}
                          <div className="space-y-1.5 text-xs">
                            {specs?.material && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Package className="h-3.5 w-3.5" />
                                <span>{String(specs.material)}</span>
                              </div>
                            )}

                            {specs?.max_temp && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <Thermometer className="h-3.5 w-3.5" />
                                <span>Up to {String(specs.max_temp)}°C</span>
                              </div>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 mt-3">
                            {specs?.hardened && (
                              <Badge variant="outline" className="text-xs">Hardened</Badge>
                            )}
                            {nozzle.model && (
                              <Badge variant="secondary" className="text-xs">{nozzle.model}</Badge>
                            )}
                          </div>

                          {/* Price Range */}
                          {group.variants.some(v => v.price) && (
                            <div className="mt-3 pt-3 border-t">
                              {(() => {
                                const prices = group.variants.filter(v => v.price).map(v => v.price!);
                                const minPrice = Math.min(...prices);
                                const maxPrice = Math.max(...prices);
                                return (
                                  <span className="font-bold text-primary">
                                    {minPrice === maxPrice 
                                      ? `$${minPrice.toFixed(2)}` 
                                      : `$${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}`}
                                  </span>
                                );
                              })()}
                            </div>
                          )}
                        </Card>
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Edit Dialog */}
      <Dialog open={!!editingHotend} onOpenChange={(open) => !open && setEditingHotend(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Hotend Image</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Hotend</Label>
              <p className="text-sm text-muted-foreground">{editingHotend?.name}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                placeholder="https://example.com/image.jpg"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
              />
            </div>

            {newImageUrl && (
              <div className="border rounded-lg p-4">
                <Label className="mb-2 block">Preview</Label>
                <div className="aspect-square max-w-[200px] mx-auto bg-muted rounded-lg overflow-hidden">
                  <img
                    src={newImageUrl}
                    alt="Preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "";
                      e.currentTarget.alt = "Failed to load image";
                    }}
                  />
                </div>
              </div>
            )}

            {editingHotend?.image_url && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setNewImageUrl("")}
              >
                <X className="h-4 w-4 mr-1" />
                Remove Image
              </Button>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingHotend(null)}>
              Cancel
            </Button>
            <Button 
              onClick={handleImageSave}
              disabled={updateImageMutation.isPending}
            >
              Save Image
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scrape Progress Dialog */}
      <Dialog open={!!scrapeProgress} onOpenChange={(open) => !open && setScrapeProgress(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Image Scrape Results</DialogTitle>
          </DialogHeader>
          
          {scrapeProgress && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{scrapeProgress.updated}</div>
                  <div className="text-xs text-muted-foreground">Updated</div>
                </div>
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{scrapeProgress.skipped}</div>
                  <div className="text-xs text-muted-foreground">Skipped</div>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{scrapeProgress.failed}</div>
                  <div className="text-xs text-muted-foreground">Failed</div>
                </div>
              </div>

              {scrapeProgress.details.length > 0 && (
                <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                  <div className="p-2 space-y-1">
                    {scrapeProgress.details.map((detail, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-muted/50">
                        <span className="truncate flex-1 mr-2">{detail.name}</span>
                        <Badge 
                          variant={detail.status === "updated" ? "default" : detail.status === "no_image_found" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {detail.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setScrapeProgress(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
