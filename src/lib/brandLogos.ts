// Brand logo mapping - maps vendor names to their logo paths
// All images optimized to 128x128px WebP format for performance
export const brandLogos: Record<string, string> = {
  "Bambu Lab": "/images/brands/bambu-lab.webp",
  "Overture": "/images/brands/overture.webp",
  "Overture 3D": "/images/brands/overture.webp",
  "3DXTech": "/images/brands/3dxtech.webp",
  "Filamentum": "/images/brands/filamentum.webp",
  "Fillamentum": "/images/brands/filamentum.webp", // Alternate spelling
  "Amolen": "/images/brands/amolen.webp",
  "FormFutura": "/images/brands/formfutura.webp",
  "Taulman3D": "/images/brands/taulman3d.webp",
  "Ultimaker": "/images/brands/ultimaker.webp",
  "Siraya Tech": "/images/brands/siraya-tech.webp",
  "NinjaTek": "/images/brands/ninjatek.webp",
  "eSun": "/images/brands/esun.webp",
  "ColorFabb": "/images/brands/colorfabb.webp",
  "Matter3D": "/images/brands/matter3d.webp",
  "Prusament": "/images/brands/prusament.webp",
  "SUNLU": "/images/brands/sunlu.webp",
  "Sunlu": "/images/brands/sunlu.webp",
  "HATCHBOX": "/images/brands/hatchbox.webp",
  "Hatchbox": "/images/brands/hatchbox.webp",
  "GreenGate3D": "/images/brands/greengate3d.webp",
  "MatterHackers": "/images/brands/matterhackers.webp",
  "Printed Solid": "/images/brands/printed-solid.webp",
  "Atomic Filament": "/images/brands/atomic.webp",
  "QIDI": "/images/brands/qidi.webp",
  "Phaetus": "/images/brands/phaetus.webp",
  "Gizmo Dorks": "/images/brands/gizmo-dorks.webp",
  "GizmoDorks": "/images/brands/gizmo-dorks.webp",
  "Polymaker": "/images/brands/polymaker.webp",
};

// Helper function to get brand logo with fallback
export const getBrandLogo = (vendor: string | null): string | null => {
  if (!vendor) return null;
  
  // Try exact match first
  if (brandLogos[vendor]) {
    return brandLogos[vendor];
  }
  
  // Try case-insensitive match
  const vendorLower = vendor.toLowerCase();
  const matchedKey = Object.keys(brandLogos).find(
    key => key.toLowerCase() === vendorLower
  );
  
  return matchedKey ? brandLogos[matchedKey] : null;
};
