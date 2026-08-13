import { useState, useEffect, useMemo, useRef } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { cashService } from '../services/cashService'
import { ArqueoCaja } from '../types'
import { useAuth } from '../components/auth/AuthContext'
import { formatCOP } from '../lib/utils'
import { toast } from '../components/ui/Toaster'
import { SkeletonPage } from '../components/ui/Skeleton'
import { Select } from '../components/ui/Select'
import {
  Wallet, CheckCircle2, Clock, AlertTriangle, X,
  ChevronRight, Banknote, CreditCard, Smartphone, RotateCcw,
  Calendar as CalendarIcon, ChevronLeft
} from 'lucide-react'

interface SessionWithSales extends ArqueoCaja {
  sales?: any[]
  salesLoaded?: boolean
}

export default function CashHistoryPage() {
  const { profile } = useAuth()
  const [sessions, setSessions] = useState<SessionWithSales[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSession, setSelectedSession] = useState<SessionWithSales | null>(null)
  const [sessionSales, setSessionSales] = useState<any[]>([])
  const [loadingSales, setLoadingSales] = useState(false)

  // Retroactive count state
  const [showRetroModal, setShowRetroModal] = useState(false)
  const [retroSession, setRetroSession] = useState<SessionWithSales | null>(null)
  const [retroCash, setRetroCash] = useState('')
  const [retroSaving, setRetroSaving] = useState(false)

  // Filter states
  const [selectedCashier, setSelectedCashier] = useState<string>('all')
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all') // 'all', '7', '15', '30', '60', 'custom'

  // Custom DatePicker Range State
  const [rangeStart, setRangeStart] = useState<Date | null>(null)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const datePickerRef = useRef<HTMLDivElement>(null)

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

  // Unique list of cashiers for filter select (computed from sessions)
  const cashiers = useMemo(() => {
    const names = new Set<string>()
    sessions.forEach(s => {
      if (s.usuario_id) names.add(s.usuario_id)
    })
    return Array.from(names)
  }, [sessions])

  // Filtered session list
  const filteredSessions = useMemo(() => {
    return sessions.filter(session => {
      // 1. Cashier Filter
      if (selectedCashier !== 'all' && session.usuario_id !== selectedCashier) {
        return false
      }

      // 2. Date Range Filter
      if (dateRangeFilter !== 'all') {
        const sessionDate = new Date(session.fecha_apertura)
        const today = new Date()
        today.setHours(23, 59, 59, 999)

        if (dateRangeFilter === 'custom') {
          if (rangeStart) {
            const start = new Date(rangeStart)
            start.setHours(0, 0, 0, 0)
            if (sessionDate < start) return false
          }
          if (rangeEnd) {
            const end = new Date(rangeEnd)
            end.setHours(23, 59, 59, 999)
            if (sessionDate > end) return false
          }
        } else {
          const days = parseInt(dateRangeFilter)
          if (!isNaN(days)) {
            const limitDate = new Date()
            limitDate.setDate(limitDate.getDate() - days)
            limitDate.setHours(0, 0, 0, 0)
            if (sessionDate < limitDate) return false
          }
        }
      }

      return true
    })
  }, [sessions, selectedCashier, dateRangeFilter, rangeStart, rangeEnd])

  useEffect(() => {
    loadHistory()
  }, [profile])

  const loadHistory = async () => {
    if (!profile) return
    setLoading(true)
    try {
      const uid = profile.rol === 'admin' ? undefined : profile.nombre
      const data = await cashService.getAllSessions(uid, profile.negocio_id)
      setSessions(data)
    } catch (err: any) {
      setError(err.message || 'Error cargando historial')
    } finally {
      setLoading(false)
    }
  }

  const openSessionDetail = async (session: SessionWithSales) => {
    setSelectedSession(session)
    setLoadingSales(true)
    try {
      let sales = await cashService.getSalesForSession(session)
      // Non-admin can only see their own sales details
      if (profile?.rol !== 'admin') {
        sales = sales.filter(s => s.cajero === profile.nombre || s.usuario_id === profile.nombre)
      }
      setSessionSales(sales)
    } catch (err) {
      setSessionSales([])
    } finally {
      setLoadingSales(false)
    }
  }

  const handleRetroCount = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!retroSession || !retroCash) return
    setRetroSaving(true)
    try {
      const cashSales = sessionSales
        .filter(s => s.metodo_pago === 'efectivo')
        .reduce((acc: number, s: any) => acc + s.total, 0)
      const declared = parseFloat(retroCash) || 0

      await cashService.retroactiveCount(retroSession.id, declared, cashSales)
      toast('Conteo físico registrado correctamente', { type: 'success' })
      setShowRetroModal(false)
      setRetroCash('')
      loadHistory()
      // Update selected session too
      if (selectedSession?.id === retroSession.id) {
        setSelectedSession(prev => prev ? {
          ...prev,
          efectivo_declarado: declared,
          efectivo_sistema: cashSales,
          diferencia: declared - cashSales,
          auto_cerrado: false
        } : null)
      }
    } catch (err: any) {
      toast('Error al registrar conteo', { type: 'error', description: err.message })
    } finally {
      setRetroSaving(false)
    }
  }

  const formatDuration = (start: string, end?: string) => {
    const s = new Date(start)
    const e = end ? new Date(end) : new Date()
    const diffMs = e.getTime() - s.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${mins}m`
  }

  const sessionTotal = (sales: any[]) =>
    sales.reduce((acc, s) => acc + s.total, 0)

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
      setRangeStart(day)
      setRangeEnd(null)
    } else {
      if (day < rangeStart) {
        setRangeEnd(rangeStart)
        setRangeStart(day)
      } else {
        setRangeEnd(day)
      }
      setDateRangeFilter('custom')
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
    return 'Seleccionar Rango'
  }

  const monthLabel = currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  if (loading) {
    return (
      <MainLayout title="Historial de Cajas">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Historial de Cajas y Turnos">
      <div className="flex h-[calc(100vh-52px)] overflow-hidden">
        
        {/* LEFT: Session list and Filters */}
        <div className="w-80 shrink-0 border-r border-gray-100 flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-100 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-gray-900 font-sans">Turnos de Caja</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{filteredSessions.length} de {sessions.length} filtrados</p>
              </div>
            </div>

            {/* Filter Controls (Notion / Shadcn style) */}
            <div className="space-y-3">
              {profile?.rol === 'admin' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Cajero</label>
                  <Select
                    value={selectedCashier}
                    onChange={(e) => setSelectedCashier(e.target.value)}
                    className="h-8 bg-gray-50/50 hover:bg-gray-100/50"
                  >
                    <option value="all">Todos los cajeros</option>
                    {cashiers.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">Intervalo</label>
                <Select
                  value={dateRangeFilter}
                  onChange={(e) => {
                    setDateRangeFilter(e.target.value)
                    if (e.target.value !== 'custom') {
                      setRangeStart(null)
                      setRangeEnd(null)
                    }
                  }}
                  className="h-8 bg-gray-50/50 hover:bg-gray-100/50"
                >
                  <option value="all">Todos los registros</option>
                  <option value="7">Últimos 7 días</option>
                  <option value="15">Últimos 15 días</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="60">Últimos 60 días</option>
                  <option value="custom">Rango personalizado...</option>
                </Select>
              </div>

              {dateRangeFilter === 'custom' && (
                <div className="relative pt-1 animate-in fade-in slide-in-from-top-1 duration-200" ref={datePickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowDatePicker(!showDatePicker)}
                    className="w-full h-8 px-2.5 border border-gray-200 rounded-lg text-[12px] font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center justify-between transition-colors shadow-sm"
                  >
                    <span className="truncate">{rangeDateLabel()}</span>
                    <CalendarIcon size={12} className="text-gray-400" />
                  </button>

                  {showDatePicker && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-gray-250/80 rounded-xl shadow-xl p-3 z-50 animate-in fade-in duration-150">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                          <ChevronLeft size={14} />
                        </button>
                        <span className="text-[12px] font-semibold text-gray-900 capitalize">{monthLabel}</span>
                        <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded text-gray-600">
                          <ChevronRight size={14} />
                        </button>
                      </div>

                      {/* Weekdays */}
                      <div className="grid grid-cols-7 gap-1 text-center mb-1">
                        {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá'].map((d) => (
                          <span key={d} className="text-[9px] font-bold text-gray-400 uppercase">{d}</span>
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
                                'h-7 w-full text-[11px] font-medium flex items-center justify-center transition-colors',
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
              )}
            </div>
          </div>

          {error && (
            <div className="mx-3 mt-3 p-2.5 bg-red-50 border border-red-100 text-red-600 text-[11px] rounded-lg">
              {error}
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {filteredSessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                <Wallet size={24} className="text-gray-200 mb-2" />
                <p className="text-[12px] text-gray-400">Sin historial para los filtros aplicados</p>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = selectedSession?.id === session.id
                const isAuto = (session as any).auto_cerrado
                const dateLabel = new Date(session.fecha_apertura).toLocaleDateString('es-CO', {
                  weekday: 'short', day: 'numeric', month: 'short'
                })
                const timeLabel = new Date(session.fecha_apertura).toLocaleTimeString('es-CO', {
                  hour: '2-digit', minute: '2-digit'
                })

                return (
                  <button
                    key={session.id}
                    onClick={() => openSessionDetail(session)}
                    className={[
                      'w-full text-left px-4 py-3.5 border-b border-gray-50 transition-colors flex items-center justify-between gap-3',
                      isSelected ? 'bg-gray-50' : 'hover:bg-gray-50/70'
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={[
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                        session.estado === 'abierto' ? 'bg-emerald-50' : isAuto ? 'bg-amber-50' : 'bg-gray-100'
                      ].join(' ')}>
                        {session.estado === 'abierto' ? (
                          <Clock size={14} className="text-emerald-600" />
                        ) : isAuto ? (
                          <AlertTriangle size={14} className="text-amber-500" />
                        ) : (
                          <CheckCircle2 size={14} className="text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-[12px] font-semibold text-gray-900 capitalize">{dateLabel}</p>
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {session.usuario_id} · {timeLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {session.estado === 'abierto' && (
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                          Activo
                        </span>
                      )}
                      {isAuto && session.estado !== 'abierto' && (
                        <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                          Auto-cerrado
                        </span>
                      )}
                      <ChevronRight size={13} className="text-gray-300" />
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* RIGHT: Session detail */}
        {!selectedSession ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
              <Wallet size={22} className="text-gray-300" />
            </div>
            <p className="text-[14px] font-semibold text-gray-700">Selecciona un turno</p>
            <p className="text-[12px] text-gray-400 mt-1">Elige una sesión de la lista para ver sus detalles</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-4 max-w-3xl">
              
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[15px] font-bold text-gray-900">
                    {new Date(selectedSession.fecha_apertura).toLocaleDateString('es-CO', {
                      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                    })}
                  </p>
                  <p className="text-[12px] text-gray-400 mt-0.5 capitalize">
                    Cajero: {selectedSession.usuario_id} · Turno de {formatDuration(selectedSession.fecha_apertura, selectedSession.fecha_cierre)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(selectedSession as any).auto_cerrado && !selectedSession.efectivo_declarado && (
                    <button
                      onClick={() => {
                        setRetroSession(selectedSession)
                        setShowRetroModal(true)
                      }}
                      className="px-3 h-8 bg-amber-500 hover:bg-amber-600 text-white text-[12px] font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <RotateCcw size={13} />
                      Registrar Conteo Físico
                    </button>
                  )}
                  <span className={[
                    'px-2.5 py-1 rounded-lg text-[11px] font-semibold',
                    selectedSession.estado === 'abierto' ? 'bg-emerald-50 text-emerald-700' :
                    (selectedSession as any).auto_cerrado ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-100 text-gray-600'
                  ].join(' ')}>
                    {selectedSession.estado === 'abierto' ? '● Activo' :
                     (selectedSession as any).auto_cerrado ? '⚠ Auto-cerrado' : '✓ Cerrado'}
                  </span>
                </div>
              </div>

              {/* Auto-close alert */}
              {(selectedSession as any).auto_cerrado && (
                <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                  <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[12px] font-semibold text-amber-800">Turno cerrado automáticamente</p>
                    <p className="text-[11px] text-amber-600 mt-0.5">
                      Esta caja fue cerrada por el sistema a las 11:59 PM porque el cajero olvidó cerrarla manualmente.
                      {!selectedSession.efectivo_declarado && ' Puedes registrar el conteo físico retroactivamente.'}
                    </p>
                  </div>
                </div>
              )}

              {/* KPI row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  {
                    label: 'Efectivo Inicial',
                    value: formatCOP(selectedSession.monto_inicial || 0),
                    sub: 'Fondo de apertura'
                  },
                  {
                    label: 'Total Ventas del Turno',
                    value: loadingSales ? '...' : formatCOP(sessionTotal(sessionSales)),
                    sub: loadingSales ? '' : `${sessionSales.length} transacciones`
                  },
                  {
                    label: 'Diferencia de Caja',
                    value: selectedSession.diferencia !== undefined
                      ? formatCOP(selectedSession.diferencia || 0)
                      : '—',
                    sub: selectedSession.efectivo_declarado !== undefined
                      ? `Físico: ${formatCOP(selectedSession.efectivo_declarado || 0)}`
                      : 'Pendiente conteo físico',
                    highlight: selectedSession.diferencia !== undefined && (selectedSession.diferencia || 0) < 0
                  }
                ].map((card) => (
                  <div key={card.label} className={[
                    'bg-white border rounded-xl p-4 shadow-sm',
                    (card as any).highlight ? 'border-red-100 bg-red-50/30' : 'border-gray-200'
                  ].join(' ')}>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{card.label}</p>
                    <p className={[
                      'text-xl font-bold font-mono mt-1.5',
                      (card as any).highlight ? 'text-red-600' : 'text-gray-900'
                    ].join(' ')}>{card.value}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{card.sub}</p>
                  </div>
                ))}
              </div>

              {/* Payment breakdown */}
              {!loadingSales && sessionSales.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-3.5 border-b border-gray-100">
                    <p className="text-[13px] font-semibold text-gray-900">Desglose por Método de Pago</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { method: 'Efectivo', icon: Banknote, key: 'efectivo' },
                      { method: 'Transferencia', icon: Smartphone, key: 'transferencia' },
                      { method: 'Tarjeta', icon: CreditCard, key: 'tarjeta' }
                    ].map(({ method, icon: Icon, key }) => {
                      const count = sessionSales.filter(s => s.metodo_pago === key).length
                      const total = sessionSales.filter(s => s.metodo_pago === key).reduce((a, s) => a + s.total, 0)
                      return (
                        <div key={key} className="px-5 py-3.5 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                              <Icon size={13} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-[12px] font-medium text-gray-900">{method}</p>
                              <p className="text-[11px] text-gray-400">{count} transacciones</p>
                            </div>
                          </div>
                          <span className="text-[13px] font-bold font-mono text-gray-900">{formatCOP(total)}</span>
                        </div>
                      )
                    })}
                    <div className="px-5 py-3.5 flex items-center justify-between bg-gray-50/50">
                      <span className="text-[12px] font-bold text-gray-900">Total General</span>
                      <span className="text-[14px] font-bold font-mono text-gray-900">
                        {formatCOP(sessionTotal(sessionSales))}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction list */}
              {!loadingSales && sessionSales.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-3.5 border-b border-gray-100">
                    <p className="text-[13px] font-semibold text-gray-900">Transacciones del Turno</p>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                    {sessionSales.map((sale) => (
                      <div key={sale.id} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="text-[12px] font-semibold text-gray-900">
                            Venta #{sale.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(sale.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })} · {sale.cajero || sale.usuario_id || 'Cajero'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-bold font-mono text-gray-900">{formatCOP(sale.total)}</p>
                          <span className="text-[10px] text-gray-400 capitalize">{sale.metodo_pago}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!loadingSales && sessionSales.length === 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-8 text-center shadow-sm">
                  <p className="text-[12px] text-gray-400">No se encontraron ventas en este turno</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

           {showRetroModal && retroSession && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          {(() => {
            const cashSalesTotal = (sales: any[]) =>
              sales
                .filter(s => s.metodo_pago === 'efectivo')
                .reduce((acc: number, s: any) => acc + s.total, 0)

            return (
              <form
                onSubmit={handleRetroCount}
                className="bg-white rounded-xl border border-gray-200 w-full max-w-sm shadow-2xl"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                  <div>
                    <p className="text-[13px] font-semibold text-gray-900">Registrar Conteo Físico</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Turno del {new Date(retroSession.fecha_apertura).toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowRetroModal(false); setRetroCash('') }}
                    className="p-1.5 hover:bg-gray-100 rounded-md transition-colors text-gray-400 hover:text-gray-600"
                  >
                    <X size={15} />
                  </button>
                </div>

                <div className="px-5 py-5 space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg text-[12px] space-y-1.5">
                    <div className="flex justify-between text-gray-600">
                      <span>Total sistema (efectivo)</span>
                      <span className="font-mono font-semibold">{formatCOP(cashSalesTotal(sessionSales))}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                      Efectivo físico contado
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[14px]">$</span>
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={retroCash}
                        onChange={(e) => setRetroCash(e.target.value)}
                        placeholder="0"
                        className="w-full h-10 pl-7 pr-4 text-[15px] font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                      />
                    </div>
                  </div>

                  {retroCash && (
                    <div className={[
                      'p-3 rounded-lg border text-[12px]',
                      (parseFloat(retroCash) - cashSalesTotal(sessionSales)) < 0
                        ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-gray-50 border-gray-200 text-gray-700'
                    ].join(' ')}>
                      Diferencia: <span className="font-bold font-mono">
                        {formatCOP(parseFloat(retroCash) - cashSalesTotal(sessionSales))}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => { setShowRetroModal(false); setRetroCash('') }}
                    className="flex-1 h-9 border border-gray-200 text-[13px] text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={retroSaving}
                    className="flex-1 h-9 bg-gray-900 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-800 disabled:opacity-60 transition-colors"
                  >
                    {retroSaving ? 'Guardando...' : 'Guardar Conteo'}
                  </button>
                </div>
              </form>
            )
          })()}
        </div>
      )}
    </MainLayout>
  )
}
