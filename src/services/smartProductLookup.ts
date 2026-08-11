import { supabase } from '../lib/supabaseClient'
import { normalizeCategory, calculateDIANTax } from '../utils/productHelpers'

export interface SmartProduct {
  barcode: string
  name: string
  brand?: string
  category: string
  default_iva: number
  image_url?: string
  source: 'master_catalog' | 'open_food_facts' | 'edge_scraper' | 'none'
}

/**
 * 3-tier cascaded product lookup engine.
 * Capa 1: Local Red Maestra (master_catalog table in Supabase)
 * Capa 2: Open Food Facts API (with background indexation to master_catalog)
 * Capa 3: Supabase Edge Scraper for Exito/Carulla (with background indexation)
 */
export async function smartLookupBarcode(barcode: string): Promise<SmartProduct | null> {
  const cleanBarcode = barcode.trim()
  if (!cleanBarcode) return null

  // --- CAPA 1: master_catalog (Supabase) ---
  try {
    const { data: dbItem, error: dbError } = await supabase
      .from('master_catalog')
      .select('*')
      .eq('barcode', cleanBarcode)
      .maybeSingle()

    if (dbItem && !dbError) {
      console.log(`[smartLookup] Capa 1 Match! (${cleanBarcode})`)
      return {
        barcode: dbItem.barcode,
        name: dbItem.name,
        brand: dbItem.brand,
        category: normalizeCategory(dbItem.category),
        default_iva: parseFloat(dbItem.default_iva) || calculateDIANTax(dbItem.name, dbItem.category),
        image_url: dbItem.image_url,
        source: 'master_catalog'
      }
    }
  } catch (err) {
    console.warn('[smartLookup] Error en consulta Capa 1:', err)
  }

  // --- CAPA 2: Open Food Facts API ---
  try {
    console.log(`[smartLookup] Capa 2 Querying Open Food Facts for (${cleanBarcode})...`)
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`)
    if (response.ok) {
      const data = await response.json()
      if (data.status === 1 && data.product) {
        const prod = data.product
        const name = prod.product_name || prod.product_name_es || prod.product_name_en || 'Producto Nuevo'
        const brand = prod.brands || ''
        const rawCategory = prod.categories_hierarchy?.[0]?.replace('en:', '') || prod.categories || ''
        const category = normalizeCategory(rawCategory)
        const iva = calculateDIANTax(name, category)
        const imageUrl = prod.image_front_url || prod.image_url || null

        const result: SmartProduct = {
          barcode: cleanBarcode,
          name,
          brand,
          category,
          default_iva: iva,
          image_url: imageUrl,
          source: 'open_food_facts'
        }

        // Background indexing (don't block UI thread)
        indexProductBackground(result)
        return result
      }
    }
  } catch (err) {
    console.warn('[smartLookup] Error en consulta Capa 2:', err)
  }

  // --- CAPA 3: Supabase Edge Scraper ---
  try {
    console.log(`[smartLookup] Capa 3 Querying Edge Scraper for (${cleanBarcode})...`)
    // Call our Edge Function
    const { data: edgeData, error: edgeError } = await supabase.functions.invoke('scrape-product', {
      method: 'GET',
      queryParams: { barcode: cleanBarcode }
    })

    if (!edgeError && edgeData && edgeData.found) {
      const name = edgeData.name || 'Producto Nuevo'
      const brand = edgeData.brand || ''
      const category = normalizeCategory(edgeData.category)
      const iva = calculateDIANTax(name, category)
      const imageUrl = edgeData.image_url || null

      const result: SmartProduct = {
        barcode: cleanBarcode,
        name,
        brand,
        category,
        default_iva: iva,
        image_url: imageUrl,
        source: 'edge_scraper'
      }

      // Background indexing
      indexProductBackground(result)
      return result
    }
  } catch (err) {
    console.warn('[smartLookup] Error en consulta Capa 3:', err)
  }

  // Fallback: product not found in any layer
  return null
}

/**
 * Saves a discovered product into the master_catalog table asynchronously
 */
export async function indexProductBackground(prod: Omit<SmartProduct, 'source'>) {
  try {
    const payload = {
      barcode: prod.barcode,
      name: prod.name,
      brand: prod.brand || null,
      category: prod.category,
      default_iva: prod.default_iva,
      image_url: prod.image_url || null
    }

    await supabase
      .from('master_catalog')
      .upsert(payload, { onConflict: 'barcode' })
      .then(({ error }) => {
        if (error) {
          console.warn('[smartLookup] Error al guardar indexación de catálogo:', error.message)
        } else {
          console.log(`[smartLookup] Indexación exitosa en master_catalog: ${prod.name} (${prod.barcode})`)
        }
      })
  } catch (err) {
    console.warn('[smartLookup] Error en indexación silenciosa:', err)
  }
}
