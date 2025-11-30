import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getBrandLogo } from "@/lib/brandLogos";

const Finder = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(["All"]);
  const [brassOnly, setBrassOnly] = useState(false);
  const [foodContact, setFoodContact] = useState(false);
  const [amsOnly, setAmsOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
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

  // Fetch unique materials for filters
  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("filaments")
        .select("material")
        .not("material", "is", null)
        .order("material");
      
      if (error) throw error;
      
      // Get unique materials
      const uniqueMaterials = Array.from(new Set(data.map(f => f.material))).sort();
      
      // Categorize materials
      const standard = ['PLA', 'PLA+', 'PETG', 'ABS', 'ASA', 'TPU', 'HIPS'];
      const composites = uniqueMaterials.filter(m => 
        m.includes('-CF') || m.includes('-GF') || m.includes('Carbon Fiber') || m.includes('Wood Fill')
      );
      const specialty = uniqueMaterials.filter(m => 
        !standard.includes(m) && !composites.includes(m)
      );
      
      return {
        all: uniqueMaterials,
        standard: standard.filter(m => uniqueMaterials.includes(m)),
        composites: composites,
        specialty: specialty
      };
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
      <aside className="w-72 border-r border-border bg-card/50 backdrop-blur-sm p-6 space-y-6 sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <span>🖨️</span> Your Printer
          </h3>
          <Select defaultValue="all">
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="all">All Brands</SelectItem>
            </SelectContent>
          </Select>
          <Select defaultValue="all">
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="Model" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="all">All Models</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="border-t border-border pt-6">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-sm font-semibold text-foreground hover:text-primary transition-colors mb-4">
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${filtersOpen ? "rotate-180" : ""}`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Material Type</h4>
                
                {/* All Materials Option */}
                <div className="pb-2 border-b border-border">
                  <Badge
                    variant={selectedMaterials.includes("All") ? "default" : "outline"}
                    className={`cursor-pointer text-xs transition-all ${
                      selectedMaterials.includes("All")
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                    }`}
                    onClick={() => toggleMaterial("All")}
                  >
                    All Materials
                  </Badge>
                </div>

                {/* Standard Materials */}
                {materials?.standard && materials.standard.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Standard</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {materials.standard.map((material) => (
                        <Badge
                          key={material}
                          variant={selectedMaterials.includes(material) ? "default" : "outline"}
                          className={`cursor-pointer text-xs transition-all ${
                            selectedMaterials.includes(material)
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                          }`}
                          onClick={() => toggleMaterial(material)}
                        >
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Composites */}
                {materials?.composites && materials.composites.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Composites</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {materials.composites.map((material) => (
                        <Badge
                          key={material}
                          variant={selectedMaterials.includes(material) ? "default" : "outline"}
                          className={`cursor-pointer text-xs transition-all ${
                            selectedMaterials.includes(material)
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                          }`}
                          onClick={() => toggleMaterial(material)}
                        >
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Specialty Materials */}
                {materials?.specialty && materials.specialty.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Specialty</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                      {materials.specialty.map((material) => (
                        <Badge
                          key={material}
                          variant={selectedMaterials.includes(material) ? "default" : "outline"}
                          className={`cursor-pointer text-xs transition-all ${
                            selectedMaterials.includes(material)
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                          }`}
                          onClick={() => toggleMaterial(material)}
                        >
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Compatibility</h4>
                <label className="flex items-center gap-3 text-sm cursor-pointer group">
                  <Checkbox checked={brassOnly} onCheckedChange={(checked) => setBrassOnly(checked as boolean)} />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">Brass nozzle safe</span>
                </label>
                <label className="flex items-center gap-3 text-sm cursor-pointer group">
                  <Checkbox checked={foodContact} onCheckedChange={(checked) => setFoodContact(checked as boolean)} />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">Food contact rated</span>
                </label>
                <label className="flex items-center gap-3 text-sm cursor-pointer group">
                  <Checkbox checked={amsOnly} onCheckedChange={(checked) => setAmsOnly(checked as boolean)} />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors">AMS/MMU friendly</span>
                </label>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Brand</h4>
                <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50 max-h-[300px]">
                    <SelectItem value="all">All Brands</SelectItem>
                    {brands?.map((brand) => (
                      <SelectItem key={brand} value={brand}>
                        {brand}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wide">Price</h4>
                <Input
                  type="number"
                  placeholder="Max price per kg"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="bg-background border-border"
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {filteredFilaments?.length || 0} <span className="text-muted-foreground font-normal">filaments</span>
          </h1>
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
            className="max-w-xl bg-background border-border"
          />
        </div>

        {/* Filaments List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">Loading filaments...</div>
          ) : filteredFilaments && filteredFilaments.length > 0 ? (
            filteredFilaments.map((filament) => {
              // Filter out corrupted prices (likely data import errors)
              // Valid filament prices are typically $10-$200 per kg or $10-$100 per spool
              const isValidPrice = filament.variant_price && filament.variant_price > 5 && filament.variant_price < 500;
              
              // Calculate price per kg if both price and weight are available
              const pricePerKg = isValidPrice && filament.net_weight_g && filament.net_weight_g > 0
                ? ((filament.variant_price / filament.net_weight_g) * 1000).toFixed(2)
                : null;
              
              // Use raw price if per-kg calculation isn't possible
              const displayPrice = isValidPrice 
                ? (pricePerKg || filament.variant_price.toFixed(2))
                : null;
              const priceLabel = pricePerKg ? '/kg' : (isValidPrice ? 'ea' : null);
              
              const overallScore = filament.value_score || 7.0;

              return (
                <div
                  key={filament.id}
                  className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:grid lg:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 lg:gap-6 items-start lg:items-center">
                    {/* Checkbox - Hidden on mobile */}
                    <div className="hidden lg:block">
                      <Checkbox />
                    </div>

                    {/* Filament Info */}
                    <div className="flex items-start gap-4 min-w-0 flex-1">
                      {filament.vendor && (() => {
                        const logoPath = getBrandLogo(filament.vendor);
                        return logoPath ? (
                          <img
                            src={logoPath}
                            alt={`${filament.vendor} logo`}
                            className="w-16 h-16 rounded-md object-contain flex-shrink-0 border border-border bg-muted p-1"
                            onError={(e) => {
                              // Fallback to text if image fails to load
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-md flex items-center justify-center flex-shrink-0 border border-border bg-muted">
                            <span className="text-xs font-bold text-muted-foreground text-center px-1 leading-tight">
                              {filament.vendor}
                            </span>
                          </div>
                        );
                      })()}
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{filament.product_title}</p>
                        <p className="text-sm text-muted-foreground">{filament.vendor}</p>
                        {filament.material && (
                          <p className="text-xs text-primary mt-0.5">{filament.material}</p>
                        )}
                        {filament.diameter_nominal_mm && (
                          <span className="text-xs text-muted-foreground">{filament.diameter_nominal_mm}mm</span>
                        )}
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="space-y-1.5 w-full lg:w-40">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-12 flex-shrink-0">Print</span>
                        <div className="score-bar flex-1">
                          <div className="score-fill print" style={{ width: `${(filament.ease_of_printing_score || 7) * 10}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-12 flex-shrink-0">Strength</span>
                        <div className="score-bar flex-1">
                          <div className="score-fill strength" style={{ width: `${(filament.strength_index || 7) * 10}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-muted-foreground w-12 flex-shrink-0">Heat</span>
                        <div className="score-bar flex-1">
                          <div className="score-fill heat" style={{ width: `${Math.min((filament.tg_c || 70) / 2, 100)}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Overall Score */}
                    <div className="flex items-center gap-4 lg:flex-col lg:gap-0">
                      <span className="text-xs text-muted-foreground lg:mb-1">Score</span>
                      <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                        {overallScore.toFixed(1)}
                      </span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-4 lg:flex-col lg:gap-0 lg:text-center">
                      <span className="text-xs text-muted-foreground lg:mb-1">Price</span>
                      {displayPrice ? (
                        <div>
                          <p className="font-semibold text-foreground">${displayPrice}</p>
                          <p className="text-xs text-muted-foreground">{priceLabel}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">—</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 self-start lg:self-center">
                      <Button
                        size="sm"
                        variant="default"
                        asChild
                      >
                        <Link to={`/filament/${filament.id}`}>
                          <span className="text-xs">View</span>
                        </Link>
                      </Button>
                      {filament.product_url && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary/30 text-primary hover:bg-primary/10"
                          asChild
                        >
                          <a href={filament.product_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            <span className="text-xs">Buy at Store</span>
                          </a>
                        </Button>
                      )}
                      {filament.amazon_link_us && (
                        <Button
                          size="sm"
                          variant="amazon"
                          asChild
                        >
                          <a href={filament.amazon_link_us} target="_blank" rel="noopener noreferrer">
                            <span className="text-xs">View on Amazon</span>
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">No filaments found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Finder;
