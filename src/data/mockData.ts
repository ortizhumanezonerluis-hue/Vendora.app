export type Product = {
  id: string
  sku: string
  name: string
  category: string
  costPrice: number
  salePrice: number
  stock: number
  unit: string
  status: 'active' | 'low' | 'out'
}

export type Movement = {
  id: string
  productId: string
  date: string
  type: 'sale' | 'entry' | 'adjustment' | 'loss'
  qty: number
  reason: string
  user: string
  balanceAfter: number
}

export type AuditLog = {
  id: string
  date: string
  user: string
  action: string
  detail: string
  severity: 'info' | 'warning' | 'critical'
}

export type CartItem = {
  product: Product
  qty: number
}

export type Sale = {
  id: string
  date: string
  items: CartItem[]
  subtotal: number
  tax: number
  total: number
  paymentMethod: 'cash' | 'transfer' | 'card'
  cashier: string
}

export const CATEGORIES = [
  'Abarrotes',
  'Lácteos',
  'Bebidas',
  'Frutas y Verduras',
  'Carnes',
  'Panadería',
  'Limpieza',
  'Higiene Personal',
]

export const products: Product[] = [
  { id: 'P001', sku: '7501055300897', name: 'Leche Entera Lala 1L', category: 'Lácteos', costPrice: 17.5, salePrice: 22.0, stock: 48, unit: 'pieza', status: 'active' },
  { id: 'P002', sku: '7501055300903', name: 'Leche Deslactosada Lala 1L', category: 'Lácteos', costPrice: 18.0, salePrice: 23.5, stock: 12, unit: 'pieza', status: 'low' },
  { id: 'P003', sku: '7501234567890', name: 'Yogurt Natural Danone 900g', category: 'Lácteos', costPrice: 28.0, salePrice: 36.0, stock: 24, unit: 'pieza', status: 'active' },
  { id: 'P004', sku: '7503001234567', name: 'Queso Oaxaca Lala 400g', category: 'Lácteos', costPrice: 52.0, salePrice: 68.0, stock: 8, unit: 'pieza', status: 'low' },
  { id: 'P005', sku: '7501030412345', name: 'Arroz Morelos Extra 1kg', category: 'Abarrotes', costPrice: 18.0, salePrice: 24.0, stock: 120, unit: 'kg', status: 'active' },
  { id: 'P006', sku: '7501030412346', name: 'Frijol Negro Lalá 1kg', category: 'Abarrotes', costPrice: 22.0, salePrice: 30.0, stock: 85, unit: 'kg', status: 'active' },
  { id: 'P007', sku: '7501234500001', name: 'Aceite Cristal 900ml', category: 'Abarrotes', costPrice: 35.0, salePrice: 45.0, stock: 36, unit: 'pieza', status: 'active' },
  { id: 'P008', sku: '7501234500002', name: 'Atún en Agua Dolores 140g', category: 'Abarrotes', costPrice: 14.0, salePrice: 18.5, stock: 200, unit: 'pieza', status: 'active' },
  { id: 'P009', sku: '7501234500003', name: 'Pasta Espagueti La Moderna 500g', category: 'Abarrotes', costPrice: 9.5, salePrice: 13.0, stock: 65, unit: 'pieza', status: 'active' },
  { id: 'P010', sku: '7501234500004', name: 'Sal de Mesa La Fina 1kg', category: 'Abarrotes', costPrice: 7.0, salePrice: 10.0, stock: 45, unit: 'kg', status: 'active' },
  { id: 'P011', sku: '7501055362019', name: 'Coca-Cola Original 600ml', category: 'Bebidas', costPrice: 10.0, salePrice: 14.0, stock: 144, unit: 'pieza', status: 'active' },
  { id: 'P012', sku: '7501055362020', name: 'Agua Ciel 1.5L', category: 'Bebidas', costPrice: 7.0, salePrice: 10.0, stock: 72, unit: 'pieza', status: 'active' },
  { id: 'P013', sku: '7506306003789', name: 'Jugo de Naranja Del Valle 1L', category: 'Bebidas', costPrice: 20.0, salePrice: 26.0, stock: 5, unit: 'pieza', status: 'low' },
  { id: 'P014', sku: '7501055700001', name: 'Manzana Roja (kg)', category: 'Frutas y Verduras', costPrice: 22.0, salePrice: 32.0, stock: 30, unit: 'kg', status: 'active' },
  { id: 'P015', sku: '7501055700002', name: 'Tomate Saladette (kg)', category: 'Frutas y Verduras', costPrice: 15.0, salePrice: 20.0, stock: 0, unit: 'kg', status: 'out' },
  { id: 'P016', sku: '7500478000001', name: 'Jabón Palmolive 400ml', category: 'Limpieza', costPrice: 28.0, salePrice: 36.0, stock: 24, unit: 'pieza', status: 'active' },
  { id: 'P017', sku: '7500478000002', name: 'Detergente Ariel 1kg', category: 'Limpieza', costPrice: 55.0, salePrice: 72.0, stock: 18, unit: 'pieza', status: 'active' },
  { id: 'P018', sku: '7500478000003', name: 'Papel Higiénico Kleenex 4 rollos', category: 'Higiene Personal', costPrice: 32.0, salePrice: 42.0, stock: 40, unit: 'paquete', status: 'active' },
  { id: 'P019', sku: '7500478000004', name: 'Shampoo Head & Shoulders 375ml', category: 'Higiene Personal', costPrice: 65.0, salePrice: 85.0, stock: 14, unit: 'pieza', status: 'active' },
  { id: 'P020', sku: '7500200100001', name: 'Pan Bimbo Grande', category: 'Panadería', costPrice: 38.0, salePrice: 48.0, stock: 3, unit: 'pieza', status: 'low' },
]

