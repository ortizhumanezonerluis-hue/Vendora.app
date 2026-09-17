import { supabase } from '../lib/supabaseClient'
import { Producto, MovimientoInventario } from '../types'
import { auditService } from './auditService'
import { desktopDB, isElectron } from '../lib/electronBridge'

export const inventoryService = {
  async getProductos(negocioId?: string | null): Promise<Producto[]> {
    if (isElectron && desktopDB) {
      return (await desktopDB.getProductos(negocioId ?? undefined)) as Producto[]
    }
    let query = supabase.from('productos').select('*').order('nombre', { ascending: true })
    if (negocioId) query = query.eq('negocio_id', negocioId)
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getProductoById(id: string): Promise<Producto | null> {
    if (isElectron && desktopDB) {
      return (await desktopDB.getProductoById(id)) as Producto | null
    }
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  async createProducto(producto: Omit<Producto, 'id'>, usuario: string = 'Sistema', negocioId?: string | null): Promise<Producto> {
    if (isElectron && desktopDB) {
      const saved = await desktopDB.saveProducto({ ...producto, negocio_id: negocioId })
      return saved as Producto
    }
    const insertData = negocioId ? { ...producto, negocio_id: negocioId } : producto
    const { data, error } = await supabase
      .from('productos')
      .insert([insertData])
      .select()
      .single()
    if (error) throw error

    // Audit log: info
    await auditService.createAuditLog({
      user: usuario,
      action: 'Producto creado',
      detail: `Se agregó "${producto.nombre}" al catálogo con stock inicial de ${producto.stock_actual} unidades.`,
      severity: 'info',
      negocioId: negocioId ?? undefined
    })

    return data
  },

  async updateProducto(id: string, updates: Partial<Producto>): Promise<Producto> {
    if (isElectron && desktopDB) {
      const saved = await desktopDB.saveProducto({ id, ...updates })
      return saved as Producto
    }
    const { data, error } = await supabase
      .from('productos')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  async deleteProducto(id: string): Promise<void> {
    if (isElectron && desktopDB) {
      await desktopDB.deleteProducto(id)
      return
    }
    const { error } = await supabase
      .from('productos')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  async getMovimientos(productoId?: string): Promise<MovimientoInventario[]> {
    let query = supabase
      .from('movimientos_inventario')
      .select('*')
      .order('fecha', { ascending: false })
    if (productoId) query = query.eq('producto_id', productoId)
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  /**
   * Registra el movimiento, actualiza stock en Supabase,
   * y crea audit log + notificación según el nivel de stock resultante.
   */
  async registrarMovimiento(
    movimiento: Omit<MovimientoInventario, 'id' | 'fecha'>,
    productoNombre: string = 'Producto',
    stockMinimo: number = 10
  ): Promise<MovimientoInventario> {
    // 1. Insert movement
    const { data: movData, error: movError } = await supabase
      .from('movimientos_inventario')
      .insert([movimiento])
      .select()
      .single()
    if (movError) throw movError

    // 2. Fetch current stock
    const { data: producto, error: fetchError } = await supabase
      .from('productos')
      .select('stock_actual, stock_minimo')
      .eq('id', movimiento.producto_id)
      .single()
    if (fetchError) throw fetchError

    // 3. Calculate and persist new stock (supports absorbing negative over-sale balances)
    const resolvedMin = producto.stock_minimo ?? stockMinimo
    const newStock = Number(((producto.stock_actual || 0) + movimiento.cantidad).toFixed(3))

    const { error: updateError } = await supabase
      .from('productos')
      .update({ stock_actual: newStock })
      .eq('id', movimiento.producto_id)
    if (updateError) throw updateError


    const usuario = movimiento.usuario_id || 'Sistema'
    const tipoLabel = movimiento.tipo === 'entrada' ? 'Entrada de mercancía'
      : movimiento.tipo === 'merma' ? 'Merma / Rotura'
      : movimiento.tipo === 'salida' ? 'Salida'
      : 'Ajuste de conteo'

    // 4. Audit log — always info for adjustments
    await auditService.createAuditLog({
      user: usuario,
      action: tipoLabel,
      detail: `${productoNombre}: ${movimiento.cantidad > 0 ? '+' : ''}${movimiento.cantidad} unidades. Stock resultante: ${newStock}. Motivo: ${movimiento.motivo || '-'}`,
      severity: 'info'
    })

    // 5. Stock-level warnings and notifications
    if (newStock === 0) {
      await auditService.createAuditLog({
        user: 'Sistema',
        action: 'Sin stock',
        detail: `"${productoNombre}" ha quedado SIN STOCK. Se requiere reabastecimiento urgente.`,
        severity: 'critical'
      })
      await auditService.createNotification(
        `⚠️ Sin stock: "${productoNombre}" tiene 0 unidades disponibles.`,
        'stock'
      )
    } else if (newStock <= resolvedMin) {
      await auditService.createAuditLog({
        user: 'Sistema',
        action: 'Stock bajo',
        detail: `"${productoNombre}" está por debajo del mínimo. Stock actual: ${newStock} (mínimo: ${resolvedMin}).`,
        severity: 'warning'
      })
      await auditService.createNotification(
        `Stock bajo: "${productoNombre}" — quedan ${newStock} unidades (mínimo: ${resolvedMin}).`,
        'stock'
      )
    }

    return movData
  }
}
