import { supabase } from '../lib/supabaseClient'

export interface RutConfig {
  id?: string
  negocio_id?: string
  tenant_id?: string
  nit: string
  dv: string
  razon_social: string
  nombre_comercial?: string
  actividad_ciiu: string
  responsabilidades: string[]
  correo_fiscal?: string
  telefono_fiscal?: string
  departamento?: string
  ciudad?: string
  direccion_fiscal?: string
  pdf_url?: string
  estado_verificacion: 'vigente' | 'pendiente_actualizacion' | 'en_revision'
  actualizado_en?: string
}

export interface LibroFiscalItem {
  id: string
  negocio_id?: string
  tenant_id?: string
  fecha: string
  concepto: string
  tipo: 'ingreso' | 'egreso'
  origen: 'pos' | 'orden_compra' | 'manual'
  comprobante_ref?: string
  valor_ingreso: number
  valor_egreso: number
  observaciones?: string
  creado_en?: string
}

export interface CostoSoportado {
  id: string
  negocio_id?: string
  tenant_id?: string
  fecha: string
  proveedor_nombre: string
  proveedor_nit: string
  numero_factura: string
  subtotal: number
  iva: number
  total: number
  estado: 'validado' | 'pendiente' | 'rechazado'
  pdf_url?: string
  xml_url?: string
  notas?: string
  creado_en?: string
}

export interface ExtractoBancario {
  id: string
  negocio_id?: string
  tenant_id?: string
  fecha: string
  entidad: 'Nequi' | 'Daviplata' | 'Bancolombia' | 'Datafono' | 'Otro'
  referencia: string
  monto_banco: number
  monto_pos: number
  estado: 'conciliado' | 'pendiente' | 'discrepancia'
  notas?: string
  creado_en?: string
}

export interface PagoMenor {
  id: string
  negocio_id?: string
  tenant_id?: string
  fecha: string
  concepto: string
  categoria: 'Acarreos' | 'Servicios' | 'Mantenimiento' | 'Aseo' | 'Suministros' | 'Otros'
  beneficiario: string
  documento_beneficiario?: string
  monto: number
  comprobante_url?: string
  observaciones?: string
  creado_en?: string
}

// Robust helper to insert into Supabase handling both negocio_id and tenant_id column names
async function insertWithFallback(tableName: string, payload: any, negocioId: string) {
  // First attempt: include both
  try {
    const { data, error } = await supabase
      .from(tableName)
      .insert([{ ...payload, negocio_id: negocioId, tenant_id: negocioId }])
      .select()
      .single()
    if (!error && data) return data
    if (error) throw error
  } catch (err: any) {
    const msg = err?.message || ''
    // If negocio_id column is missing in DB schema cache, retry with only tenant_id
    if (msg.includes('negocio_id') || err?.code === 'PGRST204') {
      const clean = { ...payload, tenant_id: negocioId }
      delete clean.negocio_id
      const { data: d2, error: e2 } = await supabase
        .from(tableName)
        .insert([clean])
        .select()
        .single()
      if (!e2 && d2) return d2
      throw e2
    }
    // If tenant_id column is missing, retry with only negocio_id
    if (msg.includes('tenant_id')) {
      const clean = { ...payload, negocio_id: negocioId }
      delete clean.tenant_id
      const { data: d3, error: e3 } = await supabase
        .from(tableName)
        .insert([clean])
        .select()
        .single()
      if (!e3 && d3) return d3
      throw e3
    }
    throw err
  }
}

// Robust helper to select from Supabase handling both negocio_id and tenant_id
async function selectWithFallback(tableName: string, negocioId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('negocio_id', negocioId)
      .order('fecha', { ascending: false })
    if (!error && data) return data
    if (error) throw error
  } catch (err: any) {
    const msg = err?.message || ''
    if (msg.includes('negocio_id') || err?.code === 'PGRST204') {
      try {
        const { data: d2, error: e2 } = await supabase
          .from(tableName)
          .select('*')
          .eq('tenant_id', negocioId)
          .order('fecha', { ascending: false })
        if (!e2 && d2) return d2
      } catch (_) {}
    }
  }
  return []
}

