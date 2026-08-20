import { useState } from 'react'
import { VendoraCliente } from '../../services/adminService'
import { formatCOP } from '../../lib/utils'
import { X, CheckCircle2, Wallet } from 'lucide-react'

interface RegistrarPagoDialogProps {
  isOpen: boolean
  clientes: VendoraCliente[]
  onClose: () => void
  onRegister: (clienteId: string, monto: number, metodo: string, notas: string) => Promise<void>
}

export default function RegistrarPagoDialog({
  isOpen,
  clientes,
  onClose,
  onRegister
}: RegistrarPagoDialogProps) {
  const [selectedId, setSelectedId] = useState(clientes[0]?.id || '')
  const [monto, setMonto] = useState('160000')
  const [metodo, setMetodo] = useState('efectivo')
  const [notas, setNotas] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleClientChange = (id: string) => {
    setSelectedId(id)
    const found = clientes.find(c => c.id === id)
    if (found && found.cuota_mensual) {
      setMonto(String(found.cuota_mensual))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    const num = parseFloat(monto) || 0
    if (num <= 0) return

    setLoading(true)
    try {
      await onRegister(selectedId, num, metodo, notas)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-slate-200 w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
              <Wallet size={15} />
            </div>
            <div>
              <h3 className="text-[14px] font-bold text-slate-900">Registrar Cobro de Cuota</h3>
              <p className="text-[11px] text-slate-400">Extiende la fecha de corte 30 días automáticamente</p>
            </div>
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
            
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Comercio</label>
              <select
                value={selectedId || clientes[0]?.id}
                onChange={e => handleClientChange(e.target.value)}
                className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white font-medium"
              >
                {clientes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_comercio} ({c.municipio}) — Cuota: {formatCOP(c.cuota_mensual)}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Monto Recaudado ($)</label>
                <input
                  type="number"
                  required
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  className="w-full h-8 px-2.5 font-mono font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Método</label>
                <select
                  value={metodo}
                  onChange={e => setMetodo(e.target.value)}
                  className="w-full h-8 px-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
                >
                  <option value="efectivo">Efectivo en Local</option>
                  <option value="nequi">Nequi</option>
                  <option value="daviplata">Daviplata</option>
                  <option value="bancolombia">Bancolombia</option>
                </select>
              </div>
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">Nota u Observación (Opcional)</label>
              <input
                type="text"
                placeholder="Ej: Cobro en efectivo cuota mensual..."
                value={notas}
                onChange={e => setNotas(e.target.value)}
                className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900 bg-white"
              />
            </div>

          </div>

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
              disabled={loading}
              className="px-4 h-8 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 size={13} />
              <span>{loading ? 'Registrando...' : 'Registrar Pago (+30 días)'}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  )
}
