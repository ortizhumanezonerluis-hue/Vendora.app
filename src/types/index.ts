export interface Producto {
  id: string
  codigo_barras: string
  plu?: string
  nombre: string
  precio_costo: number
  precio_venta: number
  stock_actual: number
  stock_minimo: number
  categoria: string
  es_granel?: boolean
  unidad_medida?: 'UND' | 'kg' | 'lb' | 'g' | 'L' | 'm' | string
}

export interface Venta {
  id: string
  fecha: string
  usuario_id: string
  total: number
  metodo_pago: 'efectivo' | 'transferencia' | 'tarjeta'
  estado: 'completada' | 'anulada'
}

export interface DetalleVenta {
  id: string
  venta_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
}

export interface MovimientoInventario {
  id: string
  producto_id: string
  tipo: 'entrada' | 'salida' | 'ajuste' | 'merma'
  cantidad: number
  motivo: string
  usuario_id: string
  fecha: string
}

export interface ArqueoCaja {
  id: string
  fecha_apertura: string
  fecha_cierre?: string
  usuario_id: string
  monto_inicial: number
  efectivo_declarado?: number
  efectivo_sistema?: number
  diferencia?: number
  estado: 'abierto' | 'cerrado'
}

export interface AuditLog {
  id: string
  date: string
  user: string
  action: string
  detail: string
  severity: 'info' | 'warning' | 'critical'
}

export interface Commission {
  id: string
  cashier: string
  sales: number
  totalSales: number
  commission: number
  period: string
}
