-- Adding direct filament linkage to supplement fuzzy text matching

ALTER TABLE td_reference_values
  ADD COLUMN filament_id uuid;

ALTER TABLE td_reference_values
  ADD CONSTRAINT fk_td_reference_values_filament
  FOREIGN KEY (filament_id) REFERENCES filaments(id) ON DELETE SET NULL;

CREATE INDEX idx_td_reference_values_filament_id
  ON td_reference_values(filament_id)
  WHERE filament_id IS NOT NULL;

COMMENT ON COLUMN td_reference_values.filament_id IS 'Direct FK to filaments table, supplements fuzzy brand_name/color_name matching';