/**
 * Schema.org JSON-LD generation utilities for FilaScope
 * Provides structured data for SEO rich snippets and AI citation
 */

export function generateProductSchema(product: {
  name: string;
  brand: string;
  material?: string;
  weight?: string;
  price?: number;
  currency?: string;
  td?: number;
  diameter?: string;
  description?: string;
  image?: string;
  url: string;
  color?: string;
  available?: boolean;
}) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "brand": {
      "@type": "Brand",
      "name": product.brand
    },
    "url": product.url,
    "additionalProperty": []
  };

  // Material
  if (product.material) {
    schema.additionalProperty.push({
      "@type": "PropertyValue",
      "name": "Material",
      "value": product.material
    });
  }

  // Weight
  if (product.weight) {
    schema.additionalProperty.push({
      "@type": "PropertyValue",
      "name": "Weight",
      "value": product.weight
    });
  }

  // Diameter
  if (product.diameter) {
    schema.additionalProperty.push({
      "@type": "PropertyValue",
      "name": "Diameter",
      "value": product.diameter
    });
  }

  // Color
  if (product.color) {
    schema.color = product.color;
    schema.additionalProperty.push({
      "@type": "PropertyValue",
      "name": "Color",
      "value": product.color
    });
  }

  // HueForge TD (FilaScope's competitive moat!)
  if (product.td) {
    schema.additionalProperty.push({
      "@type": "PropertyValue",
      "name": "HueForge TD",
      "value": product.td,
      "unitText": "mm",
      "description": "Transmission Distance for HueForge lithophane printing"
    });
  }

  // Offers (pricing)
  if (product.price && product.currency) {
    schema.offers = [{
      "@type": "Offer",
      "price": product.price,
      "priceCurrency": product.currency,
      "availability": product.available !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }];
  }

  // Description
  if (product.description) {
    schema.description = product.description;
  }

  // Image
  if (product.image) {
    schema.image = product.image;
  }

  return schema;
}

export function generatePrinterSchema(printer: {
  name: string;
  manufacturer: string;
  buildVolume?: string;
  price?: number;
  currency?: string;
  nozzleSize?: string;
  description?: string;
  image?: string;
  url: string;
  available?: boolean;
}) {
  const schema: any = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": printer.name,
    "manufacturer": {
      "@type": "Organization",
      "name": printer.manufacturer
    },
    "url": printer.url,
    "additionalProperty": []
  };

  // Build Volume
  if (printer.buildVolume) {
    schema.additionalProperty.push({
      "@type": "PropertyValue",
      "name": "Build Volume",
      "value": printer.buildVolume
    });
  }

  // Nozzle Size
  if (printer.nozzleSize) {
    schema.additionalProperty.push({
      "@type": "PropertyValue",
      "name": "Nozzle Size",
      "value": printer.nozzleSize
    });
  }

  // Offers
  if (printer.price && printer.currency) {
    schema.offers = [{
      "@type": "Offer",
      "price": printer.price,
      "priceCurrency": printer.currency,
      "availability": printer.available !== false ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    }];
  }

  if (printer.description) {
    schema.description = printer.description;
  }

  if (printer.image) {
    schema.image = printer.image;
  }

  return schema;
}

export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  };
}

export function generateWebSiteSchema(url: string) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "url": url,
    "name": "FilaScope",
    "description": "The most comprehensive 3D printer filament comparison platform with 24,000+ filaments and HueForge TD values",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${url}?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "FilaScope",
      "url": url
    }
  };
}
