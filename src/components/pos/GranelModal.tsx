import { useState, useEffect, useRef, useMemo } from 'react'
import { Producto } from '../../types'
import { formatCOP } from '../../lib/utils'
import { X, Scale, DollarSign, Check, AlertTriangle, RefreshCw } from 'lucide-react'

interface GranelModalProps {
  isOpen: boolean
  producto: Producto | null
  onClose: () => void
  onAddToCart: (producto: Producto, cantidad: number, allowOverstock?: boolean) => void
}

export default function GranelModal({
  isOpen,
  producto,
  onClose,
  onAddToCart
}: GranelModalProps) {
  const [mode, setMode] = useState<'dinero' | 'peso'>('dinero')
  const [dineroInput, setDineroInput] = useState('')
  const [pesoInput, setPesoInput] = useState('')
  const [allowOverstock, setAllowOverstock] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const unit = producto?.unidad_medida || 'kg'
  const precioUnitario = producto?.precio_venta || 0
  const stockDisponible = Math.max(0, producto?.stock_actual || 0)

  // Focus input and reset when product opens
  useEffect(() => {
    if (isOpen && producto) {
      setMode('dinero')
      setDineroInput('')
      setPesoInput('')
      setAllowOverstock(false)
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    }
  }, [isOpen, producto])

  // Calculated values
  const { cantidadFinal, totalFinal } = useMemo(() => {
    if (!producto || precioUnitario <= 0) return { cantidadFinal: 0, totalFinal: 0 }

    if (mode === 'dinero') {
      const dinero = parseFloat(dineroInput) || 0
      const peso = dinero / precioUnitario
      return { cantidadFinal: peso, totalFinal: dinero }
    } else {
      const peso = parseFloat(pesoInput) || 0
      const dinero = peso * precioUnitario
      return { cantidadFinal: peso, totalFinal: dinero }
    }
  }, [mode, dineroInput, pesoInput, precioUnitario, producto])

  // Check if requested quantity exceeds available inventory
  const isOverStock = cantidadFinal > stockDisponible && cantidadFinal > 0

  if (!isOpen || !producto) return null

  const handleQuickMoney = (amount: number) => {
    setMode('dinero')
    setDineroInput(String(amount))
    setPesoInput((amount / precioUnitario).toFixed(3))
  }

  const handleQuickWeight = (weight: number) => {
    setMode('peso')
    setPesoInput(String(weight))
    setDineroInput(String(Math.round(weight * precioUnitario)))
  }

  const handleAdjustToAvailableStock = () => {
    const maxMoney = Math.round(stockDisponible * precioUnitario)
    if (mode === 'dinero') {
      setDineroInput(String(maxMoney))
      setPesoInput(stockDisponible.toFixed(3))
    } else {
      setPesoInput(stockDisponible.toFixed(3))
      setDineroInput(String(maxMoney))
    }
    setAllowOverstock(false)
  }

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (cantidadFinal <= 0) return

    // If over-stock and not authorized, prevent accidental submission
    if (isOverStock && !allowOverstock) {
      return
    }

    onAddToCart(producto, cantidadFinal, allowOverstock)
    onClose()
  }

  // Predefined quick buttons
  const quickMoneyAmounts = [2000, 3000, 4000, 5000, 10000, 20000]
  const isKilos = unit === 'kg' || unit === 'Kilogramos'
  const isLbs = unit === 'lb' || unit === 'Libras'

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0">
              <Scale size={16} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[14px] font-bold text-slate-900 truncate">{producto.nombre}</h3>
                <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[10px] font-bold rounded uppercase">
                  {unit}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[11px] text-slate-500 font-medium">
                  Precio: <span className="font-bold text-slate-900">{formatCOP(precioUnitario)}</span>/{unit}
                </p>
                <span className="text-slate-300">·</span>
                <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                  <span>Stock:</span>
                  <span className={stockDisponible === 0 ? 'text-red-600 font-mono' : 'text-emerald-700 font-mono'}>
                    {stockDisponible.toFixed(3)} {unit}
                  </span>
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('dinero')
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
              className={[
                'py-2 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                mode === 'dinero'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              ].join(' ')}
            >
              <DollarSign size={14} />
              <span>Por Dinero ($)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMode('peso')
                setTimeout(() => inputRef.current?.focus(), 50)
              }}
              className={[
                'py-2 rounded-lg text-[12px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                mode === 'peso'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              ].join(' ')}
            >
              <Scale size={14} />
              <span>Por Peso ({unit})</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Main Input */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                {mode === 'dinero' ? '¿Cuánto dinero pide el cliente?' : `Peso exacto en balanza (${unit})`}
              </label>

              <div className="relative">
                <input
                  ref={inputRef}
                  type="number"
                  step="any"
                  autoFocus
                  required
                  placeholder={mode === 'dinero' ? 'Ej: 4000' : 'Ej: 0.500'}
                  value={mode === 'dinero' ? dineroInput : pesoInput}
                  onChange={(e) => {
                    const val = e.target.value
                    if (mode === 'dinero') {
                      setDineroInput(val)
                      const num = parseFloat(val) || 0
                      setPesoInput(num > 0 ? (num / precioUnitario).toFixed(3) : '')
                    } else {
                      setPesoInput(val)
                      const num = parseFloat(val) || 0
                      setDineroInput(num > 0 ? String(Math.round(num * precioUnitario)) : '')
                    }
                  }}
                  className={[
                    'w-full h-12 pl-4 pr-12 text-xl font-bold font-mono border-2 rounded-xl focus:outline-none transition-colors bg-white',
                    isOverStock ? 'border-amber-400 focus:border-amber-600 text-slate-900' : 'border-slate-300 focus:border-slate-900'
                  ].join(' ')}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[12px] font-bold text-slate-400">
                  {mode === 'dinero' ? 'COP' : unit}
                </span>
              </div>
            </div>

            {/* Real-time Conversion Result Box */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  {mode === 'dinero' ? '⚖️ Peso a despachar' : '💵 Total a cobrar'}
                </span>
                <p className="text-lg font-extrabold text-slate-900 font-mono">
                  {mode === 'dinero' ? `${cantidadFinal.toFixed(3)} ${unit}` : formatCOP(totalFinal)}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">
                  {mode === 'dinero' ? 'Total en Venta' : 'Cantidad'}
                </span>
                <p className="text-sm font-semibold text-slate-600 font-mono">
                  {mode === 'dinero' ? formatCOP(totalFinal) : `${cantidadFinal.toFixed(3)} ${unit}`}
                </p>
              </div>
            </div>

            {/* OVER-STOCK ALERT & INTELLIGENT RESOLUTION BOX */}
            {isOverStock && (
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-[12px] text-amber-900 leading-snug">
                    <p className="font-bold">⚠️ Stock insuficiente en sistema</p>
                    <p className="mt-0.5 text-amber-800">
                      Pides <span className="font-bold font-mono">{cantidadFinal.toFixed(3)} {unit}</span> ({formatCOP(totalFinal)}), pero solo hay <span className="font-bold font-mono">{stockDisponible.toFixed(3)} {unit}</span> ({formatCOP(stockDisponible * precioUnitario)}) en inventario.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1 border-t border-amber-200/60">
                  <button
                    type="button"
                    onClick={handleAdjustToAvailableStock}
                    className="flex-1 py-2 px-2.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <RefreshCw size={12} />
                    <span>Ajustar a {stockDisponible.toFixed(3)} {unit} ({formatCOP(stockDisponible * precioUnitario)})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAllowOverstock(!allowOverstock)}
                    className={[
                      'py-2 px-2.5 border text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer',
                      allowOverstock
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-amber-300 hover:bg-amber-100/60'
                    ].join(' ')}
                  >
                    <span>{allowOverstock ? '✓ Sobreventa Permitida' : 'Vender faltante de todos modos'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick 1-Click Buttons */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                Botones Rápidos de 1 Clic:
              </span>

              {mode === 'dinero' ? (
                <div className="grid grid-cols-3 gap-1.5">
                  {quickMoneyAmounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickMoney(amt)}
                      className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      ${amt.toLocaleString()}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-1.5">
                  {isKilos && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(0.25)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        1/4 kg
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(0.5)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        1/2 kg
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(1)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        1 Kilo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(2)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        2 Kilos
                      </button>
                    </>
                  )}
                  {isLbs && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(0.5)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        1/2 Libra
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(1)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        1 Libra
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(2)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        2 Libras
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(5)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        5 Libras
                      </button>
                    </>
                  )}
                  {!isKilos && !isLbs && (
                    <>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(0.5)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        0.5 {unit}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(1)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        1 {unit}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(2)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        2 {unit}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(5)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        5 {unit}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-11 border border-slate-200 hover:bg-slate-100 text-slate-700 text-[13px] font-bold rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={cantidadFinal <= 0 || (isOverStock && !allowOverstock)}
                className={[
                  'flex-2 h-11 text-white text-[13px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer',
                  (isOverStock && !allowOverstock)
                    ? 'bg-amber-500 hover:bg-amber-600 opacity-90'
                    : 'bg-slate-900 hover:bg-slate-800 disabled:opacity-40'
                ].join(' ')}
              >
                {isOverStock && !allowOverstock ? (
                  <>
                    <AlertTriangle size={15} />
                    <span>Ajusta stock o autoriza</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Agregar {formatCOP(totalFinal)} ({cantidadFinal.toFixed(2)} {unit})</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}

