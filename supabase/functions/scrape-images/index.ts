import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ScrapeResult {
  total_processed: number
  images_found: number
  images_uploaded: number
  images_updated: number
  errors: string[]
  processed_records: Array<{
    id: string
    product_title: string
    vendor: string
    status: 'success' | 'no_url' | 'no_image_found' | 'upload_failed' | 'error'
    image_url?: string
  }>
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Verify admin
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
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    const body = await req.json()
    const limit = body.limit || 50 // Process 50 at a time to avoid timeouts

    console.log(`Starting image scraping for up to ${limit} filaments...`)

    // Get filaments without valid images that have product URLs
    const { data: filaments, error: fetchError } = await supabase
      .from('filaments')
      .select('id, product_title, vendor, product_url, featured_image')
      .not('product_url', 'is', null)
      .or('featured_image.is.null,featured_image.not.like.http%')
      .limit(limit)

    if (fetchError) {
      console.error('Error fetching filaments:', fetchError)
      throw fetchError
    }

    console.log(`Found ${filaments?.length || 0} filaments to process`)

    const result: ScrapeResult = {
      total_processed: filaments?.length || 0,
      images_found: 0,
      images_uploaded: 0,
      images_updated: 0,
      errors: [],
      processed_records: []
    }

    for (const filament of filaments || []) {
      const record: {
        id: string;
        product_title: string;
        vendor: string;
        status: 'success' | 'no_url' | 'no_image_found' | 'upload_failed' | 'error';
        image_url?: string;
      } = {
        id: filament.id,
        product_title: filament.product_title,
        vendor: filament.vendor || 'Unknown',
        status: 'no_image_found',
        image_url: undefined
      }

      try {
        if (!filament.product_url) {
          record.status = 'no_url'
          result.processed_records.push(record)
          continue
        }

        console.log(`Scraping: ${filament.vendor} - ${filament.product_title}`)

        // Fetch the product page
        const response = await fetch(filament.product_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; FilamentBot/1.0)'
          }
        })

        if (!response.ok) {
          console.error(`Failed to fetch ${filament.product_url}: ${response.status}`)
          record.status = 'error'
          result.errors.push(`${filament.product_title}: HTTP ${response.status}`)
          result.processed_records.push(record)
          continue
        }

        const html = await response.text()

        // Extract image URL using various strategies
        let imageUrl: string | null = null

        // Strategy 1: Look for og:image meta tag
        const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
        if (ogImageMatch) {
          imageUrl = ogImageMatch[1]
        }

        // Strategy 2: Look for twitter:image meta tag
        if (!imageUrl) {
          const twitterImageMatch = html.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i)
          if (twitterImageMatch) {
            imageUrl = twitterImageMatch[1]
          }
        }

        // Strategy 3: Look for product image in common patterns
        if (!imageUrl) {
          const productImageMatch = html.match(/<img[^>]*class=["'][^"']*product[^"']*["'][^>]*src=["']([^"']+)["']/i) ||
                                     html.match(/<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*product[^"']*["']/i)
          if (productImageMatch) {
            imageUrl = productImageMatch[1]
          }
        }

        // Strategy 4: Look for first large image
        if (!imageUrl) {
          const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*/gi)
          if (imgMatches) {
            for (const imgTag of imgMatches) {
              const srcMatch = imgTag.match(/src=["']([^"']+)["']/)
              if (srcMatch && srcMatch[1]) {
                const src = srcMatch[1]
                // Skip tiny images, icons, and logos
                if (!src.includes('icon') && !src.includes('logo') && !src.includes('thumb')) {
                  imageUrl = src
                  break
                }
              }
            }
          }
        }

        if (!imageUrl) {
          console.log(`No image found for ${filament.product_title}`)
          record.status = 'no_image_found'
          result.processed_records.push(record)
          continue
        }

        // Make URL absolute if relative
        if (imageUrl.startsWith('//')) {
          imageUrl = 'https:' + imageUrl
        } else if (imageUrl.startsWith('/')) {
          const urlObj = new URL(filament.product_url)
          imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`
        } else if (!imageUrl.startsWith('http')) {
          const urlObj = new URL(filament.product_url)
          imageUrl = `${urlObj.protocol}//${urlObj.host}/${imageUrl}`
        }

        console.log(`Found image: ${imageUrl}`)
        result.images_found++
        record.image_url = imageUrl

        // Download the image
        const imageResponse = await fetch(imageUrl)
        if (!imageResponse.ok) {
          console.error(`Failed to download image: ${imageResponse.status}`)
          record.status = 'upload_failed'
          result.errors.push(`${filament.product_title}: Failed to download image`)
          result.processed_records.push(record)
          continue
        }

        const imageBlob = await imageResponse.blob()
        const imageBuffer = await imageBlob.arrayBuffer()
        
        // Generate filename
        const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
        const fileName = `${filament.id}.${fileExt}`
        const filePath = `product-images/${fileName}`

        // Upload to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('filament-images')
          .upload(filePath, imageBuffer, {
            contentType: imageResponse.headers.get('content-type') || 'image/jpeg',
            upsert: true
          })

        if (uploadError) {
          console.error(`Upload error for ${filament.product_title}:`, uploadError)
          record.status = 'upload_failed'
          result.errors.push(`${filament.product_title}: ${uploadError.message}`)
          result.processed_records.push(record)
          continue
        }

        result.images_uploaded++

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('filament-images')
          .getPublicUrl(filePath)

        // Update database
        const { error: updateError } = await supabase
          .from('filaments')
          .update({ featured_image: publicUrlData.publicUrl })
          .eq('id', filament.id)

        if (updateError) {
          console.error(`Database update error:`, updateError)
          record.status = 'error'
          result.errors.push(`${filament.product_title}: ${updateError.message}`)
        } else {
          result.images_updated++
          record.status = 'success'
          console.log(`✓ Success: ${filament.vendor} - ${filament.product_title}`)
        }

        result.processed_records.push(record)

      } catch (error) {
        console.error(`Error processing ${filament.product_title}:`, error)
        record.status = 'error'
        result.errors.push(`${filament.product_title}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        result.processed_records.push(record)
      }

      // Small delay to avoid overwhelming servers
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log('Scraping complete:', {
      total_processed: result.total_processed,
      images_found: result.images_found,
      images_uploaded: result.images_uploaded,
      images_updated: result.images_updated,
      errors_count: result.errors.length
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${result.total_processed} filaments, updated ${result.images_updated} images`,
        result
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Scraping error:', error)
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