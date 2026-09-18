import { supabase } from '../lib/supabaseClient'
import { ArqueoCaja } from '../types'
import { auditService } from './auditService'
import { offlineDb } from '../lib/offlineDb'

export const cashService = {
  /**
   * Returns the active open session for a given user.
   * If the active session is from a PREVIOUS day, auto-closes it.
   */
  async getActiveSession(usuarioId: string, negocioId?: string | null): Promise<ArqueoCaja | null> {
    try {
      if (!navigator.onLine) {
        return await offlineDb.getActiveCashSession()
      }

      let query = supabase
        .from('arqueos_caja')
        .select('*')
        .eq('usuario_id', usuarioId)
        .eq('estado', 'abierto')
        .order('fecha_apertura', { ascending: false })

      if (negocioId) query = (query as any).eq('negocio_id', negocioId)

      const { data, error } = await query.maybeSingle()
      if (error) throw error
      if (!data) {
        await offlineDb.saveActiveCashSession(null)
        return null
      }

      // Check if the session is from a previous day
      const sessionDate = new Date(data.fecha_apertura)
      const today = new Date()

      if (sessionDate.toDateString() !== today.toDateString()) {
        await cashService.autoCloseSession(data.id, data, sessionDate, negocioId)
        await offlineDb.saveActiveCashSession(null)
        return null
      }

      await offlineDb.saveActiveCashSession(data)
      return data
    } catch (err) {
      console.warn('[cashService] Using cached cash session due to error:', err)
      return await offlineDb.getActiveCashSession()
    }
  },

  /**
   * Auto-closes a session at 11:59 PM of the day it was opened.
   * Creates an audit WARNING log and a notification for the admin.
   */
  async autoCloseSession(
    id: string,
    session: any,
    sessionDate: Date,
    negocioId?: string | null
  ): Promise<void> {
    const closingTime = new Date(sessionDate)
    closingTime.setHours(23, 59, 0, 0)

    try {
      await supabase
        .from('arqueos_caja')
        .update({
          fecha_cierre: closingTime.toISOString(),
          estado: 'cerrado',
          auto_cerrado: true,
          efectivo_declarado: 0,
          efectivo_sistema: 0,
          diferencia: 0,
          notas: 'Cierre automático — caja no cerrada al final del turno'
        })
        .eq('id', id)
    } catch (_) {}

    const dateLabel = sessionDate.toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long'
    })
    const userName = session.usuario_id || 'Cajero'

    try {
      await auditService.createNotification(
        `⚠️ La caja del ${dateLabel} de "${userName}" fue cerrada automáticamente. Revisa el historial de cajas y registra el conteo físico.`,
        'caja',
        negocioId ?? undefined
      )

      // WARNING: auto-closed (not intentional by the user)
      await auditService.createAuditLog({
        user: 'Sistema',
        action: 'Cierre automático de caja',
        detail: `La caja de "${userName}" abierta el ${dateLabel} fue cerrada automáticamente a las 11:59 PM.`,
        severity: 'warning',
        negocioId: negocioId ?? undefined
      })
    } catch (_) {}
  },

  /**
   * Opens a new register session.
   * Enforces ONE SESSION PER DAY per user — throws if already exists today.
   */
  async openRegister(
    usuarioId: string,
    montoInicial: number,
    negocioId?: string | null
  ): Promise<ArqueoCaja> {
    if (!navigator.onLine) {
      const localSession: ArqueoCaja = {
        id: 'OFFLINE_ARQ_' + Date.now(),
        usuario_id: usuarioId,
        monto_inicial: montoInicial,
        estado: 'abierto',
        fecha_apertura: new Date().toISOString(),
        negocio_id: negocioId || undefined
      }
      await offlineDb.saveActiveCashSession(localSession)
      return localSession
    }

    try {
      // Check if there's already a session (open OR closed) for today
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)

      let checkQuery = supabase
        .from('arqueos_caja')
        .select('id, estado')
        .eq('usuario_id', usuarioId)
        .gte('fecha_apertura', todayStart.toISOString())
        .lte('fecha_apertura', todayEnd.toISOString())

      if (negocioId) checkQuery = (checkQuery as any).eq('negocio_id', negocioId)

      const { data: existing } = await checkQuery
      if (existing && existing.length > 0) {
        throw new Error('Ya existe una caja registrada para hoy. Solo se permite una caja por día.')
      }

      const insertData: any = {
        usuario_id: usuarioId,
        monto_inicial: montoInicial,
        estado: 'abierto',
        fecha_apertura: new Date().toISOString()
      }
      if (negocioId) insertData.negocio_id = negocioId

      const { data, error } = await supabase
        .from('arqueos_caja')
        .insert([insertData])
        .select()
        .single()

      if (error) throw error
      await offlineDb.saveActiveCashSession(data)
      return data
    } catch (err: any) {
      if (err.message && err.message.includes('Ya existe una caja')) {
        throw err
      }
      console.warn('[cashService] Failed to open in Supabase, saving offline session:', err)
      const localSession: ArqueoCaja = {
        id: 'OFFLINE_ARQ_' + Date.now(),
        usuario_id: usuarioId,
        monto_inicial: montoInicial,
        estado: 'abierto',
        fecha_apertura: new Date().toISOString(),
        negocio_id: negocioId || undefined
      }
      await offlineDb.saveActiveCashSession(localSession)
      return localSession
    }
  },

  /**
   * Closes the active register and records an INFO audit log.
   */
  async closeRegister(
    id: string,
    efectivoDeclarado: number,
    efectivoSistema: number,
    userName?: string,
    negocioId?: string | null
  ): Promise<ArqueoCaja> {
    const diferencia = efectivoDeclarado - efectivoSistema
    const isOfflineId = id.startsWith('OFFLINE_')

    if (!navigator.onLine || isOfflineId) {
      const closedSession: ArqueoCaja = {
        id,
        usuario_id: userName || 'Cajero',
        monto_inicial: 0,
        fecha_apertura: new Date().toISOString(),
        fecha_cierre: new Date().toISOString(),
        efectivo_declarado: efectivoDeclarado,
        efectivo_sistema: efectivoSistema,
        diferencia,
        estado: 'cerrado',
        auto_cerrado: false,
        negocio_id: negocioId || undefined
      }
      await offlineDb.saveActiveCashSession(null)
      return closedSession
    }

    try {
      const { data, error } = await supabase
        .from('arqueos_caja')
        .update({
          fecha_cierre: new Date().toISOString(),
          efectivo_declarado: efectivoDeclarado,
          efectivo_sistema: efectivoSistema,
          diferencia,
          estado: 'cerrado',
          auto_cerrado: false
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      await offlineDb.saveActiveCashSession(null)

      try {
        await auditService.createAuditLog({
          user: userName || 'Cajero',
          action: 'Cierre de caja',
          detail: `Caja cerrada manualmente. Efectivo físico: ${efectivoDeclarado.toFixed(0)} COP · Sistema: ${efectivoSistema.toFixed(0)} COP · Diferencia: ${diferencia.toFixed(0)} COP.`,
          severity: 'info',
          negocioId: negocioId ?? undefined
        })
      } catch (_) {}

      return data
    } catch (err) {
      await offlineDb.saveActiveCashSession(null)
      return {
        id,
        usuario_id: userName || 'Cajero',
        monto_inicial: 0,
        fecha_apertura: new Date().toISOString(),
        fecha_cierre: new Date().toISOString(),
        efectivo_declarado: efectivoDeclarado,
        efectivo_sistema: efectivoSistema,
        diferencia,
        estado: 'cerrado',
        auto_cerrado: false,
        negocio_id: negocioId || undefined
      }
    }
  },

  /**
   * Retroactively records physical count for an auto-closed session.
   */
  async retroactiveCount(
    id: string,
    efectivoDeclarado: number,
    efectivoSistema: number
  ): Promise<ArqueoCaja> {
    const diferencia = efectivoDeclarado - efectivoSistema
    const { data, error } = await supabase
      .from('arqueos_caja')
      .update({
        efectivo_declarado: efectivoDeclarado,
        efectivo_sistema: efectivoSistema,
        diferencia,
        auto_cerrado: false,
        notas: 'Conteo físico registrado retroactivamente'
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Returns all sessions ordered newest first.
   * Admin sees all sessions in the negocio; employees see only their own.
   */
  async getAllSessions(usuarioId?: string, negocioId?: string | null): Promise<ArqueoCaja[]> {
    try {
      let query = supabase
        .from('arqueos_caja')
        .select('*')
        .order('fecha_apertura', { ascending: false })

      if (negocioId) query = (query as any).eq('negocio_id', negocioId)
      if (usuarioId) query = query.eq('usuario_id', usuarioId)

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (e) {
      console.warn('Error fetching arqueos from Supabase:', e)
      const active = await offlineDb.getActiveCashSession()
      return active ? [active] : []
    }
  },

  /**
   * Returns sales strictly within a session's timestamps.
   * This prevents yesterday's sales from leaking into today's session.
   */
  async getSalesForSession(session: ArqueoCaja): Promise<any[]> {
    try {
      if (!navigator.onLine) {
        const queued = await offlineDb.getQueuedSales()
        return queued.map(q => ({
          id: q.id,
          total: q.saleData.total,
          metodo_pago: q.saleData.metodo_pago,
          fecha: q.timestamp,
          usuario_id: q.saleData.usuario_id,
          negocio_id: q.saleData.negocio_id,
          detalles_venta: q.items.map(it => ({
            id: 'temp_' + it.product.id,
            producto_id: it.product.id,
            cantidad: it.qty,
            precio_unitario: it.product.precio_venta,
            productos: it.product
          }))
        }))
      }

      const start = session.fecha_apertura
      const end = session.fecha_cierre || new Date().toISOString()

      let query = supabase
        .from('ventas')
        .select(`*, detalles_venta(*, productos(*))`)
        .eq('usuario_id', session.usuario_id)
        .gte('fecha', start)
        .lte('fecha', end)
        
      if (session.negocio_id) {
        query = query.eq('negocio_id', session.negocio_id)
      }

      const { data, error } = await query.order('fecha', { ascending: false })

      if (error) throw error
      return data || []
    } catch (e) {
      const queued = await offlineDb.getQueuedSales()
      return queued.map(q => ({
        id: q.id,
        total: q.saleData.total,
        metodo_pago: q.saleData.metodo_pago,
        fecha: q.timestamp,
        usuario_id: q.saleData.usuario_id,
        negocio_id: q.saleData.negocio_id,
        detalles_venta: q.items.map(it => ({
          id: 'temp_' + it.product.id,
          producto_id: it.product.id,
          cantidad: it.qty,
          precio_unitario: it.product.precio_venta,
          productos: it.product
        }))
      }))
    }
  },

  async getTodaySessionSales(session: ArqueoCaja): Promise<any[]> {
    return cashService.getSalesForSession(session)
  }
}
