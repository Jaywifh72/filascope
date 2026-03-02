// Brand logo mapping - maps vendor names to their official logo files
// Logos are stored locally in public/brands/ for reliability
// The BrandLogo component handles fallback if any image fails
// Case-insensitive lookup is handled by getBrandLogo() — no need for duplicate case entries

const STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/render/image/public/brand-logos`;
const logo = (filename: string) => `${STORAGE_BASE}/${filename}?width=384&resize=contain`;

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
  "Prusa": logo("prusament.png"),
  "Sunlu": logo("sunlu.png"),
  "Hatchbox": logo("hatchbox.png"),
  "MatterHackers": logo("matter3d.webp"),
  "Printed Solid": logo("protopasta.png"),
  "Atomic Filament": logo("atomic.jpg"),
  "AzureFilm": logo("azurefilm.png"),
  "Azurefilm": logo("azurefilm.png"),
  "Phaetus": logo("3dfuel.webp"),
  "Gizmo Dorks": logo("gizmodorks.webp"),
  "GizmoDorks": logo("gizmodorks.webp"),
  "Polymaker": logo("polymaker.png"),
  "3DFuel": logo("3dfuel.webp"),
  "3D-Fuel": logo("3dfuel.webp"),
  "3D Fuel": logo("3dfuel.webp"),
  "Eryone": logo("eryone.png"),
  "Inland": logo("hatchbox.png"),
  "Fiberlogy": logo("fiberlogy.webp"),
  "Proto-Pasta": logo("protopasta.png"),
  "proto-pasta": logo("protopasta.png"),
  "Geeetech": logo("geeetech.png"),
  "Jayo": logo("sunlu.png"),
  "SainSmart": logo("3dfuel.webp"),
  "Push Plastic": logo("pushplastic.png"),
  "Fusion Filaments": logo("fusionfilaments.webp"),
  "Spectrum Filaments": logo("spectrum.png"),
  "Kingroon": logo("kingroon.webp"),
  "Recreus": logo("recreus.png"),
  "IC3D": logo("ic3d.png"),
  "IC3D Printers": logo("ic3d.png"),
  "Numakers": logo("numakers.png"),
  "Duramic 3D": logo("duramic3d.webp"),
  "Extrudr": logo("extrudr.png"),
  "Filaments.ca": logo("filaments-ca.png"),
  "Ziro": logo("ziro.webp"),
  "Voxel PLA": logo("voxelpla.webp"),
  "VoxelPLA": logo("voxelpla.webp"),
  "3DHOJOR": "/brands/3dhojor.png?v=20260302",
  "Paramount 3D": "/brands/paramount3d.png?v=20260302",

  // Printer brands
  "AnkerMake": logo("ankermake.png"),
  "Anycubic": logo("anycubic.webp"),
  "Creality": logo("creality.png"),
  "Elegoo": logo("elegoo.webp"),
  "FlashForge": logo("flashforge.png"),
  "Flashforge": logo("flashforge.png"),
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

  // Brands without local logo files — will gracefully fallback to BrandLogo initial
  "Amazon Basics": "",
  "Artillery": "",
  "Yousu": "",
};

// Helper function to get brand logo with fallback
export const getBrandLogo = (vendor: string | null): string | null => {
  if (!vendor) return null;
  
  // Try exact match first
  if (vendor in brandLogos) {
    return brandLogos[vendor] || null;
  }
  
  // Try case-insensitive match
  const vendorLower = vendor.toLowerCase();
  const matchedKey = Object.keys(brandLogos).find(
    key => key.toLowerCase() === vendorLower
  );
  
  if (matchedKey) {
    return brandLogos[matchedKey] || null;
  }
  
  return null;
};

/**
 * Get brand logo URL with context-aware sizing.
 * Default width is 384 (for brand cards on /brands page).
 * Pass a smaller displayWidth for compact contexts (e.g., 60 for compare cards → requests 120px).
 */
export const getBrandLogoUrl = (vendor: string | null, displayWidth: number = 192): string | null => {
  if (!vendor) return null;

  const baseUrl = getBrandLogo(vendor);
  if (!baseUrl) return null;

  // Replace the default width=384 with the context-appropriate width (2x for retina)
  const targetWidth = Math.ceil(displayWidth * 2);
  return baseUrl.replace(/width=\d+/, `width=${targetWidth}`);
};
