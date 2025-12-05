-- First drop the existing constraint
ALTER TABLE printer_accessories DROP CONSTRAINT IF EXISTS printer_accessories_accessory_type_check;

-- Update all 'nozzle' records to 'hotend' FIRST
UPDATE printer_accessories SET accessory_type = 'hotend' WHERE accessory_type = 'nozzle';

-- Then add the new check constraint
ALTER TABLE printer_accessories ADD CONSTRAINT printer_accessories_accessory_type_check 
CHECK (accessory_type IN ('hotend', 'build_plate', 'ams_mmu'));