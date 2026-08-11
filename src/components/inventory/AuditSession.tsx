import { useState, useEffect, useRef, useCallback } from 'react'
import { SesionAuditoria, auditSessionService } from '../../services/auditSessionService'
import { inventoryService } from '../../services/inventoryService'
import { reorderService, Proveedor } from '../../services/reorderService'
import { Producto } from '../../types'
import { toast } from '../ui/Toaster'
import { Search, Scan, Save, Check, ArrowLeft, X, Package } from 'lucide-react'
import { useRemoteScanner } from '../../hooks/useRemoteScanner'
import { useAuth } from '../auth/AuthContext'

interface AuditSessionProps {
  session: SesionAuditoria
  onBack: () => void
  onFinalize: (items: any[]) => void
  usuarioNombre: string
}

interface CountedItem {
  producto_id: string
  producto_nombre: string
  sku: string
  stock_sistema: number
  cantidad_contada: number
  costo_unitario: number
}

// ----------- Quantity Modal -----------
interface QuantityModalProps {
  product: Producto
  currentCount: number
  onConfirm: (qty: number) => void
  onClose: () => void
  source: 'scanner' | 'mobile'
}

function QuantityModal({ product, currentCount, onConfirm, onClose, source }: QuantityModalProps) {
  const [qty, setQty] = useState<string>(String(currentCount === 0 ? 1 : currentCount))
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus and select input on mount
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 80)
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Enter') handleConfirm()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [qty])

  const handleConfirm = () => {
    const num = parseInt(qty)
    if (isNaN(num) || num < 0) return
    onConfirm(num)
    onClose()
  }

  const adjust = (delta: number) => {
    const current = parseInt(qty) || 0
    setQty(String(Math.max(0, current + delta)))
  }

  const numVal = parseInt(qty) || 0

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-xs overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
              <Package size={16} className="text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-gray-900 leading-snug">{product.nombre}</p>
              <p className="text-[10px] font-mono text-gray-400 mt-0.5">{product.codigo_barras}</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={[
                  'text-[9px] font-semibold px-1.5 py-0.5 rounded-full',
                  source === 'mobile' ? 'bg-purple-50 text-purple-600 border border-purple-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                ].join(' ')}>
                  {source === 'mobile' ? '📱 Móvil' : '⌨️ Escáner'}
                </span>
                <span className="text-[10px] text-gray-400">Stock sistema: <strong>{product.stock_actual}</strong></span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Quantity input */}
        <div className="px-5 pb-2">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">¿Cuántas unidades contaste?</p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => adjust(-10)}
              className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-bold text-[11px] transition-colors"
            >-10</button>
            <button
              onClick={() => adjust(-1)}
              className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-bold text-[13px] transition-colors"
            >-</button>
            <input
              ref={inputRef}
              type="number"
              min={0}
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              className="flex-1 h-14 text-center text-[28px] font-bold font-mono text-gray-900 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-gray-900 transition-colors"
            />
            <button
              onClick={() => adjust(1)}
              className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-bold text-[13px] transition-colors"
            >+</button>
            <button
              onClick={() => adjust(10)}
              className="w-9 h-9 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 font-bold text-[11px] transition-colors"
            >+10</button>
          </div>
          {currentCount > 0 && (
            <p className="text-[10px] text-gray-400 mt-1.5 text-center">
              Conteo anterior: <strong>{currentCount}</strong> unidades
            </p>
          )}
        </div>

        {/* Quick presets */}
        <div className="px-5 pb-4">
          <p className="text-[10px] text-gray-400 mb-1.5">Acceso rápido:</p>
          <div className="flex gap-1.5 flex-wrap">
            {[1, 6, 12, 24, 48].map(n => (
              <button
                key={n}
                onClick={() => setQty(String(n))}
                className={[
                  'px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors',
                  numVal === n ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                ].join(' ')}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-10 border border-gray-200 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isNaN(numVal) || numVal < 0}
            className="flex-1 h-10 bg-gray-900 hover:bg-gray-800 rounded-xl text-[13px] font-semibold text-white flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40"
          >
            <Check size={14} />
            Guardar {numVal > 0 ? `(${numVal} uds)` : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

// ----------- Main Component -----------
export default function AuditSession({ session, onBack, onFinalize, usuarioNombre }: AuditSessionProps) {
  const [products, setProducts] = useState<Producto[]>([])
  const [suppliers, setSuppliers] = useState<Proveedor[]>([])
  const [countedItems, setCountedItems] = useState<Record<string, CountedItem>>({})
  const [search, setSearch] = useState('')
  const [scannedCode, setScannedCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal state: holds the product to confirm quantity for
  const [qtyModal, setQtyModal] = useState<{ product: Producto; source: 'scanner' | 'mobile' } | null>(null)

  const { profile } = useAuth()
  const scanInputRef = useRef<HTMLInputElement>(null)

  // Opens the quantity modal for a given barcode
  const openQtyModal = useCallback((code: string, source: 'scanner' | 'mobile') => {
    const matched = products.find(p => p.codigo_barras === code)
    if (matched) {
      setQtyModal({ product: matched, source })
    } else {
      toast(`Código "${code}" no encontrado en el inventario/alcance`, { type: 'error' })
    }
  }, [products])

  // Confirm quantity from modal and save to counted items
  const handleQtyConfirm = (qty: number) => {
    if (!qtyModal) return
    const { product } = qtyModal
    setCountedItems(prev => ({
      ...prev,
      [product.id]: {
        producto_id: product.id,
        producto_nombre: product.nombre,
        sku: product.codigo_barras || '',
        stock_sistema: product.stock_actual,
        cantidad_contada: qty,
        costo_unitario: product.precio_costo || 0
      }
    }))
    toast(`✓ ${product.nombre} → ${qty} unidades registradas`, { type: 'success' })
    // Re-focus scan input after modal closes
    setTimeout(() => scanInputRef.current?.focus(), 100)
  }

  // Listen to remote (mobile) scanner — opens quantity modal
  useRemoteScanner(session.negocio_id, profile?.id, (code) => {
    openQtyModal(code, 'mobile')
  })

  useEffect(() => {
    loadSetupData()
  }, [])

  const loadSetupData = async () => {
    setLoading(true)
    try {
      const prods = await inventoryService.getProductos(session.negocio_id)
      const sups = await reorderService.getProveedores(session.negocio_id)
      setSuppliers(sups)

      let filteredProds = [...prods]
      if (session.alcance === 'categoria' && session.filtro_valor) {
        filteredProds = prods.filter(p => p.categoria === session.filtro_valor)
      } else if (session.alcance === 'proveedor' && session.filtro_valor) {
        filteredProds = prods.filter(p => p.proveedor_id === session.filtro_valor)
      }
      setProducts(filteredProds)

      const details = await auditSessionService.getSessionDetails(session.id!)
      const countsMap: typeof countedItems = {}
      if (details.length > 0) {
        details.forEach(det => {
          countsMap[det.producto_id] = {
            producto_id: det.producto_id,
            producto_nombre: det.productos?.nombre || 'Producto',
            sku: det.productos?.codigo_barras || '',
            stock_sistema: det.stock_sistema,
            cantidad_contada: det.cantidad_contada,
            costo_unitario: det.costo_unitario
          }
        })
      } else {
        filteredProds.forEach(p => {
          countsMap[p.id] = {
            producto_id: p.id,
            producto_nombre: p.nombre,
            sku: p.codigo_barras || '',
            stock_sistema: p.stock_actual,
            cantidad_contada: 0,
            costo_unitario: p.precio_costo || 0
          }
        })
      }
      setCountedItems(countsMap)
      setTimeout(() => scanInputRef.current?.focus(), 150)
    } catch (err: any) {
      toast(err.message || 'Error cargando configuración del conteo', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Physical scanner input submission → open modal
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanCode = scannedCode.trim()
    if (!cleanCode) return
    setScannedCode('')
    openQtyModal(cleanCode, 'scanner')
  }

  const handleManualCountChange = (productId: string, val: string) => {
    const num = parseInt(val)
    const finalVal = isNaN(num) ? 0 : Math.max(0, num)
    setCountedItems(prev => ({
      ...prev,
      [productId]: { ...prev[productId], cantidad_contada: finalVal }
    }))
  }

  const handleSaveProgress = async () => {
    setSaving(true)
    try {
      const itemsList = Object.values(countedItems)
      await auditSessionService.saveProgress(session.id!, itemsList)
      toast('Progreso guardado correctamente como borrador', { type: 'success' })
    } catch (err: any) {
      toast(err.message || 'Error guardando borrador', { type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const filteredDisplayList = Object.values(countedItems).filter(item => {
    if (!search.trim()) return true
    const s = search.toLowerCase()
    return item.producto_nombre.toLowerCase().includes(s) || item.sku.toLowerCase().includes(s)
  })

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-[12px] text-gray-400">
        Iniciando sesión de conteo y cargando inventario...
      </div>
    )
  }

  // The product object for the modal (look up from products array)
  const qtyModalProduct = qtyModal
    ? products.find(p => p.id === qtyModal.product.id) ?? qtyModal.product
    : null

  return (
    <>
      {/* Quantity confirmation modal */}
      {qtyModal && qtyModalProduct && (
        <QuantityModal
          product={qtyModalProduct}
          currentCount={countedItems[qtyModalProduct.id]?.cantidad_contada ?? 0}
          source={qtyModal.source}
          onConfirm={handleQtyConfirm}
          onClose={() => {
            setQtyModal(null)
            setTimeout(() => scanInputRef.current?.focus(), 80)
          }}
        />
      )}

      <div className="space-y-4">
        {/* Header action bar */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onBack}
              className="p-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-gray-500"
            >
              <ArrowLeft size={14} />
            </button>
            <div>
              <h2 className="text-[14px] font-bold text-gray-900">{session.nombre}</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">
                Responsable: {session.responsable} · Alcance: {session.alcance === 'todo' ? 'Todo' : session.alcance}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSaveProgress}
              disabled={saving}
              className="px-3 h-8 border border-gray-200 rounded-lg text-[12px] font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
            >
              <Save size={13} />
              {saving ? 'Guardando...' : 'Guardar Progreso'}
            </button>
            <button
              onClick={() => onFinalize(Object.values(countedItems))}
              className="px-3 h-8 bg-gray-950 text-white rounded-lg text-[12px] font-semibold hover:bg-gray-800 flex items-center gap-1.5 transition-colors"
            >
              <Check size={13} />
              Finalizar Conteo
            </button>
          </div>
        </div>

        {/* Scan hint banner */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-[11px] text-blue-700">
          <Scan size={14} className="shrink-0 text-blue-500" />
          <span>
            <strong>Tip:</strong> Al escanear un código, se abre un modal para ingresar la cantidad exacta contada. Usa <kbd className="bg-blue-100 px-1 rounded text-[10px] font-mono">Enter</kbd> para confirmar rápido.
          </span>
        </div>

        {/* Barcode scanner & Search Row */}
        <div className="grid grid-cols-3 gap-3">
          <form onSubmit={handleScanSubmit} className="col-span-1 relative flex items-center">
            <Scan size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              ref={scanInputRef}
              type="text"
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              placeholder="Escanee código de barras..."
              className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-100 focus:bg-white focus:border-gray-300 font-mono transition-all"
            />
          </form>

          <div className="col-span-2 relative flex items-center">
            <Search size={14} className="absolute left-3 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o SKU en la lista..."
              className="w-full h-9 pl-9 pr-3 text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-100 transition-all"
            />
          </div>
        </div>

        {/* Count Sheet */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-y-auto max-h-[460px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider sticky top-0 z-10">
                  <th className="px-5 py-2.5">Producto</th>
                  <th className="px-5 py-2.5">Código SKU</th>
                  {!session.ocultar_teorico && <th className="px-5 py-2.5 text-center">Stock Sistema</th>}
                  <th className="px-5 py-2.5 text-center w-40">Cantidad Física Contada</th>
                  <th className="px-5 py-2.5 text-center w-28">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 text-[12px] text-gray-700">
                {filteredDisplayList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-gray-400">
                      No se encontraron productos coincidentes
                    </td>
                  </tr>
                ) : (
                  filteredDisplayList.map((item) => {
                    const hasDiff = item.cantidad_contada !== item.stock_sistema
                    const diff = item.cantidad_contada - item.stock_sistema
                    return (
                      <tr key={item.producto_id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <span className="font-semibold text-gray-900">{item.producto_nombre}</span>
                        </td>
                        <td className="px-5 py-3 font-mono text-[11px] text-gray-400">{item.sku || '—'}</td>
                        {!session.ocultar_teorico && (
                          <td className="px-5 py-3 text-center font-mono font-semibold text-gray-600">
                            {item.stock_sistema}
                          </td>
                        )}
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="flex items-center gap-1 max-w-[130px]">
                              <button
                                type="button"
                                onClick={() => handleManualCountChange(item.producto_id, String(item.cantidad_contada - 1))}
                                className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition-colors"
                              >-</button>
                              <input
                                type="number"
                                value={item.cantidad_contada}
                                onChange={(e) => handleManualCountChange(item.producto_id, e.target.value)}
                                className={[
                                  'w-14 h-7 text-center font-mono font-bold border rounded-md focus:outline-none transition-colors',
                                  item.cantidad_contada > 0 ? 'border-gray-300 text-gray-900 bg-white' : 'border-gray-200 text-gray-400'
                                ].join(' ')}
                              />
                              <button
                                type="button"
                                onClick={() => handleManualCountChange(item.producto_id, String(item.cantidad_contada + 1))}
                                className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-500 transition-colors"
                              >+</button>
                            </div>
                            {/* Difference badge */}
                            {!session.ocultar_teorico && item.cantidad_contada > 0 && hasDiff && (
                              <span className={[
                                'text-[9px] font-bold px-1.5 py-0.5 rounded-full',
                                diff > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                              ].join(' ')}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleManualCountChange(item.producto_id, String(item.stock_sistema))}
                            className="text-[10px] px-2 py-0.5 border border-gray-200 rounded hover:bg-gray-50 font-medium text-gray-500"
                            title="Igualar stock teórico"
                          >
                            Copiar Teórico
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}