export const movements: Movement[] = [
  { id: 'M001', productId: 'P001', date: '2026-08-09 09:14', type: 'sale', qty: -3, reason: 'Venta #1042', user: 'Ana López', balanceAfter: 48 },
  { id: 'M002', productId: 'P001', date: '2026-08-08 16:30', type: 'entry', qty: 24, reason: 'Entrada Mercancía', user: 'Carlos Ruiz', balanceAfter: 51 },
  { id: 'M003', productId: 'P001', date: '2026-08-07 11:00', type: 'sale', qty: -6, reason: 'Venta #1038', user: 'Ana López', balanceAfter: 27 },
  { id: 'M004', productId: 'P001', date: '2026-08-06 14:20', type: 'adjustment', qty: -2, reason: 'Ajuste por Conteo', user: 'Carlos Ruiz', balanceAfter: 33 },
  { id: 'M005', productId: 'P001', date: '2026-08-05 10:05', type: 'loss', qty: -1, reason: 'Merma/Rotura', user: 'Ana López', balanceAfter: 35 },
  { id: 'M006', productId: 'P002', date: '2026-08-09 08:50', type: 'sale', qty: -2, reason: 'Venta #1041', user: 'Ana López', balanceAfter: 12 },
  { id: 'M007', productId: 'P002', date: '2026-08-08 09:00', type: 'entry', qty: 12, reason: 'Entrada Mercancía', user: 'Carlos Ruiz', balanceAfter: 14 },
]

export const auditLogs: AuditLog[] = [
  { id: 'A001', date: '2026-08-09 10:42', user: 'Juan Pérez', action: 'Anulación de Venta', detail: 'Solicitó anular venta #1042 — Requiere aprobación de gerente', severity: 'warning' },
  { id: 'A002', date: '2026-08-09 09:14', user: 'Ana López', action: 'Venta procesada', detail: 'Venta #1042 por $88.00 — Pago en efectivo', severity: 'info' },
  { id: 'A003', date: '2026-08-09 08:50', user: 'Ana López', action: 'Venta procesada', detail: 'Venta #1041 por $47.00 — Pago con tarjeta', severity: 'info' },
  { id: 'A004', date: '2026-08-08 18:00', user: 'Carlos Ruiz', action: 'Cierre de Caja', detail: 'Arqueo aprobado — Diferencia: $0.00', severity: 'info' },
  { id: 'A005', date: '2026-08-08 16:30', user: 'Carlos Ruiz', action: 'Entrada de Mercancía', detail: 'Leche Lala 1L — +24 unidades ingresadas', severity: 'info' },
  { id: 'A006', date: '2026-08-08 12:15', user: 'María García', action: 'Ajuste de Stock', detail: 'Leche Entera Lala — Ajuste por conteo: -2 unidades', severity: 'warning' },
  { id: 'A007', date: '2026-08-07 17:45', user: 'Admin', action: 'Cambio de Precio', detail: 'Arroz Morelos 1kg — Precio de venta: $22.00 → $24.00', severity: 'warning' },
  { id: 'A008', date: '2026-08-07 14:00', user: 'Juan Pérez', action: 'Intento de acceso', detail: 'Intento de acceder a reporte de comisiones sin permisos', severity: 'critical' },
  { id: 'A009', date: '2026-08-06 09:00', user: 'Admin', action: 'Nuevo usuario creado', detail: 'Usuario "mgarcia" creado con rol Cajero', severity: 'info' },
  { id: 'A010', date: '2026-08-05 10:05', user: 'Ana López', action: 'Merma registrada', detail: 'Leche Entera Lala 1L — 1 unidad rota registrada', severity: 'warning' },
]

export const todaySales: Sale[] = [
  {
    id: '1042',
    date: '2026-08-09 09:14',
    items: [
      { product: products[0], qty: 2 },
      { product: products[10], qty: 3 },
      { product: products[4], qty: 1 },
    ],
    subtotal: 75.86,
    tax: 12.14,
    total: 88.0,
    paymentMethod: 'cash',
    cashier: 'Ana López',
  },
  {
    id: '1041',
    date: '2026-08-09 08:50',
    items: [
      { product: products[1], qty: 1 },
      { product: products[11], qty: 2 },
    ],
    subtotal: 40.52,
    tax: 6.48,
    total: 47.0,
    paymentMethod: 'card',
    cashier: 'Ana López',
  },
]

export const commissions = [
  { id: 'C001', cashier: 'Ana López', sales: 42, totalSales: 5840.0, commission: 292.0, period: 'Agosto 2026' },
  { id: 'C002', cashier: 'Carlos Ruiz', sales: 38, totalSales: 4920.0, commission: 246.0, period: 'Agosto 2026' },
  { id: 'C003', cashier: 'María García', sales: 55, totalSales: 7200.0, commission: 360.0, period: 'Agosto 2026' },
  { id: 'C004', cashier: 'Juan Pérez', sales: 29, totalSales: 3100.0, commission: 155.0, period: 'Agosto 2026' },
]
