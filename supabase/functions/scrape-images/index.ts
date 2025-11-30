import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0'
import FirecrawlApp from 'https://esm.sh/@mendable/firecrawl-js@1.10.1'

// Helper function to validate if a string is a valid URL
const isValidUrl = (urlString: string): boolean => {
  try {
    const url = new URL(urlString)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

// Helper function to convert thumbnail URLs to full-size
const getFullSizeImageUrl = (imageUrl: string): string => {
  // Remove size parameters like _150x150, _200x200, etc.
  let fullSizeUrl = imageUrl.replace(/_\d+x\d+\.(png|jpg|jpeg|webp|gif)/i, '.$1')
  
  // Remove size query parameters for Shopify CDN
  if (fullSizeUrl.includes('cdn.shop')) {
    fullSizeUrl = fullSizeUrl.replace(/([?&])width=\d+/gi, '')
    fullSizeUrl = fullSizeUrl.replace(/([?&])height=\d+/gi, '')
    // Clean up double && or trailing ? or &
    fullSizeUrl = fullSizeUrl.replace(/&&/g, '&').replace(/\?&/g, '?').replace(/[?&]$/g, '')
  }
  
  return fullSizeUrl
}

// Retry function with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt)
        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms delay`)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

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

// Special handler for vendor collection pages
async function scrapeVendorCollection(
  supabase: any,
  firecrawl: any,
  filamentIds: string[] | null,
  forceRescrape: boolean,
  corsHeaders: any,
  vendorName: string,
  collectionUrl: string
) {
  console.log(`Scraping ${vendorName} collection page: ${collectionUrl}`)
  
  // Get vendor filaments from database
  let query = supabase
    .from('filaments')
    .select('id, product_title, vendor, product_url, featured_image')
    .eq('vendor', vendorName)
  
  if (filamentIds && filamentIds.length > 0) {
    query = query.in('id', filamentIds)
  } else if (!forceRescrape) {
    query = query.is('featured_image', null)
  }
  
  const { data: filaments, error: fetchError } = await query
  
  if (fetchError) {
    console.error(`Error fetching ${vendorName} filaments:`, fetchError)
    throw fetchError
  }
  
  console.log(`Found ${filaments?.length || 0} ${vendorName} filaments to process`)
  
  const result: ScrapeResult = {
    total_processed: filaments?.length || 0,
    images_found: 0,
    images_uploaded: 0,
    images_updated: 0,
    errors: [],
    processed_records: []
  }
  
  try {
    // Scrape the collection page
    const scrapeResult = await retryWithBackoff(
      () => firecrawl.scrapeUrl(collectionUrl, {
        formats: ['html'],
        onlyMainContent: false
      }),
      2,
      1000
    ) as { success: boolean; html?: string }
    
    if (!scrapeResult.success || !scrapeResult.html) {
      throw new Error(`Failed to scrape ${vendorName} collection page`)
    }
    
    const html = scrapeResult.html
    console.log('Successfully scraped collection page')
    
    // Extract product cards - Shopify typically uses product-card or product-item classes
    const productCardPattern = /<div[^>]*class=["'][^"']*product[^"']*["'][^>]*>([\s\S]*?)<\/div>/gi
    const productCards = Array.from(html.matchAll(productCardPattern))
    
    console.log(`Found ${productCards.length} product cards on page`)
    
    // Process each filament
    for (const filament of filaments || []) {
      const record: any = {
        id: filament.id,
        product_title: filament.product_title,
        vendor: vendorName,
        status: 'no_image_found',
        image_url: undefined
      }
      
      try {
        // Find matching product by title
        let imageUrl: string | null = null
        const simplifiedTitle = filament.product_title
          .toLowerCase()
          .replace(new RegExp(vendorName, 'gi'), '')
          .replace(/[^a-z0-9\s]/g, '')
          .trim()
        
        for (const match of productCards) {
          const cardHtml = match[0]
          
          // Check if this card matches the filament title
          const titleMatch = cardHtml.match(/<h[23][^>]*class=["'][^"']*title[^"']*["'][^>]*>([\s\S]*?)<\/h[23]>/i)
          if (titleMatch) {
            const cardTitle = titleMatch[1]
              .replace(/<[^>]+>/g, '')
              .toLowerCase()
              .replace(/[^a-z0-9\s]/g, '')
              .trim()
            
            // Check for title match
            const titleWords = simplifiedTitle.split(/\s+/).filter((w: string) => w.length > 2)
            const matchCount = titleWords.filter((word: string) => cardTitle.includes(word)).length
            
            if (matchCount >= Math.min(3, titleWords.length)) {
              // Found a match! Extract the image
              const imgMatches = cardHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)
              if (imgMatches && imgMatches.length > 0) {
                const srcMatch = imgMatches[0].match(/src=["']([^"']+)["']/)
                if (srcMatch) {
                  imageUrl = srcMatch[1]
                  // Make URL absolute
                  if (imageUrl && imageUrl.startsWith('//')) {
                    imageUrl = 'https:' + imageUrl
                  } else if (imageUrl && imageUrl.startsWith('/')) {
                    const baseUrl = new URL(collectionUrl)
                    imageUrl = `${baseUrl.protocol}//${baseUrl.host}${imageUrl}`
                  }
                  
                  // Remove size parameters for full-size image
                  if (imageUrl) {
                    imageUrl = getFullSizeImageUrl(imageUrl)
                    console.log(`Found image for ${filament.product_title}: ${imageUrl}`)
                  }
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
        
        result.images_found++
        record.image_url = imageUrl
        
        // Download and upload the image
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
        
        const fileExt = imageUrl.split('.').pop()?.split('?')[0] || 'jpg'
        const fileName = `${filament.id}.${fileExt}`
        const filePath = `product-images/${fileName}`
        
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
        
        const { data: publicUrlData } = supabase.storage
          .from('filament-images')
          .getPublicUrl(filePath)
        
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
          console.log(`✓ Success: ${filament.product_title}`)
        }
        
        result.processed_records.push(record)
        
      } catch (error) {
        console.error(`Error processing ${filament.product_title}:`, error)
        record.status = 'error'
        result.errors.push(`${filament.product_title}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        result.processed_records.push(record)
      }
      
      // Small delay between processing
      await new Promise(resolve => setTimeout(resolve, 200))
    }
    
  } catch (error) {
    console.error(`Error scraping ${vendorName} collection:`, error)
    throw error
  }
  
  console.log(`${vendorName} scraping complete:`, {
    total_processed: result.total_processed,
    images_found: result.images_found,
    images_uploaded: result.images_uploaded,
    images_updated: result.images_updated,
    errors_count: result.errors.length
  })
  
  return new Response(
    JSON.stringify({
      success: true,
      message: `Processed ${result.total_processed} ${vendorName} filaments, updated ${result.images_updated} images`,
      result
    }),
    { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    }
  )
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
    const forceRescrape = body.forceRescrape || false
    const vendor = body.vendor || null
    const filamentIds = body.filamentIds || null // Array of specific filament IDs to process

    console.log(`Starting image scraping for up to ${limit} filaments...`)
    if (forceRescrape) {
      console.log(`Force rescraping enabled${vendor ? ` for vendor: ${vendor}` : ''}`)
    }
    if (filamentIds && filamentIds.length > 0) {
      console.log(`Processing ${filamentIds.length} specific filaments`)
    }

    // Initialize Firecrawl
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY')
    if (!firecrawlApiKey) {
      console.error('FIRECRAWL_API_KEY not found')
      throw new Error('Firecrawl API key not configured')
    }
    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey })

    // Special handling for vendor collection pages
    if (vendor === 'Amolen') {
      return await scrapeVendorCollection(supabase, firecrawl, filamentIds, forceRescrape, corsHeaders, 'Amolen', 'https://www.amolen.com/collections/all-product')
    }
    if (vendor === 'Anycubic') {
      return await scrapeVendorCollection(supabase, firecrawl, filamentIds, forceRescrape, corsHeaders, 'Anycubic', 'https://ca.anycubic.com/collections/filaments')
    }

    // Get filaments to process
    let query = supabase
      .from('filaments')
      .select('id, product_title, vendor, product_url, featured_image')
      .not('product_url', 'is', null)
    
    // If specific filament IDs provided, only process those
    if (filamentIds && filamentIds.length > 0) {
      query = query.in('id', filamentIds)
    } else {
      // Otherwise use the normal filters
      // Add vendor filter if specified
      if (vendor) {
        query = query.eq('vendor', vendor)
      }
      
      // If not force rescraping, only get filaments without images
      if (!forceRescrape) {
        query = query.is('featured_image', null)
      }
      
      query = query.limit(limit)
    }
    
    const { data: filaments, error: fetchError } = await query

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
        if (!filament.product_url || !isValidUrl(filament.product_url)) {
          record.status = 'no_url'
          if (filament.product_url) {
            console.log(`Invalid URL for ${filament.product_title}: ${filament.product_url}`)
            result.errors.push(`${filament.product_title}: Invalid URL - ${filament.product_url}`)
          }
          result.processed_records.push(record)
          continue
        }

        console.log(`Scraping with Firecrawl: ${filament.vendor} - ${filament.product_title}`)

        // Use Firecrawl to scrape the product page with retry logic
        let scrapeResult
        try {
          scrapeResult = await retryWithBackoff(
            () => firecrawl.scrapeUrl(filament.product_url, {
              formats: ['html'],
              onlyMainContent: false
            }),
            2, // max 2 retries
            1000 // 1 second base delay
          )
        } catch (error) {
          console.error(`Firecrawl error for ${filament.product_title}:`, error)
          record.status = 'error'
          result.errors.push(`${filament.product_title}: ${error instanceof Error ? error.message : 'Firecrawl error'}`)
          result.processed_records.push(record)
          continue
        }

        if (!scrapeResult.success || !scrapeResult.html) {
          console.error(`Failed to scrape ${filament.product_url}`)
          record.status = 'error'
          result.errors.push(`${filament.product_title}: Scraping failed`)
          result.processed_records.push(record)
          continue
        }

        const html = scrapeResult.html

        // Helper function to check if URL looks like a product image
        const isProductImage = (url: string, imgTag?: string): boolean => {
          const urlLower = url.toLowerCase()
          
          // Exclude common non-product images
          const excludePatterns = [
            'icon', 'logo', 'thumb', 'banner', 'header', 'footer',
            'badge', 'seal', 'award', 'button', 'background', 'bg',
            'sprite', 'placeholder', 'avatar', 'social'
          ]
          
          if (excludePatterns.some(pattern => urlLower.includes(pattern))) {
            return false
          }
          
          // Exclude GIFs (often animations, not product photos)
          if (urlLower.endsWith('.gif')) {
            return false
          }
          
          // Prioritize URLs with product-related keywords
          const productKeywords = ['product', 'filament', 'spool', 'item', 'variant']
          const hasProductKeyword = productKeywords.some(keyword => urlLower.includes(keyword))
          
          // Check alt text if available in imgTag
          if (imgTag) {
            const altMatch = imgTag.match(/alt=["']([^"']+)["']/i)
            if (altMatch) {
              const altLower = altMatch[1].toLowerCase()
              if (productKeywords.some(keyword => altLower.includes(keyword))) {
                return true
              }
            }
          }
          
          return hasProductKeyword || !excludePatterns.some(pattern => urlLower.includes(pattern))
        }

        // Extract image URL using various strategies
        let imageUrl: string | null = null

        // Strategy 1: Look for product gallery or main product image in HTML structure
        const galleryPatterns = [
          /<div[^>]*class=["'][^"']*product[^"']*gallery[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
          /<div[^>]*class=["'][^"']*product[^"']*image[^"']*["'][^>]*>[\s\S]*?<img[^>]*src=["']([^"']+)["']/i,
          /<img[^>]*class=["'][^"']*product[^"']*featured[^"']*["'][^>]*src=["']([^"']+)["']/i,
          /<img[^>]*class=["'][^"']*main[^"']*product[^"']*["'][^>]*src=["']([^"']+)["']/i
        ]
        
        for (const pattern of galleryPatterns) {
          const match = html.match(pattern)
          if (match && match[1] && isProductImage(match[1])) {
            imageUrl = match[1]
            break
          }
        }

        // Strategy 2: Look for og:image meta tag (but validate it's a product image)
        if (!imageUrl) {
          const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)
          if (ogImageMatch && isProductImage(ogImageMatch[1])) {
            imageUrl = ogImageMatch[1]
          }
        }

        // Strategy 3: Look for images with "product" in class or data attributes
        if (!imageUrl) {
          const productImagePatterns = [
            /<img[^>]*class=["'][^"']*product[^"']*["'][^>]*src=["']([^"']+)["']/i,
            /<img[^>]*src=["']([^"']+)["'][^>]*class=["'][^"']*product[^"']*["']/i,
            /<img[^>]*data-[^=]*product[^=]*=["'][^"']*["'][^>]*src=["']([^"']+)["']/i
          ]
          
          for (const pattern of productImagePatterns) {
            const match = html.match(pattern)
            if (match && match[1] && isProductImage(match[1])) {
              imageUrl = match[1]
              break
            }
          }
        }

        // Strategy 4: Look through all images for best product image candidate
        if (!imageUrl) {
          const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*/gi)
          if (imgMatches) {
            // Score each image and pick the best
            let bestImage = { url: '', score: 0 }
            
            for (const imgTag of imgMatches) {
              const srcMatch = imgTag.match(/src=["']([^"']+)["']/)
              if (srcMatch && srcMatch[1]) {
                const src = srcMatch[1]
                
                if (!isProductImage(src, imgTag)) continue
                
                let score = 0
                const srcLower = src.toLowerCase()
                
                // Prioritize images with product-related keywords in URL
                if (srcLower.includes('product')) score += 10
                if (srcLower.includes('filament')) score += 8
                if (srcLower.includes('spool')) score += 6
                if (srcLower.includes('variant')) score += 5
                if (srcLower.includes('item')) score += 4
                
                // Check for high-res indicators
                if (srcLower.includes('large') || srcLower.includes('1214') || srcLower.includes('1920')) score += 3
                
                // Prefer jpg/png over webp/avif
                if (srcLower.endsWith('.jpg') || srcLower.endsWith('.jpeg') || srcLower.endsWith('.png')) score += 2
                
                // Check alt text
                const altMatch = imgTag.match(/alt=["']([^"']+)["']/i)
                if (altMatch) {
                  const altLower = altMatch[1].toLowerCase()
                  if (altLower.includes('product') || altLower.includes('filament')) score += 5
                }
                
                if (score > bestImage.score) {
                  bestImage = { url: src, score }
                }
              }
            }
            
            if (bestImage.score > 0) {
              imageUrl = bestImage.url
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
        
        // Convert to full-size image URL
        imageUrl = getFullSizeImageUrl(imageUrl)
        console.log(`Full-size image URL: ${imageUrl}`)
        
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