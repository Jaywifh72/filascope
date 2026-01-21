-- Add camera and imaging columns
ALTER TABLE printers ADD COLUMN IF NOT EXISTS camera_type TEXT;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS camera_resolution TEXT;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS camera_count INTEGER;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS timelapse_supported BOOLEAN;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS ai_camera_features TEXT;

-- Add layer height columns (in micrometers for precision)
ALTER TABLE printers ADD COLUMN IF NOT EXISTS layer_height_min_um NUMERIC;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS layer_height_max_um NUMERIC;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS layer_height_default_um NUMERIC;

-- Add positioning accuracy columns
ALTER TABLE printers ADD COLUMN IF NOT EXISTS xy_positioning_accuracy_um NUMERIC;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS z_positioning_accuracy_um NUMERIC;
ALTER TABLE printers ADD COLUMN IF NOT EXISTS repeatability_um NUMERIC;

-- Add comments for documentation
COMMENT ON COLUMN printers.camera_type IS 'Type of built-in camera (AI Camera, USB Webcam, etc.)';
COMMENT ON COLUMN printers.camera_resolution IS 'Camera resolution (720P, 1080P, 4K)';
COMMENT ON COLUMN printers.camera_count IS 'Number of cameras installed';
COMMENT ON COLUMN printers.timelapse_supported IS 'Whether timelapse recording is supported';
COMMENT ON COLUMN printers.ai_camera_features IS 'AI camera features like spaghetti detection, first layer inspection';
COMMENT ON COLUMN printers.layer_height_min_um IS 'Minimum layer height in micrometers (50 = 0.05mm)';
COMMENT ON COLUMN printers.layer_height_max_um IS 'Maximum layer height in micrometers (350 = 0.35mm)';
COMMENT ON COLUMN printers.layer_height_default_um IS 'Default/recommended layer height in micrometers';
COMMENT ON COLUMN printers.xy_positioning_accuracy_um IS 'XY positioning accuracy in micrometers';
COMMENT ON COLUMN printers.z_positioning_accuracy_um IS 'Z positioning accuracy in micrometers';
COMMENT ON COLUMN printers.repeatability_um IS 'Repeatability tolerance in micrometers';