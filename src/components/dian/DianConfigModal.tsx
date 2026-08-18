import { useState, useEffect } from 'react'
import { X, Loader2, Save } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../auth/AuthContext'
import { toast } from '../ui/Toaster'

interface DianConfigModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveSuccess?: () => void
}

export default function DianConfigModal({ isOpen, onClose, onSaveSuccess }: DianConfigModalProps) {
  const { profile } = useAuth()
  const [idSoftware, setIdSoftware] = useState('')
  const [pinSoftware, setPinSoftware] = useState('')
  const [urlDian, setUrlDian] = useState('https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc') // Default habilitación
  const [ambiente, setAmbiente] = useState<'HABILITACION' | 'PRODUCCION'>('HABILITACION')
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [existingConfigId, setExistingConfigId] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && profile?.negocio_id) {
      loadExistingConfig()
    }
  }, [isOpen, profile])

  const loadExistingConfig = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('configuracion_dian')
        .select('*')
        .eq('tenant_id', profile?.negocio_id)
        .limit(1)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setExistingConfigId(data.id)
        setIdSoftware(data.id_software || '')
        setPinSoftware(data.pin_software || '')
        setUrlDian(data.url_dian || '')
        setAmbiente(data.ambiente || 'HABILITACION')
      }
    } catch (err: any) {
      console.warn('Error cargando configuración Dian:', err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.negocio_id) return
    
    setSaving(true)
    try {
      const payload = {
        tenant_id: profile.negocio_id,
        id_software: idSoftware,
        pin_software: pinSoftware,
        url_dian: urlDian,
        ambiente: ambiente,
        actualizado_en: new Date().toISOString()
      }

      let error
      if (existingConfigId) {
        const res = await supabase
          .from('configuracion_dian')
          .update(payload)
          .eq('id', existingConfigId)
        error = res.error
      } else {
        const res = await supabase
          .from('configuracion_dian')
          .insert([payload])
        error = res.error
      }

      if (error) throw error

      toast('Credenciales de la DIAN guardadas correctamente', { type: 'success' })
      if (onSaveSuccess) onSaveSuccess()
      onClose()
    } catch (err: any) {
      toast('Error al guardar configuración fiscal', { type: 'error', description: err.message })
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-[13px] font-bold text-gray-900">Configuración Obligatoria DIAN</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Habilita facturación electrónica para este comercio</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400"
          >
            <X size={15} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 flex items-center justify-center gap-2 text-gray-400 text-xs">
            <Loader2 size={14} className="animate-spin" />
            Cargando configuración...
          </div>
        ) : (
          <form onSubmit={handleSave}>
            <div className="p-5 space-y-4">
              
              {/* Ambiente */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                  Ambiente de Facturación
                </label>
                <div className="flex gap-2">
                  {(['HABILITACION', 'PRODUCCION'] as const).map(amb => (
                    <button
                      key={amb}
                      type="button"
                      onClick={() => {
                        setAmbiente(amb)
                        setUrlDian(
                          amb === 'HABILITACION'
                            ? 'https://vpfe-hab.dian.gov.co/WcfDianCustomerServices.svc'
                            : 'https://vpfe.dian.gov.co/WcfDianCustomerServices.svc'
                        )
                      }}
                      className={[
                        'flex-1 h-9 rounded-lg text-xs font-semibold border transition-all',
                        ambiente === amb
                          ? 'bg-gray-900 border-gray-900 text-white shadow-sm'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      ].join(' ')}
                    >
                      {amb}
                    </button>
                  ))}
                </div>
              </div>

              {/* ID Software */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                  ID del Software (DIAN)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: f4a8a5b2-32b0-496a-..."
                  value={idSoftware}
                  onChange={(e) => setIdSoftware(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                />
              </div>

              {/* PIN Software */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                  PIN del Software
                </label>
                <input
                  type="password"
                  required
                  placeholder="Código numérico de activación"
                  value={pinSoftware}
                  onChange={(e) => setPinSoftware(e.target.value)}
                  className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                />
              </div>

              {/* URL DIAN */}
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                  URL del Web Service DIAN
                </label>
                <input
                  type="url"
                  required
                  value={urlDian}
                  onChange={(e) => setUrlDian(e.target.value)}
                  className="w-full h-9 px-3 text-[12px] font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-gray-50 text-gray-600"
                />
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5 pt-2 border-t border-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-9 border border-gray-200 text-xs text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 h-9 bg-gray-900 text-white text-xs font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-1.5"
              >
                {saving ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    Guardar Credenciales
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
