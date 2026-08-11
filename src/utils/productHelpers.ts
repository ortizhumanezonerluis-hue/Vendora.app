/**
 * Category names normalization engine mapping arbitrary categories to strict options.
 */
export function normalizeCategory(incomingCategory: string | undefined | null): string {
  if (!incomingCategory) return 'Abarrotes'
  const text = incomingCategory.toLowerCase().trim()

  if (
    text.includes('leche') ||
    text.includes('lacte') ||
    text.includes('queso') ||
    text.includes('yogurt') ||
    text.includes('cream') ||
    text.includes('mantequilla') ||
    text.includes('dairy') ||
    text.includes('milk')
  ) {
    return 'Lácteos'
  }

  if (
    text.includes('bebida') ||
    text.includes('gaseosa') ||
    text.includes('jugo') ||
    text.includes('agua') ||
    text.includes('soda') ||
    text.includes('refresco') ||
    text.includes('te') ||
    text.includes('tea') ||
    text.includes('beer') ||
    text.includes('cerveza') ||
    text.includes('licor') ||
    text.includes('vino') ||
    text.includes('beverage') ||
    text.includes('juice')
  ) {
    return 'Bebidas'
  }

  if (
    text.includes('fruta') ||
    text.includes('verdura') ||
    text.includes('vegetal') ||
    text.includes('hortaliza') ||
    text.includes('papa') ||
    text.includes('tomate') ||
    text.includes('cebolla') ||
    text.includes('fruit') ||
    text.includes('veg')
  ) {
    return 'Frutas y Verduras'
  }

  if (
    text.includes('pan') ||
    text.includes('torta') ||
    text.includes('ponque') ||
    text.includes('galle') ||
    text.includes('bakery') ||
    text.includes('bread') ||
    text.includes('pasteleria') ||
    text.includes('bizcoch')
  ) {
    return 'Panadería'
  }

  if (
    text.includes('limpieza') ||
    text.includes('detergente') ||
    text.includes('desinfectante') ||
    text.includes('cloro') ||
    text.includes('jabon platos') ||
    text.includes('suavizante') ||
    text.includes('lavaplatos') ||
    text.includes('cleaning') ||
    text.includes('aseo')
  ) {
    return 'Limpieza'
  }

  if (
    text.includes('higiene') ||
    text.includes('personal') ||
    text.includes('shampoo') ||
    text.includes('jabon') ||
    text.includes('desodorante') ||
    text.includes('crema dental') ||
    text.includes('cepillo') ||
    text.includes('toilet') ||
    text.includes('body') ||
    text.includes('cosmet') ||
    text.includes('maquillaje')
  ) {
    return 'Higiene Personal'
  }

  // Fallback category
  return 'Abarrotes'
}

/**
 * Colombian DIAN tax rules calculator based on product name and normalized category.
 * Tariffs:
 * - 0% (Exempt/Excluded basic food items)
 * - 5% (Reduced rate for processed agricultural items)
 * - 19% (General tariff)
 */
export function calculateDIANTax(productName: string | undefined | null, category: string): number {
  if (!productName) return 19.00
  const name = productName.toLowerCase().trim()

  // 1. DIAN 0% Exempt / Excluded products
  const exemptKeywords = [
    'leche', 'milk', 'huevo', 'egg', 'arroz', 'rice', 'pan ', 'pan blanco', 'pan integral',
    'queso', 'cheese', 'papa', 'potato', 'tomate', 'cebolla', 'lechuga', 'zanahoria',
    'platano', 'banano', 'fruta', 'verdura', 'carne', 'meat', 'pollo', 'chicken', 'pescado',
    'fish', 'sal ', 'agua mineral', 'agua en botella', 'legumbre', 'frijol', 'lenteja', 'garbanzo'
  ]
  if (exemptKeywords.some(k => name.includes(k) || (name.startsWith('pan') && name.length <= 6))) {
    return 0.00
  }

  // 2. DIAN 5% Reduced tax products (process agricultural staples)
  const reducedKeywords = [
    'cafe', 'coffee', 'chocolate', 'cocoa', 'harina', 'flour', 'pasta', 'tallarin',
    'fideo', 'aceite', 'oil', 'avena', 'oat', 'azucar', 'sugar', 'maizena', 'trigo'
  ]
  if (reducedKeywords.some(k => name.includes(k))) {
    return 5.00
  }

  // 3. DIAN 19% General rate categories/products
  if (category === 'Limpieza' || category === 'Higiene Personal' || category === 'Bebidas') {
    // Water mineral exclusion has already been filtered in exempt
    return 19.00
  }

  // Default Colombian VAT
  return 19.00
}
