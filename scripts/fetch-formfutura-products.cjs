#!/usr/bin/env node
/**
 * Pre-fetch FormFutura filament products using a curated product catalog.
 *
 * FormFutura is a Dutch filament manufacturer running on an Odoo platform —
 * no Shopify /products.json endpoint available. This script uses a manually
 * curated product list based on their formfutura.com storefront.
 *
 * Usage:
 *   node scripts/fetch-formfutura-products.cjs
 *
 * Output:
 *   scripts/formfutura-products.json      (raw data)
 *   public/data/formfutura-products.json   (for browser-side sync)
 */
const fs = require('fs');
const path = require('path');

// FormFutura product catalog - curated from formfutura.com
// Prices in EUR, diameter 1.75mm, spool weights vary by product line
const FORMFUTURA_PRODUCTS = [
  // ── EasyFil ePLA ──────────────────────────────────────────────
  { title: 'FormFutura EasyFil ePLA Filament 1.75mm', handle: 'easyfil-epla', material: 'PLA', price: '24.95', weight: 750,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Natural', 'Purple'] },

  // ── EasyFil ePETG ─────────────────────────────────────────────
  { title: 'FormFutura EasyFil ePETG Filament 1.75mm', handle: 'easyfil-epetg', material: 'PETG', price: '29.95', weight: 750,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey', 'Clear'] },

  // ── EasyFil eABS ──────────────────────────────────────────────
  { title: 'FormFutura EasyFil eABS Filament 1.75mm', handle: 'easyfil-eabs', material: 'ABS', price: '29.95', weight: 750,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey'] },

  // ── EasyFil eASA ──────────────────────────────────────────────
  { title: 'FormFutura EasyFil eASA Filament 1.75mm', handle: 'easyfil-easa', material: 'ASA', price: '34.95', weight: 750,
    colors: ['Black', 'White', 'Red', 'Blue', 'Grey', 'Natural', 'Orange'] },

  // ── EasyFil ePP ───────────────────────────────────────────────
  { title: 'FormFutura EasyFil ePP Filament 1.75mm', handle: 'easyfil-epp', material: 'PP', price: '49.95', weight: 500,
    colors: ['Natural', 'Black', 'White'] },

  // ── EasyFil ePC ───────────────────────────────────────────────
  { title: 'FormFutura EasyFil ePC Filament 1.75mm', handle: 'easyfil-epc', material: 'PC', price: '59.95', weight: 750,
    colors: ['Natural', 'Black', 'White'] },

  // ── FlexiFil ──────────────────────────────────────────────────
  { title: 'FormFutura FlexiFil Filament 1.75mm', handle: 'flexifil', material: 'TPU', price: '39.95', weight: 500,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Natural'] },

  // ── CarbonFil ─────────────────────────────────────────────────
  { title: 'FormFutura CarbonFil Filament 1.75mm', handle: 'carbonfil', material: 'PLA-CF', price: '49.95', weight: 500,
    colors: ['Black'] },

  // ── MetalFil Classic Copper ───────────────────────────────────
  { title: 'FormFutura MetalFil Classic Copper Filament 1.75mm', handle: 'metalfil-classic-copper', material: 'Metal PLA', price: '44.95', weight: 750,
    colors: ['Classic Copper'] },

  // ── MetalFil Bronze ───────────────────────────────────────────
  { title: 'FormFutura MetalFil Bronze Filament 1.75mm', handle: 'metalfil-bronze', material: 'Metal PLA', price: '44.95', weight: 750,
    colors: ['Ancient Bronze'] },

  // ── StoneFil ──────────────────────────────────────────────────
  { title: 'FormFutura StoneFil Filament 1.75mm', handle: 'stonefil', material: 'Stone PLA', price: '44.95', weight: 500,
    colors: ['Pottery Clay', 'Granite', 'Terracotta', 'Concrete Grey'] },

  // ── TitanX ────────────────────────────────────────────────────
  { title: 'FormFutura TitanX Filament 1.75mm', handle: 'titanx', material: 'ABS', price: '29.95', weight: 750,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Orange', 'Grey'] },

  // ── ApolloX ───────────────────────────────────────────────────
  { title: 'FormFutura ApolloX Filament 1.75mm', handle: 'apollox', material: 'ASA', price: '34.95', weight: 750,
    colors: ['Black', 'White', 'Red', 'Blue', 'Grey', 'Natural', 'Yellow', 'Orange'] },

  // ── Atlas Support ─────────────────────────────────────────────
  { title: 'FormFutura Atlas Support Filament 1.75mm', handle: 'atlas-support', material: 'PVA', price: '49.95', weight: 300,
    colors: ['Natural'] },

  // ── Helios Support ────────────────────────────────────────────
  { title: 'FormFutura Helios Support Filament 1.75mm', handle: 'helios-support', material: 'HIPS', price: '29.95', weight: 750,
    colors: ['Natural', 'Black'] },

  // ── ReForm rPLA ───────────────────────────────────────────────
  { title: 'FormFutura ReForm rPLA Filament 1.75mm', handle: 'reform-rpla', material: 'PLA', price: '22.95', weight: 750,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Off-White', 'Orange'] },

  // ── ReForm rPETG ──────────────────────────────────────────────
  { title: 'FormFutura ReForm rPETG Filament 1.75mm', handle: 'reform-rpetg', material: 'PETG', price: '27.95', weight: 750,
    colors: ['Black', 'White', 'Grey', 'Red', 'Blue', 'Green', 'Clear'] },

  // ── Python Flex ───────────────────────────────────────────────
  { title: 'FormFutura Python Flex Filament 1.75mm', handle: 'python-flex', material: 'TPU', price: '39.95', weight: 500,
    colors: ['Black', 'White', 'Red', 'Blue', 'Natural'] },

  // ── Centaur PP ────────────────────────────────────────────────
  { title: 'FormFutura Centaur PP Filament 1.75mm', handle: 'centaur-pp', material: 'PP', price: '49.95', weight: 500,
    colors: ['Natural', 'Black', 'White'] },

  // ── Volcano PLA ───────────────────────────────────────────────
  { title: 'FormFutura Volcano PLA Filament 1.75mm', handle: 'volcano-pla', material: 'PLA', price: '24.95', weight: 750,
    colors: ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Grey', 'Orange'] },

  // ── Galaxy PLA ────────────────────────────────────────────────
  { title: 'FormFutura Galaxy PLA Filament 1.75mm', handle: 'galaxy-pla', material: 'Glitter PLA', price: '29.95', weight: 750,
    colors: ['Black', 'Blue', 'Green', 'Red', 'Purple', 'Silver'] },

  // ── Silk Gloss PLA ────────────────────────────────────────────
  { title: 'FormFutura Silk Gloss PLA Filament 1.75mm', handle: 'silk-gloss-pla', material: 'Silk PLA', price: '29.95', weight: 750,
    colors: ['Gold', 'Silver', 'Copper', 'Bronze', 'Red', 'Blue', 'Green', 'White'] },

  // ── PCTG ──────────────────────────────────────────────────────
  { title: 'FormFutura PCTG Filament 1.75mm', handle: 'pctg', material: 'PCTG', price: '34.95', weight: 750,
    colors: ['Black', 'White', 'Clear', 'Grey', 'Red', 'Blue'] },
];

function main() {
  console.log('Building FormFutura product catalog (curated)...');

  // Expand product lines with color variants into individual Shopify-format products
  const products = [];
  let idCounter = 1;

  for (const entry of FORMFUTURA_PRODUCTS) {
    const colors = entry.colors || ['Default'];

    for (const color of colors) {
      const colorSlug = color.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+$/, '');
      const handle = `${entry.handle}-${colorSlug}`;
      const title = color !== 'Default'
        ? `${entry.title.replace(' Filament 1.75mm', '')} ${color} Filament 1.75mm`
        : entry.title;

      products.push({
        id: idCounter * 1000,
        title,
        handle,
        product_type: entry.material,
        vendor: 'FormFutura',
        tags: entry.material,
        variants: [{
          id: idCounter * 1000 + 1,
          title: color,
          price: entry.price,
          compare_at_price: null,
          sku: `FORMFUTURA-${handle}`,
          option1: color,
          option2: null,
          option3: null,
          available: true,
          grams: entry.weight,
        }],
        options: [{ name: 'Color', position: 1, values: [color] }],
        images: [],
        body_html: '',
        published_at: new Date().toISOString(),
      });

      idCounter++;
    }
  }

  console.log(`Total products (with color variants): ${products.length}`);

  // Material distribution
  const materials = {};
  for (const p of products) {
    materials[p.product_type] = (materials[p.product_type] || 0) + 1;
  }
  console.log('\nMaterial distribution:');
  for (const [mat, count] of Object.entries(materials).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${mat}: ${count}`);
  }

  // Save to scripts/
  const outPath = path.join(__dirname, 'formfutura-products.json');
  const output = {
    products,
    excluded: 0,
    fetchedAt: new Date().toISOString(),
    source: 'formfutura-catalog-curated',
    currency: 'EUR',
  };
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\nSaved to: ${outPath}`);

  // Save to public/data/
  const publicDir = path.join(__dirname, '..', 'public', 'data');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  const publicPath = path.join(publicDir, 'formfutura-products.json');
  fs.writeFileSync(publicPath, JSON.stringify(output, null, 2));
  console.log(`Copied to: ${publicPath}`);
}

main();
