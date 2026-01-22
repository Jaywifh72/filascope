-- Add warranty_coverage to printer_brands for brand-level default warranty info
ALTER TABLE public.printer_brands ADD COLUMN IF NOT EXISTS warranty_coverage TEXT;

-- Update with verified manufacturer warranty policies
-- Sources: Official manufacturer warranty pages

-- Bambu Lab: 1 year limited warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers defects in materials and workmanship under normal use. Consumable parts (nozzles, build plates, filters) have 3-month limited coverage.' WHERE brand = 'Bambu Lab';

-- Prusa Research: 2 years warranty (EU standard)
UPDATE public.printer_brands SET warranty_years = 2, warranty_coverage = 'Covers manufacturing defects and component failures. Excludes wear parts and damage from improper use. Extended support available.' WHERE brand = 'Prusa Research';

-- Creality: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects for non-consumable parts. Nozzles, PTFE tubes, and build surfaces excluded. 30-day return policy.' WHERE brand = 'Creality';

-- Anycubic: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers defects in materials and manufacturing. Consumable parts excluded. Technical support available via email and online.' WHERE brand = 'Anycubic';

-- Elegoo: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects and component failures. Excludes consumables and user-caused damage. Lifetime technical support.' WHERE brand = 'Elegoo';

-- FlashForge: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects. Consumable components (nozzles, build plates) excluded. Professional support available.' WHERE brand = 'FlashForge';

-- Raise3D: 1 year warranty (2 years in EU)
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects and hardware failures. Professional-grade support with optional extended warranty plans.' WHERE brand = 'Raise3D';

-- UltiMaker: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects in materials and workmanship. Excludes consumables. Professional support included.' WHERE brand = 'UltiMaker';

-- Snapmaker: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers defects in materials and workmanship. Laser and CNC modules included. Consumables excluded.' WHERE brand = 'Snapmaker';

-- Sovol: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects for printer components. Consumable parts excluded. Email and community support.' WHERE brand = 'Sovol';

-- QIDI Tech: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects and hardware malfunctions. Lifetime technical support via email and chat.' WHERE brand = 'QIDI Tech';

-- Markforged: 1 year warranty (varies by product)
UPDATE public.printer_brands SET warranty_coverage = 'Professional warranty covering manufacturing defects. Extended service plans available. Enterprise support included.' WHERE brand = 'Markforged';

-- AnkerMake: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects in materials and workmanship. Consumable parts excluded. Anker support network.' WHERE brand = 'AnkerMake';

-- FLSUN: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects for non-consumable parts. Technical support available via email.' WHERE brand = 'FLSUN';

-- LDO Motors: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects in motors and kit components. Community support available.' WHERE brand = 'LDO Motors';

-- RatRig: 1 year warranty
UPDATE public.printer_brands SET warranty_coverage = 'Covers manufacturing defects in frame and components. Kit-based support with active community.' WHERE brand = 'RatRig';

-- Voron Design: Community/DIY (no manufacturer warranty)
UPDATE public.printer_brands SET warranty_years = NULL, warranty_coverage = NULL WHERE brand = 'Voron Design';