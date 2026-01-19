// Brand logo mapping - maps vendor names to their logo paths
// All images optimized to 128x128px WebP format for performance
export const brandLogos: Record<string, string> = {
  // Filament brands
  "3Dhojor": "/images/brands/3dhojor.png",
  "3DHOJOR": "/images/brands/3dhojor.png",
  "3D Solutech": "/images/brands/3d-solutech.png",
  "Bambu Lab": "/images/brands/bambu-lab.webp",
  "Overture": "/images/brands/overture.png",
  "Overture 3D": "/images/brands/overture.png",
  "3DXTech": "/images/brands/3dxtech-long.png",
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
  "HATCHBOX": "/images/brands/hatchbox-new.png",
  "Hatchbox": "/images/brands/hatchbox-new.png",
  "GreenGate3D": "/images/brands/greengate3d.webp",
  "MatterHackers": "/images/brands/matterhackers.webp",
  "Printed Solid": "/images/brands/printed-solid.webp",
  "Atomic Filament": "/images/brands/atomic.webp",
  "Phaetus": "/images/brands/phaetus.webp",
  "Gizmo Dorks": "/images/brands/gizmo-dorks.webp",
  "GizmoDorks": "/images/brands/gizmo-dorks.webp",
  "Polymaker": "/images/brands/polymaker.webp",
  "VoxelPLA": "/images/brands/voxelpla.webp",
  "VOXELPLA": "/images/brands/voxelpla.webp",
  "3DFuel": "/images/brands/3dfuel.webp",
  "3D-Fuel": "/images/brands/3dfuel.webp",
  "3D Fuel": "/images/brands/3dfuel.webp",
  "Eryone": "/images/brands/eryone.webp",
  "ERYONE": "/images/brands/eryone.webp",
  "Inland": "/images/brands/inland.webp",
  "INLAND": "/images/brands/inland.webp",
  "Fiberlogy": "/images/brands/fiberlogy.webp",
  "FIBERLOGY": "/images/brands/fiberlogy.webp",
  "Ziro": "/images/brands/ziro.webp",
  "ZIRO": "/images/brands/ziro.webp",
  "Paramount 3D": "/images/brands/paramount-3d.webp",
  "Proto-Pasta": "/images/brands/proto-pasta.webp",
  "proto-pasta": "/images/brands/proto-pasta.webp",
  "GEEETECH": "/images/brands/geeetech.png",
  "Geeetech": "/images/brands/geeetech.png",
  "Jayo": "/images/brands/jayo.jpg",
  "JAYO": "/images/brands/jayo.jpg",
  "SainSmart": "/images/brands/sainsmart.png",
  "Push Plastic": "/images/brands/push-plastic.png",
  "Fusion Filaments": "/images/brands/fusion-filaments.png",
  "Spectrum Filaments": "/images/brands/spectrum-filaments.svg",
  "Kingroon": "/images/brands/kingroon.png",
  "KINGROON": "/images/brands/kingroon.png",
  "Recreus": "/images/brands/recreus.png",
  "IC3D": "/images/brands/ic3d.png",
  "IC3D Printers": "/images/brands/ic3d.png",
  
  "Duramic 3D": "/images/brands/duramic3d.png",
  "DURAMIC 3D": "/images/brands/duramic3d.png",
  "Extrudr": "/images/brands/extrudr.ico",
  "Filaments.ca": "/images/brands/filaments-ca.png",
  
  // Printer brands
  "AnkerMake": "/images/brands/ankermake.png",
  "Anycubic": "/images/brands/anycubic.webp",
  "Creality": "/images/brands/creality.png",
  "Elegoo": "/images/brands/elegoo.png",
  "FlashForge": "/images/brands/flashforge.png",
  "FLSUN": "/images/brands/flsun.png",
  "LDO Motors": "/images/brands/ldo-motors.png",
  "Markforged": "/images/brands/markforged.png",
  "Prusa Research": "/images/brands/prusa-research.png",
  "QIDI Tech": "/images/brands/qidi.webp",
  "QIDI": "/images/brands/qidi.webp",
  "Raise3D": "/images/brands/raise3d.png",
  "Snapmaker": "/images/brands/snapmaker.png",
  "Sovol": "/images/brands/sovol.png",
  "UltiMaker": "/images/brands/ultimaker.webp",
  "Voron Design": "/images/brands/voron-design.png",
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
