import { useState, useEffect } from 'react'
import { VendoraCliente, PlanType, EstadoCliente, TipoPago } from '../../services/adminService'
import { formatCOP } from '../../lib/utils'
import { X, Save, Shield, Store, Calendar, Wallet } from 'lucide-react'

interface ClienteDialogProps {
  isOpen: boolean
  cliente: VendoraCliente | null
  onClose: () => void
  onSave: (id: string, updates: Partial<VendoraCliente>) => Promise<void>
}

export default function ClienteDialog({ isOpen, cliente, onClose, onSave }: ClienteDialogProps) {
  const [nombreComercio, setNombreComercio] = useState('')
  const [nombreDueno, setNombreDueno] = useState('')
  const [municipio, setMunicipio] = useState('')
  const [telefono, setTelefono] = useState('')
  const [emailAcceso, setEmailAcceso] = useState('')
  const [plan, setPlan] = useState<PlanType>('pro')
  const [tipoPago, setTipoPago] = useState<TipoPago>('financiado')
  const [estado, setEstado] = useState<EstadoCliente>('activo')
  const [cuotaMensual, setCuotaMensual] = useState('160000')
  const [cuotasPagadas, setCuotasPagadas] = useState('0')
  const [saldoPendiente, setSaldoPendiente] = useState('0')
  const [fechaCorte, setFechaCorte] = useState('')
  const [licenciaActiva, setLicenciaActiva] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (cliente) {
      setNombreComercio(cliente.nombre_comercio || '')
      setNombreDueno(cliente.nombre_dueno || '')
      setMunicipio(cliente.municipio || 'Cereté')
      setTelefono(cliente.telefono || '')
      setEmailAcceso(cliente.email_acceso || '')
      setPlan(cliente.plan || 'pro')
      setTipoPago(cliente.tipo_pago || 'financiado')
      setEstado(cliente.estado || 'activo')
      setCuotaMensual(String(cliente.cuota_mensual || 160000))
      setCuotasPagadas(String(cliente.cuotas_pagadas || 0))
      setSaldoPendiente(String(cliente.saldo_pendiente || 0))
      setFechaCorte(cliente.fecha_corte || new Date().toISOString().split('T')[0])
      setLicenciaActiva(cliente.licencia_activa ?? true)
    }
  }, [cliente])

  if (!isOpen || !cliente) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(cliente.id, {
        nombre_comercio: nombreComercio,
        nombre_dueno: nombreDueno,
        municipio,
        telefono,
        email_acceso: emailAcceso,
        plan,
        tipo_pago: tipoPago,
        estado,
        cuota_mensual: parseFloat(cuotaMensual) || 0,
        cuotas_pagadas: parseInt(cuotasPagadas) || 0,
        saldo_pendiente: parseFloat(saldoPendiente) || 0,
        fecha_corte: fechaCorte,
        licencia_activa: licenciaActiva
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900">Editar Suscripción y Licencia</h3>
            <p className="text-[11px] text-slate-500 font-mono">ID: {cliente.id.slice(0, 16)}...</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 text-[13px] max-h-[75vh] overflow-y-auto">
            
            {/* Store & Owner Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Comercio</label>
                <input
                  type="text"
                  required
                  value={nombreComercio}
                  onChange={e => setNombreComercio(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Propietario</label>
                <input
                  type="text"
                  required
                  value={nombreDueno}
                  onChange={e => setNombreDueno(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email Acceso</label>
                <input
                  type="email"
                  value={emailAcceso}
                  onChange={e => setEmailAcceso(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Municipio</label>
                <input
                  type="text"
                  value={municipio}
                  onChange={e => setMunicipio(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>
            </div>

            {/* Plan & License status */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                Configuración del Plan Vendora
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-[12px]">Plan Asignado</label>
                  <select
                    value={plan}
                    onChange={e => setPlan(e.target.value as PlanType)}
                    className="w-full h-8 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-bold"
                  >
                    <option value="starter">STARTER (Básico)</option>
                    <option value="pro">PRO (Recomendado)</option>
                    <option value="max">MAX (Full Contabilidad)</option>
                    <option value="sin_licencia">SIN LICENCIA</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-[12px]">Tipo de Contrato</label>
                  <select
                    value={tipoPago}
                    onChange={e => setTipoPago(e.target.value as TipoPago)}
                    className="w-full h-8 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    <option value="financiado">Financiación 10 Meses</option>
                    <option value="vitalicio">Suscripción de por vida</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1 text-[12px]">Estado del Cliente</label>
                  <select
                    value={estado}
                    onChange={e => {
                      const st = e.target.value as EstadoCliente
                      setEstado(st)
                      setLicenciaActiva(st === 'activo')
                    }}
                    className="w-full h-8 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-bold"
                  >
                    <option value="activo">🟢 ACTIVO</option>
                    <option value="mora">🟡 EN MORA</option>
                    <option value="suspendido">🔴 SUSPENDIDO</option>
                    <option value="pendiente">⚪ PENDIENTE</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <div>
                  <p className="font-bold text-slate-800 text-[12px]">Interruptor de Licencia</p>
                  <p className="text-[10px] text-slate-400">Si se apaga, el comercio verá la pantalla de bloqueo en su local al instante.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const next = !licenciaActiva
                    setLicenciaActiva(next)
                    setEstado(next ? 'activo' : 'suspendido')
                  }}
                  className={[
                    'w-12 h-6 rounded-full transition-colors relative cursor-pointer',
                    licenciaActiva ? 'bg-emerald-600' : 'bg-slate-300'
                  ].join(' ')}
                >
                  <span
                    className={[
                      'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-xs',
                      licenciaActiva ? 'right-0.5' : 'left-0.5'
                    ].join(' ')}
                  />
                </button>
              </div>
            </div>

            {/* Financial Tracking */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cuota Mensual ($)</label>
                <input
                  type="number"
                  value={cuotaMensual}
                  onChange={e => setCuotaMensual(e.target.value)}
                  className="w-full h-8 px-2.5 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cuotas Pagadas</label>
                <input
                  type="number"
                  value={cuotasPagadas}
                  onChange={e => setCuotasPagadas(e.target.value)}
                  className="w-full h-8 px-2.5 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Saldo Pendiente ($)</label>
                <input
                  type="number"
                  value={saldoPendiente}
                  onChange={e => setSaldoPendiente(e.target.value)}
                  className="w-full h-8 px-2.5 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Fecha de Corte</label>
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={e => setFechaCorte(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>
            </div>

          </div>

          {/* Modal Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[12px] font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-[12px] font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={13} />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
