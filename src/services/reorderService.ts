import { supabase } from '../lib/supabaseClient'

export interface Proveedor {
  id: string
  nombre: string
  asesor?: string
  telefono?: string
  email?: string
  dias_visita?: string
  negocio_id?: string
}

export interface OrdenCompra {
  id: string
  codigo: string
  proveedor_id: string
  fecha: string
  costo_total: number
  estado: 'pendiente' | 'enviada' | 'recibida'
  observaciones?: string
  proveedores?: {
    nombre: string
    asesor?: string
    telefono?: string
    email?: string
  }
}

export const reorderService = {
  // --- Suppliers CRUD ---
  async getProveedores(negocioId?: string | null): Promise<Proveedor[]> {
    let query = supabase.from('proveedores').select('*').order('nombre', { ascending: true })
    if (negocioId) query = query.eq('negocio_id', negocioId)
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async saveProveedor(proveedor: Omit<Proveedor, 'id'> & { id?: string }, negocioId?: string | null): Promise<Proveedor> {
    const { id, ...rest } = proveedor as any
    const payload = { ...rest, negocio_id: negocioId }
    let query
    if (id) {
      query = supabase.from('proveedores').update(payload).eq('id', id).select().single()
    } else {
      query = supabase.from('proveedores').insert([payload]).select().single()
    }
    const { data, error } = await query
    if (error) throw error
    return data
  },

  async deleteProveedor(id: string): Promise<void> {
    const { error } = await supabase.from('proveedores').delete().eq('id', id)
    if (error) throw error
  },

  // --- Purchase Orders ---
  async getOrdenes(negocioId?: string | null): Promise<OrdenCompra[]> {
    let query = supabase
      .from('ordenes_compra')
      .select('*, proveedores(nombre, asesor, telefono, email)')
      .order('fecha', { ascending: false })
    if (negocioId) query = query.eq('negocio_id', negocioId)
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async getOrdenDetalles(ordenId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('detalles_orden_compra')
      .select('*, productos(nombre, codigo_barras, plu)')
      .eq('orden_id', ordenId)
    if (error) throw error
    return data || []
  },

  async createOrdenCompra(
    negocioId: string,
    proveedorId: string,
    items: { productoId: string; cantidad: number; costoUnitario: number }[],
    observaciones?: string
  ): Promise<OrdenCompra> {
    const code = `OC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
    const total = items.reduce((acc, it) => acc + (it.cantidad * it.costoUnitario), 0)

    // Guard: block duplicate pending/sent orders for same supplier
    const { data: existing } = await supabase
      .from('ordenes_compra')
      .select('id, estado')
      .eq('negocio_id', negocioId)
      .eq('proveedor_id', proveedorId)
      .in('estado', ['pendiente', 'enviada'])
      .limit(1)

    if (existing && existing.length > 0) {
      throw new Error(
        `Ya existe una orden ${existing[0].estado} para este proveedor. Recibe o cancela esa orden antes de crear una nueva.`
      )
    }

    const { data: orden, error: ordenError } = await supabase
      .from('ordenes_compra')
      .insert([{
        codigo: code,
        negocio_id: negocioId,
        proveedor_id: proveedorId,
        costo_total: total,
        estado: 'pendiente',
        observaciones
      }])
      .select()
      .single()

    if (ordenError) throw ordenError

    const detailPayloads = items.map(it => ({
      orden_id: orden.id,
      producto_id: it.productoId,
      cantidad: it.cantidad,
      costo_unitario: it.costoUnitario,
      subtotal: it.cantidad * it.costoUnitario
    }))

    const { error: detailError } = await supabase
      .from('detalles_orden_compra')
      .insert(detailPayloads)

    if (detailError) throw detailError

    return orden
  },

  async updateOrdenEstado(id: string, estado: 'pendiente' | 'enviada' | 'recibida'): Promise<void> {
    const { error } = await supabase
      .from('ordenes_compra')
      .update({ estado })
      .eq('id', id)
    if (error) throw error
  },

  async deleteOrden(id: string): Promise<void> {
    // First delete line items (in case no CASCADE FK is set)
    const { error: detErr } = await supabase
      .from('detalles_orden_compra')
      .delete()
      .eq('orden_id', id)
    if (detErr) throw detErr
    const { error } = await supabase
      .from('ordenes_compra')
      .delete()
      .eq('id', id)
    if (error) throw error
  },

  // --- Smart Reorder Engine Calculation ---
  async calculateReorderSugerencias(negocioId?: string | null) {
    // 1. Fetch all products
    let prodQuery = supabase.from('productos').select('*')
    if (negocioId) prodQuery = prodQuery.eq('negocio_id', negocioId)
    const { data: products, error: prodErr } = await prodQuery
    if (prodErr) throw prodErr

    // 2. Fetch sales from last 14 days
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)
    let salesQuery = supabase
      .from('ventas')
      .select('id, fecha, detalles_venta(producto_id, cantidad)')
      .gte('fecha', fourteenDaysAgo.toISOString())
    if (negocioId) salesQuery = salesQuery.eq('negocio_id', negocioId)
    const { data: sales, error: salesErr } = await salesQuery
    if (salesErr) throw salesErr

    // Map velocity
    const salesVolume: Record<string, number> = {}
    sales?.forEach(sale => {
      sale.detalles_venta?.forEach((det: any) => {
        const pId = det.producto_id
        const qty = det.cantidad || 0
        salesVolume[pId] = (salesVolume[pId] || 0) + qty
      })
    })

    return (products || []).map(p => {
      const soldLast14Days = salesVolume[p.id] || 0
      const dailyVelocity = soldLast14Days / 14
      const currentStock = p.stock_actual || 0
      const minStock = p.stock_minimo || 10

      // Remaining stock days coverage
      const daysRemaining = dailyVelocity > 0 ? (currentStock / dailyVelocity) : 999

      // Suggested reorder (assuming target of 7 days coverage)
      const targetDays = 7
      const suggestedAmount = Math.ceil((dailyVelocity * targetDays) - currentStock)

      // Add flags for ordering
      const needsReorder = currentStock <= minStock || daysRemaining <= 3 || (suggestedAmount > 0 && currentStock < minStock * 1.5)

      return {
        producto: p,
        velocity: dailyVelocity,
        daysRemaining: Math.round(daysRemaining * 10) / 10,
        suggested: needsReorder && suggestedAmount > 0 ? suggestedAmount : 0,
        needsReorder
      }
    })
  }
}
