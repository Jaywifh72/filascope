import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NozzleData {
  name: string;
  brand: string;
  model: string;
  specs: {
    diameter_mm: number;
    material: string;
    max_temp_c?: number;
    hardened: boolean;
    wear_rating?: string;
    flow_rate?: string;
    coating?: string;
  };
  product_url: string;
  image_url?: string;
  price?: number;
  currency?: string;
  description?: string;
  compatible_printer_brands?: string[];
  compatible_hotend_types?: string[];
}

// OEM brand nozzles
const OEM_NOZZLES: Record<string, { nozzles: NozzleData[]; compatibility_pattern?: RegExp }> = {
  'Bambu Lab': {
    compatibility_pattern: /X1|P1|A1/i,
    nozzles: [
      { name: '0.2mm Stainless Steel Nozzle', brand: 'Bambu Lab', model: 'SS-0.2', specs: { diameter_mm: 0.2, material: 'stainless steel', max_temp_c: 300, hardened: true, wear_rating: 'High', flow_rate: 'Low' }, product_url: 'https://us.store.bambulab.com/products/0-2mm-stainless-steel-nozzle', image_url: 'https://us.store.bambulab.com/cdn/shop/files/US_0.2mm_stainless_steel_nozzle.png', price: 9.99, currency: 'USD', description: 'High-precision stainless steel nozzle for fine detail prints', compatible_printer_brands: ['Bambu Lab'], compatible_hotend_types: ['Bambu Lab Hotend'] },
      { name: '0.4mm Stainless Steel Nozzle', brand: 'Bambu Lab', model: 'SS-0.4', specs: { diameter_mm: 0.4, material: 'stainless steel', max_temp_c: 300, hardened: true, wear_rating: 'High', flow_rate: 'Standard' }, product_url: 'https://us.store.bambulab.com/products/0-4mm-stainless-steel-nozzle', image_url: 'https://us.store.bambulab.com/cdn/shop/files/US_0.4mm_stainless_steel_nozzle.png', price: 9.99, currency: 'USD', description: 'Standard stainless steel nozzle for everyday printing', compatible_printer_brands: ['Bambu Lab'], compatible_hotend_types: ['Bambu Lab Hotend'] },
      { name: '0.6mm Stainless Steel Nozzle', brand: 'Bambu Lab', model: 'SS-0.6', specs: { diameter_mm: 0.6, material: 'stainless steel', max_temp_c: 300, hardened: true, wear_rating: 'High', flow_rate: 'High' }, product_url: 'https://us.store.bambulab.com/products/0-6mm-stainless-steel-nozzle', image_url: 'https://us.store.bambulab.com/cdn/shop/files/US_0.6mm_stainless_steel_nozzle.png', price: 9.99, currency: 'USD', description: 'Larger nozzle for faster prints with good detail', compatible_printer_brands: ['Bambu Lab'], compatible_hotend_types: ['Bambu Lab Hotend'] },
      { name: '0.8mm Stainless Steel Nozzle', brand: 'Bambu Lab', model: 'SS-0.8', specs: { diameter_mm: 0.8, material: 'stainless steel', max_temp_c: 300, hardened: true, wear_rating: 'High', flow_rate: 'Very High' }, product_url: 'https://us.store.bambulab.com/products/0-8mm-stainless-steel-nozzle', image_url: 'https://us.store.bambulab.com/cdn/shop/files/US_0.8mm_stainless_steel_nozzle.png', price: 9.99, currency: 'USD', description: 'Large nozzle for rapid prototyping and vase mode', compatible_printer_brands: ['Bambu Lab'], compatible_hotend_types: ['Bambu Lab Hotend'] },
      { name: '0.2mm Hardened Steel Nozzle', brand: 'Bambu Lab', model: 'HS-0.2', specs: { diameter_mm: 0.2, material: 'hardened steel', max_temp_c: 300, hardened: true, wear_rating: 'Very High', flow_rate: 'Low' }, product_url: 'https://us.store.bambulab.com/products/0-2mm-hardened-steel-nozzle', image_url: 'https://us.store.bambulab.com/cdn/shop/files/US_0.2mm_hardened_steel_nozzle.png', price: 14.99, currency: 'USD', description: 'Hardened steel for abrasive filaments with fine detail', compatible_printer_brands: ['Bambu Lab'], compatible_hotend_types: ['Bambu Lab Hotend'] },
      { name: '0.4mm Hardened Steel Nozzle', brand: 'Bambu Lab', model: 'HS-0.4', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 300, hardened: true, wear_rating: 'Very High', flow_rate: 'Standard' }, product_url: 'https://us.store.bambulab.com/products/0-4mm-hardened-steel-nozzle', image_url: 'https://us.store.bambulab.com/cdn/shop/files/US_0.4mm_hardened_steel_nozzle.png', price: 14.99, currency: 'USD', description: 'Standard hardened steel nozzle for carbon fiber and glass filled filaments', compatible_printer_brands: ['Bambu Lab'], compatible_hotend_types: ['Bambu Lab Hotend'] },
      { name: '0.6mm Hardened Steel Nozzle', brand: 'Bambu Lab', model: 'HS-0.6', specs: { diameter_mm: 0.6, material: 'hardened steel', max_temp_c: 300, hardened: true, wear_rating: 'Very High', flow_rate: 'High' }, product_url: 'https://us.store.bambulab.com/products/0-6mm-hardened-steel-nozzle', image_url: 'https://us.store.bambulab.com/cdn/shop/files/US_0.6mm_hardened_steel_nozzle.png', price: 14.99, currency: 'USD', description: 'Larger hardened steel nozzle for fast abrasive filament printing', compatible_printer_brands: ['Bambu Lab'], compatible_hotend_types: ['Bambu Lab Hotend'] },
      { name: '0.8mm Hardened Steel Nozzle', brand: 'Bambu Lab', model: 'HS-0.8', specs: { diameter_mm: 0.8, material: 'hardened steel', max_temp_c: 300, hardened: true, wear_rating: 'Very High', flow_rate: 'Very High' }, product_url: 'https://us.store.bambulab.com/products/0-8mm-hardened-steel-nozzle', image_url: 'https://us.store.bambulab.com/cdn/shop/files/US_0.8mm_hardened_steel_nozzle.png', price: 14.99, currency: 'USD', description: 'Large hardened steel nozzle for rapid abrasive filament prints', compatible_printer_brands: ['Bambu Lab'], compatible_hotend_types: ['Bambu Lab Hotend'] },
    ],
  },
  'Prusa Research': {
    compatibility_pattern: /MK4|MK3|MINI|XL/i,
    nozzles: [
      { name: '0.25mm Brass Nozzle', brand: 'Prusa Research', model: 'V6-0.25', specs: { diameter_mm: 0.25, material: 'brass', max_temp_c: 280, hardened: false, wear_rating: 'Low', flow_rate: 'Very Low' }, product_url: 'https://www.prusa3d.com/product/e3d-brass-nozzle-for-mk4-mk3s-mini/', image_url: 'https://www.prusa3d.com/files/assets/img/products/prusa-nozzle-brass.jpg', price: 4.99, currency: 'USD', description: 'Ultra-fine brass nozzle for high detail prints', compatible_printer_brands: ['Prusa Research'], compatible_hotend_types: ['E3D V6', 'Prusa Nextruder'] },
      { name: '0.4mm Brass Nozzle', brand: 'Prusa Research', model: 'V6-0.4', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 280, hardened: false, wear_rating: 'Low', flow_rate: 'Standard' }, product_url: 'https://www.prusa3d.com/product/e3d-brass-nozzle-for-mk4-mk3s-mini/', image_url: 'https://www.prusa3d.com/files/assets/img/products/prusa-nozzle-brass.jpg', price: 4.99, currency: 'USD', description: 'Standard brass nozzle for everyday printing', compatible_printer_brands: ['Prusa Research'], compatible_hotend_types: ['E3D V6', 'Prusa Nextruder'] },
      { name: '0.6mm Brass Nozzle', brand: 'Prusa Research', model: 'V6-0.6', specs: { diameter_mm: 0.6, material: 'brass', max_temp_c: 280, hardened: false, wear_rating: 'Low', flow_rate: 'High' }, product_url: 'https://www.prusa3d.com/product/e3d-brass-nozzle-for-mk4-mk3s-mini/', image_url: 'https://www.prusa3d.com/files/assets/img/products/prusa-nozzle-brass.jpg', price: 4.99, currency: 'USD', description: 'Larger brass nozzle for faster prints', compatible_printer_brands: ['Prusa Research'], compatible_hotend_types: ['E3D V6', 'Prusa Nextruder'] },
      { name: '0.8mm Brass Nozzle', brand: 'Prusa Research', model: 'V6-0.8', specs: { diameter_mm: 0.8, material: 'brass', max_temp_c: 280, hardened: false, wear_rating: 'Low', flow_rate: 'Very High' }, product_url: 'https://www.prusa3d.com/product/e3d-brass-nozzle-for-mk4-mk3s-mini/', image_url: 'https://www.prusa3d.com/files/assets/img/products/prusa-nozzle-brass.jpg', price: 4.99, currency: 'USD', description: 'Large brass nozzle for rapid prototyping', compatible_printer_brands: ['Prusa Research'], compatible_hotend_types: ['E3D V6', 'Prusa Nextruder'] },
      { name: '0.4mm Hardened Steel Nozzle', brand: 'Prusa Research', model: 'HS-0.4', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 450, hardened: true, wear_rating: 'Very High', flow_rate: 'Standard' }, product_url: 'https://www.prusa3d.com/product/hardened-steel-nozzle-e3d/', image_url: 'https://www.prusa3d.com/files/assets/img/products/prusa-nozzle-hardened.jpg', price: 24.99, currency: 'USD', description: 'Hardened steel nozzle for abrasive materials', compatible_printer_brands: ['Prusa Research'], compatible_hotend_types: ['E3D V6', 'Prusa Nextruder'] },
    ],
  },
  'Creality': {
    compatibility_pattern: /K1|Ender|CR-/i,
    nozzles: [
      { name: '0.4mm Brass Nozzle', brand: 'Creality', model: 'MK8-0.4', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 260, hardened: false, wear_rating: 'Low', flow_rate: 'Standard' }, product_url: 'https://store.creality.com/products/high-quality-mk8-brass-nozzle-0-4mm-5-pcs', image_url: 'https://store.creality.com/cdn/shop/products/creality-mk8-brass-nozzle.jpg', price: 2.99, currency: 'USD', description: 'Standard MK8 brass nozzle', compatible_printer_brands: ['Creality'], compatible_hotend_types: ['MK8', 'Creality Spider'] },
      { name: '0.6mm Brass Nozzle', brand: 'Creality', model: 'MK8-0.6', specs: { diameter_mm: 0.6, material: 'brass', max_temp_c: 260, hardened: false, wear_rating: 'Low', flow_rate: 'High' }, product_url: 'https://store.creality.com/products/high-quality-mk8-brass-nozzle-0-6mm-5-pcs', image_url: 'https://store.creality.com/cdn/shop/products/creality-mk8-brass-nozzle.jpg', price: 2.99, currency: 'USD', description: 'Larger MK8 brass nozzle for faster prints', compatible_printer_brands: ['Creality'], compatible_hotend_types: ['MK8', 'Creality Spider'] },
      { name: '0.4mm Hardened Steel Nozzle', brand: 'Creality', model: 'HS-0.4', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 300, hardened: true, wear_rating: 'Very High', flow_rate: 'Standard' }, product_url: 'https://store.creality.com/products/hardened-steel-nozzle-0-4mm', image_url: 'https://store.creality.com/cdn/shop/products/creality-hardened-nozzle.jpg', price: 12.99, currency: 'USD', description: 'Hardened steel nozzle for abrasive filaments', compatible_printer_brands: ['Creality'], compatible_hotend_types: ['MK8', 'Creality Spider'] },
    ],
  },
  'Anycubic': {
    compatibility_pattern: /Kobra/i,
    nozzles: [
      { name: '0.4mm Brass Nozzle', brand: 'Anycubic', model: 'MK8-0.4', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 260, hardened: false, wear_rating: 'Low', flow_rate: 'Standard' }, product_url: 'https://www.anycubic.com/products/0-4mm-mk8-brass-nozzle-5pcs', image_url: 'https://www.anycubic.com/cdn/shop/products/anycubic-brass-nozzle.jpg', price: 3.99, currency: 'USD', description: 'Standard brass nozzle for Kobra series', compatible_printer_brands: ['Anycubic'], compatible_hotend_types: ['MK8'] },
      { name: '0.4mm Hardened Steel Nozzle', brand: 'Anycubic', model: 'HS-0.4', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 300, hardened: true, wear_rating: 'Very High', flow_rate: 'Standard' }, product_url: 'https://www.anycubic.com/products/hardened-steel-nozzle', image_url: 'https://www.anycubic.com/cdn/shop/products/anycubic-hardened-nozzle.jpg', price: 14.99, currency: 'USD', description: 'Hardened steel nozzle for abrasive filaments', compatible_printer_brands: ['Anycubic'], compatible_hotend_types: ['MK8'] },
    ],
  },
  'QIDI Tech': {
    compatibility_pattern: /X-|Q[12]|Plus|Max/i,
    nozzles: [
      { name: '0.4mm Brass Nozzle', brand: 'QIDI Tech', model: 'QIDI-0.4', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 280, hardened: false, wear_rating: 'Low', flow_rate: 'Standard' }, product_url: 'https://qidi3d.com/products/qidi-tech-3d-printer-nozzles', image_url: 'https://qidi3d.com/cdn/shop/products/qidi-brass-nozzle.jpg', price: 4.99, currency: 'USD', description: 'Standard brass nozzle for QIDI printers', compatible_printer_brands: ['QIDI Tech'], compatible_hotend_types: ['QIDI Hotend'] },
      { name: '0.4mm Hardened Steel Nozzle', brand: 'QIDI Tech', model: 'HS-0.4', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 350, hardened: true, wear_rating: 'Very High', flow_rate: 'Standard' }, product_url: 'https://qidi3d.com/products/qidi-tech-hardened-steel-nozzle', image_url: 'https://qidi3d.com/cdn/shop/products/qidi-hardened-nozzle.jpg', price: 19.99, currency: 'USD', description: 'Hardened steel nozzle for abrasive filaments', compatible_printer_brands: ['QIDI Tech'], compatible_hotend_types: ['QIDI Hotend'] },
    ],
  },
  'Elegoo': {
    compatibility_pattern: /Neptune|Centauri/i,
    nozzles: [
      { name: '0.4mm Brass Nozzle', brand: 'Elegoo', model: 'MK8-0.4', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 260, hardened: false, wear_rating: 'Low', flow_rate: 'Standard' }, product_url: 'https://www.elegoo.com/products/elegoo-neptune-brass-nozzle', image_url: 'https://www.elegoo.com/cdn/shop/products/elegoo-brass-nozzle.jpg', price: 2.99, currency: 'USD', description: 'Standard brass nozzle for Neptune series', compatible_printer_brands: ['Elegoo'], compatible_hotend_types: ['MK8'] },
      { name: '0.4mm Hardened Steel Nozzle', brand: 'Elegoo', model: 'HS-0.4', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 300, hardened: true, wear_rating: 'Very High', flow_rate: 'Standard' }, product_url: 'https://www.elegoo.com/products/elegoo-neptune-hardened-nozzle', image_url: 'https://www.elegoo.com/cdn/shop/products/elegoo-hardened-nozzle.jpg', price: 11.99, currency: 'USD', description: 'Hardened steel nozzle for abrasive filaments', compatible_printer_brands: ['Elegoo'], compatible_hotend_types: ['MK8'] },
    ],
  },
};

