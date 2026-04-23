#!/usr/bin/env node
/**
 * Test script for Amazon, TDS, Regional, and Scoring extractors
 * 
 * Usage:
 *   node test-week3-extractors.js --brand polymaker --test-amazon
 *   node test-week3-extractors.js --brand polymaker --test-tds
 *   node test-week3-extractors.js --brand polymaker --test-regional
 *   node test-week3-extractors.js --brand polymaker --test-scoring
 *   node test-week3-extractors.js --brand polymaker --test-all
 */

// Import extractors
import { generateAmazonAffiliateLink, extractAsinFromUrl, extractAffiliateTag, matchFilamentToAmazon, generateAllRegionalLinks, generateAmazonReport } from './amazon-extractor.ts';
import { extractTdsProperties, generateTdsReport } from './tds-extractor.ts';
import { extractRegionalPrices, calculateRegionalPrice, calculateAllRegionalPrices, extractRegionalUrls, generateRegionalUrl, generateAllRegionalUrls, extractRegionalData, generateRegionalReport } from './regional-extractor.ts';
import { calculateFilascopeScore, calculateEaseOfPrintingScore, calculateDimensionalAccuracyScore, calculatePrintabilityIndex, calculateValueScore, calculateAllScores, generateScoringReport } from './scoring-calculator.ts';

// Parse command line args
const args = process.argv.slice(2);
let brandSlug = 'polymaker';
let testAmazon = false;
let testTds = false;
let testRegional = false;
let testScoring = false;
let testAll = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--brand' && args[i + 1]) {
    brandSlug = args[i + 1];
    i++;
  } else if (args[i] === '--test-amazon') {
    testAmazon = true;
  } else if (args[i] === '--test-tds') {
    testTds = true;
  } else if (args[i] === '--test-regional') {
    testRegional = true;
  } else if (args[i] === '--test-scoring') {
    testScoring = true;
  } else if (args[i] === '--test-all') {
    testAll = true;
  }
}

if (testAll) {
  testAmazon = true;
  testTds = true;
  testRegional = true;
  testScoring = true;
}

// Test data
const testFilament = {
  id: 'test-123',
  product_title: 'Polymaker PLA Pro - Black',
  vendor: 'Polymaker',
  material: 'PLA',
  variant_price: 24.99,
  featured_image: 'https://example.com/image.jpg',
  nozzle_temp_min_c: 190,
  nozzle_temp_max_c: 230,
  bed_temp_min_c: 50,
  bed_temp_max_c: 60,
  density_g_cm3: 1.24,
  print_speed_max_mms: 60,
  retraction_length_mm: 6,
  tensile_strength_xy_mpa: 60,
  impact_strength_kj_m2: 5.5,
  diameter_nominal_mm: 1.75,
  amazon_link_us: 'https://www.amazon.com/dp/B08XYZ1234?tag=filascope-20',
  price_eur: 22.99,
  price_cad: 34.99
};

const testExistingAmazonLinks = [
  {
    title: 'Polymaker PLA Pro - Black',
    brand: 'Polymaker',
    material: 'PLA',
    url: 'https://www.amazon.com/dp/B08XYZ1234?tag=filascope-20',
    price: 24.99,
    currency: 'USD'
  },
  {
    title: 'eSun PLA+ - White',
    brand: 'eSun',
    material: 'PLA',
    url: 'https://www.amazon.com/dp/B09ABC5678?tag=filascope-20',
    price: 22.99,
    currency: 'USD'
  }
];

