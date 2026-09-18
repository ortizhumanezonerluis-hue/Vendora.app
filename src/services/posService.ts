import { supabase } from '../lib/supabaseClient'
import { Venta, DetalleVenta, Producto } from '../types'
import { auditService } from './auditService'

export const posService = {
  async processSale(
    saleData: Omit<Venta, 'id' | 'fecha'> & { negocio_id?: string | null },
    items: { product: Producto; qty: number }[]
  ): Promise<Venta> {
    // Calculate total, subtotal, and tax based on individual products custom IVA
    let totalTax = 0
    let totalSubtotal = 0

    items.forEach((item) => {
      const itemSubtotal = item.product.precio_venta * item.qty
      const itemIvaPercent = (item.product as any).porcentaje_iva ?? 19.00
      const itemTax = itemSubtotal * (itemIvaPercent / 100)

      totalSubtotal += itemSubtotal
      totalTax += itemTax
    })

    const finalTotal = totalSubtotal + totalTax

    let sale: Venta | null = null
    let saleError: any = null

    // Try full insert first
    try {
      const payload: any = {
        usuario_id: saleData.usuario_id || saleData.cajero,
        cajero: saleData.cajero || saleData.usuario_id,
        total: finalTotal,
        subtotal: totalSubtotal,
        impuesto: totalTax,
        metodo_pago: saleData.metodo_pago,
        estado: 'completada'
      }
      if (saleData.negocio_id) payload.negocio_id = saleData.negocio_id

      const { data, error } = await supabase
        .from('ventas')
        .insert([payload])
        .select()
        .single()
      
      if (error) throw error
      sale = data
    } catch (err: any) {
      saleError = err
      const errMsg = err?.message || ''
      
      // If 'impuesto' or 'subtotal' column is missing from cache, retry without them
      if (errMsg.includes('impuesto') || errMsg.includes('subtotal') || err?.code === 'PGRST204') {
        try {
          console.warn('Retrying sale insert without subtotal/impuesto columns...')
          const retryPayload: any = {
            usuario_id: saleData.usuario_id || saleData.cajero,
            cajero: saleData.cajero || saleData.usuario_id,
            total: finalTotal,
            metodo_pago: saleData.metodo_pago,
            estado: 'completada'
          }
          if (saleData.negocio_id) retryPayload.negocio_id = saleData.negocio_id

          const { data, error } = await supabase
            .from('ventas')
            .insert([retryPayload])
            .select()
            .single()
          
          if (error) throw error
          sale = data
          saleError = null // Clear error since retry succeeded
        } catch (err2: any) {
          saleError = err2
          const errMsg2 = err2?.message || ''
          
          // If 'cajero' is also missing from cache, retry with only basic fields
          if (errMsg2.includes('cajero')) {
            console.warn('Retrying sale insert with only basic columns...')
            const basicPayload: any = {
              usuario_id: saleData.usuario_id || 'Cajero',
              total: finalTotal,
              metodo_pago: saleData.metodo_pago,
              estado: 'completada'
            }
            if (saleData.negocio_id) basicPayload.negocio_id = saleData.negocio_id

            const { data, error: error3 } = await supabase
              .from('ventas')
              .insert([basicPayload])
              .select()
              .single()
            
            if (error3) throw error3
            sale = data
            saleError = null
          }
        }
      }
    }

    if (saleError || !sale) {
      throw saleError || new Error('No se pudo crear el registro de venta')
    }

    // 2. Insert details & update stock per item
    for (const item of items) {
      const cleanQty = Number(Number(item.qty).toFixed(3))
      const subtotal = item.product.precio_venta * cleanQty
      const detail: Omit<DetalleVenta, 'id'> = {
        venta_id: sale.id,
        producto_id: item.product.id,
        cantidad: cleanQty,
        precio_unitario: item.product.precio_venta,
        subtotal
      }

      try {
        const { error: detailError } = await supabase
          .from('detalles_venta')
          .insert([detail])
        if (detailError) throw detailError
      } catch (err) {
        console.warn('No se pudo guardar detalle de venta:', err)
      }

      const newStock = Number(((item.product.stock_actual || 0) - cleanQty).toFixed(3))
      try {
        const { error: stockError } = await supabase
          .from('productos')
          .update({ stock_actual: newStock })
          .eq('id', item.product.id)
        if (stockError) throw stockError
      } catch (err) {
        console.warn('No se pudo actualizar stock:', err)
      }


      // Movement (kardex)
      try {
        await supabase.from('movimientos_inventario').insert([{
          producto_id: item.product.id,
          tipo: 'salida',
          cantidad: -cleanQty,
          motivo: `Venta #${sale.id.slice(0, 8)}`,
          usuario_id: sale.cajero || sale.usuario_id
        }])
      } catch (err) {
        console.warn('No se pudo registrar movimiento de inventario:', err)
      }

      // Stock-level notifications and audit logs after sale
      const resolvedMin = item.product.stock_minimo ?? 10
      if (newStock === 0) {
        await auditService.createAuditLog({
          user: 'Sistema',
          action: 'Sin stock tras venta',
          detail: `"${item.product.nombre}" agotado tras la venta #${sale.id.slice(0, 8)}. Stock: 0.`,
          severity: 'critical'
        })
        await auditService.createNotification(
          `⚠️ Sin stock: "${item.product.nombre}" tiene 0 unidades disponibles.`,
          'stock'
        )
      } else if (newStock <= resolvedMin) {
        await auditService.createAuditLog({
          user: 'Sistema',
          action: 'Stock bajo tras venta',
          detail: `"${item.product.nombre}" bajo mínimo tras venta. Stock actual: ${newStock} (mínimo: ${resolvedMin}).`,
          severity: 'warning'
        })
        await auditService.createNotification(
          `Stock bajo: "${item.product.nombre}" — quedan ${newStock} unidades.`,
          'stock'
        )
      }
    }

    // Audit log: info — sale completed
    await auditService.createAuditLog({
      user: sale.cajero || sale.usuario_id || 'Cajero',
      action: 'Venta realizada',
      detail: `Venta #${sale.id.slice(0, 8)} por ${finalTotal.toFixed(0)} COP vía ${saleData.metodo_pago}.`,
      severity: 'info'
    })

    return sale
  },

  async getTodaySales(): Promise<any[]> {
    if (!navigator.onLine) {
      return []
    }
    try {
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await supabase
        .from('ventas')
        .select(`*, detalles_venta (*, productos (*))`)
        .gte('fecha', today)
        .order('fecha', { ascending: false })
      if (error) throw error
      return data || []
    } catch {
      return []
    }
  }
}
