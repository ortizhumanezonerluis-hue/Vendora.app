import { useState, useRef } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { useInventory } from '../hooks/useInventory'
import { Producto } from '../types'
import { formatCOP } from '../lib/utils'
import { Scan, Package, Search, CheckCircle, XCircle } from 'lucide-react'

import { useAuth } from '../components/auth/AuthContext'

export default function ScannerPage() {
  const { profile } = useAuth()
  const { productos } = useInventory(profile?.negocio_id)
  const [input, setInput] = useState('')
  const [result, setResult] = useState<Producto | null | 'not_found'>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const search = (code: string) => {
    const trimmed = code.trim()
    if (!trimmed) return
    const found = productos.find(
      (p) => p.codigo_barras === trimmed || p.nombre.toLowerCase().includes(trimmed.toLowerCase())
    )
    setResult(found ?? 'not_found')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      search(input)
    }
  }

  const reset = () => {
    setInput('')
    setResult(null)
    inputRef.current?.focus()
  }

  const found = result && result !== 'not_found' ? result : null
  const notFound = result === 'not_found'

  const getProductStatus = (p: Producto): 'active' | 'low' | 'out' => {
    if (p.stock_actual <= 0) return 'out'
    if (p.stock_actual < p.stock_minimo) return 'low'
    return 'active'
  }

  return (
    <MainLayout title="Escáner">
      <div className="p-5 flex flex-col items-center">
        <div className="w-full max-w-lg space-y-5">
          {/* Scanner input */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-center py-10 border-b border-gray-100">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                  <Scan size={28} className="text-gray-400" />
                </div>
                <p className="text-[14px] font-semibold text-gray-900">Escáner de Código</p>
                <p className="text-[12px] text-gray-400 mt-1">Escanea o escribe el código de barras o nombre del producto</p>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  ref={inputRef}
                  autoFocus
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Código de barras o nombre del producto..."
                  className="w-full h-10 pl-9 pr-4 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-400 focus:border-gray-400 transition-colors"
                />
              </div>
              <button
                onClick={() => search(input)}
                className="w-full mt-3 h-9 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Buscar
              </button>
            </div>
          </div>

          {/* Result */}
          {found && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
                <CheckCircle size={15} className="text-gray-600" />
                <span className="text-[13px] font-semibold text-gray-900">Producto encontrado</span>
              </div>
              <div className="px-5 py-5 space-y-4">
                <div>
                  <p className="text-[18px] font-semibold text-gray-900">{found.nombre}</p>
                  <p className="text-[12px] text-gray-400 font-mono mt-0.5">{found.codigo_barras}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Categoría', value: found.categoria },
                    { label: 'Unidad', value: 'pza' },
                    { label: 'Precio Costo', value: formatCOP(found.precio_costo) },
                    { label: 'Precio Venta', value: formatCOP(found.precio_venta) },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-gray-50 rounded-lg px-3 py-2.5">
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide font-medium">{label}</p>
                      <p className="text-[13px] font-semibold text-gray-900 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
                <div className={[
                  'rounded-lg px-4 py-3 flex items-center justify-between',
                  getProductStatus(found) === 'active' ? 'bg-gray-50' : getProductStatus(found) === 'low' ? 'bg-amber-50' : 'bg-red-50'
                ].join(' ')}>
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">Stock Actual</p>
                    <p className={[
                      'text-3xl font-bold font-mono mt-0.5',
                      getProductStatus(found) === 'active' ? 'text-gray-900' : getProductStatus(found) === 'low' ? 'text-amber-700' : 'text-red-600'
                    ].join(' ')}>
                      {found.stock_actual}
                    </p>
                  </div>
                  <Package size={24} className={getProductStatus(found) === 'active' ? 'text-gray-300' : getProductStatus(found) === 'low' ? 'text-amber-300' : 'text-red-300'} />
                </div>
                <button onClick={reset} className="w-full h-9 border border-gray-200 text-[13px] text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
                  Nueva búsqueda
                </button>
              </div>
            </div>
          )}

          {notFound && (
            <div className="bg-white border border-gray-200 rounded-xl px-6 py-8 text-center">
              <XCircle size={28} className="text-gray-300 mx-auto mb-3" />
              <p className="text-[14px] font-medium text-gray-700">Producto no encontrado</p>
              <p className="text-[12px] text-gray-400 mt-1 mb-4">No se encontró ningún producto con el código o nombre "{input}"</p>
              <button onClick={reset} className="px-4 h-8 border border-gray-200 text-[12px] text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
                Intentar de nuevo
              </button>
            </div>
          )}

          {/* Quick reference */}
          {!result && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <p className="text-[12px] font-medium text-gray-500">Productos recientes</p>
              </div>
              <div className="divide-y divide-gray-50">
                {productos.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setInput(p.codigo_barras); search(p.codigo_barras) }}
                    className="w-full flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-[12px] font-medium text-gray-900">{p.nombre}</p>
                      <p className="text-[11px] font-mono text-gray-400">{p.codigo_barras}</p>
                    </div>
                    <span className="text-[12px] font-semibold font-mono text-gray-700">{formatCOP(p.precio_venta)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
