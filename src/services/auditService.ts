import { supabase } from '../lib/supabaseClient'
import { AuditLog } from '../types'

type AuditLogInput = Omit<AuditLog, 'id' | 'date'> & { negocioId?: string }

export const auditService = {
  async getAuditLogs(negocioId?: string | null): Promise<AuditLog[]> {
    let query = supabase.from('audit_logs').select('*').order('date', { ascending: false })
    if (negocioId) query = query.eq('negocio_id', negocioId)
    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  async createAuditLog(log: AuditLogInput): Promise<void> {
    try {
      const { negocioId, ...rest } = log
      const payload = negocioId ? { ...rest, negocio_id: negocioId } : rest
      await supabase.from('audit_logs').insert([payload])
    } catch (err) {
      console.warn('No se pudo crear audit log:', err)
    }
  },

  async createNotification(
    mensaje: string,
    tipo: 'stock' | 'caja' | 'auditoria',
    negocioId?: string
  ): Promise<void> {
    try {
      const payload = negocioId
        ? { mensaje, tipo, negocio_id: negocioId }
        : { mensaje, tipo }
      await supabase.from('notificaciones').insert([payload])
    } catch (err) {
      console.warn('No se pudo crear notificación:', err)
    }
  }
}
