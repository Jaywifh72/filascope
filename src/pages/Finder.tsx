import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, ChevronDown, Star } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const materialTypes = ["All", "PLA", "PLA+", "PETG", "ABS", "ASA", "TPU", "Nylon", "PC"];

const Finder = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(["All"]);
  const [brassOnly, setBrassOnly] = useState(false);
  const [foodContact, setFoodContact] = useState(false);
  const [amsOnly, setAmsOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(true);

  const { data: filaments, isLoading } = useQuery({
    queryKey: ["filaments", searchTerm, selectedMaterials, brassOnly, foodContact, amsOnly, selectedBrand],
    queryFn: async () => {
      let query = supabase.from("filaments").select("*");

      if (searchTerm) {
        query = query.or(`product_title.ilike.%${searchTerm}%,vendor.ilike.%${searchTerm}%`);
      }

      if (!selectedMaterials.includes("All") && selectedMaterials.length > 0) {
        const materialFilters = selectedMaterials.map(m => `material.ilike.%${m}%`).join(",");
        query = query.or(materialFilters);
      }

      if (brassOnly) {
        query = query.eq("is_nozzle_abrasive", false);
      }

      if (foodContact) {
        query = query.not("food_contact_rating", "is", null);
      }

      if (amsOnly) {
        query = query.eq("spool_ams_fit", true);
      }

      if (selectedBrand !== "all") {
        query = query.eq("vendor", selectedBrand);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: brands } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("vendor")
        .not("vendor", "is", null);
      
      if (error) throw error;
      
      const uniqueBrands = Array.from(new Set(data.map(f => f.vendor))).sort();
      return uniqueBrands;
    },
  });

  const toggleMaterial = (material: string) => {
    if (material === "All") {
      setSelectedMaterials(["All"]);
    } else {
      const newMaterials = selectedMaterials.includes("All") 
        ? [material]
        : selectedMaterials.includes(material)
          ? selectedMaterials.filter(m => m !== material)
          : [...selectedMaterials, material];
      
      setSelectedMaterials(newMaterials.length === 0 ? ["All"] : newMaterials);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-cyan-400";
    return "text-orange-400";
  };

  const filteredFilaments = filaments?.filter(f => {
    if (maxPrice && f.variant_price && f.net_weight_g) {
      const pricePerKg = (f.variant_price / f.net_weight_g) * 1000;
      if (pricePerKg > parseFloat(maxPrice)) return false;
    }
    return true;
  });

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar */}
      <aside className="w-64 border-r border-border bg-card p-4 space-y-4 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <span>🖨️</span> Your Printer
          </h3>
          <Select defaultValue="all">
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Brands</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="all">All Models</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-medium text-foreground hover:text-primary transition-colors">
            <span>Filters</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 mt-3">
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Material Type</h4>
              <div className="flex flex-wrap gap-1.5">
                {materialTypes.map((material) => (
                  <Badge
                    key={material}
                    variant={selectedMaterials.includes(material) ? "default" : "outline"}
                    className={`cursor-pointer text-xs ${
                      selectedMaterials.includes(material)
                        ? "bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                    onClick={() => toggleMaterial(material)}
                  >
                    {material}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={brassOnly} onCheckedChange={(checked) => setBrassOnly(checked as boolean)} />
                <span className="text-muted-foreground">Brass nozzle safe only</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={foodContact} onCheckedChange={(checked) => setFoodContact(checked as boolean)} />
                <span className="text-muted-foreground">Food contact rated</span>
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <Checkbox checked={amsOnly} onCheckedChange={(checked) => setAmsOnly(checked as boolean)} />
                <span className="text-muted-foreground">AMS/MMU friendly only</span>
              </label>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Filament Brand</h4>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="All Brands" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">All Brands</SelectItem>
                  {brands?.map((brand) => (
                    <SelectItem key={brand} value={brand}>
                      {brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-medium text-muted-foreground">Price & Rating</h4>
              <Input
                type="number"
                placeholder="Max Price (per kg)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="bg-background border-border"
              />
              <Select value={minRating} onValueChange={setMinRating}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Minimum Rating" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  <SelectItem value="all">Any Rating</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">{filteredFilaments?.length || 0} filaments</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">🇺🇸 United States</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search filaments by name or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-background border-border"
          />
        </div>

        {/* Filaments Table */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading filaments...</div>
          ) : filteredFilaments && filteredFilaments.length > 0 ? (
            filteredFilaments.map((filament) => {
              const pricePerKg = filament.variant_price && filament.net_weight_g 
                ? ((filament.variant_price / filament.net_weight_g) * 1000).toFixed(2)
                : null;
              
              const overallScore = filament.value_score || 7.0;

              return (
                <div
                  key={filament.id}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-all"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Checkbox */}
                    <div className="col-span-1">
                      <Checkbox />
                    </div>

                    {/* Filament Info */}
                    <div className="col-span-3 flex items-center gap-3">
                      {filament.featured_image && (
                        <img
                          src={filament.featured_image}
                          alt={filament.product_title}
                          className="w-12 h-12 rounded object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-foreground">{filament.product_title}</p>
                        <p className="text-xs text-muted-foreground">{filament.vendor}</p>
                        <p className="text-xs text-muted-foreground">{filament.diameter_nominal_mm}mm</p>
                      </div>
                    </div>

                    {/* Material */}
                    <div className="col-span-2">
                      <Badge variant="outline" className="border-primary/30 text-primary">
                        {filament.material}
                      </Badge>
                    </div>

                    {/* Scores */}
                    <div className="col-span-2 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-8">Print</span>
                        <div className="score-bar flex-1">
                          <div className="score-fill print" style={{ width: `${(filament.ease_of_printing_score || 7) * 10}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-8">Str</span>
                        <div className="score-bar flex-1">
                          <div className="score-fill strength" style={{ width: `${(filament.strength_index || 7) * 10}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-8">Heat</span>
                        <div className="score-bar flex-1">
                          <div className="score-fill heat" style={{ width: `${Math.min((filament.tg_c || 70) / 2, 100)}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Overall Score */}
                    <div className="col-span-1 text-center">
                      <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                        {overallScore.toFixed(1)}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="col-span-1 text-center">
                      {pricePerKg ? (
                        <>
                          <p className="font-semibold text-foreground">${pricePerKg}</p>
                          <p className="text-xs text-muted-foreground">/kg</p>
                        </>
                      ) : (
                        <p className="text-xs text-muted-foreground">—</p>
                      )}
                    </div>

                    {/* Rating */}
                    <div className="col-span-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">—</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="col-span-1 flex gap-1">
                      {filament.product_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                          asChild
                        >
                          <a href={filament.product_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No filaments found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Finder;
