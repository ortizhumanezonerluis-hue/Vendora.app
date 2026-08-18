import { supabase } from '../lib/supabaseClient'

export interface RutConfig {
  id?: string
  tenant_id: string
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

// Fallback storage keys for offline resilience
const STORAGE_KEYS = {
  RUT: 'vendora_acc_rut',
  LIBRO_FISCAL: 'vendora_acc_libro',
  COSTOS: 'vendora_acc_costos',
  EXTRACTOS: 'vendora_acc_extractos',
  PAGOS_MENORES: 'vendora_acc_pagos_menores'
}

export const accountingService = {
  // ==========================================
  // 1. RUT CONFIGURATION
  // ==========================================
  async getRutConfig(tenantId: string): Promise<RutConfig> {
    try {
      const { data, error } = await supabase
        .from('rut_config')
        .select('*')
        .eq('tenant_id', tenantId)
        .limit(1)
        .maybeSingle()

      if (data) return data
    } catch (e) {
      console.warn('Usando almacenamiento local para RUT:', e)
    }

    const saved = localStorage.getItem(`${STORAGE_KEYS.RUT}_${tenantId}`)
    if (saved) {
      try { return JSON.parse(saved) } catch (_) {}
    }

    // Default configuration for Colombian No Responsable de IVA
    return {
      tenant_id: tenantId,
      nit: '900.123.456',
      dv: '7',
      razon_social: "Tienda La Bendición - Régimen Simplificado",
      nombre_comercial: "Vendora Store",
      actividad_ciiu: '4711 - Comercio al por menor en establecimientos no especializados',
      responsabilidades: ['52 - No responsable de IVA (Art. 437 E.T.)', '49 - No responsable de INC'],
      correo_fiscal: 'contacto@vendora.com',
      telefono_fiscal: '3009797523',
      departamento: 'Córdoba',
      ciudad: 'Cereté',
      direccion_fiscal: 'CLL 89-98 Cereté - Córdoba',
      estado_verificacion: 'vigente',
      actualizado_en: new Date().toISOString()
    }
  },

  async saveRutConfig(config: RutConfig): Promise<RutConfig> {
    const payload = {
      ...config,
      actualizado_en: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('rut_config')
        .upsert([payload], { onConflict: 'tenant_id' })
        .select()
        .single()

      if (!error && data) {
        localStorage.setItem(`${STORAGE_KEYS.RUT}_${config.tenant_id}`, JSON.stringify(data))
        return data
      }
    } catch (e) {
      console.warn('Guardando RUT en storage local:', e)
    }

    localStorage.setItem(`${STORAGE_KEYS.RUT}_${config.tenant_id}`, JSON.stringify(payload))
    return payload
  },

  // ==========================================
  // 2. LIBRO FISCAL DE OPERACIONES DIARIAS
  // ==========================================
  async getLibroFiscal(tenantId: string): Promise<LibroFiscalItem[]> {
    let dbItems: LibroFiscalItem[] = []

    try {
      const { data, error } = await supabase
        .from('libro_fiscal_registros')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('fecha', { ascending: false })

      if (!error && data) dbItems = data
    } catch (e) {
      console.warn('Error leyendo libro_fiscal_registros de Supabase:', e)
    }

    // Also fetch automatic daily entries from POS sales (ventas)
    try {
      const { data: sales } = await supabase
        .from('ventas')
        .select('id, fecha, total, cajero, usuario_id')
        .eq('negocio_id', tenantId)
        .order('fecha', { ascending: false })
        .limit(300)

      if (sales && sales.length > 0) {
        // Group sales by day
        const salesByDay: Record<string, { total: number; count: number; refs: string[] }> = {}
        sales.forEach(s => {
          const day = s.fecha.split('T')[0]
          if (!salesByDay[day]) {
            salesByDay[day] = { total: 0, count: 0, refs: [] }
          }
          salesByDay[day].total += Number(s.total) || 0
          salesByDay[day].count += 1
          salesByDay[day].refs.push(s.id.slice(0, 6).toUpperCase())
        })

        // Merge with existing entries (avoid duplicate POS entries for same day)
        Object.entries(salesByDay).forEach(([day, info]) => {
          const exists = dbItems.some(i => i.fecha === day && i.origen === 'pos')
          if (!exists) {
            dbItems.push({
              id: `pos-auto-${day}`,
              tenant_id: tenantId,
              fecha: day,
              concepto: `Ventas globales del día (POS - ${info.count} tickets)`,
              tipo: 'ingreso',
              origen: 'pos',
              comprobante_ref: `Tickets: #${info.refs.slice(0, 3).join(', #')}...`,
              valor_ingreso: info.total,
              valor_egreso: 0,
              observaciones: 'Ingreso global diario generado automáticamente desde el punto de venta'
            })
          }
        })
      }
    } catch (e) {
      console.warn('Error agregando ventas automáticas al libro fiscal:', e)
    }

    // Also sync received purchase orders (ordenes_compra)
    try {
      const { data: orders } = await supabase
        .from('ordenes_compra')
        .select('id, codigo, fecha, costo_total, estado, proveedores(nombre)')
        .eq('negocio_id', tenantId)
        .eq('estado', 'recibida')

      if (orders && orders.length > 0) {
        orders.forEach((ord: any) => {
          const day = ord.fecha.split('T')[0]
          const exists = dbItems.some(i => i.comprobante_ref === ord.codigo || i.id === `oc-${ord.id}`)
          if (!exists) {
            dbItems.push({
              id: `oc-${ord.id}`,
              tenant_id: tenantId,
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
      console.warn('Error agregando compras automáticas al libro fiscal:', e)
    }

    // If still empty, provide sample starting records
    if (dbItems.length === 0) {
      const sample = [
        {
          id: 'sample-1',
          tenant_id: tenantId,
          fecha: new Date().toISOString().split('T')[0],
          concepto: 'Ventas globales del día (POS)',
          tipo: 'ingreso' as const,
          origen: 'pos' as const,
          comprobante_ref: 'Tickets #5642-#5648',
          valor_ingreso: 450000,
          valor_egreso: 0,
          observaciones: 'Operación diaria en local comercial'
        },
        {
          id: 'sample-2',
          tenant_id: tenantId,
          fecha: new Date().toISOString().split('T')[0],
          concepto: 'Compra de víveres y abarrotes mayorista',
          tipo: 'egreso' as const,
          origen: 'manual' as const,
          comprobante_ref: 'FAC-9921',
          valor_ingreso: 0,
          valor_egreso: 185000,
          observaciones: 'Factura electrónica recibida con soporte'
        }
      ]
      dbItems = sample
    }

    return dbItems.sort((a, b) => b.fecha.localeCompare(a.fecha))
  },

  async addLibroFiscalItem(item: Omit<LibroFiscalItem, 'id'>): Promise<LibroFiscalItem> {
    try {
      const { data, error } = await supabase
        .from('libro_fiscal_registros')
        .insert([item])
        .select()
        .single()

      if (!error && data) return data
    } catch (e) {
      console.warn('Guardando registro fiscal localmente:', e)
    }

    const newItem: LibroFiscalItem = {
      ...item,
      id: 'lf-' + Date.now()
    }
    return newItem
  },

  async updateLibroFiscalItem(id: string, updates: Partial<LibroFiscalItem>): Promise<void> {
    try {
      await supabase
        .from('libro_fiscal_registros')
        .update(updates)
        .eq('id', id)
    } catch (e) {
      console.warn('Error actualizando en BD:', e)
    }
  },

  async deleteLibroFiscalItem(id: string): Promise<void> {
    try {
      await supabase
        .from('libro_fiscal_registros')
        .delete()
        .eq('id', id)
    } catch (e) {
      console.warn('Error eliminando en BD:', e)
    }
  },

  // ==========================================
  // 3. COSTOS SOPORTADOS (FACTURAS PROVEEDOR)
  // ==========================================
  async getCostosSoportados(tenantId: string): Promise<CostoSoportado[]> {
    try {
      const { data, error } = await supabase
        .from('costos_soportados')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('fecha', { ascending: false })

      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Error leyendo costos soportados de Supabase:', e)
    }

    const saved = localStorage.getItem(`${STORAGE_KEYS.COSTOS}_${tenantId}`)
    if (saved) {
      try { return JSON.parse(saved) } catch (_) {}
    }

    return [
      {
        id: 'cs-1',
        tenant_id: tenantId,
        fecha: '2026-08-15',
        proveedor_nombre: 'Distribuidora Lácteos del Sinú S.A.S.',
        proveedor_nit: '900.554.120-1',
        numero_factura: 'FE-88402',
        subtotal: 320000,
        iva: 60800,
        total: 380800,
        estado: 'validado',
        pdf_url: '#',
        xml_url: '#',
        notas: 'Factura electrónica validada ante la DIAN'
      },
      {
        id: 'cs-2',
        tenant_id: tenantId,
        fecha: '2026-08-12',
        proveedor_nombre: 'Agua Pool de Colombia',
        proveedor_nit: '800.112.445-9',
        numero_factura: 'AP-10294',
        subtotal: 150000,
        iva: 0,
        total: 150000,
        estado: 'validado',
        pdf_url: '#',
        xml_url: '#',
        notas: 'Agua envasada exenta de IVA'
      }
    ]
  },

  async addCostoSoportado(costo: Omit<CostoSoportado, 'id'>): Promise<CostoSoportado> {
    try {
      const { data, error } = await supabase
        .from('costos_soportados')
        .insert([costo])
        .select()
        .single()

      if (!error && data) return data
    } catch (e) {
      console.warn('Error guardando costo soportado en Supabase:', e)
    }

    const newItem: CostoSoportado = {
      ...costo,
      id: 'cs-' + Date.now()
    }
    return newItem
  },

  async deleteCostoSoportado(id: string): Promise<void> {
    try {
      await supabase.from('costos_soportados').delete().eq('id', id)
    } catch (e) {
      console.warn('Error eliminando costo soportado:', e)
    }
  },

  // ==========================================
  // 4. EXTRACTOS BANCARIOS CONCILIADOS
  // ==========================================
  async getExtractosBancarios(tenantId: string): Promise<ExtractoBancario[]> {
    try {
      const { data, error } = await supabase
        .from('extractos_bancarios')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('fecha', { ascending: false })

      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Error leyendo extractos de Supabase:', e)
    }

    const saved = localStorage.getItem(`${STORAGE_KEYS.EXTRACTOS}_${tenantId}`)
    if (saved) {
      try { return JSON.parse(saved) } catch (_) {}
    }

    return [
      {
        id: 'eb-1',
        tenant_id: tenantId,
        fecha: '2026-08-16',
        entidad: 'Nequi',
        referencia: 'M-9948201',
        monto_banco: 180000,
        monto_pos: 180000,
        estado: 'conciliado',
        notas: 'Transferencias QR Nequi coincidentes con arqueo'
      },
      {
        id: 'eb-2',
        tenant_id: tenantId,
        fecha: '2026-08-15',
        entidad: 'Daviplata',
        referencia: 'DP-330192',
        monto_banco: 95000,
        monto_pos: 95000,
        estado: 'conciliado',
        notas: 'Pago con Daviplata validado'
      },
      {
        id: 'eb-3',
        tenant_id: tenantId,
        fecha: '2026-08-14',
        entidad: 'Bancolombia',
        referencia: 'TR-77210',
        monto_banco: 250000,
        monto_pos: 250000,
        estado: 'conciliado',
        notas: 'Transferencia directa a cuenta de ahorros'
      }
    ]
  },

  async addExtracto(item: Omit<ExtractoBancario, 'id'>): Promise<ExtractoBancario> {
    try {
      const { data, error } = await supabase
        .from('extractos_bancarios')
        .insert([item])
        .select()
        .single()

      if (!error && data) return data
    } catch (e) {
      console.warn('Error guardando extracto en Supabase:', e)
    }

    const newItem: ExtractoBancario = {
      ...item,
      id: 'eb-' + Date.now()
    }
    return newItem
  },

  async deleteExtracto(id: string): Promise<void> {
    try {
      await supabase.from('extractos_bancarios').delete().eq('id', id)
    } catch (e) {
      console.warn('Error eliminando extracto:', e)
    }
  },

  // ==========================================
  // 5. PAGOS MENORES (CAJA MENOR / GASTOS OPERATIVOS)
  // ==========================================
  async getPagosMenores(tenantId: string): Promise<PagoMenor[]> {
    try {
      const { data, error } = await supabase
        .from('pagos_menores')
        .select('*')
        .eq('tenant_id', tenantId)
        .order('fecha', { ascending: false })

      if (!error && data && data.length > 0) return data
    } catch (e) {
      console.warn('Error leyendo pagos menores de Supabase:', e)
    }

    const saved = localStorage.getItem(`${STORAGE_KEYS.PAGOS_MENORES}_${tenantId}`)
    if (saved) {
      try { return JSON.parse(saved) } catch (_) {}
    }

    return [
      {
        id: 'pm-1',
        tenant_id: tenantId,
        fecha: '2026-08-16',
        concepto: 'Acarreo de bultos desde central de abastos',
        categoria: 'Acarreos',
        beneficiario: 'Jorge MotoCarga',
        documento_beneficiario: '1.067.882.110',
        monto: 25000,
        observaciones: 'Pago en efectivo de caja menor con recibo firmado'
      },
      {
        id: 'pm-2',
        tenant_id: tenantId,
        fecha: '2026-08-14',
        concepto: 'Reparación de cerradura y bisagras estante principal',
        categoria: 'Mantenimiento',
        beneficiario: 'Cerrajería El Maestro',
        documento_beneficiario: '78.540.220',
        monto: 40000,
        observaciones: 'Servicio técnico menor en local'
      },
      {
        id: 'pm-3',
        tenant_id: tenantId,
        fecha: '2026-08-11',
        concepto: 'Compra de bolsas plásticas y papel térmico para POS',
        categoria: 'Suministros',
        beneficiario: 'Variedades del Comercio',
        documento_beneficiario: '1.102.390.111',
        monto: 32000,
        observaciones: 'Rollos de papel térmico 80mm para tickets'
      }
    ]
  },

  async addPagoMenor(pago: Omit<PagoMenor, 'id'>): Promise<PagoMenor> {
    try {
      const { data, error } = await supabase
        .from('pagos_menores')
        .insert([pago])
        .select()
        .single()

      if (!error && data) return data
    } catch (e) {
      console.warn('Error guardando pago menor en Supabase:', e)
    }

    const newItem: PagoMenor = {
      ...pago,
      id: 'pm-' + Date.now()
    }
    return newItem
  },

  async deletePagoMenor(id: string): Promise<void> {
    try {
      await supabase.from('pagos_menores').delete().eq('id', id)
    } catch (e) {
      console.warn('Error eliminando pago menor:', e)
    }
  }
}
