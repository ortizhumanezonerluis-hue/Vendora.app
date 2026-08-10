import { useState, useEffect, useMemo } from 'react'
import { Select } from '../ui/Select'
import { reorderService, Proveedor } from '../../services/reorderService'
import { useAuth } from '../auth/AuthContext'
import { formatCOP } from '../../lib/utils'
import { toast } from '../ui/Toaster'
import { AlertCircle, FileText, CheckCircle, Package, ArrowRight, Loader2, Edit } from 'lucide-react'

interface SugerenciaItem {
  producto: any
  velocity: number
  daysRemaining: number
  suggested: number
  needsReorder: boolean
}

export default function SmartReorderPanel() {
  const { profile } = useAuth()
  const [sugerencias, setSugerencias] = useState<SugerenciaItem[]>([])
  const [suppliers, setSuppliers] = useState<Proveedor[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)

  // Desired coverage (default 7 days)
  const [coverageDays, setCoverageDays] = useState(7)
  // Local quantity overrides key: product_id -> value: amount
  const [overrides, setOverrides] = useState<Record<string, number>>({})
  const [observations, setObservations] = useState('')

  useEffect(() => {
    loadEngineData()
  }, [profile])

  const loadEngineData = async () => {
    if (!profile?.negocio_id) return
    setLoading(true)
    try {
      const sups = await reorderService.getProveedores(profile.negocio_id)
      setSuppliers(sups)
      const data = await reorderService.calculateReorderSugerencias(profile.negocio_id)
      setSugerencias(data)
    } catch (err: any) {
      toast(err.message || 'Error calculando sugerencias', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Handle local amount adjustments
  const handleQtyChange = (prodId: string, val: string) => {
    const num = parseInt(val) || 0
    setOverrides(prev => ({ ...prev, [prodId]: Math.max(0, num) }))
  }

  // Group items that have suggested quantity > 0 by provider
  const groupedOrders = useMemo(() => {
    const groups: Record<string, { proveedor: Proveedor | null; items: { product: any; qty: number }[] }> = {}

    sugerencias.forEach(sug => {
      const finalQty = overrides[sug.producto.id] !== undefined ? overrides[sug.producto.id] : sug.suggested
      if (finalQty <= 0) return

      const provId = sug.producto.proveedor_id || 'sin_proveedor'
      if (!groups[provId]) {
        const foundSup = suppliers.find(sup => sup.id === provId) || null
        groups[provId] = {
          proveedor: foundSup,
          items: []
        }
      }
      groups[provId].items.push({
        product: sug.producto,
        qty: finalQty
      })
    })

    return Object.entries(groups)
  }, [sugerencias, overrides, suppliers])

  const generateOrder = async (provId: string, items: { product: any; qty: number }[]) => {
    if (!profile?.negocio_id) return
    if (provId === 'sin_proveedor') {
      toast('Por favor asocia un proveedor a los productos antes de crear la orden de compra.', { type: 'error' })
      return
    }
    setGenerating(true)
    try {
      const orderPayload = items.map(it => ({
        productoId: it.product.id,
        cantidad: it.qty,
        costoUnitario: it.product.precio_costo || 0
      }))

      await reorderService.createOrdenCompra(
        profile.negocio_id,
        provId,
        orderPayload,
        observations
      )

      toast(`Orden de compra generada correctamente`, { type: 'success' })
      setObservations('')
      // Clear suggestions for items that were ordered
      setOverrides(prev => {
        const next = { ...prev }
        items.forEach(it => {
          delete next[it.product.id]
        })
        return next
      })
      loadEngineData()
    } catch (err: any) {
      toast(err.message || 'Error al generar la orden', { type: 'error' })
    } finally {
      setGenerating(false)
    }
  }

  if (loading) {
    return (
      <div className="h-48 border border-gray-100 rounded-xl bg-gray-50/50 flex items-center justify-center text-[12px] text-gray-400">
        Calculando sugerencias de reabastecimiento en tiempo real...
      </div>
    )
  }

  const itemsToReorder = sugerencias.filter(s => s.suggested > 0)

  return (
    <div className="space-y-4">
      {/* Settings Row */}
      <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200">
        <div>
          <p className="text-[13px] font-bold text-gray-900">Cobertura de Inventario</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Calculamos la cantidad sugerida de pedido para cubrir los días elegidos</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-gray-600">Días de cobertura:</span>
          <Select
            value={String(coverageDays)}
            onChange={(e) => setCoverageDays(parseInt(e.target.value))}
            className="h-8 w-28"
          >
            {[5, 7, 10, 15, 30].map(d => (
              <option key={d} value={d}>{d} días</option>
            ))}
          </Select>
        </div>
      </div>

      {itemsToReorder.length === 0 ? (
        <div className="h-48 border border-gray-100 rounded-xl bg-white flex flex-col items-center justify-center text-center p-6">
          <CheckCircle size={20} className="text-emerald-500 mb-2" />
          <p className="text-[13px] font-semibold text-gray-700">Inventario al día</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Ningún producto está por debajo del stock mínimo o requiere compra.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          
          {/* LEFT: Sugerencias list (2/3 cols) */}
          <div className="col-span-2 flex flex-col">
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Productos Sugeridos</h3>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex-1">
              <div className="overflow-y-auto max-h-[480px] divide-y divide-gray-50">
              {sugerencias.map((sug) => {
                const finalQty = overrides[sug.producto.id] !== undefined ? overrides[sug.producto.id] : sug.suggested
                const isNeed = sug.suggested > 0

                // Label badge parameters
                const providerName = suppliers.find(s => s.id === sug.producto.proveedor_id)?.nombre || 'Sin Proveedor'

                return (
                  <div key={sug.producto.id} className={[
                    'p-4 flex items-center justify-between gap-4 transition-colors',
                    isNeed ? 'bg-amber-50/20' : 'opacity-65 hover:bg-gray-50/30'
                  ].join(' ')}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-bold text-gray-950">{sug.producto.nombre}</span>
                        <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                          Stock: {sug.producto.stock_actual}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400">
                        Proveedor: <span className="font-semibold text-gray-600">{providerName}</span> · Vende {sug.velocity.toFixed(2)} p/día
                      </p>
                      {isNeed && (
                        <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-1">
                          <AlertCircle size={11} />
                          Faltan unidades. Cobertura {coverageDays} días: pedir {sug.suggested} u.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-400">Pedir:</span>
                      <input
                        type="number"
                        value={finalQty}
                        onChange={(e) => handleQtyChange(sug.producto.id, e.target.value)}
                        className="w-16 h-8 px-2 border border-gray-200 rounded-lg text-[13px] font-bold font-mono text-center focus:outline-none bg-white"
                      />
                    </div>
                  </div>
                )
              })}
              </div>
            </div>
          </div>

          {/* RIGHT: Resumen de Órdenes agrupadas (1/3 col) */}
          <div className="flex flex-col">
            <h3 className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Órdenes Generadas</h3>
            
            {groupedOrders.length === 0 ? (
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50 text-center text-[12px] text-gray-400">
                Ajusta las cantidades de los productos para ver los borradores de compra
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                
                <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm">
                  <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                    Observaciones Generales
                  </label>
                  <textarea
                    rows={2}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                    placeholder="Notas o instrucciones especiales..."
                    className="w-full p-2 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                  />
                </div>

                {/* Scrollable orders list */}
                <div className="overflow-y-auto max-h-[360px] space-y-3 pr-0.5">
                  {groupedOrders.map(([provId, group]) => {
                    const totalCost = group.items.reduce((acc, it) => acc + (it.qty * (it.product.precio_costo || 0)), 0)

                    return (
                      <div key={provId} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                          <p className="text-[13px] font-bold text-gray-900">
                            {group.proveedor?.nombre || 'Sin Proveedor Asignado'}
                          </p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {group.items.length} productos · Asesor: {group.proveedor?.asesor || '—'}
                          </p>
                        </div>

                        <div className="p-4 space-y-3">
                          <div className="divide-y divide-gray-50 max-h-36 overflow-y-auto">
                            {group.items.map((it) => (
                              <div key={it.product.id} className="py-2 flex items-center justify-between text-[11px]">
                                <span className="text-gray-600 truncate max-w-44">{it.product.nombre}</span>
                                <span className="font-mono text-gray-900 font-bold">x{it.qty}</span>
                              </div>
                            ))}
                          </div>

                          <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-[12px]">
                            <span className="text-gray-500 font-medium">Costo Total:</span>
                            <span className="font-mono font-bold text-gray-900">{formatCOP(totalCost)}</span>
                          </div>

                          <button
                            onClick={() => generateOrder(provId, group.items)}
                            disabled={generating}
                            className="w-full h-8 mt-2 bg-gray-900 hover:bg-gray-800 text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            {generating ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                            Generar Orden de Compra
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
