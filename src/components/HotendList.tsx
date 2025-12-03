import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
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
import { Thermometer, CircleDot, Package, Trash2, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import { getBrandLogo } from "@/lib/brandLogos";
import { useAuth } from "@/hooks/useAuth";

type Accessory = Database["public"]["Tables"]["printer_accessories"]["Row"];

export default function HotendList() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingHotend, setEditingHotend] = useState<Accessory | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");

  // Fetch all nozzles
  const { data: nozzles, isLoading } = useQuery({
    queryKey: ["nozzles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("printer_accessories")
        .select("*")
        .eq("accessory_type", "nozzle")
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

  // Group nozzles by brand
  const nozzlesByBrand = useMemo(() => {
    const grouped: Record<string, Accessory[]> = {};
    
    filteredNozzles.forEach(nozzle => {
      const brand = nozzle.brand || "Unknown";
      if (!grouped[brand]) {
        grouped[brand] = [];
      }
      grouped[brand].push(nozzle);
    });

    return grouped;
  }, [filteredNozzles]);

  const sortedBrands = Object.keys(nozzlesByBrand).sort();

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
        <h2 className="text-2xl font-bold">
          {filteredNozzles.length} <span className="text-muted-foreground font-normal">hotends</span>
        </h2>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={selectAll}
            >
              {selectedIds.size === filteredNozzles.length ? "Deselect All" : "Select All"}
            </Button>
            
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Delete ({selectedIds.size})
              </Button>
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
                <Badge variant="secondary">{nozzlesByBrand[brand].length}</Badge>
              </div>

              {/* Hotend Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {nozzlesByBrand[brand].map(nozzle => {
                  const specs = nozzle.specs as Record<string, unknown> | null;
                  const isSelected = selectedIds.has(nozzle.id);
                  
                  return (
                    <div key={nozzle.id} className="relative">
                      {/* Admin Controls */}
                      {isAdmin && (
                        <div className="absolute top-2 left-2 right-2 z-10 flex items-center justify-between">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelection(nozzle.id)}
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

                          {/* Name */}
                          <h4 className="font-semibold text-sm line-clamp-2 mb-2">{nozzle.name}</h4>

                          {/* Quick Specs */}
                          <div className="space-y-1.5 text-xs">
                            {specs?.diameter && (
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <CircleDot className="h-3.5 w-3.5" />
                                <span>{String(specs.diameter)}mm</span>
                              </div>
                            )}
                            
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

                          {/* Price */}
                          {nozzle.price && (
                            <div className="mt-3 pt-3 border-t">
                              <span className="font-bold text-primary">
                                ${nozzle.price.toFixed(2)}
                              </span>
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
    </div>
  );
}
