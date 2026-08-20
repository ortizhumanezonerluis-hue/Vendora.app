import { useState, useEffect } from 'react'
import { VendoraCliente, PlanType, EstadoCliente, TipoPago } from '../../services/adminService'
import { X, Save } from 'lucide-react'

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
  const [cuotaMensual, setCuotaMensual] = useState('190000')
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
      setCuotaMensual(String(cliente.cuota_mensual || 190000))
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
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* OpenAI Platform Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-[14px] font-bold text-slate-900">Editar Comercio y Licencia</h3>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">ID: {cliente.id}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-5 space-y-3.5 text-[12px]">
            
            {/* Store & Owner */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Nombre del Comercio</label>
                <input
                  type="text"
                  required
                  value={nombreComercio}
                  onChange={e => setNombreComercio(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Propietario</label>
                <input
                  type="text"
                  required
                  value={nombreDueno}
                  onChange={e => setNombreDueno(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Email, Phone, City */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Email</label>
                <input
                  type="email"
                  value={emailAcceso}
                  onChange={e => setEmailAcceso(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">WhatsApp</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Municipio</label>
                <input
                  type="text"
                  value={municipio}
                  onChange={e => setMunicipio(e.target.value)}
                  className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Plan & Contract */}
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Plan</label>
                <select
                  value={plan}
                  onChange={e => setPlan(e.target.value as PlanType)}
                  className="w-full h-8 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white font-medium"
                >
                  <option value="starter">STARTER</option>
                  <option value="pro">PRO</option>
                  <option value="max">MAX</option>
                  <option value="sin_licencia">Sin Licencia</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Contrato</label>
                <select
                  value={tipoPago}
                  onChange={e => setTipoPago(e.target.value as TipoPago)}
                  className="w-full h-8 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="financiado">Financiación 10m</option>
                  <option value="vitalicio">Vitalicio</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Estado</label>
                <select
                  value={estado}
                  onChange={e => {
                    const st = e.target.value as EstadoCliente
                    setEstado(st)
                    setLicenciaActiva(st === 'activo')
                  }}
                  className="w-full h-8 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white font-medium"
                >
                  <option value="activo">Activo</option>
                  <option value="mora">En Mora</option>
                  <option value="suspendido">Suspendido</option>
                  <option value="pendiente">Pendiente</option>
                </select>
              </div>
            </div>

            {/* Financial tracking */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cuota Mensual ($)</label>
                <input
                  type="number"
                  value={cuotaMensual}
                  onChange={e => setCuotaMensual(e.target.value)}
                  className="w-full h-8 px-2.5 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Cuotas Pagadas</label>
                <input
                  type="number"
                  value={cuotasPagadas}
                  onChange={e => setCuotasPagadas(e.target.value)}
                  className="w-full h-8 px-2.5 font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Fecha de Corte</label>
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={e => setFechaCorte(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Switch Toggle */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 mt-2">
              <div>
                <p className="font-semibold text-slate-800 text-[12px]">Estado de Licencia en Vivo</p>
                <p className="text-[10px] text-slate-400">Si se desactiva, el comerciante queda bloqueado al instante.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const next = !licenciaActiva
                  setLicenciaActiva(next)
                  setEstado(next ? 'activo' : 'suspendido')
                }}
                className={[
                  'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                  licenciaActiva ? 'bg-slate-900' : 'bg-slate-300'
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

          {/* Modal Footer */}
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 h-8 border border-slate-200 hover:bg-slate-100 text-slate-600 text-[11px] font-semibold rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 h-8 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save size={12} />
              <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
