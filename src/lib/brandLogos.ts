import { getImageUrl } from '@/lib/imageUrl';

// Brand logo mapping - maps vendor names to their logo paths
// All images optimized to 128x128px WebP format for performance
export const brandLogos: Record<string, string> = {
  // Filament brands
  "3Dhojor": getImageUrl("brands/3dhojor.png"),
  "3DHOJOR": getImageUrl("brands/3dhojor.png"),
  "3D Solutech": getImageUrl("brands/3d-solutech.png"),
  "Bambu Lab": getImageUrl("brands/bambulab-long.webp"),
  "Overture": getImageUrl("brands/overture-long.webp"),
  "Overture 3D": getImageUrl("brands/overture-long.webp"),
  "3DXTech": getImageUrl("brands/3dxtech-long.png"),
  "Filamentum": getImageUrl("brands/filamentum-long.webp"),
  "Fillamentum": getImageUrl("brands/filamentum-long.webp"),
  "Amolen": getImageUrl("brands/amolen-long.webp"),
  "FormFutura": getImageUrl("brands/formfutura-white.png"),
  "Taulman3D": getImageUrl("brands/taulman3d.webp"),
  "Ultimaker": getImageUrl("brands/ultimaker-long-white.png"),
  "Siraya Tech": getImageUrl("brands/siraya-tech-light.png"),
  "NinjaTek": getImageUrl("brands/ninjatek-white.png"),
  "eSun": getImageUrl("brands/esun-long.png"),
  "ColorFabb": getImageUrl("brands/colorfabb-long.webp"),
  "Matter3D": getImageUrl("brands/matter3d-white.webp"),
  "Prusament": getImageUrl("brands/prusament-white.png"),
  "SUNLU": getImageUrl("brands/sunlu-light.png"),
  "Sunlu": getImageUrl("brands/sunlu-light.png"),
  "HATCHBOX": getImageUrl("brands/hatchbox-white.png"),
  "Hatchbox": getImageUrl("brands/hatchbox-white.png"),
  "GreenGate3D": getImageUrl("brands/greengate3d.webp"),
  "MatterHackers": getImageUrl("brands/matterhackers.webp"),
  "Printed Solid": getImageUrl("brands/printed-solid.webp"),
  "Atomic Filament": getImageUrl("brands/atomic-long.jpg"),
  "AzureFilm": getImageUrl("brands/azurefilm-long.png"),
  "Azurefilm": getImageUrl("brands/azurefilm-long.png"),
  "AZUREFILM": getImageUrl("brands/azurefilm-long.png"),
  "Phaetus": getImageUrl("brands/phaetus.webp"),
  "Gizmo Dorks": getImageUrl("brands/gizmodorks-white.webp"),
  "GizmoDorks": getImageUrl("brands/gizmodorks-white.webp"),
  "Polymaker": getImageUrl("brands/polymaker-long.png"),
  "VoxelPLA": getImageUrl("brands/voxelpla-white.webp"),
  "VOXELPLA": getImageUrl("brands/voxelpla-white.webp"),
  "3DFuel": getImageUrl("brands/3dfuel.webp"),
  "3D-Fuel": getImageUrl("brands/3dfuel.webp"),
  "3D Fuel": getImageUrl("brands/3dfuel.webp"),
  "Eryone": getImageUrl("brands/eryone-white.png"),
  "ERYONE": getImageUrl("brands/eryone-white.png"),
  "Inland": getImageUrl("brands/inland.webp"),
  "INLAND": getImageUrl("brands/inland.webp"),
  "Fiberlogy": getImageUrl("brands/fiberlogy-wide.webp"),
  "FIBERLOGY": getImageUrl("brands/fiberlogy-wide.webp"),
  "Ziro": getImageUrl("brands/ziro-white.webp"),
  "ZIRO": getImageUrl("brands/ziro-white.webp"),
  "Paramount 3D": getImageUrl("brands/paramount-3d-white.png"),
  "Proto-Pasta": getImageUrl("brands/proto-pasta-white.png"),
  "proto-pasta": getImageUrl("brands/proto-pasta-white.png"),
  "GEEETECH": getImageUrl("brands/geeetech-white.png"),
  "Geeetech": getImageUrl("brands/geeetech-white.png"),
  "Jayo": getImageUrl("brands/jayo.jpg"),
  "JAYO": getImageUrl("brands/jayo.jpg"),
  "SainSmart": getImageUrl("brands/sainsmart.png"),
  "Push Plastic": getImageUrl("brands/push-plastic-long.png"),
  
  "Fusion Filaments": getImageUrl("brands/fusion-filaments-long.webp"),
  "Spectrum Filaments": getImageUrl("brands/spectrum-white.png"),
  "Kingroon": getImageUrl("brands/kingroon-long.webp"),
  "KINGROON": getImageUrl("brands/kingroon-long.webp"),
  "Recreus": getImageUrl("brands/recreus-white.png"),
  "IC3D": getImageUrl("brands/ic3d-long.png"),
  "IC3D Printers": getImageUrl("brands/ic3d-long.png"),
  "Numakers": getImageUrl("brands/numakers-white.png"),
  "NUMAKERS": getImageUrl("brands/numakers-white.png"),
  
  "Duramic 3D": getImageUrl("brands/duramic3d-white.webp"),
  "DURAMIC 3D": getImageUrl("brands/duramic3d-white.webp"),
  "Extrudr": getImageUrl("brands/extrudr-logo.png"),
  "Filaments.ca": getImageUrl("brands/filaments-ca.png"),
  
  
  // Printer brands
  "AnkerMake": getImageUrl("brands/ankermake-new.png"),
  "Anycubic": getImageUrl("brands/anycubic-long.webp"),
  "Creality": getImageUrl("brands/creality-long.png"),
  "Elegoo": getImageUrl("brands/elegoo-long.webp"),
  "FlashForge": getImageUrl("brands/flashforge-new.png"),
  "FLSUN": getImageUrl("brands/flsun.webp"),
  "LDO Motors": getImageUrl("brands/ldo-motors.png"),
  "Markforged": getImageUrl("brands/markforged-new.png"),
  "Prusa Research": getImageUrl("brands/prusa-research-new.jpg"),
  "QIDI Tech": getImageUrl("brands/qidi.png"),
  "QIDI": getImageUrl("brands/qidi.png"),
  "Raise3D": getImageUrl("brands/raise3d-light.png"),
  "Snapmaker": getImageUrl("brands/snapmaker-white.png"),
  "Sovol": getImageUrl("brands/sovol-long.webp"),
  "UltiMaker": getImageUrl("brands/ultimaker-long-white.png"),
  "Voron Design": getImageUrl("brands/voron-design.png"),
  "TreeD Filaments": getImageUrl("brands/treed-light.png"),
  "TreeD": getImageUrl("brands/treed-light.png"),
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
