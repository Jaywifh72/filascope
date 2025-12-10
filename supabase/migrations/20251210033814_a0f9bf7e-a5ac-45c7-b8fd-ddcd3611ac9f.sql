-- Standardize material names to use consistent naming conventions
-- Pattern: Use hyphen format for composites (e.g., "PLA-CF" not "PLA CF")
-- Pattern: Use plus suffix without hyphen (e.g., "PLA+" not "PLA +")

-- ABS variants
UPDATE filaments SET material = 'ABS-CF' WHERE material IN ('ABS CF', 'ABS CF Core', 'ABS-CF Core');
UPDATE filaments SET material = 'ABS-GF' WHERE material = 'ABS GF';

-- ASA variants  
UPDATE filaments SET material = 'ASA-CF' WHERE material IN ('ASA CF', 'ASA CF10');
UPDATE filaments SET material = 'ASA-GF' WHERE material = 'ASA GF';

-- CPE variants
UPDATE filaments SET material = 'CPE-CF' WHERE material = 'CPE CF';

-- FR-ABS standardization
UPDATE filaments SET material = 'FR-ABS' WHERE material = 'FR ABS';

-- HTPLA variants
UPDATE filaments SET material = 'HTPLA-CF' WHERE material = 'HTPLA CF';

-- Nylon/PA standardization (consolidate to Nylon-CF format)
UPDATE filaments SET material = 'Nylon-CF' WHERE material IN ('Nylon CF', 'Nylon CF Slide', 'Nylon 12 CF', 'Nylon 6 CF', 'Nylon PA6 CF', 'PA-CF', 'PA6-CF', 'PA11 CF', 'PA12-CF', 'PAHT-CF');
UPDATE filaments SET material = 'Nylon-GF' WHERE material IN ('Nylon 12 GF30', 'Nylon PA6 GF', 'Nylon PA6 GF30', 'PA6-GF');
UPDATE filaments SET material = 'Nylon' WHERE material IN ('PA', 'PA6 Nylon', 'Nylon PA6', 'Easy Nylon');

-- PC variants
UPDATE filaments SET material = 'PC-CF' WHERE material = 'PC CF';
UPDATE filaments SET material = 'PC-FR' WHERE material = 'PC FR';

-- PEEK variants
UPDATE filaments SET material = 'PEEK-CF' WHERE material IN ('PEEK CF', 'PEEK CF10', 'PEEK CF20');

-- PEI variants
UPDATE filaments SET material = 'PEI-CF' WHERE material = 'PEI CF';

-- PEKK variants
UPDATE filaments SET material = 'PEKK-CF' WHERE material = 'PEKK CF';

-- PET variants
UPDATE filaments SET material = 'PET-CF' WHERE material = 'PET CF';
UPDATE filaments SET material = 'PET-GF' WHERE material = 'PET GF';

-- PETG variants
UPDATE filaments SET material = 'PETG-CF' WHERE material IN ('PETG CF', 'PETG Composite');

-- PLA variants - consolidate carbon fiber
UPDATE filaments SET material = 'PLA-CF' WHERE material IN ('PLA CF', 'PLA CF03', 'PLA Carbon Fiber');

-- PLA specialty consolidation
UPDATE filaments SET material = 'PLA-Wood' WHERE material IN ('PLA Wood', 'PLA Wood Composite', 'PLA Cork Composite');
UPDATE filaments SET material = 'PLA-Marble' WHERE material = 'PLA Marble';
UPDATE filaments SET material = 'PLA-Silk' WHERE material = 'PLA Silk';
UPDATE filaments SET material = 'PLA-Matte' WHERE material = 'PLA Matte';
UPDATE filaments SET material = 'PLA-Metal' WHERE material IN ('PLA Metal', 'PLA Bronze Composite', 'PLA Copper Composite', 'PLA Steel Composite', 'Metallic PLA');
UPDATE filaments SET material = 'PLA-Glow' WHERE material IN ('PLA Glow', 'PLA Glow in Dark', 'PLA-Luminous');
UPDATE filaments SET material = 'PLA-Stone' WHERE material = 'PLA Stone Composite';
UPDATE filaments SET material = 'PLA-Galaxy' WHERE material = 'PLA Galaxy';
UPDATE filaments SET material = 'PLA-Conductive' WHERE material = 'PLA Conductive';

-- PP variants
UPDATE filaments SET material = 'PP-CF' WHERE material = 'PP CF';
UPDATE filaments SET material = 'PP-GF' WHERE material = 'PP GF';

-- PPA variants
UPDATE filaments SET material = 'PPA-CF' WHERE material IN ('PPA CF', 'PPA-CF Core');
UPDATE filaments SET material = 'PPA-GF' WHERE material = 'PPA GF';

-- PPS variants
UPDATE filaments SET material = 'PPS-CF' WHERE material = 'PPS CF';

-- ESD variants (standardize to ESD- prefix)
UPDATE filaments SET material = 'ESD-ABS' WHERE material = 'ESD ABS';
UPDATE filaments SET material = 'ESD-PC' WHERE material = 'ESD PC';
UPDATE filaments SET material = 'ESD-PETG' WHERE material = 'ESD PETG';
UPDATE filaments SET material = 'ESD-PLA' WHERE material = 'ESD PLA';
UPDATE filaments SET material = 'ESD-PEI' WHERE material = 'ESD PEI 1010';
UPDATE filaments SET material = 'ESD-PEKK' WHERE material = 'ESD PEKK';

-- Co-Polyester standardization
UPDATE filaments SET material = 'CoPoly-CF' WHERE material = 'Co-Polyester CF';
UPDATE filaments SET material = 'CoPoly-HT' WHERE material = 'Co-Polyester HT';
UPDATE filaments SET material = 'CoPoly-nGen' WHERE material IN ('Co-Polyester nGen', 'Co-Polyester nGen_FLEX');
UPDATE filaments SET material = 'CoPoly-XT' WHERE material = 'Co-Polyester XT';

-- Silk PLA standardization
UPDATE filaments SET material = 'PLA-Silk' WHERE material IN ('Silk PLA+', 'Silky PLA');

-- Recycled material standardization
UPDATE filaments SET material = 'rPETG' WHERE material = 'Recycled PETG';
UPDATE filaments SET material = 'rPLA' WHERE material = 'Recycled PLA';

-- TPU/TPE standardization
UPDATE filaments SET material = 'TPU-CF' WHERE material = 'TPU CF';

-- Wood PLA consolidation
UPDATE filaments SET material = 'PLA-Wood' WHERE material = 'Wood PLA';