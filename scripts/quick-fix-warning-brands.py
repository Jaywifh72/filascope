#!/usr/bin/env python3
"""
Quick Fix for Warning Brands
Focuses on calculating missing TD values and fixing material classifications
"""

import os
import json
import requests
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional

load_dotenv('/home/jay/.hermes/.env')

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://fytxfdvbzstnimzhjgth.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

# Headers
supabase_headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

class QuickBrandFixer:
    def __init__(self):
        self.session = requests.Session()
        self.stats = {
            'processed': 0,
            'td_fixed': 0,
            'material_fixed': 0,
            'price_fixed': 0
        }
    
    def get_filaments_by_brand(self, brand_name: str) -> List[Dict]:
        """Get all filaments for a brand"""
        response = self.session.get(
            f'{SUPABASE_URL}/rest/v1/filaments',
            headers=supabase_headers,
            params={
                'select': '*',
                'brand_name': f'eq.{brand_name}',
                'limit': 1000
            }
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f'❌ Error fetching {brand_name}: {response.status_code}')
            return []
    
    def calculate_td_value(self, material: str, color_name: str = None, color_hex: str = None) -> Optional[float]:
        """Calculate TD value based on material and color"""
        if not material:
            return None
        
        # Base TD values by material type
        material_td_base = {
            'PLA': 1.5,
            'PLA-SILK': 1.2,
            'PLA-MATTE': 1.8,
            'PLA-GLOW': 0.9,
            'PLA-WOOD': 0.8,
            'PLA-METAL': 0.5,
            'PLA-CARBON': 0.3,
            'PETG': 2.0,
            'ABS': 1.8,
            'ASA': 1.9,
            'TPU': 2.5,
            'TPU-95A': 2.3,
            'TPU-85A': 2.4,
            'NYLON': 2.2,
            'PA': 2.2,
            'PA6': 2.1,
            'PA12': 2.3,
            'PC': 2.1,
            'HIPS': 1.6,
            'PVA': 3.0,
            'PEEK': 1.4,
            'PEI': 1.5,
            'FLEX': 2.3,
            'RUBBER': 2.4,
            'OTHER': 1.5
        }
        
        # Get base TD
        material_upper = material.upper()
        base_td = material_td_base.get(material_upper, 1.5)
        
        # Adjust based on color
        if color_name:
            color_lower = color_name.lower()
            
            # Color adjustments
            if any(word in color_lower for word in ['white', 'natural', 'ivory', 'cream']):
                base_td *= 1.3  # White/natural transmits more
            elif any(word in color_lower for word in ['black', 'dark', 'charcoal']):
                base_td *= 0.7  # Black transmits less
            elif any(word in color_lower for word in ['translucent', 'clear', 'transparent', 'see-through']):
                base_td *= 1.6  # Translucent transmits much more
            elif any(word in color_lower for word in ['metallic', 'shiny', 'glossy', 'chrome']):
                base_td *= 0.8  # Metallic reflects more
            elif any(word in color_lower for word in ['glow', 'fluorescent', 'neon']):
                base_td *= 0.9  # Glow materials have special properties
            elif any(word in color_lower for word in ['silk', 'pearl', 'shimmer']):
                base_td *= 0.85  # Silk finish affects transmission
        
        # Adjust based on color hex (if available)
        if color_hex and len(color_hex) >= 6:
            # Simple brightness adjustment based on hex
            hex_color = color_hex.lstrip('#')
            if len(hex_color) == 6:
                try:
                    r = int(hex_color[0:2], 16)
                    g = int(hex_color[2:4], 16)
                    b = int(hex_color[4:6], 16)
                    brightness = (r + g + b) / 3 / 255  # 0-1 scale
                    
                    # Brighter colors transmit more
                    if brightness > 0.7:  # Light colors
                        base_td *= 1.2
                    elif brightness < 0.3:  # Dark colors
                        base_td *= 0.8
                except:
                    pass
        
        return round(base_td, 1)
    
    def infer_material_from_name(self, filament_name: str) -> Optional[str]:
        """Infer material type from filament name"""
        if not filament_name:
            return None
        
        name_upper = filament_name.upper()
        
        # Material keywords
        material_keywords = {
            'PLA': ['PLA', 'POLYLACTIC'],
            'PETG': ['PETG', 'PET-G'],
            'ABS': ['ABS'],
            'TPU': ['TPU', 'FLEX', 'FLEXIBLE', 'RUBBER'],
            'NYLON': ['NYLON', 'PA', 'POLYAMIDE'],
            'ASA': ['ASA'],
            'PC': ['PC', 'POLYCARBONATE'],
            'HIPS': ['HIPS'],
            'PVA': ['PVA'],
            'WOOD': ['WOOD', 'WOODFILL'],
            'METAL': ['METAL', 'COPPER', 'BRONZE', 'STEEL'],
            'CARBON': ['CARBON', 'CF', 'CARBONFIBER'],
            'SILK': ['SILK'],
            'MATTE': ['MATTE'],
            'GLOW': ['GLOW', 'GLOW-IN-THE-DARK'],
            'MAGNETIC': ['MAGNETIC'],
            'CONDUCTIVE': ['CONDUCTIVE']
        }
        
        for material, keywords in material_keywords.items():
            for keyword in keywords:
                if keyword in name_upper:
                    return material
        
        return None
    
    def fix_filament(self, filament: Dict) -> Dict[str, Any]:
        """Fix missing data for a single filament"""
        updates = {}
        filament_id = filament['id']
        filament_name = filament.get('display_name', '')
        
        # Fix missing TD values (highest priority)
        if filament.get('transmission_distance') is None:
            material = filament.get('material')
            color_name = filament.get('color_family', '')
            color_hex = filament.get('color_hex', '')
            
            # If material is missing, try to infer from name
            if not material:
                material = self.infer_material_from_name(filament_name)
                if material:
                    updates['material'] = material
                    self.stats['material_fixed'] += 1
            
            # Calculate TD value
            td_value = self.calculate_td_value(material, color_name, color_hex)
            if td_value:
                updates['transmission_distance'] = td_value
                updates['td_source'] = 'calculated'
                updates['td_confidence'] = 'low'
                self.stats['td_fixed'] += 1
        
        # Fix missing material (if not already fixed)
        if filament.get('material') is None and 'material' not in updates:
            material = self.infer_material_from_name(filament_name)
            if material:
                updates['material'] = material
                self.stats['material_fixed'] += 1
        
        return updates
    
    def update_filament(self, filament_id: str, updates: Dict[str, Any]) -> bool:
        """Update a filament in the database"""
        if not updates:
            return False
        
        try:
            response = self.session.patch(
                f'{SUPABASE_URL}/rest/v1/filaments',
                headers=supabase_headers,
                params={'id': f'eq.{filament_id}'},
                json=updates
            )
            
            return response.status_code == 204
        except Exception as e:
            print(f'⚠️ Error updating filament {filament_id}: {str(e)}')
            return False
    
    def process_brand(self, brand_name: str):
        """Process all filaments for a brand"""
        print(f'\n🔧 Processing {brand_name}...')
        print('=' * 60)
        
        filaments = self.get_filaments_by_brand(brand_name)
        if not filaments:
            print(f'❌ No filaments found for {brand_name}')
            return
        
        print(f'📊 Found {len(filaments)} filaments to process')
        
        # Process each filament
        for i, filament in enumerate(filaments, 1):
            self.stats['processed'] += 1
            
            # Fix the filament
            updates = self.fix_filament(filament)
            
            # Update database if we have new data
            if updates:
                success = self.update_filament(filament['id'], updates)
                if success:
                    print(f'  ✅ [{i}/{len(filaments)}] Fixed: {filament.get("display_name", filament["id"])}')
                    for key, value in updates.items():
                        if key not in ['td_source', 'td_confidence']:
                            print(f'      • {key}: {value}')
                else:
                    print(f'  ❌ [{i}/{len(filaments)}] Update failed: {filament.get("display_name", filament["id"])}')
            
            # Progress indicator
            if i % 10 == 0:
                print(f'  📈 Progress: {i}/{len(filaments)} ({i/len(filaments)*100:.1f}%)')
        
        print(f'\n📊 {brand_name} Summary:')
        print(f'  Processed: {len(filaments)}')
        print(f'  TD values fixed: {self.stats["td_fixed"]}')
        print(f'  Materials fixed: {self.stats["material_fixed"]}')
    
    def run(self):
        """Run the quick fix for all warning brands"""
        print('⚡ QUICK FIX FOR WARNING BRANDS')
        print('=' * 60)
        print('Strategy: Calculate missing TD values and fix materials')
        print('Brands: Sovol, SainSmart, Taulman3D')
        print('=' * 60)
        
        # Process each brand
        brands = ['Sovol', 'SainSmart', 'Taulman3D']
        
        for brand in brands:
            self.process_brand(brand)
        
        # Final summary
        print('\n' + '=' * 60)
        print('📊 FINAL SUMMARY')
        print('=' * 60)
        print(f'Total filaments processed: {self.stats["processed"]}')
        print(f'TD values fixed: {self.stats["td_fixed"]}')
        print(f'Materials fixed: {self.stats["material_fixed"]}')
        
        success_rate = (self.stats['td_fixed'] / self.stats['processed'] * 100) if self.stats['processed'] > 0 else 0
        print(f'Success rate (TD fixes): {success_rate:.1f}%')
        
        print('\n✅ Quick fix complete!')

if __name__ == '__main__':
    fixer = QuickBrandFixer()
    fixer.run()
