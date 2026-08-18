import { useState, useEffect, useMemo, useRef } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../components/auth/AuthContext'
import { formatCOP } from '../lib/utils'
import { toast } from '../components/ui/Toaster'
import { SkeletonPage } from '../components/ui/Skeleton'
import {
  Receipt, Search, Printer, CheckCircle2, Clock,
  XCircle, ChevronDown, X, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight
} from 'lucide-react'

interface TicketItem {
  cantidad: number
  precio_unitario: number
  subtotal?: number
  productos?: {
    nombre: string
  } | null
}

interface Ticket {
  id: string
  fecha: string
  usuario_id: string
  cajero?: string
  total: number
  metodo_pago: 'efectivo' | 'tarjeta' | 'transferencia'
  estado: 'completada' | 'cancelada' | 'pendiente'
  detalles_venta?: TicketItem[]
}

type FiltroEstado = 'todos' | 'completada' | 'cancelada'
type FiltroMetodo = 'todos' | 'efectivo' | 'tarjeta' | 'transferencia'
type DatePreset = '7dias' | '15dias' | '30dias' | '60dias' | 'personalizado'

export default function ComprobantesPage() {
  const { profile } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos')
  const [filtroMetodo, setFiltroMetodo] = useState<FiltroMetodo>('todos')
  const [businessConfig, setBusinessConfig] = useState<{
    nombre?: string
    direccion?: string
    telefono?: string
  }>({})

  // Date range state
  const [datePreset, setDatePreset] = useState<DatePreset>('7dias')
  const [rangeStart, setRangeStart] = useState<Date | null>(null)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const datePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (profile?.negocio_id) {
      loadBusinessConfig()
      loadTickets()
    }
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
      console.warn('Could not load business config for ticket:', err)
    }
  }

  // Close date picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadTickets = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('ventas')
        .select(`
          id, fecha, usuario_id, cajero, total, metodo_pago, estado,
          detalles_venta (
            cantidad, precio_unitario, subtotal,
            productos (
              nombre
            )
          )
        `)
        .eq('negocio_id', profile!.negocio_id)
        .order('fecha', { ascending: false })
        .limit(1000)

      if (error) throw error
      setTickets((data as any) || [])
    } catch (err: any) {
      toast(err.message || 'Error cargando recibos', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Calendar helpers
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const date = new Date(year, month, 1)
    const days: (Date | null)[] = []
    const firstDayIndex = date.getDay()
    for (let i = 0; i < firstDayIndex; i++) days.push(null)
    while (date.getMonth() === month) {
      days.push(new Date(date))
      date.setDate(date.getDate() + 1)
    }
    return days
  }, [currentMonth])

  const changeMonth = (val: number) => {
    const next = new Date(currentMonth)
    next.setMonth(next.getMonth() + val)
    setCurrentMonth(next)
  }

  const handleSelectDay = (day: Date) => {
    if (!rangeStart || (rangeStart && rangeEnd)) {
      setRangeStart(day)
      setRangeEnd(null)
    } else {
      if (day < rangeStart) {
        setRangeEnd(rangeStart)
        setRangeStart(day)
      } else {
        setRangeEnd(day)
      }
      setDatePreset('personalizado')
      setShowDatePicker(false)
    }
  }

  const isInRange = (day: Date) => {
    if (!rangeStart) return false
    const end = rangeEnd || hoverDate
    if (!end) return false
    return day > rangeStart && day < end
  }

  const rangeDateLabel = () => {
    if (rangeStart && rangeEnd) {
      const fmt = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
      return `${fmt(rangeStart)} → ${fmt(rangeEnd)}`
    } else if (rangeStart) {
      return rangeStart.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) + ' →...'
    }
    return 'Rango personalizado'
  }

  const monthLabel = currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  // Main filter
  const filtered = useMemo(() => {
    const now = new Date()
    return tickets.filter((t) => {
      const saleDate = new Date(t.fecha)

      // Date filter
      let dateMatch = true
      if (datePreset === '7dias') {
        const cutoff = new Date(now); cutoff.setDate(now.getDate() - 7); dateMatch = saleDate >= cutoff
      } else if (datePreset === '15dias') {
        const cutoff = new Date(now); cutoff.setDate(now.getDate() - 15); dateMatch = saleDate >= cutoff
      } else if (datePreset === '30dias') {
        const cutoff = new Date(now); cutoff.setDate(now.getDate() - 30); dateMatch = saleDate >= cutoff
      } else if (datePreset === '60dias') {
        const cutoff = new Date(now); cutoff.setDate(now.getDate() - 60); dateMatch = saleDate >= cutoff
      } else if (datePreset === 'personalizado') {
        if (rangeStart && rangeEnd) {
          const start = new Date(rangeStart); start.setHours(0, 0, 0, 0)
          const end = new Date(rangeEnd); end.setHours(23, 59, 59, 999)
          dateMatch = saleDate >= start && saleDate <= end
        } else if (rangeStart) {
          dateMatch = saleDate.toDateString() === rangeStart.toDateString()
        }
      }

      // Text search
      const q = search.toLowerCase()
      const matchSearch = !q ||
        t.id.toLowerCase().includes(q) ||
        (t.cajero || t.usuario_id || '').toLowerCase().includes(q)

      const matchEstado = filtroEstado === 'todos' || t.estado === filtroEstado
      const matchMetodo = filtroMetodo === 'todos' || t.metodo_pago === filtroMetodo

      return dateMatch && matchSearch && matchEstado && matchMetodo
    })
  }, [tickets, search, filtroEstado, filtroMetodo, datePreset, rangeStart, rangeEnd])

  const totalFiltrado = useMemo(() => filtered.reduce((s, t) => s + (t.total || 0), 0), [filtered])

  // --- PRINT: Clean, professional, realistic POS ticket ---
  const handlePrint = (ticket: Ticket) => {
    const fecha = new Date(ticket.fecha).toLocaleString('es-CO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    const cajero = ticket.cajero || ticket.usuario_id || 'Cajero'
    const ticketNum = ticket.id.slice(0, 8).toUpperCase()
    const storeName = businessConfig.nombre || profile?.negocio?.nombre || "Vendora"
    const storeAddress = businessConfig.direccion || ''
    const storePhone = businessConfig.telefono || ''

    const totalFmt = new Intl.NumberFormat('es-CO', {
      style: 'currency', currency: 'COP', minimumFractionDigits: 0
    }).format(ticket.total)

    const metodoLabel: Record<string, string> = {
      efectivo: 'Efectivo',
      tarjeta: 'Tarjeta',
      transferencia: 'Transferencia'
    }

    const items = ticket.detalles_venta || []
    const itemsRows = items.length > 0
      ? items.map(item => {
          const name = item.productos?.nombre || 'Producto'
          const qty = item.cantidad || 1
          const unitPrice = item.precio_unitario || 0
          const subtotal = item.subtotal || (qty * unitPrice)
          const subtotalFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(subtotal)
          const unitFmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(unitPrice)

          return `
            <tr>
              <td style="padding: 4px 0; font-weight: 600; vertical-align: top;">${qty}x</td>
              <td style="padding: 4px 6px; vertical-align: top;">
                <div>${name}</div>
                <div style="font-size: 11px; color: #666;">${unitFmt} c/u</div>
              </td>
              <td style="padding: 4px 0; text-align: right; font-weight: 600; vertical-align: top;">${subtotalFmt}</td>
            </tr>
          `
        }).join('')
      : `
        <tr>
          <td colspan="3" style="padding: 8px 0; text-align: center; color: #777;">
            1x Venta registrada (${totalFmt})
          </td>
        </tr>
      `

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Ticket #${ticketNum}</title>
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: 100%;
      background: #f1f5f9;
      display: flex;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      font-size: 13px;
      line-height: 1.4;
      padding: 20px 0;
    }
    .ticket {
      background: #ffffff;
      width: 340px;
      padding: 24px 20px;
      margin: 0 auto;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      border-radius: 6px;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .store-name {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.3px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .store-info {
      font-size: 11px;
      color: #4b5563;
      margin-bottom: 2px;
    }
    .divider {
      border-top: 1px dashed #9ca3af;
      margin: 12px 0;
    }
    .ticket-title {
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 6px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #374151;
      margin: 2px 0;
    }
    .meta-row .label { color: #6b7280; }
    .meta-row .val { font-weight: 600; }
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      margin: 4px 0;
    }
    table.items-table th {
      font-size: 10px;
      font-weight: 700;
      color: #6b7280;
      text-transform: uppercase;
      padding-bottom: 4px;
      border-bottom: 1px solid #e5e7eb;
    }
    .total-box {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px dashed #9ca3af;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      font-size: 16px;
      font-weight: 800;
      margin-top: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 14px;
      font-size: 11px;
      color: #6b7280;
      line-height: 1.5;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .ticket {
        border: none;
        box-shadow: none;
        width: 100%;
        max-width: 300px;
        padding: 8px;
      }
    }
  </style>
</head>
<body>
  <div class="ticket">
    <!-- Header -->
    <div class="text-center">
      <div class="store-name">${storeName}</div>
      ${storeAddress ? `<div class="store-info">${storeAddress}</div>` : ''}
      ${storePhone ? `<div class="store-info">Tel: ${storePhone}</div>` : ''}
      <div class="divider"></div>
      <div class="ticket-title">Comprobante de Venta</div>
      <div style="font-size: 12px; font-weight: 700; font-family: monospace;">TICKET #${ticketNum}</div>
    </div>

    <div class="divider"></div>

    <!-- Metadata -->
    <div>
      <div class="meta-row">
        <span class="label">Fecha y hora:</span>
        <span class="val">${fecha}</span>
      </div>
      <div class="meta-row">
        <span class="label">Atendido por:</span>
        <span class="val">${cajero}</span>
      </div>
      <div class="meta-row">
        <span class="label">Método de pago:</span>
        <span class="val">${metodoLabel[ticket.metodo_pago] || ticket.metodo_pago}</span>
      </div>
      <div class="meta-row">
        <span class="label">Estado:</span>
        <span class="val" style="text-transform: capitalize;">${ticket.estado}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Items table -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="text-align: left; width: 35px;">Cant</th>
          <th style="text-align: left;">Descripción</th>
          <th style="text-align: right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- Totals -->
    <div class="total-box">
      <div class="total-line">
        <span>TOTAL</span>
        <span>${totalFmt}</span>
      </div>
    </div>

    <div class="divider"></div>

    <!-- Footer -->
    <div class="footer">
      <p style="font-weight: 600; color: #374151;">¡Gracias por su compra!</p>
      <p style="font-size: 10px; margin-top: 3px;">Documento interno de control de caja</p>
      <p style="font-size: 10px; color: #9ca3af;">Vendora POS</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 400);
    };
  </script>
</body>
</html>`

    const w = window.open('', '_blank', 'width=460,height=750,left=200,top=50')
    if (w) {
      w.document.write(html)
      w.document.close()
    }
  }

  const estadoBadge = (estado: string) => {
    switch (estado) {
      case 'completada':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700"><CheckCircle2 size={10} />Completada</span>
      case 'cancelada':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700"><XCircle size={10} />Cancelada</span>
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700"><Clock size={10} />Pendiente</span>
    }
  }

  const metodoBadge = (metodo: string) => {
    const colors: Record<string, string> = {
      efectivo: 'bg-blue-50 text-blue-700',
      tarjeta: 'bg-violet-50 text-violet-700',
      transferencia: 'bg-teal-50 text-teal-700'
    }
    return <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${colors[metodo] || 'bg-gray-100 text-gray-600'}`}>{metodo}</span>
  }

  if (loading) {
    return <MainLayout title="Comprobantes de Venta"><SkeletonPage /></MainLayout>
  }

  const PRESETS: { key: DatePreset; label: string }[] = [
    { key: '7dias', label: 'Últ. 7 días' },
    { key: '15dias', label: '15 días' },
    { key: '30dias', label: '30 días' },
    { key: '60dias', label: '60 días' },
  ]

  return (
    <MainLayout title="Comprobantes de Venta">
      <div className="p-5 space-y-4">

        {/* Header card */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
          <div className="flex gap-4 items-center">
            <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 shrink-0">
              <Receipt className="text-gray-900" size={18} />
            </div>
            <div>
              <p className="text-[13px] font-bold text-gray-900">Historial de Recibos y Tickets</p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                {filtered.length} recibo{filtered.length !== 1 ? 's' : ''} · Total:{' '}
                <strong className="text-gray-700">{formatCOP(totalFiltrado)}</strong>
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
          <div className="relative flex-1 min-w-[160px]">
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

          {/* Date presets */}
          <div className="flex items-center gap-1">
            <CalendarIcon size={13} className="text-gray-400 shrink-0" />
            {PRESETS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setDatePreset(key); setRangeStart(null); setRangeEnd(null) }}
                className={[
                  'px-2.5 py-1 rounded text-[11px] font-medium transition-colors',
                  datePreset === key
                    ? 'bg-gray-900 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                ].join(' ')}
              >
                {label}
              </button>
            ))}

            {/* Custom date picker */}
            <div className="relative" ref={datePickerRef}>
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className={[
                  'px-2.5 py-1 border border-gray-200 rounded text-[11px] font-medium transition-colors hover:bg-gray-50 flex items-center gap-1.5 bg-white text-gray-700',
                  datePreset === 'personalizado' ? 'border-gray-900 text-gray-900 bg-gray-50 font-semibold' : ''
                ].join(' ')}
              >
                {datePreset === 'personalizado' ? rangeDateLabel() : 'Personalizado'}
              </button>

              {showDatePicker && (
                <div className="absolute left-0 mt-2.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="flex items-center justify-between mb-3">
                    <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-[12px] font-semibold text-gray-900 capitalize">{monthLabel}</span>
                    <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center mb-1">
                    {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((d) => (
                      <span key={d} className="text-[10px] font-semibold text-gray-400 uppercase">{d}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {daysInMonth.map((day, idx) => {
                      if (!day) return <div key={`e-${idx}`} />
                      const isStart = rangeStart && day.toDateString() === rangeStart.toDateString()
                      const isEnd = rangeEnd && day.toDateString() === rangeEnd.toDateString()
                      const inRange = isInRange(day)
                      const isToday = day.toDateString() === new Date().toDateString()
                      return (
                        <button
                          key={day.toISOString()}
                          type="button"
                          onClick={() => handleSelectDay(day)}
                          onMouseEnter={() => setHoverDate(day)}
                          onMouseLeave={() => setHoverDate(null)}
                          className={[
                            'h-7 w-7 text-[11px] font-medium flex items-center justify-center transition-colors',
                            isStart || isEnd
                              ? 'bg-gray-900 text-white font-semibold rounded-md'
                              : inRange
                              ? 'bg-gray-100 text-gray-800 rounded-none'
                              : isToday
                              ? 'bg-gray-50 text-gray-900 border border-gray-200 rounded-md'
                              : 'text-gray-700 hover:bg-gray-100 rounded-md'
                          ].join(' ')}
                        >
                          {day.getDate()}
                        </button>
                      )
                    })}
                  </div>

                  {rangeStart && !rangeEnd && (
                    <p className="text-[10px] text-gray-400 mt-2 text-center">Selecciona la fecha de fin</p>
                  )}
                </div>
              )}
            </div>
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
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
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
            <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Clear filters */}
          {(filtroEstado !== 'todos' || filtroMetodo !== 'todos' || search || datePreset !== '7dias') && (
            <button
              onClick={() => {
                setFiltroEstado('todos')
                setFiltroMetodo('todos')
                setSearch('')
                setDatePreset('7dias')
                setRangeStart(null)
                setRangeEnd(null)
              }}
              className="h-8 px-3 text-[11px] font-semibold text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
            >
              <X size={11} />
              Limpiar
            </button>
          )}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="h-52 bg-white border border-gray-100 rounded-xl flex flex-col items-center justify-center text-center p-6 shadow-sm">
            <Receipt size={22} className="text-gray-300 mb-2" />
            <p className="text-[13px] font-semibold text-gray-700">Sin recibos en este período</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Cambia el rango de fechas o los filtros activos</p>
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
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-gray-900">{formatCOP(t.total)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => handlePrint(t)}
                            className="inline-flex items-center gap-1 h-7 px-2.5 border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 rounded-lg transition-colors"
                            title="Imprimir recibo"
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
