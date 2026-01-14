// Helper to check if filament is a wood filament
export const isWoodFilament = (filament: any): boolean => {
  const material = filament.material?.toLowerCase() || '';
  const title = filament.product_title?.toLowerCase() || '';
  const hasWoodContent = filament.wood_powder_percentage !== null && filament.wood_powder_percentage !== undefined && filament.wood_powder_percentage > 0;
  
  // Check finish_type from database
  const finishType = filament.finish_type?.toLowerCase() || '';
  if (finishType === 'wood') return true;
  
  // Exclude color names that contain "wood"
  if (/hollywood|rosewood|driftwood|deadwood|cherrywood/i.test(title)) return false;
  
  return hasWoodContent || 
    /\bwood\b|timber|bamboo/i.test(title) || 
    /\bwood\b|cork/i.test(material);
};

// Get wood percentage for display
export const getWoodPercentage = (filament: any): number | null => {
  return filament.wood_powder_percentage ?? null;
};

// Helper to check if filament is a glass fiber filament
export const isGlassFiberFilament = (filament: any): boolean => {
  const material = filament.material?.toLowerCase() || '';
  const title = filament.product_title?.toLowerCase() || '';
  const hasGFContent = filament.glass_fiber_percentage !== null && filament.glass_fiber_percentage !== undefined && filament.glass_fiber_percentage > 0;
  
  // Check finish_type from database
  const finishType = filament.finish_type?.toLowerCase() || '';
  if (finishType === 'glass fiber') return true;
  
  // Match patterns: -GF, +GF, GF+, _GF, " GF", "glass fiber", NylonG, material ending in GF
  return hasGFContent || 
    /glass\s*fiber|glass-fiber|-gf\b|\+gf\b|gf\s*\d|fiberglass/i.test(title) ||
    /glass\s*fiber|-gf\b|\+gf\b|nylong/i.test(material);
};

// Get glass fiber percentage for display
export const getGlassFiberPercentage = (filament: any): number | null => {
  return filament.glass_fiber_percentage ?? null;
};

// Helper to check if filament is a carbon fiber filament
export const isCarbonFiberFilament = (filament: any): boolean => {
  const material = filament.material?.toLowerCase() || '';
  const title = filament.product_title?.toLowerCase() || '';
  const hasCFContent = filament.carbon_fiber_percentage !== null && filament.carbon_fiber_percentage !== undefined && filament.carbon_fiber_percentage > 0;
  
  // Check finish_type from database
  const finishType = filament.finish_type?.toLowerCase() || '';
  if (finishType === 'carbon') return true;
  
  // Exclude "Polycarbonate" (PC) which might trigger false positives
  const hasPolycarbonate = /polycarbonate/i.test(title);
  
  // Match patterns: -CF, +CF, CF+, "carbon fiber", "carbon-fiber", material containing CF codes
  return hasCFContent || (!hasPolycarbonate && (
    /carbon\s*fiber|carbon-fiber|-cf\b|\+cf\b|cf\s*\d/i.test(title) ||
    /carbon\s*fiber|-cf\b|\+cf\b/i.test(material)
  ));
};

// Get carbon fiber percentage for display
export const getCarbonFiberPercentage = (filament: any): number | null => {
  return filament.carbon_fiber_percentage ?? null;
};

// Helper to check if filament is silk/shimmer finish
export const isSilkFilament = (filament: any): boolean => {
  const finishType = filament.finish_type?.toLowerCase() || '';
  const title = filament.product_title?.toLowerCase() || '';
  
  if (finishType === 'silk') return true;
  return /\bsilk\b|shimmer/i.test(title);
};

// Helper to check if filament is metallic finish
export const isMetallicFilament = (filament: any): boolean => {
  const finishType = filament.finish_type?.toLowerCase() || '';
  const title = filament.product_title?.toLowerCase() || '';
  
  if (finishType === 'metallic') return true;
  return /\bmetallic\b|metal\s*finish/i.test(title);
};

// Helper to check if filament is sparkle/glitter finish
export const isSparkleFilament = (filament: any): boolean => {
  const finishType = filament.finish_type?.toLowerCase() || '';
  const title = filament.product_title?.toLowerCase() || '';
  
  if (finishType === 'sparkle') return true;
  return /sparkle|glitter|galaxy|starlight|starry|cosmic/i.test(title);
};

// Helper to check if filament is translucent/transparent
export const isTranslucentFilament = (filament: any): boolean => {
  const finishType = filament.finish_type?.toLowerCase() || '';
  const title = filament.product_title?.toLowerCase() || '';
  
  if (finishType === 'translucent') return true;
  // Exclude "crystal white" which is a color name, not translucent
  if (/crystal\s*white/i.test(title)) return false;
  return /translucent|transparent|clear\b|crystal/i.test(title);
};

// Helper to check if filament is glow in the dark
export const isGlowFilament = (filament: any): boolean => {
  const finishType = filament.finish_type?.toLowerCase() || '';
  const title = filament.product_title?.toLowerCase() || '';
  const material = filament.material?.toLowerCase() || '';
  
  if (finishType === 'glow') return true;
  return /\bglow\b|luminous|phosphorescent|gid\b|gitd\b/i.test(title) ||
         /\bglow\b|luminous|phosphorescent/i.test(material);
};

// Helper to check if filament is matte finish
export const isMatteFilament = (filament: any): boolean => {
  const finishType = filament.finish_type?.toLowerCase() || '';
  const title = filament.product_title?.toLowerCase() || '';
  
  if (finishType === 'matte') return true;
  return /\bmatte\b/i.test(title);
};

// Helper to check if filament is high speed capable
export const isHighSpeedFilament = (filament: any): boolean => {
  // First check database flag
  if (filament.high_speed_capable === true) return true;
  
  const title = filament.product_title?.toLowerCase() || '';
  const material = filament.material?.toLowerCase() || '';
  const combined = title + ' ' + material;
  
  return /high[\s-]?speed|highspeed|-hs\b|hs-|\bhs\s+|\brapid\b|hyper[\s-]?speed|turbo/i.test(combined);
};

// Helper to strip vendor name from product title
export const getDisplayTitle = (filament: any): string => {
  const title = filament.product_title || '';
  const vendor = filament.vendor || '';
  if (vendor && title.toLowerCase().startsWith(vendor.toLowerCase())) {
    return title.slice(vendor.length).trim();
  }
  return title;
};

// Get score color based on value
export const getScoreColor = (score: number): string => {
  if (score >= 8) return "text-green-400";
  if (score >= 6) return "text-cyan-400";
  return "text-orange-400";
};

// Normalize variant names to group similar variants
export const normalizeVariantName = (material: string, base: string): string => {
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
