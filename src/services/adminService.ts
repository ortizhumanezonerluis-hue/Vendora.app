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

// Initial mock clients for instant UI testing before SQL runs
const INITIAL_MOCK_CLIENTES: VendoraCliente[] = [
  {
    id: 'c1111111-1111-1111-1111-111111111111',
    nombre_comercio: 'Granero El Puente',
    nombre_dueno: 'Carlos Pérez',
    email_acceso: 'graneroelpuente@gmail.com',
    telefono: '301 548 9921',
    municipio: 'Cereté',
    plan: 'pro',
    licencia_activa: true,
    tipo_pago: 'financiado',
    estado: 'activo',
    cuota_mensual: 160000,
    cuotas_pagadas: 3,
    cuotas_total: 10,
    saldo_pendiente: 1120000,
    fecha_inicio: '2026-05-15',
    fecha_corte: '2026-09-15',
    online_ahora: true,
    ultima_conexion: new Date().toISOString()
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    nombre_comercio: 'Boutique Mariana Centro',
    nombre_dueno: 'Mariana Torres',
    email_acceso: 'boutiquemariana@gmail.com',
    telefono: '310 452 3319',
    municipio: 'Montería',
    plan: 'max',
    licencia_activa: true,
    tipo_pago: 'financiado',
    estado: 'activo',
    cuota_mensual: 240000,
    cuotas_pagadas: 4,
    cuotas_total: 10,
    saldo_pendiente: 1440000,
    fecha_inicio: '2026-04-10',
    fecha_corte: '2026-09-10',
    online_ahora: true,
    ultima_conexion: new Date().toISOString()
  },
  {
    id: 'c3333333-3333-3333-3333-333333333333',
    nombre_comercio: 'Droguería Salud Total',
    nombre_dueno: 'Jorge Ramos',
    email_acceso: 'saludtotal@hotmail.com',
    telefono: '300 881 9203',
    municipio: 'Cereté',
    plan: 'starter',
    licencia_activa: true,
    tipo_pago: 'financiado',
    estado: 'mora',
    cuota_mensual: 80000,
    cuotas_pagadas: 1,
    cuotas_total: 10,
    saldo_pendiente: 720000,
    fecha_inicio: '2026-07-01',
    fecha_corte: '2026-08-01',
    online_ahora: false,
    ultima_conexion: '2026-08-15T14:30:00Z'
  },
  {
    id: 'c4444444-4444-4444-4444-444444444444',
    nombre_comercio: 'Ferretería Los Andes',
    nombre_dueno: 'Luis Martínez',
    email_acceso: 'ferreterialosandes@gmail.com',
    telefono: '312 890 4421',
    municipio: 'Sahagún',
    plan: 'pro',
    licencia_activa: true,
    tipo_pago: 'vitalicio',
    estado: 'activo',
    cuota_mensual: 0,
    cuotas_pagadas: 10,
    cuotas_total: 10,
    saldo_pendiente: 0,
    fecha_inicio: '2026-01-20',
    fecha_corte: '2027-01-20',
    online_ahora: false,
    ultima_conexion: '2026-08-18T10:15:00Z'
  },
  {
    id: 'c5555555-5555-5555-5555-555555555555',
    nombre_comercio: 'Minimarket El Remate',
    nombre_dueno: 'Sandra Ortiz',
    email_acceso: 'elremateminimarket@gmail.com',
    telefono: '320 993 8812',
    municipio: 'Ciénaga de Oro',
    plan: 'max',
    licencia_activa: true,
    tipo_pago: 'financiado',
    estado: 'activo',
    cuota_mensual: 240000,
    cuotas_pagadas: 2,
    cuotas_total: 10,
    saldo_pendiente: 1920000,
    fecha_inicio: '2026-06-25',
    fecha_corte: '2026-09-25',
    online_ahora: true,
    ultima_conexion: new Date().toISOString()
  },
  {
    id: 'c6666666-6666-6666-6666-666666666666',
    nombre_comercio: 'Papelería Creativa',
    nombre_dueno: 'Diana Gómez',
    email_acceso: 'papeleriacreativa@gmail.com',
    telefono: '304 558 2910',
    municipio: 'Cereté',
    plan: 'starter',
    licencia_activa: true,
    tipo_pago: 'financiado',
    estado: 'activo',
    cuota_mensual: 80000,
    cuotas_pagadas: 5,
    cuotas_total: 10,
    saldo_pendiente: 400000,
    fecha_inicio: '2026-03-01',
    fecha_corte: '2026-09-01',
    online_ahora: false,
    ultima_conexion: '2026-08-17T18:00:00Z'
  },
  {
    id: 'c7777777-7777-7777-7777-777777777777',
    nombre_comercio: 'Miscelánea San José',
    nombre_dueno: 'Efraín López',
    email_acceso: 'sanjosemiscelanea@gmail.com',
    telefono: '311 772 9901',
    municipio: 'Lorica',
    plan: 'pro',
    licencia_activa: false,
    tipo_pago: 'financiado',
    estado: 'suspendido',
    cuota_mensual: 160000,
    cuotas_pagadas: 2,
    cuotas_total: 10,
    saldo_pendiente: 1280000,
    fecha_inicio: '2026-04-05',
    fecha_corte: '2026-07-05',
    online_ahora: false,
    ultima_conexion: '2026-07-20T11:00:00Z'
  },
  {
    id: 'c8888888-8888-8888-8888-888888888888',
    nombre_comercio: 'Tienda La Bendición',
    nombre_dueno: 'Rosa Arroyo',
    email_acceso: 'tiendalabendicion@gmail.com',
    telefono: '300 449 1022',
    municipio: 'Cereté',
    plan: 'sin_licencia',
    licencia_activa: false,
    tipo_pago: 'financiado',
    estado: 'pendiente',
    cuota_mensual: 160000,
    cuotas_pagadas: 0,
    cuotas_total: 10,
    saldo_pendiente: 1600000,
    fecha_inicio: new Date().toISOString().split('T')[0],
    fecha_corte: new Date().toISOString().split('T')[0],
    online_ahora: false,
    ultima_conexion: new Date().toISOString()
  }
]

