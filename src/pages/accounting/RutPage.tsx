import { useState, useEffect } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import { useAuth } from '../../components/auth/AuthContext'
import { accountingService, RutConfig } from '../../services/accountingService'
import { toast } from '../../components/ui/Toaster'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { formatCOP } from '../../lib/utils'
import {
  FileText, CheckCircle2, Download, Building, MapPin,
  ShieldCheck, Edit3, Save, X, Info
} from 'lucide-react'

// Valor UVT Colombia 2026 (~$49.799 COP) · 3.500 UVT = ~$174.296.500 COP
const UVT_VALUE_COP = 49799
const MAX_UVT_SIMPLIFICADO = 3500
const LIMITE_INGRESOS_ANUAL_COP = MAX_UVT_SIMPLIFICADO * UVT_VALUE_COP

export default function RutPage() {
  const { profile } = useAuth()
  const [rut, setRut] = useState<RutConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [annualSales, setAnnualSales] = useState(0)

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
      const [rutData, salesTotal] = await Promise.all([
        accountingService.getRutConfig(profile!.negocio_id),
        accountingService.getAnnualGrossSales(profile!.negocio_id)
      ])

      setRut(rutData)
      setAnnualSales(salesTotal)

      setFormNit(rutData.nit || '')
      setFormDv(rutData.dv || '0')
      setFormRazon(rutData.razon_social || '')
      setFormNombreComercial(rutData.nombre_comercial || '')
      setFormCiiu(rutData.actividad_ciiu || '')
      setFormCorreo(rutData.correo_fiscal || '')
      setFormTelefono(rutData.telefono_fiscal || '')
      setFormDireccion(rutData.direccion_fiscal || '')
      setFormCiudad(rutData.ciudad || '')
      setFormDepartamento(rutData.departamento || '')
      setFormPdfUrl(rutData.pdf_url || '')
    } catch (err: any) {
      toast(err.message || 'Error cargando datos del RUT', { type: 'error' })
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
        negocio_id: profile.negocio_id,
        nit: formNit,
        dv: formDv,
        razon_social: formRazon,
        nombre_comercial: formNombreComercial,
        actividad_ciiu: formCiiu,
        responsabilidades: ['52 - No responsable de IVA (Art. 437 E.T.)'],
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
      toast('RUT digital actualizado exitosamente en la base de datos', { type: 'success' })
    } catch (err: any) {
      toast(err.message || 'Error al guardar RUT', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const percentUsed = Math.min(100, (annualSales / LIMITE_INGRESOS_ANUAL_COP) * 100)

  if (loading) {
    return (
      <MainLayout title="RUT Digital">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="RUT Digital (Responsabilidad 52)">
      <div className="p-6 space-y-5 max-w-[1300px] mx-auto animate-in fade-in duration-200">
        
        {/* Top Header Card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-800 shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-gray-900">
                  {rut?.razon_social || 'Configuración del RUT'}
                </h2>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                  <CheckCircle2 size={10} />
                  RUT Vigente
                </span>
              </div>
              <p className="text-[12px] text-gray-400 mt-0.5">
                {rut?.nit ? `NIT: ${rut.nit}-${rut.dv}` : 'NIT no configurado'} · Responsabilidad 52 (No responsable de IVA)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="px-3.5 h-8 border border-gray-200 hover:bg-gray-50 text-gray-700 text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs bg-white"
              >
                <Edit3 size={13} />
                Actualizar Datos RUT
              </button>
            ) : (
              <button
                onClick={() => setEditing(false)}
                className="px-3.5 h-8 border border-gray-200 hover:bg-gray-50 text-gray-500 text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              >
                <X size={13} />
                Cancelar
              </button>
            )}
          </div>
        </div>

        {/* Clean UVT Threshold Card (Clean White, No Extravagant Black/Blue) */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                  Control de Tope Anual (3.500 UVT)
                </span>
                <span className="text-[10px] text-gray-400 font-mono">Art. 437 E.T.</span>
              </div>
              <p className="text-[12px] text-gray-500 mt-1 max-w-2xl">
                Para mantener la <strong>Responsabilidad 52 (No responsable de IVA)</strong>, los ingresos brutos del año en curso no deben superar las 3.500 UVT ({formatCOP(LIMITE_INGRESOS_ANUAL_COP)}).
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-gray-400 block">Ventas Reales del Año (POS)</span>
              <span className="text-2xl font-bold font-mono text-gray-900 mt-0.5 block">{formatCOP(annualSales)}</span>
              <span className="text-[11px] text-gray-400">Tope: {formatCOP(LIMITE_INGRESOS_ANUAL_COP)}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-gray-100">
            <div className="flex justify-between text-[11px] text-gray-600 font-medium">
              <span>{percentUsed.toFixed(2)}% del límite anual</span>
              <span className="text-emerald-700 font-semibold">Régimen Simplificado Vigente</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gray-900 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(1, percentUsed)}%` }}
              />
            </div>
          </div>
        </div>

        {/* View Details / Form */}
        {!editing ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            <div className="lg:col-span-2 space-y-5">
              
              {/* Card 1: Identificación */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                <h4 className="text-[13px] font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Building size={15} className="text-gray-400" />
                  Identificación Tributaria
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
                  <div>
                    <span className="text-gray-400 block text-[11px]">NIT / Documento</span>
                    <span className="font-mono font-bold text-gray-900 text-[13px]">
                      {rut?.nit ? `${rut.nit} - ${rut.dv}` : 'No registrado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Razón Social</span>
                    <span className="font-semibold text-gray-900">{rut?.razon_social || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Nombre Comercial</span>
                    <span className="font-medium text-gray-800">{rut?.nombre_comercial || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Actividad Económica (CIIU)</span>
                    <span className="font-medium text-gray-800">{rut?.actividad_ciiu || '—'}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-100">
                  <span className="text-gray-400 block text-[11px] mb-2">Responsabilidad Tributaria</span>
                  <div className="flex flex-wrap gap-1.5">
                    {rut?.responsabilidades?.map((r, i) => (
                      <span key={i} className="px-2.5 py-1 bg-gray-50 text-gray-700 rounded-md text-[11px] font-semibold border border-gray-200">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Card 2: Ubicación */}
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                <h4 className="text-[13px] font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <MapPin size={15} className="text-gray-400" />
                  Ubicación y Contacto
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
                  <div>
                    <span className="text-gray-400 block text-[11px]">Dirección Fiscal</span>
                    <span className="font-medium text-gray-900">{rut?.direccion_fiscal || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Ciudad / Municipio</span>
                    <span className="font-medium text-gray-900">{rut?.ciudad || '—'}, {rut?.departamento || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px]">Teléfono</span>
                    <span className="font-medium text-gray-900">{rut?.telefono_fiscal || '—'}</span>
                  </div>
                  <div className="md:col-span-3">
                    <span className="text-gray-400 block text-[11px]">Correo Electrónico para Notificaciones</span>
                    <span className="font-medium text-gray-900">{rut?.correo_fiscal || '—'}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right: PDF & Legal Conditions */}
            <div className="space-y-5">
              
              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-3">
                <h4 className="text-[13px] font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                  <FileText size={15} className="text-gray-400" />
                  Copia Digital del RUT
                </h4>
                
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center space-y-2.5">
                  <FileText size={24} className="mx-auto text-gray-400" />
                  <div>
                    <p className="text-[12px] font-bold text-gray-800">RUT Oficial DIAN</p>
                    <p className="text-[10px] text-gray-400">PDF de certificación</p>
                  </div>
                  <button
                    onClick={() => {
                      if (rut?.pdf_url) {
                        window.open(rut.pdf_url, '_blank')
                      } else {
                        toast('No hay URL de PDF registrada. Actualiza los datos para adjuntarla.', { type: 'info' })
                      }
                    }}
                    className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 text-gray-800 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1.5 mx-auto shadow-xs"
                  >
                    <Download size={12} />
                    Ver / Descargar PDF
                  </button>
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-2.5">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Requisitos No Responsable IVA
                </span>
                <ul className="text-[11px] space-y-2 text-gray-600">
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Ingresos brutos anuales menores a 3.500 UVT.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Máximo 1 establecimiento de comercio.</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <CheckCircle2 size={13} className="text-emerald-600 shrink-0 mt-0.5" />
                    <span>Llevar Libro Fiscal de Operaciones Diarias.</span>
                  </li>
                </ul>
              </div>

            </div>

          </div>
        ) : (
          /* Form for Editing */
          <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-xl p-6 shadow-xs space-y-5 animate-in fade-in duration-150">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-[14px] font-bold text-gray-900">Editar Datos del RUT</h3>
                <p className="text-[11px] text-gray-400">Guarda los datos tributarios en la base de datos de tu negocio</p>
              </div>
              <button type="button" onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12px]">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">NIT / Cédula</label>
                <input
                  type="text"
                  required
                  value={formNit}
                  onChange={e => setFormNit(e.target.value)}
                  placeholder="Ej: 900123456"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Dígito de Verificación (DV)</label>
                <input
                  type="text"
                  value={formDv}
                  onChange={e => setFormDv(e.target.value)}
                  placeholder="Ej: 0"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Razón Social / Titular</label>
                <input
                  type="text"
                  required
                  value={formRazon}
                  onChange={e => setFormRazon(e.target.value)}
                  placeholder="Nombre de la empresa o persona natural"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={formNombreComercial}
                  onChange={e => setFormNombreComercial(e.target.value)}
                  placeholder="Nombre del local comercial"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold text-gray-700 block mb-1">Actividad Económica Principal (CIIU)</label>
                <input
                  type="text"
                  value={formCiiu}
                  onChange={e => setFormCiiu(e.target.value)}
                  placeholder="Ej: 4711 - Comercio al por menor en establecimientos no especializados"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Correo Electrónico Fiscal</label>
                <input
                  type="email"
                  value={formCorreo}
                  onChange={e => setFormCorreo(e.target.value)}
                  placeholder="correo@empresa.com"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Teléfono</label>
                <input
                  type="text"
                  value={formTelefono}
                  onChange={e => setFormTelefono(e.target.value)}
                  placeholder="Ej: 3001234567"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Dirección Fiscal</label>
                <input
                  type="text"
                  value={formDireccion}
                  onChange={e => setFormDireccion(e.target.value)}
                  placeholder="Ej: Carrera 10 # 15-20"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Ciudad</label>
                <input
                  type="text"
                  value={formCiudad}
                  onChange={e => setFormCiudad(e.target.value)}
                  placeholder="Ej: Montería"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Departamento</label>
                <input
                  type="text"
                  value={formDepartamento}
                  onChange={e => setFormDepartamento(e.target.value)}
                  placeholder="Ej: Córdoba"
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">Enlace / URL de PDF del RUT</label>
                <input
                  type="text"
                  value={formPdfUrl}
                  onChange={e => setFormPdfUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-3.5 h-8 border border-gray-200 hover:bg-gray-50 text-gray-600 text-[11px] font-semibold rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 h-8 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Save size={12} />
                {saving ? 'Guardando...' : 'Guardar en Base de Datos'}
              </button>
            </div>
          </form>
        )}

      </div>
    </MainLayout>
  )
}
