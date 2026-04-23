#!/bin/bash

# Yousu TDS Enrichment Script (Fixed)
# Enriches Yousu filaments using their Technical Data Sheets (TDS)

set -e

# Configuration
SUPABASE_URL="https://fytxfdvbzstnimzhjgth.supabase.co"
SUPABASE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY ~/.hermes/.env | cut -d'=' -f2)
OUTPUT_DIR="/home/jay/filascope/reports/yousu-tds-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"

echo "🔧 Yousu TDS Enrichment Script"
echo "=============================="
echo "Output: $OUTPUT_DIR"
echo ""

# TDS PDF mappings (material type -> TDS URL)
declare -A TDS_URLS=(
  ["PLA"]="https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf"
  ["PETG"]="https://ysfilament.com/u_file/2206/14/file/YOUSUPETGTDS-8fb4.pdf"
  ["PVB"]="https://ysfilament.com/u_file/2206/14/file/YOUSUPVBTDS-9c2c.pdf"
  ["PP"]="https://ysfilament.com/u_file/2211/06/file/YOUSU3DPPTDS-4872.pdf"
  ["PLA_ALT"]="https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-081b.pdf"
)

# Function to extract material type from filament name
extract_material() {
  local name="$1"
  name=$(echo "$name" | tr '[:lower:]' '[:upper:]')
  
  if [[ "$name" == *"PETG"* ]]; then
    echo "PETG"
  elif [[ "$name" == *"PVB"* ]]; then
    echo "PVB"
  elif [[ "$name" == *"PP"* ]]; then
    echo "PP"
  elif [[ "$name" == *"PLA"* ]]; then
    echo "PLA"
  else
    echo "PLA"  # Default to PLA
  fi
}

# Function to download and extract TDS data
extract_tds_data() {
  local tds_url="$1"
  local material="$2"
  
  echo "📥 Downloading TDS for $material from: $tds_url"
  
  # Download PDF to temp file
  local temp_pdf=$(mktemp)
  curl -s -L -o "$temp_pdf" "$tds_url"
  
  # Check if download was successful
  if [[ ! -s "$temp_pdf" ]]; then
    echo "⚠️  Failed to download TDS PDF"
    echo "{}"
    return
  fi
  
  # Extract text from PDF using pdftotext
  local temp_txt=$(mktemp)
  pdftotext "$temp_pdf" "$temp_txt" 2>/dev/null || true
  
  # Check if extraction was successful
  if [[ ! -s "$temp_txt" ]]; then
    echo "⚠️  Failed to extract text from PDF"
    rm -f "$temp_pdf" "$temp_txt"
    echo "{}"
    return
  fi
  
  # Read TDS content
  local content=$(cat "$temp_txt")
  
  # Extract properties from TDS text
  local density=""
  local tensile_strength=""
  local tensile_modulus=""
  local elongation=""
  local flexural_strength=""
  local melt_temp=""
  local glass_transition=""
  local vicat=""
  local water_absorption=""
  
  # Extract density (look for pattern like "1.23" after "Density" and "g/cm3")
  if [[ "$content" =~ [Dd]ensity[^0-9]*([0-9]+\.[0-9]+)[^0-9]*g/cm ]]; then
    density="${BASH_REMATCH[1]}"
  fi
  
  # Extract tensile strength
  if [[ "$content" =~ [Tt]ensile[[:space:]]*[Ss]trength[^0-9]*([0-9]+\.[0-9]+)[^0-9]*[Mm][Pp][Aa] ]]; then
    tensile_strength="${BASH_REMATCH[1]}"
  fi
  
  # Extract tensile modulus
  if [[ "$content" =~ [Tt]ensile[[:space:]]*[Mm]odulus[^0-9]*([0-9]+\.[0-9]+)[^0-9]*[Mm][Pp][Aa] ]]; then
    tensile_modulus="${BASH_REMATCH[1]}"
  fi
  
  # Extract elongation at break
  if [[ "$content" =~ [Ee]longation[[:space:]]*at[[:space:]]*[Bb]reak[^0-9]*([0-9]+\.[0-9]+)[^0-9]*% ]]; then
    elongation="${BASH_REMATCH[1]}"
  fi
  
  # Extract flexural strength
  if [[ "$content" =~ [Ff]lexural[[:space:]]*[Ss]trength[^0-9]*([0-9]+\.[0-9]+)[^0-9]*[Mm][Pp][Aa] ]]; then
    flexural_strength="${BASH_REMATCH[1]}"
  fi
  
  # Extract melting temperature
  if [[ "$content" =~ [Mm]elt[[:space:]]*[Tt]emp[^0-9]*([0-9]+)[^0-9]*°?[[:space:]]*[Cc]? ]]; then
    melt_temp="${BASH_REMATCH[1]}"
  fi
  
  # Extract glass transition temperature
  if [[ "$content" =~ [Tt]g[^0-9]*([0-9]+)[^0-9]*°?[[:space:]]*[Cc]? ]]; then
    glass_transition="${BASH_REMATCH[1]}"
  fi
  
  # Extract Vicat softening temperature
  if [[ "$content" =~ [Vv]icat[^0-9]*([0-9]+)[^0-9]*°?[[:space:]]*[Cc]? ]]; then
    vicat="${BASH_REMATCH[1]}"
  fi
  
  # Extract water absorption
  if [[ "$content" =~ [Ww]ater[[:space:]]*[Aa]bsorption[^0-9]*([0-9]+\.[0-9]+)[^0-9]*% ]]; then
    water_absorption="${BASH_REMATCH[1]}"
  fi
  
  # Clean up temp files
  rm -f "$temp_pdf" "$temp_txt"
  
  # Return extracted data as JSON
  cat <<EOF
{
  "density_g_cm3": ${density:-null},
  "tensile_strength_xy_mpa": ${tensile_strength:-null},
  "tensile_modulus_xy_mpa": ${tensile_modulus:-null},
  "elongation_break_xy_percent": ${elongation:-null},
  "flexural_strength_mpa": ${flexural_strength:-null},
  "melt_temp_c": ${melt_temp:-null},
  "tg_c": ${glass_transition:-null},
  "vicat_softening_temp_c": ${vicat:-null},
  "water_absorption_percent": ${water_absorption:-null}
}
EOF
}

