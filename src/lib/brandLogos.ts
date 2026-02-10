// Brand logo mapping - maps vendor names to their official logo files
// Logos are stored locally in public/brands/ for reliability
// The BrandLogo component handles fallback if any image fails

const logo = (filename: string) => `/brands/${filename}`;

export const brandLogos: Record<string, string> = {
  // Filament brands
  "3D Solutech": logo("3dsolutech.png"),
  "Bambu Lab": logo("bambulab.webp"),
  "Overture": logo("overture.webp"),
  "Overture 3D": logo("overture.webp"),
  "3DXTech": logo("3dxtech.png"),
  "Filamentum": logo("fillamentum.webp"),
  "Fillamentum": logo("fillamentum.webp"),
  "Amolen": logo("amolen.webp"),
  "FormFutura": logo("formfutura.png"),
  "Taulman3D": logo("3dfuel.webp"),
  "Ultimaker": logo("ultimaker.png"),
  "UltiMaker": logo("ultimaker.png"),
  "Siraya Tech": logo("sirayatech.png"),
  "NinjaTek": logo("ninjatek.png"),
  "eSun": logo("esun.png"),
  "ColorFabb": logo("colorfabb.webp"),
  "Matter3D": logo("matter3d.webp"),
  "Prusament": logo("prusament.png"),
  "Prusa Research": logo("prusament.png"),
  "SUNLU": logo("sunlu.png"),
  "Sunlu": logo("sunlu.png"),
  "HATCHBOX": logo("hatchbox.png"),
  "Hatchbox": logo("hatchbox.png"),
  "MatterHackers": logo("matter3d.webp"),
  "Printed Solid": logo("protopasta.png"),
  "Atomic Filament": logo("atomic.jpg"),
  "AzureFilm": logo("azurefilm.png"),
  "Azurefilm": logo("azurefilm.png"),
  "AZUREFILM": logo("azurefilm.png"),
  "Phaetus": logo("3dfuel.webp"),
  "Gizmo Dorks": logo("gizmodorks.webp"),
  "GizmoDorks": logo("gizmodorks.webp"),
  "Polymaker": logo("polymaker.png"),
  "3DFuel": logo("3dfuel.webp"),
  "3D-Fuel": logo("3dfuel.webp"),
  "3D Fuel": logo("3dfuel.webp"),
  "Eryone": logo("eryone.png"),
  "ERYONE": logo("eryone.png"),
  "Inland": logo("hatchbox.png"),
  "INLAND": logo("hatchbox.png"),
  "Fiberlogy": logo("fiberlogy.webp"),
  "FIBERLOGY": logo("fiberlogy.webp"),
  "Proto-Pasta": logo("protopasta.png"),
  "proto-pasta": logo("protopasta.png"),
  "GEEETECH": logo("geeetech.png"),
  "Geeetech": logo("geeetech.png"),
  "Jayo": logo("sunlu.png"),
  "JAYO": logo("sunlu.png"),
  "SainSmart": logo("3dfuel.webp"),
  "Push Plastic": logo("pushplastic.png"),
  "Fusion Filaments": logo("fusionfilaments.webp"),
  "Spectrum Filaments": logo("spectrum.png"),
  "Kingroon": logo("kingroon.webp"),
  "KINGROON": logo("kingroon.webp"),
  "Recreus": logo("recreus.png"),
  "IC3D": logo("ic3d.png"),
  "IC3D Printers": logo("ic3d.png"),
  "Numakers": logo("numakers.png"),
  "NUMAKERS": logo("numakers.png"),
  "Duramic 3D": logo("duramic3d.webp"),
  "DURAMIC 3D": logo("duramic3d.webp"),
  "Extrudr": logo("extrudr.png"),
  "Filaments.ca": logo("filaments-ca.png"),
  "Ziro": logo("ziro.webp"),
  "ZIRO": logo("ziro.webp"),
  "Voxel PLA": logo("voxelpla.webp"),

  // Printer brands
  "AnkerMake": logo("ankermake.png"),
  "Anycubic": logo("anycubic.webp"),
  "Creality": logo("creality.png"),
  "Elegoo": logo("elegoo.webp"),
  "FlashForge": logo("flashforge.png"),
  "FLSUN": logo("flsun.webp"),
  "LDO Motors": logo("3dfuel.webp"),
  "Markforged": logo("markforged.png"),
  "QIDI Tech": logo("qidi.png"),
  "QIDI": logo("qidi.png"),
  "Raise3D": logo("raise3d.png"),
  "Snapmaker": logo("snapmaker.png"),
  "Sovol": logo("sovol.webp"),
  "Voron Design": logo("3dfuel.webp"),
  "TreeD Filaments": logo("treed.png"),
  "TreeD": logo("treed.png"),
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
