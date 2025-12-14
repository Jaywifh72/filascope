import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";
import { CompareItem } from "./useCompare";

export interface ComparePreset {
  id: string;
  name: string;
  filamentIds: string[];
  filamentNames: string[];
  materials: string[];
  createdAt: number;
}

const PRESETS_STORAGE_KEY = "filascope_compare_presets";

export function useComparePresets() {
  const [presets, setPresets] = useState<ComparePreset[]>([]);

  // Load presets from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(PRESETS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setPresets(parsed);
        }
      }
    } catch (e) {
      console.error("Failed to load presets:", e);
    }
  }, []);

  // Save presets to localStorage
  const savePresetsToStorage = useCallback((newPresets: ComparePreset[]) => {
    try {
      localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(newPresets));
    } catch (e) {
      console.error("Failed to save presets:", e);
      toast.error("Failed to save preset");
    }
  }, []);

  const savePreset = useCallback((name: string, items: CompareItem[]) => {
    if (items.length < 2) {
      toast.error("Add at least 2 materials to save a preset");
      return null;
    }

    const preset: ComparePreset = {
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name.trim() || `Comparison ${presets.length + 1}`,
      filamentIds: items.map(i => i.id),
      filamentNames: items.map(i => i.product_title),
      materials: items.map(i => i.material || "Unknown"),
      createdAt: Date.now(),
    };

    const newPresets = [preset, ...presets];
    setPresets(newPresets);
    savePresetsToStorage(newPresets);
    
    toast.success("Preset saved!", {
      description: preset.name,
    });

    return preset;
  }, [presets, savePresetsToStorage]);

  const deletePreset = useCallback((id: string) => {
    const preset = presets.find(p => p.id === id);
    const newPresets = presets.filter(p => p.id !== id);
    setPresets(newPresets);
    savePresetsToStorage(newPresets);
    
    if (preset) {
      toast.info("Preset deleted", {
        description: preset.name,
      });
    }
  }, [presets, savePresetsToStorage]);

  const renamePreset = useCallback((id: string, newName: string) => {
    const newPresets = presets.map(p => 
      p.id === id ? { ...p, name: newName.trim() } : p
    );
    setPresets(newPresets);
    savePresetsToStorage(newPresets);
    
    toast.success("Preset renamed");
  }, [presets, savePresetsToStorage]);

  const duplicatePreset = useCallback((id: string) => {
    const original = presets.find(p => p.id === id);
    if (!original) return;

    const duplicate: ComparePreset = {
      ...original,
      id: `preset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (copy)`,
      createdAt: Date.now(),
    };

    const newPresets = [duplicate, ...presets];
    setPresets(newPresets);
    savePresetsToStorage(newPresets);
    
    toast.success("Preset duplicated");
  }, [presets, savePresetsToStorage]);

  const getShareUrl = useCallback((preset: ComparePreset) => {
    const ids = preset.filamentIds.join(',');
    return `${window.location.origin}/compare?ids=${ids}`;
  }, []);

  return {
    presets,
    savePreset,
    deletePreset,
    renamePreset,
    duplicatePreset,
    getShareUrl,
  };
}
