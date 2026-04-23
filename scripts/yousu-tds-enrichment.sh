#!/bin/bash

# Yousu TDS Enrichment Script
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
  
  # Extract text from PDF using pdftotext
  local temp_txt=$(mktemp)
  if command -v pdftotext &> /dev/null; then
    pdftotext "$temp_pdf" "$temp_txt" 2>/dev/null
  else
    echo "⚠️  pdftotext not found, trying alternative extraction..."
    # Try using strings as fallback
    strings "$temp_pdf" > "$temp_txt"
  fi
  
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
  
  # Read TDS content
  local content=$(cat "$temp_txt")
  
  # Extract density
  if [[ "$content" =~ [Dd]ensity[[:space:]]*:?([0-9]+\.[0-9]+)[[:space:]]*g/cm ]]; then
    density="${BASH_REMATCH[1]}"
  fi
  
  # Extract tensile strength
  if [[ "$content" =~ [Tt]ensile[[:space:]]*[Ss]trength[[:space:]]*:?([0-9]+\.[0-9]+)[[:space:]]*[Mm][Pp][Aa] ]]; then
    tensile_strength="${BASH_REMATCH[1]}"
  fi
  
  # Extract tensile modulus
  if [[ "$content" =~ [Tt]ensile[[:space:]]*[Mm]odulus[[:space:]]*:?([0-9]+\.[0-9]+)[[:space:]]*[Mm][Pp][Aa] ]]; then
    tensile_modulus="${BASH_REMATCH[1]}"
  fi
  
  # Extract elongation at break
  if [[ "$content" =~ [Ee]longation[[:space:]]*at[[:space:]]*[Bb]reak[[:space:]]*:?([0-9]+\.[0-9]+)[[:space:]]*% ]]; then
    elongation="${BASH_REMATCH[1]}"
  fi
  
  # Extract flexural strength
  if [[ "$content" =~ [Ff]lexural[[:space:]]*[Ss]trength[[:space:]]*:?([0-9]+\.[0-9]+)[[:space:]]*[Mm][Pp][Aa] ]]; then
    flexural_strength="${BASH_REMATCH[1]}"
  fi
  
  # Extract melting temperature
  if [[ "$content" =~ [Mm]elt[[:space:]]*[Tt]emp[[:space:]]*:?([0-9]+)[[:space:]]*°?[[:space:]]*[Cc]? ]]; then
    melt_temp="${BASH_REMATCH[1]}"
  fi
  
  # Extract glass transition temperature
  if [[ "$content" =~ [Tt]g[[:space:]]*:?([0-9]+)[[:space:]]*°?[[:space:]]*[Cc]? ]]; then
    glass_transition="${BASH_REMATCH[1]}"
  fi
  
  # Extract Vicat softening temperature
  if [[ "$content" =~ [Vv]icat[[:space:]]*:?([0-9]+)[[:space:]]*°?[[:space:]]*[Cc]? ]]; then
    vicat="${BASH_REMATCH[1]}"
  fi
  
  # Extract water absorption
  if [[ "$content" =~ [Ww]ater[[:space:]]*[Aa]bsorption[[:space:]]*:?([0-9]+\.[0-9]+)[[:space:]]*% ]]; then
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

# Process each filament
echo "🔄 Processing filaments..."
echo "$YOUSU_FILAMENTS" | jq -c '.[]' | while read -r filament; do
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

# Generate summary
echo "📊 Enrichment Summary"
echo "===================="

ENRICHED_COUNT=$(jq '[.filaments[] | select(.status == "enriched")] | length' "$REPORT_FILE")
NO_DATA_COUNT=$(jq '[.filaments[] | select(.status == "no_data")] | length' "$REPORT_FILE")

echo "Total filaments: $FILAMENT_COUNT"
echo "Enriched: $ENRICHED_COUNT"
echo "No data: $NO_DATA_COUNT"
echo ""

# Calculate new coverage
echo "📈 Calculating new coverage..."
NEW_COVERAGE=$(curl -s "$SUPABASE_URL/rest/v1/filaments?select=*&brand_name=eq.Yousu" \
  -H "apikey: $SUPABASE_KEY" \
  -H "Authorization: Bearer $SUPABASE_KEY" | jq '
  {
    total: length,
    with_density: [.[] | select(.density_g_cm3 != null)] | length,
    with_tensile: [.[] | select(.tensile_strength_xy_mpa != null)] | length,
    with_temps: [.[] | select(.nozzle_temp_min_c != null or .melt_temp_c != null)] | length,
    with_prices: [.[] | select(.variant_price != null)] | length,
    with_urls: [.[] | select(.product_url != null)] | length
  }
')

echo "$NEW_COVERAGE" | jq '.'

# Save final report
echo "💾 Saving final report..."
jq --argjson coverage "$NEW_COVERAGE" '. + {"final_coverage": $coverage}' \
  "$REPORT_FILE" > "$REPORT_FILE.tmp" && mv "$REPORT_FILE.tmp" "$REPORT_FILE"

echo ""
echo "✅ Yousu TDS enrichment complete!"
echo "📁 Report saved to: $REPORT_FILE"