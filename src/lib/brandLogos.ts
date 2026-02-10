// Brand logo mapping - maps vendor names to their logo URLs
// Uses Clearbit Logo API for reliable, high-quality logos
// The BrandLogo component handles fallback if any URL fails

const clearbit = (domain: string) => `https://logo.clearbit.com/${domain}?size=128&format=png`;

export const brandLogos: Record<string, string> = {
  // Filament brands
  "3D Solutech": clearbit("3dsolutech.com"),
  "Bambu Lab": clearbit("bambulab.com"),
  "Overture": clearbit("overture3d.com"),
  "Overture 3D": clearbit("overture3d.com"),
  "3DXTech": clearbit("3dxtech.com"),
  "Filamentum": clearbit("fillamentum.com"),
  "Fillamentum": clearbit("fillamentum.com"),
  "Amolen": clearbit("amolen.com"),
  "FormFutura": clearbit("formfutura.com"),
  "Taulman3D": clearbit("taulman3d.com"),
  "Ultimaker": clearbit("ultimaker.com"),
  "UltiMaker": clearbit("ultimaker.com"),
  "Siraya Tech": clearbit("sirayatech.com"),
  "NinjaTek": clearbit("ninjatek.com"),
  "eSun": clearbit("esun3d.net"),
  "ColorFabb": clearbit("colorfabb.com"),
  "Matter3D": clearbit("matter3d.com"),
  "Prusament": clearbit("prusa3d.com"),
  "Prusa Research": clearbit("prusa3d.com"),
  "SUNLU": clearbit("sunlu.com"),
  "Sunlu": clearbit("sunlu.com"),
  "HATCHBOX": clearbit("hatchbox3d.com"),
  "Hatchbox": clearbit("hatchbox3d.com"),
  "MatterHackers": clearbit("matterhackers.com"),
  "Printed Solid": clearbit("printedsolid.com"),
  "Atomic Filament": clearbit("atomicfilament.com"),
  "AzureFilm": clearbit("azurefilm.com"),
  "Azurefilm": clearbit("azurefilm.com"),
  "AZUREFILM": clearbit("azurefilm.com"),
  "Phaetus": clearbit("phaetus.com"),
  "Gizmo Dorks": clearbit("gizmodorks.com"),
  "GizmoDorks": clearbit("gizmodorks.com"),
  "Polymaker": clearbit("polymaker.com"),
  "3DFuel": clearbit("3dfuel.com"),
  "3D-Fuel": clearbit("3dfuel.com"),
  "3D Fuel": clearbit("3dfuel.com"),
  "Eryone": clearbit("eryone.com"),
  "ERYONE": clearbit("eryone.com"),
  "Inland": clearbit("microcenter.com"),
  "INLAND": clearbit("microcenter.com"),
  "Fiberlogy": clearbit("fiberlogy.com"),
  "FIBERLOGY": clearbit("fiberlogy.com"),
  "Proto-Pasta": clearbit("proto-pasta.com"),
  "proto-pasta": clearbit("proto-pasta.com"),
  "GEEETECH": clearbit("geeetech.com"),
  "Geeetech": clearbit("geeetech.com"),
  "Jayo": clearbit("jayo.com"),
  "JAYO": clearbit("jayo.com"),
  "SainSmart": clearbit("sainsmart.com"),
  "Push Plastic": clearbit("pushplastic.com"),
  "Fusion Filaments": clearbit("fusionfilaments.com"),
  "Spectrum Filaments": clearbit("spectrumfilaments.com"),
  "Kingroon": clearbit("kingroon.com"),
  "KINGROON": clearbit("kingroon.com"),
  "Recreus": clearbit("recreus.com"),
  "IC3D": clearbit("ic3dprinters.com"),
  "IC3D Printers": clearbit("ic3dprinters.com"),
  "Numakers": clearbit("numakers.com"),
  "NUMAKERS": clearbit("numakers.com"),
  "Duramic 3D": clearbit("duramic3d.com"),
  "DURAMIC 3D": clearbit("duramic3d.com"),
  "Extrudr": clearbit("extrudr.com"),
  "Filaments.ca": clearbit("filaments.ca"),

  // Printer brands
  "AnkerMake": clearbit("ankermake.com"),
  "Anycubic": clearbit("anycubic.com"),
  "Creality": clearbit("creality.com"),
  "Elegoo": clearbit("elegoo.com"),
  "FlashForge": clearbit("flashforge.com"),
  "FLSUN": clearbit("flsun.com"),
  "LDO Motors": clearbit("ldomotors.com"),
  "Markforged": clearbit("markforged.com"),
  "QIDI Tech": clearbit("qidi3d.com"),
  "QIDI": clearbit("qidi3d.com"),
  "Raise3D": clearbit("raise3d.com"),
  "Snapmaker": clearbit("snapmaker.com"),
  "Sovol": clearbit("sovol3d.com"),
  "Voron Design": clearbit("vorondesign.com"),
  "TreeD Filaments": clearbit("treedfilaments.com"),
  "TreeD": clearbit("treedfilaments.com"),
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
