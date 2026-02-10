// Brand logo mapping - maps vendor names to their logo URLs
// Uses apistemic Logo API (free, no API key) as Clearbit was sunset Dec 2025
// The BrandLogo component handles fallback if any URL fails

const logo = (domain: string) => `https://logos-api.apistemic.com/domain:${domain}`;

export const brandLogos: Record<string, string> = {
  // Filament brands
  "3D Solutech": logo("3dsolutech.com"),
  "Bambu Lab": logo("bambulab.com"),
  "Overture": logo("overture3d.com"),
  "Overture 3D": logo("overture3d.com"),
  "3DXTech": logo("3dxtech.com"),
  "Filamentum": logo("fillamentum.com"),
  "Fillamentum": logo("fillamentum.com"),
  "Amolen": logo("amolen.com"),
  "FormFutura": logo("formfutura.com"),
  "Taulman3D": logo("taulman3d.com"),
  "Ultimaker": logo("ultimaker.com"),
  "UltiMaker": logo("ultimaker.com"),
  "Siraya Tech": logo("sirayatech.com"),
  "NinjaTek": logo("ninjatek.com"),
  "eSun": logo("esun3d.net"),
  "ColorFabb": logo("colorfabb.com"),
  "Matter3D": logo("matter3d.com"),
  "Prusament": logo("prusa3d.com"),
  "Prusa Research": logo("prusa3d.com"),
  "SUNLU": logo("sunlu.com"),
  "Sunlu": logo("sunlu.com"),
  "HATCHBOX": logo("hatchbox3d.com"),
  "Hatchbox": logo("hatchbox3d.com"),
  "MatterHackers": logo("matterhackers.com"),
  "Printed Solid": logo("printedsolid.com"),
  "Atomic Filament": logo("atomicfilament.com"),
  "AzureFilm": logo("azurefilm.com"),
  "Azurefilm": logo("azurefilm.com"),
  "AZUREFILM": logo("azurefilm.com"),
  "Phaetus": logo("phaetus.com"),
  "Gizmo Dorks": logo("gizmodorks.com"),
  "GizmoDorks": logo("gizmodorks.com"),
  "Polymaker": logo("polymaker.com"),
  "3DFuel": logo("3dfuel.com"),
  "3D-Fuel": logo("3dfuel.com"),
  "3D Fuel": logo("3dfuel.com"),
  "Eryone": logo("eryone.com"),
  "ERYONE": logo("eryone.com"),
  "Inland": logo("microcenter.com"),
  "INLAND": logo("microcenter.com"),
  "Fiberlogy": logo("fiberlogy.com"),
  "FIBERLOGY": logo("fiberlogy.com"),
  "Proto-Pasta": logo("proto-pasta.com"),
  "proto-pasta": logo("proto-pasta.com"),
  "GEEETECH": logo("geeetech.com"),
  "Geeetech": logo("geeetech.com"),
  "Jayo": logo("jayo.com"),
  "JAYO": logo("jayo.com"),
  "SainSmart": logo("sainsmart.com"),
  "Push Plastic": logo("pushplastic.com"),
  "Fusion Filaments": logo("fusionfilaments.com"),
  "Spectrum Filaments": logo("spectrumfilaments.com"),
  "Kingroon": logo("kingroon.com"),
  "KINGROON": logo("kingroon.com"),
  "Recreus": logo("recreus.com"),
  "IC3D": logo("ic3dprinters.com"),
  "IC3D Printers": logo("ic3dprinters.com"),
  "Numakers": logo("numakers.com"),
  "NUMAKERS": logo("numakers.com"),
  "Duramic 3D": logo("duramic3d.com"),
  "DURAMIC 3D": logo("duramic3d.com"),
  "Extrudr": logo("extrudr.com"),
  "Filaments.ca": logo("filaments.ca"),

  // Printer brands
  "AnkerMake": logo("ankermake.com"),
  "Anycubic": logo("anycubic.com"),
  "Creality": logo("creality.com"),
  "Elegoo": logo("elegoo.com"),
  "FlashForge": logo("flashforge.com"),
  "FLSUN": logo("flsun.com"),
  "LDO Motors": logo("ldomotors.com"),
  "Markforged": logo("markforged.com"),
  "QIDI Tech": logo("qidi3d.com"),
  "QIDI": logo("qidi3d.com"),
  "Raise3D": logo("raise3d.com"),
  "Snapmaker": logo("snapmaker.com"),
  "Sovol": logo("sovol3d.com"),
  "Voron Design": logo("vorondesign.com"),
  "TreeD Filaments": logo("treedfilaments.com"),
  "TreeD": logo("treedfilaments.com"),
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
