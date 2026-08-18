import { useState, useEffect, useMemo } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../components/auth/AuthContext'
import { formatCOP } from '../lib/utils'
import { toast } from '../components/ui/Toaster'
import { SkeletonPage } from '../components/ui/Skeleton'
import {
  Receipt, Search, Printer, CheckCircle2, Clock,
  XCircle, Filter, ChevronDown, X
} from 'lucide-react'

interface Ticket {
  id: string
  fecha: string
  usuario_id: string
  cajero?: string
  total: number
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia'
  estado: 'completada' | 'cancelada' | 'pendiente'
}

type FiltroEstado = 'todos' | 'completada' | 'cancelada'
type FiltroMetodo = 'todos' | 'efectivo' | 'tarjeta' | 'transferencia'

export default function ComprobantesPage() {
  const { profile } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [filtroMetodo, setFiltroMetodo] = useState<FiltroMetodo>('todos')
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)

  useEffect(() => {
    if (profile?.negocio_id) loadTickets()
  }, [profile])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select('id, fecha, usuario_id, cajero, total, metodo_pago, estado')
        .eq('negocio_id', profile!.negocio_id)
        .order('fecha', { ascending: false })
        .limit(500)

      if (error) throw error
      setTickets(data || [])
    } catch (err: any) {
      toast(err.message || 'Error cargando recibos', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        t.id.toLowerCase().includes(q) ||
        (t.cajero || t.usuario_id || '').toLowerCase().includes(q)
      const matchEstado = filtroEstado === 'todos' || t.estado === filtroEstado
      const matchMetodo = filtroMetodo === 'todos' || t.metodo_pago === filtroMetodo
      return matchSearch && matchEstado && matchMetodo
    })
  }, [tickets, search, filtroEstado, filtroMetodo])

  const totalFiltrado = useMemo(
    () => filtered.reduce((s, t) => s + (t.total || 0), 0),
    [filtered]
  )

  const handlePrint = (ticket: Ticket) => {
    const fecha = new Date(ticket.fecha).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    const cajero = ticket.cajero || ticket.usuario_id || 'Sistema'
    const ticketNum = ticket.id.slice(0, 8).toUpperCase()

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Recibo #${ticketNum}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; width: 280px; padding: 12px; }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .line { border-top: 1px dashed #000; margin: 6px 0; }
    .row { display: flex; justify-content: space-between; margin: 3px 0; }
    h2 { font-size: 16px; font-weight: bold; margin: 4px 0; }
    .total { font-size: 15px; font-weight: bold; }
    @media print { @page { margin: 0; size: 80mm auto; } }
  </style>
</head>
<body>
  <div class="center">
    <h2>RECIBO DE VENTA</h2>
    <p>Ticket #${ticketNum}</p>
    <p>${fecha}</p>
  </div>
  <div class="line"></div>
  <div class="row"><span>Cajero:</span><span>${cajero}</span></div>
  <div class="row"><span>Método de pago:</span><span style="text-transform:capitalize">${ticket.metodo_pago}</span></div>
  <div class="row"><span>Estado:</span><span style="text-transform:capitalize">${ticket.estado}</span></div>
  <div class="line"></div>
  <div class="row total"><span>TOTAL</span><span>${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(ticket.total)}</span></div>
  <div class="line"></div>
  <div class="center" style="margin-top:8px;font-size:10px">
    <p>Gracias por su compra</p>
    <p>Vendora — Sistema de Caja</p>
  </div>
  <script>window.onload=function(){window.print();window.close();}</script>
</body>
</html>`

    const w = window.open('', '_blank', 'width=320,height=420')
    if (w) {
      w.document.write(html)
      w.document.close()
    }
  }

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'completada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={10} /> Completada
          </span>
        )
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
            <XCircle size={10} /> Cancelada
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
            <Clock size={10} /> Pendiente
          </span>
        )
    }
  }

  const metodoBadge = (metodo: string) => {
    const colors: Record<string, string> = {
      efectivo: 'bg-blue-50 text-blue-700',
      tarjeta: 'bg-violet-50 text-violet-700',
      transferencia: 'bg-teal-50 text-teal-700'
    }
    return (
      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${colors[metodo] || 'bg-gray-100 text-gray-600'}`}>
        {metodo}
      </span>
    )
  }

  if (loading) {
    return (
      <MainLayout title="Comprobantes de Venta">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Comprobantes de Venta">
      <div className="p-5 space-y-4 max-w-[1200px]">

        {/* Header card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
              <Receipt className="text-gray-900" size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900">Historial de Recibos y Tickets</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {filtered.length} recibo{filtered.length !== 1 ? 's' : ''} · Total: <strong className="text-gray-700">{formatCOP(totalFiltrado)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={loadTickets}
            className="h-8 px-3.5 text-[11px] font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Actualizar
          </button>
        </div>

        {/* Filters bar */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por ID o cajero..."
              className="w-full h-8 pl-8 pr-3 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={12} />
              </button>
            )}
          </div>

          {/* Estado filter */}
          <div className="relative">
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
              className="h-8 pl-3 pr-7 text-[12px] border border-gray-200 rounded-lg bg-white focus:outline-none appearance-none cursor-pointer"
            >
              <option value="todos">Todos los estados</option>
              <option value="completada">Completada</option>
              <option value="cancelada">Cancelada</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Método filter */}
          <div className="relative">
            <select
              value={filtroMetodo}
              onChange={(e) => setFiltroMetodo(e.target.value as FiltroMetodo)}
              className="h-8 pl-3 pr-7 text-[12px] border border-gray-200 rounded-lg bg-white focus:outline-none appearance-none cursor-pointer"
            >
              <option value="todos">Todos los métodos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {(filtroEstado !== 'todos' || filtroMetodo !== 'todos' || search) && (
            <button
              onClick={() => { setFiltroEstado('todos'); setFiltroMetodo('todos'); setSearch('') }}
              className="h-8 px-3 text-[11px] font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <X size={11} />
              Limpiar filtros
            </button>
          )}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="h-52 bg-white border border-gray-100 rounded-xl flex flex-col items-center justify-center text-center p-6 shadow-sm">
            <Receipt size={22} className="text-gray-300 mb-2" />
            <p className="text-[13px] font-semibold text-gray-700">Sin recibos registrados</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Las ventas realizadas en el Punto de Venta aparecerán aquí</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[560px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-100">
                  <tr className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    <th className="px-5 py-3">Ticket #</th>
                    <th className="px-5 py-3">Fecha y Hora</th>
                    <th className="px-5 py-3">Cajero</th>
                    <th className="px-5 py-3">Método</th>
                    <th className="px-5 py-3">Estado</th>
                    <th className="px-5 py-3 text-right">Total</th>
                    <th className="px-5 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-[12px]">
                  {filtered.map((t) => {
                    const fecha = new Date(t.fecha).toLocaleString('es-CO', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit'
                    })
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-gray-900 text-[11px]">
                          #{t.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600">{fecha}</td>
                        <td className="px-5 py-3.5 font-medium text-gray-800">{t.cajero || t.usuario_id || '—'}</td>
                        <td className="px-5 py-3.5">{metodoBadge(t.metodo_pago)}</td>
                        <td className="px-5 py-3.5">{estadoBadge(t.estado)}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-gray-900">
                          {formatCOP(t.total)}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handlePrint(t)}
                            className="inline-flex items-center gap-1 h-7 px-2.5 border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 rounded-lg transition-colors"
                            title="Imprimir / descargar recibo"
                          >
                            <Printer size={12} />
                            Imprimir
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
      </div>
    </MainLayout>
  )
}
