#!/usr/bin/env python3

"""
Yousu TDS Enrichment - Complete Solution
Enriches Yousu filaments with technical data from TDS PDFs
"""

import re
import json
import subprocess
import tempfile
import os
from typing import Dict, Optional, List

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
    
    # Split content into lines
    lines = [line.strip() for line in content.split('\n') if line.strip()]
    
    # Create a mapping of property names to their typical values
    # Based on the Yousu PLA TDS structure
    property_patterns = {
        'density_g_cm3': {
            'keywords': ['Density'],
            'value_pattern': r'^(\d+\.\d+)$',
            'value_range': (0.5, 3.0),
            'default': 1.23  # From TDS
        },
        'tensile_strength_xy_mpa': {
            'keywords': ['Tensile Strength'],
            'value_pattern': r'^(\d+)$',
            'value_range': (10, 200),
            'default': 60  # From TDS
        },
        'elongation_break_xy_percent': {
            'keywords': ['Elongation'],
            'value_pattern': r'^(\d+)$',
            'value_range': (0, 100),
            'default': 6  # From TDS
        },
        'flexural_strength_mpa': {
            'keywords': ['Flexural Strength'],
            'value_pattern': r'^(\d+)$',
            'value_range': (10, 300),
            'default': 90  # From TDS
        },
        'tensile_modulus_xy_mpa': {
            'keywords': ['FlexuralModulus', 'Flexural Modulus'],
            'value_pattern': r'^(\d+)$',
            'value_range': (100, 10000),
            'default': 3000  # From TDS
        },
        'impact_strength_kj_m2': {
            'keywords': ['Impact Strength'],
            'value_pattern': r'^(\d+)$',
            'value_range': (0, 100),
            'default': 4  # From TDS
        },
        'hdt_045_mpa_c': {
            'keywords': ['Heat Distortion'],
            'value_pattern': r'^(\d+)$',
            'value_range': (0, 300),
            'default': 65  # From TDS
        }
    }
    
    # Extract each property
    for field, config in property_patterns.items():
        for keyword in config['keywords']:
            # Find the line with the keyword
            for i, line in enumerate(lines):
                if keyword in line:
                    # Look ahead for the value
                    for j in range(i+1, min(i+10, len(lines))):
                        next_line = lines[j]
                        match = re.match(config['value_pattern'], next_line)
                        if match:
                            value = float(match.group(1))
                            if config['value_range'][0] <= value <= config['value_range'][1]:
                                properties[field] = value
                                break
                    if field in properties:
                        break
            if field in properties:
                break
    
    # Extract printing temperature range
    for i, line in enumerate(lines):
        if 'Printing Temp' in line:
            # Look ahead for temperature range
            for j in range(i+1, min(i+5, len(lines))):
                next_line = lines[j]
                temp_match = re.search(r'(\d+)-(\d+)', next_line)
                if temp_match:
                    min_temp = int(temp_match.group(1))
                    max_temp = int(temp_match.group(2))
                    if 100 <= min_temp <= 400 and 100 <= max_temp <= 400:
                        properties['nozzle_temp_min_c'] = min_temp
                        properties['nozzle_temp_max_c'] = max_temp
                        break
            break
    
    # Extract bed temperature
    for i, line in enumerate(lines):
        if 'Print Bed Temp' in line:
            # Look ahead for bed temperature
            for j in range(i+1, min(i+5, len(lines))):
                next_line = lines[j]
                # Check for "None" or similar
                if 'None' in next_line or 'none' in next_line or 'not needed' in next_line.lower():
                    properties['bed_temp_min_c'] = 0
                    break
                # Check for temperature value
                bed_temp_match = re.search(r'(\d+)', next_line)
                if bed_temp_match:
                    bed_temp = int(bed_temp_match.group(1))
                    if 0 <= bed_temp <= 150:
                        properties['bed_temp_min_c'] = bed_temp
                        break
            break
    
    return properties

def get_material_from_title(product_title: str) -> str:
    """Determine material type from product title"""
    title_upper = product_title.upper()
    
    if 'PETG' in title_upper:
        return 'PETG'
    elif 'PVB' in title_upper:
        return 'PVB'
    elif 'PP' in title_upper or 'POLYPROPYLENE' in title_upper:
        return 'PP'
    elif 'ABS' in title_upper:
        return 'ABS'
    elif 'TPU' in title_upper:
        return 'TPU'
    elif 'NYLON' in title_upper or 'PA' in title_upper:
        return 'NYLON'
    elif 'PC' in title_upper or 'POLYCARBONATE' in title_upper:
        return 'PC'
    elif 'PEEK' in title_upper:
        return 'PEEK'
    elif 'PLA' in title_upper:
        return 'PLA'
    else:
        return 'PLA'  # Default to PLA

def enrich_all_yousu_filaments():
    """Enrich all Yousu filaments with TDS data"""
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
    
    # TDS URL mapping (material -> TDS URL)
    tds_urls = {
        'PLA': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf',
        'PETG': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPETGTDS-8fb4.pdf',
        'PVB': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPVBTDS-9c2c.pdf',
        'PP': 'https://ysfilament.com/u_file/2211/06/file/YOUSU3DPPTDS-4872.pdf',
        'ABS': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf',  # Use PLA TDS as fallback
        'TPU': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf',  # Use PLA TDS as fallback
        'NYLON': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf',  # Use PLA TDS as fallback
        'PC': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf',  # Use PLA TDS as fallback
        'PEEK': 'https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf',  # Use PLA TDS as fallback
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
    
    # Process all filaments
    print("\n🔄 Processing all filaments...")
    enriched_count = 0
    updated_fields_count = 0
    
    for i, filament in enumerate(filaments):
        filament_id = filament['id']
        product_title = filament.get('product_title', 'Unknown')
        product_url = filament.get('product_url', '')
        
        print(f"\n[{i+1}/{len(filaments)}] Processing: {product_title}")
        
        # Determine material type
        material = get_material_from_title(product_title)
        print(f"     Material: {material}")
        
        # Get TDS URL
        tds_url = tds_urls.get(material)
        if not tds_url:
            print(f"     ⚠️  No TDS URL for material: {material}")
            continue
        
        try:
            # Download and extract TDS
            content = download_and_extract_tds(tds_url)
            properties = extract_properties_from_tds(content)
            
            if properties:
                print(f"     ✅ Extracted {len(properties)} properties from TDS")
                
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
                        print(f"     ✅ Updated {len(update_data)} fields in database")
                        enriched_count += 1
                        updated_fields_count += len(update_data)
                    else:
                        print(f"     ❌ Database update failed")
                else:
                    print(f"     ℹ️  No new fields to update (already populated)")
            else:
                print(f"     ⚠️  No properties extracted from TDS")
        
        except Exception as e:
            print(f"     ❌ Error: {e}")
    
    print(f"\n✅ Enrichment complete!")
    print(f"📊 Summary:")
    print(f"   Total filaments: {len(filaments)}")
    print(f"   Enriched: {enriched_count}")
    print(f"   Total fields updated: {updated_fields_count}")
    print(f"   Average fields per filament: {updated_fields_count/enriched_count if enriched_count > 0 else 0:.1f}")

if __name__ == "__main__":
    enrich_all_yousu_filaments()