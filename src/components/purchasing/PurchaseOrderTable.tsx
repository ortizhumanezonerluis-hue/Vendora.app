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
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 overflow-y-auto print:hidden">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-[13px] font-bold text-gray-900">Vista de Orden de Compra</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{selectedOrder.codigo} · {selectedOrder.proveedores?.nombre}</p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
              >
                <X size={15} />
              </button>
            </div>

            {/* Print wrapper - Styled exactly like Image 2 */}
            <div className="flex-1 overflow-y-auto p-8 bg-white text-gray-800 space-y-8 print:p-0" id="printable-order">
              
              {/* TOP HEADER BLOCK */}
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-[12px]">
                  <div className="text-2xl font-bold tracking-tight text-gray-900">VENDORA</div>
                  <p className="font-semibold">{profile?.negocio_id ? 'Licencia SaaS Activa' : 'Comercio Registrado'}</p>
                  <p className="text-gray-500">Dirección: Local Principal</p>
                  <p className="text-gray-500">Teléfono: Registro de Configuración</p>
                </div>
                <div className="text-right space-y-3">
                  <h2 className="text-2xl font-bold tracking-wider text-gray-950">ORDEN DE COMPRA</h2>
                  <div className="inline-grid grid-cols-2 border border-gray-200 rounded-lg overflow-hidden text-[11px] text-center divide-x divide-gray-200">
                    <div className="bg-gray-50 px-3 py-1 font-semibold border-b border-gray-200">FECHA</div>
                    <div className="bg-gray-50 px-3 py-1 font-semibold border-b border-gray-200">OC #</div>
                    <div className="px-3 py-1.5 font-mono">{new Date(selectedOrder.fecha).toLocaleDateString('es-CO')}</div>
                    <div className="px-3 py-1.5 font-mono font-bold">{selectedOrder.codigo.replace('OC-2026-', '')}</div>
                  </div>
                </div>
              </div>

              {/* VENDEDOR & ENVIE A SECTION */}
              <div className="grid grid-cols-2 gap-8">
                {/* PROVEEDOR (VENDEDOR) */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-900 text-white text-[11px] font-bold px-4 py-2 uppercase tracking-wide">
                    Proveedor (Vendedor)
                  </div>
                  <div className="p-4 text-[12px] space-y-1.5">
                    <p className="font-bold text-gray-900 text-[13px]">{selectedOrder.proveedores?.nombre}</p>
                    {selectedOrder.proveedores?.asesor && (
                      <p><span className="text-gray-400">Atención / Asesor:</span> {selectedOrder.proveedores.asesor}</p>
                    )}
                    <p><span className="text-gray-400">Teléfono/WhatsApp:</span> {selectedOrder.proveedores?.telefono || '—'}</p>
                    {selectedOrder.proveedores?.email && (
                      <p><span className="text-gray-400">Email:</span> {selectedOrder.proveedores.email}</p>
                    )}
                  </div>
                </div>

                {/* DESTINO DE ENTREGA */}
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-900 text-white text-[11px] font-bold px-4 py-2 uppercase tracking-wide">
                    Enviar A (Destinatario)
                  </div>
                  <div className="p-4 text-[12px] space-y-1.5">
                    <p className="font-bold text-gray-900 text-[13px]">{profile?.nombre || 'Administración de Negocio'}</p>
                    <p><span className="text-gray-400">Dirección:</span> Despachar a la dirección registrada en configuración</p>
                    <p><span className="text-gray-400">Estado Orden:</span> <span className="font-bold uppercase text-amber-600">{selectedOrder.estado}</span></p>
                  </div>
                </div>
              </div>

              {/* SHIPPING LOGISTICS ROW */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200 font-bold text-gray-700 divide-x divide-gray-200">
                      <th className="px-4 py-2">REQUISAR</th>
                      <th className="px-4 py-2">EMBARCAR VÍA</th>
                      <th className="px-4 py-2">F.O.B.</th>
                      <th className="px-4 py-2">CONDICIONES DE ENVÍO</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-gray-200 text-gray-600">
                      <td className="px-4 py-2 font-mono">Reabastecimiento automático</td>
                      <td className="px-4 py-2">Terrestre / Proveedor</td>
                      <td className="px-4 py-2">Punto de Entrega</td>
                      <td className="px-4 py-2">Inmediato / Según Convenio</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ITEMS TABLE */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-950 text-white text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-4 py-2.5 w-32">ARTÍCULO # / PLU</th>
                      <th className="px-4 py-2.5">DESCRIPCIÓN</th>
                      <th className="px-4 py-2.5 text-center w-24">CANTIDAD</th>
                      <th className="px-4 py-2.5 text-right w-36">PRECIO UNITARIO</th>
                      <th className="px-4 py-2.5 text-right w-36">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-[12px] text-gray-700">
                    {loadingDetails ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          Cargando ítems de la orden...
                        </td>
                      </tr>
                    ) : orderDetails.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          Sin productos asociados a esta orden.
                        </td>
                      </tr>
                    ) : (
                      orderDetails.map((it) => (
                        <tr key={it.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-[11px] text-gray-500">{it.productos?.codigo_barras || '—'}</td>
                          <td className="px-4 py-3 font-semibold text-gray-950">{it.productos?.nombre}</td>
                          <td className="px-4 py-3 text-center font-bold font-mono">x{it.cantidad}</td>
                          <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCOP(it.costo_unitario)}</td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-gray-950">
                            {formatCOP(it.subtotal)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* TOTALS & NOTES LAYOUT */}
              <div className="grid grid-cols-12 gap-6 items-start">
                {/* Comments box */}
                <div className="col-span-7 border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 text-[10px] font-bold text-gray-500 px-4 py-2 uppercase tracking-wide border-b border-gray-200">
                    Comentarios o instrucciones especiales
                  </div>
                  <div className="p-4 min-h-[90px] text-[12px] text-gray-600 leading-relaxed">
                    {selectedOrder.observaciones || 'Favor despachar los productos en los horarios habituales de recepción y adjuntar la factura de venta correspondiente.'}
                  </div>
                </div>

                {/* Subtotals & totals table */}
                <div className="col-span-5 border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-[12px]">
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2.5 text-gray-500 font-medium">SUBTOTAL</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatCOP(selectedOrder.costo_total)}</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-gray-500 font-medium">IMPUESTO</td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-400">—</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-gray-500 font-medium">ENVÍO</td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-400">—</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2.5 text-gray-500 font-medium">OTRO</td>
                        <td className="px-4 py-2.5 text-right font-mono text-gray-400">—</td>
                      </tr>
                      <tr className="bg-gray-900 text-white font-bold">
                        <td className="px-4 py-3">TOTAL</td>
                        <td className="px-4 py-3 text-right font-mono text-[14px]">
                          {formatCOP(selectedOrder.costo_total)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Update Pill for Web Modal */}
              <div className="flex gap-2 items-center justify-end pt-4 border-t border-gray-100 print\:hidden">
                <span className="text-[11px] text-gray-400 font-medium">Marcar estado de la orden:</span>
                {(['pendiente', 'enviada', 'recibida'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(selectedOrder.id, st)}
                    className={[
                      'px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all border',
                      selectedOrder.estado === st
                        ? 'bg-gray-900 border-gray-900 text-white shadow-sm'
                        : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                    ].join(' ')}
                  >
                    {st}
                  </button>
                ))}
              </div>
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
