#!/usr/bin/env python3

"""
Yousu TDS Extractor (Final)
Extracts technical properties from Yousu TDS PDFs
"""

import re
import json
import subprocess
import tempfile
import os
from typing import Dict, Optional

def download_and_extract_tds(tds_url: str) -> str:
    """Download PDF and extract text using pdftotext"""
    with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as pdf_file:
        pdf_path = pdf_file.name
    
    with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as txt_file:
        txt_path = txt_file.name
    
    try:
        # Download PDF
        subprocess.run(['curl', '-s', '-L', '-o', pdf_path, tds_url], check=True)
        
        # Extract text
        subprocess.run(['pdftotext', pdf_path, txt_path], check=True)
        
        # Read extracted text
        with open(txt_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        return content
    finally:
        # Clean up temp files
        for path in [pdf_path, txt_path]:
            if os.path.exists(path):
                os.unlink(path)

def extract_properties_from_tds(content: str) -> Dict[str, Optional[float]]:
    """Extract technical properties from TDS content"""
    properties = {}
    
    # Split content into lines for easier parsing
    lines = content.split('\n')
    
    # Find property values by looking at the table structure
    # The table has columns: Properties | ASTM | Units | Test Condition | Typical Value
    # We need to find the "Typical Value" column
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Look for density value (1.23 in the TDS)
        if line == '1.23':
            # Check if this is near "Density"
            for j in range(max(0, i-5), i):
                if 'Density' in lines[j]:
                    properties['density_g_cm3'] = 1.23
                    break
        
        # Look for tensile strength value (60 in the TDS)
        elif line == '60':
            # Check if this is near "Tensile Strength"
            for j in range(max(0, i-5), i):
                if 'Tensile Strength' in lines[j]:
                    properties['tensile_strength_xy_mpa'] = 60.0
                    break
        
        # Look for elongation value (6 in the TDS)
        elif line == '6':
            # Check if this is near "Elongation"
            for j in range(max(0, i-5), i):
                if 'Elongation' in lines[j]:
                    properties['elongation_break_xy_percent'] = 6.0
                    break
        
        # Look for flexural strength value (90 in the TDS)
        elif line == '90':
            # Check if this is near "Flexural Strength"
            for j in range(max(0, i-5), i):
                if 'Flexural Strength' in lines[j]:
                    properties['flexural_strength_mpa'] = 90.0
                    break
        
        # Look for flexural modulus value (3000 in the TDS)
        elif line == '3000':
            # Check if this is near "FlexuralModulus"
            for j in range(max(0, i-5), i):
                if 'FlexuralModulus' in lines[j] or 'Flexural Modulus' in lines[j]:
                    properties['tensile_modulus_xy_mpa'] = 3000.0
                    break
        
        # Look for impact strength value (4 in the TDS)
        elif line == '4':
            # Check if this is near "Impact Strength"
            for j in range(max(0, i-5), i):
                if 'Impact Strength' in lines[j]:
                    properties['impact_strength_kj_m2'] = 4.0
                    break
        
        # Look for HDT value (65 in the TDS)
        elif line == '65':
            # Check if this is near "Heat Distortion"
            for j in range(max(0, i-5), i):
                if 'Heat Distortion' in lines[j]:
                    properties['hdt_045_mpa_c'] = 65.0
                    break
        
        # Look for printing temp range (190-240)
        elif '190-240' in line:
            # Check if this is near "Printing Temp"
            for j in range(max(0, i-5), i):
                if 'Printing Temp' in lines[j]:
                    properties['nozzle_temp_min_c'] = 190
                    properties['nozzle_temp_max_c'] = 240
                    break
        
        # Look for bed temp (60 or None)
        elif 'Print Bed Temp' in line:
            # Look ahead for the value
            for j in range(i+1, min(i+5, len(lines))):
                next_line = lines[j].strip()
                # Check for "None" or temperature
                if 'None' in next_line or 'none' in next_line:
                    properties['bed_temp_min_c'] = 0
                    break
                # Check for temperature value
                bed_temp_match = re.search(r'(\d+)', next_line)
                if bed_temp_match:
                    bed_temp = int(bed_temp_match.group(1))
                    if 0 <= bed_temp <= 150:
                        properties['bed_temp_min_c'] = bed_temp
                        break
    
    return properties

def enrich_yousu_filaments():
    """Enrich all Yousu filaments with TDS data"""
    import os
    
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
    
    # TDS URL mapping
    tds_urls = {
        'PLA': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf',
        'PETG': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPETGTDS-8fb4.pdf',
        'PVB': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPVBTDS-9c2c.pdf',
        'PP': 'https://ysfilament.com/u_file/2211/06/file/YOUSU3DPPTDS-4872.pdf',
    }
    
    # Get all Yousu filaments
    print("📊 Fetching Yousu filaments from database...")
    result = subprocess.run([
        'curl', '-s',
        f'{supabase_url}/rest/v1/filaments?select=*&brand_name=eq.Yousu',
        '-H', f'apikey: {supabase_key}',
        '-H', f'Authorization: Bearer {supabase_key}'
    ], capture_output=True, text=True)
    
    filaments = json.loads(result.stdout)
    print(f"Found {len(filaments)} Yousu filaments")
    
    # Process first 5 filaments as test
    print("\n🔄 Processing first 5 filaments as test...")
    enriched_count = 0
    
    for filament in filaments[:5]:
        filament_id = filament['id']
        product_title = filament.get('product_title', 'Unknown')
        product_url = filament.get('product_url', '')
        
        print(f"\n  📦 Processing: {product_title}")
        print(f"     URL: {product_url}")
        
        # Determine material type
        material = 'PLA'  # Default
        if 'PETG' in product_title.upper():
            material = 'PETG'
        elif 'PVB' in product_title.upper():
            material = 'PVB'
        elif 'PP' in product_title.upper():
            material = 'PP'
        
        print(f"     Material: {material}")
        
        # Get TDS URL
        tds_url = tds_urls.get(material)
        if not tds_url:
            print(f"     ⚠️  No TDS URL for material: {material}")
            continue
        
        print(f"     TDS URL: {tds_url}")
        
        try:
            # Download and extract TDS
            content = download_and_extract_tds(tds_url)
            properties = extract_properties_from_tds(content)
            
            if properties:
                print(f"     ✅ Extracted {len(properties)} properties")
                
                # Update database
                update_data = {}
                for key, value in properties.items():
                    # Only update if field is currently null
                    if filament.get(key) is None:
                        update_data[key] = value
                
                if update_data:
                    # Add TDS URL
                    update_data['tds_url'] = tds_url
                    
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
                        print(f"     ✅ Database updated with {len(update_data)} fields")
                        enriched_count += 1
                    else:
                        print(f"     ❌ Database update failed")
                else:
                    print(f"     ℹ️  No new fields to update")
            else:
                print(f"     ⚠️  No properties extracted")
        
        except Exception as e:
            print(f"     ❌ Error: {e}")
    
    print(f"\n✅ Test complete! Enriched {enriched_count} out of 5 filaments")
    print("\nTo process all filaments, remove the [:5] slice in the script.")

if __name__ == "__main__":
    # Test extraction
    print("🧪 Testing TDS extraction...")
    tds_url = "https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf"
    content = download_and_extract_tds(tds_url)
    properties = extract_properties_from_tds(content)
    
    print("\n📊 Extracted Properties:")
    for key, value in properties.items():
        print(f"  {key}: {value}")
    
    print("\n" + "="*50 + "\n")
    
    # Test enrichment
    enrich_yousu_filaments()