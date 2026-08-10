import { useState } from 'react'
import { SesionAuditoria, auditSessionService } from '../../services/auditSessionService'
import { formatCOP } from '../../lib/utils'
import { toast } from '../ui/Toaster'
import { X, CheckCircle, AlertTriangle, ArrowUpRight, HelpCircle } from 'lucide-react'

interface AuditSummaryModalProps {
  session: SesionAuditoria
  countedItems: any[]
  onClose: () => void
  onApproved: () => void
  isAdmin: boolean
}

export default function AuditSummaryModal({ session, countedItems, onClose, onApproved, isAdmin }: AuditSummaryModalProps) {
  const [loading, setLoading] = useState(false)

  // 1. Calculations
  const processedItems = countedItems.map(item => {
    const diff = item.cantidad_contada - item.stock_sistema
    const impact = diff * item.costo_unitario
    return {
      ...item,
      diff,
      impact
    }
  })

  const matchingCount = processedItems.filter(it => it.diff === 0).length
  const missingCount = processedItems.filter(it => it.diff < 0).reduce((acc, curr) => acc + Math.abs(curr.diff), 0)
  const surplusCount = processedItems.filter(it => it.diff > 0).reduce((acc, curr) => acc + curr.diff, 0)
  const totalFinancialImpact = processedItems.reduce((acc, curr) => acc + curr.impact, 0)

  const handleApprove = async () => {
    if (!isAdmin) {
      toast('Operación restringida. Solo administradores pueden aprobar y conciliar inventarios.', { type: 'error' })
      return
    }
    setLoading(true)
    try {
      await auditSessionService.finalizeAndApplyInventory(
        session.id!,
        session.negocio_id,
        session.responsable, // Or user.nombre
        countedItems
      )
      toast('Inventario conciliado y actualizado correctamente', { type: 'success' })
      onApproved()
    } catch (err: any) {
      toast(err.message || 'Error guardando conciliación', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl border border-gray-200 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-[14px] font-bold text-gray-900">Resumen y Conciliación de Conteo</h2>
            <p className="text-[11px] text-gray-400 mt-0.5">#{session.id?.slice(0, 8)} · {session.nombre}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400"
          >
            <X size={15} />
          </button>
        </div>

        {/* Modal body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* KPI Dashboard */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4">
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                Unidades Coincidentes
              </span>
              <p className="text-2xl font-bold text-emerald-800 font-mono mt-1">
                {matchingCount} <span className="text-[12px] font-medium text-emerald-600">ítems ok</span>
              </p>
            </div>

            <div className="bg-red-50/40 border border-red-100 rounded-xl p-4">
              <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
                Unidades Faltantes
              </span>
              <p className="text-2xl font-bold text-red-800 font-mono mt-1">
                {missingCount} <span className="text-[12px] font-medium text-red-600">unidades</span>
              </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Diferencia Financiera Estimada
              </span>
              <p className={`text-2xl font-bold font-mono mt-1 ${
                totalFinancialImpact < 0 ? 'text-red-750' : totalFinancialImpact > 0 ? 'text-emerald-750' : 'text-gray-900'
              }`}>
                {formatCOP(totalFinancialImpact)}
              </p>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-150 text-[10px] font-bold text-gray-550 uppercase tracking-wider">
                  <th className="px-4 py-2.5">Producto</th>
                  <th className="px-4 py-2.5 text-center">Stock Sistema</th>
                  <th className="px-4 py-2.5 text-center">Conteo Físico</th>
                  <th className="px-4 py-2.5 text-center">Diferencia</th>
                  <th className="px-4 py-2.5 text-right">Costo Unitario</th>
                  <th className="px-4 py-2.5 text-right">Impacto Financiero</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[12px] text-gray-700">
                {processedItems.map(it => (
                  <tr key={it.producto_id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-semibold text-gray-900">{it.producto_nombre}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-mono">{it.stock_sistema}</td>
                    <td className="px-4 py-3 text-center font-mono font-bold">{it.cantidad_contada}</td>
                    <td className={`px-4 py-3 text-center font-mono font-bold ${
                      it.diff < 0 ? 'text-red-600' : it.diff > 0 ? 'text-emerald-600' : 'text-gray-400'
                    }`}>
                      {it.diff > 0 ? `+${it.diff}` : it.diff}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{formatCOP(it.costo_unitario)}</td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${
                      it.impact < 0 ? 'text-red-650' : it.impact > 0 ? 'text-emerald-650' : 'text-gray-900'
                    }`}>
                      {formatCOP(it.impact)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-gray-150 flex gap-2 justify-end shrink-0 bg-gray-50/40">
          <button
            onClick={onClose}
            className="h-9 px-4 border border-gray-200 text-[12px] font-semibold text-gray-700 rounded-lg hover:bg-gray-100 bg-white transition-colors"
          >
            Volver a Editar
          </button>
          
          {session.estado === 'en_proceso' ? (
            <button
              onClick={handleApprove}
              disabled={loading || !isAdmin}
              className={[
                'h-9 px-4 text-white rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition-colors',
                isAdmin ? 'bg-gray-950 hover:bg-gray-800' : 'bg-gray-300 cursor-not-allowed'
              ].join(' ')}
              title={!isAdmin ? 'Solo administradores pueden conciliar conteos' : ''}
            >
              <CheckCircle size={13} />
              {loading ? 'Procesando...' : 'Aprobar y Ajustar Inventario'}
            </button>
          ) : (
            <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-1.5 text-emerald-800 text-[12px] font-semibold">
              <CheckCircle size={13} />
              Auditoría Cerrada y Ajustada
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
