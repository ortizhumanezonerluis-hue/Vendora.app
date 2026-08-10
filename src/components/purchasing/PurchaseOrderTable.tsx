import { useState, useEffect } from 'react'
import { reorderService, OrdenCompra } from '../../services/reorderService'
import { useAuth } from '../auth/AuthContext'
import { formatCOP } from '../../lib/utils'
import { toast } from '../ui/Toaster'
import {
  FileText, Calendar, User, ShoppingBag, X,
  ExternalLink, Printer, Check, ArrowUpRight, Trash2
} from 'lucide-react'

export default function PurchaseOrderTable() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)

  // Selected order details modal
  const [selectedOrder, setSelectedOrder] = useState<OrdenCompra | null>(null)
  const [orderDetails, setOrderDetails] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [profile])

  const loadOrders = async () => {
    if (!profile?.negocio_id) return
    setLoading(true)
    try {
      const data = await reorderService.getOrdenes(profile.negocio_id)
      setOrders(data)
    } catch (err: any) {
      toast(err.message || 'Error cargando órdenes', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const openOrderDetails = async (order: OrdenCompra) => {
    setSelectedOrder(order)
    setLoadingDetails(true)
    try {
      const details = await reorderService.getOrdenDetalles(order.id)
      setOrderDetails(details)
    } catch (err) {
      setOrderDetails([])
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleStatusChange = async (id: string, newStatus: 'pendiente' | 'enviada' | 'recibida') => {
    try {
      await reorderService.updateOrdenEstado(id, newStatus)
      toast('Estado de la orden actualizado', { type: 'success' })
      loadOrders()
      if (selectedOrder?.id === id) {
        setSelectedOrder(prev => prev ? { ...prev, estado: newStatus } : null)
      }
    } catch (err: any) {
      toast(err.message || 'Error al cambiar estado', { type: 'error' })
    }
  }

  const handleDelete = async (id: string, codigo: string) => {
    if (!window.confirm(`¿Eliminar la orden ${codigo}? Esta acción no se puede deshacer.`)) return
    try {
      await reorderService.deleteOrden(id)
      setOrders(prev => prev.filter(o => o.id !== id))
      if (selectedOrder?.id === id) setSelectedOrder(null)
      toast(`Orden ${codigo} eliminada`, { type: 'success' })
    } catch (err: any) {
      toast(err.message || 'Error al eliminar la orden', { type: 'error' })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const getWhatsAppLink = (order: OrdenCompra, items: any[]) => {
    const providerName = order.proveedores?.nombre || 'Proveedor'
    const code = order.codigo
    const dateLabel = new Date(order.fecha).toLocaleDateString('es-CO')
    
    let text = `*Orden de Compra ${code}* - Vendora\n`
    text += `Fecha: ${dateLabel}\n`
    text += `Proveedor: ${providerName}\n\n`
    text += `*Ítems solicitados:*\n`
    
    items.forEach(it => {
      text += `- ${it.productos?.nombre} (x${it.cantidad}) - Costo Unitario: ${formatCOP(it.costo_unitario)}\n`
    })

    text += `\n*Costo Total Estimado:* ${formatCOP(order.costo_total)}\n`
    if (order.observaciones) {
      text += `*Observaciones:* ${order.observaciones}\n`
    }

    const phone = order.proveedores?.telefono ? order.proveedores.telefono.replace(/[^0-9]/g, '') : ''
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-[14px] font-bold text-gray-900">Historial de Órdenes de Compra</h2>
        <p className="text-[12px] text-gray-400 mt-0.5">Consulta, imprime o envía órdenes de compra activas o recibidas</p>
      </div>

      {loading ? (
        <div className="h-48 border border-gray-100 rounded-xl bg-gray-50/50 flex items-center justify-center text-[12px] text-gray-400">
          Cargando historial de órdenes de compra...
        </div>
      ) : orders.length === 0 ? (
        <div className="h-48 border border-gray-100 rounded-xl bg-white flex flex-col items-center justify-center text-center p-6">
          <ShoppingBag size={20} className="text-gray-300 mb-2" />
          <p className="text-[13px] font-semibold text-gray-700">Sin órdenes generadas</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Ve a la pestaña de sugerencias para generar tu primera orden de compra</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-gray-50 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Código</th>
                <th className="px-5 py-3">Proveedor</th>
                <th className="px-5 py-3">Fecha</th>
                <th className="px-5 py-3">Costo Estimado</th>
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3 text-right">Detalle</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 text-[12px] text-gray-700">
              {orders.map((o) => {
                const dateLabel = new Date(o.fecha).toLocaleDateString('es-CO', {
                  day: 'numeric', month: 'short', year: 'numeric'
                })
                return (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-gray-900">{o.codigo}</td>
                    <td className="px-5 py-3 font-semibold text-gray-950">{o.proveedores?.nombre || '—'}</td>
                    <td className="px-5 py-3">{dateLabel}</td>
                    <td className="px-5 py-3 font-mono font-semibold">{formatCOP(o.costo_total)}</td>
                    <td className="px-5 py-3">
                      <span className={[
                        'px-2 py-0.5 rounded-full text-[10px] font-bold capitalize',
                        o.estado === 'recibida' ? 'bg-emerald-50 text-emerald-700' :
                        o.estado === 'enviada' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'
                      ].join(' ')}>
                        {o.estado}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => openOrderDetails(o)}
                        className="px-2.5 h-7 border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        Abrir
                        <ArrowUpRight size={11} />
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        onClick={() => handleDelete(o.id, o.codigo)}
                        title="Eliminar orden"
                        className="h-7 w-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                      >
                        <Trash2 size={13} />
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

      {/* Details modal with print-sheet style */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-3xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Vista de Orden de Compra</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{selectedOrder.codigo}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            </div>

            {/* Print wrapper */}
            <div className="flex-1 overflow-y-auto p-8 space-y-6 print-container" id="printable-order">
              
              {/* PDF Header Style */}
              <div className="flex justify-between items-start border-b border-gray-100 pb-5">
                <div className="space-y-1">
                  <h1 className="text-xl font-bold text-gray-950 tracking-tight">VENDORA</h1>
                  <p className="text-[12px] text-gray-400">Orden de Compra Oficial</p>
                  <p className="text-[11px] text-gray-400">
                    Fecha de Emisión: {new Date(selectedOrder.fecha).toLocaleDateString('es-CO')}
                  </p>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[14px] font-mono font-bold text-gray-900">{selectedOrder.codigo}</p>
                  <p className="text-[11px] text-gray-400">Estado: <span className="font-semibold text-gray-800 uppercase">{selectedOrder.estado}</span></p>
                </div>
              </div>

              {/* Business & Provider Info Card */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50/50 border border-gray-200/60 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Destinatario (Proveedor)</p>
                  <p className="text-[13px] font-bold text-gray-900">{selectedOrder.proveedores?.nombre}</p>
                  <p className="text-[12px] text-gray-600">Asesor: {selectedOrder.proveedores?.asesor || '—'}</p>
                  <p className="text-[11px] text-gray-500">Tel/WhatsApp: {selectedOrder.proveedores?.telefono || '—'}</p>
                  {selectedOrder.proveedores?.email && (
                    <p className="text-[11px] text-gray-500">Correo: {selectedOrder.proveedores.email}</p>
                  )}
                </div>

                <div className="p-4 bg-gray-50/50 border border-gray-200/60 rounded-xl flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Instrucciones de Recepción</p>
                    <p className="text-[11px] text-gray-600 mt-1">
                      Por favor despachar los productos listados a la dirección del comercio registrada en la configuración.
                    </p>
                  </div>
                  <div className="flex gap-1.5 mt-2 print:hidden">
                    <span className="text-[11px] text-gray-500">Cambiar estado:</span>
                    {(['pendiente', 'enviada', 'recibida'] as const).map(st => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(selectedOrder.id, st)}
                        className={[
                          'px-1.5 py-0.5 rounded text-[10px] font-semibold transition-colors border',
                          selectedOrder.estado === st
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'border-gray-200 hover:bg-gray-100 text-gray-600'
                        ].join(' ')}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                      <th className="px-4 py-2.5">Código / PLU</th>
                      <th className="px-4 py-2.5">Producto</th>
                      <th className="px-4 py-2.5 text-center">Cantidad</th>
                      <th className="px-4 py-2.5 text-right">Costo Unitario</th>
                      <th className="px-4 py-2.5 text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-[12px] text-gray-700">
                    {loadingDetails ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          Cargando ítems...
                        </td>
                      </tr>
                    ) : orderDetails.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          Sin productos asociados.
                        </td>
                      </tr>
                    ) : (
                      orderDetails.map((it) => (
                        <tr key={it.id}>
                          <td className="px-4 py-3 font-mono text-[11px]">{it.productos?.codigo_barras || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-gray-900">{it.productos?.nombre}</td>
                          <td className="px-4 py-3 text-center font-bold font-mono">x{it.cantidad}</td>
                          <td className="px-4 py-3 text-right font-mono">{formatCOP(it.costo_unitario)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-950">
                            {formatCOP(it.subtotal)}
                          </td>
                        </tr>
                      ))
                    )}
                    <tr className="bg-gray-50/50 font-bold">
                      <td colSpan={4} className="px-4 py-3 text-right text-gray-900 text-[12px]">Total Estimado</td>
                      <td className="px-4 py-3 text-right font-mono text-gray-950 text-[13px]">
                        {formatCOP(selectedOrder.costo_total)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Observations */}
              {selectedOrder.observaciones && (
                <div className="p-4 border border-gray-200 rounded-xl space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Notas Especiales</p>
                  <p className="text-[12px] text-gray-700 leading-relaxed">{selectedOrder.observaciones}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end shrink-0 print:hidden">
              <a
                href={getWhatsAppLink(selectedOrder, orderDetails)}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[12px] font-semibold transition-colors flex items-center gap-1.5"
              >
                <ExternalLink size={13} />
                Enviar por WhatsApp
              </a>
              <button
                onClick={handlePrint}
                className="h-9 px-4 border border-gray-200 text-[12px] font-semibold text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1.5"
              >
                <Printer size={13} />
                Imprimir Orden
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
