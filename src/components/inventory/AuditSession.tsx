import { useState, useEffect, useRef } from 'react'
import { SesionAuditoria, DetalleSesionAuditoria, auditSessionService } from '../../services/auditSessionService'
import { inventoryService } from '../../services/inventoryService'
import { reorderService, Proveedor } from '../../services/reorderService'
import { Producto } from '../../types'
import { formatCOP } from '../../lib/utils'
import { toast } from '../ui/Toaster'
import { Search, Scan, Save, Check, ArrowLeft, Plus, Trash2, HelpCircle } from 'lucide-react'
import { Select } from '../ui/Select'

interface AuditSessionProps {
  session: SesionAuditoria
  onBack: () => void
  onFinalize: (items: any[]) => void
  usuarioNombre: string
}

export default function AuditSession({ session, onBack, onFinalize, usuarioNombre }: AuditSessionProps) {
  const [products, setProducts] = useState<Producto[]>([])
  const [suppliers, setSuppliers] = useState<Proveedor[]>([])
  const [countedItems, setCountedItems] = useState<Record<string, {
    producto_id: string
    producto_nombre: string
    sku: string
    stock_sistema: number
    cantidad_contada: number
    costo_unitario: number
  }>>({})

  const [search, setSearch] = useState('')
  const [scannedCode, setScannedCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const scanInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadSetupData()
  }, [])

  const loadSetupData = async () => {
    setLoading(true)
    try {
      // 1. Get raw products for reference
      const prods = await inventoryService.getProductos(session.negocio_id)
      const sups = await reorderService.getProveedores(session.negocio_id)
      setSuppliers(sups)

      // 2. Filter products based on session scope
      let filteredProds = [...prods]
      if (session.alcance === 'categoria' && session.filtro_valor) {
        filteredProds = prods.filter(p => p.categoria === session.filtro_valor)
      } else if (session.alcance === 'proveedor' && session.filtro_valor) {
        filteredProds = prods.filter(p => p.proveedor_id === session.filtro_valor)
      }
      setProducts(filteredProds)

      // 3. Load pre-existing details if they exist in the DB (draft mode)
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
        // First count setup: pre-populate target scope list with 0 counted or matching criteria
        filteredProds.forEach(p => {
          countsMap[p.id] = {
            producto_id: p.id,
            producto_nombre: p.nombre,
            sku: p.codigo_barras || '',
            stock_sistema: p.stock_actual,
            cantidad_contada: 0, // start at 0
            costo_unitario: p.precio_costo || 0
          }
        })
      }
      setCountedItems(countsMap)

      // Auto-focus on scan input on mount
      setTimeout(() => scanInputRef.current?.focus(), 150)
    } catch (err: any) {
      toast(err.message || 'Error cargando configuración del conteo', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  // Handle barcode scanner form submission
  const handleScanSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedCode.trim()) return

    const cleanCode = scannedCode.trim()
    // Match by code_barras
    const matched = products.find(p => p.codigo_barras === cleanCode)
    if (matched) {
      // Add or increment count
      setCountedItems(prev => {
        const existing = prev[matched.id]
        return {
          ...prev,
          [matched.id]: {
            producto_id: matched.id,
            producto_nombre: matched.nombre,
            sku: matched.codigo_barras || '',
            stock_sistema: matched.stock_actual,
            cantidad_contada: (existing?.cantidad_contada || 0) + 1,
            costo_unitario: matched.precio_costo || 0
          }
        }
      })
      toast(`Escaneado: ${matched.nombre} (+1)`, { type: 'success' })
    } else {
      toast(`Código "${cleanCode}" no encontrado en el inventario/alcance`, { type: 'error' })
    }
    setScannedCode('')
    scanInputRef.current?.focus()
  }

  const handleManualCountChange = (productId: string, val: string) => {
    const num = parseInt(val)
    const finalVal = isNaN(num) ? 0 : Math.max(0, num)
    setCountedItems(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        cantidad_contada: finalVal
      }
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
    return (
      item.producto_nombre.toLowerCase().includes(s) ||
      item.sku.toLowerCase().includes(s)
    )
  })

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-[12px] text-gray-400">
        Iniciando sesión de conteo y cargando inventario...
      </div>
    )
  }

  return (
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
                filteredDisplayList.map((item) => (
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
                      <div className="flex items-center justify-center gap-1 max-w-[140px] mx-auto">
                        <button
                          type="button"
                          onClick={() => handleManualCountChange(item.producto_id, String(item.cantidad_contada - 1))}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-550 transition-colors"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.cantidad_contada}
                          onChange={(e) => handleManualCountChange(item.producto_id, e.target.value)}
                          className="w-14 h-7 text-center font-mono font-bold border border-gray-200 rounded-md focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleManualCountChange(item.producto_id, String(item.cantidad_contada + 1))}
                          className="w-7 h-7 flex items-center justify-center border border-gray-200 rounded-md hover:bg-gray-50 text-gray-550 transition-colors"
                        >
                          +
                        </button>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
