/**
 * ERYONE-SPECIFIC DEFAULTS
 * 
 * Brand-specific configuration for Eryone 3D filament products.
 * Handles material normalization, finish detection, print settings, and color mapping.
 * CSV-seeded architecture for high-fidelity sync.
 */

// ============================================================================
// CSV PRODUCT SEED (356 variants from manufacturer catalog)
// ============================================================================

export interface EryoneProductSeed {
  material: string;
  filamentLine: string;
  color: string;
  colorHex: string;
  productUrl: string;
  imageUrl: string;
}

export const ERYONE_PRODUCT_SEED: EryoneProductSeed[] = [
  // PLA Standard (26 variants)
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/1-75mm-pla-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=39267870375985', imageUrl: 'https://eryone3d.com/cdn/shop/files/Bundle-pla-Filament-13.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Ivory White', colorHex: '#FFFFF0', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=42363910357226', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-12.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=39267870441521', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-21.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Carbon fibre - black', colorHex: '#2F2F2F', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=43879435698410', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Carbon-Fiber-Filament-1kg-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=39267870408753', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-22.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=39267870539825', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-16.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'White Jade', colorHex: '#F0FFF0', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=43983465873642', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-9.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Mango Yellow', colorHex: '#FF8243', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=39267870507057', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Rose Red', colorHex: '#C21E56', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=43983465971946', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Apple Green', colorHex: '#8DB600', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=43983466004714', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Milky White', colorHex: '#FEFCFF', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=43983465939178', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-8.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Lavender Purple', colorHex: '#967BB6', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=44160009404650', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Green', colorHex: '#008000', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=39267870474289', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-15.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=39267870572593', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Silver', colorHex: '#C0C0C0', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=39267870605361', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-17.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=39267870638129', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-20.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Cool White', colorHex: '#F5F5F5', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=42363910291690', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-13.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Agate Gray', colorHex: '#B5B5B5', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=42363910422762', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-19.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Signal Gray', colorHex: '#969696', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=42363910488298', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-18.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Carbon Black', colorHex: '#1C1C1C', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=42363910521066', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-23.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Jet Black', colorHex: '#0A0A0A', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=42363910586602', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-24.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Glossy black', colorHex: '#0D0D0D', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=43879314030826', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-25.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Pearl white', colorHex: '#F0EAD6', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=43879314063594', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-11.jpg' },
  { material: 'PLA', filamentLine: 'PLA Filament', color: 'Dark purple', colorHex: '#301934', productUrl: 'https://eryone3d.com/en-ca/products/1-75mm-pla-filament?variant=43879314096362', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1kg-14.jpg' },
  
  // PLA+ Standard (14 variants)
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/pla', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-2.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Army green', colorHex: '#008000', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=51993038324078', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-14.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=39267868213297', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-24.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=39267868180529', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-1.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=39267868278833', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-25.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=39267868246065', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-26.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Green', colorHex: '#008000', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=39267868311601', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Filament-1.75mm-0.03mm-1kg-1.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Cool white', colorHex: '#F5F5F5', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=44051414810858', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-15.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Ivory white', colorHex: '#FFFFF0', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=44289573880042', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-23.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Olive green', colorHex: '#6B8E23', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=44289573912810', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-14.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Skin', colorHex: '#E8BEAC', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=51993038258542', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-11.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=51993038291310', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-10.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ Filament', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://eryone3d.com/en-ca/products/pla?variant=51993042878830', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-plus-Filament-5.jpg' },

  // PLA Galaxy (9 variants)
  { material: 'PLA', filamentLine: 'PLA Galaxy Sparkly Glitter Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/pla-galaxy-sparkly-glitter-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/galaxy-filaments-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Galaxy Sparkly Glitter Filament', color: 'Omega Nebula (Green Gold)', colorHex: '#008000', productUrl: 'https://eryone3d.com/en-ca/products/pla-galaxy-sparkly-glitter-filament?variant=51683917529454', imageUrl: 'https://eryone3d.com/cdn/shop/files/galaxy-filaments-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA Galaxy Sparkly Glitter Filament', color: 'Bipolar Nebula (dark green)', colorHex: '#008000', productUrl: 'https://eryone3d.com/en-ca/products/pla-galaxy-sparkly-glitter-filament?variant=51683917463918', imageUrl: 'https://eryone3d.com/cdn/shop/files/galaxy-filaments-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Galaxy Sparkly Glitter Filament', color: 'Sirius Nebula (dark blue)', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/en-ca/products/pla-galaxy-sparkly-glitter-filament?variant=51683917496686', imageUrl: 'https://eryone3d.com/cdn/shop/files/galaxy-filaments-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Galaxy Sparkly Glitter Filament', color: 'Owl Nebula (Dark Purple)', colorHex: '#800080', productUrl: 'https://eryone3d.com/en-ca/products/pla-galaxy-sparkly-glitter-filament?variant=51683917562222', imageUrl: 'https://eryone3d.com/cdn/shop/files/galaxy-filaments-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA Galaxy Sparkly Glitter Filament', color: 'Silver', colorHex: '#C0C0C0', productUrl: 'https://eryone3d.com/en-ca/products/pla-galaxy-sparkly-glitter-filament?variant=42157650837738', imageUrl: 'https://eryone3d.com/cdn/shop/files/galaxy-filaments-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Galaxy Sparkly Glitter Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/en-ca/products/pla-galaxy-sparkly-glitter-filament?variant=42157637206250', imageUrl: 'https://eryone3d.com/cdn/shop/files/Bundle-pla-Galaxy-Filament-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Galaxy Sparkly Glitter Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/en-ca/products/pla-galaxy-sparkly-glitter-filament?variant=42157650444522', imageUrl: 'https://eryone3d.com/cdn/shop/files/galaxy-filaments-9.jpg' },
  { material: 'PLA', filamentLine: 'PLA Galaxy Sparkly Glitter Filament', color: 'Purple', colorHex: '#800080', productUrl: 'https://eryone3d.com/en-ca/products/pla-galaxy-sparkly-glitter-filament?variant=42157628031210', imageUrl: 'https://eryone3d.com/cdn/shop/files/galaxy-filaments-6.jpg' },

  // PLA Specialty single-variant products
  { material: 'PLA', filamentLine: 'PLA Luminous Filament', color: 'Glow Green', colorHex: '#39FF14', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/glow-in-the-dark-pla', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-800_1379bf62-5daf-4061-8bda-ab67b2aba12f.jpg' },
  { material: 'PLA', filamentLine: 'PLA Carbon Fiber Filament', color: 'Black', colorHex: '#1C1C1C', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/pla-carbon-fiber-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Carbon-Fiber-Filament-1kg-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Marble Filament', color: 'White Marble', colorHex: '#F5F5F5', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/marble-pla', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Marble-Filament-1kg-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Light Weight Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/pla-light-weight-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA_Light_Weight_Filament-1.jpg' },

  // PLA Wood (6 variants)
  { material: 'PLA-Wood', filamentLine: 'PLA Wood Filament', color: 'Deep', colorHex: '#8B4513', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/wood-pla', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Wood-Filament-1kg-2.jpg' },
  { material: 'PLA-Wood', filamentLine: 'PLA Wood Filament', color: 'Light', colorHex: '#D3D3D3', productUrl: 'https://eryone3d.com/en-ca/products/wood-pla?variant=39267875258417', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Wood-Filament-1kg-7.jpg' },
  { material: 'PLA-Wood', filamentLine: 'PLA Wood Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/en-ca/products/wood-pla?variant=51609773015406', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Wood-Filament-1kg-3.jpg' },
  { material: 'PLA-Wood', filamentLine: 'PLA Wood Filament', color: 'Pine wood', colorHex: '#DEB887', productUrl: 'https://eryone3d.com/en-ca/products/wood-pla?variant=51609773048174', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Wood-Filament-1kg-1.jpg' },
  { material: 'PLA-Wood', filamentLine: 'PLA Wood Filament', color: 'Clay', colorHex: '#D2691E', productUrl: 'https://eryone3d.com/en-ca/products/wood-pla?variant=51609773080942', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Wood-Filament-1kg-5.jpg' },
  { material: 'PLA-Wood', filamentLine: 'PLA Wood Filament', color: 'Charcoal ash', colorHex: '#36454F', productUrl: 'https://eryone3d.com/en-ca/products/wood-pla?variant=51609773113710', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Wood-Filament-1kg-4.jpg' },

  // PLA+ High-Speed (18 variants)
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/pla-plus-high-speed-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg-2.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Magenta', colorHex: '#FF00FF', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153807726', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg-3.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Azure Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153840494', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg-12.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153611118', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg-1.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153480046', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg-5.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Purple', colorHex: '#800080', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153512814', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg-4.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153578350', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg--6.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153643886', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg--7.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Green', colorHex: '#008000', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153676654', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg--10.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153709422', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg--9.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Ivory', colorHex: '#FFFFF0', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153742190', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg--11.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153774958', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg--8.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Brown', colorHex: '#8B4513', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887153873262', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg--14.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Mint Green', colorHex: '#98FF98', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=52333616595310', imageUrl: 'https://eryone3d.com/cdn/shop/files/2_8aa6982a-dec5-47e2-98ca-7a4faf10116c.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Dark Brown', colorHex: '#5C4033', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=52333616628078', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-1600.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Violet', colorHex: '#EE82EE', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=52349665542510', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-1600_109d633a-edd9-4000-99a9-3959382613b2.jpg' },
  { material: 'PLA+', filamentLine: 'PLA+ High-Speed Filament', color: 'Rainbow Stone', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/en-ca/products/pla-plus-high-speed-filament?variant=51887156199790', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Plus-High-Speed-Filament-1kg-13.jpg' },

  // PLA High-Speed (6 variants)
  { material: 'PLA', filamentLine: 'PLA High-Speed Filament', color: 'Skin Color', colorHex: '#E8BEAC', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/pla-high-speed-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-High-Speed-Filament-1kg-skin.jpg' },
  { material: 'PLA', filamentLine: 'PLA High-Speed Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/en-ca/products/pla-high-speed-filament?variant=51784150057326', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-High-Speed-Filament-1kg-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA High-Speed Filament', color: 'Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/en-ca/products/pla-high-speed-filament?variant=51784150090094', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-High-Speed-Filament-1kg-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA High-Speed Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/en-ca/products/pla-high-speed-filament?variant=51784150122862', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-High-Speed-Filament-1kg-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA High-Speed Filament', color: 'Signal Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/en-ca/products/pla-high-speed-filament?variant=51784150155630', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-High-Speed-Filament-1kg-Signal_Gray.jpg' },
  { material: 'PLA', filamentLine: 'PLA High-Speed Filament', color: 'Agate Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/en-ca/products/pla-high-speed-filament?variant=51784150188398', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-High-Speed-Filament-1kg-1.jpg' },

  // PLA Metallic (4 variants)
  { material: 'PLA-Metal', filamentLine: 'PLA Metallic Filament', color: 'Copper', colorHex: '#B87333', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/pla-metallic-filament', imageUrl: 'https://eryone3d.com/cdn/shop/products/PLA-Metallic-Filament-1kg-2.jpg' },
  { material: 'PLA-Metal', filamentLine: 'PLA Metallic Filament', color: 'Iron', colorHex: '#48494B', productUrl: 'https://eryone3d.com/en-ca/products/pla-metallic-filament?variant=39541714550833', imageUrl: 'https://eryone3d.com/cdn/shop/products/PLA-Metallic-Filament-1kg-1.jpg' },
  { material: 'PLA-Metal', filamentLine: 'PLA Metallic Filament', color: 'Stainless Steel', colorHex: '#C0C0C0', productUrl: 'https://eryone3d.com/en-ca/products/pla-metallic-filament?variant=39541714583601', imageUrl: 'https://eryone3d.com/cdn/shop/products/PLA-Metallic-Filament-1kg-3.jpg' },
  { material: 'PLA-Metal', filamentLine: 'PLA Metallic Filament', color: 'Wolfram', colorHex: '#5A5A5A', productUrl: 'https://eryone3d.com/en-ca/products/pla-metallic-filament?variant=39541714616369', imageUrl: 'https://eryone3d.com/cdn/shop/products/PLA-Metallic-Filament-1kg-4.jpg' },

  // PLA Rainbow (3 single-color products)
  { material: 'PLA', filamentLine: 'PLA Lagoon Rainbow Filament', color: 'Rainbow', colorHex: '#00CED1', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/pla-lagoon-rainbow', imageUrl: 'https://eryone3d.com/cdn/shop/files/Lagoon-Rainbow-Filament-PLA-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Classical Rainbow Filament', color: 'Rainbow', colorHex: '#FF6347', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/pla-classical-rainbow', imageUrl: 'https://eryone3d.com/cdn/shop/files/Classical-Rainbow-Filament-PLA-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Steampunk Rainbow Filament', color: 'Rainbow', colorHex: '#CC5500', productUrl: 'https://eryone3d.com/en-ca/collections/pla-special/products/steampunk-rainbow', imageUrl: 'https://eryone3d.com/cdn/shop/files/Steampunk-Rainbow-Filament-PLA-1.jpg' },

  // PLA Silk (multi-color and single)
  { material: 'PLA', filamentLine: 'PLA Silk Triple-Color Filament', color: 'Triple Color', colorHex: '#FFD700', productUrl: 'https://eryone3d.com/collections/pla-silk-all/products/pla-silk-triple-color-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA_Silk_Triple-Color_Filament_-_1.75mm-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Rainbow Filament', color: 'Rainbow', colorHex: '#FFB6C1', productUrl: 'https://eryone3d.com/collections/pla-silk-all/products/macaron-rainbow-pla-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/silk-Rainbow-Filament-PLA-3.jpg' },

  // PLA Silk Dual-Color (27 variants)
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Black & Purple', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/pla-silk-all/products/silk-dual-color-pla', imageUrl: 'https://eryone3d.com/cdn/shop/products/PLA-Silk-Dual-Color-Filament-9.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Black & Red', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43912068399338', imageUrl: 'https://eryone3d.com/cdn/shop/products/PLA-Silk-Dual-Color-Filament-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Blue & Purple', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=44201716875498', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-2-Color-Filament-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Blue Green & Orange', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=44201716809962', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-13.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Red & Blue', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43100507701482', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-6.png' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Blue & Green', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43100485517546', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-2-Color-Filament-6.png' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Midnight Blue & Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=52196411638126', imageUrl: 'https://eryone3d.com/cdn/shop/files/7829c60bb0ab67a17fd25b0179f6005b.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Midnight Blue & Silver', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=52196411670894', imageUrl: 'https://eryone3d.com/cdn/shop/files/e6dab045ef4a307322ce76a737affbf7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Black & Dark Gold', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43912068432106', imageUrl: 'https://eryone3d.com/cdn/shop/products/PLA-Silk-Dual-Color-Filament-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Orange & Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=51992770249070', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-2-Color-Filament-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Red & Green', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43100485648618', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Red & Gold', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43100507767018', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-22.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Gold & Silver', colorHex: '#C0C0C0', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43100485583082', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-25.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Purple & Orange', colorHex: '#FFA500', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=44201716908266', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-12.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Purple & Green', colorHex: '#008000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=44201716941034', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-15.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Gold & Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=44201716842730', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-11.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Rose Red & Light Blue', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43912068333802', imageUrl: 'https://eryone3d.com/cdn/shop/products/PLA-Silk-2-Color-Filament-9.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Black & Rose', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43912068366570', imageUrl: 'https://eryone3d.com/cdn/shop/products/PLA-Silk-Dual-Color-Filament-14.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Black & Dark Green', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43879344799978', imageUrl: 'https://eryone3d.com/cdn/shop/products/PLA-Silk-Dual-Color-Filament-8.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Yellow & Green', colorHex: '#008000', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43100485484778', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-24.png' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Gold & Purple', colorHex: '#800080', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43100485550314', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-25.png' },
  { material: 'PLA', filamentLine: 'PLA Silk Dual-Color Filament', color: 'Gold & Copper', colorHex: '#FFD700', productUrl: 'https://eryone3d.com/products/silk-dual-color-pla?variant=43100485615850', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Dual-Color-Filament-23.png' },

  // PLA Ultra Silk (7 variants)
  { material: 'PLA', filamentLine: 'PLA Ultra Silk Filament', color: 'Gold', colorHex: '#FFD700', productUrl: 'https://eryone3d.com/collections/pla-silk-all/products/advanced-silk-pla', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Ultra-Silk-Filament-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Ultra Silk Filament', color: 'Copper', colorHex: '#B87333', productUrl: 'https://eryone3d.com/products/advanced-silk-pla?variant=39267873390641', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Ultra-Silk-Filament-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Ultra Silk Filament', color: 'Silver', colorHex: '#C0C0C0', productUrl: 'https://eryone3d.com/products/advanced-silk-pla?variant=39267873357873', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Ultra-Silk-Filament-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA Ultra Silk Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/advanced-silk-pla?variant=39267873456177', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Ultra-Silk-Filament-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Ultra Silk Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/advanced-silk-pla?variant=39267873521713', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Ultra-Silk-Filament-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA Ultra Silk Filament', color: 'Bronze', colorHex: '#CD7F32', productUrl: 'https://eryone3d.com/products/advanced-silk-pla?variant=39267873423409', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Ultra-Silk-Filament-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Ultra Silk Filament', color: 'Dark Gold', colorHex: '#FFD700', productUrl: 'https://eryone3d.com/products/advanced-silk-pla?variant=39267873488945', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Ultra-Silk-Filament-6.jpg' },

  // PLA Silk Standard (11 variants)
  { material: 'PLA', filamentLine: 'PLA Silk Filament', color: 'Radiant Gold', colorHex: '#FFD700', productUrl: 'https://eryone3d.com/collections/pla-silk-all/products/silk-pla', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-800_e1ee7852-8eef-45dc-9f4c-3bc53723fe95.png' },
  { material: 'PLA', filamentLine: 'PLA Silk Filament', color: 'Metallic Ceramic Red', colorHex: '#8B0000', productUrl: 'https://eryone3d.com/products/silk-pla?variant=53109445591406', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-1-800.png' },
  { material: 'PLA', filamentLine: 'PLA Silk Filament', color: 'Gold', colorHex: '#FFD700', productUrl: 'https://eryone3d.com/products/silk-pla?variant=43308783730922', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Filament-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Filament', color: 'Green', colorHex: '#008000', productUrl: 'https://eryone3d.com/products/silk-pla?variant=52333416808814', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-800.png' },
  { material: 'PLA', filamentLine: 'PLA Silk Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/silk-pla?variant=39267874537521', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Filament-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Filament', color: 'Pink', colorHex: '#FFC0CB', productUrl: 'https://eryone3d.com/products/silk-pla?variant=39267874603057', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Filament-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Filament', color: 'Dark Green', colorHex: '#006400', productUrl: 'https://eryone3d.com/products/silk-pla?variant=39267874570289', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Filament-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/silk-pla?variant=39267874439217', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Filament-6.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Filament', color: 'Silver', colorHex: '#C0C0C0', productUrl: 'https://eryone3d.com/products/silk-pla?variant=39267874471985', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Filament-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk Filament', color: 'Copper', colorHex: '#B87333', productUrl: 'https://eryone3d.com/products/silk-pla?variant=39267874504753', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-Filament-3.jpg' },

  // PLA Silk High-Speed variants
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Quadruple Filament', color: 'Quadruple Color', colorHex: '#FFD700', productUrl: 'https://eryone3d.com/collections/pla-silk-all/products/high-speed-four-colors-silk-pla', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Quadruple-Filament-1kg-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Triple-Color Filament', color: 'Triple Color', colorHex: '#FFD700', productUrl: 'https://eryone3d.com/collections/pla-silk-all/products/pla-silk-high-speed-triple-color', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Triple-Color-Filament-1kg-3.jpg' },

  // PLA Silk High-Speed Dual-Color (10 variants)
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Dual-Color Filament', color: 'Orange & Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/collections/pla-silk-all/products/high-speed-silk-dual-color-pla', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Dual-Color-Filament-1kg-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Dual-Color Filament', color: 'Gold & Purple', colorHex: '#800080', productUrl: 'https://eryone3d.com/products/high-speed-silk-dual-color-pla?variant=51783994376558', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Dual-Color-Filament-1kg-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Dual-Color Filament', color: 'Blue & Green', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/high-speed-silk-dual-color-pla?variant=51783994409326', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Dual-Color-Filament-1kg-9.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Dual-Color Filament', color: 'Blue & Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/high-speed-silk-dual-color-pla?variant=51783994442094', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Dual-Color-Filament-1kg-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Dual-Color Filament', color: 'Red & Green', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/high-speed-silk-dual-color-pla?variant=51783994474862', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Dual-Color-Filament-1kg-6.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Dual-Color Filament', color: 'Black & Red', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/high-speed-silk-dual-color-pla?variant=51783996997998', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Dual-Color-Filament-1kg-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Dual-Color Filament', color: 'Green & Yellow', colorHex: '#008000', productUrl: 'https://eryone3d.com/products/high-speed-silk-dual-color-pla?variant=51783997030766', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Dual-Color-Filament-1kg-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Dual-Color Filament', color: 'Purple & Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/high-speed-silk-dual-color-pla?variant=51783997063534', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Dual-Color-Filament-1kg-8.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Dual-Color Filament', color: 'Dark Green & Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/high-speed-silk-dual-color-pla?variant=51783997096302', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Dual-Color-Filament-1kg-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA Silk High-Speed Dual-Color Filament', color: 'Midnight Blue & Silver', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/high-speed-silk-dual-color-pla?variant=51783997129070', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Silk-High-Speed-Dual-Color-Filament-1kg-10.jpg' },

  // PLA Matte (20 variants)
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Rainbow Macarons', colorHex: '#FFB6C1', productUrl: 'https://eryone3d.com/collections/matte-pla/products/matte-pla', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Rainbow Watercolor', colorHex: '#87CEEB', productUrl: 'https://eryone3d.com/products/matte-pla?variant=44285046161642', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Olive Green', colorHex: '#6B8E23', productUrl: 'https://eryone3d.com/products/matte-pla?variant=39267867230257', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Ruby red', colorHex: '#9B111E', productUrl: 'https://eryone3d.com/products/matte-pla?variant=44197274910954', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Black forest green', colorHex: '#1C352D', productUrl: 'https://eryone3d.com/products/matte-pla?variant=44197274878186', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Pottery Red', colorHex: '#A52A2A', productUrl: 'https://eryone3d.com/products/matte-pla?variant=44090041368810', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-14.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://eryone3d.com/products/matte-pla?variant=44090041401578', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-22.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Mint green', colorHex: '#98FF98', productUrl: 'https://eryone3d.com/products/matte-pla?variant=44090041434346', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-16.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Pink', colorHex: '#FFC0CB', productUrl: 'https://eryone3d.com/products/matte-pla?variant=44090041467114', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-17.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/matte-pla?variant=44090041499882', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-20.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Navy Blue', colorHex: '#000080', productUrl: 'https://eryone3d.com/products/matte-pla?variant=39267867263025', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-18.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Aqua Blue', colorHex: '#00CED1', productUrl: 'https://eryone3d.com/products/matte-pla?variant=39438416707633', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-21.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/matte-pla?variant=39267867295793', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-19.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/products/matte-pla?variant=39267867361329', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-23.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/matte-pla?variant=39267867328561', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-15.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Blue Lilac', colorHex: '#7B68EE', productUrl: 'https://eryone3d.com/products/matte-pla?variant=39438407565361', imageUrl: 'https://eryone3d.com/cdn/shop/files/matte-pla-filament-24.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Skin', colorHex: '#E8BEAC', productUrl: 'https://eryone3d.com/products/matte-pla?variant=43999547130090', imageUrl: 'https://eryone3d.com/cdn/shop/products/matte-pla-filament-12.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Red Wax', colorHex: '#8B0000', productUrl: 'https://eryone3d.com/products/matte-pla?variant=43999547162858', imageUrl: 'https://eryone3d.com/cdn/shop/products/matte-pla-filament-11.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Filament', color: 'Army Green', colorHex: '#4B5320', productUrl: 'https://eryone3d.com/products/matte-pla?variant=43999547195626', imageUrl: 'https://eryone3d.com/cdn/shop/products/matte-pla-filament-13.jpg' },

  // PLA Matte Gradient Dual-Color (18 variants)
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Blue Green & Purple', colorHex: '#00CED1', productUrl: 'https://eryone3d.com/collections/matte-pla/products/pla-matte-dual-color-filament-1kg', imageUrl: 'https://eryone3d.com/cdn/shop/files/3d-filament-pla-10.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Pink & Green & Blue', colorHex: '#FFC0CB', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=51609775309166', imageUrl: 'https://eryone3d.com/cdn/shop/files/3d-filament-pla-12.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Pink & Yellow Green', colorHex: '#FFC0CB', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=51609775243630', imageUrl: 'https://eryone3d.com/cdn/shop/files/3d-filament-pla-8.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Yellow & Green', colorHex: '#FFFF00', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=51609775145326', imageUrl: 'https://eryone3d.com/cdn/shop/files/3d-filament-pla-11.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Red & Yellow', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=51609775210862', imageUrl: 'https://eryone3d.com/cdn/shop/files/3d-filament-pla-9.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Yellow & Purple', colorHex: '#FFFF00', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=51609775276398', imageUrl: 'https://eryone3d.com/cdn/shop/files/3d-filament-pla-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Blue & White', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=44135404994794', imageUrl: 'https://eryone3d.com/cdn/shop/files/1KG_PLA_8a35356a-0638-4928-b966-c6e9a96edbcb.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Rose Pink & Sage Green', colorHex: '#FF69B4', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=44135405027562', imageUrl: 'https://eryone3d.com/cdn/shop/files/1KG_PLA_b9b5ba34-4122-4a90-8983-3cf244e180c6.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Blue Green & Burnt Orange', colorHex: '#00CED1', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=44135405060330', imageUrl: 'https://eryone3d.com/cdn/shop/files/1KG_PLA.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Pink & Matte White', colorHex: '#FFC0CB', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=44135405093098', imageUrl: 'https://eryone3d.com/cdn/shop/files/1KG_PLA_439217dd-f571-4def-a508-d66a2375eab1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Dusty Blue & Mustard Yellow', colorHex: '#5F9EA0', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=44135405125866', imageUrl: 'https://eryone3d.com/cdn/shop/files/1KG_PLA_9c1048a9-ff17-4bd5-9506-b10cb336492c.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Pink & Blue', colorHex: '#FFC0CB', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=43056310878442', imageUrl: 'https://eryone3d.com/cdn/shop/files/best-matte-pla-filament-13.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Navy Blue & Olive Green', colorHex: '#000080', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=43056310976746', imageUrl: 'https://eryone3d.com/cdn/shop/files/best-matte-pla-filament-12.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Yellow & Purple', colorHex: '#FFFF00', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=43056311075050', imageUrl: 'https://eryone3d.com/cdn/shop/files/best-matte-pla-filament-10.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Blue & Yellow', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=43056311173354', imageUrl: 'https://eryone3d.com/cdn/shop/files/best-matte-pla-filament-9.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Blue & Purple', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=43056311271658', imageUrl: 'https://eryone3d.com/cdn/shop/files/best-matte-pla-filament-8.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Purple & Green', colorHex: '#800080', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=43056311369962', imageUrl: 'https://eryone3d.com/cdn/shop/files/best-matte-pla-filament-11.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Red Violet & Green', colorHex: '#C71585', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=43912075903210', imageUrl: 'https://eryone3d.com/cdn/shop/files/best-matte-pla-filament-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte Gradient Dual-Color Filament', color: 'Black & White', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/pla-matte-dual-color-filament-1kg?variant=43912075935978', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA_Matte_Gradient_Dual-Color_Filament.jpg' },

  // PLA Matte High-Speed (15+ variants)
  { material: 'PLA', filamentLine: 'PLA Matte High Speed Filament', color: 'Off white', colorHex: '#FAF9F6', productUrl: 'https://eryone3d.com/collections/matte-pla/products/high-speed-matte-pla-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-800_4d603292-bd5e-4b1b-a63f-e7ee7765e193.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte High Speed Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/high-speed-matte-pla-filament?variant=51887190376814', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Matte-High-Speed-Filament-1kg-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte High Speed Filament', color: 'Ice Blue', colorHex: '#00BFFF', productUrl: 'https://eryone3d.com/products/high-speed-matte-pla-filament?variant=52333521109358', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-800_cddae0c0-f7ff-4453-b96c-0e885297bfbd.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte High Speed Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/high-speed-matte-pla-filament?variant=51887190409582', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Matte-High-Speed-Filament-1kg-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte High Speed Filament', color: 'Light gray', colorHex: '#D3D3D3', productUrl: 'https://eryone3d.com/products/high-speed-matte-pla-filament?variant=51887190442350', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Matte-High-Speed-Filament-1kg-6.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte High Speed Filament', color: 'Navy blue', colorHex: '#000080', productUrl: 'https://eryone3d.com/products/high-speed-matte-pla-filament?variant=51887190475118', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Matte-High-Speed-Filament-1kg-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA Matte High Speed Filament', color: 'Olive green', colorHex: '#6B8E23', productUrl: 'https://eryone3d.com/products/high-speed-matte-pla-filament?variant=51887190507886', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Matte-High-Speed-Filament-1kg-7.jpg' },

  // PLA Burnt Titanium (12 variants)
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Nebula', colorHex: '#2F1B41', productUrl: 'https://eryone3d.com/collections/pla-burnt-titanium/products/pla-burnt-titanium-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Constellation', colorHex: '#2D1B30', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=51784046739822', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Fantasy Glaze', colorHex: '#C21E56', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=52008250016110', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Interstellar', colorHex: '#191970', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=51784046772590', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-13.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Wormhole', colorHex: '#013220', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=51784046805358', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-11.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Galaxy', colorHex: '#483D8B', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=51784046838126', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-9.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Green', colorHex: '#008000', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=51784022065518', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Dark Gold', colorHex: '#FFD700', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=51784025997678', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-10.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=51784026030446', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-8.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Blue Purple', colorHex: '#8A2BE2', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=51784026063214', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=51784026095982', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Filament', color: 'Technology Blue', colorHex: '#4169E1', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-filament?variant=51784026128750', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Filament-1kg-6.jpg' },

  // PLA Burnt Titanium Triple Color (7 variants)
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Triple Color Filament', color: 'Black & Rose Red & Purple Blue', colorHex: '#2F1B41', productUrl: 'https://eryone3d.com/collections/pla-burnt-titanium/products/pla-burnt-titanium-triple-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Triple-Color-Filament-1kg-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Triple Color Filament', color: 'Green & Rose Red & Purple Blue', colorHex: '#483D8B', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-triple-filament?variant=52008264335726', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Triple-Color-Filament-1kg-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Triple Color Filament', color: 'Purple Blue & Gold & Green', colorHex: '#9370DB', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-triple-filament?variant=52008264368494', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Triple-Color-Filament-1kg-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Triple Color Filament', color: 'Blue & Gold & Green', colorHex: '#4169E1', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-triple-filament?variant=52008264401262', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Triple-Color-Filament-1kg-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Triple Color Filament', color: 'Black & Green & Rose Red', colorHex: '#2D1B30', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-triple-filament?variant=52008264434030', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Triple-Color-Filament-1kg-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Triple Color Filament', color: 'Blue & Green & Rose Red', colorHex: '#6A5ACD', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-triple-filament?variant=52008264466798', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Triple-Color-Filament-1kg-6.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Triple Color Filament', color: 'Blue & Black & Rose Red', colorHex: '#1E3A5F', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-triple-filament?variant=52008264499566', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Triple-Color-Filament-1kg-7.jpg' },

  // PLA Burnt Titanium Dual-Color (8 variants)
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Dual-Color Filament', color: 'Green & Blue', colorHex: '#00CED1', productUrl: 'https://eryone3d.com/collections/pla-burnt-titanium/products/pla-burnt-titanium-dual-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Dual-Color-Filament-1kg-1.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Dual-Color Filament', color: 'Green & Rose Red', colorHex: '#C21E56', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-dual-filament?variant=52008261288302', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Dual-Color-Filament-1kg-2.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Dual-Color Filament', color: 'Green & Purple Blue', colorHex: '#9370DB', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-dual-filament?variant=52008261321070', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Dual-Color-Filament-1kg-3.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Dual-Color Filament', color: 'Blue & Rose Red', colorHex: '#8A2BE2', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-dual-filament?variant=52008261353838', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Dual-Color-Filament-1kg-4.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Dual-Color Filament', color: 'Green & Gold', colorHex: '#008000', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-dual-filament?variant=52008261386606', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Dual-Color-Filament-1kg-5.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Dual-Color Filament', color: 'Black & Blue', colorHex: '#000080', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-dual-filament?variant=52008261419374', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Dual-Color-Filament-1kg-6.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Dual-Color Filament', color: 'Black & Rose Red', colorHex: '#2D1B30', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-dual-filament?variant=52008261452142', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Dual-Color-Filament-1kg-7.jpg' },
  { material: 'PLA', filamentLine: 'PLA Burnt Titanium Dual-Color Filament', color: 'Black & Purple Blue', colorHex: '#191970', productUrl: 'https://eryone3d.com/products/pla-burnt-titanium-dual-filament?variant=52008261484910', imageUrl: 'https://eryone3d.com/cdn/shop/files/PLA-Burnt-Titanium-Dual-Color-Filament-1kg-8.jpg' },

  // ABS (3 variants)
  { material: 'ABS', filamentLine: 'ABS Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/abs/products/abs-filament', imageUrl: 'https://eryone3d.com/cdn/shop/products/ERYONE_ABS_3D_Printer_Filament_1.75mm.jpg' },
  { material: 'ABS', filamentLine: 'ABS Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/abs-filament?variant=42679202644202', imageUrl: 'https://eryone3d.com/cdn/shop/products/ERYONE_ABS_3D_Printer_Filament_1.75mm-1.jpg' },
  { material: 'ABS-CF', filamentLine: 'ABS Filament', color: 'CF Black', colorHex: '#1C1C1C', productUrl: 'https://eryone3d.com/products/abs-filament?variant=51609764266350', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-carbon-fiber-Filament-1kg.jpg' },

  // ABS+ (6 variants)
  { material: 'ABS+', filamentLine: 'ABS+ Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/abs/products/abs-plus-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-plus-Filament-1kg-1.jpg' },
  { material: 'ABS+', filamentLine: 'ABS+ Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/abs-plus-filament?variant=44132995236074', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-plus-Filament-1kg-2.jpg' },
  { material: 'ABS+', filamentLine: 'ABS+ Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/abs-plus-filament?variant=44132995268842', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS_Filament-1.75mm-1kg.jpg' },
  { material: 'ABS+', filamentLine: 'ABS+ Filament', color: 'Grey', colorHex: '#808080', productUrl: 'https://eryone3d.com/products/abs-plus-filament?variant=44132995301610', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-plus-Filament-1kg-4.jpg' },
  { material: 'ABS+', filamentLine: 'ABS+ Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/abs-plus-filament?variant=44132995334378', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-plus-Filament-1kg-5.jpg' },
  { material: 'ABS+', filamentLine: 'ABS+ Filament', color: 'Green', colorHex: '#008000', productUrl: 'https://eryone3d.com/products/abs-plus-filament?variant=44132995367146', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-plus-Filament-1kg-6.jpg' },

  // ABS High-Speed (6 variants)
  { material: 'ABS', filamentLine: 'ABS High-Speed Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/abs/products/abs-high-speed-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-High-Speed-Filament-1kg-1.jpg' },
  { material: 'ABS', filamentLine: 'ABS High-Speed Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/abs-high-speed-filament?variant=51887166718318', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-High-Speed-Filament-1kg-3.jpg' },
  { material: 'ABS', filamentLine: 'ABS High-Speed Filament', color: 'Green', colorHex: '#008000', productUrl: 'https://eryone3d.com/products/abs-high-speed-filament?variant=51887166751086', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-High-Speed-Filament-1kg-5.jpg' },
  { material: 'ABS', filamentLine: 'ABS High-Speed Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/abs-high-speed-filament?variant=51887166783854', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-High-Speed-Filament-1kg--6.jpg' },
  { material: 'ABS', filamentLine: 'ABS High-Speed Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/abs-high-speed-filament?variant=51887166816622', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-High-Speed-Filament-1kg-4.jpg' },
  { material: 'ABS', filamentLine: 'ABS High-Speed Filament', color: 'Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/products/abs-high-speed-filament?variant=51887166849390', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-High-Speed-Filament-1kg-2.jpg' },

  // ABS Fiberglass (2 variants)
  { material: 'ABS-GF', filamentLine: 'ABS Fiberglass Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/abs/products/abs-fiberglass-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-Fiberglass-Filament-1kg-1.jpg' },
  { material: 'ABS-GF', filamentLine: 'ABS Fiberglass Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/abs-fiberglass-filament?variant=51784980693358', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-Fiberglass-Filament-1kg-2.jpg' },

  // ABS-PC Alloy
  { material: 'ABS-PC', filamentLine: 'ABS-PC Alloy Material Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/collections/abs/products/abs-pc-alloy-material-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/ABS-PC-Alloy-Material-Filament-1.jpg' },

  // ASA (7 variants)
  { material: 'ASA', filamentLine: 'ASA Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/asa/products/asa-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/asa-3d-printer-filament.jpg' },
  { material: 'ASA', filamentLine: 'ASA Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/asa-filament?variant=42824398995690', imageUrl: 'https://eryone3d.com/cdn/shop/files/asa-3d-printer-filament-3.jpg' },
  { material: 'ASA-CF', filamentLine: 'ASA Filament', color: 'CF Black', colorHex: '#1C1C1C', productUrl: 'https://eryone3d.com/products/asa-filament?variant=51609772360046', imageUrl: 'https://eryone3d.com/cdn/shop/files/asa-carbon-fiber-filament-1.jpg' },
  { material: 'ASA-CF', filamentLine: 'ASA Filament', color: 'CF Purple Red', colorHex: '#C21E56', productUrl: 'https://eryone3d.com/products/asa-filament?variant=52008242577774', imageUrl: 'https://eryone3d.com/cdn/shop/files/asa-carbon-fiber-filament-4.png' },
  { material: 'ASA-CF', filamentLine: 'ASA Filament', color: 'CF Olive Green', colorHex: '#6B8E23', productUrl: 'https://eryone3d.com/products/asa-filament?variant=52008242610542', imageUrl: 'https://eryone3d.com/cdn/shop/files/asa-carbon-fiber-filament-7.png' },
  { material: 'ASA-CF', filamentLine: 'ASA Filament', color: 'CF Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/asa-filament?variant=52008242643310', imageUrl: 'https://eryone3d.com/cdn/shop/files/asa-carbon-fiber-filament-8.png' },
  { material: 'ASA-CF', filamentLine: 'ASA Filament', color: 'CF Dark Gray', colorHex: '#404040', productUrl: 'https://eryone3d.com/products/asa-filament?variant=52008242676078', imageUrl: 'https://eryone3d.com/cdn/shop/files/asa-carbon-fiber-filament-9.png' },

  // ASA Fiberglass (2 variants)
  { material: 'ASA-GF', filamentLine: 'ASA Fiberglass Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/asa/products/asa-fiberglass-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/ASA-Fiberglass-Filament-1.jpg' },
  { material: 'ASA-GF', filamentLine: 'ASA Fiberglass Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/asa-fiberglass-filament?variant=51784974827886', imageUrl: 'https://eryone3d.com/cdn/shop/files/ASA-Fiberglass-Filament-2.jpg' },

  // ASA High-Speed (3 variants)
  { material: 'ASA', filamentLine: 'ASA High-Speed Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/asa/products/asa-high-speed-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/ASA-High-Speed-Filament-1kg-1.jpg' },
  { material: 'ASA', filamentLine: 'ASA High-Speed Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/asa-high-speed-filament?variant=51887161409902', imageUrl: 'https://eryone3d.com/cdn/shop/files/ASA-High-Speed-Filament-1kg-2.jpg' },
  { material: 'ASA', filamentLine: 'ASA High-Speed Filament', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://eryone3d.com/products/asa-high-speed-filament?variant=52381595926894', imageUrl: 'https://eryone3d.com/cdn/shop/files/800.jpg' },

  // ASA Light-Weight
  { material: 'ASA', filamentLine: 'ASA Light-Weight Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/collections/asa/products/asa-light-weight-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/ASA-Light-Weight-Filament-6.png' },

  // PETG Carbon Fiber (7 variants)
  { material: 'PETG-CF', filamentLine: 'PETG Carbon Fiber Filament', color: 'Black', colorHex: '#2F2F2F', productUrl: 'https://eryone3d.com/collections/petg/products/petg-carbon-fiber-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-Carbon-Fiber-Filament-1kg-1.jpg' },
  { material: 'PETG-CF', filamentLine: 'PETG Carbon Fiber Filament', color: 'Dark Gray', colorHex: '#404040', productUrl: 'https://eryone3d.com/products/petg-carbon-fiber-filament?variant=51992935727470', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-Carbon-Fiber-Filament-1kg-3.jpg' },
  { material: 'PETG-CF', filamentLine: 'PETG Carbon Fiber Filament', color: 'Olive Green', colorHex: '#6B8E23', productUrl: 'https://eryone3d.com/products/petg-carbon-fiber-filament?variant=51992935661934', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-Carbon-Fiber-Filament-1kg-5.jpg' },
  { material: 'PETG-CF', filamentLine: 'PETG Carbon Fiber Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/petg-carbon-fiber-filament?variant=51992935694702', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-Carbon-Fiber-Filament-1kg-6.jpg' },
  { material: 'PETG-CF', filamentLine: 'PETG Carbon Fiber Filament', color: 'Purple Red', colorHex: '#C21E56', productUrl: 'https://eryone3d.com/products/petg-carbon-fiber-filament?variant=51992935760238', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-Carbon-Fiber-Filament-1kg-4.jpg' },
  { material: 'PETG-CF', filamentLine: 'PETG Carbon Fiber Filament', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://eryone3d.com/products/petg-carbon-fiber-filament?variant=52333326139758', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-800_de347224-f3be-4bc2-9223-c6b9b887174a.jpg' },
  { material: 'PETG-CF', filamentLine: 'PETG Carbon Fiber Filament', color: 'Grass Green', colorHex: '#7CFC00', productUrl: 'https://eryone3d.com/products/petg-carbon-fiber-filament?variant=52333326172526', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-800_1a2333d4-a7bb-4d0b-9b56-9098f35c929d.jpg' },

  // PETG Fiberglass (5 variants)
  { material: 'PETG-GF', filamentLine: 'PETG Fiberglass Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/petg/products/petg-fiberglass-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-_Fiberglass-Filament-1kg-1.jpg' },
  { material: 'PETG-GF', filamentLine: 'PETG Fiberglass Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/petg-fiberglass-filament?variant=51784963981678', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-_Fiberglass-Filament-1kg-2.jpg' },
  { material: 'PETG-GF', filamentLine: 'PETG Fiberglass Filament', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://eryone3d.com/products/petg-fiberglass-filament?variant=52337161208174', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-_-800.png' },
  { material: 'PETG-GF', filamentLine: 'PETG Fiberglass Filament', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://eryone3d.com/products/petg-fiberglass-filament?variant=52337161240942', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-_-800_453960ab-d068-4133-9665-dc9ca352090b.png' },
  { material: 'PETG-GF', filamentLine: 'PETG Fiberglass Filament', color: 'Purple', colorHex: '#800080', productUrl: 'https://eryone3d.com/products/petg-fiberglass-filament?variant=52337161273710', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-_-800_f3728bb7-07d0-4610-a66b-0e2264ad9e0b.png' },

  // PETG Standard (15 variants)
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'Carbon fibre - black', colorHex: '#2F2F2F', productUrl: 'https://eryone3d.com/collections/petg/products/petg', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-Carbon-Fiber-Filament-1kg-1_72273963-5113-45bd-80e5-f97eed3d3aeb.jpg' },
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/petg?variant=39267875881009', imageUrl: 'https://eryone3d.com/cdn/shop/files/petg-3d-printer-filament-1kg-2.jpg' },
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/products/petg?variant=39267875946545', imageUrl: 'https://eryone3d.com/cdn/shop/files/petg-3d-printer-filament-1kg-20.jpg' },
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/petg?variant=39267876012081', imageUrl: 'https://eryone3d.com/cdn/shop/files/petg-3d-printer-filament-1kg-25.jpg' },
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'Trans Red', colorHex: '#FF6347', productUrl: 'https://eryone3d.com/products/petg?variant=39267875979313', imageUrl: 'https://eryone3d.com/cdn/shop/files/petg-3d-printer-filament-1kg-18.jpg' },
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/petg?variant=39450251755569', imageUrl: 'https://eryone3d.com/cdn/shop/files/petg-3d-printer-filament-1kg-23.jpg' },
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://eryone3d.com/products/petg?variant=39426852028465', imageUrl: 'https://eryone3d.com/cdn/shop/files/petg-3d-printer-filament-1kg-24.jpg' },
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/petg?variant=39450251624497', imageUrl: 'https://eryone3d.com/cdn/shop/files/petg-3d-printer-filament-1kg-19.jpg' },
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://eryone3d.com/products/petg?variant=39426851995697', imageUrl: 'https://eryone3d.com/cdn/shop/files/petg-3d-printer-filament-1kg-21.jpg' },
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'Transparent', colorHex: '#F5F5F5', productUrl: 'https://eryone3d.com/products/petg?variant=39267875913777', imageUrl: 'https://eryone3d.com/cdn/shop/files/petg-3d-printer-filament-1kg-22.jpg' },
  { material: 'PETG', filamentLine: 'PETG Filament', color: 'Trans Blue', colorHex: '#4169E1', productUrl: 'https://eryone3d.com/products/petg?variant=39267875848241', imageUrl: 'https://eryone3d.com/cdn/shop/files/petg-3d-printer-filament-1kg-1.jpg' },

  // PETG High Speed Burnt Titanium (5 variants)
  { material: 'PETG', filamentLine: 'PETG High Speed Burnt Titanium Filament', color: 'Green', colorHex: '#008000', productUrl: 'https://eryone3d.com/collections/petg/products/petg-high-speed-burnt-titanium', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Burnt-Titanium-3D-Printer-Filament-175mm-4.jpg' },
  { material: 'PETG', filamentLine: 'PETG High Speed Burnt Titanium Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/petg-high-speed-burnt-titanium?variant=52154043826542', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Burnt-Titanium-3D-Printer-Filament-175mm-2.jpg' },
  { material: 'PETG', filamentLine: 'PETG High Speed Burnt Titanium Filament', color: 'Rose red', colorHex: '#C21E56', productUrl: 'https://eryone3d.com/products/petg-high-speed-burnt-titanium?variant=52154043859310', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Burnt-Titanium-3D-Printer-Filament-175mm-5.jpg' },
  { material: 'PETG', filamentLine: 'PETG High Speed Burnt Titanium Filament', color: 'Dark gold', colorHex: '#FFD700', productUrl: 'https://eryone3d.com/products/petg-high-speed-burnt-titanium?variant=52154043892078', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Burnt-Titanium-3D-Printer-Filament-175mm-1.jpg' },
  { material: 'PETG', filamentLine: 'PETG High Speed Burnt Titanium Filament', color: 'Blue purple', colorHex: '#8A2BE2', productUrl: 'https://eryone3d.com/products/petg-high-speed-burnt-titanium?variant=52154043924846', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Burnt-Titanium-3D-Printer-Filament-175mm-3.jpg' },

  // PETG High-Speed (11 variants)
  { material: 'PETG', filamentLine: 'PETG High-Speed Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/petg/products/petg-high-speed-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Filament-1kg-1.jpg' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/petg-high-speed-filament?variant=51887144796526', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Filament-1kg-7.jpg' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Filament', color: 'Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/products/petg-high-speed-filament?variant=51887144665454', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Filament-1kg-10.jpg' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Filament', color: 'Transparent Red', colorHex: '#FF6347', productUrl: 'https://eryone3d.com/products/petg-high-speed-filament?variant=51887144567150', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Filament-1kg-4.jpg' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Filament', color: 'Transparent Blue', colorHex: '#4169E1', productUrl: 'https://eryone3d.com/products/petg-high-speed-filament?variant=51887144599918', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Filament-1kg-5.jpg' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Filament', color: 'Transparent', colorHex: '#F5F5F5', productUrl: 'https://eryone3d.com/products/petg-high-speed-filament?variant=51887144632686', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Filament-1kg-6.jpg' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Filament', color: 'Yellow', colorHex: '#FFFF00', productUrl: 'https://eryone3d.com/products/petg-high-speed-filament?variant=51887144698222', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Filament-1kg-8.jpg' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Filament', color: 'Red', colorHex: '#FF0000', productUrl: 'https://eryone3d.com/products/petg-high-speed-filament?variant=51887144730990', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Filament-1kg-3.jpg' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Filament', color: 'Orange', colorHex: '#FFA500', productUrl: 'https://eryone3d.com/products/petg-high-speed-filament?variant=51887144829294', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Filament-1kg-9.jpg' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Filament', color: 'Blue', colorHex: '#0000FF', productUrl: 'https://eryone3d.com/products/petg-high-speed-filament?variant=51887144862062', imageUrl: 'https://eryone3d.com/cdn/shop/files/PETG-High-Speed-Filament-1kg-2.jpg' },

  // PETG High-Speed Translucent (6 variants)
  { material: 'PETG', filamentLine: 'PETG High-Speed Translucent Filament', color: 'Smoky', colorHex: '#696969', productUrl: 'https://eryone3d.com/collections/petg/products/petg-high-speed-translucent-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-_-800_795abca8-423a-4081-8560-e0b0690abca6.png' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Translucent Filament', color: 'Tan', colorHex: '#D2B48C', productUrl: 'https://eryone3d.com/products/petg-high-speed-translucent-filament?variant=52337195581806', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-_-800_919bda82-9b52-4d2d-ba25-153ba05987ad.png' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Translucent Filament', color: 'Dark Green', colorHex: '#006400', productUrl: 'https://eryone3d.com/products/petg-high-speed-translucent-filament?variant=52337195712878', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-_-800_7a6e7629-af52-47b2-aaf8-e16c674ad6da.png' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Translucent Filament', color: 'Sky Blue', colorHex: '#87CEEB', productUrl: 'https://eryone3d.com/products/petg-high-speed-translucent-filament?variant=52337195843950', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-_-800_96e99ef2-e5f9-4fcd-97af-b0fa314d5e1d.png' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Translucent Filament', color: 'Pink', colorHex: '#FFC0CB', productUrl: 'https://eryone3d.com/products/petg-high-speed-translucent-filament?variant=52337195975022', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-_-800_42f58e1f-31b8-48ef-962d-1a55c5b0e0c2.png' },
  { material: 'PETG', filamentLine: 'PETG High-Speed Translucent Filament', color: 'Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/products/petg-high-speed-translucent-filament?variant=52337196106094', imageUrl: 'https://eryone3d.com/cdn/shop/files/1-_-800_647b97b4-7906-4d8d-8310-109c08fed43f.png' },

  // TPU Standard (14 variants)
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Black 0.5kg', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/tpu/products/tpu', imageUrl: 'https://eryone3d.com/cdn/shop/files/TPU-standard-Filament-16.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Black 1kg', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/tpu?variant=44004308156650', imageUrl: 'https://eryone3d.com/cdn/shop/products/TPU-standard-Filament-1kg-2.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Transparent Red 0.5kg', colorHex: '#FF6347', productUrl: 'https://eryone3d.com/products/tpu?variant=39267876274225', imageUrl: 'https://eryone3d.com/cdn/shop/files/Bundle-tpu-Filament-15.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Transparent Blue 0.5kg', colorHex: '#4169E1', productUrl: 'https://eryone3d.com/products/tpu?variant=39267876306993', imageUrl: 'https://eryone3d.com/cdn/shop/files/TPU-standard-Filament-19.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Transparent 0.5kg', colorHex: '#F5F5F5', productUrl: 'https://eryone3d.com/products/tpu?variant=39267876339761', imageUrl: 'https://eryone3d.com/cdn/shop/files/TPU-standard-Filament-17.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Gray 0.5kg', colorHex: '#808080', productUrl: 'https://eryone3d.com/products/tpu?variant=39267876372529', imageUrl: 'https://eryone3d.com/cdn/shop/files/TPU-standard-Filament-15.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'White 0.5kg', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/tpu?variant=39267876405297', imageUrl: 'https://eryone3d.com/cdn/shop/files/TPU-standard-Filament-17.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Aurora Rainbow 0.5kg', colorHex: '#FF69B4', productUrl: 'https://eryone3d.com/products/tpu?variant=44004308025578', imageUrl: 'https://eryone3d.com/cdn/shop/files/TPU-rainbow-Filament-1.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Sea Glass Rainbow 0.5kg', colorHex: '#20B2AA', productUrl: 'https://eryone3d.com/products/tpu?variant=44004308058346', imageUrl: 'https://eryone3d.com/cdn/shop/files/TPU-rainbow-Filament-2.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Gray 1kg', colorHex: '#808080', productUrl: 'https://eryone3d.com/products/tpu?variant=44004308091114', imageUrl: 'https://eryone3d.com/cdn/shop/products/TPU-standard-Filament-1kg-5.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'White 1kg', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/tpu?variant=44004308123882', imageUrl: 'https://eryone3d.com/cdn/shop/products/TPU-standard-Filament-1kg-7.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Transparent Blue 1kg', colorHex: '#4169E1', productUrl: 'https://eryone3d.com/products/tpu?variant=44004308189418', imageUrl: 'https://eryone3d.com/cdn/shop/products/TPU-standard-Filament-1kg-4.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Transparent Red 1kg', colorHex: '#FF6347', productUrl: 'https://eryone3d.com/products/tpu?variant=44004308222186', imageUrl: 'https://eryone3d.com/cdn/shop/products/TPU-standard-Filament-1kg-6.jpg' },
  { material: 'TPU', filamentLine: 'TPU Filament', color: 'Transparent 1kg', colorHex: '#F5F5F5', productUrl: 'https://eryone3d.com/products/tpu?variant=44004308254954', imageUrl: 'https://eryone3d.com/cdn/shop/products/TPU-standard-Filament-1kg-3.jpg' },

  // TPU 85A (6 variants)
  { material: 'TPU-85A', filamentLine: 'TPU 85A Flexible Filament', color: 'Solid Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/tpu/products/tpu-85a-flexible-filament-1-75mm-0-03mm-1kg', imageUrl: 'https://eryone3d.com/cdn/shop/files/1_44739d08-cfd3-4bb3-953e-334fc7be8f52.jpg' },
  { material: 'TPU-85A', filamentLine: 'TPU 85A Flexible Filament', color: 'Solid White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/tpu-85a-flexible-filament-1-75mm-0-03mm-1kg?variant=53095193936238', imageUrl: 'https://eryone3d.com/cdn/shop/files/1_d957c6fb-81c4-464c-9d92-447314efaa24.jpg' },
  { material: 'TPU-85A', filamentLine: 'TPU 85A Flexible Filament', color: 'Gray', colorHex: '#808080', productUrl: 'https://eryone3d.com/products/tpu-85a-flexible-filament-1-75mm-0-03mm-1kg?variant=53095194001774', imageUrl: 'https://eryone3d.com/cdn/shop/files/1_5e1e4f38-7a80-46b4-905b-ea3774c61639.jpg' },
  { material: 'TPU-85A', filamentLine: 'TPU 85A Flexible Filament', color: 'Transparent', colorHex: '#F5F5F5', productUrl: 'https://eryone3d.com/products/tpu-85a-flexible-filament-1-75mm-0-03mm-1kg?variant=53095193969006', imageUrl: 'https://eryone3d.com/cdn/shop/files/1_4166b6ad-4671-4d30-937e-0ed57bcc006d.jpg' },
  { material: 'TPU-85A', filamentLine: 'TPU 85A Flexible Filament', color: 'Transparent Red', colorHex: '#FF6347', productUrl: 'https://eryone3d.com/products/tpu-85a-flexible-filament-1-75mm-0-03mm-1kg?variant=53095194067310', imageUrl: 'https://eryone3d.com/cdn/shop/files/1_f13e90da-5154-4fca-b78d-20d609529a9a.jpg' },
  { material: 'TPU-85A', filamentLine: 'TPU 85A Flexible Filament', color: 'Transparent Blue', colorHex: '#4169E1', productUrl: 'https://eryone3d.com/products/tpu-85a-flexible-filament-1-75mm-0-03mm-1kg?variant=53095194034542', imageUrl: 'https://eryone3d.com/cdn/shop/files/1_89ec7295-abcc-4ec2-9861-d2b8b1eafc45.jpg' },

  // Nylon PA (8 variants)
  { material: 'PA12-GF', filamentLine: 'Nylon Filament', color: 'Black PA12-GF', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/pa-pp/products/nylon-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/nylon-PA12-Fiberglass-filament-1.png' },
  { material: 'PA6-GF', filamentLine: 'Nylon Filament', color: 'Black PA6-GF', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/nylon-filament?variant=52150772007278', imageUrl: 'https://eryone3d.com/cdn/shop/files/nylon-PA6-Fiberglass-filament.png' },
  { material: 'PA6-GF', filamentLine: 'Nylon Filament', color: 'White PA6-GF', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/nylon-filament?variant=52150772040046', imageUrl: 'https://eryone3d.com/cdn/shop/files/nylon-PA6-Fiberglass-filament-2.png' },
  { material: 'PA6-CF', filamentLine: 'Nylon Filament', color: 'Black PA6-CF', colorHex: '#1C1C1C', productUrl: 'https://eryone3d.com/products/nylon-filament?variant=44285048422634', imageUrl: 'https://eryone3d.com/cdn/shop/files/nylon-PA-carbon-fiber-filament-1.jpg' },
  { material: 'PA12-CF', filamentLine: 'Nylon Filament', color: 'Black PA12-CF', colorHex: '#1C1C1C', productUrl: 'https://eryone3d.com/products/nylon-filament?variant=44285048455402', imageUrl: 'https://eryone3d.com/cdn/shop/files/nylon-PA-carbon-fiber-filament.jpg' },
  { material: 'PA', filamentLine: 'Nylon Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/products/nylon-filament?variant=44051408060650', imageUrl: 'https://eryone3d.com/cdn/shop/files/nylon-PA-filament-1.jpg' },
  { material: 'PA', filamentLine: 'Nylon Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/nylon-filament?variant=44051408093418', imageUrl: 'https://eryone3d.com/cdn/shop/files/nylon-PA-filament-2.jpg' },
  { material: 'PA', filamentLine: 'Nylon Filament', color: 'Transparent', colorHex: '#F5F5F5', productUrl: 'https://eryone3d.com/products/nylon-filament?variant=44051408126186', imageUrl: 'https://eryone3d.com/cdn/shop/files/nylon-PA-filament-3.jpg' },

  // PP (3 variants)
  { material: 'PP', filamentLine: 'PP Filament', color: 'Black', colorHex: '#000000', productUrl: 'https://eryone3d.com/collections/pa-pp/products/pp-filament', imageUrl: 'https://eryone3d.com/cdn/shop/files/pp-filament-2.jpg' },
  { material: 'PP', filamentLine: 'PP Filament', color: 'White', colorHex: '#FFFFFF', productUrl: 'https://eryone3d.com/products/pp-filament?variant=51784886845806', imageUrl: 'https://eryone3d.com/cdn/shop/files/pp-filament-3.jpg' },
  { material: 'PP-CF', filamentLine: 'PP Filament', color: 'Carbon Fiber Black', colorHex: '#1C1C1C', productUrl: 'https://eryone3d.com/products/pp-filament?variant=51784886747502', imageUrl: 'https://eryone3d.com/cdn/shop/files/pp-cf-filament-1.jpg' },
];

// ============================================================================
// DEFAULT PRICES BY PRODUCT LINE
// ============================================================================

export const ERYONE_DEFAULT_PRICES: Record<string, number> = {
  // PLA variants
  'PLA Filament': 19.99,
  'PLA+ Filament': 21.99,
  'PLA+ High-Speed Filament': 24.99,
  'PLA High-Speed Filament': 22.99,
  'PLA Silk Filament': 24.99,
  'PLA Ultra Silk Filament': 26.99,
  'PLA Silk Dual-Color Filament': 25.99,
  'PLA Silk High-Speed Dual-Color Filament': 27.99,
  'PLA Silk High-Speed Triple-Color Filament': 28.99,
  'PLA Silk High-Speed Quadruple Filament': 29.99,
  'PLA Silk Triple-Color Filament': 26.99,
  'PLA Silk Rainbow Filament': 25.99,
  'PLA Matte Filament': 22.99,
  'PLA Matte Gradient Dual-Color Filament': 24.99,
  'PLA Matte High Speed Filament': 25.99,
  'PLA Matte High-Speed Triple-Color Filament': 27.99,
  'PLA Matte High-Speed Gradient Multi-Color Filament': 26.99,
  'PLA Galaxy Sparkly Glitter Filament': 24.99,
  'PLA Luminous Filament': 24.99,
  'PLA Wood Filament': 24.99,
  'PLA Metallic Filament': 26.99,
  'PLA Marble Filament': 22.99,
  'PLA Light Weight Filament': 29.99,
  'PLA Burnt Titanium Filament': 26.99,
  'PLA Burnt Titanium Dual-Color Filament': 28.99,
  'PLA Burnt Titanium Triple Color Filament': 29.99,
  'PLA Lagoon Rainbow Filament': 24.99,
  'PLA Classical Rainbow Filament': 24.99,
  'PLA Steampunk Rainbow Filament': 24.99,
  'PLA Carbon Fiber Filament': 29.99,
  
  // ABS variants
  'ABS Filament': 19.99,
  'ABS+ Filament': 21.99,
  'ABS High-Speed Filament': 24.99,
  'ABS Fiberglass Filament': 32.99,
  'ABS-PC Alloy Material Filament': 29.99,
  
  // ASA variants
  'ASA Filament': 26.99,
  'ASA Fiberglass Filament': 34.99,
  'ASA High-Speed Filament': 29.99,
  'ASA Light-Weight Filament': 34.99,
  
  // PETG variants
  'PETG Filament': 22.99,
  'PETG Carbon Fiber Filament': 34.99,
  'PETG Fiberglass Filament': 32.99,
  'PETG High-Speed Filament': 25.99,
  'PETG High Speed Burnt Titanium Filament': 29.99,
  'PETG High-Speed Translucent Filament': 26.99,
  
  // TPU variants
  'TPU Filament': 25.99,
  'TPU 85A Flexible Filament': 29.99,
  
  // Engineering
  'Nylon Filament': 39.99,
  'PP Filament': 34.99,
};

// ============================================================================
// TDS URL PATTERNS
// ============================================================================

export const ERYONE_TDS_PATTERNS: Record<string, string> = {
  'PLA+': 'https://eryone3d.com/pages/pla-plus-tds',
  'PLA': 'https://eryone3d.com/pages/pla-tds',
  'PETG+': 'https://eryone3d.com/pages/petg-plus-tds',
  'PETG': 'https://eryone3d.com/pages/petg-tds',
  'ABS+': 'https://eryone3d.com/pages/abs-plus-tds',
  'ABS': 'https://eryone3d.com/pages/abs-tds',
  'ASA': 'https://eryone3d.com/pages/asa-tds',
  'TPU': 'https://eryone3d.com/pages/tpu-tds',
  'PLA-CF': 'https://eryone3d.com/pages/pla-cf-tds',
  'PETG-CF': 'https://eryone3d.com/pages/petg-cf-tds',
  'ASA-CF': 'https://eryone3d.com/pages/asa-cf-tds',
  'PA-CF': 'https://eryone3d.com/pages/pa-cf-tds',
  'PP-CF': 'https://eryone3d.com/pages/pp-cf-tds',
  'PP': 'https://eryone3d.com/pages/pp-tds',
  'PPS': 'https://eryone3d.com/pages/pps-tds',
};

export function matchEryoneTds(title: string): { url: string; pattern: string } | null {
  if (!title) return null;
  const normalizedTitle = title.toUpperCase();
  
  const sorted = Object.entries(ERYONE_TDS_PATTERNS).sort((a, b) => b[0].length - a[0].length);
  
  for (const [pattern, url] of sorted) {
    if (normalizedTitle.includes(pattern.toUpperCase())) {
      return { url, pattern };
    }
  }
  return null;
}

// ============================================================================
// PRINT SETTINGS
// ============================================================================

export interface PrintSettings {
  nozzleTempMin: number;
  nozzleTempMax: number;
  bedTempMin: number;
  bedTempMax: number;
  printSpeedMax?: number;
  requiresEnclosure?: boolean;
  isAbrasive?: boolean;
}

export const ERYONE_PRINT_SETTINGS: Record<string, PrintSettings> = {
  'PLA': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 55, bedTempMax: 70 },
  'PLA+': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 55, bedTempMax: 70, printSpeedMax: 100 },
  'PLA+ HIGH-SPEED': { nozzleTempMin: 190, nozzleTempMax: 230, bedTempMin: 55, bedTempMax: 70, printSpeedMax: 300 },
  'PETG': { nozzleTempMin: 230, nozzleTempMax: 250, bedTempMin: 70, bedTempMax: 85 },
  'PETG+': { nozzleTempMin: 235, nozzleTempMax: 255, bedTempMin: 70, bedTempMax: 85 },
  'PETG-CF': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85, isAbrasive: true },
  'PETG-GF': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 70, bedTempMax: 85, isAbrasive: true },
  'ABS': { nozzleTempMin: 220, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true },
  'ABS+': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true },
  'ABS-CF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'ABS-GF': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'ABS-PC': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 100, bedTempMax: 110, requiresEnclosure: true },
  'ASA': { nozzleTempMin: 240, nozzleTempMax: 260, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true },
  'ASA-CF': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'ASA-GF': { nozzleTempMin: 250, nozzleTempMax: 270, bedTempMin: 90, bedTempMax: 110, requiresEnclosure: true, isAbrasive: true },
  'TPU': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 },
  'TPU-85A': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 },
  'TPU-90A': { nozzleTempMin: 210, nozzleTempMax: 240, bedTempMin: 40, bedTempMax: 60 },
  'PA': { nozzleTempMin: 240, nozzleTempMax: 270, bedTempMin: 70, bedTempMax: 90, requiresEnclosure: true },
  'PA6-CF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, isAbrasive: true },
  'PA6-GF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, isAbrasive: true },
  'PA12-CF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, isAbrasive: true },
  'PA12-GF': { nozzleTempMin: 260, nozzleTempMax: 290, bedTempMin: 80, bedTempMax: 100, requiresEnclosure: true, isAbrasive: true },
  'PP': { nozzleTempMin: 220, nozzleTempMax: 250, bedTempMin: 80, bedTempMax: 100 },
  'PP-CF': { nozzleTempMin: 230, nozzleTempMax: 260, bedTempMin: 80, bedTempMax: 100, isAbrasive: true },
  'PLA-WOOD': { nozzleTempMin: 180, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 70 },
  'PLA-METAL': { nozzleTempMin: 190, nozzleTempMax: 220, bedTempMin: 50, bedTempMax: 70, isAbrasive: true },
};

export function getEryonePrintSettings(material: string | null): PrintSettings | null {
  if (!material) return null;
  const upperMaterial = material.toUpperCase().replace(/[_\s]+/g, '-');
  
  if (ERYONE_PRINT_SETTINGS[upperMaterial]) {
    return ERYONE_PRINT_SETTINGS[upperMaterial];
  }
  
  for (const [key, settings] of Object.entries(ERYONE_PRINT_SETTINGS)) {
    if (upperMaterial.includes(key) || key.includes(upperMaterial)) {
      return settings;
    }
  }
  
  return null;
}

// ============================================================================
// FINISH TYPE EXTRACTION
// ============================================================================

export type FinishType = 'Silk' | 'Matte' | 'Sparkle' | 'Glow' | 'Rainbow' | 'MultiColor' | 'Translucent' | 'Metallic' | 'Marble' | 'Wood' | 'Metal' | 'Standard';

const FINISH_PATTERNS: Array<{ pattern: RegExp; finish: FinishType }> = [
  { pattern: /\bsilk\b/i, finish: 'Silk' },
  { pattern: /\bmatte\b/i, finish: 'Matte' },
  { pattern: /\bgalaxy\b|\bsparkl[ey]\b|\bglitter\b/i, finish: 'Sparkle' },
  { pattern: /\bglow(?:\s*in\s*the\s*dark)?\b|\bluminous\b/i, finish: 'Glow' },
  { pattern: /\brainbow\b|\bsteampunk\b|\blagoon\b|\bclassical\b/i, finish: 'Rainbow' },
  { pattern: /\bdual[\s-]*colou?r\b|\bquadruple[\s-]*colou?r\b|\bquad[\s-]*colou?r\b|\bmulti[\s-]*colou?r\b|\btriple[\s-]*colou?r\b|\bburnt\s*titanium\b/i, finish: 'MultiColor' },
  { pattern: /\btranslucent\b|\bclear\b|\btransparent\b/i, finish: 'Translucent' },
  { pattern: /\bmetallic\b/i, finish: 'Metallic' },
  { pattern: /\bmarble\b|\bstone\b/i, finish: 'Marble' },
  { pattern: /\bwood\b/i, finish: 'Wood' },
  { pattern: /\bmetal\b(?!lic)/i, finish: 'Metal' },
];

export function extractFinishType(title: string): FinishType {
  if (!title) return 'Standard';
  
  for (const { pattern, finish } of FINISH_PATTERNS) {
    if (pattern.test(title)) {
      return finish;
    }
  }
  
  return 'Standard';
}

// ============================================================================
// PRODUCT LINE ID GENERATION
// ============================================================================

export function generateEryoneProductLineId(filamentLine: string, material: string): string {
  // Clean the filament line name - remove specs and "Filament" suffix
  let cleaned = filamentLine
    .replace(/\s*-\s*1\.75mm.*$/i, '')
    .replace(/\s*filament\s*$/i, '')
    .replace(/\s*\([^)]*\)\s*/g, '')
    .trim();
  
  // Normalize material to create matSlug
  const matSlug = material
    .toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-');
  
  // Strip ALL material prefixes from cleaned line (including with +)
  // E.g., "PLA+ High-Speed" -> "High-Speed", "PLA Galaxy" -> "Galaxy"
  // Also handle "PLA-Wood" -> "Wood" when material is "PLA-Wood"
  const baseMaterial = material.replace(/[+-]/g, '').toLowerCase();
  const materialPatterns = [
    new RegExp(`^${material.replace(/[+]/g, '\\+').replace(/-/g, '[-\\s]?')}\\s*`, 'i'),  // Exact match with + and -
    new RegExp(`^${baseMaterial}\\+?\\s*`, 'i'), // Base material with optional +
  ];
  
  for (const pattern of materialPatterns) {
    cleaned = cleaned.replace(pattern, '').trim();
  }
  
  // If cleaned is empty after removing material, use 'standard'
  if (!cleaned) {
    return `eryone__${matSlug}__standard`;
  }
  
  // Create slug from cleaned filament line
  const lineSlug = cleaned
    .toLowerCase()
    .replace(/\+/g, '-plus')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  
  // If lineSlug is empty or matches material slug (with or without -plus), use 'standard'
  const matSlugBase = matSlug.replace('-plus', '');
  if (!lineSlug || lineSlug === matSlug || lineSlug === matSlugBase) {
    return `eryone__${matSlug}__standard`;
  }
  
  return `eryone__${matSlug}__${lineSlug}`;
}

// ============================================================================
// TITLE CLEANING
// ============================================================================

export function cleanEryoneTitle(filamentLine: string): string {
  return filamentLine
    .replace(/\s*-\s*1\.75mm.*$/i, '')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================================
// MAIN ENRICHMENT FUNCTION
// ============================================================================

export interface EryoneEnrichmentResult {
  tdsUrl: string | null;
  finishType: FinishType;
  material: string;
  nozzleTempMin: number | null;
  nozzleTempMax: number | null;
  bedTempMin: number | null;
  bedTempMax: number | null;
  printSpeedMax: number | null;
  requiresEnclosure: boolean;
  isAbrasive: boolean;
  productLineId: string;
  cleanedTitle: string;
  isHighSpeed: boolean;
}

export function enrichEryoneProduct(
  filamentLine: string,
  material: string
): EryoneEnrichmentResult {
  const settings = getEryonePrintSettings(material);
  const tds = matchEryoneTds(filamentLine);
  const isHighSpeed = /high[\s-]*speed/i.test(filamentLine);
  
  return {
    tdsUrl: tds?.url || null,
    finishType: extractFinishType(filamentLine),
    material,
    nozzleTempMin: settings?.nozzleTempMin || null,
    nozzleTempMax: settings?.nozzleTempMax || null,
    bedTempMin: settings?.bedTempMin || null,
    bedTempMax: settings?.bedTempMax || null,
    printSpeedMax: isHighSpeed ? 300 : (settings?.printSpeedMax || null),
    requiresEnclosure: settings?.requiresEnclosure || false,
    isAbrasive: settings?.isAbrasive || false,
    productLineId: generateEryoneProductLineId(filamentLine, material),
    cleanedTitle: cleanEryoneTitle(filamentLine),
    isHighSpeed,
  };
}

export function getEryoneColorHex(colorName: string): string | null {
  // Colors are already provided in the seed with hex codes
  return null;
}
