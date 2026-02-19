import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ProductGallery } from '@/components/ui/product-gallery';

interface FilamentHeroGalleryProps {
  images: (string | null | undefined)[];
  productTitle: string;
  colorHex?: string | null;
  brand?: string | null;
  material?: string | null;
  colorFamily?: string | null;
  colorVariants?: Array<{
    id: string;
    color_hex: string | null;
    product_title: string;
    featured_image?: string | null;
  }>;
  onSelectColor?: (variant: any) => void;
  selectedColorHex?: string | null;
}

export function FilamentHeroGallery({ 
  images, 
  productTitle, 
  colorHex,
  brand,
  material,
  colorFamily,
  colorVariants,
  onSelectColor,
  selectedColorHex,
}: FilamentHeroGalleryProps) {
  // Filter out null/undefined images
  const validImages = images.filter((img): img is string => !!img);
  
  // Build descriptive alt text for SEO
  const altText = [brand, productTitle, colorFamily, material, '3D printer filament spool']
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 125);

  // Convert to gallery image format
  const galleryImages = validImages.map(url => ({
    url,
    alt: altText || productTitle,
  }));

  // Build color swatches from variants
  const colorSwatches = colorVariants?.map(variant => ({
    hex: variant.color_hex || '#888888',
    name: variant.product_title,
    hasImage: !!variant.featured_image,
  }));

  const handleColorSwatchClick = (hex: string) => {
    if (onSelectColor && colorVariants) {
      const variant = colorVariants.find(v => v.color_hex === hex);
      if (variant) {
        onSelectColor(variant);
      }
    }
  };

  return (
    <ProductGallery
      images={galleryImages}
      productTitle={productTitle}
      fallbackColorHex={colorHex}
      colorSwatches={colorSwatches}
      selectedColorHex={selectedColorHex}
      onColorSwatchClick={onSelectColor ? handleColorSwatchClick : undefined}
    />
  );
}
