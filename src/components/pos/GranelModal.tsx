import { useState, useEffect, useRef, useMemo } from 'react'
import { Producto } from '../../types'
import { formatCOP } from '../../lib/utils'
import { X, Scale, DollarSign, Check, Plus } from 'lucide-react'

interface GranelModalProps {
  isOpen: boolean
  producto: Producto | null
  onClose: () => void
  onAddToCart: (producto: Producto, cantidad: number) => void
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
  const inputRef = useRef<HTMLInputElement>(null)

  const unit = producto?.unidad_medida || 'kg'
  const precioUnitario = producto?.precio_venta || 0

  // Focus input and reset when product opens
  useEffect(() => {
    if (isOpen && producto) {
      setMode('dinero')
      setDineroInput('')
      setPesoInput('')
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

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (cantidadFinal <= 0) return

    onAddToCart(producto, cantidadFinal)
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
              <p className="text-[11px] text-slate-500 font-medium">
                Precio base: <span className="font-bold text-slate-900">{formatCOP(precioUnitario)}</span> / {unit}
              </p>
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
                  className="w-full h-12 pl-4 pr-12 text-xl font-bold font-mono border-2 border-slate-300 rounded-xl focus:outline-none focus:border-slate-900 transition-colors bg-white"
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
                        1/4 kg (250g)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(0.5)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        1/2 kg (500g)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(1)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        1 Kilo (1kg)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickWeight(2)}
                        className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        2 Kilos (2kg)
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
                disabled={cantidadFinal <= 0}
                className="flex-2 h-11 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-[13px] font-bold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check size={16} />
                <span>Agregar {formatCOP(totalFinal)}</span>
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  )
}
