-- Create functions needed by automated_brands

-- Function: link filaments to brands
CREATE OR REPLACE FUNCTION link_filaments_to_brands()
RETURNS void AS $$
BEGIN
  -- This is a placeholder - the actual linking happens via vendor name matching
  RAISE NOTICE 'Link filaments to brands executed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Update brand product counts
CREATE OR REPLACE FUNCTION update_brand_product_counts(p_brand_slug text DEFAULT NULL)
RETURNS void AS $$
BEGIN
  IF p_brand_slug IS NOT NULL THEN
    UPDATE automated_brands ab
    SET
      product_count = counts.total,
      active_product_count = counts.active,
      products_with_urls = counts.with_urls
    FROM (
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN product_url IS NOT NULL THEN 1 END) as with_urls
      FROM filaments
      WHERE LOWER(vendor) = LOWER((SELECT brand_name FROM automated_brands WHERE brand_slug = p_brand_slug))
    ) counts
    WHERE ab.brand_slug = p_brand_slug;
  ELSE
    UPDATE automated_brands ab
    SET
      product_count = COALESCE(counts.total, 0),
      active_product_count = COALESCE(counts.active, 0),
      products_with_urls = COALESCE(counts.with_urls, 0)
    FROM (
      SELECT
        ab2.id,
        COUNT(f.*) as total,
        COUNT(CASE WHEN f.variant_available = true THEN 1 END) as active,
        COUNT(CASE WHEN f.product_url IS NOT NULL THEN 1 END) as with_urls
      FROM automated_brands ab2
      LEFT JOIN filaments f ON LOWER(f.vendor) = LOWER(ab2.brand_name)
      GROUP BY ab2.id
    ) counts
    WHERE ab.id = counts.id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function: Record scrape result
