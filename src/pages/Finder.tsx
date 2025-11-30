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
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string[]>>({});
  const [brassOnly, setBrassOnly] = useState(false);
  const [foodContact, setFoodContact] = useState(false);
  const [amsOnly, setAmsOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Normalize variant names to group similar variants
  const normalizeVariantName = (material: string, base: string): string => {
    const variantPatterns: Record<string, Record<string, string[]>> = {
      PLA: {
        "Carbon Fiber": ["PLA Carbon Fiber", "PLA CF", "PLA-CF", "PLA CF03"],
        "Glow": ["Glow PLA", "PLA Glow", "PLA Glow in Dark", "PLA-Luminous"],
        "Silk": ["Silk PLA", "PLA Silk", "PLA-Silk", "Silky PLA", "Silk PLA+"],
        "Marble": ["Marble PLA", "PLA Marble", "PLA-Marble"],
        "Matte": ["Matte PLA", "PLA Matte", "PLA-Matte"],
        "Metallic": ["Metallic PLA", "PLA Metal", "PLA-Metal"],
        "Wood": ["PLA Wood", "Wood PLA", "PLA-Wood", "PLA Wood Composite"],
        "Lightweight": ["LW-PLA", "PLA Lightweight", "LW-PLA-HT"],
        "Crystal": ["PLA Crystal", "PLA Crystal Clear"],
        "Bronze": ["PLA Bronze Composite"],
        "Copper": ["PLA Copper Composite"],
        "Cork": ["PLA Cork Composite"],
        "Steel": ["PLA Steel Composite"],
        "Stone": ["PLA Stone Composite"],
      },
      ABS: {
        "+": ["ABS+"],
      },
      ASA: {
        "+": ["ASA+"],
      },
      Nylon: {
        "NylonG": ["NylonG"],
        "NylonX": ["NylonX"],
      },
      PC: {
        "Blend Carbon Fiber": ["PC Blend Carbon Fiber"],
        "Blend": ["PC Blend"],
        "Carbon Fiber": ["PC CF"],
        "FR": ["PC FR"],
        "Pro": ["PC Pro"],
        "Space Grade": ["PC Space Grade"],
        "PBT": ["PC-PBT"],
        "TPE": ["PCTPE"],
      },
      "Co-Polyester": {
        "CF": ["Co-Polyester CF"],
        "HT": ["HT"],
        "XT": ["XT"],
        "nGen": ["nGen"],
        "nGen Flex": ["nGen_FLEX"],
      }
    };

    const patterns = variantPatterns[base];
    if (patterns) {
      for (const [canonical, alternatives] of Object.entries(patterns)) {
        if (alternatives.includes(material)) {
          return canonical;
        }
      }
    }
    
    return material;
  };

  // Fetch unique materials for filters with variants
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
      
      // Define base standard materials that can have variants
      const baseStandards = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC', 'Co-Polyester'];
      const otherStandards = ['PLA+', 'HIPS', 'PEEK', 'TPE'];
      
      // Materials that should appear in specialty despite supporting variants
      const specialtyWithVariants = ['TPU', 'Nylon', 'PC', 'Co-Polyester'];
      
      // Function to check if a material is a variant of a base material
      const getBaseMaterial = (material: string): string | null => {
        for (const base of baseStandards) {
          // Match patterns like "PLA-CF", "PLA Carbon Fiber", "ABS-GF", etc.
          if (material !== base && (
            material.startsWith(base + '-') ||
            material.startsWith(base + ' ') ||
            (material.includes(base) && material.length > base.length + 1)
          )) {
            return base;
          }
        }
        return null;
      };
      
      // Group materials by their base with normalized names
      // Keep track of raw material names that map to each normalized variant
      const materialsByBase: Record<string, string[]> = {};
      const rawToNormalized: Record<string, { base: string; normalized: string }> = {};
      const normalizedToRaw: Record<string, Record<string, string[]>> = {};
      const standalone: string[] = [];
      
      uniqueMaterials.forEach(material => {
        const base = getBaseMaterial(material);
        if (base) {
          const normalized = normalizeVariantName(material, base);
          
          // Track raw to normalized mapping
          rawToNormalized[material] = { base, normalized };
          
          // Track normalized to raw mappings
          if (!normalizedToRaw[base]) {
            normalizedToRaw[base] = {};
          }
          if (!normalizedToRaw[base][normalized]) {
            normalizedToRaw[base][normalized] = [];
          }
          normalizedToRaw[base][normalized].push(material);
          
          // Add normalized variant to base material
          if (!materialsByBase[base]) {
            materialsByBase[base] = [];
          }
          if (!materialsByBase[base].includes(normalized)) {
            materialsByBase[base].push(normalized);
          }
        } else if (baseStandards.includes(material) || otherStandards.includes(material)) {
          standalone.push(material);
        }
      });
      
      // Get all materials that are variants (already grouped under base materials)
      const allVariants = Object.values(materialsByBase).flat();
      
      // Categorize remaining materials (not variants)
      const composites = uniqueMaterials.filter(m => 
        !Object.keys(rawToNormalized).includes(m) &&
        !baseStandards.includes(m) &&
        !otherStandards.includes(m) &&
        (m.includes('-CF') || m.includes('-GF') || m.includes('Carbon Fiber') || m.includes('Wood Fill'))
      );
      
      const specialty = uniqueMaterials.filter(m => 
        !Object.keys(rawToNormalized).includes(m) &&
        !baseStandards.includes(m) &&
        !otherStandards.includes(m) &&
        !composites.includes(m)
      );
      
      // Add specialty materials that support variants
      const specialtyWithVariantsList = specialtyWithVariants.filter(m => 
        uniqueMaterials.includes(m) || materialsByBase[m]?.length > 0
      );
      
      return {
        all: uniqueMaterials,
        baseStandards: baseStandards.filter(m => 
          !specialtyWithVariants.includes(m) && 
          (uniqueMaterials.includes(m) || materialsByBase[m]?.length > 0)
        ),
        otherStandards: otherStandards.filter(m => uniqueMaterials.includes(m)),
        variantsByBase: materialsByBase,
        normalizedToRaw: normalizedToRaw,
        composites: composites,
        specialty: [...specialty, ...specialtyWithVariantsList]
      };
    },
  });

  const { data: filaments, isLoading } = useQuery({
    queryKey: ["filaments", searchTerm, selectedMaterials, selectedVariants, brassOnly, foodContact, amsOnly, selectedBrand, materials],
    enabled: !!materials, // Wait for materials to load first
    queryFn: async () => {
      let query = supabase.from("filaments").select("*");

      if (searchTerm) {
        query = query.or(`product_title.ilike.%${searchTerm}%,vendor.ilike.%${searchTerm}%`);
      }

      if (!selectedMaterials.includes("All") && selectedMaterials.length > 0) {
        // Check if any base materials have specific variants selected
        const allRawMaterials: string[] = [];
        selectedMaterials.forEach(baseMaterial => {
          const selectedNormalizedVariants = selectedVariants[baseMaterial];
          if (selectedNormalizedVariants && selectedNormalizedVariants.length > 0) {
            // Expand normalized variants to raw material names
            selectedNormalizedVariants.forEach(normalizedVariant => {
              const rawMaterials = materials?.normalizedToRaw?.[baseMaterial]?.[normalizedVariant] || [];
              allRawMaterials.push(...rawMaterials);
            });
          }
        });
        
        // If specific variants are selected, filter by those raw material names
        // Otherwise filter by base materials
        if (allRawMaterials.length > 0) {
          const materialFilters = allRawMaterials.map(m => `material.eq.${m}`).join(",");
          query = query.or(materialFilters);
        } else {
          const materialFilters = selectedMaterials.map(m => `material.ilike.%${m}%`).join(",");
          query = query.or(materialFilters);
        }
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
      setSelectedVariants({});
    } else {
      const newMaterials = selectedMaterials.includes("All") 
        ? [material]
        : selectedMaterials.includes(material)
          ? selectedMaterials.filter(m => m !== material)
          : [...selectedMaterials, material];
      
      // Clear variants for deselected materials
      if (!newMaterials.includes(material)) {
        const newVariants = { ...selectedVariants };
        delete newVariants[material];
        setSelectedVariants(newVariants);
      }
      
      setSelectedMaterials(newMaterials.length === 0 ? ["All"] : newMaterials);
    }
  };

  const toggleVariant = (baseMaterial: string, variant: string) => {
    const currentVariants = selectedVariants[baseMaterial] || [];
    const newVariants = currentVariants.includes(variant)
      ? currentVariants.filter(v => v !== variant)
      : [...currentVariants, variant];
    
    setSelectedVariants({
      ...selectedVariants,
      [baseMaterial]: newVariants
    });
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

                {/* Base Standard Materials with Variants */}
                {materials?.baseStandards && materials.baseStandards.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Standard</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div className="space-y-2">
                      {materials.baseStandards.map((baseMaterial) => {
                        const variants = materials.variantsByBase?.[baseMaterial] || [];
                        const isSelected = selectedMaterials.includes(baseMaterial);
                        const selectedVariantsList = selectedVariants[baseMaterial] || [];
                        
                        return (
                          <div key={baseMaterial} className="space-y-1">
                            <Badge
                              variant={isSelected ? "default" : "outline"}
                              className={`cursor-pointer text-xs transition-all ${
                                isSelected
                                  ? "bg-primary text-primary-foreground shadow-sm"
                                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
                              }`}
                              onClick={() => toggleMaterial(baseMaterial)}
                            >
                              {baseMaterial}
                              {variants.length > 0 && ` (${variants.length} variants)`}
                            </Badge>
                            
                            {/* Variants Dropdown */}
                            {isSelected && variants.length > 0 && (
                              <Collapsible>
                                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pl-4">
                                  <ChevronDown className="w-3 h-3" />
                                  <span>Show variants</span>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pl-4 pt-2 space-y-1">
                                  <div className="flex flex-wrap gap-1.5">
                                    {variants.map((variant) => (
                                      <Badge
                                        key={variant}
                                        variant={selectedVariantsList.includes(variant) ? "default" : "outline"}
                                        className={`cursor-pointer text-xs transition-all ${
                                          selectedVariantsList.includes(variant)
                                            ? "bg-secondary text-secondary-foreground shadow-sm"
                                            : "border-border/50 text-muted-foreground hover:text-foreground hover:border-primary/30"
                                        }`}
                                        onClick={() => toggleVariant(baseMaterial, variant)}
                                      >
                                        {variant}
                                      </Badge>
                                    ))}
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Other Standard Materials (no variants) */}
                {materials?.otherStandards && materials.otherStandards.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">Other Materials</span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {materials.otherStandards.map((material) => (
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

                {/* Composites (not variants) */}
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

                {/* Specialty Materials (not variants) */}
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
