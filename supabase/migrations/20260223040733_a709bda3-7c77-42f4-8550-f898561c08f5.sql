-- Add discontinued_note column
ALTER TABLE printers ADD COLUMN IF NOT EXISTS discontinued_note TEXT;