# Get all Yousu filaments
echo "📊 Fetching Yousu filaments from database..."
YOUSU_FILAMENTS=$(curl -s "$SUPABASE_URL/rest/v1/filaments?select=*&brand_name=eq.Yousu" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY")

FILAMENT_COUNT=$(echo "$YOUSU_FILAMENTS" | jq 'length')
echo "Found $FILAMENT_COUNT Yousu filaments"
echo ""

# Create enrichment report
REPORT_FILE="$OUTPUT_DIR/yousu-enrichment-report.json"
echo '{"brand": "Yousu", "timestamp": "'$(date -Iseconds)'", "filaments": []}' > "$REPORT_FILE"

# Process first 5 filaments as a test
echo "🔄 Processing first 5 filaments as test..."
echo "$YOUSU_FILAMENTS" | jq -c '.[0:5][]' | while read -r filament; do
  FILAMENT_ID=$(echo "$filament" | jq -r '.id')
  FILAMENT_NAME=$(echo "$filament" | jq -r '.product_title')
  PRODUCT_URL=$(echo "$filament" | jq -r '.product_url')
  
  echo "  📦 Processing: $FILAMENT_NAME"
  echo "     URL: $PRODUCT_URL"
  
  # Extract material type
  MATERIAL=$(extract_material "$FILAMENT_NAME")
  echo "     Material: $MATERIAL"
  
  # Get TDS URL for this material
  TDS_URL="${TDS_URLS[$MATERIAL]}"
  if [[ -z "$TDS_URL" ]]; then
    echo "     ⚠️  No TDS URL found for material: $MATERIAL"
    continue
  fi
  
  echo "     TDS URL: $TDS_URL"
  
  # Extract TDS data
  TDS_DATA=$(extract_tds_data "$TDS_URL" "$MATERIAL")
  
  # Check if we got any data
  NON_NULL_COUNT=$(echo "$TDS_DATA" | jq '[.[] | select(. != null)] | length')
  
  if [[ "$NON_NULL_COUNT" -gt 0 ]]; then
    echo "     ✅ Extracted $NON_NULL_COUNT properties"
    
    # Update database
    echo "     📝 Updating database..."
    
    # Build update payload
    UPDATE_PAYLOAD=$(echo "$TDS_DATA" | jq 'with_entries(select(.value != null))')
    
    if [[ "$UPDATE_PAYLOAD" != "{}" ]]; then
      # Add TDS source URL
      UPDATE_PAYLOAD=$(echo "$UPDATE_PAYLOAD" | jq '. + {"tds_url": "'"$TDS_URL"'"}')
      
      # Execute update
      UPDATE_RESULT=$(curl -s -X PATCH "$SUPABASE_URL/rest/v1/filaments?id=eq.$FILAMENT_ID" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -H "Prefer: return=minimal" \
        -d "$UPDATE_PAYLOAD")
      
      if [[ -z "$UPDATE_RESULT" ]]; then
        echo "     ✅ Database updated successfully"
      else
        echo "     ❌ Database update failed: $UPDATE_RESULT"
      fi
    fi
    
    # Update report
    jq --arg id "$FILAMENT_ID" --argjson data "$TDS_DATA" \
      '.filaments += [{"id": $id, "data": $data, "status": "enriched"}]' \
      "$REPORT_FILE" > "$REPORT_FILE.tmp" && mv "$REPORT_FILE.tmp" "$REPORT_FILE"
  else
    echo "     ⚠️  No properties extracted from TDS"
    
    # Update report
    jq --arg id "$FILAMENT_ID" \
      '.filaments += [{"id": $id, "status": "no_data"}]' \
      "$REPORT_FILE" > "$REPORT_FILE.tmp" && mv "$REPORT_FILE.tmp" "$REPORT_FILE"
  fi
  
  echo ""
done

echo "✅ Test run complete!"
echo "📁 Report saved to: $REPORT_FILE"
echo ""
echo "To process all filaments, remove the [0:5] slice in the script."