async function testAmazonExtractor() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TESTING AMAZON EXTRACTOR`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`Test Filament: ${testFilament.product_title}`);
  console.log(`Brand: ${testFilament.vendor}`);
  
  // Test ASIN extraction
  const asin = extractAsinFromUrl(testFilament.amazon_link_us || '');
  console.log(`\nASIN Extraction:`);
  console.log(`  URL: ${testFilament.amazon_link_us}`);
  console.log(`  ASIN: ${asin}`);
  
  // Test affiliate tag extraction
  const tag = extractAffiliateTag(testFilament.amazon_link_us || '');
  console.log(`\nAffiliate Tag Extraction:`);
  console.log(`  Tag: ${tag}`);
  
  // Test affiliate link generation
  const newLink = generateAmazonAffiliateLink('B08XYZ1234', 'filascope-20', 'US');
  console.log(`\nAffiliate Link Generation:`);
  console.log(`  ASIN: B08XYZ1234`);
  console.log(`  Link: ${newLink}`);
  
  // Test regional link generation
  const regionalLinks = generateAllRegionalLinks('B08XYZ1234', 'filascope-20');
  console.log(`\nRegional Links Generation:`);
  for (const [field, url] of Object.entries(regionalLinks)) {
    console.log(`  ${field}: ${url}`);
  }
  
  // Test filament matching
  const match = matchFilamentToAmazon(testFilament, testExistingAmazonLinks);
  console.log(`\nFilament Matching:`);
  if (match) {
    console.log(`  ✅ Match found: ${match.title}`);
    console.log(`  ASIN: ${match.asin}`);
    console.log(`  Confidence: ${match.matchConfidence}`);
  } else {
    console.log(`  ❌ No match found`);
  }
  
  // Test report generation
  const report = generateAmazonReport([testFilament], new Map());
  console.log(`\nAmazon Report:`);
  console.log(`  Total filaments: ${report.total_filaments}`);
  console.log(`  With Amazon links: ${report.filaments_with_amazon}`);
  console.log(`  Without Amazon links: ${report.filaments_without_amazon}`);
  console.log(`  Coverage: ${report.coverage_percentage}%`);
}

function testTdsExtractor() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TESTING TDS EXTRACTOR`);
  console.log(`${'='.repeat(60)}\n`);
  
  const testTdsContent = `
    Polymaker PLA Pro Technical Data Sheet
    
    Mechanical Properties:
    - Tensile Strength: 60 MPa
    - Tensile Modulus: 3500 MPa
    - Elongation at Break: 5%
    - Flexural Strength: 80 MPa
    - Impact Strength: 5.5 kJ/m²
    
    Thermal Properties:
    - Melting Temperature: 180°C
    - Glass Transition (Tg): 60°C
    - Vicat Softening: 65°C
    - HDT: 55°C
    
    Physical Properties:
    - Density: 1.24 g/cm³
    - Water Absorption: 0.5%
    
    Optical Properties:
    - Haze: 5%
    - Light Transmission: 90%
    
    Special Properties:
    - Carbon Fiber: 0%
    - Glass Fiber: 0%
    - Melt Index: 8 g/10min
  `;
  
  console.log(`Test TDS Content: ${testTdsContent.length} chars`);
  
  const extractions = extractTdsProperties(testTdsContent, 'polymaker', 'PLA Pro');
  
  console.log(`\nExtracted Properties: ${extractions.length}`);
  for (const extraction of extractions) {
    console.log(`  ${extraction.field}: ${extraction.value} (confidence: ${extraction.confidence})`);
  }
  
  const report = generateTdsReport([testFilament], new Map([['test-123', extractions]]));
  console.log(`\nTDS Report:`);
  console.log(`  Total filaments: ${report.total_filaments}`);
  console.log(`  With TDS data: ${report.filaments_with_tds_data}`);
  console.log(`  Coverage: ${report.coverage_percentage}%`);
  console.log(`  Fields extracted: ${Object.keys(report.fields_extracted).length}`);
}

