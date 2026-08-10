import { useState } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { useCashRegister } from '../hooks/useCashRegister'
import { useAuth } from '../components/auth/AuthContext'
import { formatCOP } from '../lib/utils'
import { toast } from '../components/ui/Toaster'
import { SkeletonPage } from '../components/ui/Skeleton'
import {
  Wallet, CheckCircle2, AlertCircle, Banknote,
  CreditCard, Smartphone, X, AlertTriangle, Loader2
} from 'lucide-react'

export default function CashRegisterPage() {
  const { profile, loading: authLoading } = useAuth()
  const userName = profile?.nombre || ''
  const negocioId = profile?.negocio_id || null

  const {
    sales, loading: cashLoading, activeSession,
    openCashRegister, closeCashRegister, error
  } = useCashRegister(userName || undefined, negocioId)

  const loading = authLoading || cashLoading || !profile

  const [montoInicialInput, setMontoInicialInput] = useState('')
  const [cashEntered, setCashEntered] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [closingReport, setClosingReport] = useState<any>(null)
  const [opening, setOpening] = useState(false)

  // Close confirmation modal
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [closing, setClosing] = useState(false)

  const systemTotal = sales.reduce((s, sale) => s + sale.total, 0)
  const cashSales = sales.filter(s => s.metodo_pago === 'efectivo').reduce((s, sale) => s + sale.total, 0)
  const cardSales = sales.filter(s => s.metodo_pago === 'tarjeta').reduce((s, sale) => s + sale.total, 0)
  const transferSales = sales.filter(s => s.metodo_pago === 'transferencia').reduce((s, sale) => s + sale.total, 0)

  const physicalCash = parseFloat(cashEntered) || 0
  const diff = physicalCash - cashSales
  const isMatch = Math.abs(diff) < 0.01

  const handleOpen = async () => {
    if (opening) return
    setOpening(true)
    try {
      const val = parseFloat(montoInicialInput) || 0
      await openCashRegister(val)
      toast('Turno de caja abierto correctamente', { type: 'success' })
      setMontoInicialInput('')
    } catch (err: any) {
      toast(err.message || 'Error abriendo caja', { type: 'error' })
    } finally {
      setOpening(false)
    }
  }

  const handleConfirmClose = async () => {
    if (!cashEntered || closing) return
    setClosing(true)
    try {
      const result = await closeCashRegister(physicalCash, cashSales)
      if (result) {
        setClosingReport(result)
        setSubmitted(true)
        setShowCloseConfirm(false)
        toast('Arqueo de caja registrado correctamente', { type: 'success' })
      }
    } finally {
      setClosing(false)
    }
  }

  const handleReset = () => {
    setSubmitted(false)
    setCashEntered('')
    setClosingReport(null)
  }

  if (loading) {
    return (
      <MainLayout title="Arqueo de Caja">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Arqueo de Caja">
      <div className="p-5 space-y-4 max-w-[1400px] animate-in fade-in duration-300">

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-[12px] rounded-lg border border-red-100 flex items-center gap-2">
            <AlertCircle size={13} />
            {error}
          </div>
        )}

        {!activeSession && !submitted ? (
          /* ─────────────────────────────────────────────────────────────────
             APERTURA DE CAJA — centered card
          ───────────────────────────────────────────────────────────────── */
          <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 w-full max-w-sm shadow-sm space-y-6 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto">
                <Wallet size={24} className="text-gray-900" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-gray-900">Apertura de Caja</p>
                <p className="text-[12px] text-gray-400 mt-1.5 leading-relaxed">
                  Ingresa el efectivo inicial disponible para abrir el turno de hoy
                </p>
              </div>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[15px] font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={montoInicialInput}
                  onChange={(e) => setMontoInicialInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
                  placeholder="0"
                  className="w-full h-11 pl-8 pr-4 text-[16px] font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white text-gray-900 text-center"
                />
              </div>
              <button
                onClick={handleOpen}
                disabled={opening}
                className="w-full h-11 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {opening ? <><Loader2 size={14} className="animate-spin" />Abriendo...</> : 'Abrir Caja Registradora'}
              </button>
            </div>
          </div>
        ) : submitted ? (
          /* ─────────────────────────────────────────────────────────────────
             CIERRE REGISTRADO — success state
          ───────────────────────────────────────────────────────────────── */
          <div className="flex items-center justify-center min-h-[calc(100vh-140px)]">
            <div className="bg-white border border-gray-200 rounded-2xl p-10 w-full max-w-sm shadow-sm text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto">
                <CheckCircle2 size={24} className="text-gray-900" />
              </div>
              <div>
                <p className="text-[16px] font-bold text-gray-900">Arqueo registrado</p>
                <p className="text-[12px] text-gray-400 mt-1.5 leading-relaxed">
                  {closingReport?.diferencia === 0 || isMatch
                    ? 'Cuadre exacto · Sin discrepancias'
                    : `Diferencia de ${formatCOP(Math.abs(closingReport?.diferencia || diff))} registrada`}
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-[12px] text-gray-500 hover:text-gray-700 underline underline-offset-2 transition-colors"
              >
                Ver nuevo arqueo
              </button>
            </div>
          </div>
        ) : (
          /* ─────────────────────────────────────────────────────────────────
             CAJA ACTIVA — main dashboard
          ───────────────────────────────────────────────────────────────── */
          <>
            {/* KPI Stats Row — equal height, clean hierarchy */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  label: 'Total del Día',
                  value: formatCOP(systemTotal),
                  sub: `${sales.length} ventas realizadas`,
                  icon: Wallet
                },
                {
                  label: 'Ventas en Efectivo',
                  value: formatCOP(cashSales),
                  sub: `${sales.filter(s => s.metodo_pago === 'efectivo').length} transacciones`,
                  icon: Banknote
                },
                {
                  label: 'Tarjeta + Transferencia',
                  value: formatCOP(cardSales + transferSales),
                  sub: `${sales.filter(s => s.metodo_pago !== 'efectivo').length} transacciones`,
                  icon: CreditCard
                }
              ].map(({ label, value, sub, icon: Icon }) => (
                <div key={label} className="bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                    <Icon size={14} className="text-gray-300 shrink-0 mt-0.5" />
                  </div>
                  <p className="text-[26px] font-bold font-mono tracking-tight text-gray-900 mt-2">{value}</p>
                  <p className="text-[11px] text-gray-400 mt-1 font-medium">{sub}</p>
                </div>
              ))}
            </div>

            {/* Main Content — 2 column layout */}
            <div className="grid grid-cols-5 gap-4">

              {/* Left column: Conteo + breakdown (3/5) */}
              <div className="col-span-3 space-y-4">

                {/* Conteo Físico de Caja */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-[13px] font-semibold text-gray-900">Conteo Físico de Caja</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Ingresa el efectivo real contado al final del turno</p>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide block mb-1.5">
                        Efectivo físico contado
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-[14px] font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={cashEntered}
                          onChange={(e) => setCashEntered(e.target.value)}
                          placeholder="0"
                          className="w-full h-11 pl-8 pr-4 text-[16px] font-bold border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-200 bg-white"
                        />
                      </div>
                    </div>

                    {cashEntered && (
                      <div className={[
                        'rounded-xl px-4 py-3.5 border',
                        isMatch
                          ? 'bg-emerald-50/40 border-emerald-100'
                          : diff > 0
                          ? 'bg-blue-50/40 border-blue-100'
                          : 'bg-red-50/40 border-red-100'
                      ].join(' ')}>
                        <div className="flex items-center gap-2 mb-3">
                          {isMatch
                            ? <CheckCircle2 size={15} className="text-emerald-600" />
                            : <AlertCircle size={15} className={diff > 0 ? 'text-blue-600' : 'text-red-600'} />
                          }
                          <span className={[
                            'text-[12px] font-bold',
                            isMatch ? 'text-emerald-700' : diff > 0 ? 'text-blue-700' : 'text-red-700'
                          ].join(' ')}>
                            {isMatch ? 'Cuadre exacto ✓' : diff > 0 ? `Sobrante: ${formatCOP(diff)}` : `Faltante: ${formatCOP(Math.abs(diff))}`}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-[12px]">
                          <div className="flex justify-between text-gray-500">
                            <span>Sistema registra (efectivo)</span>
                            <span className="font-mono">{formatCOP(cashSales)}</span>
                          </div>
                          <div className="flex justify-between text-gray-500">
                            <span>Conteo físico ingresado</span>
                            <span className="font-mono">{formatCOP(physicalCash)}</span>
                          </div>
                          <div className={[
                            'flex justify-between font-bold pt-1.5 border-t border-gray-200',
                            isMatch ? 'text-emerald-700' : diff > 0 ? 'text-blue-700' : 'text-red-700'
                          ].join(' ')}>
                            <span>Diferencia</span>
                            <span className="font-mono">{diff >= 0 ? '+' : ''}{formatCOP(diff)}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => cashEntered && setShowCloseConfirm(true)}
                      disabled={!cashEntered}
                      className="w-full h-11 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-40 transition-colors"
                    >
                      Registrar Cierre de Caja
                    </button>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-[13px] font-semibold text-gray-900">Ventas por Método de Pago</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">Resumen del turno actual</p>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {[
                      { method: 'Efectivo', icon: Banknote, key: 'efectivo', value: cashSales },
                      { method: 'Transferencia', icon: Smartphone, key: 'transferencia', value: transferSales },
                      { method: 'Tarjeta', icon: CreditCard, key: 'tarjeta', value: cardSales }
                    ].map(({ method, icon: Icon, key, value }) => {
                      const count = sales.filter(s => s.metodo_pago === key).length
                      return (
                        <div key={key} className="flex items-center justify-between px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                              <Icon size={14} className="text-gray-500" />
                            </div>
                            <div>
                              <p className="text-[13px] font-medium text-gray-900">{method}</p>
                              <p className="text-[11px] text-gray-400">{count} transacciones</p>
                            </div>
                          </div>
                          <span className="text-[14px] font-bold font-mono text-gray-900">{formatCOP(value)}</span>
                        </div>
                      )
                    })}
                    <div className="px-5 py-4 flex items-center justify-between bg-gray-50/50">
                      <span className="text-[13px] font-bold text-gray-900">Total General</span>
                      <span className="text-[16px] font-bold font-mono text-gray-900">{formatCOP(systemTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column: Scrollable transactions (2/5) */}
              <div className="col-span-2 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col" style={{ maxHeight: '520px' }}>
                <div className="px-5 py-4 border-b border-gray-100 shrink-0">
                  <p className="text-[13px] font-semibold text-gray-900">Transacciones del Turno</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Historial en tiempo real · {sales.length} ventas</p>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {sales.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                      <Wallet size={20} className="text-gray-200 mb-2" />
                      <p className="text-[12px] text-gray-400">Sin transacciones aún</p>
                    </div>
                  ) : (
                    sales.map((sale) => (
                      <div
                        key={sale.id}
                        className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div>
                          <p className="text-[12px] font-bold text-gray-900">
                            #{sale.id.slice(0, 8).toUpperCase()}
                          </p>
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {new Date(sale.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-bold font-mono text-gray-900">{formatCOP(sale.total)}</p>
                          <span className="text-[10px] text-gray-400 capitalize">{sale.metodo_pago}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────────
          CLOSE CONFIRMATION MODAL
      ───────────────────────────────────────────────────────────────── */}
      {showCloseConfirm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom-2 duration-200">
            <div className="flex items-start justify-between px-6 pt-5 pb-0">
              <div>
                <p className="text-[15px] font-bold text-gray-900">Confirmar Cierre de Caja</p>
                <p className="text-[12px] text-gray-400 mt-1">Esta acción no se puede deshacer</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-3">
              {/* Summary */}
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <div className="flex justify-between text-[12px] text-gray-600">
                  <span>Total ventas del día</span>
                  <span className="font-semibold font-mono">{formatCOP(systemTotal)}</span>
                </div>
                <div className="flex justify-between text-[12px] text-gray-600">
                  <span>Efectivo en sistema</span>
                  <span className="font-semibold font-mono">{formatCOP(cashSales)}</span>
                </div>
                <div className="flex justify-between text-[12px] text-gray-600">
                  <span>Efectivo físico contado</span>
                  <span className="font-semibold font-mono">{formatCOP(physicalCash)}</span>
                </div>
                <div className={[
                  'flex justify-between font-bold pt-2 border-t border-gray-200 text-[12px]',
                  isMatch ? 'text-emerald-700' : diff < 0 ? 'text-red-600' : 'text-blue-600'
                ].join(' ')}>
                  <span>Diferencia</span>
                  <span className="font-mono">{diff >= 0 ? '+' : ''}{formatCOP(diff)}</span>
                </div>
              </div>

              {!isMatch && (
                <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <AlertTriangle size={14} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                    Hay una diferencia de {formatCOP(Math.abs(diff))} en caja. La discrepancia quedará registrada en el arqueo.
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 px-6 pb-6">
              <button
                type="button"
                onClick={() => setShowCloseConfirm(false)}
                disabled={closing}
                className="flex-1 h-10 border border-gray-200 text-[13px] font-medium text-gray-700 rounded-xl hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                disabled={closing}
                className="flex-1 h-10 bg-gray-900 text-white text-[13px] font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
              >
                {closing ? <><Loader2 size={13} className="animate-spin" />Cerrando...</> : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
