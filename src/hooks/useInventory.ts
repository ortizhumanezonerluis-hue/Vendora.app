import { useState, useEffect } from 'react'
import { inventoryService } from '../services/inventoryService'
import { Producto, MovimientoInventario } from '../types'
import { products as mockProducts, movements as mockMovements } from '../data/mockData'
import { offlineDb } from '../lib/offlineDb'

// Helper to map mock product to DB Producto structure
export function mapMockToDBProduct(p: any): Producto {
  return {
    id: p.id,
    codigo_barras: p.sku || '',
    plu: '',
    nombre: p.name || '',
    precio_costo: p.costPrice || 0,
    precio_venta: p.salePrice || 0,
    stock_actual: p.stock || 0,
    stock_minimo: 10,
    categoria: p.category || ''
  }
}

// Helper to map mock movement to DB Movimiento structure
export function mapMockToDBMovement(m: any): MovimientoInventario {
  return {
    id: m.id,
    producto_id: m.productId || '',
    tipo: m.type === 'entry' ? 'entry' : m.type === 'sale' ? 'salida' : m.type === 'loss' ? 'merma' : 'ajuste',
    cantidad: m.qty || 0,
    motivo: m.reason || '',
    usuario_id: m.user || 'Sistema',
    fecha: m.date || new Date().toISOString()
  }
}

export function useInventory(negocioId?: string | null) {
  const [productos, setProductos] = useState<Producto[]>([])
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const prods = await inventoryService.getProductos(negocioId)
      const movs = await inventoryService.getMovimientos()
      setProductos(prods)
      setMovimientos(movs)
      // Save fresh copy in IndexedDB
      if (prods && prods.length > 0) {
        offlineDb.saveProductsCache(prods).catch(() => {})
      }
    } catch (err: any) {
      console.warn('Fallo de conexión con Supabase. Intentando cargar desde caché local IndexedDB:', err)
      setError(err.message || 'Error cargando datos')
      
      const cached = await offlineDb.getCachedProducts()
      if (cached && cached.length > 0) {
        setProductos(cached)
      } else {
        setProductos(mockProducts.map(mapMockToDBProduct))
      }
      setMovimientos(mockMovements.map(mapMockToDBMovement))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [negocioId])

  const addProducto = async (producto: Omit<Producto, 'id'>, usuario?: string) => {
    try {
      const created = await inventoryService.createProducto(producto, usuario || 'Sistema', negocioId)
      setProductos((prev) => [created, ...prev])
      return created;
    } catch (err) {
      console.error('Error guardando en Supabase, agregando localmente:', err)
      const fakeProduct: Producto = {
        ...producto,
        id: `P_${Date.now()}`
      }
      setProductos((prev) => [fakeProduct, ...prev])
      return fakeProduct;
    }
  }

  const updateProducto = async (id: string, updates: Partial<Producto>) => {
    try {
      const updated = await inventoryService.updateProducto(id, updates)
      setProductos((prev) => prev.map((p) => p.id === id ? updated : p))
      return updated;
    } catch (err) {
      console.error('Error actualizando en Supabase, modificando localmente:', err)
      setProductos((prev) => prev.map((p) => p.id === id ? { ...p, ...updates } : p))
    }
  }

  const deleteProducto = async (id: string) => {
    // Check if it is a local offline/fake product ID (starting with P_)
    if (id.startsWith('P_')) {
      setProductos((prev) => prev.filter((p) => p.id !== id))
      return
    }

    try {
      await inventoryService.deleteProducto(id)
      setProductos((prev) => prev.filter((p) => p.id !== id))
    } catch (err) {
      console.error('Error eliminando en Supabase:', err)
      throw err
    }
  }

  const registrarMovimiento = async (movimiento: Omit<MovimientoInventario, 'id' | 'fecha'>) => {
    // Look up product info for audit logs
    const producto = productos.find((p) => p.id === movimiento.producto_id)
    const productoNombre = producto?.nombre || 'Producto'
    const stockMinimo = producto?.stock_minimo || 10

    try {
      const created = await inventoryService.registrarMovimiento(movimiento, productoNombre, stockMinimo)
      setMovimientos((prev) => [created, ...prev])
      // Optimistically update local stock
      setProductos((prev) => prev.map((p) => {
        if (p.id === movimiento.producto_id) {
          return { ...p, stock_actual: Math.max(0, p.stock_actual + movimiento.cantidad) }
        }
        return p
      }))
      return created
    } catch (err: any) {
      console.error('Error registrando movimiento:', err)
      // Optimistic local update as fallback
      const fakeMov: MovimientoInventario = {
        ...movimiento,
        id: `M_${Date.now()}`,
        fecha: new Date().toISOString()
      }
      setMovimientos((prev) => [fakeMov, ...prev])
      setProductos((prev) => prev.map((p) => {
        if (p.id === movimiento.producto_id) {
          return { ...p, stock_actual: Math.max(0, p.stock_actual + movimiento.cantidad) }
        }
        return p
      }))
      return fakeMov
    }
  }

  return {
    productos,
    movimientos,
    loading,
    error,
    refresh: loadData,
    addProducto,
    updateProducto,
    deleteProducto,
    registrarMovimiento
  }
}
