import { Helmet } from 'react-helmet-async';

interface ProductJsonLdProps {
  name: string;
  description: string;
  image?: string | null;
  brand?: string | null;
  sku?: string | null;
  gtin?: string | null;
  mpn?: string | null;
  material?: string | null;
  color?: string | null;
  url: string;
  price?: number | null;
  currency?: string;
  availability?: boolean;
  // Technical specs for additionalProperty
  transmissionDistance?: number | null;
  nozzleTempMin?: number | null;
  nozzleTempMax?: number | null;
  bedTempMin?: number | null;
  bedTempMax?: number | null;
  tensileStrength?: number | null;
  printSpeedMax?: number | null;
  weightGrams?: number | null;
  diameter?: number | null;
}

export function ProductJsonLd({
  name,
  description,
  image,
  brand,
  sku,
  gtin,
  mpn,
  material,
  color,
  url,
  price,
  currency = 'USD',
  availability = true,
  transmissionDistance,
  nozzleTempMin,
  nozzleTempMax,
  bedTempMin,
  bedTempMax,
  tensileStrength,
  printSpeedMax,
  weightGrams,
  diameter,
}: ProductJsonLdProps) {
  // Build additionalProperty array for technical specs
  const additionalProperties: Array<{
    '@type': 'PropertyValue';
    name: string;
    value: string | number;
    unitCode?: string;
    description?: string;
  }> = [];

  // TD Value for HueForge - critical for SEO targeting
  if (transmissionDistance) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'HueForge Transmission Distance (TD)',
      value: transmissionDistance,
      unitCode: 'MMT',
      description: 'Light transmission value for HueForge lithophane and multicolor printing',
    });
    
    // Add HueForge compatibility indicator
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'HueForge Compatibility',
      value: 'Verified Compatible',
    });
  }

  // Temperature ranges
  if (nozzleTempMin && nozzleTempMax) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Nozzle Temperature Range',
      value: `${nozzleTempMin}-${nozzleTempMax}`,
      unitCode: 'CEL',
    });
  }

  if (bedTempMin && bedTempMax) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Bed Temperature Range',
      value: `${bedTempMin}-${bedTempMax}`,
      unitCode: 'CEL',
    });
  }

  // Mechanical properties
  if (tensileStrength) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Tensile Strength',
      value: tensileStrength,
      unitCode: 'MPA',
    });
  }

  // Print speed
  if (printSpeedMax) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Maximum Print Speed',
      value: printSpeedMax,
      unitCode: 'MMT', // millimeters per second
    });
  }

  // Weight
  if (weightGrams) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Net Weight',
      value: weightGrams,
      unitCode: 'GRM',
    });
  }

  // Diameter
  if (diameter) {
    additionalProperties.push({
      '@type': 'PropertyValue',
      name: 'Filament Diameter',
      value: diameter,
      unitCode: 'MMT',
    });
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    ...(image && { image }),
    ...(brand && {
      brand: {
        '@type': 'Brand',
        name: brand,
      },
    }),
    category: `3D Printer Filament${material ? ` - ${material}` : ''}`,
    ...(material && { material }),
    ...(color && { color }),
    ...(sku && { sku }),
    ...(gtin && { gtin13: gtin }),
    ...(mpn && { mpn }),
    url,
    ...(additionalProperties.length > 0 && { additionalProperty: additionalProperties }),
    ...(price && {
      offers: {
        '@type': 'Offer',
        priceCurrency: currency,
        price: price.toFixed(2),
        availability: availability
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
        url,
      },
    }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