CREATE OR REPLACE FUNCTION record_scrape_result(
  p_brand_slug text,
  p_success boolean,
  p_duration_seconds numeric,
  p_products_processed integer DEFAULT 0,
  p_products_updated integer DEFAULT 0,
  p_error_message text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE automated_brands
  SET
    last_scrape_at = NOW(),
    next_scrape_at = NOW() + (scrape_frequency_hours || ' hours')::interval,
    scraping_active = false,
    total_scrapes = total_scrapes + 1,
    successful_scrapes = CASE WHEN p_success THEN successful_scrapes + 1 ELSE successful_scrapes END,
    failed_scrapes = CASE WHEN NOT p_success THEN failed_scrapes + 1 ELSE failed_scrapes END,
    avg_scrape_duration_seconds = CASE
      WHEN avg_scrape_duration_seconds IS NULL THEN p_duration_seconds
      ELSE (avg_scrape_duration_seconds + p_duration_seconds) / 2
    END,
    last_error = CASE WHEN NOT p_success THEN p_error_message ELSE NULL END,
    last_error_at = CASE WHEN NOT p_success THEN NOW() ELSE last_error_at END
  WHERE brand_slug = p_brand_slug;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Seed all 37+ brands
INSERT INTO automated_brands (brand_name, brand_slug, display_name, platform_type, base_url, default_currency, has_api, scraping_enabled) VALUES
('Prusament', 'prusament', 'Prusament', 'shopify', 'https://www.prusa3d.com', 'USD', true, true),
('3D-Fuel', '3d-fuel', '3D Fuel', 'shopify', 'https://www.3dfuel.com', 'USD', true, true),
('Polymaker', 'polymaker', 'Polymaker', 'shopify', 'https://us.polymaker.com', 'USD', true, true),
('ColorFabb', 'colorfabb', 'ColorFabb', 'shopify', 'https://colorfabb.com', 'EUR', true, true),
('Proto-Pasta', 'proto-pasta', 'Proto-Pasta', 'shopify', 'https://www.proto-pasta.com', 'USD', true, true),
('Fillamentum', 'fillamentum', 'Fillamentum', 'shopify', 'https://fillamentum.com', 'EUR', true, true),
('Atomic Filament', 'atomic-filament', 'Atomic Filament', 'shopify', 'https://atomicfilament.com', 'USD', true, true),
('Push Plastic', 'push-plastic', 'Push Plastic', 'shopify', 'https://www.pushplastic.com', 'USD', true, true),
('Fusion Filaments', 'fusion-filaments', 'Fusion Filaments', 'shopify', 'https://fusionfilaments.com', 'USD', true, true),
('NinjaTek', 'ninjatek', 'NinjaTek', 'shopify', 'https://ninjatek.com', 'USD', true, true),
('Recreus', 'recreus', 'Recreus', 'shopify', 'https://recreus.com', 'EUR', true, true),
('Extrudr', 'extrudr', 'Extrudr', 'shopify', 'https://www.extrudr.com', 'EUR', true, true),
('Fiberlogy', 'fiberlogy', 'Fiberlogy', 'shopify', 'https://fiberlogy.com', 'EUR', true, true),
('Ultimaker', 'ultimaker', 'Ultimaker', 'shopify', 'https://ultimaker.com', 'USD', true, true),
('Printed Solid', 'printed-solid', 'Printed Solid', 'shopify', 'https://www.printedsolid.com', 'USD', true, true),
('Bambu Lab', 'bambu-lab', 'Bambu Lab', 'shopify', 'https://store.bambulab.com', 'USD', true, true),
('Anycubic', 'anycubic', 'Anycubic', 'shopify', 'https://store.anycubic.com', 'USD', true, true),
('Elegoo', 'elegoo', 'Elegoo', 'shopify', 'https://www.elegoo.com', 'USD', true, true),
('Creality', 'creality', 'Creality', 'shopify', 'https://store.creality.com', 'USD', true, true),
('Sunlu', 'sunlu', 'Sunlu', 'shopify', 'https://www.sunlu.com', 'USD', true, true),
('Amolen', 'amolen', 'Amolen', 'shopify', 'https://amolen.com', 'USD', true, true),
('eSun', 'esun', 'eSun', 'shopify', 'https://www.esun3d.com', 'USD', true, true),
('Eryone', 'eryone', 'Eryone', 'shopify', 'https://eryone3d.com', 'USD', true, true),
('VoxelPLA', 'voxelpla', 'VoxelPLA', 'shopify', 'https://voxelpla.com', 'USD', true, true),
('Matter3D', 'matter3d', 'Matter3D', 'shopify', 'https://matter3d.com', 'CAD', true, true),
('Taulman3D', 'taulman3d', 'Taulman3D', 'shopify', 'https://taulman3d.com', 'USD', true, true),
('Siraya Tech', 'siraya-tech', 'Siraya Tech', 'shopify', 'https://siraya.tech', 'USD', true, true),
('Hatchbox', 'hatchbox', 'Hatchbox', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('Ziro', 'ziro', 'Ziro', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('Paramount 3D', 'paramount-3d', 'Paramount 3D', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('GEEETECH', 'geeetech', 'GEEETECH', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('TECBEARS', 'tecbears', 'TECBEARS', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('TTYT3D', 'ttyt3d', 'TTYT3D', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('Overture 3D', 'overture-3d', 'Overture 3D', 'woocommerce', 'https://overture3d.com', 'USD', false, true),
('3DXTech', '3dxtech', '3DXTech', 'bigcommerce', 'https://www.3dxtech.com', 'USD', false, true),
('FormFutura', 'formfutura', 'FormFutura', 'firecrawl', 'https://formfutura.com', 'EUR', false, true),
('MatterHackers', 'matterhackers', 'MatterHackers', 'firecrawl', 'https://www.matterhackers.com', 'USD', false, true),
('Inland', 'inland', 'Inland', 'firecrawl', 'https://www.microcenter.com', 'USD', false, true),
('Prusa', 'prusa', 'Prusa', 'shopify', 'https://www.prusa3d.com', 'USD', true, true),
('IC3D Printers', 'ic3d-printers', 'IC3D Printers', 'woocommerce', 'https://www.ic3dprinters.com', 'USD', false, true),
('Spectrum Filaments', 'spectrum', 'Spectrum Filaments', 'shopify', 'https://spectrumfilaments.com', 'EUR', true, true),
('3DHoJor', '3dhojor', '3DHoJor', 'shopify', 'https://www.3dhojor.com', 'USD', true, true),
('DURAMIC 3D', 'duramic', 'DURAMIC 3D', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('Kingroon', 'kingroon', 'Kingroon', 'shopify', 'https://kingroon.com', 'USD', true, true),
('Sovol', 'sovol', 'Sovol', 'shopify', 'https://sovol3d.com', 'USD', true, true),
('FlashForge', 'flashforge', 'FlashForge', 'shopify', 'https://www.flashforge.com', 'USD', true, true),
('NuMakers', 'numakers', 'NuMakers', 'shopify', 'https://numakers.com', 'CAD', true, true),
('AzureFilm', 'azurefilm', 'AzureFilm', 'shopify', 'https://azurefilm.com', 'EUR', true, true),
('CC3D', 'cc3d', 'CC3D', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('Gizmo Dorks', 'gizmo-dorks', 'Gizmo Dorks', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('Yousu', 'yousu', 'Yousu', 'amazon', 'https://www.amazon.com', 'USD', false, true),
('SainSmart', 'sainsmart', 'SainSmart', 'shopify', 'https://www.sainsmart.com', 'USD', true, true),
('Filaments.ca', 'filaments-ca', 'Filaments.ca', 'shopify', 'https://filaments.ca', 'CAD', true, true),
('GST3D', 'gst3d', 'GST3D', 'shopify', 'https://www.gst3d.com', 'USD', true, true),
('Treed Filaments', 'treed', 'Treed Filaments', 'shopify', 'https://treedfilaments.com', 'EUR', true, true)
ON CONFLICT (brand_slug) DO NOTHING;

-- Update product counts for all brands
SELECT update_brand_product_counts();
