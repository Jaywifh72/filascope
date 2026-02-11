/** Canonical list of verified/lab-tested brands */
export const VERIFIED_BRANDS = [
  "Bambu Lab",
  "Prusament",
  "Polymaker",
  "ColorFabb",
  "Fillamentum",
  "eSUN",
  "Hatchbox",
  "Overture",
  "MatterHackers",
  "Amolen",
  "Anycubic",
];

/** Case-insensitive check if a vendor name is a verified brand */
export function isVerifiedBrand(vendor: string | null | undefined): boolean {
  if (!vendor) return false;
  const lower = vendor.toLowerCase();
  return VERIFIED_BRANDS.some(b => b.toLowerCase() === lower);
}
