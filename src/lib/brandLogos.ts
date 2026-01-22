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
  "Ultimaker": "/images/brands/ultimaker-long-white.png",
  "Siraya Tech": "/images/brands/siraya-tech-light.png",
  "NinjaTek": "/images/brands/ninjatek-white.png",
  "eSun": "/images/brands/esun-long.png",
  "ColorFabb": "/images/brands/colorfabb-long.webp",
  "Matter3D": "/images/brands/matter3d-white.webp",
  "Prusament": "/images/brands/prusament-white.png",
  "SUNLU": "/images/brands/sunlu-light.png",
  "Sunlu": "/images/brands/sunlu-light.png",
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
  "VoxelPLA": "/images/brands/voxelpla-white.webp",
  "VOXELPLA": "/images/brands/voxelpla-white.webp",
  "3DFuel": "/images/brands/3dfuel.webp",
  "3D-Fuel": "/images/brands/3dfuel.webp",
  "3D Fuel": "/images/brands/3dfuel.webp",
  "Eryone": "/images/brands/eryone-white.png",
  "ERYONE": "/images/brands/eryone-white.png",
  "Inland": "/images/brands/inland.webp",
  "INLAND": "/images/brands/inland.webp",
  "Fiberlogy": "/images/brands/fiberlogy-wide.webp",
  "FIBERLOGY": "/images/brands/fiberlogy-wide.webp",
  "Ziro": "/images/brands/ziro-white.webp",
  "ZIRO": "/images/brands/ziro-white.webp",
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
  "Spectrum Filaments": "/images/brands/spectrum-white.png",
  "Kingroon": "/images/brands/kingroon-long.webp",
  "KINGROON": "/images/brands/kingroon-long.webp",
  "Recreus": "/images/brands/recreus-white.png",
  "IC3D": "/images/brands/ic3d-long.png",
  "IC3D Printers": "/images/brands/ic3d-long.png",
  "Numakers": "/images/brands/numakers-white.png",
  "NUMAKERS": "/images/brands/numakers-white.png",
  
  "Duramic 3D": "/images/brands/duramic3d-white.webp",
  "DURAMIC 3D": "/images/brands/duramic3d-white.webp",
  "Extrudr": "/images/brands/extrudr-logo.png",
  "Filaments.ca": "/images/brands/filaments-ca.png",
  
  
  // Printer brands
  "AnkerMake": "/images/brands/ankermake-new.png",
  "Anycubic": "/images/brands/anycubic-long.webp",
  "Creality": "/images/brands/creality-long.png",
  "Elegoo": "/images/brands/elegoo-long.webp",
  "FlashForge": "/images/brands/flashforge-new.png",
  "FLSUN": "/images/brands/flsun.webp",
  "LDO Motors": "/images/brands/ldo-motors.png",
  "Markforged": "/images/brands/markforged-new.png",
  "Prusa Research": "/images/brands/prusa-research-new.jpg",
  "QIDI Tech": "/images/brands/qidi.png",
  "QIDI": "/images/brands/qidi.png",
  "Raise3D": "/images/brands/raise3d-light.png",
  "Snapmaker": "/images/brands/snapmaker-white.png",
  "Sovol": "/images/brands/sovol-long.webp",
  "UltiMaker": "/images/brands/ultimaker-long-white.png",
  "Voron Design": "/images/brands/voron-design.png",
  "TreeD Filaments": "/images/brands/treed-light.png",
  "TreeD": "/images/brands/treed-light.png",
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
