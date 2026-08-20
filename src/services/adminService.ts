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
  // 1. GET ALL CLIENTS (Syncs all real stores from DB)
  // ==========================================
  async getClientes(): Promise<VendoraCliente[]> {
    try {
      // 1. Fetch from vendora_clientes
      const { data: dbClientes, error } = await supabase
        .from('vendora_clientes')
        .select('*')
        .order('creado_en', { ascending: false })

      let allList: VendoraCliente[] = dbClientes || []

      // 2. Fetch existing registered stores from configuracion_negocio / usuarios
      // to ensure stores created before the update are ALWAYS shown!
      try {
        const { data: configs } = await supabase
          .from('configuracion_negocio')
          .select('*')

        const { data: users } = await supabase
          .from('usuarios')
          .select('*')
          .eq('rol', 'admin')

        if (configs && configs.length > 0) {
          for (const conf of configs) {
            const exists = allList.some(
              c => (conf.negocio_id && c.negocio_id === conf.negocio_id) || c.nombre_comercio === conf.nombre
            )

            if (!exists) {
              const matchedUser = users?.find(u => u.negocio_id === conf.negocio_id)
              const autoClient: Partial<VendoraCliente> = {
                negocio_id: conf.negocio_id,
                nombre_comercio: conf.nombre || 'Comercio Registrado',
                nombre_dueno: matchedUser?.nombre || 'Propietario',
                email_acceso: matchedUser?.email || '',
                telefono: conf.telefono || '',
                municipio: 'Cereté',
                plan: 'pro',
                licencia_activa: true,
                tipo_pago: 'financiado',
                estado: 'activo',
                cuota_mensual: 160000,
                cuotas_pagadas: 1,
                cuotas_total: 10,
                saldo_pendiente: 1440000,
                fecha_inicio: conf.creado_en ? conf.creado_en.split('T')[0] : new Date().toISOString().split('T')[0],
                fecha_corte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                online_ahora: false,
                ultima_conexion: matchedUser?.ultimo_acceso || new Date().toISOString()
              }

              // Save to vendora_clientes table so it's persisted in DB
              try {
                const { data: saved } = await supabase
                  .from('vendora_clientes')
                  .insert([autoClient])
                  .select()
                  .single()

                if (saved) {
                  allList.push(saved)
                }
              } catch (_) {
                allList.push({ ...autoClient, id: `auto-${conf.id}` } as VendoraCliente)
              }
            }
          }
        }
      } catch (syncErr) {
        console.warn('Error sincronizando comercios existentes:', syncErr)
      }

      // Check real-time online presence (if last connection was < 5 min ago)
      const now = Date.now()
      allList = allList.map(c => {
        const lastConn = c.ultima_conexion ? new Date(c.ultima_conexion).getTime() : 0
        const isRecentlyActive = (now - lastConn) < 5 * 60 * 1000
        return {
          ...c,
          online_ahora: Boolean(c.online_ahora || isRecentlyActive)
        }
      })

      if (allList.length > 0) {
        localClientesState = allList
        return allList
      }
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
    const cliente = localClientesState.find(c => c.id === clienteId)
    const nombreComercio = cliente?.nombre_comercio || 'Comercio'

    // Next cut date (+30 days)
    const nextCut = new Date()
    nextCut.setDate(nextCut.getDate() + 30)
    const fechaCorteStr = nextCut.toISOString().split('T')[0]

    const newCuotasPagadas = (cliente?.cuotas_pagadas || 0) + 1
    const newSaldo = Math.max(0, (cliente?.saldo_pendiente || 0) - monto)

    // 1. Update client
    const updatedCliente = await this.updateCliente(clienteId, {
      cuotas_pagadas: newCuotasPagadas,
      saldo_pendiente: newSaldo,
      fecha_corte: fechaCorteStr,
      estado: 'activo',
      licencia_activa: true
    })

    // 2. Insert payment log
    const newPago: PagoAdmin = {
      id: `pago-${Date.now()}`,
      cliente_id: clienteId,
      nombre_comercio: nombreComercio,
      monto,
      tipo_pago: 'cuota_mensual',
      metodo,
      notas: notas || 'Cobro registrado por administrador',
      registrado_en: new Date().toISOString()
    }

    try {
      const { data } = await supabase
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

      if (data) {
        localPagosState.unshift(data)
        return { pago: data, cliente: updatedCliente }
      }
    } catch (_) {}

    localPagosState.unshift(newPago)
    return { pago: newPago, cliente: updatedCliente }
  },

  // ==========================================
  // 5. GET PAYMENT LOGS
  // ==========================================
  async getPagos(): Promise<PagoAdmin[]> {
    try {
      const { data, error } = await supabase
        .from('pagos_admin')
        .select('*')
        .order('registrado_en', { ascending: false })

      if (!error && data && data.length > 0) {
        localPagosState = data
        return data
      }
    } catch (_) {}
    return localPagosState
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
        const { data } = await supabase
          .from('vendora_clientes')
          .select('*')
          .eq('email_acceso', email)
          .maybeSingle()
        if (data) {
          return {
            plan: (data.plan as PlanType) || 'sin_licencia',
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
            plan: (data.plan as PlanType) || 'sin_licencia',
            licenciaActiva: Boolean(data.licencia_activa && data.estado === 'activo'),
            cliente: data
          }
        }
      }
    } catch (_) {}

    // Fallback: Check local state
    if (email) {
      const local = localClientesState.find(c => c.email_acceso === email)
      if (local) {
        return {
          plan: local.plan,
          licenciaActiva: Boolean(local.licencia_activa && local.estado === 'activo'),
          cliente: local
        }
      }
    }

    return {
      plan: 'pro',
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
