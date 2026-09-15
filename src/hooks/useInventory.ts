import { useState, useEffect } from 'react'
import { inventoryService } from '../services/inventoryService'
import { Producto, MovimientoInventario } from '../types'
import { offlineDb } from '../lib/offlineDb'



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
      let movs: MovimientoInventario[] = []
      try {
        movs = await inventoryService.getMovimientos()
      } catch (_) {}
      
      setProductos(prods)
      setMovimientos(movs)
      
      // Save fresh real products to offline cache
      if (prods && prods.length >= 0) {
        await offlineDb.saveProductsCache(prods)
      }
    } catch (err: any) {
      console.warn('[Inventario] Fallo Supabase / Offline. Cargando desde caché local:', err)
      setError(err.message || 'Sin conexión a internet')
      
      // Load strictly from local cache (NEVER fake mock data)
      const cached = await offlineDb.getCachedProducts()
      setProductos(cached || [])
      setMovimientos([])
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
          return { ...p, stock_actual: Number(((p.stock_actual || 0) + movimiento.cantidad).toFixed(3)) }
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
          return { ...p, stock_actual: Number(((p.stock_actual || 0) + movimiento.cantidad).toFixed(3)) }
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