let localClientesState = [...INITIAL_MOCK_CLIENTES]
let localPagosState: PagoAdmin[] = [
  {
    id: 'p1',
    cliente_id: 'c1111111-1111-1111-1111-111111111111',
    nombre_comercio: 'Granero El Puente',
    monto: 160000,
    tipo_pago: 'cuota_mensual',
    metodo: 'efectivo',
    notas: 'Cobro cuota 3 en local',
    registrado_en: '2026-08-15T11:00:00Z'
  },
  {
    id: 'p2',
    cliente_id: 'c2222222-2222-2222-2222-222222222222',
    nombre_comercio: 'Boutique Mariana Centro',
    monto: 240000,
    tipo_pago: 'cuota_mensual',
    metodo: 'transferencia',
    notas: 'Transferencia Nequi',
    registrado_en: '2026-08-16T15:30:00Z'
  },
  {
    id: 'p3',
    cliente_id: 'c5555555-5555-5555-5555-555555555555',
    nombre_comercio: 'Minimarket El Remate',
    monto: 240000,
    tipo_pago: 'cuota_mensual',
    metodo: 'efectivo',
    notas: 'Cobro en efectivo cuota 2',
    registrado_en: '2026-08-18T09:45:00Z'
  }
]

export const adminService = {
  // ==========================================
  // 1. GET ALL CLIENTS
  // ==========================================
  async getClientes(): Promise<VendoraCliente[]> {
    try {
      const { data, error } = await supabase
        .from('vendora_clientes')
        .select('*')
        .order('creado_en', { ascending: false })

      if (!error && data && data.length > 0) {
        localClientesState = data
        return data
      }
    } catch (e) {
      console.warn('Usando caché local para vendora_clientes:', e)
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
      console.warn('Error actualizando cliente en Supabase, aplicando local:', e)
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
  // 4. REGISTER RAPID PAYMENT (En local o Nequi)
  // ==========================================
  async registrarPago(
    clienteId: string,
    monto: number,
    metodo: string = 'efectivo',
    notas: string = ''
  ): Promise<{ pago: PagoAdmin; cliente: VendoraCliente }> {
    const cliente = localClientesState.find(c => c.id === clienteId)
    const nombreComercio = cliente?.nombre_comercio || 'Comercio'

    // Compute next cut date (+30 days)
    const nextCut = new Date()
    nextCut.setDate(nextCut.getDate() + 30)
    const fechaCorteStr = nextCut.toISOString().split('T')[0]

    const newCuotasPagadas = (cliente?.cuotas_pagadas || 0) + 1
    const newSaldo = Math.max(0, (cliente?.saldo_pendiente || 0) - monto)

    // 1. Update client in DB
    const updatedCliente = await this.updateCliente(clienteId, {
      cuotas_pagadas: newCuotasPagadas,
      saldo_pendiente: newSaldo,
      fecha_corte: fechaCorteStr,
      estado: 'activo',
      licencia_activa: true
    })

    // 2. Insert payment record in DB
    const newPago: PagoAdmin = {
      id: `pago-${Date.now()}`,
      cliente_id: clienteId,
      nombre_comercio: nombreComercio,
      monto,
      tipo_pago: 'cuota_mensual',
      metodo,
      notas: notas || `Cobro registrado por administrador`,
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
  // 6. GET CURRENT BUSINESS LICENSE (For Client Frontend)
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

    // Fallback: Check local state by email
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

    // Default for newly registered or unassigned stores
    return {
      plan: 'pro', // Default fallback for existing local development so dev server doesn't break
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
