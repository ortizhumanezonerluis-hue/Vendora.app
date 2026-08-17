import { useState, useEffect } from 'react'
import { reorderService, OrdenCompra } from '../../services/reorderService'
import { useAuth } from '../auth/AuthContext'
import { formatCOP } from '../../lib/utils'
import { toast } from '../ui/Toaster'
import { supabase } from '../../lib/supabaseClient'
import {
  FileText, Calendar, User, ShoppingBag, X,
  ExternalLink, Printer, Check, ArrowUpRight, Trash2
} from 'lucide-react'

interface BusinessConfig {
  nombre: string
  direccion: string
  telefono: string
}

export default function PurchaseOrderTable() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [businessConfig, setBusinessConfig] = useState<BusinessConfig | null>(null)

  // Selected order details modal
  const [selectedOrder, setSelectedOrder] = useState<OrdenCompra | null>(null)
  const [orderDetails, setOrderDetails] = useState<any[]>([])
  const [loadingDetails, setLoadingDetails] = useState(false)

  useEffect(() => {
    loadOrders()
    loadBusinessConfig()
  }, [profile])

  const loadBusinessConfig = async () => {
    if (!profile?.negocio_id) return
    try {
      const { data } = await supabase
        .from('configuracion_negocio')
        .select('nombre, direccion, telefono')
        .eq('negocio_id', profile.negocio_id)
        .limit(1)
        .maybeSingle()
      if (data) {
        setBusinessConfig({
          nombre: data.nombre || '',
          direccion: data.direccion || '',
          telefono: data.telefono || ''
        })
      }
    } catch (err) {
      console.warn('Could not load business config for PO header:', err)
    }
  }

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

  /**
   * Opens a fresh blank window with a clean, self-contained HTML document
   * so the browser prints a proper professional page — NOT a screenshot of the modal.
   */
  const handlePrint = () => {
    if (!selectedOrder) return

    const negocioNombre = businessConfig?.nombre || 'Mi Negocio'
    const negocioDireccion = businessConfig?.direccion || '—'
    const negocioTelefono = businessConfig?.telefono || '—'
    const proveedorNombre = selectedOrder.proveedores?.nombre || '—'
    const proveedorAsesor = selectedOrder.proveedores?.asesor || ''
    const proveedorTel = selectedOrder.proveedores?.telefono || '—'
    const proveedorEmail = selectedOrder.proveedores?.email || ''
    const fecha = new Date(selectedOrder.fecha).toLocaleDateString('es-CO')
    const ocNum = selectedOrder.codigo.replace('OC-2026-', '').replace('OC-', '')
    const estado = selectedOrder.estado?.toUpperCase() || 'PENDIENTE'
    const observaciones = selectedOrder.observaciones || 'Favor adjuntar factura de venta y despachar en horario habitual de recepción.'

    const itemsHtml = orderDetails.map(it => `
      <tr>
        <td style="padding:8px 10px;font-family:monospace;font-size:11px;color:#6b7280;border-bottom:1px solid #f3f4f6;">${it.productos?.codigo_barras || '—'}</td>
        <td style="padding:8px 10px;font-size:12px;font-weight:600;border-bottom:1px solid #f3f4f6;">${it.productos?.nombre || '—'}</td>
        <td style="padding:8px 10px;text-align:center;font-family:monospace;font-weight:700;border-bottom:1px solid #f3f4f6;">x${it.cantidad}</td>
        <td style="padding:8px 10px;text-align:right;font-family:monospace;font-size:12px;border-bottom:1px solid #f3f4f6;">${formatCOP(it.costo_unitario)}</td>
        <td style="padding:8px 10px;text-align:right;font-family:monospace;font-weight:700;border-bottom:1px solid #f3f4f6;">${formatCOP(it.subtotal)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Orden de Compra ${selectedOrder.codigo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', Arial, sans-serif;
      font-size: 13px;
      color: #111827;
      background: #fff;
      padding: 32px 40px;
    }
    h1 { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    h2 { font-size: 22px; font-weight: 800; letter-spacing: 1px; color: #111827; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
    .header-left p { font-size: 12px; color: #6b7280; margin-top: 3px; }
    .oc-box { border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; text-align: center; }
    .oc-box .labels { display: grid; grid-template-columns: 1fr 1fr; border-bottom: 1px solid #e5e7eb; }
    .oc-box .labels span { background: #f9fafb; padding: 5px 16px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
    .oc-box .labels span:first-child { border-right: 1px solid #e5e7eb; }
    .oc-box .values { display: grid; grid-template-columns: 1fr 1fr; }
    .oc-box .values span { padding: 8px 16px; font-family: monospace; font-size: 12px; }
    .oc-box .values span:first-child { border-right: 1px solid #e5e7eb; }
    .oc-box .values span:last-child { font-weight: 700; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
    .card { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    .card-header { background: #111827; color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 8px 14px; }
    .card-body { padding: 14px; font-size: 12px; line-height: 1.8; }
    .card-body strong { font-size: 13px; }
    .card-body .label { color: #9ca3af; }
    table { width: 100%; border-collapse: collapse; }
    thead tr { background: #111827; color: #fff; }
    thead th { padding: 9px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
    thead th:nth-child(3) { text-align: center; }
    thead th:nth-child(4), thead th:nth-child(5) { text-align: right; }
    .logistics-table thead tr { background: #f9fafb; color: #374151; border-bottom: 1px solid #e5e7eb; }
    .logistics-table thead th { font-size: 10px; font-weight: 700; padding: 8px 10px; }
    .logistics-table tbody td { padding: 8px 10px; font-size: 11px; color: #6b7280; border-right: 1px solid #f3f4f6; }
    .bottom-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .notes-box { border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    .notes-header { background: #f9fafb; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 8px 14px; border-bottom: 1px solid #e5e7eb; color: #6b7280; }
    .notes-body { padding: 14px; font-size: 12px; color: #6b7280; line-height: 1.6; min-height: 80px; }
    .totals-table td { padding: 8px 14px; font-size: 12px; border-bottom: 1px solid #f3f4f6; }
    .totals-table td:last-child { text-align: right; font-family: monospace; font-weight: 600; }
    .totals-table .total-row td { background: #111827; color: #fff; font-weight: 700; font-size: 14px; padding: 11px 14px; }
    .totals-table .total-row td:last-child { font-family: monospace; }
    .section { margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    .items-table-wrap { margin-bottom: 16px; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
    @media print {
      body { padding: 16px 24px; }
      @page { size: A4 portrait; margin: 12mm; }
    }
  </style>
</head>
<body>
  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
      <h1>${negocioNombre}</h1>
      <p>${negocioDireccion}</p>
      <p>Tel: ${negocioTelefono}</p>
    </div>
    <div style="text-align:right;">
      <h2>ORDEN DE COMPRA</h2>
      <div style="margin-top:10px;">
        <div class="oc-box">
          <div class="labels"><span>FECHA</span><span>OC #</span></div>
          <div class="values"><span>${fecha}</span><span>${ocNum}</span></div>
        </div>
        <p style="margin-top:6px;font-size:11px;color:#d97706;font-weight:700;">Estado: ${estado}</p>
      </div>
    </div>
  </div>

  <!-- PROVEEDOR / DESTINATARIO -->
  <div class="grid-2">
    <div class="card">
      <div class="card-header">Proveedor (Vendedor)</div>
      <div class="card-body">
        <strong>${proveedorNombre}</strong><br/>
        ${proveedorAsesor ? `<span class="label">Asesor:</span> ${proveedorAsesor}<br/>` : ''}
        <span class="label">Tel/WhatsApp:</span> ${proveedorTel}<br/>
        ${proveedorEmail ? `<span class="label">Email:</span> ${proveedorEmail}` : ''}
      </div>
    </div>
    <div class="card">
      <div class="card-header">Enviar A (Destinatario)</div>
      <div class="card-body">
        <strong>${negocioNombre}</strong><br/>
        <span class="label">Dirección:</span> ${negocioDireccion}<br/>
        <span class="label">Tel:</span> ${negocioTelefono}
      </div>
    </div>
  </div>

  <!-- LOGISTICS ROW -->
  <div class="section">
    <table class="logistics-table">
      <thead>
        <tr>
          <th>REQUISAR</th><th>EMBARCAR VÍA</th><th>F.O.B.</th><th>CONDICIONES DE ENVÍO</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Reabastecimiento</td>
          <td>Terrestre / Proveedor</td>
          <td>Punto de Entrega</td>
          <td>Inmediato / Según Convenio</td>
        </tr>
      </tbody>
    </table>
  </div>

  <!-- ITEMS TABLE -->
  <div class="items-table-wrap">
    <table>
      <thead>
        <tr>
          <th>ARTÍCULO # / PLU</th>
          <th>DESCRIPCIÓN</th>
          <th style="text-align:center;">CANTIDAD</th>
          <th style="text-align:right;">P/U</th>
          <th style="text-align:right;">TOTAL</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml || '<tr><td colspan="5" style="padding:16px;text-align:center;color:#9ca3af;">Sin productos en esta orden</td></tr>'}
      </tbody>
    </table>
  </div>

  <!-- NOTES + TOTALS -->
  <div class="bottom-grid">
    <div class="notes-box">
      <div class="notes-header">Comentarios o instrucciones especiales</div>
      <div class="notes-body">${observaciones}</div>
    </div>
    <div class="card" style="padding:0;">
      <table class="totals-table" style="width:100%;">
        <tbody>
          <tr>
            <td style="color:#6b7280;font-weight:500;">SUBTOTAL</td>
            <td style="text-align:right;font-family:monospace;font-weight:600;">${formatCOP(selectedOrder.costo_total)}</td>
          </tr>
          <tr class="total-row">
            <td>TOTAL</td>
            <td style="text-align:right;font-family:monospace;">${formatCOP(selectedOrder.costo_total)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`

    const printWindow = window.open('', '_blank', 'width=900,height=700')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
    }
  }

  const getWhatsAppLink = (order: OrdenCompra, items: any[]) => {
    const providerName = order.proveedores?.nombre || 'Proveedor'
    const code = order.codigo
    const dateLabel = new Date(order.fecha).toLocaleDateString('es-CO')
    
    let text = `*Orden de Compra ${code}* - ${businessConfig?.nombre || 'Vendora'}\n`
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

      {/* Details modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4 overflow-y-auto">
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

            {/* Preview body */}
            <div className="flex-1 overflow-y-auto p-8 bg-white text-gray-800 space-y-6">

              {/* Header */}
              <div className="flex justify-between items-start">
                <div className="space-y-1 text-[12px]">
                  <div className="text-xl font-bold tracking-tight text-gray-900">{businessConfig?.nombre || 'Mi Negocio'}</div>
                  <p className="text-gray-500">{businessConfig?.direccion || '—'}</p>
                  <p className="text-gray-500">Tel: {businessConfig?.telefono || '—'}</p>
                </div>
                <div className="text-right space-y-3">
                  <h2 className="text-xl font-bold tracking-wider text-gray-950">ORDEN DE COMPRA</h2>
                  <div className="inline-grid grid-cols-2 border border-gray-200 rounded-lg overflow-hidden text-[11px] text-center divide-x divide-gray-200">
                    <div className="bg-gray-50 px-3 py-1 font-semibold border-b border-gray-200">FECHA</div>
                    <div className="bg-gray-50 px-3 py-1 font-semibold border-b border-gray-200">OC #</div>
                    <div className="px-3 py-1.5 font-mono">{new Date(selectedOrder.fecha).toLocaleDateString('es-CO')}</div>
                    <div className="px-3 py-1.5 font-mono font-bold">{selectedOrder.codigo.replace('OC-2026-', '')}</div>
                  </div>
                  <p className="text-[10px] font-bold text-amber-600 uppercase">{selectedOrder.estado}</p>
                </div>
              </div>

              {/* Proveedor / Destinatario */}
              <div className="grid grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 uppercase tracking-wide">
                    Proveedor (Vendedor)
                  </div>
                  <div className="p-4 text-[12px] space-y-1">
                    <p className="font-bold text-gray-900 text-[13px]">{selectedOrder.proveedores?.nombre}</p>
                    {selectedOrder.proveedores?.asesor && (
                      <p><span className="text-gray-400">Asesor:</span> {selectedOrder.proveedores.asesor}</p>
                    )}
                    <p><span className="text-gray-400">Tel/WhatsApp:</span> {selectedOrder.proveedores?.telefono || '—'}</p>
                    {selectedOrder.proveedores?.email && (
                      <p><span className="text-gray-400">Email:</span> {selectedOrder.proveedores.email}</p>
                    )}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-900 text-white text-[10px] font-bold px-4 py-2 uppercase tracking-wide">
                    Enviar A (Destinatario)
                  </div>
                  <div className="p-4 text-[12px] space-y-1">
                    <p className="font-bold text-gray-900 text-[13px]">{businessConfig?.nombre || 'Mi Negocio'}</p>
                    <p><span className="text-gray-400">Dirección:</span> {businessConfig?.direccion || '—'}</p>
                    <p><span className="text-gray-400">Tel:</span> {businessConfig?.telefono || '—'}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-950 text-white text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-4 py-2.5 w-32">Artículo # / PLU</th>
                      <th className="px-4 py-2.5">Descripción</th>
                      <th className="px-4 py-2.5 text-center w-20">Cant.</th>
                      <th className="px-4 py-2.5 text-right w-32">P/U</th>
                      <th className="px-4 py-2.5 text-right w-32">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-[12px] text-gray-700">
                    {loadingDetails ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando ítems...</td></tr>
                    ) : orderDetails.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Sin productos asociados.</td></tr>
                    ) : (
                      orderDetails.map((it) => (
                        <tr key={it.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-2.5 font-mono text-[11px] text-gray-500">{it.productos?.codigo_barras || '—'}</td>
                          <td className="px-4 py-2.5 font-semibold text-gray-900">{it.productos?.nombre}</td>
                          <td className="px-4 py-2.5 text-center font-bold font-mono">x{it.cantidad}</td>
                          <td className="px-4 py-2.5 text-right font-mono text-gray-600">{formatCOP(it.costo_unitario)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold">{formatCOP(it.subtotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Notes + Totals */}
              <div className="grid grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 text-[10px] font-bold text-gray-500 px-4 py-2 uppercase tracking-wide border-b border-gray-200">
                    Comentarios o instrucciones especiales
                  </div>
                  <div className="p-4 min-h-[80px] text-[12px] text-gray-600 leading-relaxed">
                    {selectedOrder.observaciones || 'Favor adjuntar factura de venta y despachar en horario habitual de recepción.'}
                  </div>
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <table className="w-full text-[12px]">
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-2.5 text-gray-500 font-medium">SUBTOTAL</td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold">{formatCOP(selectedOrder.costo_total)}</td>
                      </tr>
                      <tr className="bg-gray-900 text-white font-bold">
                        <td className="px-4 py-3">TOTAL</td>
                        <td className="px-4 py-3 text-right font-mono text-[14px]">{formatCOP(selectedOrder.costo_total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status change pills (web only) */}
              <div className="flex gap-2 items-center justify-end pt-2 border-t border-gray-100">
                <span className="text-[11px] text-gray-400 font-medium">Marcar estado:</span>
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

            {/* Action bar */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-2 justify-end shrink-0">
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
