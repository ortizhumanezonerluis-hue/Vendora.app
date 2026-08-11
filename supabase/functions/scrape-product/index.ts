import { ServeHandler } from 'https://deno.land/std@0.192.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
}

const handler: ServeHandler = async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const barcode = url.searchParams.get('barcode')?.trim()

    if (!barcode) {
      return new Response(JSON.stringify({ error: 'Missing barcode parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log(`[scrape-product] Scraping request for barcode: ${barcode}`)

    // 1. Scraping Layer: Exito VTEX catalog search API
    // Exito VTEX search queries products by barcode or sku directly on their store index
    const exitoApiUrl = `https://www.exito.com/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${barcode}`
    
    const exitoRes = await fetch(exitoApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    })

    if (exitoRes.ok) {
      const products = await exitoRes.json()
      if (Array.isArray(products) && products.length > 0) {
        const item = products[0]
        const name = item.productName || item.brand
        const brand = item.brand || ''
        const category = item.categories?.[0]?.replace(/^\/|\/$/g, '').split('/')?.[0] || 'Abarrotes'
        const imageUrl = item.items?.[0]?.images?.[0]?.imageUrl || ''

        console.log(`[scrape-product] Found in Exito: ${name}`)
        return new Response(
          JSON.stringify({
            found: true,
            name,
            brand,
            category,
            image_url: imageUrl
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 2. Scraping Layer 2: Carulla VTEX catalog search API (in case Exito doesn't list it)
    const carullaApiUrl = `https://www.carulla.com/api/catalog_system/pub/products/search?fq=alternateIds_Ean:${barcode}`
    const carullaRes = await fetch(carullaApiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
        'Accept': 'application/json'
      }
    })

    if (carullaRes.ok) {
      const products = await carullaRes.json()
      if (Array.isArray(products) && products.length > 0) {
        const item = products[0]
        const name = item.productName || item.brand
        const brand = item.brand || ''
        const category = item.categories?.[0]?.replace(/^\/|\/$/g, '').split('/')?.[0] || 'Abarrotes'
        const imageUrl = item.items?.[0]?.images?.[0]?.imageUrl || ''

        console.log(`[scrape-product] Found in Carulla: ${name}`)
        return new Response(
          JSON.stringify({
            found: true,
            name,
            brand,
            category,
            image_url: imageUrl
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // 3. Fallback: Not found in Colombian retail VTEX engines
    console.log(`[scrape-product] Product ${barcode} not found in retail APIs`)
    return new Response(
      JSON.stringify({ found: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[scrape-product] Critical scraper function exception:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}

// @ts-ignore
Deno.serve(handler)
