#!/bin/bash

# Test TDS extraction with improved regex patterns
TDS_URL="https://ysfilament.com/u_file/2206/14/file/YOUSUPLATDS-8e09.pdf"

echo "📥 Downloading TDS from: $TDS_URL"

# Download PDF to temp file
temp_pdf=$(mktemp)
curl -s -L -o "$temp_pdf" "$TDS_URL"

# Extract text from PDF using pdftotext
temp_txt=$(mktemp)
pdftotext "$temp_pdf" "$temp_txt" 2>/dev/null || true

# Read TDS content and normalize whitespace
content=$(cat "$temp_txt" | tr '\n' ' ' | sed 's/  */ /g')

echo "📄 Normalized TDS Content (first 500 chars):"
echo "${content:0:500}"
echo ""

# Extract density
echo "🔍 Extracting properties..."
density=""
if [[ "$content" =~ [Dd]ensity[^0-9]*([0-9]+\.[0-9]+)[^0-9]*g/cm ]]; then
  density="${BASH_REMATCH[1]}"
  echo "✅ Density: $density g/cm³"
else
  echo "❌ Density not found"
fi

# Extract tensile strength
tensile=""
if [[ "$content" =~ [Tt]ensile[[:space:]]*[Ss]trength[^0-9]*([0-9]+)[^0-9]*[Mm][Pp][Aa] ]]; then
  tensile="${BASH_REMATCH[1]}"
  echo "✅ Tensile Strength: $tensile MPa"
else
  echo "❌ Tensile Strength not found"
fi

# Extract elongation
elongation=""
if [[ "$content" =~ [Ee]longation[^0-9]*([0-9]+)[^0-9]*% ]]; then
  elongation="${BASH_REMATCH[1]}"
  echo "✅ Elongation: $elongation%"
else
  echo "❌ Elongation not found"
fi

# Extract flexural strength
flexural=""
if [[ "$content" =~ [Ff]lexural[[:space:]]*[Ss]trength[^0-9]*([0-9]+)[^0-9]*[Mm][Pp][Aa] ]]; then
  flexural="${BASH_REMATCH[1]}"
  echo "✅ Flexural Strength: $flexural MPa"
else
  echo "❌ Flexural Strength not found"
fi

# Extract flexural modulus
flexural_modulus=""
if [[ "$content" =~ [Ff]lexural[Mm]odulus[^0-9]*([0-9]+)[^0-9]*[Mm][Pp][Aa] ]]; then
  flexural_modulus="${BASH_REMATCH[1]}"
  echo "✅ Flexural Modulus: $flexural_modulus MPa"
else
  echo "❌ Flexural Modulus not found"
fi

# Extract impact strength
impact=""
if [[ "$content" =~ [Ii]mpact[[:space:]]*[Ss]trength.*[Kk][Jj]/m[^0-9]*([0-9]+) ]]; then
  impact="${BASH_REMATCH[1]}"
  echo "✅ Impact Strength: $impact KJ/m²"
else
  echo "❌ Impact Strength not found"
fi

# Extract heat distortion temperature
hdt=""
if [[ "$content" =~ [Hh]eat[[:space:]]*[Dd]istortion[[:space:]]*[Tt]emp[^0-9]*([0-9]+)[^0-9]*℃ ]]; then
  hdt="${BASH_REMATCH[1]}"
  echo "✅ Heat Distortion Temp: $hdt°C"
else
  echo "❌ Heat Distortion Temp not found"
fi

# Clean up
rm -f "$temp_pdf" "$temp_txt"

echo ""
echo "📊 Extraction Summary:"
echo "Density: ${density:-not found}"
echo "Tensile Strength: ${tensile:-not found} MPa"
echo "Elongation: ${elongation:-not found}%"
echo "Flexural Strength: ${flexural:-not found} MPa"
echo "Flexural Modulus: ${flexural_modulus:-not found} MPa"
echo "Impact Strength: ${impact:-not found} KJ/m²"
echo "Heat Distortion Temp: ${hdt:-not found}°C"