// Alias mapping for material reference lookups
// Maps variant names, brand-specific names, and case variations to canonical keys

export const MATERIAL_ALIASES: Record<string, string> = {
  // PLA case variations and synonyms
  'PLA Carbon': 'PLA-CF',
  'PLA-Carbon': 'PLA-CF',
  'PLA Matte': 'PLA-Matte',
  'PLA-MATTE': 'PLA-Matte',
  'PLA SILK': 'PLA Silk',
  'PLA-Silk': 'PLA Silk',
  'PLA-SILK': 'PLA Silk',
  'PLA-Wood': 'PLA-Wood',
  'PLA-WOOD': 'PLA-Wood',
  'Wood': 'PLA-Wood',
  'Woodfill': 'PLA-Wood',
  'PLA-Glow': 'PLA Glow in the Dark',
  'PLA-GLOW': 'PLA Glow in the Dark',
  'PLA Glow': 'PLA Glow in the Dark',
  'PLA-Marble': 'PLA-Marble',
  'PLA-MARBLE': 'PLA-Marble',
  'PLA Marble': 'PLA-Marble',
  'PLA-STARLIGHT': 'PLA-Galaxy',
  'PLA-Stone': 'PLA-Stone',
  'PLA Stone Age': 'PLA-Stone',
  'PLA Glitter': 'PLA-Galaxy',
  'PLA-Flex': 'FlexPLA',
  'PLA-HT': 'HTPLA',
  'r-PLA': 'rPLA',
  'Premium PLA High Speed': 'PLA High Speed Pro',
  'PLA-HS': 'PLA High Speed Pro',
  'PLA-HP': 'PLA Hi-Flow Pro',
  'PLA Pro': 'PLA+',
  'PLA Premium': 'PLA+',

  // ABS variations
  'ABS-ESD': 'ESD-ABS',
  'ABS-FR': 'FR-ABS',
  'ABS-HT': 'ABS HT',
  'Easy ABS': 'ABS+',
  'Smart ABS': 'ABS+',

  // ASA variations
  'FlameGuard ASA 275': 'ASA 275',
  'ASA-X CF10': 'ASA-CF',
  'ASA-X GF10': 'ASA-GF',

  // PC variations
  'FR-PC': 'PC-FR',
  'PC-ABS-FR': 'PC-ABS',
  'PC+PBT': 'PC-PBT',
  'PC-PBT-GF': 'PC-PBT',
  'PC-275': 'PC',

  // PETG variations
  'PET-G Premium': 'Pro PETG',
  'PET-G Premium High Speed': 'PETG-HS',
  'PET-G FR V0': 'PETG',
  'PET-G Glow in the Dark': 'PETG',
  'PETG Economy': 'PETG',
  'PETG-TRANSLUCENT': 'PETG',
  'PETG-GF': 'PET-GF',
  'The Filament PETG': 'PETG',
  'The Filament PETG CF': 'PETG-CF',
  'The Filament PLA': 'PLA',
  'The Filament PLA CF': 'PLA-CF',
  'The Filament PLA HS': 'PLA High Speed Pro',

  // PCTG variations
  'PCTG CF10': 'PCTG',
  'PCTG GF10': 'PCTG',
  'PCTG Premium': 'PCTG',

  // Nylon/PA variations
  'PA': 'Nylon',
  'PA-AF': 'Nylon-AF',
  'PA-CF': 'Nylon-CF',
  'PA-GF': 'Nylon-GF',
  'PA6-CF': 'Nylon-CF',
  'PA6-GF': 'Nylon-GF',
  'PA12-CF': 'Nylon-CF',
  'PA12-GF': 'Nylon-GF',
  'PA11-CF': 'Nylon-CF',
  'PA612-CF': 'Nylon-CF',
  'PA6 CF15': 'Nylon-CF',
  'PA12 CF15': 'Nylon-CF',
  'PA6 Neat': 'PA6',
  'PA6-66': 'PA6',
  'PA6-Wear': 'PA6',
  'PA6 CS20 FR V0': 'PA6',
  'Nylon PA6 Low Warp': 'PA6',
  'ThermaTech PA': 'Nylon',
  'HTN': 'Nylon',

  // TPU variations
  'TPU-85A': 'TPU 85A',
  'TPU-95A': 'TPU 95A',
  'TPU-75A': 'TPU 75A',
  'TPU-90A': 'TPU',
  'TPU-92A': 'TPU',
  'TPU-98A': 'TPU',
  'TPU-88A': 'TPU',
  'TPU-82A': 'TPU',
  'TPU-70A': 'TPU 75A',
  'TPU-60A': 'TPU 75A',
  'TPU-30D': 'TPU',
  'TPU-40D': 'TPU',
  'TPU-64D': 'TPU',
  'TPU-75D': 'TPU',
  'TPU-GF': 'TPU-CF',
  'TPU-SEBS': 'TPE',
  'rTPU': 'TPU',
  'TPU-Bio': 'TPU',
  'TPU-FOAM': 'TPU',
  'TPU-95A-FOAM': 'TPU 95A',
  'S-Flex 85A': 'TPU 85A',
  'S-Flex 90A': 'TPU',
  'S-Flex 98A': 'TPU',
  'S-Flex Carbon': 'TPU-CF',

  // TPE variations
  'TPE-90A': 'TPE',
  'TPE-96A': 'TPE',
  'TPE-E': 'TPC',
  'TPA': 'TPE',

  // PEBA variations
  'PEBA-85A': 'PEBA 85A',
  'PEBA-95A': 'PEBA 95A',
  'PEBA-FOAM': 'PEBA',

  // PEI variations
  'PEI': 'PEI 1010',
  'PEI-1010': 'PEI 1010',
  'PEI-9085': 'PEI 9085',
  'ESD-PEI-1010': 'PEI 1010',

  // PEKK variations
  'ESD-PEKK': 'PEKK',

  // PEEK variations
  'PEEK-CF': 'PEEK',

  // Support materials
  'RapidRinse': 'PVA',
  'SR-30': 'Support',
  'HIPS-X': 'HIPS',

  // CPE / Copolyester
  'Copolyester': 'CPE',
  'CPE': 'CoPoly-nGen',
  'CPE+': 'CoPoly-HT',
  'CPE-CF': 'CoPoly-CF',

  // Misc
  'ABS-PC': 'PC-ABS',
  'ABS-R': 'ABS',
  'ABS Medical': 'ABS',
  'ABS-CF-Core': 'ABS-CF',
  'ABS-HS': 'ABS',
  'PPA-CF-Core': 'PPA-CF',
  'PPA-GF': 'PPA',
  'Bio-PLA': 'BIO',
  'BIO-CF': 'BIO',
  'PPS AM230': 'PPS',
  'PPS-GF': 'PPS',
  'USM': 'Support',
  'Other': 'PLA',
  'Unknown': 'PLA',
  'MTS': 'Support',
  'HTS': 'Support',
  'PC PTFE': 'PC',
  'FR-PC-ABS': 'PC-ABS',

  // PLA variant aliases (hierarchy → reference data keys)
  'PLA+ 2.0': 'PLA+',
  'PLA-Basic': 'PLA',
  'PLA-Blend': 'PLA',
  'PLA-Meta': 'PLA',
  'PLA-Tough': 'PLA+',
  'Standard PLA+': 'PLA+',
  'EasyPrint PLA': 'PLA',
  'Silk PLA+': 'PLA Silk',
  'PLA Magic Silk': 'PLA Silk',
  'PLA Silk Rainbow': 'PLA Silk',
  'PLA Matte Dual-Color': 'PLA-Matte',
  'PLA Thermoactive': 'PLA-Temp',
  'PLA-Iridescent': 'PLA Silk',
  'PLA-UV': 'PLA-Temp',
  'LW-PLA-HT': 'LW-PLA',
  'HTPLA-CF': 'HTPLA',

  // PETG variant aliases
  'PET-G': 'PETG',
  'PETG Iridescent': 'PETG',

  // High-performance aliases
  'ESD-PEI': 'PEI 1010',

  // Flexible aliases not already present
  'PEBA Air': 'PEBA',
};
