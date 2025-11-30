// Brand logo mapping - maps vendor names to their logo paths
export const brandLogos: Record<string, string> = {
  "Bambu Lab": "/images/brands/bambu-lab.png",
  "Overture": "/images/brands/overture.png",
  "Overture 3D": "/images/brands/overture.png",
  "3DXTech": "/images/brands/3dxtech.jpg",
  "Filamentum": "/images/brands/filamentum.png",
  "Fillamentum": "/images/brands/filamentum.png", // Alternate spelling
  "Amolen": "/images/brands/amolen.jpg",
  "FormFutura": "/images/brands/formfutura.png",
  "Taulman3D": "/images/brands/taulman3d.jpg",
  "Ultimaker": "/images/brands/ultimaker.png",
  "Siraya Tech": "/images/brands/siraya-tech.jpg",
  "NinjaTek": "/images/brands/ninjatek.jpg",
  "eSun": "/images/brands/esun.webp",
  "ColorFabb": "/images/brands/colorfabb.jpg",
  "Matter3D": "/images/brands/matter3d.jpg",
  "Prusament": "/images/brands/prusament.webp",
  "SUNLU": "/images/brands/sunlu.jpg",
  "Sunlu": "/images/brands/sunlu.jpg",
  "HATCHBOX": "/images/brands/hatchbox.jpg",
  "Hatchbox": "/images/brands/hatchbox.jpg",
  "GreenGate3D": "/images/brands/greengate3d.jpg",
  "MatterHackers": "/images/brands/matterhackers.jpg",
  "Printed Solid": "/images/brands/printed-solid.jpg",
  "Atomic Filament": "/images/brands/atomic.png",
  "QIDI": "/images/brands/qidi.png",
  "Phaetus": "/images/brands/phaetus.jpg",
  "Gizmo Dorks": "/images/brands/gizmo-dorks.png",
  "GizmoDorks": "/images/brands/gizmo-dorks.png",
  "Polymaker": "/images/brands/polymaker.png",
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
