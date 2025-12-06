import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ExternalLink, ChevronDown, GitCompare, X } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getBrandLogo } from "@/lib/brandLogos";
import { LikeButton } from "@/components/LikeButton";
import { PrinterSelector } from "@/components/PrinterSelector";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { checkPrinterFilamentCompatibility } from "@/lib/printerCompatibility";
import { CompatibilityBadge } from "@/components/CompatibilityBadge";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { isAMSCompatible } from "@/lib/amsCompatibility";

const Finder = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(["All"]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string[]>>({});
  const [brassOnly, setBrassOnly] = useState(false);
  const [foodContact, setFoodContact] = useState(false);
  const [amsOnly, setAmsOnly] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [maxPrice, setMaxPrice] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("score-desc");
  
  // Printer selection hook
  const { selectedPrinter } = usePrinterSelection();
  
  // Affiliate links hook
  const { getAffiliateUrl } = useAffiliateLinks();

  // Normalize variant names to group similar variants
  const normalizeVariantName = (material: string, base: string): string => {
    const variantPatterns: Record<string, Record<string, string[]>> = {
      PLA: {
        "+": ["PLA+"],
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
      PETG: {
        "Carbon Fiber": ["PETG-CF", "PETG Carbon Fiber", "PETG CF"],
        "Wood": ["PETG Wood", "PETG-Wood"],
        "Silk": ["PETG Silk", "Silk PETG", "PETG-Silk"],
        "Matte": ["PETG Matte", "Matte PETG", "PETG-Matte"],
        "Pro": ["PETG Pro"],
        "HF": ["PETG HF"],
      },
      ABS: {
        "+": ["ABS+"],
      },
      ASA: {
        "+": ["ASA+"],
      },
      TPU: {
        "95A": ["TPU 95A", "TPU-95A", "TPU95A"],
        "85A": ["TPU 85A", "TPU-85A", "TPU85A"],
        "98A": ["TPU 98A", "TPU-98A", "TPU98A"],
        "60D": ["TPU 60D", "TPU-60D", "TPU60D"],
        "Flex": ["TPU Flex", "TPU-Flex"],
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
      },
      "Co-Polymer": {
        "PE": ["PE Co-Polymer"],
      },
      PA: {
        "CF": ["PA-CF"],
        "11 Carbon Fiber": ["PA11 Carbon Fiber"],
        "12-CF": ["PA12-CF"],
        "6-CF": ["PA6-CF"],
        "6-GF": ["PA6-GF"],
      },
      CPE: {
        "+": ["CPE+"],
        "HG100": ["CPE HG100"],
      },
      PET: {
        "GF": ["PET-GF"],
        "CF": ["PET-CF"],
      },
      PEEK: {
        "CF": ["PEEK-CF", "Peek CF"],
        "GF": ["PEEK-GF", "Peek GF"],
        "A": ["PEEK A", "Peek A"],
      },
      PP: {
        "CF": ["PP-CF", "PP Carbon Fiber"],
        "GF": ["PP-GF", "PP Glass Fiber"],
      },
      Support: {
        "Material": ["Support material"],
      },
      PEBA: {
        "90A": ["PEBA-90A", "PEBA 90A"],
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
      const baseStandards = ['PLA', 'PETG', 'ABS', 'ASA', 'TPU', 'Nylon', 'PC', 'Co-Polyester', 'PA', 'CPE', 'PET', 'PEEK', 'PP', 'Support', 'PEBA', 'Co-Polymer'];
      const otherStandards = ['HIPS', 'TPE', 'CO-PE'];
      
      // Materials that should appear in specialty despite supporting variants
      const specialtyWithVariants: string[] = [];
      
      // Materials that should appear in composites despite supporting variants
      const compositeWithVariants = ['PC', 'Co-Polyester', 'PA', 'CPE', 'PET', 'PP', 'Nylon', 'Co-Polymer'];
      
      // Materials that should appear in other materials despite supporting variants
      const otherWithVariants = ['Support', 'PEBA'];
      
      // Function to check if a material is a variant of a base material
      const getBaseMaterial = (material: string): string | null => {
        for (const base of baseStandards) {
          // Match patterns like "PLA-CF", "PLA Carbon Fiber", "ABS+", "ABS-GF", etc.
          if (material !== base && (
            material.startsWith(base + '-') ||
            material.startsWith(base + ' ') ||
            material.startsWith(base + '+') ||
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
        (m.includes('-CF') || m.includes('-GF') || m.includes('Carbon Fiber') || m.includes('Wood Fill') || 
         m === 'PPS' || m === 'PSU' || m.startsWith('PPS ') || m.startsWith('PSU '))
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
      
      // Add composite materials that support variants
      const compositeWithVariantsList = compositeWithVariants.filter(m => 
        uniqueMaterials.includes(m) || materialsByBase[m]?.length > 0
      );
      
      // Add other materials that support variants
      const otherWithVariantsList = otherWithVariants.filter(m => 
        uniqueMaterials.includes(m) || materialsByBase[m]?.length > 0
      );
      
      return {
        all: uniqueMaterials,
        baseStandards: baseStandards.filter(m => 
          !specialtyWithVariants.includes(m) && 
          !compositeWithVariants.includes(m) &&
          !otherWithVariants.includes(m) &&
          (uniqueMaterials.includes(m) || materialsByBase[m]?.length > 0)
        ),
        otherStandards: [...otherStandards.filter(m => uniqueMaterials.includes(m)), ...otherWithVariantsList],
        variantsByBase: materialsByBase,
        normalizedToRaw: normalizedToRaw,
        composites: [...composites, ...compositeWithVariantsList],
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

      // AMS filtering is done client-side using isAMSCompatible function

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

  const toggleCompareSelection = (filamentId: string) => {
    setSelectedForCompare(prev => 
      prev.includes(filamentId)
        ? prev.filter(id => id !== filamentId)
        : [...prev, filamentId]
    );
  };

  const handleCompare = () => {
    if (selectedForCompare.length > 0) {
      navigate(`/compare?ids=${selectedForCompare.join(',')}`);
    }
  };

  const clearCompareSelection = () => {
    setSelectedForCompare([]);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-400";
    if (score >= 6) return "text-cyan-400";
    return "text-orange-400";
  };

  // Calculate filter counts based on currently applied filters (excluding the filter being counted)
  const filterCounts = useMemo(() => {
    if (!filaments) return {};

    const counts: Record<string, number> = {};

    // Apply base filters (search, price, compatibility, brand) to get filtered set
    const baseFiltered = filaments.filter(f => {
      // Apply search filter
      if (searchTerm && f.product_title && f.vendor) {
        const searchLower = searchTerm.toLowerCase();
        if (!f.product_title.toLowerCase().includes(searchLower) && 
            !f.vendor.toLowerCase().includes(searchLower)) {
          return false;
        }
      }
      
      // Apply price filter
      if (maxPrice && f.variant_price && f.net_weight_g) {
        const pricePerKg = (f.variant_price / f.net_weight_g) * 1000;
        if (pricePerKg > parseFloat(maxPrice)) return false;
      }
      
      return true;
    });

    // Count by material (excluding material filter itself to show total available)
    baseFiltered.forEach(f => {
      const material = f.material;
      if (material) {
        // Count by base material
        const baseMaterial = material.split(' ')[0];
        counts[`material_${baseMaterial}`] = (counts[`material_${baseMaterial}`] || 0) + 1;
        
        // Count by full material name (for variants)
        counts[`material_${material}`] = (counts[`material_${material}`] || 0) + 1;
      }
    });

    // Count by brand (apply all filters except brand)
    const forBrandCount = baseFiltered.filter(f => {
      // Apply material filters
      if (!selectedMaterials.includes("All") && selectedMaterials.length > 0) {
        const allRawMaterials: string[] = [];
        selectedMaterials.forEach(baseMaterial => {
          const selectedNormalizedVariants = selectedVariants[baseMaterial];
          if (selectedNormalizedVariants && selectedNormalizedVariants.length > 0) {
            selectedNormalizedVariants.forEach(normalizedVariant => {
              const rawMaterials = materials?.normalizedToRaw?.[baseMaterial]?.[normalizedVariant] || [];
              allRawMaterials.push(...rawMaterials);
            });
          }
        });
        
        if (allRawMaterials.length > 0) {
          if (!allRawMaterials.includes(f.material || '')) return false;
        } else {
          const matchesMaterial = selectedMaterials.some(m => f.material?.includes(m));
          if (!matchesMaterial) return false;
        }
      }
      
      // Apply compatibility filters
      if (brassOnly && f.is_nozzle_abrasive !== false) return false;
      if (foodContact && !f.food_contact_rating) return false;
      if (amsOnly && !isAMSCompatible(f)) return false;
      
      return true;
    });
    
    forBrandCount.forEach(f => {
      if (f.vendor) {
        counts[`brand_${f.vendor}`] = (counts[`brand_${f.vendor}`] || 0) + 1;
      }
    });

    // Count compatibility options (apply all filters except the compatibility filter being counted)
    const forCompatCount = baseFiltered.filter(f => {
      // Apply material filters
      if (!selectedMaterials.includes("All") && selectedMaterials.length > 0) {
        const allRawMaterials: string[] = [];
        selectedMaterials.forEach(baseMaterial => {
          const selectedNormalizedVariants = selectedVariants[baseMaterial];
          if (selectedNormalizedVariants && selectedNormalizedVariants.length > 0) {
            selectedNormalizedVariants.forEach(normalizedVariant => {
              const rawMaterials = materials?.normalizedToRaw?.[baseMaterial]?.[normalizedVariant] || [];
              allRawMaterials.push(...rawMaterials);
            });
          }
        });
        
        if (allRawMaterials.length > 0) {
          if (!allRawMaterials.includes(f.material || '')) return false;
        } else {
          const matchesMaterial = selectedMaterials.some(m => f.material?.includes(m));
          if (!matchesMaterial) return false;
        }
      }
      
      // Apply brand filter
      if (selectedBrand !== "all" && f.vendor !== selectedBrand) return false;
      
      return true;
    });
    
    forCompatCount.forEach(f => {
      if (f.is_nozzle_abrasive === false) {
        counts['brass_safe'] = (counts['brass_safe'] || 0) + 1;
      }
      if (f.food_contact_rating) {
        counts['food_contact'] = (counts['food_contact'] || 0) + 1;
      }
      if (isAMSCompatible(f)) {
        counts['ams_fit'] = (counts['ams_fit'] || 0) + 1;
      }
    });

    return counts;
  }, [filaments, searchTerm, maxPrice, selectedMaterials, selectedVariants, brassOnly, foodContact, amsOnly, selectedBrand, materials]);

  // Helper function to get count for a material (checks both base and variants)
  const getMaterialCount = (baseMaterial: string) => {
    if (!materials || !filaments) return 0;
    
    // Check if this material has variants
    const variants = materials.variantsByBase?.[baseMaterial] || [];
    const normalizedToRaw = materials.normalizedToRaw?.[baseMaterial] || {};
    
    let count = 0;
    
    // If it has variants, count all raw materials under this base
    if (variants.length > 0) {
      Object.values(normalizedToRaw).forEach(rawMaterials => {
        rawMaterials.forEach(rawMaterial => {
          count += filterCounts[`material_${rawMaterial}`] || 0;
        });
      });
    } else {
      // Otherwise count materials that match the base
      count = filaments.filter(f => f.material?.includes(baseMaterial)).length;
    }
    
    return count;
  };

  // Helper function to get count for a specific variant
  const getVariantCount = (baseMaterial: string, variant: string) => {
    if (!materials || !filaments) return 0;
    
    const rawMaterials = materials.normalizedToRaw?.[baseMaterial]?.[variant] || [];
    return rawMaterials.reduce((sum, rawMaterial) => {
      return sum + (filterCounts[`material_${rawMaterial}`] || 0);
    }, 0);
  };

  const filteredAndSortedFilaments = filaments?.filter(f => {
    // Apply price filter
    if (maxPrice && f.variant_price && f.net_weight_g) {
      const pricePerKg = (f.variant_price / f.net_weight_g) * 1000;
      if (pricePerKg > parseFloat(maxPrice)) return false;
    }
    // Apply AMS filter client-side (since it's calculated dynamically)
    if (amsOnly && !isAMSCompatible(f)) return false;
    return true;
  }).sort((a, b) => {
    // Helper to calculate price per kg
    const getPricePerKg = (filament: typeof a) => {
      if (!filament.variant_price || !filament.net_weight_g || filament.net_weight_g === 0) {
        return filament.variant_price || 999999;
      }
      return (filament.variant_price / filament.net_weight_g) * 1000;
    };

    switch (sortBy) {
      case "print-desc":
        return (b.printability_index || 0) - (a.printability_index || 0);
      case "print-asc":
        return (a.printability_index || 0) - (b.printability_index || 0);
      case "strength-desc":
        return (b.strength_index || 0) - (a.strength_index || 0);
      case "strength-asc":
        return (a.strength_index || 0) - (b.strength_index || 0);
      case "heat-desc":
        return (b.tg_c || b.nozzle_temp_max_c || 0) - (a.tg_c || a.nozzle_temp_max_c || 0);
      case "heat-asc":
        return (a.tg_c || a.nozzle_temp_max_c || 0) - (b.tg_c || b.nozzle_temp_max_c || 0);
      case "score-desc":
        return (b.value_score || 0) - (a.value_score || 0);
      case "score-asc":
        return (a.value_score || 0) - (b.value_score || 0);
      case "price-asc":
        return getPricePerKg(a) - getPricePerKg(b);
      case "price-desc":
        return getPricePerKg(b) - getPricePerKg(a);
      default:
        return 0;
    }
  });

  return (
    <div className="flex min-h-screen">
      {/* Left Sidebar */}
      <aside className="w-72 border-r border-border bg-card/50 backdrop-blur-sm p-6 space-y-6 sticky top-0 h-screen overflow-y-auto shrink-0">
        <PrinterSelector />

        <div className="border-t border-border pt-6 mt-6">
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
                              <span className="ml-1 opacity-60">({getMaterialCount(baseMaterial)})</span>
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
                                        <span className="ml-1 opacity-60">({getVariantCount(baseMaterial, variant)})</span>
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
                          <span className="ml-1 opacity-60">({getMaterialCount(material)})</span>
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
                          <span className="ml-1 opacity-60">({getMaterialCount(material)})</span>
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
                          <span className="ml-1 opacity-60">({getMaterialCount(material)})</span>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            {filteredAndSortedFilaments?.length || 0} <span className="text-muted-foreground font-normal">filaments</span>
          </h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">🇺🇸 United States</span>
          </div>
        </div>

        {/* Search Bar and Sort */}
        <div className="mb-4 flex flex-col sm:flex-row gap-4">
          <Input
            type="text"
            placeholder="Search filaments by name or vendor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 max-w-xl bg-background border-border"
          />
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[200px] bg-background border-border">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border z-50">
              <SelectItem value="print-desc">Print: High to Low</SelectItem>
              <SelectItem value="print-asc">Print: Low to High</SelectItem>
              <SelectItem value="strength-desc">Strength: High to Low</SelectItem>
              <SelectItem value="strength-asc">Strength: Low to High</SelectItem>
              <SelectItem value="heat-desc">Heat: High to Low</SelectItem>
              <SelectItem value="heat-asc">Heat: Low to High</SelectItem>
              <SelectItem value="score-desc">Score: High to Low</SelectItem>
              <SelectItem value="score-asc">Score: Low to High</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Top Filters - Brand, Price, Compatibility */}
        <div className="mb-6 flex flex-wrap items-center gap-4 p-4 bg-card/50 rounded-lg border border-border">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Brand:</span>
            <Select value={selectedBrand} onValueChange={setSelectedBrand}>
              <SelectTrigger className="w-[160px] h-9 bg-background border-border text-sm">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50 max-h-[300px]">
                <SelectItem value="all">All Brands</SelectItem>
                {brands?.map((brand) => (
                  <SelectItem key={brand} value={brand}>
                    <div className="flex items-center justify-between w-full gap-2">
                      <span>{brand}</span>
                      <span className="text-muted-foreground text-xs">({filterCounts[`brand_${brand}`] || 0})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Max $/kg:</span>
            <Input
              type="number"
              placeholder="Any"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 h-9 bg-background border-border text-sm"
            />
          </div>

          <div className="w-px h-6 bg-border hidden sm:block" />

          {/* Compatibility */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer group">
              <Checkbox checked={brassOnly} onCheckedChange={(checked) => setBrassOnly(checked as boolean)} />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs">Brass safe</span>
              <span className="text-xs text-muted-foreground">({filterCounts['brass_safe'] || 0})</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer group">
              <Checkbox checked={foodContact} onCheckedChange={(checked) => setFoodContact(checked as boolean)} />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs">Food safe</span>
              <span className="text-xs text-muted-foreground">({filterCounts['food_contact'] || 0})</span>
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer group">
              <Checkbox checked={amsOnly} onCheckedChange={(checked) => setAmsOnly(checked as boolean)} />
              <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs">AMS/MMU</span>
              <span className="text-xs text-muted-foreground">({filterCounts['ams_fit'] || 0})</span>
            </label>
          </div>
        </div>

        {/* Active Filter Chips */}
        {(searchTerm || maxPrice || (selectedMaterials.length > 1 || (selectedMaterials.length === 1 && selectedMaterials[0] !== "All")) || Object.keys(selectedVariants).length > 0 || selectedBrand !== "all" || brassOnly || foodContact || amsOnly) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            
            {searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: {searchTerm}
                <button
                  onClick={() => setSearchTerm("")}
                  className="ml-1 hover:bg-muted/50 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {maxPrice && (
              <Badge variant="secondary" className="gap-1">
                Max Price: ${maxPrice}/kg
                <button
                  onClick={() => setMaxPrice("")}
                  className="ml-1 hover:bg-muted/50 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {selectedMaterials.filter(m => m !== "All").map(material => (
              <Badge key={material} variant="secondary" className="gap-1">
                {material}
                <button
                  onClick={() => {
                    const newMaterials = selectedMaterials.filter(m => m !== material);
                    setSelectedMaterials(newMaterials.length === 0 ? ["All"] : newMaterials);
                  }}
                  className="ml-1 hover:bg-muted/50 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            
            {Object.entries(selectedVariants).map(([material, variants]) => 
              variants.map(variant => (
                <Badge key={`${material}-${variant}`} variant="secondary" className="gap-1">
                  {variant}
                  <button
                    onClick={() => {
                      const newVariants = { ...selectedVariants };
                      newVariants[material] = newVariants[material].filter(v => v !== variant);
                      if (newVariants[material].length === 0) {
                        delete newVariants[material];
                      }
                      setSelectedVariants(newVariants);
                    }}
                    className="ml-1 hover:bg-muted/50 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            )}
            
            {selectedBrand !== "all" && (
              <Badge variant="secondary" className="gap-1">
                Brand: {selectedBrand}
                <button
                  onClick={() => setSelectedBrand("all")}
                  className="ml-1 hover:bg-muted/50 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {brassOnly && (
              <Badge variant="secondary" className="gap-1">
                Brass Safe
                <button
                  onClick={() => setBrassOnly(false)}
                  className="ml-1 hover:bg-muted/50 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {foodContact && (
              <Badge variant="secondary" className="gap-1">
                Food Contact
                <button
                  onClick={() => setFoodContact(false)}
                  className="ml-1 hover:bg-muted/50 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            {amsOnly && (
              <Badge variant="secondary" className="gap-1">
                AMS Compatible
                <button
                  onClick={() => setAmsOnly(false)}
                  className="ml-1 hover:bg-muted/50 rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setMaxPrice("");
                setSelectedMaterials(["All"]);
                setSelectedVariants({});
                setSelectedBrand("all");
                setBrassOnly(false);
                setFoodContact(false);
                setAmsOnly(false);
              }}
              className="h-7 text-xs"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Filaments List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="text-center py-16 text-muted-foreground">Loading filaments...</div>
          ) : filteredAndSortedFilaments && filteredAndSortedFilaments.length > 0 ? (
            filteredAndSortedFilaments.map((filament) => {
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
                    {/* Checkbox */}
                    <div className="self-start lg:self-center">
                      <Checkbox 
                        checked={selectedForCompare.includes(filament.id)}
                        onCheckedChange={() => toggleCompareSelection(filament.id)}
                      />
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
                      <LikeButton filamentId={filament.id} size="sm" />
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
                          <a href={getAffiliateUrl(filament.product_url, filament.vendor) || filament.product_url} target="_blank" rel="noopener noreferrer">
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
                          <a href={getAffiliateUrl(filament.amazon_link_us, "Amazon") || filament.amazon_link_us} target="_blank" rel="noopener noreferrer">
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

      {/* Floating Compare Bar */}
      {selectedForCompare.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50">
          <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <GitCompare className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium">
                {selectedForCompare.length} filament{selectedForCompare.length > 1 ? 's' : ''} selected
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompareSelection}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleCompare}
                disabled={selectedForCompare.length < 2}
              >
                <GitCompare className="w-4 h-4 mr-2" />
                Compare ({selectedForCompare.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finder;
