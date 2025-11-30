import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CleanupResult {
  total_checked: number
  invalid_found: number
  fixed: number
  errors: string[]
  invalid_records: Array<{
    id: string
    product_title: string
    vendor: string
    featured_image: string
  }>
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify user is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)

    if (userError || !user) {
      console.error('User auth error:', userError)
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: hasAdminRole } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    })

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting image cleanup process...')

    // Get all filaments
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, vendor, featured_image')
      .not('featured_image', 'is', null)

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError)
      throw fetchError
    }

    console.log(`Checking ${filaments?.length || 0} filament records...`)

    const result: CleanupResult = {
      total_checked: filaments?.length || 0,
      invalid_found: 0,
      fixed: 0,
      errors: [],
      invalid_records: []
    }

    // Check each filament for invalid images
    const invalidRecords: Array<{ id: string; product_title: string; vendor: string; featured_image: string }> = []

    for (const filament of filaments || []) {
      const image = filament.featured_image

      // Check if image URL is invalid (doesn't start with http/https, or looks like a timestamp)
      const isInvalid = 
        !image.startsWith('http://') && 
        !image.startsWith('https://') ||
        /^\d{4}-\d{2}-\d{2}/.test(image) // Matches date patterns

      if (isInvalid) {
        result.invalid_found++
        invalidRecords.push({
          id: filament.id,
          product_title: filament.product_title,
          vendor: filament.vendor || 'Unknown',
          featured_image: image
        })

        // Update the record to set featured_image to null
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ featured_image: null })
          .eq('id', filament.id)

        if (updateError) {
          console.error(`Error updating filament ${filament.id}:`, updateError)
          result.errors.push(`${filament.product_title}: ${updateError.message}`)
        } else {
          result.fixed++
          console.log(`Fixed: ${filament.vendor} - ${filament.product_title}`)
        }
      }
    }

    result.invalid_records = invalidRecords

    console.log('Cleanup complete:', {
      total_checked: result.total_checked,
      invalid_found: result.invalid_found,
      fixed: result.fixed,
      errors_count: result.errors.length
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup complete: Fixed ${result.fixed} out of ${result.invalid_found} invalid images`,
        result
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Cleanup error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const errorDetails = error instanceof Error ? error.toString() : String(error)
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})