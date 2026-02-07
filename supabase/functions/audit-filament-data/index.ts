import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { sanitizeIlikeInput } from '../_shared/sanitize-input.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface FilamentIssue {
  id: string
  product_title: string
  vendor: string
  issue_type: string
  severity: 'error' | 'warning' | 'info'
  details: string
  current_values: {
    variant_price?: number | null
    net_weight_g?: number | null
    pack_quantity?: number | null
    calculated_price_per_kg?: number | null
  }
  suggested_fix?: string
}

interface AuditResult {
  total_filaments: number
  issues_found: number
  issues_by_severity: {
    error: number
    warning: number
    info: number
  }
  issues_by_type: Record<string, number>
  issues: FilamentIssue[]
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Admin authorization check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user }, error: authError } = await authClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: isAdmin } = await authClient.rpc('has_role', { 
      _user_id: user.id, 
      _role: 'admin' 
    })
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const vendor = url.searchParams.get('vendor')
    const autoFix = url.searchParams.get('autoFix') === 'true'
    const limit = parseInt(url.searchParams.get('limit') || '1000')

    console.log(`Starting filament data audit. Vendor filter: ${vendor || 'all'}, Auto-fix: ${autoFix}, Limit: ${limit}`)

    // Fetch filaments
    let query = supabase
      .from('filaments')
      .select('id, product_title, vendor, variant_price, net_weight_g, pack_quantity')
      .limit(limit)

    if (vendor) {
      const safeVendor = sanitizeIlikeInput(vendor)
      query = query.ilike('vendor', `%${safeVendor}%`)
    }

    const { data: filaments, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError)
      throw fetchError
    }

    console.log(`Fetched ${filaments?.length || 0} filaments for audit`)

    const issues: FilamentIssue[] = []
    const autoFixUpdates: { id: string; updates: Record<string, any>; reason: string }[] = []

    for (const filament of filaments || []) {
      const { id, product_title, vendor: filamentVendor, variant_price, net_weight_g, pack_quantity } = filament
      const packQty = pack_quantity || 1
      
      // Calculate price per kg
      const pricePerKg = (variant_price && net_weight_g && net_weight_g > 0) 
        ? variant_price / (packQty * (net_weight_g / 1000)) 
        : null

      const currentValues = {
        variant_price,
        net_weight_g,
        pack_quantity: packQty,
        calculated_price_per_kg: pricePerKg ? Math.round(pricePerKg * 100) / 100 : null
      }

      // Check 1: Missing critical data
      if (!variant_price) {
        issues.push({
          id, product_title, vendor: filamentVendor,
          issue_type: 'missing_price',
          severity: 'warning',
          details: 'Filament has no price set',
          current_values: currentValues
        })
      }

      if (!net_weight_g) {
        issues.push({
          id, product_title, vendor: filamentVendor,
          issue_type: 'missing_weight',
          severity: 'warning',
          details: 'Filament has no weight set',
          current_values: currentValues
        })
      }

      // Check 2: Suspicious weight values
      if (net_weight_g && net_weight_g > 2000 && packQty === 1) {
        // Check if title indicates multi-pack
        const multiPackMatch = product_title.match(/(\d+)\s*(pack|packs|rolls|spools|-pack)/i)
        if (multiPackMatch) {
          const detectedPackQty = parseInt(multiPackMatch[1])
          issues.push({
            id, product_title, vendor: filamentVendor,
            issue_type: 'weight_pack_mismatch',
            severity: 'error',
            details: `Weight is ${net_weight_g}g with pack_quantity=1, but title suggests ${detectedPackQty}-pack`,
            current_values: currentValues,
            suggested_fix: `Set net_weight_g=${Math.round(net_weight_g / detectedPackQty)}, pack_quantity=${detectedPackQty}`
          })

          if (autoFix) {
            autoFixUpdates.push({
              id,
              updates: { 
                net_weight_g: Math.round(net_weight_g / detectedPackQty), 
                pack_quantity: detectedPackQty 
              },
              reason: `Auto-detected ${detectedPackQty}-pack from title`
            })
          }
        } else if (net_weight_g > 3000) {
          // Suspicious high weight without multi-pack indicator
          issues.push({
            id, product_title, vendor: filamentVendor,
            issue_type: 'suspicious_weight',
            severity: 'warning',
            details: `Unusually high weight (${net_weight_g}g) for single spool - verify if this is a multi-pack or bulk spool`,
            current_values: currentValues
          })
        }
      }

      // Check 3: Multi-pack title with pack_quantity=1
      if (packQty === 1) {
        const multiPackPatterns = [
          /(\d+)\s*-?\s*pack/i,
          /(\d+)\s*rolls/i,
          /(\d+)\s*spools/i,
          /pack\s*of\s*(\d+)/i,
          /bundle\s*of\s*(\d+)/i,
        ]
        
        for (const pattern of multiPackPatterns) {
          const match = product_title.match(pattern)
          if (match) {
            const detectedQty = parseInt(match[1])
            if (detectedQty > 1 && detectedQty <= 20) {
              issues.push({
                id, product_title, vendor: filamentVendor,
                issue_type: 'pack_quantity_mismatch',
                severity: 'error',
                details: `Title indicates ${detectedQty}-pack but pack_quantity is ${packQty}`,
                current_values: currentValues,
                suggested_fix: `Set pack_quantity=${detectedQty}`
              })

              if (autoFix && net_weight_g && net_weight_g <= 1500) {
                autoFixUpdates.push({
                  id,
                  updates: { pack_quantity: detectedQty },
                  reason: `Auto-detected ${detectedQty}-pack from title pattern`
                })
              }
              break
            }
          }
        }
      }

      // Check 4: Price per kg too low (under $5/kg excluding known bulk)
      if (pricePerKg && pricePerKg < 5) {
        const isBulkProduct = product_title.toLowerCase().includes('bulk') || 
                              product_title.toLowerCase().includes('farm') ||
                              (net_weight_g && net_weight_g >= 5000)
        
        if (!isBulkProduct) {
          issues.push({
            id, product_title, vendor: filamentVendor,
            issue_type: 'price_too_low',
            severity: 'error',
            details: `Calculated price of $${pricePerKg.toFixed(2)}/kg is suspiciously low - likely data error`,
            current_values: currentValues,
            suggested_fix: 'Verify price and pack_quantity are correct'
          })
        }
      }

      // Check 5: Price per kg too high (over $200/kg)
      if (pricePerKg && pricePerKg > 200) {
        issues.push({
          id, product_title, vendor: filamentVendor,
          issue_type: 'price_too_high',
          severity: 'warning',
          details: `Calculated price of $${pricePerKg.toFixed(2)}/kg is unusually high - verify data`,
          current_values: currentValues
        })
      }

      // Check 6: Negative or zero values
      if (variant_price !== null && variant_price <= 0) {
        issues.push({
          id, product_title, vendor: filamentVendor,
          issue_type: 'invalid_price',
          severity: 'error',
          details: `Price is ${variant_price} (should be positive)`,
          current_values: currentValues
        })
      }

      if (net_weight_g !== null && net_weight_g <= 0) {
        issues.push({
          id, product_title, vendor: filamentVendor,
          issue_type: 'invalid_weight',
          severity: 'error',
          details: `Weight is ${net_weight_g}g (should be positive)`,
          current_values: currentValues
        })
      }

      // Check 7: Unusual weight values (not standard spool sizes)
      const standardWeights = [200, 250, 350, 500, 750, 850, 1000, 1100, 2000, 2300, 2500, 3000, 3500, 5000]
      if (net_weight_g && !standardWeights.some(w => Math.abs(w - net_weight_g) < 50)) {
        // Only flag if significantly different from common weights
        if (net_weight_g > 1500 && net_weight_g < 4500 && packQty === 1) {
          issues.push({
            id, product_title, vendor: filamentVendor,
            issue_type: 'unusual_weight',
            severity: 'info',
            details: `Weight ${net_weight_g}g is not a standard spool size - may need verification`,
            current_values: currentValues
          })
        }
      }
    }

    // Apply auto-fixes if enabled
    let fixedCount = 0
    if (autoFix && autoFixUpdates.length > 0) {
      console.log(`Applying ${autoFixUpdates.length} auto-fixes...`)
      
      for (const fix of autoFixUpdates) {
        const { error: updateError } = await supabase
          .from('filaments')
          .update(fix.updates)
          .eq('id', fix.id)

        if (updateError) {
          console.error(`Failed to auto-fix ${fix.id}:`, updateError)
        } else {
          console.log(`Auto-fixed ${fix.id}: ${fix.reason}`)
          fixedCount++
        }
      }
    }

    // Compile results
    const issuesByType: Record<string, number> = {}
    const issuesBySeverity = { error: 0, warning: 0, info: 0 }

    for (const issue of issues) {
      issuesByType[issue.issue_type] = (issuesByType[issue.issue_type] || 0) + 1
      issuesBySeverity[issue.severity]++
    }

    const result: AuditResult = {
      total_filaments: filaments?.length || 0,
      issues_found: issues.length,
      issues_by_severity: issuesBySeverity,
      issues_by_type: issuesByType,
      issues: issues.slice(0, 200) // Limit returned issues to prevent huge responses
    }

    console.log(`Audit complete. Found ${issues.length} issues across ${filaments?.length} filaments`)
    console.log('Issues by severity:', issuesBySeverity)
    console.log('Issues by type:', issuesByType)
    
    if (autoFix) {
      console.log(`Auto-fixed ${fixedCount}/${autoFixUpdates.length} issues`)
    }

    return new Response(JSON.stringify({
      success: true,
      ...result,
      auto_fixes_applied: autoFix ? fixedCount : 0,
      auto_fixes_attempted: autoFix ? autoFixUpdates.length : 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Audit error:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
