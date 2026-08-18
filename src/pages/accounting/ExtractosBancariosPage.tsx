import { useState, useEffect, useMemo } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import { useAuth } from '../../components/auth/AuthContext'
import { accountingService, ExtractoBancario } from '../../services/accountingService'
import { formatCOP } from '../../lib/utils'
import { toast } from '../../components/ui/Toaster'
import { SkeletonPage } from '../../components/ui/Skeleton'
import {
  Landmark, Plus, Search, CheckCircle2, Clock,
  AlertCircle, Trash2, X, Save, Wallet, Smartphone, CreditCard
} from 'lucide-react'

type EntidadFilter = 'todos' | 'Nequi' | 'Daviplata' | 'Bancolombia' | 'Datafono'

export default function ExtractosBancariosPage() {
  const { profile } = useAuth()
  const [extractos, setExtractos] = useState<ExtractoBancario[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [entidadFilter, setEntidadFilter] = useState<EntidadFilter>('todos')

  // Modal State
  const [modalOpen, setModalOpen] = useState(false)
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0])
  const [formEntidad, setFormEntidad] = useState<'Nequi' | 'Daviplata' | 'Bancolombia' | 'Datafono' | 'Otro'>('Nequi')
  const [formReferencia, setFormReferencia] = useState('')
  const [formMontoBanco, setFormMontoBanco] = useState('')
  const [formMontoPos, setFormMontoPos] = useState('')
  const [formNotas, setFormNotas] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.negocio_id) loadExtractos()
  }, [profile])

  const loadExtractos = async () => {
    setLoading(true)
    try {
      const data = await accountingService.getExtractosBancarios(profile!.negocio_id)
      setExtractos(data)
    } catch (err: any) {
      toast(err.message || 'Error cargando extractos bancarios', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.negocio_id) return
    const mb = parseFloat(formMontoBanco) || 0
    const mp = parseFloat(formMontoPos) || mb

    if (mb <= 0) {
      toast('El monto debe ser mayor a cero', { type: 'error' })
      return
    }

    setSaving(true)
    try {
      const isMatch = Math.abs(mb - mp) < 0.01
      const payload: Omit<ExtractoBancario, 'id'> = {
        tenant_id: profile.negocio_id,
        fecha: formFecha,
        entidad: formEntidad,
        referencia: formReferencia || `REF-${Date.now().toString().slice(-6)}`,
        monto_banco: mb,
        monto_pos: mp,
        estado: isMatch ? 'conciliado' : 'discrepancia',
        notas: formNotas || undefined
      }

      const created = await accountingService.addExtracto(payload)
      setExtractos(prev => [created, ...prev])
      toast('Movimiento bancario registrado y conciliado', { type: 'success' })
      setModalOpen(false)
    } catch (err: any) {
      toast(err.message || 'Error al guardar movimiento', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este registro de conciliación?')) return
    try {
      await accountingService.deleteExtracto(id)
      setExtractos(prev => prev.filter(e => e.id !== id))
      toast('Movimiento eliminado', { type: 'success' })
    } catch (err: any) {
      toast(err.message || 'Error al eliminar', { type: 'error' })
    }
  }

  const filtered = useMemo(() => {
    return extractos.filter(e => {
      const q = search.toLowerCase()
      const matchSearch = !q ||
        e.referencia.toLowerCase().includes(q) ||
        e.entidad.toLowerCase().includes(q) ||
        (e.notas || '').toLowerCase().includes(q)

      const matchEntidad = entidadFilter === 'todos' || e.entidad === entidadFilter
      return matchSearch && matchEntidad
    })
  }, [extractos, search, entidadFilter])

  // KPIs
  const totals = useMemo(() => {
    let banco = 0
    let pos = 0
    filtered.forEach(e => {
      banco += Number(e.monto_banco) || 0
      pos += Number(e.monto_pos) || 0
    })
    const diff = banco - pos
    return { banco, pos, diff }
  }, [filtered])

  if (loading) {
    return (
      <MainLayout title="Extractos Bancarios Conciliados">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Extractos Bancarios Conciliados">
      <div className="p-6 space-y-5 max-w-[1400px] mx-auto animate-in fade-in duration-300">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Extractos Bancarios Conciliados</h2>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-200">
                Cruce POS vs Bancos
              </span>
            </div>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Conciliación automática y manual de transferencias digitales (Nequi, Daviplata, Bancos) con los cobros del POS
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setFormFecha(new Date().toISOString().split('T')[0])
                setFormEntidad('Nequi')
                setFormReferencia('')
                setFormMontoBanco('')
                setFormMontoPos('')
                setFormNotas('')
                setModalOpen(true)
              }}
              className="px-3.5 h-8 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={13} />
              Cargar Movimiento Bancario
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Total Entradas en Bancos
            </span>
            <p className="text-2xl font-bold font-mono text-gray-900">{formatCOP(totals.banco)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Registrado en cuentas y billeteras digitales</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Total Registrado en POS (Transferencias)
            </span>
            <p className="text-2xl font-bold font-mono text-gray-900">{formatCOP(totals.pos)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Ventas marcadas como transferencia o tarjeta</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
              Diferencia / Cuadre
            </span>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold font-mono text-emerald-600">{formatCOP(totals.diff)}</p>
              {Math.abs(totals.diff) < 0.01 ? (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full">
                  100% Cuadrado
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full">
                  Por conciliar
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mt-1">Cruce exacto entre sistema y dinero recibido</p>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3 flex-1 min-w-[280px]">
            <div className="relative flex-1 max-w-sm">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por referencia, banco o notas..."
                className="w-full h-8 pl-8 pr-8 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Entity Pills */}
            <div className="flex items-center gap-1">
              {([
                { key: 'todos', label: 'Todos' },
                { key: 'Nequi', label: 'Nequi' },
                { key: 'Daviplata', label: 'Daviplata' },
                { key: 'Bancolombia', label: 'Bancolombia' },
                { key: 'Datafono', label: 'Datáfono' }
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setEntidadFilter(key)}
                  className={[
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                    entidadFilter === key
                      ? 'bg-gray-900 text-white font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[12px] text-gray-400 font-medium">
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Reconciliation Table */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 space-y-2 shadow-xs">
            <Landmark size={28} className="mx-auto text-gray-300 mb-1" />
            <p className="text-[13px] font-bold text-gray-700">Sin movimientos bancarios</p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Registra los extractos de tus billeteras para contrastarlos con los cobros del POS.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[580px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-28">Fecha</th>
                    <th className="px-4 py-3 w-36">Canal / Entidad</th>
                    <th className="px-4 py-3 w-40">Referencia</th>
                    <th className="px-4 py-3 text-right w-36">Monto Extracto</th>
                    <th className="px-4 py-3 text-right w-36">Monto POS</th>
                    <th className="px-4 py-3 text-center w-32">Estado</th>
                    <th className="px-4 py-3">Notas / Detalle</th>
                    <th className="px-4 py-3 text-center w-16"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[12px] text-gray-700">
                  {filtered.map(item => {
                    const isConciliado = item.estado === 'conciliado'
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] text-gray-800">{item.fecha}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">
                          <span className="flex items-center gap-1.5">
                            {item.entidad === 'Nequi' ? <Smartphone size={13} className="text-purple-600" /> :
                             item.entidad === 'Daviplata' ? <Smartphone size={13} className="text-red-600" /> :
                             item.entidad === 'Datafono' ? <CreditCard size={13} className="text-blue-600" /> :
                             <Landmark size={13} className="text-gray-700" />}
                            {item.entidad}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] font-bold text-gray-700">{item.referencia}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-900">{formatCOP(item.monto_banco)}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-gray-600">{formatCOP(item.monto_pos)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={[
                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize inline-flex items-center gap-1',
                            isConciliado ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-rose-50 text-rose-700 border border-rose-200/60'
                          ].join(' ')}>
                            {isConciliado ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                            {item.estado}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{item.notas || '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                            title="Eliminar registro"
                          >
                            <Trash2 size={12} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal Cargar Movimiento */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">Cargar Movimiento Bancario</h3>
                  <p className="text-[11px] text-gray-400">Registra un pago de Nequi, Daviplata o banco para cruce</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSave}>
                <div className="p-5 space-y-3.5 text-[12px]">
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Fecha</label>
                      <input
                        type="date"
                        required
                        value={formFecha}
                        onChange={e => setFormFecha(e.target.value)}
                        className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Entidad / Canal</label>
                      <select
                        value={formEntidad}
                        onChange={e => setFormEntidad(e.target.value as any)}
                        className="w-full h-8 px-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white font-medium"
                      >
                        <option value="Nequi">Nequi</option>
                        <option value="Daviplata">Daviplata</option>
                        <option value="Bancolombia">Bancolombia</option>
                        <option value="Datafono">Datáfono (Tarjetas)</option>
                        <option value="Otro">Otro Banco</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Referencia / Comprobante M-XXXX</label>
                    <input
                      type="text"
                      placeholder="Ej: M-1092842 / Aprobación 5582"
                      value={formReferencia}
                      onChange={e => setFormReferencia(e.target.value)}
                      className="w-full h-8 px-2.5 font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Monto en Extracto ($)</label>
                      <input
                        type="number"
                        required
                        placeholder="Ej: 85000"
                        value={formMontoBanco}
                        onChange={e => {
                          setFormMontoBanco(e.target.value)
                          if (!formMontoPos) setFormMontoPos(e.target.value)
                        }}
                        className="w-full h-8 px-2.5 font-mono font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Monto en POS ($)</label>
                      <input
                        type="number"
                        required
                        placeholder="Ej: 85000"
                        value={formMontoPos}
                        onChange={e => setFormMontoPos(e.target.value)}
                        className="w-full h-8 px-2.5 font-mono font-bold border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Notas / Detalle</label>
                    <input
                      type="text"
                      placeholder="Ej: Pago de cliente por compra de abarrotes..."
                      value={formNotas}
                      onChange={e => setFormNotas(e.target.value)}
                      className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                    />
                  </div>

                </div>

                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-3.5 h-8 border border-gray-200 hover:bg-gray-100 text-gray-600 text-[11px] font-semibold rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 h-8 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <Save size={12} />
                    {saving ? 'Guardando...' : 'Guardar y Conciliar'}
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}
