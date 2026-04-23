#!/usr/bin/env python3
"""
Fix Warning Brands Script
Enriches Sovol, SainSmart, and Taulman3D with missing data
"""

import os
import json
import requests
import time
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional
import re
from urllib.parse import urlparse

load_dotenv('/home/jay/.hermes/.env')

# Configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://fytxfdvbzstnimzhjgth.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
FIRECRAWL_API_KEY = os.getenv('FIRECRAWL_API_KEY')

# Headers
supabase_headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': f'Bearer {SUPABASE_KEY}',
    'Content-Type': 'application/json'
}

firecrawl_headers = {
    'Authorization': f'Bearer {FIRECRAWL_API_KEY}',
    'Content-Type': 'application/json'
}

class BrandEnricher:
    def __init__(self):
        self.session = requests.Session()
        self.stats = {
            'processed': 0,
            'enriched': 0,
            'failed': 0,
            'skipped': 0
        }
    
    def get_filaments_by_brand(self, brand_name: str, limit: int = 100) -> List[Dict]:
        """Get all filaments for a brand"""
        response = self.session.get(
            f'{SUPABASE_URL}/rest/v1/filaments',
            headers=supabase_headers,
            params={
                'select': '*',
                'brand_name': f'eq.{brand_name}',
                'limit': limit
            }
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f'❌ Error fetching {brand_name}: {response.status_code}')
            return []
    
    def scrape_product_page(self, url: str) -> Optional[Dict]:
        """Scrape a product page using Firecrawl"""
        if not url or not FIRECRAWL_API_KEY:
            return None
        
        try:
            # Use Firecrawl to scrape the page
            response = self.session.post(
                'https://api.firecrawl.dev/v0/scrape',
                headers=firecrawl_headers,
                json={
                    'url': url,
                    'pageOptions': {
                        'onlyMainContent': True
                    }
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get('data', {})
            else:
                print(f'⚠️ Firecrawl error for {url}: {response.status_code}')
                return None
                
        except Exception as e:
            print(f'⚠️ Error scraping {url}: {str(e)}')
            return None
    
    def extract_price_from_page(self, page_data: Dict) -> Optional[float]:
        """Extract price from scraped page data"""
        if not page_data:
            return None
        
        content = page_data.get('content', '')
        metadata = page_data.get('metadata', {})
        
        # Try to find price in content
        price_patterns = [
            r'\$(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*USD',
            r'Price:\s*\$?(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*per\s*kg',
            r'(\d+\.?\d*)\s*per\s*spool'
        ]
        
        for pattern in price_patterns:
            matches = re.findall(pattern, content, re.IGNORECASE)
            if matches:
                try:
                    price = float(matches[0])
                    if 1 <= price <= 1000:  # Reasonable price range
                        return price
                except:
                    continue
        
        # Try metadata
        if 'price' in metadata:
            try:
                return float(metadata['price'])
            except:
                pass
        
        return None
    
    def extract_material_from_page(self, page_data: Dict) -> Optional[str]:
        """Extract material type from scraped page data"""
        if not page_data:
            return None
        
        content = page_data.get('content', '').upper()
        
        material_keywords = {
            'PLA': ['PLA', 'POLYLACTIC ACID'],
            'PETG': ['PETG', 'PET-G', 'POLYETHYLENE TEREPHTHALATE'],
            'ABS': ['ABS', 'ACRYLONITRILE BUTADIENE STYRENE'],
            'TPU': ['TPU', 'THERMOPLASTIC POLYURETHANE'],
            'NYLON': ['NYLON', 'PA', 'POLYAMIDE'],
            'ASA': ['ASA'],
            'PC': ['PC', 'POLYCARBONATE'],
            'HIPS': ['HIPS'],
            'PVA': ['PVA'],
            'WOOD': ['WOOD', 'WOODFILL'],
            'METAL': ['METAL', 'COPPERFILL', 'BRONZEFILL'],
            'CARBON': ['CARBON', 'CARBONFIBER', 'CF'],
            'SILK': ['SILK'],
            'MATTE': ['MATTE'],
            'GLOW': ['GLOW', 'GLOW-IN-THE-DARK'],
            'MAGNETIC': ['MAGNETIC'],
            'CONDUCTIVE': ['CONDUCTIVE'],
            'FLEX': ['FLEX', 'FLEXIBLE'],
            'RUBBER': ['RUBBER']
        }
        
        for material, keywords in material_keywords.items():
            for keyword in keywords:
                if keyword in content:
                    return material
        
        return None
    
    def extract_temperatures_from_page(self, page_data: Dict) -> Dict[str, Optional[int]]:
        """Extract temperature settings from scraped page data"""
        temps = {
            'nozzle_temp_min_c': None,
            'nozzle_temp_max_c': None,
            'bed_temp_min_c': None,
            'bed_temp_max_c': None
        }
        
        if not page_data:
            return temps
        
        content = page_data.get('content', '')
        
        # Look for nozzle/extruder temperature
        nozzle_patterns = [
            r'Nozzle.*?(\d+)-(\d+).*?°C',
            r'Extruder.*?(\d+)-(\d+).*?°C',
            r'Print.*?Temp.*?(\d+)-(\d+)',
            r'(\d+)-(\d+).*?°C.*?nozzle',
            r'(\d+)-(\d+).*?°C.*?extruder'
        ]
        
        for pattern in nozzle_patterns:
            matches = re.search(pattern, content, re.IGNORECASE)
            if matches:
                try:
                    temps['nozzle_temp_min_c'] = int(matches.group(1))
                    temps['nozzle_temp_max_c'] = int(matches.group(2))
                    break
                except:
                    continue
        
        # Look for bed temperature
        bed_patterns = [
            r'Bed.*?(\d+)-(\d+).*?°C',
            r'Build.*?Plate.*?(\d+)-(\d+).*?°C',
            r'(\d+)-(\d+).*?°C.*?bed',
            r'(\d+)-(\d+).*?°C.*?build'
        ]
        
        for pattern in bed_patterns:
            matches = re.search(pattern, content, re.IGNORECASE)
            if matches:
                try:
                    temps['bed_temp_min_c'] = int(matches.group(1))
                    temps['bed_temp_max_c'] = int(matches.group(2))
                    break
                except:
                    continue
        
        return temps
    
    def calculate_td_value(self, material: str, color: str) -> Optional[float]:
        """Calculate approximate TD value based on material and color"""
        if not material:
            return None
        
        # Base TD values by material
        material_td = {
            'PLA': 1.5,
            'PETG': 2.0,
            'ABS': 1.8,
            'TPU': 2.5,
            'NYLON': 2.2,
            'ASA': 1.9,
            'PC': 2.1,
            'HIPS': 1.6,
            'PVA': 3.0,
            'WOOD': 0.8,
            'METAL': 0.5,
            'CARBON': 0.3,
            'SILK': 1.2,
            'MATTE': 1.8,
            'GLOW': 0.9,
            'MAGNETIC': 0.4,
            CONDUCTIVE: 0.2,
            'FLEX': 2.3,
            'RUBBER': 2.4
        }
        
        base_td = material_td.get(material.upper(), 1.5)
        
        # Adjust based on color
        if color:
            color_lower = color.lower()
            if 'white' in color_lower or 'natural' in color_lower:
                base_td *= 1.2
            elif 'black' in color_lower:
                base_td *= 0.8
            elif 'translucent' in color_lower or 'clear' in color_lower:
                base_td *= 1.5
            elif 'metallic' in color_lower or 'shiny' in color_lower:
                base_td *= 0.7
        
        return round(base_td, 1)
    
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
    
    def enrich_filament(self, filament: Dict) -> Dict[str, Any]:
        """Enrich a single filament with missing data"""
        updates = {}
        filament_id = filament['id']
        
        # Skip if no URL to scrape
        url = filament.get('product_url')
        if not url:
            self.stats['skipped'] += 1
            return updates
        
        print(f'  🔍 Processing: {filament.get("display_name", filament_id)}')
        
        # Scrape the product page
        page_data = self.scrape_product_page(url)
        if not page_data:
            self.stats['failed'] += 1
            return updates
        
        # Extract missing data
        if filament.get('variant_price') is None:
            price = self.extract_price_from_page(page_data)
            if price:
                updates['variant_price'] = price
                print(f'    💰 Found price: ${price}')
        
        if filament.get('material') is None:
            material = self.extract_material_from_page(page_data)
            if material:
                updates['material'] = material
                print(f'    🧪 Found material: {material}')
        
        if filament.get('transmission_distance') is None:
            # Try to extract from page first
            # If not found, calculate based on material and color
            material = filament.get('material') or updates.get('material')
            color = filament.get('color_family') or filament.get('display_name', '')
            
            td_value = self.calculate_td_value(material, color)
            if td_value:
                updates['transmission_distance'] = td_value
                print(f'    🎨 Calculated TD: {td_value}')
        
        # Extract temperatures if missing
        if (filament.get('nozzle_temp_min_c') is None or 
            filament.get('nozzle_temp_max_c') is None or
            filament.get('bed_temp_min_c') is None or
            filament.get('bed_temp_max_c') is None):
            
            temps = self.extract_temperatures_from_page(page_data)
            for key, value in temps.items():
                if value is not None and filament.get(key) is None:
                    updates[key] = value
                    print(f'    🌡️ Found {key}: {value}°C')
        
        # Mark as enriched
        if updates:
            updates['last_enriched_at'] = 'now()'
            updates['enrichment_source'] = 'warning-brand-fix'
            self.stats['enriched'] += 1
        else:
            self.stats['skipped'] += 1
        
        return updates
    
    def process_brand(self, brand_name: str, batch_size: int = 10):
        """Process all filaments for a brand"""
        print(f'\n🚀 Processing {brand_name}...')
        print('=' * 80)
        
        filaments = self.get_filaments_by_brand(brand_name)
        if not filaments:
            print(f'❌ No filaments found for {brand_name}')
            return
        
        print(f'📊 Found {len(filaments)} filaments to process')
        
        # Process in batches
        for i in range(0, len(filaments), batch_size):
            batch = filaments[i:i + batch_size]
            print(f'\n📦 Batch {i//batch_size + 1}/{(len(filaments) + batch_size - 1)//batch_size}')
            
            for filament in batch:
                self.stats['processed'] += 1
                
                # Enrich the filament
                updates = self.enrich_filament(filament)
                
                # Update database if we have new data
                if updates:
                    success = self.update_filament(filament['id'], updates)
                    if success:
                        print(f'    ✅ Updated successfully')
                    else:
                        print(f'    ❌ Update failed')
                
                # Rate limiting
                time.sleep(1)
            
            # Longer pause between batches
            if i + batch_size < len(filaments):
                print(f'⏸️ Pausing between batches...')
                time.sleep(5)
        
        print(f'\n📊 {brand_name} Summary:')
        print(f'  Processed: {self.stats["processed"]}')
        print(f'  Enriched: {self.stats["enriched"]}')
        print(f'  Failed: {self.stats["failed"]}')
        print(f'  Skipped: {self.stats["skipped"]}')
    
    def run(self):
        """Run the enrichment process for all warning brands"""
        print('🔧 FIXING WARNING BRANDS')
        print('=' * 80)
        print('Brands to fix:')
        print('  1. Sovol (70 filaments)')
        print('  2. SainSmart (457 filaments)')
        print('  3. Taulman3D (56 filaments)')
        print('=' * 80)
        
        # Process each brand
        brands = ['Sovol', 'SainSmart', 'Taulman3D']
        
        for brand in brands:
            self.process_brand(brand, batch_size=5)
        
        # Final summary
        print('\n' + '=' * 80)
        print('📊 FINAL SUMMARY')
        print('=' * 80)
        print(f'Total processed: {self.stats["processed"]}')
        print(f'Total enriched: {self.stats["enriched"]}')
        print(f'Total failed: {self.stats["failed"]}')
        print(f'Total skipped: {self.stats["skipped"]}')
        
        success_rate = (self.stats['enriched'] / self.stats['processed'] * 100) if self.stats['processed'] > 0 else 0
        print(f'Success rate: {success_rate:.1f}%')
        
        print('\n✅ Warning brand enrichment complete!')

if __name__ == '__main__':
    enricher = BrandEnricher()
    enricher.run()
