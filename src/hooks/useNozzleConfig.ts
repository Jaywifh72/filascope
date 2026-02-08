import { useState, useEffect, useCallback } from "react";

// Nozzle configuration options
export const NOZZLE_SIZES = [0.2, 0.4, 0.6, 0.8] as const;
export type NozzleSize = typeof NOZZLE_SIZES[number];

export const FLOW_TYPES = ["regular", "high-flow"] as const;
export type FlowType = typeof FLOW_TYPES[number];

export const NOZZLE_MATERIALS = ["brass", "hardened-steel", "stainless-steel", "ruby-sapphire", "tungsten-carbide"] as const;
export type NozzleMaterial = typeof NOZZLE_MATERIALS[number];

export const FLOW_TYPE_LABELS: Record<FlowType, string> = {
  "regular": "Regular",
  "high-flow": "High Flow",
};

export const NOZZLE_MATERIAL_LABELS: Record<NozzleMaterial, string> = {
  "brass": "Brass",
  "hardened-steel": "Hardened Steel",
  "stainless-steel": "Stainless Steel",
  "ruby-sapphire": "Ruby / Sapphire",
  "tungsten-carbide": "Tungsten Carbide",
};

export const NOZZLE_MATERIAL_DESCRIPTIONS: Record<NozzleMaterial, string> = {
  "brass": "Standard nozzle material. Great for PLA, PETG, ABS, and most common filaments. Not suitable for abrasive materials.",
  "hardened-steel": "Maximum durability for abrasive filaments like carbon fiber, glass fiber, and metal-filled materials.",
  "stainless-steel": "Good chemical resistance with moderate durability. Suitable for food-safe and medical applications.",
  "ruby-sapphire": "Premium option with excellent wear resistance for highly abrasive materials. Minimal effect on thermal performance.",
  "tungsten-carbide": "Extreme hardness and thermal conductivity. Top-tier choice for abrasive and high-temperature materials.",
};

interface NozzleConfig {
  size: NozzleSize;
  flowType: FlowType;
  material: NozzleMaterial;
}

const LOCAL_STORAGE_KEY = "filascope_nozzle_config";

const DEFAULT_CONFIG: NozzleConfig = {
  size: 0.4,
  flowType: "regular",
  material: "hardened-steel",
};

export function useNozzleConfig(printerStockNozzle?: number | null) {
  const [config, setConfig] = useState<NozzleConfig>(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (stored) {
      try {
        return JSON.parse(stored) as NozzleConfig;
      } catch {
        return DEFAULT_CONFIG;
      }
    }
    return DEFAULT_CONFIG;
  });

  const [hasCustomSize, setHasCustomSize] = useState(false);

  // Update size to printer's stock nozzle when printer changes (unless user has customized)
  useEffect(() => {
    if (printerStockNozzle && !hasCustomSize) {
      const validSize = NOZZLE_SIZES.find(s => s === printerStockNozzle);
      if (validSize && validSize !== config.size) {
        setConfig(prev => ({ ...prev, size: validSize }));
      }
    }
  }, [printerStockNozzle, hasCustomSize]);

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));
  }, [config]);

  const setSize = useCallback((size: NozzleSize) => {
    setHasCustomSize(true);
    setConfig(prev => ({ ...prev, size }));
  }, []);

  const setFlowType = useCallback((flowType: FlowType) => {
    setConfig(prev => ({ ...prev, flowType }));
  }, []);

  const setMaterial = useCallback((material: NozzleMaterial) => {
    setConfig(prev => ({ ...prev, material }));
  }, []);

  const resetToDefaults = useCallback((printerNozzle?: number) => {
    setHasCustomSize(false);
    const validSize = printerNozzle && NOZZLE_SIZES.includes(printerNozzle as NozzleSize) 
      ? printerNozzle as NozzleSize 
      : DEFAULT_CONFIG.size;
    setConfig({
      size: validSize,
      flowType: DEFAULT_CONFIG.flowType,
      material: DEFAULT_CONFIG.material,
    });
  }, []);

  // Compatibility checks
  const supportsAbrasiveMaterials = config.material !== "brass";
  
  // High-flow nozzles can handle higher flow rates
  const isHighFlow = config.flowType === "high-flow";

  return {
    ...config,
    setSize,
    setFlowType,
    setMaterial,
    resetToDefaults,
    supportsAbrasiveMaterials,
    isHighFlow,
    hasCustomSize,
  };
}
