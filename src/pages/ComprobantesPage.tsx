import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../components/auth/AuthContext'
import { formatCOP } from '../lib/utils'
import { toast } from '../components/ui/Toaster'
import { SkeletonPage } from '../components/ui/Skeleton'
import DianConfigModal from '../components/dian/DianConfigModal'
import {
  FileCode, CheckCircle2, Clock, XCircle, RotateCcw,
  ExternalLink, FileSpreadsheet, AlertCircle, Settings
} from 'lucide-react'

interface Comprobante {
  id: string
  consecutivo: number
  fecha_hora: string
  cliente_nombre: string
  cliente_documento: string
  cliente_tipo_doc: string
  total: number
  estado_fiscal: 'Exitoso' | 'Pendiente' | 'Rechazado'
  xml_url: string | null
  pdf_url: string | null
  mensaje_error: string | null
}

export default function ComprobantesPage() {
  const { profile } = useAuth()
  const [comprobantes, setComprobantes] = useState<Comprobante[]>([])
  const [loading, setLoading] = useState(true)
  const [hasDianConfig, setHasDianConfig] = useState<boolean | null>(null)
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  useEffect(() => {
    if (profile?.negocio_id) {
      checkDianConfig()
      loadComprobantes()
    }
  }, [profile])

  const checkDianConfig = async () => {
    try {
      const { data } = await supabase
        .from('configuracion_dian')
        .select('id')
        .eq('tenant_id', profile?.negocio_id)
        .limit(1)
        .maybeSingle()

      const hasConfig = !!data
      setHasDianConfig(hasConfig)
      if (!hasConfig) {
        setIsConfigOpen(true) // Activar modal de primer ingreso
      }
    } catch (err) {
      console.warn('Error verificando config fiscal:', err)
    }
  }

  const loadComprobantes = async () => {
    if (!profile?.negocio_id) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('comprobantes_venta')
        .select('*')
        .eq('tenant_id', profile.negocio_id)
        .order('fecha_hora', { ascending: false })

      if (error) throw error
      setComprobantes(data || [])
    } catch (err: any) {
      toast(err.message || 'Error cargando comprobantes', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (comp: Comprobante) => {
    setRetryingId(comp.id)
    try {
      // Disparar procesamiento asíncrono en Render a través de la Edge Function
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const res = await fetch('https://qarurnzptlpoxizkthgo.supabase.co/functions/v1/dian-billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-negocio-id': profile?.negocio_id || ''
        },
        body: JSON.stringify({
          clienteNombre: comp.cliente_nombre,
          clienteDocumento: comp.cliente_documento,
          clienteTipoDoc: comp.cliente_tipo_doc,
          total: comp.total,
          items: [] // Si es reintento, procesará con los datos ya guardados
        })
      })

      if (res.status === 202) {
        toast('Reintento enviado a la DIAN', { type: 'success' })
        setTimeout(() => loadComprobantes(), 1500)
      } else {
        const body = await res.json()
        throw new Error(body.error || 'Fallo de conexión')
      }
    } catch (err: any) {
      toast('Error reintentando envío', { type: 'error', description: err.message })
    } finally {
      setRetryingId(null)
    }
  }

  if (loading) {
    return (
      <MainLayout title="Comprobantes de Venta">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Comprobantes de Venta (DIAN)">
      <div className="p-5 space-y-4">
        
        {/* Banner informativo de DIAN */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex gap-4 items-start">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0 mt-0.5">
              <FileCode className="text-gray-900" size={20} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900">Estado de Facturación Electrónica</p>
              <p className="text-[11px] text-gray-400 mt-1 max-w-lg leading-relaxed">
                Revisa los comprobantes enviados a la DIAN. Si te falta configurar el ID de software o PIN, puedes abrirlos desde el botón de configuración de la derecha.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsConfigOpen(true)}
            className="px-3.5 h-8 border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Settings size={13} />
            Configuración DIAN
          </button>
        </div>

        {/* Tabla de comprobantes */}
        {comprobantes.length === 0 ? (
          <div className="h-64 border border-gray-100 rounded-xl bg-white flex flex-col items-center justify-center text-center p-6 shadow-sm">
            <FileSpreadsheet size={24} className="text-gray-300 mb-2" />
            <p className="text-[13px] font-semibold text-gray-700">Sin comprobantes generados</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Las ventas del POS con credenciales activas aparecerán en este historial</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[550px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Consecutivo</th>
                    <th className="px-5 py-3">Fecha y Hora</th>
                    <th className="px-5 py-3">Adquiriente</th>
                    <th className="px-5 py-3">Identificación</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3">Estado Fiscal</th>
                    <th className="px-5 py-3 text-right">Documentos</th>
                    <th className="px-5 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[12px] text-gray-700">
                  {comprobantes.map((c) => {
                    const dateStr = new Date(c.fecha_hora).toLocaleString('es-CO', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    })
                    return (
                      <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-gray-900">#FAC-{c.consecutivo}</td>
                        <td className="px-5 py-3.5">{dateStr}</td>
                        <td className="px-5 py-3.5 font-semibold text-gray-950">{c.cliente_nombre}</td>
                        <td className="px-5 py-3.5 font-mono text-[11px] text-gray-400">{c.cliente_documento}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-semibold">{formatCOP(c.total)}</td>
                        <td className="px-5 py-3.5">
                          <span className={[
                            'px-2 py-0.5 rounded-full text-[10px] font-bold capitalize flex items-center gap-1 w-fit',
                            c.estado_fiscal === 'Exitoso' ? 'bg-emerald-50 text-emerald-700' :
                            c.estado_fiscal === 'Rechazado' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
                          ].join(' ')}>
                            {c.estado_fiscal === 'Exitoso' ? <CheckCircle2 size={11} /> :
                             c.estado_fiscal === 'Rechazado' ? <XCircle size={11} /> : <Clock size={11} />}
                            {c.estado_fiscal}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right space-x-1 shrink-0">
                          {c.pdf_url && (
                            <a
                              href={c.pdf_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 text-[11px] font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg inline-flex items-center gap-1 transition-colors"
                            >
                              PDF
                              <ExternalLink size={10} />
                            </a>
                          )}
                          {c.xml_url && (
                            <a
                              href={c.xml_url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2 py-1 text-[11px] font-semibold text-gray-700 border border-gray-200 hover:bg-gray-50 rounded-lg inline-flex items-center gap-1 transition-colors"
                            >
                              XML
                              <ExternalLink size={10} />
                            </a>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {c.estado_fiscal === 'Rechazado' && (
                            <button
                              disabled={retryingId === c.id}
                              onClick={() => handleRetry(c)}
                              className="h-7 w-7 flex items-center justify-center border border-gray-200 hover:bg-gray-50 text-gray-600 rounded-lg transition-colors"
                              title="Reintentar envío"
                            >
                              <RotateCcw size={12} className={retryingId === c.id ? 'animate-spin' : ''} />
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <DianConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        onSaveSuccess={() => {
          setHasDianConfig(true)
          loadComprobantes()
        }}
      />
    </MainLayout>
  )
}
