/** Lista canónica de categorías válidas en Vendora */
export const VALID_CATEGORIES = [
  'Abarrotes',
  'Lácteos',
  'Bebidas',
  'Frutas y Verduras',
  'Panadería',
  'Limpieza',
  'Higiene Personal'
] as const

export type ValidCategory = typeof VALID_CATEGORIES[number]

/**
 * Validates that the incoming category is already one of the exact canonical
 * Vendora options. If so, returns it as-is. This prevents re-normalizing
 * values that were already stored correctly in master_catalog.
 */
export function isAlreadyCanonical(text: string): string | null {
  const match = VALID_CATEGORIES.find(
    (c) => c.toLowerCase() === text.toLowerCase()
  )
  return match || null
}

/**
 * Robust word-level keyword test. Avoids substring bugs like "te" matching
 * inside "abarrotes", or "pan" matching inside "compan". Checks that the
 * keyword appears as a whole word (with spaces, start or end of string
 * acting as boundaries).
 */
function hasWord(text: string, keyword: string): boolean {
  // Escape any regex special chars in the keyword
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`(^|[\\s,/\\-_])${escaped}([\\s,/\\-_]|$)`, 'i')
  return pattern.test(text)
}

/**
 * Normalizes any incoming category string from external sources (Open Food
 * Facts, VTEX, edge scraper, etc.) to one of the strict Vendora category
 * options. Never breaks the Select component.
 *
 * Rules:
 * 1. If the value is already a canonical Vendora category → return as-is.
 * 2. Try to map via keyword matching.
 * 3. Fallback to 'Abarrotes'.
 */
export function normalizeCategory(incomingCategory: string | undefined | null): string {
  if (!incomingCategory) return 'Abarrotes'

  const raw = incomingCategory.trim()
  if (!raw) return 'Abarrotes'

  // 1. Already a canonical Vendora category — return immediately
  const canonical = isAlreadyCanonical(raw)
  if (canonical) return canonical

  const text = raw.toLowerCase()

  // Lácteos — dairy keywords
  if (
    text.includes('lacte') ||
    text.includes('dairy') ||
    text.includes('milk') ||
    text.includes('yogurt') ||
    text.includes('mantequilla') ||
    text.includes('cream cheese') ||
    hasWord(text, 'leche') ||
    hasWord(text, 'queso')
  ) {
    return 'Lácteos'
  }

  // Bebidas — beverage keywords (use longer, unambiguous strings)
  if (
    text.includes('beverage') ||
    text.includes('bebida') ||
    text.includes('gaseosa') ||
    text.includes('refresco') ||
    text.includes('cerveza') ||
    text.includes('licor') ||
    text.includes('vino') ||
    text.includes('jugo') ||
    text.includes('cola') ||
    text.includes('soda water') ||
    hasWord(text, 'agua') ||
    hasWord(text, 'juices') ||
    hasWord(text, 'drink') ||
    hasWord(text, 'tea') ||       // full word "tea" not "te"
    hasWord(text, 'mate')
  ) {
    return 'Bebidas'
  }

  // Frutas y Verduras
  if (
    text.includes('fruta') ||
    text.includes('verdura') ||
    text.includes('vegetal') ||
    text.includes('hortaliza') ||
    text.includes('fresh produce') ||
    hasWord(text, 'papa') ||
    hasWord(text, 'tomate') ||
    hasWord(text, 'cebolla') ||
    hasWord(text, 'fruta') ||
    hasWord(text, 'fruit') ||
    hasWord(text, 'veg')
  ) {
    return 'Frutas y Verduras'
  }

  // Panadería — use longer patterns to avoid false positives
  if (
    text.includes('bakery') ||
    text.includes('panaderia') ||
    text.includes('panadería') ||
    text.includes('pasteleria') ||
    text.includes('pastelería') ||
    hasWord(text, 'pan') ||        // whole word "pan" only
    hasWord(text, 'bread') ||
    hasWord(text, 'torta') ||
    hasWord(text, 'ponque') ||
    hasWord(text, 'galleta') ||
    hasWord(text, 'bizcocho')
  ) {
    return 'Panadería'
  }

  // Limpieza
  if (
    text.includes('limpieza') ||
    text.includes('detergente') ||
    text.includes('desinfectante') ||
    text.includes('cloro') ||
    text.includes('lavaplatos') ||
    text.includes('suavizante') ||
    text.includes('cleaning') ||
    hasWord(text, 'aseo') ||
    hasWord(text, 'jabón platos') ||
    hasWord(text, 'blanqueador')
  ) {
    return 'Limpieza'
  }

  // Higiene Personal
  if (
    text.includes('higiene') ||
    text.includes('personal care') ||
    text.includes('shampoo') ||
    text.includes('desodorante') ||
    text.includes('cosmet') ||
    text.includes('maquillaje') ||
    text.includes('dental') ||
    text.includes('cepillo') ||
    text.includes('toilet') ||
    hasWord(text, 'jabón') ||
    hasWord(text, 'jabon')
  ) {
    return 'Higiene Personal'
  }

  // Fallback seguro
  return 'Abarrotes'
}

/**
 * Colombian DIAN tax rules calculator.
 * - 0%  : Exempt/excluded basic food items
 * - 5%  : Reduced rate for processed agricultural staples
 * - 19% : General rate (beverages, household goods, personal care, snacks)
 */
export function calculateDIANTax(productName: string | undefined | null, category: string): number {
  const name = (productName || '').toLowerCase().trim()

  // 0% Exempt — basic unprocessed food items per DIAN
  const exemptWords = [
    'leche', 'huevo', 'arroz', 'queso', 'papa', 'platano', 'banano',
    'carne', 'pollo', 'pescado', 'tomate', 'cebolla', 'lechuga',
    'zanahoria', 'frijol', 'lenteja', 'garbanzo', 'sal',
    'agua mineral', 'agua embotellada', 'agua en botella',
    'legumbre', 'verdura', 'fruta'
  ]
  // Use word boundary matching for short words
  const shortExempt = ['sal', 'pan']
  for (const k of exemptWords) {
    if (shortExempt.includes(k)) {
      if (hasWord(name, k)) return 0.00
    } else {
      if (name.includes(k)) return 0.00
    }
  }
  // "pan" as standalone word only (not "pasta")
  if (hasWord(name, 'pan')) return 0.00
  // milk, egg, rice, bread in English
  if (hasWord(name, 'milk') || hasWord(name, 'egg') || hasWord(name, 'rice') || hasWord(name, 'bread')) return 0.00

  // 5% Reduced — processed agricultural staples per DIAN
  const reducedKeywords = [
    'cafe', 'coffee', 'chocolate', 'cocoa', 'cacao',
    'harina', 'flour', 'pasta', 'tallarin', 'fideo', 'macarron',
    'aceite', 'oil', 'avena', 'oat', 'azucar', 'sugar',
    'maizena', 'trigo', 'almidón', 'almidon'
  ]
  for (const k of reducedKeywords) {
    if (name.includes(k)) return 5.00
  }

  // 19% — cleaning, personal care, beverages, and general processed items
  if (category === 'Limpieza' || category === 'Higiene Personal' || category === 'Bebidas') {
    return 19.00
  }

  return 19.00
}