function testRegionalExtractor() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TESTING REGIONAL EXTRACTOR`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`Test Filament: ${testFilament.product_title}`);
  console.log(`Base Price: $${testFilament.variant_price} USD`);
  
  // Test regional price extraction
  const existingPrices = extractRegionalPrices(testFilament);
  console.log(`\nExisting Regional Prices:`);
  for (const price of existingPrices) {
    console.log(`  ${price.field}: ${price.value} ${price.raw_value.currency}`);
  }
  
  // Test regional price calculation
  const calculatedPrices = calculateAllRegionalPrices(testFilament.variant_price || 0, testFilament.vendor);
  console.log(`\nCalculated Regional Prices:`);
  for (const price of calculatedPrices) {
    console.log(`  ${price.region}: ${price.price} ${price.currency} (confidence: ${price.confidence})`);
  }
  
  // Test regional URL extraction
  const existingUrls = extractRegionalUrls(testFilament);
  console.log(`\nExisting Regional URLs:`);
  for (const url of existingUrls) {
    console.log(`  ${url.field}: ${url.value}`);
  }
  
  // Test regional URL generation
  const generatedUrls = generateAllRegionalUrls('https://us.polymaker.com/products/pla-pro', 'polymaker');
  console.log(`\nGenerated Regional URLs:`);
  for (const [field, url] of Object.entries(generatedUrls)) {
    console.log(`  ${field}: ${url}`);
  }
  
  // Test full regional data extraction
  const regionalData = extractRegionalData(testFilament);
  console.log(`\nFull Regional Data:`);
  console.log(`  Prices: ${regionalData.prices.length}`);
  console.log(`  URLs: ${regionalData.urls.length}`);
  console.log(`  Calculated Prices: ${regionalData.calculatedPrices.length}`);
  
  const report = generateRegionalReport([testFilament], new Map([['test-123', regionalData]]));
  console.log(`\nRegional Report:`);
  console.log(`  Total filaments: ${report.total_filaments}`);
  console.log(`  With regional prices: ${report.filaments_with_regional_prices}`);
  console.log(`  With regional URLs: ${report.filaments_with_regional_urls}`);
}

function testScoringCalculator() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`TESTING SCORING CALCULATOR`);
  console.log(`${'='.repeat(60)}\n`);
  
  console.log(`Test Filament: ${testFilament.product_title}`);
  
  // Test filascope_score
  const filascopeScore = calculateFilascopeScore(testFilament);
  console.log(`\nfilascope_score:`);
  console.log(`  Score: ${filascopeScore.value}`);
  console.log(`  Confidence: ${filascopeScore.confidence}`);
  console.log(`  Factors: ${filascopeScore.factors.length}`);
  for (const factor of filascopeScore.factors) {
    console.log(`    ${factor.name}: ${factor.value} (weight: ${factor.weight}, contribution: ${factor.contribution.toFixed(2)})`);
  }
  
  // Test ease_of_printing_score
  const easeScore = calculateEaseOfPrintingScore(testFilament);
  console.log(`\nease_of_printing_score:`);
  console.log(`  Score: ${easeScore}`);
  
  // Test dimensional_accuracy_score
  const accuracyScore = calculateDimensionalAccuracyScore(testFilament);
  console.log(`\ndimensional_accuracy_score:`);
  console.log(`  Score: ${accuracyScore}`);
  
  // Test printability_index
  const printabilityIndex = calculatePrintabilityIndex(testFilament);
  console.log(`\nprintability_index:`);
  console.log(`  Score: ${printabilityIndex}`);
  
  // Test value_score
  const valueScore = calculateValueScore(testFilament);
  console.log(`\nvalue_score:`);
  console.log(`  Score: ${valueScore}`);
  
  // Test all scores
  const allScores = calculateAllScores(testFilament);
  console.log(`\nAll Scores (${allScores.length}):`);
  for (const score of allScores) {
    console.log(`  ${score.field}: ${score.value} (confidence: ${score.confidence})`);
  }
  
  const report = generateScoringReport([testFilament], new Map([['test-123', allScores]]));
  console.log(`\nScoring Report:`);
  console.log(`  Total filaments: ${report.total_filaments}`);
  console.log(`  With scores: ${report.filaments_with_scores}`);
  console.log(`  Average scores:`);
  for (const [field, score] of Object.entries(report.average_scores)) {
    console.log(`    ${field}: ${score}`);
  }
}

async function main() {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`WEEK 3 EXTRACTOR TEST SUITE`);
  console.log(`${'='.repeat(60)}`);
  
  console.log(`\nBrand: ${brandSlug}`);
  console.log(`Test Amazon: ${testAmazon}`);
  console.log(`Test TDS: ${testTds}`);
  console.log(`Test Regional: ${testRegional}`);
  console.log(`Test Scoring: ${testScoring}`);
  
  try {
    if (testAmazon) {
      await testAmazonExtractor();
    }
    
    if (testTds) {
      testTdsExtractor();
    }
    
    if (testRegional) {
      testRegionalExtractor();
    }
    
    if (testScoring) {
      testScoringCalculator();
    }
    
    console.log(`\n${'='.repeat(60)}`);
    console.log(`✅ ALL TESTS COMPLETE`);
    console.log(`${'='.repeat(60)}\n`);
    
  } catch (error) {
    console.error(`\n❌ TEST FAILED:`, error);
    process.exit(1);
  }
}

main();
