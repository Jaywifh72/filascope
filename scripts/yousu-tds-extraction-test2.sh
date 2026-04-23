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

# Read TDS content
content=$(cat "$temp_txt")

echo "📄 TDS Content (lines with numbers):"
echo "==================================="
# Show lines that contain numbers
grep -E '[0-9]+\.[0-9]+|[0-9]+%' "$temp_txt" | head -20
echo ""

# Now let's extract the actual values by looking at the structure
echo "🔍 Extracting properties by structure..."
echo ""

# The TDS has a table structure:
# Property | ASTM | Units | Test Condition | Typical Value
# We need to find the "Typical Value" column

# Let's look for specific patterns in the original content
echo "Looking for density value..."
if grep -A5 -B5 "Density" "$temp_txt" | grep -E '[0-9]+\.[0-9]+' | head -1; then
  density=$(grep -A5 -B5 "Density" "$temp_txt" | grep -E '[0-9]+\.[0-9]+' | head -1 | grep -oE '[0-9]+\.[0-9]+')
  echo "✅ Density: $density g/cm³"
else
  echo "❌ Density not found"
fi

echo ""
echo "Looking for tensile strength..."
if grep -A5 -B5 "Tensile Strength" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1; then
  tensile=$(grep -A5 -B5 "Tensile Strength" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1 | grep -oE '[0-9]+')
  echo "✅ Tensile Strength: $tensile MPa"
else
  echo "❌ Tensile Strength not found"
fi

echo ""
echo "Looking for elongation..."
if grep -A5 -B5 "Elongation" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1; then
  elongation=$(grep -A5 -B5 "Elongation" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1 | grep -oE '[0-9]+')
  echo "✅ Elongation: $elongation%"
else
  echo "❌ Elongation not found"
fi

echo ""
echo "Looking for flexural strength..."
if grep -A5 -B5 "Flexural Strength" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1; then
  flexural=$(grep -A5 -B5 "Flexural Strength" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1 | grep -oE '[0-9]+')
  echo "✅ Flexural Strength: $flexural MPa"
else
  echo "❌ Flexural Strength not found"
fi

echo ""
echo "Looking for flexural modulus..."
if grep -A5 -B5 "FlexuralModulus" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1; then
  flexural_modulus=$(grep -A5 -B5 "FlexuralModulus" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1 | grep -oE '[0-9]+')
  echo "✅ Flexural Modulus: $flexural_modulus MPa"
else
  echo "❌ Flexural Modulus not found"
fi

echo ""
echo "Looking for impact strength..."
if grep -A5 -B5 "Impact Strength" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1; then
  impact=$(grep -A5 -B5 "Impact Strength" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1 | grep -oE '[0-9]+')
  echo "✅ Impact Strength: $impact KJ/m²"
else
  echo "❌ Impact Strength not found"
fi

echo ""
echo "Looking for heat distortion temperature..."
if grep -A5 -B5 "Heat Distortion" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1; then
  hdt=$(grep -A5 -B5 "Heat Distortion" "$temp_txt" | grep -E '[0-9]+' | grep -v "D[0-9]" | head -1 | grep -oE '[0-9]+')
  echo "✅ Heat Distortion Temp: $hdt°C"
else
  echo "❌ Heat Distortion Temp not found"
fi

# Clean up
rm -f "$temp_pdf" "$temp_txt"