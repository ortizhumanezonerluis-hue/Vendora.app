import { supabase } from '../lib/supabaseClient'

export type PlanType = 'starter' | 'pro' | 'max' | 'sin_licencia'
export type EstadoCliente = 'activo' | 'suspendido' | 'mora' | 'pendiente'
export type TipoPago = 'financiado' | 'vitalicio'

export interface VendoraCliente {
  id: string
  negocio_id?: string | null
  nombre_comercio: string
  nombre_dueno: string
  email_acceso?: string
  telefono?: string
  municipio: string
  plan: PlanType
  licencia_activa: boolean
  tipo_pago: TipoPago
  estado: EstadoCliente
  cuota_mensual: number
  cuotas_pagadas: number
  cuotas_total: number
  saldo_pendiente: number
  fecha_inicio: string
  fecha_corte?: string
  online_ahora?: boolean
  ultima_conexion?: string
  creado_en?: string
  actualizado_en?: string
}

export interface PagoAdmin {
  id: string
  cliente_id: string
  nombre_comercio?: string
  monto: number
  tipo_pago: string
  metodo: string
  notas?: string
  registrado_en: string
}

let localClientesState: VendoraCliente[] = []
let localPagosState: PagoAdmin[] = []

export const adminService = {
  // ==========================================
  // 1. GET ALL CLIENTS (Direct from Supabase DB)
  // ==========================================
  async getClientes(): Promise<VendoraCliente[]> {
    try {
      // 1. Fetch all records from vendora_clientes
      const { data: dbClientes, error } = await supabase
        .from('vendora_clientes')
        .select('*')
        .order('creado_en', { ascending: false })

      let rawList: VendoraCliente[] = dbClientes || []

      // 2. Intelligent Deduplication: if an email was registered twice,
      // keep the record with a valid negocio_id and/or active license
      const seenEmails = new Set<string>()
      const seenNegocios = new Set<string>()
      const deduplicated: VendoraCliente[] = []

      // Pass 1: Add records with valid negocio_id
      for (const c of rawList) {
        const emailKey = c.email_acceso?.toLowerCase().trim()
        const negocioKey = c.negocio_id?.trim()

        if (negocioKey) {
          if (!seenNegocios.has(negocioKey)) {
            seenNegocios.add(negocioKey)
            if (emailKey) seenEmails.add(emailKey)
            deduplicated.push(c)
          }
        }
      }

      // Pass 2: Add any remaining unique entries
      for (const c of rawList) {
        const emailKey = c.email_acceso?.toLowerCase().trim()
        const idKey = c.id
        if (emailKey && !seenEmails.has(emailKey)) {
          seenEmails.add(emailKey)
          deduplicated.push(c)
        } else if (!emailKey && !deduplicated.some(x => x.id === idKey)) {
          deduplicated.push(c)
        }
      }

      // 3. Check real-time online presence (if last connection was < 5 min ago)
      const now = Date.now()
      const allList = deduplicated.map(c => {
        const lastConn = c.ultima_conexion ? new Date(c.ultima_conexion).getTime() : 0
        const isRecentlyActive = (now - lastConn) < 5 * 60 * 1000
        return {
          ...c,
          online_ahora: Boolean(c.online_ahora || isRecentlyActive)
        }
      })

      localClientesState = allList
      return allList
    } catch (e) {
      console.warn('Fallo al obtener vendora_clientes:', e)
    }

    return localClientesState
  },


  // ==========================================
  // 2. UPDATE CLIENT (Plan, Status, Cut Date)
  // ==========================================
  async updateCliente(id: string, updates: Partial<VendoraCliente>): Promise<VendoraCliente> {
    const updatedFields = {
      ...updates,
      actualizado_en: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('vendora_clientes')
        .update(updatedFields)
        .eq('id', id)
        .select()
        .single()

      if (!error && data) {
        localClientesState = localClientesState.map(c => c.id === id ? data : c)
        return data
      }
    } catch (e) {
      console.warn('Error actualizando cliente:', e)
    }

    // Fallback local
    localClientesState = localClientesState.map(c => {
      if (c.id === id) {
        return { ...c, ...updatedFields }
      }
      return c
    })
    const found = localClientesState.find(c => c.id === id)
    if (!found) throw new Error('Cliente no encontrado')
    return found
  },

  // ==========================================
  // 3. TOGGLE LICENSE (Instant active / suspended)
  // ==========================================
  async toggleLicencia(id: string, activa: boolean): Promise<VendoraCliente> {
    return await this.updateCliente(id, {
      licencia_activa: activa,
      estado: activa ? 'activo' : 'suspendido'
    })
  },

  // ==========================================
  // 4. REGISTER RAPID PAYMENT
  // ==========================================
  async registrarPago(
    clienteId: string,
    monto: number,
    metodo: string = 'efectivo',
    notas: string = ''
  ): Promise<{ pago: PagoAdmin; cliente: VendoraCliente }> {
    let cliente = localClientesState.find(c => c.id === clienteId)
    
    if (!cliente) {
      try {
        const { data } = await supabase
          .from('vendora_clientes')
          .select('*')
          .eq('id', clienteId)
          .maybeSingle()
        if (data) cliente = data
      } catch (_) {}
    }

    const nombreComercio = cliente?.nombre_comercio || 'Comercio'

    // Next cut date (+30 days from today)
    const nextCut = new Date()
    nextCut.setDate(nextCut.getDate() + 30)
    const fechaCorteStr = nextCut.toISOString().split('T')[0]

    const newCuotasPagadas = (cliente?.cuotas_pagadas || 0) + 1
    const newSaldo = Math.max(0, (cliente?.saldo_pendiente || 0) - monto)

    // 1. Update client in DB and local state
    const updatedCliente = await this.updateCliente(clienteId, {
      cuotas_pagadas: newCuotasPagadas,
      saldo_pendiente: newSaldo,
      fecha_corte: fechaCorteStr,
      estado: 'activo',
      licencia_activa: true
    })

    // 2. Insert payment log into pagos_admin
    const newPago: PagoAdmin = {
      id: `pago-${Date.now()}`,
      cliente_id: clienteId,
      nombre_comercio: nombreComercio,
      monto,
      tipo_pago: 'cuota_mensual',
      metodo,
      notas: notas || `Cuota mensual (${newCuotasPagadas}/${updatedCliente.cuotas_total || 10})`,
      registrado_en: new Date().toISOString()
    }

    try {
      const { data, error } = await supabase
        .from('pagos_admin')
        .insert([{
          cliente_id: clienteId,
          nombre_comercio: nombreComercio,
          monto,
          tipo_pago: 'cuota_mensual',
          metodo,
          notas: newPago.notas,
          registrado_en: newPago.registrado_en
        }])
        .select()
        .single()

      if (!error && data) {
        localPagosState.unshift(data)
        return { pago: data, cliente: updatedCliente }
      }
    } catch (err) {
      console.warn('Error insertando en pagos_admin:', err)
    }

    localPagosState.unshift(newPago)
    return { pago: newPago, cliente: updatedCliente }
  },

  // ==========================================
  // 5. GET PAYMENT LOGS (Syncs with clients' paid cuotas)
  // ==========================================
  async getPagos(): Promise<PagoAdmin[]> {
    let dbPagos: PagoAdmin[] = []
    try {
      const { data, error } = await supabase
        .from('pagos_admin')
        .select('*')
        .order('registrado_en', { ascending: false })

      if (!error && data) {
        dbPagos = data
      }
    } catch (err) {
      console.warn('Error obteniendo pagos_admin:', err)
    }

    // Combine with cuotas already marked on vendora_clientes so any cuota
    // set in Licencias immediately reflects in Historial de Cobros!
    const clientCuotasPagos: PagoAdmin[] = []
    const clientsList = localClientesState.length > 0 ? localClientesState : (await this.getClientes())

    for (const c of clientsList) {
      const cuotasCount = Number(c.cuotas_pagadas) || 0
      if (cuotasCount > 0) {
        // Count how many pagos are already in dbPagos for this client
        const existingLogsCount = dbPagos.filter(
          p => p.cliente_id === c.id || (p.nombre_comercio && p.nombre_comercio === c.nombre_comercio)
        ).length
        const missingCount = cuotasCount - existingLogsCount

        if (missingCount > 0) {
          for (let i = 1; i <= missingCount; i++) {
            const cuotaNum = existingLogsCount + i
            const paymentDate = c.fecha_inicio 
              ? new Date(new Date(c.fecha_inicio).getTime() + (cuotaNum - 1) * 30 * 24 * 60 * 60 * 1000).toISOString()
              : new Date().toISOString()

            clientCuotasPagos.push({
              id: `cuota-${c.id}-${cuotaNum}`,
              cliente_id: c.id,
              nombre_comercio: c.nombre_comercio,
              monto: Number(c.cuota_mensual) || 190000,
              tipo_pago: 'cuota_mensual',
              metodo: 'efectivo',
              notas: `Cuota ${cuotaNum}/${c.cuotas_total || 10} registrada`,
              registrado_en: paymentDate
            })
          }
        }
      }
    }

    const allPagos = [...dbPagos, ...clientCuotasPagos].sort(
      (a, b) => new Date(b.registrado_en).getTime() - new Date(a.registrado_en).getTime()
    )

    localPagosState = allPagos
    return allPagos
  },

  // ==========================================
  // 6. GET CURRENT BUSINESS LICENSE
  // ==========================================
  async getLicenseForBusiness(email?: string, negocioId?: string): Promise<{
    plan: PlanType
    licenciaActiva: boolean
    cliente: VendoraCliente | null
  }> {
    try {
      if (email) {
        const cleanEmail = email.trim().toLowerCase()
        const { data } = await supabase
          .from('vendora_clientes')
          .select('*')
          .ilike('email_acceso', cleanEmail)
          .maybeSingle()
        if (data) {
          return {
            plan: (data.plan as PlanType) || 'max',
            licenciaActiva: Boolean(data.licencia_activa && data.estado === 'activo'),
            cliente: data
          }
        }
      }

      if (negocioId) {
        const { data } = await supabase
          .from('vendora_clientes')
          .select('*')
          .eq('negocio_id', negocioId)
          .maybeSingle()
        if (data) {
          return {
            plan: (data.plan as PlanType) || 'max',
            licenciaActiva: Boolean(data.licencia_activa && data.estado === 'activo'),
            cliente: data
          }
        }
      }
    } catch (_) {}

    // Fallback: Check local state
    if (email) {
      const cleanEmail = email.trim().toLowerCase()
      const local = localClientesState.find(c => c.email_acceso?.trim().toLowerCase() === cleanEmail)
      if (local) {
        return {
          plan: local.plan || 'max',
          licenciaActiva: Boolean(local.licencia_activa && local.estado === 'activo'),
          cliente: local
        }
      }
    }

    return {
      plan: 'max',
      licenciaActiva: true,
      cliente: null
    }
  },

  // ==========================================
  // 7. REGISTER NEW STORE INTO LICENSES
  // ==========================================
  async registerNewStore(nombreComercio: string, nombreDueno: string, email: string, telefono: string, municipio: string = 'Cereté') {
    const newRecord = {
      nombre_comercio: nombreComercio,
      nombre_dueno: nombreDueno,
      email_acceso: email,
      telefono,
      municipio,
      plan: 'sin_licencia' as PlanType,
      licencia_activa: false,
      tipo_pago: 'financiado' as TipoPago,
      estado: 'pendiente' as EstadoCliente,
      cuota_mensual: 160000,
      cuotas_pagadas: 0,
      cuotas_total: 10,
      saldo_pendiente: 1600000,
      fecha_inicio: new Date().toISOString().split('T')[0],
      fecha_corte: new Date().toISOString().split('T')[0]
    }

    try {
      const { data } = await supabase
        .from('vendora_clientes')
        .insert([newRecord])
        .select()
        .single()
      if (data) {
        localClientesState.unshift(data)
        return data
      }
    } catch (_) {}

    const localItem: VendoraCliente = {
      ...newRecord,
      id: `c-${Date.now()}`
    }
    localClientesState.unshift(localItem)
    return localItem
  }
}
