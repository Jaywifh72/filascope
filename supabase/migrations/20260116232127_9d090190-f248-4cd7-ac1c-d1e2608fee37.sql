-- Add comprehensive TDS specification columns to filaments table
-- These fields capture granular technical data from manufacturer TDS documents

-- Thermal Properties
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS melt_index_g_10min NUMERIC;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS vicat_softening_temp_c INTEGER;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS hdt_045_mpa_c INTEGER;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS hdt_18_mpa_c INTEGER;

-- Moisture Properties  
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS water_absorption_percent NUMERIC;

-- Mechanical Properties - Impact
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS impact_strength_kj_m2 NUMERIC;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS notched_izod_j_m NUMERIC;

-- Mechanical Properties - Z Direction (layer adhesion)
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS tensile_strength_z_mpa NUMERIC;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS tensile_modulus_z_mpa NUMERIC;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS elongation_break_z_percent NUMERIC;

-- Bending/Flexural Properties
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS bending_modulus_mpa NUMERIC;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS bending_strength_mpa NUMERIC;

-- Print Quality Parameters
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS max_overhang_angle_deg INTEGER;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS max_bridging_length_mm INTEGER;

-- Retraction Settings
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS retraction_length_mm NUMERIC;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS retraction_speed_mms INTEGER;

-- Annealing/Post-Processing
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS annealing_temp_c INTEGER;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS annealing_time_hours NUMERIC;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS shrinkage_annealed_percent NUMERIC;

-- Chemical Resistance (JSONB for flexible key-value pairs)
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS chemical_resistance JSONB;

-- Additional Mechanical
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS hardness_shore_a INTEGER;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS youngs_modulus_mpa NUMERIC;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS poissons_ratio NUMERIC;

-- Electrical Properties (for ESD/conductive materials)
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS surface_resistivity_ohm NUMERIC;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS volume_resistivity_ohm_cm NUMERIC;

-- Optical Properties (for transparent/translucent materials)
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS light_transmission_percent NUMERIC;
ALTER TABLE public.filaments ADD COLUMN IF NOT EXISTS haze_percent NUMERIC;

-- Comments for documentation
COMMENT ON COLUMN public.filaments.melt_index_g_10min IS 'Melt Flow Index at 190°C/2.16kg (g/10min)';
COMMENT ON COLUMN public.filaments.vicat_softening_temp_c IS 'Vicat Softening Temperature (°C)';
COMMENT ON COLUMN public.filaments.hdt_045_mpa_c IS 'Heat Deflection Temperature at 0.45 MPa (°C)';
COMMENT ON COLUMN public.filaments.hdt_18_mpa_c IS 'Heat Deflection Temperature at 1.8 MPa (°C)';
COMMENT ON COLUMN public.filaments.water_absorption_percent IS 'Saturated Water Absorption Rate (%)';
COMMENT ON COLUMN public.filaments.impact_strength_kj_m2 IS 'Charpy Impact Strength (kJ/m²)';
COMMENT ON COLUMN public.filaments.notched_izod_j_m IS 'Notched Izod Impact Strength (J/m)';
COMMENT ON COLUMN public.filaments.tensile_strength_z_mpa IS 'Tensile Strength in Z direction (MPa)';
COMMENT ON COLUMN public.filaments.tensile_modulus_z_mpa IS 'Tensile Modulus in Z direction (MPa)';
COMMENT ON COLUMN public.filaments.elongation_break_z_percent IS 'Elongation at Break in Z direction (%)';
COMMENT ON COLUMN public.filaments.bending_modulus_mpa IS 'Flexural/Bending Modulus (MPa)';
COMMENT ON COLUMN public.filaments.bending_strength_mpa IS 'Flexural/Bending Strength (MPa)';
COMMENT ON COLUMN public.filaments.max_overhang_angle_deg IS 'Maximum Overhang Angle without supports (degrees)';
COMMENT ON COLUMN public.filaments.max_bridging_length_mm IS 'Maximum Bridging Length (mm)';
COMMENT ON COLUMN public.filaments.retraction_length_mm IS 'Recommended Retraction Length (mm)';
COMMENT ON COLUMN public.filaments.retraction_speed_mms IS 'Recommended Retraction Speed (mm/s)';
COMMENT ON COLUMN public.filaments.annealing_temp_c IS 'Recommended Annealing Temperature (°C)';
COMMENT ON COLUMN public.filaments.annealing_time_hours IS 'Recommended Annealing Time (hours)';
COMMENT ON COLUMN public.filaments.shrinkage_annealed_percent IS 'Shrinkage after Annealing (%)';
COMMENT ON COLUMN public.filaments.chemical_resistance IS 'Chemical resistance ratings as JSONB';
COMMENT ON COLUMN public.filaments.hardness_shore_a IS 'Shore A Hardness (for flexible materials)';
COMMENT ON COLUMN public.filaments.youngs_modulus_mpa IS 'Youngs Modulus (MPa)';
COMMENT ON COLUMN public.filaments.poissons_ratio IS 'Poissons Ratio';
COMMENT ON COLUMN public.filaments.surface_resistivity_ohm IS 'Surface Resistivity (Ohm) for ESD materials';
COMMENT ON COLUMN public.filaments.volume_resistivity_ohm_cm IS 'Volume Resistivity (Ohm·cm) for ESD materials';
COMMENT ON COLUMN public.filaments.light_transmission_percent IS 'Light Transmission (%) for transparent materials';
COMMENT ON COLUMN public.filaments.haze_percent IS 'Haze (%) for transparent materials';