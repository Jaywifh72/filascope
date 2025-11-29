import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Finder = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [materialFilter, setMaterialFilter] = useState<string>("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);

  const { data: filaments, isLoading } = useQuery({
    queryKey: ["filaments", searchTerm, materialFilter],
    queryFn: async () => {
      let query = supabase
        .from("filaments")
        .select("*")
        .order("product_title");

      if (searchTerm) {
        query = query.or(`product_title.ilike.%${searchTerm}%,vendor.ilike.%${searchTerm}%`);
      }

      if (materialFilter && materialFilter !== "all") {
        query = query.eq("material", materialFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("material")
        .not("material", "is", null);
      
      if (error) throw error;
      
      const uniqueMaterials = [...new Set(data.map(item => item.material))].filter(Boolean);
      return uniqueMaterials as string[];
    },
  });

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Filament Finder</h1>
          <p className="text-muted-foreground">
            Search and filter through hundreds of 3D printer filaments
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by name or vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={materialFilter} onValueChange={setMaterialFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Material" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Materials</SelectItem>
                {materials?.map((material) => (
                  <SelectItem key={material} value={material}>
                    {material}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {(searchTerm || materialFilter !== "all") && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setMaterialFilter("all");
                }}
              >
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading filaments...</p>
          </div>
        ) : filaments && filaments.length > 0 ? (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              Showing {filaments.length} results
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filaments.map((filament) => (
                <Card key={filament.id} className="card-elevated p-6 hover:scale-[1.02] transition-transform">
                  {filament.featured_image && (
                    <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-muted">
                      <img
                        src={filament.featured_image}
                        alt={filament.product_title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {filament.product_title}
                      </h3>
                      <p className="text-sm text-muted-foreground">{filament.vendor}</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {filament.material && (
                        <Badge variant="secondary">{filament.material}</Badge>
                      )}
                      {filament.spool_ams_fit && (
                        <Badge variant="outline">AMS Fit</Badge>
                      )}
                    </div>

                    {filament.variant_price && (
                      <div className="text-2xl font-bold text-primary">
                        ${filament.variant_price}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {filament.nozzle_temp_sweetspot_c && (
                        <div>
                          <span className="text-muted-foreground">Nozzle:</span>{" "}
                          <span className="font-medium">{filament.nozzle_temp_sweetspot_c}°C</span>
                        </div>
                      )}
                      {filament.bed_temp_min_c && (
                        <div>
                          <span className="text-muted-foreground">Bed:</span>{" "}
                          <span className="font-medium">{filament.bed_temp_min_c}°C</span>
                        </div>
                      )}
                    </div>

                    {filament.product_url && (
                      <Button asChild className="w-full" size="sm">
                        <a href={filament.product_url} target="_blank" rel="noopener noreferrer">
                          View Details
                        </a>
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No filaments found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Finder;