// Third-party nozzle brands
const THIRD_PARTY_NOZZLES: Record<string, { nozzles: NozzleData[] }> = {
  'E3D': {
    nozzles: [
      { name: 'E3D V6 Brass Nozzle 0.4mm', brand: 'E3D', model: 'V6-NOZZLE-BRASS-040', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 300, hardened: false, wear_rating: 'Low', flow_rate: 'Standard' }, product_url: 'https://e3d-online.com/products/v6-nozzle', image_url: 'https://e3d-online.com/cdn/shop/products/V6-Nozzle-Pack-Brass.jpg', price: 6.50, currency: 'USD', description: 'Industry standard E3D V6 brass nozzle', compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron'], compatible_hotend_types: ['E3D V6', 'Clone V6'] },
      { name: 'E3D V6 Hardened Steel Nozzle 0.4mm', brand: 'E3D', model: 'V6-NOZZLE-HS-040', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 500, hardened: true, wear_rating: 'Extreme', flow_rate: 'Standard' }, product_url: 'https://e3d-online.com/products/v6-hardened-steel-nozzle', image_url: 'https://e3d-online.com/cdn/shop/products/V6-Nozzle-Hardened-Steel.jpg', price: 22.00, currency: 'USD', description: 'Premium hardened steel for abrasive materials', compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron'], compatible_hotend_types: ['E3D V6', 'Clone V6'] },
      { name: 'E3D Revo Nozzle 0.4mm', brand: 'E3D', model: 'REVO-NOZZLE-040', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 300, hardened: false, wear_rating: 'Low', flow_rate: 'Standard' }, product_url: 'https://e3d-online.com/products/revo-nozzle', image_url: 'https://e3d-online.com/cdn/shop/products/Revo-Nozzle-Pack.jpg', price: 14.50, currency: 'USD', description: 'Standard quick-change Revo nozzle', compatible_printer_brands: ['Prusa Research', 'Voron'], compatible_hotend_types: ['E3D Revo'] },
      { name: 'E3D ObXidian Nozzle 0.4mm', brand: 'E3D', model: 'OBXIDIAN-040', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 500, hardened: true, wear_rating: 'Extreme', flow_rate: 'High', coating: 'Nozzle X coating' }, product_url: 'https://e3d-online.com/products/obxidian-nozzle', image_url: 'https://e3d-online.com/cdn/shop/products/Obxidian.jpg', price: 35.00, currency: 'USD', description: 'Ultimate wear-resistant nozzle with special coating', compatible_printer_brands: ['Prusa Research', 'Creality', 'Anycubic', 'Elegoo', 'Voron'], compatible_hotend_types: ['E3D V6', 'Clone V6'] },
    ],
  },
  'Phaetus': {
    nozzles: [
      { name: 'Phaetus PS Brass Nozzle 0.4mm', brand: 'Phaetus', model: 'PS-BRASS-040', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 300, hardened: false, wear_rating: 'Low', flow_rate: 'Standard' }, product_url: 'https://www.phaetus.com/products/ps-nozzle', image_url: 'https://www.phaetus.com/cdn/shop/products/PS-Nozzle-Brass.jpg', price: 8.00, currency: 'USD', description: 'High-quality brass nozzle for standard printing', compatible_printer_brands: ['Voron', 'Prusa Research', 'Creality'], compatible_hotend_types: ['E3D V6', 'Phaetus Dragon', 'Phaetus Rapido'] },
      { name: 'Phaetus PS Hardened Steel Nozzle 0.4mm', brand: 'Phaetus', model: 'PS-HS-040', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 450, hardened: true, wear_rating: 'Very High', flow_rate: 'Standard' }, product_url: 'https://www.phaetus.com/products/ps-nozzle-hardened', image_url: 'https://www.phaetus.com/cdn/shop/products/PS-Nozzle-HS.jpg', price: 18.00, currency: 'USD', description: 'Hardened steel for abrasive filaments', compatible_printer_brands: ['Voron', 'Prusa Research', 'Creality'], compatible_hotend_types: ['E3D V6', 'Phaetus Dragon', 'Phaetus Rapido'] },
      { name: 'Phaetus Dragon High Flow Nozzle 0.4mm', brand: 'Phaetus', model: 'DRAGON-HF-040', specs: { diameter_mm: 0.4, material: 'plated copper', max_temp_c: 450, hardened: false, wear_rating: 'Medium', flow_rate: 'Very High', coating: 'Nickel plated' }, product_url: 'https://www.phaetus.com/products/dragon-hf-nozzle', image_url: 'https://www.phaetus.com/cdn/shop/products/Dragon-HF-Nozzle.jpg', price: 25.00, currency: 'USD', description: 'High flow plated copper nozzle for speed printing', compatible_printer_brands: ['Voron', 'Prusa Research'], compatible_hotend_types: ['Phaetus Dragon HF', 'Phaetus Rapido HF'] },
    ],
  },
  'Bondtech': {
    nozzles: [
      { name: 'Bondtech CHT Coated Brass Nozzle 0.4mm', brand: 'Bondtech', model: 'CHT-BRASS-040', specs: { diameter_mm: 0.4, material: 'brass', max_temp_c: 300, hardened: false, wear_rating: 'Low', flow_rate: 'Very High', coating: 'CHT coating' }, product_url: 'https://www.bondtech.se/product/cht-coated-brass-nozzle/', image_url: 'https://www.bondtech.se/wp-content/uploads/2021/05/CHT-Nozzle.jpg', price: 20.00, currency: 'USD', description: 'Revolutionary CHT design for 3x flow rate increase', compatible_printer_brands: ['Prusa Research', 'Creality', 'Voron', 'Anycubic'], compatible_hotend_types: ['E3D V6', 'MK8', 'Clone V6'] },
      { name: 'Bondtech CHT Hardened Steel Nozzle 0.4mm', brand: 'Bondtech', model: 'CHT-HS-040', specs: { diameter_mm: 0.4, material: 'hardened steel', max_temp_c: 450, hardened: true, wear_rating: 'Very High', flow_rate: 'Very High', coating: 'CHT design' }, product_url: 'https://www.bondtech.se/product/cht-hardened-steel-nozzle/', image_url: 'https://www.bondtech.se/wp-content/uploads/2021/05/CHT-Nozzle-HS.jpg', price: 35.00, currency: 'USD', description: 'CHT design in hardened steel for abrasives', compatible_printer_brands: ['Prusa Research', 'Creality', 'Voron', 'Anycubic'], compatible_hotend_types: ['E3D V6', 'MK8', 'Clone V6'] },
    ],
  },
  'Slice Engineering': {
    nozzles: [
      { name: 'Slice Vanadium Nozzle 0.4mm', brand: 'Slice Engineering', model: 'VANADIUM-040', specs: { diameter_mm: 0.4, material: 'vanadium', max_temp_c: 500, hardened: true, wear_rating: 'Extreme', flow_rate: 'Standard' }, product_url: 'https://www.sliceengineering.com/products/vanadium-nozzle', image_url: 'https://www.sliceengineering.com/cdn/shop/products/Vanadium-Nozzle.jpg', price: 35.00, currency: 'USD', description: 'Premium vanadium nozzle for extreme wear resistance', compatible_printer_brands: ['Prusa Research', 'Creality', 'Voron', 'Anycubic'], compatible_hotend_types: ['E3D V6', 'MK8', 'Clone V6'] },
      { name: 'Slice Copperhead Nozzle 0.4mm', brand: 'Slice Engineering', model: 'COPPERHEAD-040', specs: { diameter_mm: 0.4, material: 'plated copper', max_temp_c: 450, hardened: false, wear_rating: 'Medium', flow_rate: 'Very High', coating: 'Nickel plated' }, product_url: 'https://www.sliceengineering.com/products/copperhead-nozzle', image_url: 'https://www.sliceengineering.com/cdn/shop/products/Copperhead-Nozzle.jpg', price: 28.00, currency: 'USD', description: 'High thermal conductivity copper nozzle', compatible_printer_brands: ['Prusa Research', 'Creality', 'Voron'], compatible_hotend_types: ['E3D V6', 'MK8'] },
    ],
  },
  'Micro Swiss': {
    nozzles: [
      { name: 'Micro Swiss Plated Wear Resistant Nozzle 0.4mm', brand: 'Micro Swiss', model: 'MS-WR-040', specs: { diameter_mm: 0.4, material: 'plated brass', max_temp_c: 350, hardened: true, wear_rating: 'High', flow_rate: 'Standard', coating: 'TwinClad XT' }, product_url: 'https://store.micro-swiss.com/products/plated-wear-resistant-nozzle', image_url: 'https://store.micro-swiss.com/cdn/shop/products/Plated-Nozzle.jpg', price: 15.00, currency: 'USD', description: 'Wear resistant plated nozzle for extended life', compatible_printer_brands: ['Creality', 'Anycubic', 'Elegoo'], compatible_hotend_types: ['MK8', 'Micro Swiss All Metal'] },
      { name: 'Micro Swiss A2 Hardened Steel Nozzle 0.4mm', brand: 'Micro Swiss', model: 'MS-A2-040', specs: { diameter_mm: 0.4, material: 'A2 hardened steel', max_temp_c: 450, hardened: true, wear_rating: 'Very High', flow_rate: 'Standard' }, product_url: 'https://store.micro-swiss.com/products/a2-hardened-steel-nozzle', image_url: 'https://store.micro-swiss.com/cdn/shop/products/A2-Nozzle.jpg', price: 20.00, currency: 'USD', description: 'Premium A2 tool steel nozzle', compatible_printer_brands: ['Creality', 'Anycubic', 'Elegoo'], compatible_hotend_types: ['MK8', 'Micro Swiss All Metal'] },
    ],
  },
};

