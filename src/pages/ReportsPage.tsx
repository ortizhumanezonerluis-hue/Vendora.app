import { useState, useEffect, useMemo, useRef } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { supabase } from '../lib/supabaseClient'
import { formatCOP } from '../lib/utils'
import { toast } from '../components/ui/Toaster'
import { Select } from '../components/ui/Select'
import { SkeletonPage } from '../components/ui/Skeleton'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from 'recharts'
import {
  Calendar as CalendarIcon, Users, Download, ArrowUpRight, ChevronLeft, ChevronRight
} from 'lucide-react'
import { useAuth } from '../components/auth/AuthContext'

interface ReportSale {
  id: string
  total: number
  metodo_pago: string
  cajero: string
  usuario_id: string
  fecha: string
  detalles_venta: {
    cantidad: number
    precio_unitario: number
    productos: {
      nombre: string
      precio_costo: number
    }
  }[]
}

export default function ReportsPage() {
  const { profile } = useAuth()
  const [sales, setSales] = useState<ReportSale[]>([])
  const [usersList, setUsersList] = useState<{ nombre: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [dateRange, setDateRange] = useState<'hoy' | '7dias' | 'mes' | 'personalizado' | 'todos'>('7dias')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  
  // Custom DatePicker Range State
  const [rangeStart, setRangeStart] = useState<Date | null>(null)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const datePickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function loadData() {
      if (!profile) return
      setLoading(true)
      try {
        let salesQuery = supabase
          .from('ventas')
          .select(`
            id, total, metodo_pago, cajero, usuario_id, fecha,
            detalles_venta (
              cantidad, precio_unitario,
              productos (
                nombre, precio_costo
              )
            )
          `)
          .order('fecha', { ascending: false })

        if (profile.negocio_id) {
          salesQuery = salesQuery.eq('negocio_id', profile.negocio_id)
        }

        const { data: salesData, error: salesError } = await salesQuery
        if (salesError) throw salesError
        setSales((salesData as any) || [])

        // Fetch users belonging to the same business tenant
        let usersQuery = supabase
          .from('usuarios')
          .select('nombre')
          .order('nombre')

        if (profile.negocio_id) {
          usersQuery = usersQuery.eq('negocio_id', profile.negocio_id)
        }

        const { data: usersData } = await usersQuery
        setUsersList(usersData || [])
      } catch (err: any) {
        console.error('Error cargando reportes:', err)
        setError(err.message || 'Error al conectar con la base de datos')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [profile])

  // Click outside DatePicker handler
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  // Filter logic
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const saleDate = new Date(s.fecha)
      const now = new Date()
      let dateMatch = true

      if (dateRange === 'hoy') {
        dateMatch = saleDate.toDateString() === now.toDateString()
      } else if (dateRange === '7dias') {
        const diffTime = Math.abs(now.getTime() - saleDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        dateMatch = diffDays <= 7
      } else if (dateRange === 'mes') {
        dateMatch = saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
      } else if (dateRange === 'personalizado') {
        if (rangeStart && rangeEnd) {
          const start = new Date(rangeStart)
          start.setHours(0, 0, 0, 0)
          const end = new Date(rangeEnd)
          end.setHours(23, 59, 59, 999)
          dateMatch = saleDate >= start && saleDate <= end
        } else if (rangeStart) {
          dateMatch = saleDate.toDateString() === rangeStart.toDateString()
        }
      }

      // Check both 'cajero' and 'usuario_id' columns for cashier match
      const userMatch = selectedUser === 'all' || 
                        s.cajero === selectedUser || 
                        s.usuario_id === selectedUser

      return dateMatch && userMatch
    })
  }, [sales, dateRange, selectedUser, rangeStart, rangeEnd])

  // Calculation metrics
  const metrics = useMemo(() => {
    let salesTotal = 0
    let totalCost = 0

    filteredSales.forEach((s) => {
      salesTotal += s.total
      s.detalles_venta?.forEach((d) => {
        const qty = d.cantidad || 0
        const cost = d.productos?.precio_costo || 0
        totalCost += cost * qty
      })
    })

    const netProfit = salesTotal - totalCost
    const avgTicket = filteredSales.length > 0 ? salesTotal / filteredSales.length : 0

    return {
      salesTotal,
      netProfit,
      avgTicket,
      count: filteredSales.length
    }
  }, [filteredSales])

  // Data mapping for charts
  const salesTrend = useMemo(() => {
    const map: Record<string, number> = {}
    filteredSales.forEach((s) => {
      const day = new Date(s.fecha).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })
      map[day] = (map[day] || 0) + s.total
    })
    return Object.entries(map).map(([date, total]) => ({ date, Ventas: total })).reverse()
  }, [filteredSales])

  const topProducts = useMemo(() => {
    const map: Record<string, { qty: number; total: number }> = {}
    filteredSales.forEach((s) => {
      s.detalles_venta?.forEach((d) => {
        const name = d.productos?.nombre || 'Desconocido'
        const current = map[name] || { qty: 0, total: 0 }
        map[name] = {
          qty: current.qty + d.cantidad,
          total: current.total + (d.precio_unitario * d.cantidad)
        }
      })
    })
    return Object.entries(map)
      .map(([name, val]) => ({ name, Unidades: val.qty, Monto: val.total }))
      .sort((a, b) => b.Unidades - a.Unidades)
      .slice(0, 5)
  }, [filteredSales])

  const payDistribution = useMemo(() => {
    const map: Record<string, number> = { efectivo: 0, transferencia: 0, tarjeta: 0 }
    filteredSales.forEach((s) => {
      const method = s.metodo_pago?.toLowerCase() || 'efectivo'
      map[method] = (map[method] || 0) + s.total
    })
    return Object.entries(map).map(([name, value]) => ({
      name: name === 'efectivo' ? 'Efectivo' : name === 'tarjeta' ? 'Tarjeta' : 'Transferencia',
      value
    })).filter(v => v.value > 0)
  }, [filteredSales])

  // Export report to CSV
  const exportToCSV = () => {
    if (filteredSales.length === 0) {
      toast('No hay datos para exportar en este periodo', { type: 'error' })
      return
    }

    const headers = ['Venta ID', 'Fecha', 'Cajero', 'Metodo Pago', 'Total COP']
    const rows = filteredSales.map((s) => [
      s.id.slice(0, 8).toUpperCase(),
      new Date(s.fecha).toLocaleDateString(),
      s.cajero || s.usuario_id || 'N/A',
      s.metodo_pago,
      s.total.toFixed(0)
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map(val => `"${val}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `Reporte_Ventas_Vendora_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast('Reporte exportado exitosamente', { type: 'success' })
  }

  // Calendar logic helpers
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const date = new Date(year, month, 1)
    const days = []
    
    // Fill empty days before start of month
    const firstDayIndex = date.getDay()
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null)
    }
    
    // Fill days of the month
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
      // Start new range
      setRangeStart(day)
      setRangeEnd(null)
    } else {
      // Complete range — ensure start < end
      if (day < rangeStart) {
        setRangeEnd(rangeStart)
        setRangeStart(day)
      } else {
        setRangeEnd(day)
      }
      setDateRange('personalizado')
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
      const fmtShort = (d: Date) => d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })
      return `${fmtShort(rangeStart)} → ${fmtShort(rangeEnd)}`
    } else if (rangeStart) {
      return rangeStart.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) + ' →...'
    }
    return 'Rango de fechas'
  }

  const monthLabel = currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <MainLayout title="Informes">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Informes">
      <div className="p-5 space-y-5 max-w-[1400px] mx-auto animate-in fade-in duration-300">
        
        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 border border-gray-200 rounded-xl shadow-sm">
          <div className="flex items-center gap-3">
            <CalendarIcon size={15} className="text-gray-400" />
            <div className="flex gap-1 items-center">
              {([
                { key: 'hoy', label: 'Hoy' },
                { key: '7dias', label: 'Últimos 7 días' },
                { key: 'mes', label: 'Este Mes' },
                { key: 'todos', label: 'Todo' }
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setDateRange(key)
                    setRangeStart(null)
                    setRangeEnd(null)
                  }}
                  className={[
                    'px-3 py-1 rounded text-[12px] font-medium transition-colors',
                    dateRange === key
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-900'
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}

              {/* Shadcn UI Style DatePicker Popover */}
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={[
                    'px-3 py-1 border border-gray-200 rounded text-[12px] font-medium transition-colors hover:bg-gray-50 flex items-center gap-1.5 bg-white text-gray-700',
                    dateRange === 'personalizado' ? 'border-gray-900 text-gray-900 bg-gray-50 font-semibold' : ''
                  ].join(' ')}
                >
                  <span>{rangeDateLabel()}</span>
                </button>

                {showDatePicker && (
                  <div className="absolute left-0 mt-2.5 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-1 duration-150 pointer-events-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                        <ChevronLeft size={15} />
                      </button>
                      <span className="text-[12px] font-semibold text-gray-900 capitalize">{monthLabel}</span>
                      <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                        <ChevronRight size={15} />
                      </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 gap-1 text-center mb-1">
                      {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((d) => (
                        <span key={d} className="text-[10px] font-semibold text-gray-400 uppercase">{d}</span>
                      ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {daysInMonth.map((day, idx) => {
                        if (!day) return <div key={`empty-${idx}`} />
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
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users size={14} className="text-gray-400" />
              <Select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="h-8 w-44"
              >
                <option value="all">Todos los cajeros</option>
                {usersList.map((u) => (
                  <option key={u.nombre} value={u.nombre}>{u.nombre}</option>
                ))}
              </Select>
            </div>

            <button
              onClick={exportToCSV}
              className="h-8 px-3.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Download size={13} />
              Exportar Reporte
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-100 text-[12px] rounded-lg">
            {error}
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              title: 'Ventas Totales',
              value: formatCOP(metrics.salesTotal),
              sub: `${metrics.count} ventas realizadas`,
              color: 'text-gray-900'
            },
            {
              title: 'Ganancia Neta',
              value: formatCOP(metrics.netProfit),
              sub: 'Ventas menos costo de producto',
              color: 'text-emerald-700'
            },
            {
              title: 'Ticket Promedio',
              value: formatCOP(metrics.avgTicket),
              sub: 'Promedio por venta',
              color: 'text-gray-900'
            }
          ].map((kpi) => (
            <div key={kpi.title} className="bg-white border border-gray-250/70 rounded-xl p-5 shadow-sm space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{kpi.title}</span>
              </div>
              <p className={`text-2xl font-bold font-mono tracking-tight ${kpi.color}`}>{kpi.value}</p>
              <p className="text-[11px] text-gray-400 font-medium">{kpi.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Trend Chart */}
          <div className="lg:col-span-2 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="mb-4">
              <p className="text-[13px] font-bold text-gray-900">Comportamiento de Ventas</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Tendencia de ingresos diarios en el periodo</p>
            </div>
            <div className="h-64">
              {salesTrend.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-400 text-[12px]">Sin datos de tendencia</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesTrend}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#111827" stopOpacity={0.08} />
                        <stop offset="95%" stopColor="#111827" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                    <XAxis dataKey="date" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v/1000}k`} />
                    <Tooltip formatter={(value) => [formatCOP(value as number), 'Ventas']} contentStyle={{ background: '#FFF', border: '1px solid #E5E7EB', borderRadius: '8px', fontSize: 12 }} />
                    <Area type="monotone" dataKey="Ventas" stroke="#111827" strokeWidth={1.5} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Pay distribution Donut */}
          <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm flex flex-col">
            <div className="mb-2">
              <p className="text-[13px] font-bold text-gray-900">Distribución de Métodos de Pago</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Porcentaje de ventas acumuladas</p>
            </div>
            <div className="h-56 relative flex items-center justify-center">
              {payDistribution.length === 0 ? (
                <div className="text-gray-400 text-[12px]">Sin transacciones</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={payDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {payDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#111827' : index === 1 ? '#4B5563' : '#9CA3AF'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCOP(value as number)} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Custom Legend */}
            <div className="flex justify-center gap-4 mt-auto pt-2 border-t border-gray-50">
              {payDistribution.map((item, idx) => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: idx === 0 ? '#111827' : idx === 1 ? '#4B5563' : '#9CA3AF' }} />
                  <span className="text-[11px] font-medium text-gray-600">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Products Horizontal Bar Chart */}
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <p className="text-[13px] font-bold text-gray-900">Top 5 Productos Más Vendidos</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Ordenados por volumen total de unidades vendidas</p>
          </div>
          <div className="h-64">
            {topProducts.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-[12px]">Sin registros de ventas</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical" margin={{ left: 50, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F3F4F6" />
                  <XAxis type="number" stroke="#9CA3AF" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#111827" fontSize={11} tickLine={false} axisLine={false} width={120} />
                  <Tooltip formatter={(value, name) => [name === 'Monto' ? formatCOP(value as number) : value, name]} />
                  <Bar dataKey="Unidades" fill="#111827" radius={[0, 4, 4, 0]} barSize={16}>
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#111827' : index === 1 ? '#374151' : index === 2 ? '#4B5563' : index === 3 ? '#6B7280' : '#9CA3AF'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
