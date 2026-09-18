import { useState, useEffect, useMemo, useRef } from 'react'
import MainLayout from '../../components/layout/MainLayout'
import { useAuth } from '../../components/auth/AuthContext'
import { accountingService, LibroFiscalItem } from '../../services/accountingService'
import { formatCOP } from '../../lib/utils'
import { toast } from '../../components/ui/Toaster'
import { SkeletonPage } from '../../components/ui/Skeleton'
import { printHtmlDocument, downloadHtmlDocument } from '../../lib/printHelper'
import {
  BookOpen, Plus, Search, Download, Printer, Filter,
  ArrowUpRight, ArrowDownLeft, Edit2, Trash2, Calendar as CalendarIcon,
  ChevronLeft, ChevronRight, X, Save, FileSpreadsheet, Check, HelpCircle, Lock
} from 'lucide-react'

type DateFilterType = 'mes' | '30dias' | 'todos' | 'personalizado'
type TipoFilterType = 'todos' | 'ingreso' | 'egreso'

export default function LibroFiscalPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<LibroFiscalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tipoFilter, setTipoFilter] = useState<TipoFilterType>('todos')
  const [dateFilter, setDateFilter] = useState<DateFilterType>('mes')

  // Custom Datepicker state
  const [rangeStart, setRangeStart] = useState<Date | null>(null)
  const [rangeEnd, setRangeEnd] = useState<Date | null>(null)
  const [hoverDate, setHoverDate] = useState<Date | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const datePickerRef = useRef<HTMLDivElement>(null)

  // Modal State for Add / Edit
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<LibroFiscalItem | null>(null)
  const [formFecha, setFormFecha] = useState(new Date().toISOString().split('T')[0])
  const [formConcepto, setFormConcepto] = useState('')
  const [formTipo, setFormTipo] = useState<'ingreso' | 'egreso'>('ingreso')
  const [formOrigen, setFormOrigen] = useState<'manual' | 'pos' | 'orden_compra'>('manual')
  const [formComprobante, setFormComprobante] = useState('')
  const [formValor, setFormValor] = useState('')
  const [formObservaciones, setFormObservaciones] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (profile?.negocio_id) loadLibro()
  }, [profile])

  // Close calendar popup on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(e.target as Node)) {
        setShowDatePicker(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const loadLibro = async () => {
    setLoading(true)
    try {
      const data = await accountingService.getLibroFiscal(profile!.negocio_id)
      setItems(data)
    } catch (err: any) {
      toast(err.message || 'Error cargando Libro Fiscal', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Calendar logic helpers
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
      setDateFilter('personalizado')
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
    return 'Personalizado'
  }

  const monthLabel = currentMonth.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  // Filtering items
  const filtered = useMemo(() => {
    const now = new Date()
    return items.filter(item => {
      const itemDate = new Date(item.fecha)

      // Date check
      let dateMatch = true
      if (dateFilter === 'mes') {
        dateMatch = itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear()
      } else if (dateFilter === '30dias') {
        const cutoff = new Date(now)
        cutoff.setDate(now.getDate() - 30)
        dateMatch = itemDate >= cutoff
      } else if (dateFilter === 'personalizado') {
        if (rangeStart && rangeEnd) {
          const start = new Date(rangeStart); start.setHours(0, 0, 0, 0)
          const end = new Date(rangeEnd); end.setHours(23, 59, 59, 999)
          dateMatch = itemDate >= start && itemDate <= end
        } else if (rangeStart) {
          dateMatch = itemDate.toDateString() === rangeStart.toDateString()
        }
      }

      // Type check
      const tipoMatch = tipoFilter === 'todos' || item.tipo === tipoFilter

      // Search check
      const q = search.toLowerCase()
      const searchMatch = !q ||
        item.concepto.toLowerCase().includes(q) ||
        (item.comprobante_ref || '').toLowerCase().includes(q) ||
        item.fecha.includes(q)

      return dateMatch && tipoMatch && searchMatch
    })
  }, [items, dateFilter, tipoFilter, search, rangeStart, rangeEnd])

  // Calculation totals
  const totals = useMemo(() => {
    let ingresos = 0
    let egresos = 0
    filtered.forEach(i => {
      ingresos += Number(i.valor_ingreso) || 0
      egresos += Number(i.valor_egreso) || 0
    })
    return {
      ingresos,
      egresos,
      saldoNeto: ingresos - egresos,
      count: filtered.length
    }
  }, [filtered])

  const openNewModal = () => {
    setEditingItem(null)
    setFormFecha(new Date().toISOString().split('T')[0])
    setFormConcepto('')
    setFormTipo('ingreso')
    setFormOrigen('manual')
    setFormComprobante('')
    setFormValor('')
    setFormObservaciones('')
    setModalOpen(true)
  }

  const openEditModal = (item: LibroFiscalItem) => {
    setEditingItem(item)
    setFormFecha(item.fecha)
    setFormConcepto(item.concepto)
    setFormTipo(item.tipo)
    setFormOrigen(item.origen)
    setFormComprobante(item.comprobante_ref || '')
    setFormValor(String(item.tipo === 'ingreso' ? item.valor_ingreso : item.valor_egreso))
    setFormObservaciones(item.observaciones || '')
    setModalOpen(true)
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.negocio_id) return
    const val = parseFloat(formValor) || 0
    if (val <= 0) {
      toast('El valor debe ser mayor a cero', { type: 'error' })
      return
    }

    setSaving(true)
    try {
      const payload: Omit<LibroFiscalItem, 'id'> = {
        negocio_id: profile.negocio_id,
        tenant_id: profile.negocio_id,
        fecha: formFecha,
        concepto: formConcepto,
        tipo: formTipo,
        origen: formOrigen,
        comprobante_ref: formComprobante || undefined,
        valor_ingreso: formTipo === 'ingreso' ? val : 0,
        valor_egreso: formTipo === 'egreso' ? val : 0,
        observaciones: formObservaciones || undefined
      }

      if (editingItem) {
        if (editingItem.origen !== 'manual' || editingItem.id.startsWith('pos-') || editingItem.id.startsWith('oc-')) {
          toast('Los asientos automáticos del POS o Compras no se pueden modificar directamente aquí.', { type: 'info' })
          setModalOpen(false)
          return
        }
        await accountingService.updateLibroFiscalItem(editingItem.id, payload)
        setItems(prev => prev.map(i => i.id === editingItem.id ? { ...i, ...payload } : i))
        toast('Registro fiscal actualizado', { type: 'success' })
      } else {
        const created = await accountingService.addLibroFiscalItem(payload)
        setItems(prev => [created, ...prev])
        toast('Registro fiscal añadido exitosamente', { type: 'success' })
      }
      setModalOpen(false)
    } catch (err: any) {
      toast(err.message || 'Error guardando registro', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteItem = async (id: string) => {
    if (id.startsWith('pos-') || id.startsWith('oc-')) {
      toast('Los asientos automáticos del POS o Compras no se pueden eliminar manualmente.', { type: 'info' })
      return
    }
    if (!window.confirm('¿Seguro que deseas eliminar este asiento del Libro Fiscal?')) return
    try {
      await accountingService.deleteLibroFiscalItem(id)
      setItems(prev => prev.filter(i => i.id !== id))
      toast('Registro fiscal eliminado', { type: 'success' })
    } catch (err: any) {
      toast(err.message || 'Error al eliminar', { type: 'error' })
    }
  }

  // Export to CSV / Excel
  const exportToCSV = () => {
    if (filtered.length === 0) {
      toast('No hay registros para exportar', { type: 'error' })
      return
    }
    const headers = ['Fecha', 'Tipo', 'Origen', 'Comprobante / Soporte', 'Concepto', 'Ingresos Diarios (COP)', 'Compras y Gastos Diarios (COP)', 'Observaciones']
    const rows = filtered.map(i => [
      i.fecha,
      i.tipo.toUpperCase(),
      i.origen.toUpperCase(),
      `"${i.comprobante_ref || 'N/A'}"`,
      `"${i.concepto.replace(/"/g, '""')}"`,
      i.valor_ingreso,
      i.valor_egreso,
      `"${(i.observaciones || '').replace(/"/g, '""')}"`
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Libro_Fiscal_Operaciones_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast('Libro Fiscal exportado a CSV / Excel', { type: 'success' })
  }

  // Print Official PDF Layout
  const handlePrintOfficial = () => {
    if (filtered.length === 0) {
      toast('No hay registros para imprimir', { type: 'error' })
      return
    }

    const rowsHtml = filtered.map(i => `
      <tr>
        <td style="padding:6px 8px; font-family:monospace; border-bottom:1px solid #e5e7eb;">${i.fecha}</td>
        <td style="padding:6px 8px; font-weight:600; border-bottom:1px solid #e5e7eb;">${i.concepto}</td>
        <td style="padding:6px 8px; font-size:11px; color:#555; border-bottom:1px solid #e5e7eb;">${i.comprobante_ref || '—'}</td>
        <td style="padding:6px 8px; text-align:right; font-family:monospace; color:#059669; font-weight:700; border-bottom:1px solid #e5e7eb;">
          ${i.valor_ingreso > 0 ? formatCOP(i.valor_ingreso) : '—'}
        </td>
        <td style="padding:6px 8px; text-align:right; font-family:monospace; color:#dc2626; font-weight:700; border-bottom:1px solid #e5e7eb;">
          ${i.valor_egreso > 0 ? formatCOP(i.valor_egreso) : '—'}
        </td>
      </tr>
    `).join('')

    const bodyHtml = `
  <div class="header">
    <h1>LIBRO FISCAL DE REGISTRO DE OPERACIONES DIARIAS</h1>
    <p>Obligación Tributaria para No Responsables de IVA (Art. 616-8 del Estatuto Tributario)</p>
    <p>Comercio: ${profile?.nombre || 'Vendora'} · Fecha de Generación: ${new Date().toLocaleDateString('es-CO')}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width:90px;">Fecha</th>
        <th>Concepto / Detalle de la Operación</th>
        <th style="width:130px;">Comprobante / Soporte</th>
        <th style="width:130px; text-align:right;">Ingresos Diarios</th>
        <th style="width:130px; text-align:right;">Compras / Gastos</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="summary">
    <div class="summary-box">
      <div class="summary-row">
        <span>Total Ingresos:</span>
        <strong style="color:#059669;">${formatCOP(totals.ingresos)}</strong>
      </div>
      <div class="summary-row">
        <span>Total Compras y Gastos:</span>
        <strong style="color:#dc2626;">${formatCOP(totals.egresos)}</strong>
      </div>
      <div class="summary-row total-row">
        <span>Saldo Neto del Periodo:</span>
        <span>${formatCOP(totals.saldoNeto)}</span>
      </div>
    </div>
  </div>`

    const styles = `
      body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #111827; padding: 30px; }
      .header { text-align:center; margin-bottom: 20px; border-bottom: 2px solid #111827; padding-bottom: 12px; }
      h1 { font-size: 18px; font-weight: 800; text-transform: uppercase; }
      p { font-size: 11px; color: #4b5563; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 11px; }
      th { background: #111827; color: #fff; padding: 8px; text-align: left; font-size: 10px; text-transform: uppercase; }
      th:nth-child(4), th:nth-child(5) { text-align: right; }
      .summary { margin-top: 20px; border-top: 2px solid #111827; padding-top: 10px; display: flex; justify-content: flex-end; }
      .summary-box { width: 320px; }
      .summary-row { display: flex; justify-content: space-between; padding: 4px 0; font-size: 12px; }
      .total-row { font-weight: 800; font-size: 14px; border-top: 1px solid #ccc; padding-top: 6px; }
      @media print { body { padding: 10mm; } }
    `

    printHtmlDocument('Libro Fiscal de Registro de Operaciones Diarias', bodyHtml, styles)
  }

  if (loading) {
    return (
      <MainLayout title="Libro Fiscal de Operaciones">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Libro Fiscal de Registro de Operaciones Diarias">
      <div className="p-6 space-y-5 max-w-[1400px] mx-auto animate-in fade-in duration-300">
        
        {/* Top Header Card (OpenAI / Shadcn Style) */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Libro Fiscal de Operaciones</h2>
              <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded-full border border-gray-200">
                Art. 616-8 E.T.
              </span>
            </div>
            <p className="text-[12px] text-gray-400 mt-0.5">
              Registro obligatorio diario de ingresos globales y egresos para microcomercios (Régimen Simplificado)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportToCSV}
              className="px-3 h-8 border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs bg-white"
            >
              <FileSpreadsheet size={13} className="text-emerald-600" />
              Exportar Excel / CSV
            </button>
            <button
              onClick={handlePrintOfficial}
              className="px-3 h-8 border border-gray-200 hover:bg-gray-50 text-[11px] font-semibold text-gray-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs bg-white"
            >
              <Printer size={13} />
              Imprimir PDF Legal
            </button>
            <button
              onClick={openNewModal}
              className="px-3.5 h-8 bg-gray-900 hover:bg-gray-800 text-white text-[11px] font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Plus size={13} />
              Nuevo Asiento Manual
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Ingresos Diarios</span>
              <div className="w-6 h-6 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ArrowUpRight size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-gray-900">{formatCOP(totals.ingresos)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Sumatoria de ventas del periodo seleccionado</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Total Compras y Gastos</span>
              <div className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center">
                <ArrowDownLeft size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-gray-900">{formatCOP(totals.egresos)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Compras de mercancía y costos registrados</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-gray-400 mb-1">
              <span className="text-[11px] font-semibold uppercase tracking-wider">Saldo Operativo Neto</span>
              <div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen size={14} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-gray-900">{formatCOP(totals.saldoNeto)}</p>
            <p className="text-[10px] text-gray-400 mt-1">Margen bruto antes de costos fijos</p>
          </div>
        </div>

        {/* Filters Bar (OpenAI Reference Style: Search input, Active pills, Add Filter) */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
          
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
            {/* Search */}
            <div className="relative w-64">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar concepto o comprobante..."
                className="w-full h-8 pl-8 pr-8 text-[12px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Date preset pills */}
            <div className="flex items-center gap-1">
              {([
                { key: 'mes', label: 'Este Mes' },
                { key: '30dias', label: '30 Días' },
                { key: 'todos', label: 'Todo' }
              ] as const).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setDateFilter(key)
                    setRangeStart(null)
                    setRangeEnd(null)
                  }}
                  className={[
                    'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                    dateFilter === key
                      ? 'bg-gray-900 text-white font-semibold'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70'
                  ].join(' ')}
                >
                  {label}
                </button>
              ))}

              {/* Custom Date Range Popover */}
              <div className="relative" ref={datePickerRef}>
                <button
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className={[
                    'px-2.5 py-1 border border-gray-200 rounded-md text-[11px] font-medium transition-colors hover:bg-gray-50 flex items-center gap-1.5 bg-white text-gray-700',
                    dateFilter === 'personalizado' ? 'border-gray-900 text-gray-900 bg-gray-50 font-semibold' : ''
                  ].join(' ')}
                >
                  <CalendarIcon size={12} className="text-gray-400" />
                  <span>{dateFilter === 'personalizado' ? rangeDateLabel() : 'Personalizado'}</span>
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
                  </div>
                )}
              </div>
            </div>

            {/* Type filter pill */}
            <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
              <button
                onClick={() => setTipoFilter(tipoFilter === 'ingreso' ? 'todos' : 'ingreso')}
                className={[
                  'px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all flex items-center gap-1',
                  tipoFilter === 'ingreso'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                ].join(' ')}
              >
                <span>Ingresos</span>
                {tipoFilter === 'ingreso' && <X size={10} />}
              </button>
              <button
                onClick={() => setTipoFilter(tipoFilter === 'egreso' ? 'todos' : 'egreso')}
                className={[
                  'px-2 py-0.5 rounded-full text-[11px] font-semibold border transition-all flex items-center gap-1',
                  tipoFilter === 'egreso'
                    ? 'bg-rose-50 text-rose-700 border-rose-300'
                    : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                ].join(' ')}
              >
                <span>Egresos</span>
                {tipoFilter === 'egreso' && <X size={10} />}
              </button>
            </div>
          </div>

          {/* Results count indicator */}
          <div className="text-[12px] text-gray-400 font-medium shrink-0">
            {filtered.length} registro{filtered.length !== 1 ? 's' : ''}
          </div>

        </div>

        {/* Table of Entries (Clean Shadcn Style) */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-400 space-y-2 shadow-xs">
            <BookOpen size={28} className="mx-auto text-gray-300 mb-1" />
            <p className="text-[13px] font-bold text-gray-700">Sin asientos en el Libro Fiscal</p>
            <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
              Las ventas del POS y las compras recibidas se registran automáticamente aquí. También puedes agregar asientos manuales con el botón superior.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto max-h-[580px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3 w-28">Fecha</th>
                    <th className="px-4 py-3 w-28">Tipo</th>
                    <th className="px-4 py-3 w-36">Origen</th>
                    <th className="px-4 py-3 w-44">Comprobante</th>
                    <th className="px-4 py-3">Concepto / Detalle</th>
                    <th className="px-4 py-3 text-right w-36">Ingreso ($)</th>
                    <th className="px-4 py-3 text-right w-36">Egreso ($)</th>
                    <th className="px-4 py-3 text-center w-24">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-[12px] text-gray-700">
                  {filtered.map(item => {
                    const isIngreso = item.tipo === 'ingreso'
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-4 py-3 font-mono text-[11px] font-semibold text-gray-800">
                          {item.fecha}
                        </td>
                        <td className="px-4 py-3">
                          <span className={[
                            'px-2 py-0.5 rounded-full text-[10px] font-bold capitalize inline-flex items-center gap-1',
                            isIngreso ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          ].join(' ')}>
                            {isIngreso ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                            {item.tipo}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium uppercase font-mono">
                            {item.origen === 'pos' ? 'POS Automático' : item.origen === 'orden_compra' ? 'Orden Recibida' : 'Manual'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-[11px] text-gray-500">
                          {item.comprobante_ref || '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div>{item.concepto}</div>
                          {item.observaciones && (
                            <p className="text-[10px] text-gray-400 font-normal truncate max-w-xs">{item.observaciones}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">
                          {item.valor_ingreso > 0 ? formatCOP(item.valor_ingreso) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-rose-700">
                          {item.valor_egreso > 0 ? formatCOP(item.valor_egreso) : '—'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {item.origen === 'manual' ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openEditModal(item)}
                                className="p-1 hover:bg-gray-100 text-gray-500 hover:text-gray-800 rounded transition-colors"
                                title="Editar Asiento Manual"
                              >
                                <Edit2 size={12} />
                              </button>
                              <button
                                onClick={() => handleDeleteItem(item.id)}
                                className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                                title="Eliminar Asiento Manual"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] text-gray-400 font-medium px-2 py-0.5 rounded bg-gray-50 border border-gray-100 cursor-default"
                              title={item.origen === 'pos' ? 'Venta registrada desde el POS (Automática, no editable)' : 'Compra registrada desde Órdenes (Automática, no editable)'}
                            >
                              <Lock size={10} className="text-gray-400 shrink-0" />
                              <span>{item.origen === 'pos' ? 'POS' : 'Compra'}</span>
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal for Add / Edit */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="text-[14px] font-bold text-gray-900">
                    {editingItem ? 'Editar Asiento Fiscal' : 'Nuevo Asiento en Libro Fiscal'}
                  </h3>
                  <p className="text-[11px] text-gray-400">Registra ingresos o compras manuales en el libro</p>
                </div>
                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                  <X size={15} />
                </button>
              </div>

              <form onSubmit={handleSaveItem}>
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
                      <label className="font-semibold text-gray-700 block mb-1">Tipo de Registro</label>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setFormTipo('ingreso')}
                          className={[
                            'h-8 rounded-lg text-[11px] font-bold border transition-all',
                            formTipo === 'ingreso'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          ].join(' ')}
                        >
                          Ingreso
                        </button>
                        <button
                          type="button"
                          onClick={() => setFormTipo('egreso')}
                          className={[
                            'h-8 rounded-lg text-[11px] font-bold border transition-all',
                            formTipo === 'egreso'
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                          ].join(' ')}
                        >
                          Egreso
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Concepto / Detalle</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Venta de mostrador no registrada / Compra de mercancía"
                      value={formConcepto}
                      onChange={e => setFormConcepto(e.target.value)}
                      className="w-full h-8 px-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Valor Total COP ($)</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="Ej: 50000"
                        value={formValor}
                        onChange={e => setFormValor(e.target.value)}
                        className="w-full h-8 px-2.5 font-mono font-semibold border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-gray-700 block mb-1">Comprobante / N° Factura</label>
                      <input
                        type="text"
                        placeholder="Ej: FAC-1029 / Ticket #12"
                        value={formComprobante}
                        onChange={e => setFormComprobante(e.target.value)}
                        className="w-full h-8 px-2.5 font-mono border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">Observaciones Fiscales (Opcional)</label>
                    <textarea
                      rows={2}
                      placeholder="Detalles adicionales para auditoría o archivo..."
                      value={formObservaciones}
                      onChange={e => setFormObservaciones(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 bg-white text-[12px]"
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
                    {saving ? 'Guardando...' : 'Guardar Asiento'}
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
