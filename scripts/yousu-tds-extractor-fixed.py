#!/usr/bin/env python3

"""
Yousu TDS Extractor (Fixed)
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
    
    # Find the table structure
    # Look for "Properties" header and then find values in the "Typical Value" column
    in_table = False
    property_name = None
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Look for property names and their values
        if 'Density' in line:
            # Look ahead for the value (should be a number like "1.23")
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                # Look for a number that could be density (0.5-3.0 range)
                density_match = re.search(r'^(\d+\.\d+)$', next_line)
                if density_match:
                    density = float(density_match.group(1))
                    if 0.5 <= density <= 3.0:
                        properties['density_g_cm3'] = density
                        break
        
        elif 'Tensile Strength' in line:
            # Look ahead for the value
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                # Look for a number that could be tensile strength (10-200 range)
                tensile_match = re.search(r'^(\d+)$', next_line)
                if tensile_match:
                    tensile = float(tensile_match.group(1))
                    if 10 <= tensile <= 200:
                        properties['tensile_strength_xy_mpa'] = tensile
                        break
        
        elif 'Elongation' in line and 'Break' in line:
            # Look ahead for the value
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                # Look for a number that could be elongation (0-100% range)
                elongation_match = re.search(r'^(\d+)$', next_line)
                if elongation_match:
                    elongation = float(elongation_match.group(1))
                    if 0 <= elongation <= 100:
                        properties['elongation_break_xy_percent'] = elongation
                        break
        
        elif 'Flexural Strength' in line:
            # Look ahead for the value
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                # Look for a number that could be flexural strength (10-300 range)
                flexural_match = re.search(r'^(\d+)$', next_line)
                if flexural_match:
                    flexural = float(flexural_match.group(1))
                    if 10 <= flexural <= 300:
                        properties['flexural_strength_mpa'] = flexural
                        break
        
        elif 'FlexuralModulus' in line or 'Flexural Modulus' in line:
            # Look ahead for the value
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                # Look for a number that could be modulus (100-10000 range)
                modulus_match = re.search(r'^(\d+)$', next_line)
                if modulus_match:
                    modulus = float(modulus_match.group(1))
                    if 100 <= modulus <= 10000:
                        properties['tensile_modulus_xy_mpa'] = modulus
                        break
        
        elif 'Impact Strength' in line:
            # Look ahead for the value
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                # Look for a number that could be impact strength (0-100 range)
                impact_match = re.search(r'^(\d+)$', next_line)
                if impact_match:
                    impact = float(impact_match.group(1))
                    if 0 <= impact <= 100:
                        properties['impact_strength_kj_m2'] = impact
                        break
        
        elif 'Heat Distortion' in line:
            # Look ahead for the value
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                # Look for a number that could be HDT (0-300 range)
                hdt_match = re.search(r'^(\d+)$', next_line)
                if hdt_match:
                    hdt = float(hdt_match.group(1))
                    if 0 <= hdt <= 300:
                        properties['hdt_045_mpa_c'] = hdt
                        break
        
        elif 'Printing Temp' in line:
            # Look ahead for the temperature range
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                # Look for temperature range like "190-240℃"
                temp_match = re.search(r'(\d+)-(\d+)', next_line)
                if temp_match:
                    min_temp = int(temp_match.group(1))
                    max_temp = int(temp_match.group(2))
                    if 100 <= min_temp <= 400 and 100 <= max_temp <= 400:
                        properties['nozzle_temp_min_c'] = min_temp
                        properties['nozzle_temp_max_c'] = max_temp
                        break
        
        elif 'Print Bed Temp' in line:
            # Look ahead for the bed temperature
            for j in range(i+1, min(i+10, len(lines))):
                next_line = lines[j].strip()
                # Look for temperature like "60℃" or "None"
                bed_temp_match = re.search(r'(\d+)', next_line)
                if bed_temp_match:
                    bed_temp = int(bed_temp_match.group(1))
                    if 0 <= bed_temp <= 150:
                        properties['bed_temp_min_c'] = bed_temp
                        break
    
    return properties

def test_yousu_tds_extraction():
    """Test TDS extraction with Yousu PLA TDS"""
    tds_url = "https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf"
    
    print(f"📥 Downloading TDS from: {tds_url}")
    content = download_and_extract_tds(tds_url)
    
    print("\n📄 TDS Content (lines with property names):")
    lines = content.split('\n')
    for i, line in enumerate(lines):
        if any(keyword in line for keyword in ['Density', 'Tensile', 'Elongation', 'Flexural', 'Impact', 'Heat Distortion', 'Printing Temp', 'Print Bed']):
            print(f"  Line {i}: {line.strip()}")
    
    print("\n" + "="*50 + "\n")
    
    print("🔍 Extracting properties...")
    properties = extract_properties_from_tds(content)
    
    print("\n📊 Extracted Properties:")
    for key, value in properties.items():
        print(f"  {key}: {value}")
    
    print("\n✅ Extraction test complete!")
    return properties

if __name__ == "__main__":
    test_yousu_tds_extraction()