import { useState, useEffect } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import { useAuth } from '../../components/auth/AuthContext'
import { accountingService, RutConfig } from '../../services/accountingService'
import { toast } from '../../components/ui/Toaster'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { formatCOP } from '../../lib/utils'
import {
  FileText, CheckCircle2, AlertTriangle, Download, Upload,
  Building, MapPin, Phone, Mail, ShieldCheck, Edit3, Save, X, ExternalLink
} from 'lucide-react'

// Valor UVT Colombia 2026 estimado / 2025 (~$49.799 COP)
const UVT_VALUE_COP = 49799
const MAX_UVT_SIMPLIFICADO = 3500 // Art. 437 E.T.
const LIMITE_INGRESOS_ANUAL_COP = MAX_UVT_SIMPLIFICADO * UVT_VALUE_COP // ~$174.296.500

export default function RutPage() {
  const { profile } = useAuth()
  const [rut, setRut] = useState<RutConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [estimatedAnnualSales, setEstimatedAnnualSales] = useState(48200000) // Default benchmark sales

  // Edit form state
  const [formNit, setFormNit] = useState('')
  const [formDv, setFormDv] = useState('0')
  const [formRazon, setFormRazon] = useState('')
  const [formNombreComercial, setFormNombreComercial] = useState('')
  const [formCiiu, setFormCiiu] = useState('')
  const [formCorreo, setFormCorreo] = useState('')
  const [formTelefono, setFormTelefono] = useState('')
  const [formDireccion, setFormDireccion] = useState('')
  const [formCiudad, setFormCiudad] = useState('')
  const [formDepartamento, setFormDepartamento] = useState('')
  const [formPdfUrl, setFormPdfUrl] = useState('')

  useEffect(() => {
    if (profile?.negocio_id) {
      loadRut()
    }
  }, [profile])

  const loadRut = async () => {
    setLoading(true)
    try {
      const data = await accountingService.getRutConfig(profile!.negocio_id)
      setRut(data)
      setFormNit(data.nit || '')
      setFormDv(data.dv || '0')
      setFormRazon(data.razon_social || '')
      setFormNombreComercial(data.nombre_comercial || '')
      setFormCiiu(data.actividad_ciiu || '')
      setFormCorreo(data.correo_fiscal || '')
      setFormTelefono(data.telefono_fiscal || '')
      setFormDireccion(data.direccion_fiscal || '')
      setFormCiudad(data.ciudad || '')
      setFormDepartamento(data.departamento || '')
      setFormPdfUrl(data.pdf_url || '')
    } catch (err: any) {
      toast(err.message || 'Error cargando RUT', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.negocio_id) return
    setSaving(true)
    try {
      const payload: RutConfig = {
        tenant_id: profile.negocio_id,
        nit: formNit,
        dv: formDv,
        razon_social: formRazon,
        nombre_comercial: formNombreComercial,
        actividad_ciiu: formCiiu,
        responsabilidades: ['52 - No responsable de IVA (Art. 437 E.T.)', '49 - No responsable de INC'],
        correo_fiscal: formCorreo,
        telefono_fiscal: formTelefono,
        direccion_fiscal: formDireccion,
        ciudad: formCiudad,
        departamento: formDepartamento,
        pdf_url: formPdfUrl,
        estado_verificacion: 'vigente'
      }
      const updated = await accountingService.saveRutConfig(payload)
      setRut(updated)
      setEditing(false)
      toast('RUT digital actualizado exitosamente', { type: 'success' })
    } catch (err: any) {
      toast(err.message || 'Error al guardar RUT', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const percentUsed = Math.min(100, (estimatedAnnualSales / LIMITE_INGRESOS_ANUAL_COP) * 100)

  if (loading) {
    return (
      <MainLayout title="RUT Digital & Régimen Simplificado">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="RUT Digital (Responsabilidad 52)">
      <div className="p-6 space-y-6 max-w-[1300px] mx-auto animate-in fade-in duration-300">
        
        {/* Top Header & Verification Status */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-gray-900">{rut?.razon_social || 'Razón Social no configurada'}</h2>
                <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-full text-[10px] font-bold flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  RUT Vigente
                </span>
              </div>
              <p className="text-[12px] text-gray-500 mt-0.5">
                NIT: <span className="font-mono font-semibold text-gray-800">{rut?.nit}-{rut?.dv}</span> · Régimen No Responsable de IVA (Responsabilidad 52)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-3.5 h-9 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Edit3 size={13} />
                Actualizar Datos RUT
              </button>
            ) : (
              <button
                onClick={() => setEditing(false)}
                className="px-3.5 h-9 border border-gray-200 hover:bg-gray-50 text-gray-500 text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <X size={13} />
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* 3500 UVT Threshold Tracker Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white rounded-xl p-6 shadow-md border border-gray-800">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/60 px-2.5 py-1 rounded-md border border-emerald-500/30">
                Monitoreo Fiscal DIAN · Art. 437 E.T.
              </span>
              <h3 className="text-[17px] font-bold text-white mt-2.5">
                Control de Tope Anual de Ingresos (3.500 UVT)
              </h3>
              <p className="text-[12px] text-gray-400 mt-1 max-w-2xl leading-relaxed">
                Para mantener la <strong>Responsabilidad 52 (No responsable de IVA)</strong>, los ingresos brutos del año en curso no deben superar las 3.500 UVT equivalentes a <strong>{formatCOP(LIMITE_INGRESOS_ANUAL_COP)}</strong> en el año fiscal.
              </p>
            </div>
            <div className="text-right">
              <p className="text-[11px] text-gray-400">Ventas Acumuladas Estimadas</p>
              <p className="text-2xl font-bold font-mono text-emerald-400 mt-0.5">{formatCOP(estimatedAnnualSales)}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">de {formatCOP(LIMITE_INGRESOS_ANUAL_COP)} máx.</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-5 space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold text-gray-300">
              <span>{percentUsed.toFixed(1)}% del límite alcanzado</span>
              <span className="text-emerald-400">Zona Segura (Régimen Simplificado)</span>
            </div>
            <div className="w-full h-3 bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-700/60">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>
        </div>

        {/* RUT Details Grid or Edit Form */}
        {!editing ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Tax & Identification Details */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Box 1: Identificación y Clasificación */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                <h4 className="text-[13px] font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Building size={16} className="text-gray-500" />
                  Identificación Tributaria y Actividad Económica
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Número de Identificación Tributaria (NIT)</span>
                    <span className="font-mono font-bold text-gray-900 text-[13px]">{rut?.nit} - {rut?.dv}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Razón Social / Nombre Legal</span>
                    <span className="font-semibold text-gray-900">{rut?.razon_social}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Nombre Comercial</span>
                    <span className="font-medium text-gray-800">{rut?.nombre_comercial || 'No especificado'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Actividad Económica Principal (CIIU)</span>
                    <span className="font-medium text-gray-800">{rut?.actividad_ciiu}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-400 block text-[11px] mb-2">Responsabilidades Fiscales Registradas</span>
                  <div className="flex flex-wrap gap-2">
                    {rut?.responsabilidades.map((resp, idx) => (
                      <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-800 rounded-md text-[11px] font-semibold border border-gray-200/80">
                        {resp}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Box 2: Ubicación y Contacto Fiscal */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                <h4 className="text-[13px] font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <MapPin size={16} className="text-gray-500" />
                  Ubicación y Notificaciones Oficiales
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Dirección Fiscal</span>
                    <span className="font-medium text-gray-900">{rut?.direccion_fiscal || 'CLL 89-98'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Municipio / Departamento</span>
                    <span className="font-medium text-gray-900">{rut?.ciudad}, {rut?.departamento}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Teléfono Registrado</span>
                    <span className="font-medium text-gray-900">{rut?.telefono_fiscal || '3009797523'}</span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-gray-400 block text-[11px]">Correo Electrónico para Notificaciones DIAN</span>
                    <span className="font-medium text-gray-900">{rut?.correo_fiscal || 'contacto@vendora.com'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: PDF Attachment & Legal Checklist */}
            <div className="space-y-6">
              
              {/* PDF Document Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                <h4 className="text-[13px] font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <FileText size={16} className="text-gray-500" />
                  Documento RUT Digital PDF
                </h4>
                
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center space-y-3">
                  <div className="w-12 h-12 bg-white border border-gray-200 rounded-xl flex items-center justify-center mx-auto text-gray-700 shadow-xs">
                    <FileText size={24} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-[12px] font-bold text-gray-900">RUT Oficial DIAN.pdf</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">Certificado oficial generado</p>
                  </div>
                  <div className="flex gap-2 justify-center pt-1">
                    <button
                      onClick={() => toast('Descargando archivo RUT...', { type: 'success' })}
                      className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Download size={12} />
                      Descargar PDF
                    </button>
                  </div>
                </div>

                <div className="text-[11px] text-gray-400 leading-relaxed bg-amber-50/60 p-3 rounded-lg border border-amber-200/50 text-amber-900">
                  <strong>Recordatorio Tributario:</strong> El RUT debe mantenerse actualizado ante cualquier cambio de dirección, actividad económica o teléfono de contacto.
                </div>
              </div>

              {/* Obligations Checklist for Micro-merchants */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
                <h4 className="text-[12px] font-bold text-gray-900 uppercase tracking-wider text-gray-500">
                  Condiciones No Responsable IVA
                </h4>
                
                <ul className="text-[12px] space-y-2.5 text-gray-600">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Ingresos brutos anuales inferiores a 3.500 UVT.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Máximo 1 establecimiento de comercio o sede.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>No desarrollar actividades bajo franquicia o regalías.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Llevar el Libro Fiscal de Registro de Operaciones Diarias.</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        ) : (
          /* Edit Form */
          <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-6 animate-in fade-in duration-150">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-[15px] font-bold text-gray-900">Editar Información del RUT</h3>
                <p className="text-[11px] text-gray-400">Actualiza los datos oficiales registrados ante la DIAN</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">NIT</label>
                <input
                  type="text"
                  required
                  value={formNit}
                  onChange={e => setFormNit(e.target.value)}
                  placeholder="Ej: 900.123.456"
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Dígito de Verificación (DV)</label>
                <input
                  type="text"
                  required
                  value={formDv}
                  onChange={e => setFormDv(e.target.value)}
                  placeholder="Ej: 7"
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Razón Social / Nombre Titular</label>
                <input
                  type="text"
                  required
                  value={formRazon}
                  onChange={e => setFormRazon(e.target.value)}
                  placeholder="Ej: Tienda La Bendición"
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={formNombreComercial}
                  onChange={e => setFormNombreComercial(e.target.value)}
                  placeholder="Ej: Vendora Store"
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold text-gray-700 block mb-1">Actividad Económica Principal (CIIU)</label>
                <input
                  type="text"
                  required
                  value={formCiiu}
                  onChange={e => setFormCiiu(e.target.value)}
                  placeholder="Ej: 4711 - Comercio al por menor en establecimientos no especializados"
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Correo Electrónico Fiscal</label>
                <input
                  type="email"
                  value={formCorreo}
                  onChange={e => setFormCorreo(e.target.value)}
                  placeholder="contacto@empresa.com"
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Teléfono Fiscal</label>
                <input
                  type="text"
                  value={formTelefono}
                  onChange={e => setFormTelefono(e.target.value)}
                  placeholder="Ej: 3001234567"
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Dirección Fiscal</label>
                <input
                  type="text"
                  value={formDireccion}
                  onChange={e => setFormDireccion(e.target.value)}
                  placeholder="Ej: CLL 89-98"
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Municipio / Ciudad</label>
                <input
                  type="text"
                  value={formCiudad}
                  onChange={e => setFormCiudad(e.target.value)}
                  placeholder="Ej: Cereté"
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Departamento</label>
                <input
                  type="text"
                  value={formDepartamento}
                  onChange={e => setFormDepartamento(e.target.value)}
                  placeholder="Ej: Córdoba"
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Enlace / URL de Documento PDF</label>
                <input
                  type="text"
                  value={formPdfUrl}
                  onChange={e => setFormPdfUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-9 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 h-9 border border-gray-200 hover:bg-gray-50 text-gray-600 text-[12px] font-semibold rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 h-9 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Save size={13} />
                {saving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}

      </div>
    </MainLayout>
  )
}
