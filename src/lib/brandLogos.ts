// Brand logo mapping - maps vendor names to their logo paths
// All images optimized to 128x128px WebP format for performance
export const brandLogos: Record<string, string> = {
  // Filament brands
  "3Dhojor": "/images/brands/3dhojor.png",
  "3DHOJOR": "/images/brands/3dhojor.png",
  "3D Solutech": "/images/brands/3d-solutech.png",
  "Bambu Lab": "/images/brands/bambulab-long.webp",
  "Overture": "/images/brands/overture-long.webp",
  "Overture 3D": "/images/brands/overture-long.webp",
  "3DXTech": "/images/brands/3dxtech-long.png",
  "Filamentum": "/images/brands/filamentum-long.webp",
  "Fillamentum": "/images/brands/filamentum-long.webp", // Alternate spelling
  "Amolen": "/images/brands/amolen-long.webp",
  "FormFutura": "/images/brands/formfutura-white.png",
  "Taulman3D": "/images/brands/taulman3d.webp",
  "Ultimaker": "/images/brands/ultimaker.webp",
  "Siraya Tech": "/images/brands/siraya-tech.webp",
  "NinjaTek": "/images/brands/ninjatek-white.png",
  "eSun": "/images/brands/esun-long.png",
  "ColorFabb": "/images/brands/colorfabb-long.webp",
  "Matter3D": "/images/brands/matter3d-white.webp",
  "Prusament": "/images/brands/prusament-white.png",
  "SUNLU": "/images/brands/sunlu.webp",
  "Sunlu": "/images/brands/sunlu.webp",
  "HATCHBOX": "/images/brands/hatchbox-white.png",
  "Hatchbox": "/images/brands/hatchbox-white.png",
  "GreenGate3D": "/images/brands/greengate3d.webp",
  "MatterHackers": "/images/brands/matterhackers.webp",
  "Printed Solid": "/images/brands/printed-solid.webp",
  "Atomic Filament": "/images/brands/atomic-long.jpg",
  "AzureFilm": "/images/brands/azurefilm-long.png",
  "Azurefilm": "/images/brands/azurefilm-long.png",
  "AZUREFILM": "/images/brands/azurefilm-long.png",
  "Phaetus": "/images/brands/phaetus.webp",
  "Gizmo Dorks": "/images/brands/gizmodorks-white.webp",
  "GizmoDorks": "/images/brands/gizmodorks-white.webp",
  "Polymaker": "/images/brands/polymaker-long.png",
  "VoxelPLA": "/images/brands/voxelpla.webp",
  "VOXELPLA": "/images/brands/voxelpla.webp",
  "3DFuel": "/images/brands/3dfuel.webp",
  "3D-Fuel": "/images/brands/3dfuel.webp",
  "3D Fuel": "/images/brands/3dfuel.webp",
  "Eryone": "/images/brands/eryone-white.png",
  "ERYONE": "/images/brands/eryone-white.png",
  "Inland": "/images/brands/inland.webp",
  "INLAND": "/images/brands/inland.webp",
  "Fiberlogy": "/images/brands/fiberlogy-wide.webp",
  "FIBERLOGY": "/images/brands/fiberlogy-wide.webp",
  "Ziro": "/images/brands/ziro.webp",
  "ZIRO": "/images/brands/ziro.webp",
  "Paramount 3D": "/images/brands/paramount-3d-white.png",
  "Proto-Pasta": "/images/brands/proto-pasta-white.png",
  "proto-pasta": "/images/brands/proto-pasta-white.png",
  "GEEETECH": "/images/brands/geeetech-white.png",
  "Geeetech": "/images/brands/geeetech-white.png",
  "Jayo": "/images/brands/jayo.jpg",
  "JAYO": "/images/brands/jayo.jpg",
  "SainSmart": "/images/brands/sainsmart.png",
  "Push Plastic": "/images/brands/push-plastic-long.png",
  
  "Fusion Filaments": "/images/brands/fusion-filaments-long.webp",
  "Spectrum Filaments": "/images/brands/spectrum-filaments.svg",
  "Kingroon": "/images/brands/kingroon-long.webp",
  "KINGROON": "/images/brands/kingroon-long.webp",
  "Recreus": "/images/brands/recreus.png",
  "IC3D": "/images/brands/ic3d-long.png",
  "IC3D Printers": "/images/brands/ic3d-long.png",
  "Numakers": "/images/brands/numakers-white.png",
  "NUMAKERS": "/images/brands/numakers-white.png",
  
  "Duramic 3D": "/images/brands/duramic3d-white.webp",
  "DURAMIC 3D": "/images/brands/duramic3d-white.webp",
  "Extrudr": "/images/brands/extrudr-logo.png",
  "Filaments.ca": "/images/brands/filaments-ca.png",
  
  // Printer brands
  "AnkerMake": "/images/brands/ankermake.png",
  "Anycubic": "/images/brands/anycubic-long.webp",
  "Creality": "/images/brands/creality-long.png",
  "Elegoo": "/images/brands/elegoo-long.webp",
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
