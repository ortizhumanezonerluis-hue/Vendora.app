import { supabase } from '../lib/supabaseClient'

export interface RutConfig {
  id?: string
  negocio_id: string
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
  negocio_id: string
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
  negocio_id: string
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
  negocio_id: string
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
  negocio_id: string
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

export const accountingService = {
  // ==========================================
  // 1. RUT CONFIGURATION (Conectado a BD)
  // ==========================================
  async getRutConfig(negocioId: string): Promise<RutConfig> {
    try {
      const { data, error } = await supabase
        .from('rut_config')
        .select('*')
        .eq('negocio_id', negocioId)
        .limit(1)
        .maybeSingle()

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
      nit: rfc || '',
      dv: '0',
      razon_social: storeName || 'Nombre del Negocio',
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
    const payload = {
      negocio_id: config.negocio_id,
      tenant_id: config.negocio_id,
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

    // Check if record exists
    const { data: existing } = await supabase
      .from('rut_config')
      .select('id')
      .eq('negocio_id', config.negocio_id)
      .limit(1)
      .maybeSingle()

    let res
    if (existing?.id) {
      res = await supabase
        .from('rut_config')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single()
    } else {
      res = await supabase
        .from('rut_config')
        .insert([payload])
        .select()
        .single()
    }

    if (res.error) throw res.error
    return res.data
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
  // 2. LIBRO FISCAL DE OPERACIONES DIARIAS
  // ==========================================
  async getLibroFiscal(negocioId: string): Promise<LibroFiscalItem[]> {
    let dbItems: LibroFiscalItem[] = []

    try {
      const { data, error } = await supabase
        .from('libro_fiscal_registros')
        .select('*')
        .eq('negocio_id', negocioId)
        .order('fecha', { ascending: false })

      if (!error && data) dbItems = data
    } catch (e) {
      console.warn('Error leyendo libro_fiscal_registros:', e)
    }

    // Automatic entries from POS sales (ventas)
    try {
      const { data: sales } = await supabase
        .from('ventas')
        .select('id, fecha, total, cajero, usuario_id')
        .eq('negocio_id', negocioId)
        .order('fecha', { ascending: false })
        .limit(500)

      if (sales && sales.length > 0) {
        const salesByDay: Record<string, { total: number; count: number; refs: string[] }> = {}
        sales.forEach(s => {
          const day = s.fecha ? s.fecha.split('T')[0] : new Date().toISOString().split('T')[0]
          if (!salesByDay[day]) {
            salesByDay[day] = { total: 0, count: 0, refs: [] }
          }
          salesByDay[day].total += Number(s.total) || 0
          salesByDay[day].count += 1
          salesByDay[day].refs.push(s.id.slice(0, 6).toUpperCase())
        })

        Object.entries(salesByDay).forEach(([day, info]) => {
          const exists = dbItems.some(i => i.fecha === day && i.origen === 'pos')
          if (!exists) {
            dbItems.push({
              id: `pos-auto-${day}`,
              negocio_id: negocioId,
              fecha: day,
              concepto: `Ventas globales del día (${info.count} tickets)`,
              tipo: 'ingreso',
              origen: 'pos',
              comprobante_ref: `Tickets #${info.refs.slice(0, 3).join(', #')}...`,
              valor_ingreso: info.total,
              valor_egreso: 0,
              observaciones: 'Ingreso global diario sincronizado desde el punto de venta'
            })
          }
        })
      }
    } catch (e) {
      console.warn('Error agregando ventas del POS:', e)
    }

    // Automatic entries from received purchase orders (ordenes_compra)
    try {
      const { data: orders } = await supabase
        .from('ordenes_compra')
        .select('id, codigo, fecha, costo_total, estado, proveedores(nombre)')
        .eq('negocio_id', negocioId)
        .eq('estado', 'recibida')

      if (orders && orders.length > 0) {
        orders.forEach((ord: any) => {
          const day = ord.fecha ? ord.fecha.split('T')[0] : new Date().toISOString().split('T')[0]
          const exists = dbItems.some(i => i.comprobante_ref === ord.codigo || i.id === `oc-${ord.id}`)
          if (!exists) {
            dbItems.push({
              id: `oc-${ord.id}`,
              negocio_id: negocioId,
              fecha: day,
              concepto: `Compra de mercancía - ${ord.proveedores?.nombre || 'Proveedor'}`,
              tipo: 'egreso',
              origen: 'orden_compra',
              comprobante_ref: ord.codigo,
              valor_ingreso: 0,
              valor_egreso: Number(ord.costo_total) || 0,
              observaciones: 'Registro fiscal permanente de orden de compra recibida'
            })
          }
        })
      }
    } catch (e) {
      console.warn('Error agregando compras al libro fiscal:', e)
    }

    return dbItems.sort((a, b) => b.fecha.localeCompare(a.fecha))
  },

  async addLibroFiscalItem(item: Omit<LibroFiscalItem, 'id'>): Promise<LibroFiscalItem> {
    const payload = {
      negocio_id: item.negocio_id,
      tenant_id: item.negocio_id,
      fecha: item.fecha,
      concepto: item.concepto,
      tipo: item.tipo,
      origen: item.origen || 'manual',
      comprobante_ref: item.comprobante_ref || null,
      valor_ingreso: item.valor_ingreso || 0,
      valor_egreso: item.valor_egreso || 0,
      observaciones: item.observaciones || null
    }

    const { data, error } = await supabase
      .from('libro_fiscal_registros')
      .insert([payload])
      .select()
      .single()

    if (error) throw error
    return data
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
    const { data, error } = await supabase
      .from('costos_soportados')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('fecha', { ascending: false })

    if (error) {
      console.warn('Error leyendo costos soportados:', error)
      return []
    }
    return data || []
  },

  async addCostoSoportado(costo: Omit<CostoSoportado, 'id'>): Promise<CostoSoportado> {
    const payload = {
      negocio_id: costo.negocio_id,
      tenant_id: costo.negocio_id,
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

    const { data, error } = await supabase
      .from('costos_soportados')
      .insert([payload])
      .select()
      .single()

    if (error) throw error
    return data
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
    const { data, error } = await supabase
      .from('extractos_bancarios')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('fecha', { ascending: false })

    if (error) {
      console.warn('Error leyendo extractos bancarios:', error)
      return []
    }
    return data || []
  },

  async addExtracto(item: Omit<ExtractoBancario, 'id'>): Promise<ExtractoBancario> {
    const payload = {
      negocio_id: item.negocio_id,
      tenant_id: item.negocio_id,
      fecha: item.fecha,
      entidad: item.entidad,
      referencia: item.referencia,
      monto_banco: item.monto_banco,
      monto_pos: item.monto_pos,
      estado: item.estado || 'conciliado',
      notas: item.notas || null
    }

    const { data, error } = await supabase
      .from('extractos_bancarios')
      .insert([payload])
      .select()
      .single()

    if (error) throw error
    return data
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
    const { data, error } = await supabase
      .from('pagos_menores')
      .select('*')
      .eq('negocio_id', negocioId)
      .order('fecha', { ascending: false })

    if (error) {
      console.warn('Error leyendo pagos menores:', error)
      return []
    }
    return data || []
  },

  async addPagoMenor(pago: Omit<PagoMenor, 'id'>): Promise<PagoMenor> {
    const payload = {
      negocio_id: pago.negocio_id,
      tenant_id: pago.negocio_id,
      fecha: pago.fecha,
      concepto: pago.concepto,
      categoria: pago.categoria,
      beneficiario: pago.beneficiario,
      documento_beneficiario: pago.documento_beneficiario || null,
      monto: pago.monto,
      comprobante_url: pago.comprobante_url || null,
      observaciones: pago.observaciones || null
    }

    const { data, error } = await supabase
      .from('pagos_menores')
      .insert([payload])
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deletePagoMenor(id: string): Promise<void> {
    const { error } = await supabase
      .from('pagos_menores')
      .delete()
      .eq('id', id)

    if (error) throw error
  }
}
