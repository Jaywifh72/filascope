import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ExternalLink, ChevronDown, GitCompare, X, LayoutGrid, List, CheckCircle, XCircle } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { getBrandLogo } from "@/lib/brandLogos";
import { LikeButton } from "@/components/LikeButton";
import { PrinterSelector } from "@/components/PrinterSelector";
import { usePrinterSelection } from "@/hooks/usePrinterSelection";
import { checkPrinterFilamentCompatibility } from "@/lib/printerCompatibility";
import { CompatibilityBadge } from "@/components/CompatibilityBadge";
import { useAffiliateLinks } from "@/hooks/useAffiliateLinks";
import { isAMSCompatible } from "@/lib/amsCompatibility";
import BentoGrid from "@/components/BentoGrid";
import { FilamentFilters } from "@/components/FilamentFilters";

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
  const [sortBy, setSortBy] = useState<string>("truecost-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">(() => {
    const saved = localStorage.getItem("finderViewMode");
    return saved === "list" ? "list" : "grid";
  });
  
  // New filter states
  const [highSpeed, setHighSpeed] = useState(false);
  const [matte, setMatte] = useState(false);
  const [carbonFiber, setCarbonFiber] = useState(false);
  const [glow, setGlow] = useState(false);
  const [plasticSpool, setPlasticSpool] = useState(false);
  const [cardboardSpool, setCardboardSpool] = useState(false);
  const [singleSpool, setSingleSpool] = useState(false);
  const [multiPack, setMultiPack] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100]);
  const MAX_PRICE_LIMIT = 100;
  
  // Persist viewMode to localStorage
  useEffect(() => {
    localStorage.setItem("finderViewMode", viewMode);
  }, [viewMode]);
  
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
      
      // Apply price filter - variant_price is already per-kg
      if (maxPrice && f.variant_price) {
        if (f.variant_price > parseFloat(maxPrice)) return false;
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
      
      // Count by pack quantity
      const packQty = f.pack_quantity || 1;
      if (packQty === 1) {
        counts['pack_single'] = (counts['pack_single'] || 0) + 1;
      } else {
        counts['pack_multi'] = (counts['pack_multi'] || 0) + 1;
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
    // Apply price range filter
    if (f.variant_price) {
      if (f.variant_price < priceRange[0] || f.variant_price > priceRange[1]) return false;
    }
    
    // Apply AMS filter client-side (since it's calculated dynamically)
    if (amsOnly && !isAMSCompatible(f)) return false;
    
    // Apply high speed filter
    if (highSpeed && !f.high_speed_capable) return false;
    
    // Apply matte filter
    if (matte && f.finish_type?.toLowerCase() !== 'matte') return false;
    
    // Apply carbon fiber filter
    if (carbonFiber && !f.material?.toLowerCase().includes('cf') && !f.material?.toLowerCase().includes('carbon')) return false;
    
    // Apply glow filter
    if (glow && !f.material?.toLowerCase().includes('glow') && !f.product_title?.toLowerCase().includes('glow')) return false;
    
    // Apply spool type filters
    if (plasticSpool && !cardboardSpool && f.spool_material?.toLowerCase() !== 'plastic') return false;
    if (cardboardSpool && !plasticSpool && f.spool_material?.toLowerCase() !== 'cardboard') return false;
    
    // Apply pack quantity filters
    const packQty = f.pack_quantity || 1;
    if (singleSpool && !multiPack && packQty !== 1) return false;
    if (multiPack && !singleSpool && packQty <= 1) return false;
    
    return true;
  }).sort((a, b) => {
    // Calculate true per-kg price: total_price / (pack_quantity * weight_per_spool_kg)
    const getPricePerKg = (filament: typeof a) => {
      if (!filament.variant_price) return 999999;
      const packQty = (filament as any).pack_quantity || 1;
      const weightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : 1;
      const totalWeightKg = weightKg * packQty;
      return filament.variant_price / totalWeightKg;
    };

    switch (sortBy) {
      case "truecost-asc":
        return getPricePerKg(a) - getPricePerKg(b);
      case "truecost-desc":
        return getPricePerKg(b) - getPricePerKg(a);
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
        return getPricePerKg(a) - getPricePerKg(b);
    }
  });

  return (
    <div className="min-h-screen">
      {/* Bento Grid Hero Section */}
      <BentoGrid />
      
      {/* Full-width Printer Selector at Top */}
      <div className="p-4 lg:p-6 border-b border-border bg-card/30">
        <div className="max-w-[1800px] mx-auto">
          <PrinterSelector />
        </div>
      </div>

      <div className="flex">
        {/* Sidebar Filters */}
        <FilamentFilters
          selectedMaterials={selectedMaterials.includes("All") ? [] : selectedMaterials}
          onMaterialChange={(material, checked) => {
            if (checked) {
              setSelectedMaterials(prev => 
                prev.includes("All") ? [material] : [...prev, material]
              );
            } else {
              setSelectedMaterials(prev => {
                const newMaterials = prev.filter(m => m !== material);
                return newMaterials.length === 0 ? ["All"] : newMaterials;
              });
            }
          }}
          highSpeed={highSpeed}
          onHighSpeedChange={setHighSpeed}
          matte={matte}
          onMatteChange={setMatte}
          carbonFiber={carbonFiber}
          onCarbonFiberChange={setCarbonFiber}
          glow={glow}
          onGlowChange={setGlow}
          plasticSpool={plasticSpool}
          onPlasticSpoolChange={setPlasticSpool}
          cardboardSpool={cardboardSpool}
          onCardboardSpoolChange={setCardboardSpool}
          singleSpool={singleSpool}
          onSingleSpoolChange={setSingleSpool}
          multiPack={multiPack}
          onMultiPackChange={setMultiPack}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          maxPriceLimit={MAX_PRICE_LIMIT}
          filterCounts={filterCounts}
          onReset={() => {
            setSelectedMaterials(["All"]);
            setHighSpeed(false);
            setMatte(false);
            setCarbonFiber(false);
            setGlow(false);
            setPlasticSpool(false);
            setCardboardSpool(false);
            setSingleSpool(false);
            setMultiPack(false);
            setPriceRange([0, MAX_PRICE_LIMIT]);
          }}
          activeFilterCount={
            (selectedMaterials.includes("All") ? 0 : selectedMaterials.length) +
            (highSpeed ? 1 : 0) +
            (matte ? 1 : 0) +
            (carbonFiber ? 1 : 0) +
            (glow ? 1 : 0) +
            (plasticSpool ? 1 : 0) +
            (cardboardSpool ? 1 : 0) +
            (singleSpool ? 1 : 0) +
            (multiPack ? 1 : 0) +
            (priceRange[0] > 0 || priceRange[1] < MAX_PRICE_LIMIT ? 1 : 0)
          }
          onApplyPreset={(preset) => {
            // Reset all filters first
            setSelectedMaterials(preset.filters.materials || ["All"]);
            setHighSpeed(preset.filters.highSpeed ?? false);
            setMatte(preset.filters.matte ?? false);
            setCarbonFiber(preset.filters.carbonFiber ?? false);
            setGlow(preset.filters.glow ?? false);
            setPlasticSpool(preset.filters.plasticSpool ?? false);
            setCardboardSpool(preset.filters.cardboardSpool ?? false);
            setSingleSpool(false);
            setMultiPack(false);
            setPriceRange(preset.filters.priceRange ?? [0, MAX_PRICE_LIMIT]);
          }}
        />

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-8 max-w-[1600px] mx-auto w-full">

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
              <SelectItem value="truecost-asc">True Cost: Low to High</SelectItem>
              <SelectItem value="truecost-desc">True Cost: High to Low</SelectItem>
              <SelectItem value="print-desc">Print: High to Low</SelectItem>
              <SelectItem value="print-asc">Print: Low to High</SelectItem>
              <SelectItem value="strength-desc">Strength: High to Low</SelectItem>
              <SelectItem value="strength-asc">Strength: Low to High</SelectItem>
              <SelectItem value="heat-desc">Heat: High to Low</SelectItem>
              <SelectItem value="heat-asc">Heat: Low to High</SelectItem>
              <SelectItem value="score-desc">Score: High to Low</SelectItem>
              <SelectItem value="score-asc">Score: Low to High</SelectItem>
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
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="flex items-center gap-2 text-sm cursor-pointer group">
                  <Checkbox checked={brassOnly} onCheckedChange={(checked) => setBrassOnly(checked as boolean)} />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs">Brass safe</span>
                  <span className="text-xs text-muted-foreground">({filterCounts['brass_safe'] || 0})</span>
                </label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Non-abrasive filaments safe for brass nozzles</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="flex items-center gap-2 text-sm cursor-pointer group">
                  <Checkbox checked={foodContact} onCheckedChange={(checked) => setFoodContact(checked as boolean)} />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs">Food safe</span>
                  <span className="text-xs text-muted-foreground">({filterCounts['food_contact'] || 0})</span>
                </label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Filaments rated for food contact applications</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <label className="flex items-center gap-2 text-sm cursor-pointer group">
                  <Checkbox checked={amsOnly} onCheckedChange={(checked) => setAmsOnly(checked as boolean)} />
                  <span className="text-muted-foreground group-hover:text-foreground transition-colors text-xs">AMS/MMU</span>
                  <span className="text-xs text-muted-foreground">({filterCounts['ams_fit'] || 0})</span>
                </label>
              </TooltipTrigger>
              <TooltipContent>
                <p>Compatible with automatic material systems (multi-color/multi-material)</p>
              </TooltipContent>
            </Tooltip>
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

        {/* Results count and View Mode Toggle */}
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-muted-foreground">
            {filteredAndSortedFilaments?.length || 0} filaments
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">🇺🇸 United States</span>
            <div className="flex items-center border border-[#333] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${
                  viewMode === "grid" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-[#1A1A1A] text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-[#1A1A1A] text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filaments Display */}
        {isLoading ? (
          <div className="text-center py-16 text-muted-foreground">Loading filaments...</div>
        ) : filteredAndSortedFilaments && filteredAndSortedFilaments.length > 0 ? (
          viewMode === "list" ? (
            /* List View - Compact Table */
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-800 text-left">
                    <th className="py-3 px-2 w-8"></th>
                    <th className="py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Brand</th>
                    <th className="py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Product</th>
                    <th className="py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Material</th>
                    <th className="py-3 px-3 text-xs font-semibold text-orange-400 uppercase tracking-wide text-right">True Cost</th>
                    <th className="py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">List Price</th>
                    <th className="py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-center">Stock</th>
                    <th className="py-3 px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide text-right">Score</th>
                    <th className="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedFilaments.map((filament) => {
                    // Calculate true per-kg price accounting for pack quantity
                    const packQty = (filament as any).pack_quantity || 1;
                    const weightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : 1;
                    const totalWeightKg = weightKg * packQty;
                    const pricePerKg = filament.variant_price ? filament.variant_price / totalWeightKg : null;
                    const isValidPrice = pricePerKg && pricePerKg > 5 && pricePerKg < 500;
                    const displayPricePerKg = isValidPrice ? pricePerKg : null;
                    // Per-spool price = total price / pack quantity
                    const pricePerSpool = filament.variant_price ? filament.variant_price / packQty : null;
                    const overallScore = filament.value_score || 7.0;
                    
                    return (
                      <tr 
                        key={filament.id} 
                        className="border-b border-gray-800 hover:bg-[#1A1A1A] transition-colors cursor-pointer"
                        onClick={() => navigate(`/filaments/${filament.id}`)}
                      >
                        <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={selectedForCompare.includes(filament.id)}
                            onCheckedChange={() => toggleCompareSelection(filament.id)}
                          />
                        </td>
                        <td className="py-3 px-3">
                          <span className="text-sm font-medium text-foreground">{filament.vendor}</span>
                        </td>
                        <td className="py-3 px-3 max-w-[300px]">
                          <span className="text-sm text-muted-foreground truncate block">{filament.product_title}</span>
                        </td>
                        <td className="py-3 px-3">
                          <Badge variant="outline" className="text-xs border-primary/30 text-primary">
                            {filament.material || "—"}
                          </Badge>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-mono text-sm font-bold text-orange-400">
                            {displayPricePerKg ? `$${displayPricePerKg.toFixed(2)}/kg` : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="font-mono text-sm text-muted-foreground">
                            {pricePerSpool ? `$${pricePerSpool.toFixed(2)}` : "—"}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {filament.variant_available !== false ? (
                            <CheckCircle className="w-4 h-4 text-green-400 mx-auto" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-400 mx-auto" />
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className={`font-mono text-sm font-semibold ${
                            overallScore >= 8 ? "text-green-400" : 
                            overallScore >= 6 ? "text-cyan-400" : "text-orange-400"
                          }`}>
                            {overallScore.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <LikeButton filamentId={filament.id} size="sm" />
                            {filament.product_url && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                asChild
                              >
                                <a href={getAffiliateUrl(filament.product_url, filament.vendor) || filament.product_url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View - Original Cards */
            <div className="space-y-3">
            {filteredAndSortedFilaments.map((filament) => {
              // Calculate true per-kg price accounting for pack quantity
              const packQty = (filament as any).pack_quantity || 1;
              const weightKg = filament.net_weight_g ? filament.net_weight_g / 1000 : 1;
              const totalWeightKg = weightKg * packQty;
              const pricePerKg = filament.variant_price ? filament.variant_price / totalWeightKg : null;
              const isValidPrice = pricePerKg && pricePerKg > 5 && pricePerKg < 500;
              const displayPrice = isValidPrice ? pricePerKg.toFixed(2) : null;
              const priceLabel = isValidPrice ? '/kg' : null;
              
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
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground w-12 flex-shrink-0 cursor-help border-b border-dotted border-muted-foreground/50">Print</span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[200px]">
                            <p className="text-xs">Ease of printing - higher means easier to print with less tuning required</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="score-bar flex-1">
                          <div className="score-fill print" style={{ width: `${(filament.ease_of_printing_score || 7) * 10}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground w-12 flex-shrink-0 cursor-help border-b border-dotted border-muted-foreground/50">Strength</span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[200px]">
                            <p className="text-xs">Mechanical strength - tensile and impact resistance of printed parts</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="score-bar flex-1">
                          <div className="score-fill strength" style={{ width: `${(filament.strength_index || 7) * 10}%` }} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-muted-foreground w-12 flex-shrink-0 cursor-help border-b border-dotted border-muted-foreground/50">Heat</span>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-[200px]">
                            <p className="text-xs">Heat resistance - temperature at which the material begins to deform (Tg)</p>
                          </TooltipContent>
                        </Tooltip>
                        <div className="score-bar flex-1">
                          <div className="score-fill heat" style={{ width: `${Math.min((filament.tg_c || 70) / 2, 100)}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Overall Score */}
                    <div className="flex items-center gap-4 lg:flex-col lg:gap-0">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="text-xs text-muted-foreground lg:mb-1 cursor-help border-b border-dotted border-muted-foreground/50">Score</span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px]">
                          <p className="text-xs">Overall value score - combines print quality, strength, and price-to-performance ratio</p>
                        </TooltipContent>
                      </Tooltip>
                      <span className={`text-3xl font-bold ${getScoreColor(overallScore)}`}>
                        {overallScore.toFixed(1)}
                      </span>
                    </div>

                    {/* True Cost */}
                    <div className="flex items-center gap-4 lg:flex-col lg:gap-1 lg:text-center">
                      <span className="text-xs text-orange-400 lg:mb-0 font-medium">True Cost</span>
                      {displayPrice ? (
                        <div>
                          <p className="font-mono font-bold text-orange-400 text-lg">${displayPrice}/kg</p>
                          {filament.net_weight_g && (
                            <p className="text-xs text-muted-foreground">
                              ${(parseFloat(displayPrice) * (filament.net_weight_g / 1000)).toFixed(2)} list
                            </p>
                          )}
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
            })}
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No filaments found</p>
          </div>
        )}
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
    </div>
  );
};

export default Finder;
