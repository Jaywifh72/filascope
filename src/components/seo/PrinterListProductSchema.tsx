import { useJsonLdMultiple } from './useJsonLd';
import type { Database } from '@/integrations/supabase/types';

type Printer = Database['public']['Tables']['printers']['Row'] & {
  brand: { brand: string } | null;
  series: { series_name: string } | null;
};

interface PrinterListProductSchemaProps {
  printers: Printer[];
}

function buildVolume(p: Printer): string | null {
  const w = p.build_volume_x_mm;
  const d = p.build_volume_y_mm;
  const h = p.build_volume_z_mm;
  if (!w && !d && !h) return null;
  return `${w ?? '?'} × ${d ?? '?'} × ${h ?? '?'} mm`;
}

function getFirstImage(p: Printer): string | null {
  try {
    const sd = p.scraped_data as Record<string, unknown> | null;
    const imgs = sd?.images as Record<string, unknown> | null;
    const arr = imgs?.product_images as string[] | null;
    return arr?.[0] ?? null;
  } catch {
    return null;
  }
}

export function PrinterListProductSchema({ printers }: PrinterListProductSchemaProps) {
  const schemas = printers.slice(0, 10).map((p) => {
    const name = `${p.brand?.brand || ''} ${p.model_name}`.trim();
    const image = getFirstImage(p);
    const volume = buildVolume(p);
    const price = p.current_price_usd_store || p.current_price_usd_amazon || p.msrp_usd;
    const url = `https://filascope.com/printers/${p.printer_id || p.id}`;

    const additionalProperty: Record<string, unknown>[] = [];
    if (volume) {
      additionalProperty.push({ '@type': 'PropertyValue', name: 'Build Volume', value: volume });
    }
    if (p.max_print_speed_mms) {
      additionalProperty.push({ '@type': 'PropertyValue', name: 'Max Print Speed', value: `${p.max_print_speed_mms} mm/s` });
    }
    if (p.has_enclosure != null) {
      additionalProperty.push({ '@type': 'PropertyValue', name: 'Enclosure', value: p.has_enclosure ? 'Yes' : 'No' });
    }
    if (p.multi_material_supported != null) {
      additionalProperty.push({ '@type': 'PropertyValue', name: 'Multi-filament System', value: p.multi_material_supported ? 'Yes' : 'No' });
    }
    if (p.printer_technology) {
      additionalProperty.push({ '@type': 'PropertyValue', name: 'Technology', value: p.printer_technology });
    }
    if (p.extruder_count && p.extruder_count > 1) {
      additionalProperty.push({ '@type': 'PropertyValue', name: 'Extruder Count', value: String(p.extruder_count) });
    }

    const modelDesc = [p.brand?.brand, p.model_name, p.printer_technology].filter(Boolean).join(' ');

    return {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name,
      url,
      ...(p.brand?.brand && {
        brand: { '@type': 'Brand', name: p.brand.brand },
      }),
      ...(modelDesc && { description: modelDesc }),
      ...(image && { image }),
      ...(price && {
        offers: {
          '@type': 'Offer',
          price: String(price),
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
          url,
        },
      }),
      ...(additionalProperty.length > 0 && { additionalProperty }),
    };
  });

  useJsonLdMultiple(schemas);
  return null;
}
