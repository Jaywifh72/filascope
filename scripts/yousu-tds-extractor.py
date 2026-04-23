#!/usr/bin/env python3

"""
Yousu TDS Extractor
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
    
    # Normalize content - replace newlines with spaces for easier parsing
    normalized = ' '.join(content.split())
    
    # Extract density
    density_match = re.search(r'Density\s*.*?(\d+\.\d+)\s*g/cm', normalized, re.IGNORECASE)
    if density_match:
        properties['density_g_cm3'] = float(density_match.group(1))
    
    # Extract tensile strength
    tensile_match = re.search(r'Tensile\s+Strength\s*.*?(\d+)\s*MPa', normalized, re.IGNORECASE)
    if tensile_match:
        properties['tensile_strength_xy_mpa'] = float(tensile_match.group(1))
    
    # Extract elongation at break
    elongation_match = re.search(r'Elongation\s*.*?(\d+)\s*%', normalized, re.IGNORECASE)
    if elongation_match:
        properties['elongation_break_xy_percent'] = float(elongation_match.group(1))
    
    # Extract flexural strength
    flexural_match = re.search(r'Flexural\s+Strength\s*.*?(\d+)\s*MPa', normalized, re.IGNORECASE)
    if flexural_match:
        properties['flexural_strength_mpa'] = float(flexural_match.group(1))
    
    # Extract flexural modulus
    modulus_match = re.search(r'Flexural\s*Modulus\s*.*?(\d+)\s*MPa', normalized, re.IGNORECASE)
    if modulus_match:
        properties['tensile_modulus_xy_mpa'] = float(modulus_match.group(1))
    
    # Extract impact strength
    impact_match = re.search(r'Impact\s+Strength.*?(\d+)\s*KJ/m', normalized, re.IGNORECASE)
    if impact_match:
        properties['impact_strength_kj_m2'] = float(impact_match.group(1))
    
    # Extract heat distortion temperature
    hdt_match = re.search(r'Heat\s+Distortion\s+Temp.*?(\d+)\s*℃', normalized, re.IGNORECASE)
    if hdt_match:
        properties['hdt_045_mpa_c'] = float(hdt_match.group(1))
    
    # Extract melting temperature (if available)
    melt_match = re.search(r'Melt(?:ing)?\s*Temp.*?(\d+)\s*℃', normalized, re.IGNORECASE)
    if melt_match:
        properties['melt_temp_c'] = float(melt_match.group(1))
    
    # Extract glass transition temperature (if available)
    tg_match = re.search(r'Tg\s*.*?(\d+)\s*℃', normalized, re.IGNORECASE)
    if tg_match:
        properties['tg_c'] = float(tg_match.group(1))
    
    # Extract water absorption
    water_match = re.search(r'Water\s+Absorption\s*.*?(\d+\.\d+)\s*%', normalized, re.IGNORECASE)
    if water_match:
        properties['water_absorption_percent'] = float(water_match.group(1))
    
    return properties

def test_yousu_tds_extraction():
    """Test TDS extraction with Yousu PLA TDS"""
    tds_url = "https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf"
    
    print(f"📥 Downloading TDS from: {tds_url}")
    content = download_and_extract_tds(tds_url)
    
    print("\n📄 TDS Content (first 500 chars):")
    print(content[:500])
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