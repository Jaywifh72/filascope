#!/usr/bin/env node
/**
 * Enrichment Script for Critical Brands
 * 
 * Extracts technical specs using Firecrawl and updates database.
 * Focuses on brands with < 30% coverage.
 */

const https = require('https');
const http = require('http');

// Supabase credentials
const SUPABASE_URL = "https://fytxfdvbzstnimzhjgth.supabase.co";

// Load credentials from env
function loadCredentials() {
    const fs = require('fs');
    const path = require('path');
    const envFile = path.join(process.env.HOME, '.hermes/.env');
    
    let supabaseKey = '';
    
    if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const match = content.match(/SUPABASE_SERVICE_ROLE_KEY=([^\n]+)/);
        if (match) {
            supabaseKey = match[1].trim().replace(/"/g, '');
        }
    }
    
    return supabaseKey;
}

// Extract temperature specs from text
function extractTemperatureSpecs(text) {
    const specs = {};
    
    // Nozzle temp patterns
    const nozzleMatch = text.match(/nozzle.*?(\d+)\s*°?\s*C/gi);
    if (nozzleMatch) {
        const temps = nozzleMatch.map(m => parseInt(m.match(/\d+/)[0]));
        specs.nozzle_temp_min_c = Math.min(...temps);
        specs.nozzle_temp_max_c = Math.max(...temps);
    }
    
    // Bed temp patterns
    const bedMatch = text.match(/bed.*?(\d+)\s*°?\s*C/gi);
    if (bedMatch) {
        const temps = bedMatch.map(m => parseInt(m.match(/\d+/)[0]));
        specs.bed_temp_min_c = Math.min(...temps);
        specs.bed_temp_max_c = Math.max(...temps);
    }
    
    // Generic temperature patterns
    const tempMatches = text.match(/(\d+)\s*°?\s*C/g);
    if (tempMatches) {
        const temps = tempMatches.map(m => parseInt(m.match(/\d+/)[0])).filter(t => t > 150 && t < 350);
        if (temps.length > 0 && !specs.nozzle_temp_min_c) {
            specs.nozzle_temp_min_c = Math.min(...temps);
            specs.nozzle_temp_max_c = Math.max(...temps);
        }
    }
    
    return specs;
}

// Firecrawl extraction
async function extractWithFirecrawl(url, apiKey) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({
            url: url,
            pageOptions: { "onlyMainContent": true }
        });
        
        const options = {
            hostname: 'api.firecrawl.dev',
            port: 443,
            path: '/v0/scrape',
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(body);
                    if (json.success && json.data) {
                        resolve(json.data.content || '');
                    } else {
                        resolve('');
                    }
                } catch (e) {
                    resolve('');
                }
            });
        });
        
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// Main enrichment function
async function enrichCriticalBrands() {
    const supabaseKey = loadCredentials();
    
    if (!supabaseKey) {
        console.error("ERROR: SUPABASE_SERVICE_ROLE_KEY not found");
        process.exit(1);
    }
    
    // Load Firecrawl key
    const fs = require('fs');
    const path = require('path');
    const envFile = path.join(process.env.HOME, '.hermes/.env');
    let firecrawlKey = '';
    
    if (fs.existsSync(envFile)) {
        const content = fs.readFileSync(envFile, 'utf8');
        const match = content.match(/FIRECRAWL_API_KEY=([^\n]+)/);
        if (match) {
            firecrawlKey = match[1].trim().replace(/"/g, '');
        }
    }
    
    console.log("=== ENRICHING CRITICAL BRANDS ===\n");
    
    // Critical brands with product URLs to test
    const testBrands = [
        { name: "Fiberlogy", url: "https://fiberlogy.com/en/FiberFlex-40D-Filament-1_75mm-0_85kg" },
        { name: "Bambu Lab", url: "https://us.store.bambulab.com/products/pla-basic-filament" },
    ];
    
    for (const brand of testBrands) {
        console.log(`\n=== PROCESSING: ${brand.name} ===`);
        console.log(`URL: ${brand.url}`);
        
        // Extract content
        const content = await extractWithFirecrawl(brand.url, firecrawlKey);
        
        if (content) {
            console.log(`Content length: ${content.length} chars`);
            
            // Extract specs
            const specs = extractTemperatureSpecs(content);
            console.log(`Extracted specs:`, specs);
        } else {
            console.log("No content extracted");
        }
        
        // Rate limit
        await new Promise(r => setTimeout(r, 1000));
    }
    
    console.log("\n=== ENRICHMENT COMPLETE ===");
}

enrichCriticalBrands().catch(console.error);
