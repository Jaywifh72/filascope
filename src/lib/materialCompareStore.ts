// Simple localStorage-based store for material comparison selections
// Used to pass materials between Reference and Comparison tabs

const STORAGE_KEY = 'filascope_material_compare';
const MAX_MATERIALS = 4;

export function getMaterialCompareList(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addMaterialToCompare(material: string): 'added' | 'already' | 'full' {
  const list = getMaterialCompareList();
  if (list.includes(material)) return 'already';
  if (list.length >= MAX_MATERIALS) return 'full';
  list.push(material);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('material-compare-changed'));
  return 'added';
}

export function removeMaterialFromCompare(material: string): void {
  const list = getMaterialCompareList().filter(m => m !== material);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent('material-compare-changed'));
}

export function isMaterialInCompare(material: string): boolean {
  return getMaterialCompareList().includes(material);
}
