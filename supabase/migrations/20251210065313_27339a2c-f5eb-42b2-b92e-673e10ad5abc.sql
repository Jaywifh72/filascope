-- Add tds_url column to printer_accessories table for storing Technical Data Sheet links
ALTER TABLE printer_accessories ADD COLUMN IF NOT EXISTS tds_url text;