const OEM_BRAND_NAMES = Object.keys(OEM_NOZZLES);
const THIRD_PARTY_BRAND_NAMES = Object.keys(THIRD_PARTY_NOZZLES);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { brandId, brandName } = await req.json();

    // Determine which brands to process
    let brandsToProcess: { name: string; isOEM: boolean }[] = [];
    
    if (brandName === 'All Brands') {
      brandsToProcess = [
        ...OEM_BRAND_NAMES.map(n => ({ name: n, isOEM: true })),
        ...THIRD_PARTY_BRAND_NAMES.map(n => ({ name: n, isOEM: false })),
      ];
    } else if (brandName === 'All OEM') {
      brandsToProcess = OEM_BRAND_NAMES.map(n => ({ name: n, isOEM: true }));
    } else if (brandName === 'All 3rd Party') {
      brandsToProcess = THIRD_PARTY_BRAND_NAMES.map(n => ({ name: n, isOEM: false }));
    } else if (THIRD_PARTY_BRAND_NAMES.includes(brandName)) {
      brandsToProcess = [{ name: brandName, isOEM: false }];
    } else if (OEM_BRAND_NAMES.includes(brandName)) {
      brandsToProcess = [{ name: brandName, isOEM: true }];
    } else if (brandName) {
      // Unknown brand name but was provided - try OEM first
      brandsToProcess = [{ name: brandName, isOEM: true }];
    } else {
      return new Response(
        JSON.stringify({ error: 'brandName is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    console.log(`Processing ${brandsToProcess.length} brands: ${brandsToProcess.map(b => b.name).join(', ')}`);

    let totalNozzlesFound = 0;
    let totalAccessoriesCreated = 0;

    // Get all printers with their brand info
    const { data: printers, error: printersError } = await supabase
      .from('printers')
      .select('id, model_name, brand_id, printer_brands!inner(brand)');
    
    if (printersError) throw printersError;
    console.log(`Found ${printers?.length || 0} printers in database`);

    for (const { name: currentBrandName, isOEM } of brandsToProcess) {
      const brandData = isOEM 
        ? OEM_NOZZLES[currentBrandName] 
        : THIRD_PARTY_NOZZLES[currentBrandName];
      
      if (!brandData) {
        console.log(`No nozzle data for brand: ${currentBrandName}`);
        continue;
      }

      const allNozzles = brandData.nozzles;
      totalNozzlesFound += allNozzles.length;
      console.log(`Processing ${allNozzles.length} nozzles for ${currentBrandName}`);

      for (const nozzle of allNozzles) {
        // Determine compatible printers
        const compatiblePrinters = (printers || []).filter((printer: any) => {
          // For OEM nozzles, match by brand pattern
          if (isOEM) {
            const oemBrandData = brandData as { nozzles: NozzleData[]; compatibility_pattern?: RegExp };
            if (oemBrandData.compatibility_pattern) {
              return oemBrandData.compatibility_pattern.test(printer.model_name);
            }
          }
          // For 3rd party nozzles, check if printer brand is in compatible list
          if (nozzle.compatible_printer_brands && nozzle.compatible_printer_brands.length > 0) {
            const printerBrand = printer.printer_brands?.brand;
            return printerBrand && nozzle.compatible_printer_brands.includes(printerBrand);
          }
          return false;
        });

        console.log(`Nozzle "${nozzle.name}" compatible with ${compatiblePrinters.length} printers`);

        for (const printer of compatiblePrinters) {
          const { error: insertError } = await supabase
            .from('printer_accessories')
            .upsert({
              printer_id: printer.id,
              accessory_type: 'nozzle',
              name: nozzle.name,
              brand: nozzle.brand,
              model: nozzle.model,
              specs: nozzle.specs,
              product_url: nozzle.product_url,
              image_url: nozzle.image_url,
              price: nozzle.price,
              currency: nozzle.currency || 'USD',
              description: nozzle.description,
              compatible_printer_brands: nozzle.compatible_printer_brands,
              compatible_hotend_types: nozzle.compatible_hotend_types,
            }, {
              onConflict: 'printer_id,name',
              ignoreDuplicates: false,
            });

          if (!insertError) {
            totalAccessoriesCreated++;
          } else {
            console.error(`Error inserting nozzle ${nozzle.name} for printer ${printer.model_name}:`, insertError);
          }
        }
      }
    }

    console.log(`Complete: ${totalNozzlesFound} nozzles found, ${totalAccessoriesCreated} accessories created`);

    return new Response(
      JSON.stringify({
        success: true,
        brands_processed: brandsToProcess.length,
        nozzles_found: totalNozzlesFound,
        accessories_created: totalAccessoriesCreated,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
