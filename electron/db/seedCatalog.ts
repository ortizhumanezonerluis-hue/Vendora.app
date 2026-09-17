/**
 * Seed data for offline smart product lookup.
 * Pre-loaded with staple supermarket, grocery, beverage, dairy and household items.
 */

export interface SeedProduct {
  barcode: string
  name: string
  brand: string
  category: string
  default_iva: number
}

export const SEED_CATALOG_DATA: SeedProduct[] = [
  // Abarrotes & Granos
  { barcode: '7702001001017', name: 'Arroz Diana Tradicional 1000g', brand: 'Diana', category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001024', name: 'Arroz Roa Flor Huila 1000g', brand: 'Roa', category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001031', name: 'Aceite Premier Girasol 1000ml', brand: 'Premier', category: 'Abarrotes', default_iva: 19 },
  { barcode: '7702001001048', name: 'Aceite Oleocali 900ml', brand: 'Oleocali', category: 'Abarrotes', default_iva: 19 },
  { barcode: '7702001001055', name: 'Azúcar Manuelita Blanca 1000g', brand: 'Manuelita', category: 'Abarrotes', default_iva: 5 },
  { barcode: '7702001001062', name: 'Azúcar Incauca Morena 1000g', brand: 'Incauca', category: 'Abarrotes', default_iva: 5 },
  { barcode: '7702001001079', name: 'Sal Refisal Marina 1000g', brand: 'Refisal', category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001086', name: 'Harina PAN Blanca 1000g', brand: 'PAN', category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001093', name: 'Harina Promasa 1000g', brand: 'Promasa', category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001109', name: 'Pasta Doria Espagueti 500g', brand: 'Doria', category: 'Abarrotes', default_iva: 5 },
  { barcode: '7702001001116', name: 'Pasta Conzazoni Penne 500g', brand: 'Conzazoni', category: 'Abarrotes', default_iva: 5 },
  { barcode: '7702001001123', name: 'Lenteja Diana Seleccionada 500g', brand: 'Diana', category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001130', name: 'Fríjol Bola Roja Diana 500g', brand: 'Diana', category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001147', name: 'Atún Van Camps en Aceite 184g', brand: "Van Camp's", category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001154', name: 'Atún Van Camps en Agua 184g', brand: "Van Camp's", category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001161', name: 'Sardinas Isabel en Tomate 425g', brand: 'Isabel', category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001178', name: 'Café Sello Rojo Tradicional 500g', brand: 'Sello Rojo', category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001185', name: 'Café Águila Roja Molido 500g', brand: 'Águila Roja', category: 'Abarrotes', default_iva: 0 },
  { barcode: '7702001001192', name: 'Chocolate Corona Tradicional 500g', brand: 'Corona', category: 'Abarrotes', default_iva: 5 },
  { barcode: '7702001001208', name: 'Chocolate Luker con Clavos y Canela 500g', brand: 'Luker', category: 'Abarrotes', default_iva: 5 },

  // Lácteos
  { barcode: '7702002001016', name: 'Leche Alquería Entera Larga Vida 1000ml', brand: 'Alquería', category: 'Lácteos', default_iva: 0 },
  { barcode: '7702002001023', name: 'Leche Colanta Entera Bolsa 1000ml', brand: 'Colanta', category: 'Lácteos', default_iva: 0 },
  { barcode: '7702002001030', name: 'Leche Alpina Deslactosada 1000ml', brand: 'Alpina', category: 'Lácteos', default_iva: 0 },
  { barcode: '7702002001047', name: 'Yogurt Alpina Fresa 1000g', brand: 'Alpina', category: 'Lácteos', default_iva: 19 },
  { barcode: '7702002001054', name: 'Yogurt Colanta Melocotón 1000g', brand: 'Colanta', category: 'Lácteos', default_iva: 19 },
  { barcode: '7702002001061', name: 'Queso Campesino Colanta 500g', brand: 'Colanta', category: 'Lácteos', default_iva: 0 },
  { barcode: '7702002001078', name: 'Queso Mozzarella Alpina Tajado 400g', brand: 'Alpina', category: 'Lácteos', default_iva: 19 },
  { barcode: '7702002001085', name: 'Mantequilla Rama con Sal 250g', brand: 'Rama', category: 'Lácteos', default_iva: 19 },
  { barcode: '7702002001092', name: 'Mantequilla La Fina 250g', brand: 'La Fina', category: 'Lácteos', default_iva: 19 },
  { barcode: '7702002001108', name: 'Arequipe Alpina Tradicional 220g', brand: 'Alpina', category: 'Lácteos', default_iva: 19 },

  // Bebidas
  { barcode: '7702003001015', name: 'Coca-Cola Original 1.5L PET', brand: 'Coca-Cola', category: 'Bebidas', default_iva: 19 },
  { barcode: '7702003001022', name: 'Coca-Cola Sin Azúcar 1.5L PET', brand: 'Coca-Cola', category: 'Bebidas', default_iva: 19 },
  { barcode: '7702003001039', name: 'Gaseosa Postobón Manzana 1.5L', brand: 'Postobón', category: 'Bebidas', default_iva: 19 },
  { barcode: '7702003001046', name: 'Gaseosa Colombiana 1.5L', brand: 'Postobón', category: 'Bebidas', default_iva: 19 },
  { barcode: '7702003001053', name: 'Agua Cristal Sin Gas 600ml', brand: 'Cristal', category: 'Bebidas', default_iva: 19 },
  { barcode: '7702003001060', name: 'Agua Brisa con Gas 600ml', brand: 'Brisa', category: 'Bebidas', default_iva: 19 },
  { barcode: '7702003001077', name: 'Jugo Hit Mango 500ml', brand: 'Hit', category: 'Bebidas', default_iva: 19 },
  { barcode: '7702003001084', name: 'Jugo Hit Lulo 500ml', brand: 'Hit', category: 'Bebidas', default_iva: 19 },
  { barcode: '7702003001091', name: 'Cerveza Águila Original Lata 330ml', brand: 'Bavaria', category: 'Bebidas', default_iva: 19 },
  { barcode: '7702003001107', name: 'Cerveza Poker Lata 330ml', brand: 'Bavaria', category: 'Bebidas', default_iva: 19 },

  // Snacks & Panadería
  { barcode: '7702004001014', name: 'Papas Margarita Pollo 110g', brand: 'Margarita', category: 'Snacks', default_iva: 19 },
  { barcode: '7702004001021', name: 'Papas Margarita Limón 110g', brand: 'Margarita', category: 'Snacks', default_iva: 19 },
  { barcode: '7702004001038', name: 'Doritos Mega Queso 180g', brand: 'Frito-Lay', category: 'Snacks', default_iva: 19 },
  { barcode: '7702004001045', name: 'De Todito Natural 165g', brand: 'Frito-Lay', category: 'Snacks', default_iva: 19 },
  { barcode: '7702004001052', name: 'Galletas Festival Chocolate Taco 408g', brand: 'Noel', category: 'Panadería', default_iva: 19 },
  { barcode: '7702004001069', name: 'Galletas Saltín Noel Tradicional 3 Tacos', brand: 'Noel', category: 'Panadería', default_iva: 0 },
  { barcode: '7702004001076', name: 'Galletas Ducales Taco 294g', brand: 'Noel', category: 'Panadería', default_iva: 19 },
  { barcode: '7702004001083', name: 'Ponqué Chocoramo 65g', brand: 'Ramo', category: 'Panadería', default_iva: 19 },
  { barcode: '7702004001090', name: 'Ponqué Gala Vainilla 65g', brand: 'Ramo', category: 'Panadería', default_iva: 19 },
  { barcode: '7702004001106', name: 'Pan Tajado Bimbo Blanco Grande 600g', brand: 'Bimbo', category: 'Panadería', default_iva: 0 },

  // Limpieza & Cuidado del Hogar
  { barcode: '7702005001013', name: 'Detergente Fab Polvo Floral 1000g', brand: 'Fab', category: 'Limpieza', default_iva: 19 },
  { barcode: '7702005001020', name: 'Detergente Ariel Líquido 1200ml', brand: 'Ariel', category: 'Limpieza', default_iva: 19 },
  { barcode: '7702005001037', name: 'Lavaplatos Axion Crema Limón 450g', brand: 'Axion', category: 'Limpieza', default_iva: 19 },
  { barcode: '7702005001044', name: 'Blanqueador Clorox Tradicional 1000ml', brand: 'Clorox', category: 'Limpieza', default_iva: 19 },
  { barcode: '7702005001051', name: 'Limpiapisos Fabuloso Lavanda 1000ml', brand: 'Fabuloso', category: 'Limpieza', default_iva: 19 },
  { barcode: '7702005001068', name: 'Papel Higiénico Familia Acolchamax 4 Rollos', brand: 'Familia', category: 'Limpieza', default_iva: 19 },
  { barcode: '7702005001075', name: 'Jabón de Baño Palmolive Naturals 3x120g', brand: 'Palmolive', category: 'Higiene Personal', default_iva: 19 },
  { barcode: '7702005001082', name: 'Crema Dental Colgate Triple Acción 150ml', brand: 'Colgate', category: 'Higiene Personal', default_iva: 19 },
  { barcode: '7702005001099', name: 'Shampoo Head & Shoulders Limpieza Renovadora 375ml', brand: 'H&S', category: 'Higiene Personal', default_iva: 19 },
  { barcode: '7702005001105', name: 'Desodorante Rexona Clinical Aerosol 150ml', brand: 'Rexona', category: 'Higiene Personal', default_iva: 19 }
]
