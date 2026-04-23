#!/usr/bin/env python3

"""
Taulman3D Technical Data Extractor
Extracts technical specifications from Taulman3D product pages
"""

import re
import json
import subprocess
import tempfile
import os
from typing import Dict, Optional

def extract_tech_specs_from_url(product_url: str) -> Dict[str, Optional[float]]:
    """Extract technical specifications from Taulman3D product page"""
    specs = {}
    
    try:
        # Fetch product page content
        result = subprocess.run([
            'curl', '-s', '-L', product_url
        ], capture_output=True, text=True, timeout=30)
        
        content = result.stdout
        
        # Extract print temperature range
        temp_match = re.search(r'Print Temperature:\s*(\d+)[°℃]?\s*-\s*(\d+)[°℃]?', content, re.IGNORECASE)
        if temp_match:
            specs['nozzle_temp_min_c'] = int(temp_match.group(1))
            specs['nozzle_temp_max_c'] = int(temp_match.group(2))
        
        # Extract bed temperature
        bed_temp_match = re.search(r'Print Bed Temperature:\s*(\d+)[°℃]?\s*max', content, re.IGNORECASE)
        if bed_temp_match:
            specs['bed_temp_min_c'] = 0  # Usually not needed or 0
            specs['bed_temp_max_c'] = int(bed_temp_match.group(1))
        
        # Extract tensile strength (PSI -> MPa)
        tensile_match = re.search(r'Tensile Strength:\s*(\d+)\s*PSI', content, re.IGNORECASE)
        if tensile_match:
            psi_value = int(tensile.group(1))
            mpa_value = psi_value * 0.00689476  # Convert PSI to MPa
            specs['tensile_strength_xy_mpa'] = round(mpa_value, 1)
        
        # Extract elongation
        elongation_match = re.search(r'Elongation:\s*(\d+)%', content, re.IGNORECASE)
        if elongation_match:
            specs['elongation_break_xy_percent'] = float(elongation_match.group(1))
        
        # Extract density (if available)
        density_match = re.search(r'Density:\s*(\d+\.\d+)\s*g/cm', content, re.IGNORECASE)
        if density_match:
            specs['density_g_cm3'] = float(density_match.group(1))
        
        # Extract material type from content
        if 'PETG' in content.upper():
            specs['material'] = 'PETG'
        elif 'NYLON' in content.upper():
            specs['material'] = 'Nylon'
        elif 'PLA' in content.upper():
            specs['material'] = 'PLA'
        
    except Exception as e:
        print(f"Error extracting from {product_url}: {e}")
    
    return specs

def enrich_taulman3d_filaments():
    """Enrich all Taulman3D filaments with technical data"""
    # Get Supabase credentials
    supabase_url = "https://fytxfdvbzstnimzhjgth.supabase.co"
    supabase_key = None
    
    # Try to get key from environment file
    env_path = os.path.expanduser("~/.hermes/.env")
    if os.path.exists(env_path):
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('SUPABASE_SERVICE_ROLE_KEY='):
                    supabase_key = line.strip().split('=', 1)[1]
                    break
    
    if not supabase_key:
        print("❌ Supabase key not found")
        return
    
    # Get all Taulman3D filaments
    print("📊 Fetching Taulman3D filaments from database...")
    result = subprocess.run([
        'curl', '-s',
        f'{supabase_url}/rest/v1/filaments?select=*&brand_name=eq.Taulman3D',
        '-H', f'apikey: {supabase_key}',
        '-H', f'Authorization: Bearer {supabase_key}'
    ], capture_output=True, text=True)
    
    filaments = json.loads(result.stdout)
    print(f"Found {len(filaments)} Taulman3D filaments")
    
    # Process first 5 filaments as test
    print("\n🔄 Processing first 5 filaments as test...")
    enriched_count = 0
    updated_fields_count = 0
    
    for i, filament in enumerate(filaments[:5]):
        filament_id = filament['id']
        product_title = filament.get('product_title', 'Unknown')
        product_url = filament.get('product_url', '')
        
        print(f"\n[{i+1}/5] Processing: {product_title}")
        print(f"     URL: {product_url}")
        
        if not product_url:
            print("     ⚠️  No product URL")
            continue
        
        try:
            # Extract technical specs
            specs = extract_tech_specs_from_url(product_url)
            
            if specs:
                print(f"     ✅ Extracted {len(specs)} properties")
                
                # Update database
                update_data = {}
                for key, value in specs.items():
                    # Only update if field is currently null
                    if filament.get(key) is None:
                        update_data[key] = value
                
                if update_data:
                    # Execute update
                    update_result = subprocess.run([
                        'curl', '-s', '-X', 'PATCH',
                        f'{supabase_url}/rest/v1/filaments?id=eq.{filament_id}',
                        '-H', f'apikey: {supabase_key}',
                        '-H', f'Authorization: Bearer {supabase_key}',
                        '-H', 'Content-Type: application/json',
                        '-H', 'Prefer: return=minimal',
                        '-d', json.dumps(update_data)
                    ], capture_output=True, text=True)
                    
                    if update_result.returncode == 0:
                        print(f"     ✅ Updated {len(update_data)} fields in database")
                        enriched_count += 1
                        updated_fields_count += len(update_data)
                    else:
                        print(f"     ❌ Database update failed")
                else:
                    print(f"     ℹ️  No new fields to update (already populated)")
            else:
                print(f"     ⚠️  No properties extracted")
        
        except Exception as e:
            print(f"     ❌ Error: {e}")
    
    print(f"\n✅ Test complete! Enriched {enriched_count} out of 5 filaments")
    print(f"📊 Total fields updated: {updated_fields_count}")
    print("\nTo process all filaments, remove the [:5] slice in the script.")

if __name__ == "__main__":
    enrich_taulman3d_filaments()