export const accountingService = {
  // ==========================================
  // 1. RUT CONFIGURATION (Conectado a BD)
  // ==========================================
  async getRutConfig(negocioId: string): Promise<RutConfig> {
    try {
      let { data, error } = await supabase
        .from('rut_config')
        .select('*')
        .eq('negocio_id', negocioId)
        .limit(1)
        .maybeSingle()

      if (error && (error.message?.includes('negocio_id') || error.code === 'PGRST204')) {
        const fallback = await supabase
          .from('rut_config')
          .select('*')
          .eq('tenant_id', negocioId)
          .limit(1)
          .maybeSingle()
        data = fallback.data
      }

      if (data) return data
    } catch (e) {
      console.warn('Error leyendo rut_config de Supabase:', e)
    }

    // Fallback: load business info from configuracion_negocio
    let storeName = ''
    let storeAddress = ''
    let storePhone = ''
    let rfc = ''

    try {
      const { data: storeData } = await supabase
        .from('configuracion_negocio')
        .select('nombre, direccion, telefono, rfc')
        .eq('negocio_id', negocioId)
        .limit(1)
        .maybeSingle()

      if (storeData) {
        storeName = storeData.nombre || ''
        storeAddress = storeData.direccion || ''
        storePhone = storeData.telefono || ''
        rfc = storeData.rfc || ''
      }
    } catch (_) {}

    return {
      negocio_id: negocioId,
      tenant_id: negocioId,
      nit: rfc || '',
      dv: '0',
      razon_social: storeName || 'Nombre del Comercio',
      nombre_comercial: storeName || '',
      actividad_ciiu: '4711 - Comercio al por menor en establecimientos no especializados',
      responsabilidades: ['52 - No responsable de IVA (Art. 437 E.T.)'],
      correo_fiscal: '',
      telefono_fiscal: storePhone || '',
      departamento: '',
      ciudad: '',
      direccion_fiscal: storeAddress || '',
      estado_verificacion: 'vigente',
      actualizado_en: new Date().toISOString()
    }
  },

  async saveRutConfig(config: RutConfig): Promise<RutConfig> {
    const payload: any = {
      negocio_id: config.negocio_id,
      tenant_id: config.negocio_id || config.tenant_id,
      nit: config.nit,
      dv: config.dv,
      razon_social: config.razon_social,
      nombre_comercial: config.nombre_comercial || '',
      actividad_ciiu: config.actividad_ciiu,
      responsabilidades: config.responsabilidades,
      correo_fiscal: config.correo_fiscal || '',
      telefono_fiscal: config.telefono_fiscal || '',
      direccion_fiscal: config.direccion_fiscal || '',
      ciudad: config.ciudad || '',
      departamento: config.departamento || '',
      pdf_url: config.pdf_url || '',
      estado_verificacion: config.estado_verificacion || 'vigente',
      actualizado_en: new Date().toISOString()
    }

    const nId = config.negocio_id || config.tenant_id || ''

    // Check existing
    let existingId: string | null = null
    try {
      const { data: ex1 } = await supabase
        .from('rut_config')
        .select('id')
        .eq('negocio_id', nId)
        .limit(1)
        .maybeSingle()
      if (ex1?.id) existingId = ex1.id
    } catch (_) {
      try {
        const { data: ex2 } = await supabase
          .from('rut_config')
          .select('id')
          .eq('tenant_id', nId)
          .limit(1)
          .maybeSingle()
        if (ex2?.id) existingId = ex2.id
      } catch (_) {}
    }

    if (existingId) {
      try {
        const { data, error } = await supabase
          .from('rut_config')
          .update(payload)
          .eq('id', existingId)
          .select()
          .single()
        if (!error && data) return data
        if (error && (error.message?.includes('negocio_id') || error.code === 'PGRST204')) {
          delete payload.negocio_id
          const { data: d2, error: e2 } = await supabase
            .from('rut_config')
            .update(payload)
            .eq('id', existingId)
            .select()
            .single()
          if (!e2 && d2) return d2
          throw e2
        }
      } catch (err: any) {
        if (err.message?.includes('negocio_id')) {
          delete payload.negocio_id
          const { data: d2, error: e2 } = await supabase
            .from('rut_config')
            .update(payload)
            .eq('id', existingId)
            .select()
            .single()
          if (!e2 && d2) return d2
          throw e2
        }
        throw err
      }
    }

    return await insertWithFallback('rut_config', payload, nId)
  },

  // Calculate actual annual gross sales from database
  async getAnnualGrossSales(negocioId: string): Promise<number> {
    try {
      const currentYear = new Date().getFullYear()
      const startDate = `${currentYear}-01-01T00:00:00.000Z`
      const endDate = `${currentYear}-12-31T23:59:59.999Z`

      const { data, error } = await supabase
        .from('ventas')
        .select('total')
        .eq('negocio_id', negocioId)
        .gte('fecha', startDate)
        .lte('fecha', endDate)

      if (error || !data) return 0
      return data.reduce((sum, v) => sum + (Number(v.total) || 0), 0)
    } catch (e) {
      console.warn('Error calculando ventas anuales:', e)
      return 0
    }
  },

  // ==========================================
  // 2. LIBRO FISCAL DE OPERACIONES (DETALLE INDIVIDUAL)
  // ==========================================
  async getLibroFiscal(negocioId: string): Promise<LibroFiscalItem[]> {
    let items: LibroFiscalItem[] = []

    // 1. Fetch manual entries from DB
    const manualEntries = await selectWithFallback('libro_fiscal_registros', negocioId)
    if (manualEntries && manualEntries.length > 0) {
      items.push(...manualEntries)
    }

    // 2. Fetch EVERY INDIVIDUAL SALE from POS (ventas) with full details
    try {
      const { data: sales } = await supabase
        .from('ventas')
        .select(`
          id, fecha, total, cajero, usuario_id, metodo_pago,
          detalles_venta (
            cantidad, precio_unitario,
            productos (
              nombre
            )
          )
        `)
        .eq('negocio_id', negocioId)
        .order('fecha', { ascending: false })
        .limit(1000)

      if (sales && sales.length > 0) {
        sales.forEach((s: any) => {
          const ticketNum = s.id ? s.id.slice(0, 8).toUpperCase() : 'VENTA'
          const metodo = s.metodo_pago ? s.metodo_pago.toUpperCase() : 'EFECTIVO'
          const cajero = s.cajero || s.usuario_id || 'Cajero'
          
          // Format item details
          let productsDesc = ''
          if (s.detalles_venta && s.detalles_venta.length > 0) {
            productsDesc = s.detalles_venta
              .map((d: any) => `${d.cantidad}x ${d.productos?.nombre || 'Producto'}`)
              .join(', ')
          }

          const conceptoTexto = productsDesc
            ? `Venta Ticket #${ticketNum} (${metodo}) · ${productsDesc}`
            : `Venta Ticket #${ticketNum} (${metodo}) · Cobro en caja por ${cajero}`

          items.push({
            id: `pos-${s.id}`,
            negocio_id: negocioId,
            fecha: s.fecha ? s.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
            concepto: conceptoTexto,
            tipo: 'ingreso',
            origen: 'pos',
            comprobante_ref: `Ticket #${ticketNum}`,
            valor_ingreso: Number(s.total) || 0,
            valor_egreso: 0,
            observaciones: `Cajero: ${cajero} · Método: ${metodo}`
          })
        })
      }
    } catch (e) {
      console.warn('Error cargando ventas individuales del POS para libro fiscal:', e)
    }

    // 3. Fetch EVERY RECEIVED PURCHASE ORDER (ordenes_compra)
    try {
      const { data: orders } = await supabase
        .from('ordenes_compra')
        .select(`
          id, codigo, fecha, costo_total, estado,
          proveedores (
            nombre
          ),
          detalles_orden_compra (
            cantidad,
            productos (
              nombre
            )
          )
        `)
        .eq('negocio_id', negocioId)
        .eq('estado', 'recibida')
        .order('fecha', { ascending: false })

      if (orders && orders.length > 0) {
        orders.forEach((ord: any) => {
          const provNombre = ord.proveedores?.nombre || 'Proveedor'
          let itemsDesc = ''
          if (ord.detalles_orden_compra && ord.detalles_orden_compra.length > 0) {
            itemsDesc = ord.detalles_orden_compra
              .map((d: any) => `${d.cantidad}x ${d.productos?.nombre || 'Ítem'}`)
              .join(', ')
          }

          const concepto = itemsDesc
            ? `Compra de mercancía a ${provNombre} (${ord.codigo}) · ${itemsDesc}`
            : `Compra de mercancía recibida - ${provNombre} (${ord.codigo})`

          items.push({
            id: `oc-${ord.id}`,
            negocio_id: negocioId,
            fecha: ord.fecha ? ord.fecha.split('T')[0] : new Date().toISOString().split('T')[0],
            concepto: concepto,
            tipo: 'egreso',
            origen: 'orden_compra',
            comprobante_ref: ord.codigo,
            valor_ingreso: 0,
            valor_egreso: Number(ord.costo_total) || 0,
            observaciones: `Proveedor: ${provNombre} · Orden de Compra Recibida`
          })
        })
      }
    } catch (e) {
      console.warn('Error cargando compras para libro fiscal:', e)
    }

    return items.sort((a, b) => b.fecha.localeCompare(a.fecha))
  },

  async addLibroFiscalItem(item: Omit<LibroFiscalItem, 'id'>): Promise<LibroFiscalItem> {
    const payload = {
      fecha: item.fecha,
      concepto: item.concepto,
      tipo: item.tipo,
      origen: item.origen || 'manual',
      comprobante_ref: item.comprobante_ref || null,
      valor_ingreso: item.valor_ingreso || 0,
      valor_egreso: item.valor_egreso || 0,
      observaciones: item.observaciones || null
    }

    return await insertWithFallback('libro_fiscal_registros', payload, item.negocio_id || '')
  },

  async updateLibroFiscalItem(id: string, updates: Partial<LibroFiscalItem>): Promise<void> {
    const { error } = await supabase
      .from('libro_fiscal_registros')
      .update(updates)
      .eq('id', id)

    if (error) throw error
  },

  async deleteLibroFiscalItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('libro_fiscal_registros')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ==========================================
  // 3. COSTOS SOPORTADOS (FACTURAS PROVEEDOR)
  // ==========================================
  async getCostosSoportados(negocioId: string): Promise<CostoSoportado[]> {
    return await selectWithFallback('costos_soportados', negocioId)
  },

  async addCostoSoportado(costo: Omit<CostoSoportado, 'id'>): Promise<CostoSoportado> {
    const payload = {
      fecha: costo.fecha,
      proveedor_nombre: costo.proveedor_nombre,
      proveedor_nit: costo.proveedor_nit,
      numero_factura: costo.numero_factura,
      subtotal: costo.subtotal,
      iva: costo.iva,
      total: costo.total,
      estado: costo.estado || 'validado',
      pdf_url: costo.pdf_url || '',
      xml_url: costo.xml_url || '',
      notas: costo.notas || null
    }

    return await insertWithFallback('costos_soportados', payload, costo.negocio_id || '')
  },

  async deleteCostoSoportado(id: string): Promise<void> {
    const { error } = await supabase
      .from('costos_soportados')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ==========================================
  // 4. EXTRACTOS BANCARIOS CONCILIADOS
  // ==========================================
  async getExtractosBancarios(negocioId: string): Promise<ExtractoBancario[]> {
    return await selectWithFallback('extractos_bancarios', negocioId)
  },

  async addExtracto(item: Omit<ExtractoBancario, 'id'>): Promise<ExtractoBancario> {
    const payload = {
      fecha: item.fecha,
      entidad: item.entidad,
      referencia: item.referencia,
      monto_banco: item.monto_banco,
      monto_pos: item.monto_pos,
      estado: item.estado || 'conciliado',
      notas: item.notas || null
    }

    return await insertWithFallback('extractos_bancarios', payload, item.negocio_id || '')
  },

  async deleteExtracto(id: string): Promise<void> {
    const { error } = await supabase
      .from('extractos_bancarios')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // ==========================================
  // 5. PAGOS MENORES (CAJA MENOR)
  // ==========================================
  async getPagosMenores(negocioId: string): Promise<PagoMenor[]> {
    return await selectWithFallback('pagos_menores', negocioId)
  },

  async addPagoMenor(pago: Omit<PagoMenor, 'id'>): Promise<PagoMenor> {
    const payload = {
      fecha: pago.fecha,
      concepto: pago.concepto,
      categoria: pago.categoria,
      beneficiario: pago.beneficiario,
      documento_beneficiario: pago.documento_beneficiario || null,
      monto: pago.monto,
      comprobante_url: pago.comprobante_url || null,
      observaciones: pago.observaciones || null
    }

    return await insertWithFallback('pagos_menores', payload, pago.negocio_id || '')
  },

  async deletePagoMenor(id: string): Promise<void> {
    const { error } = await supabase
      .from('pagos_menores')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
