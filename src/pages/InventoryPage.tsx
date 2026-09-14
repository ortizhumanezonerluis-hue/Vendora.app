import { useState, useMemo, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import { useInventory } from '../hooks/useInventory'
import { useAuth } from '../components/auth/AuthContext'
import { supabase } from '../lib/supabaseClient'
import { Producto } from '../types'
import { formatCOP } from '../lib/utils'
import { toast } from '../components/ui/Toaster'
import { SkeletonPage } from '../components/ui/Skeleton'
import { Select } from '../components/ui/Select'
import { useRemoteScanner } from '../hooks/useRemoteScanner'
import { smartLookupBarcode, indexProductBackground } from '../services/smartProductLookup'
import {
  Search,
  Plus,
  X,
  Package,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  AlertTriangle,
  Trash2,
  Scale,
} from 'lucide-react'

type AdjustReason = 'entry' | 'loss' | 'count'

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Activo', className: 'bg-gray-100 text-gray-600' },
  low: { label: 'Stock bajo', className: 'bg-amber-50 text-amber-700' },
  out: { label: 'Sin stock', className: 'bg-red-50 text-red-600' },
}

const REASON_OPTIONS: { key: AdjustReason; label: string; icon: typeof Plus }[] = [
  { key: 'entry', label: 'Entra Mercancía', icon: TrendingUp },
  { key: 'loss', label: 'Merma / Rotura', icon: TrendingDown },
  { key: 'count', label: 'Ajuste por Conteo', icon: RotateCcw },
]

const MOV_TYPE_ICON: Record<string, { icon: typeof Plus; className: string }> = {
  sale: { icon: TrendingDown, className: 'text-red-500' },
  salida: { icon: TrendingDown, className: 'text-red-500' },
  entry: { icon: TrendingUp, className: 'text-green-600' },
  entrada: { icon: TrendingUp, className: 'text-green-600' },
  adjustment: { icon: RotateCcw, className: 'text-blue-500' },
  ajuste: { icon: RotateCcw, className: 'text-blue-500' },
  loss: { icon: AlertTriangle, className: 'text-amber-500' },
  merma: { icon: AlertTriangle, className: 'text-amber-500' },
}

export default function InventoryPage() {
  const { profile } = useAuth()
  const { productos, movimientos, loading, error, registrarMovimiento, addProducto, deleteProducto } = useInventory(profile?.negocio_id)
  const isAdmin = profile?.rol === 'admin'

  // Capture remote scans for autofilling product creation forms
  useRemoteScanner(profile?.negocio_id, profile?.id, async (code, mode) => {
    if (mode === 'form') {
      setNewProdSku(code)
      setShowAddModal(true)
      toast(`Código cargado desde celular: ${code}`, { type: 'success' })
      
      // Query 3-tier smart catalog cascade
      try {
        const result = await smartLookupBarcode(code)
        if (result) {
          setNewProdName(result.name)
          setNewProdCategory(result.category)
          setNewProdIva(String(result.default_iva))
          toast('🟢 Producto identificado automáticamente', { type: 'success' })
          // Shift focus to price cost input field after a small delay for render
          setTimeout(() => {
            const costEl = document.getElementById('new-prod-cost')
            if (costEl) (costEl as HTMLInputElement).focus()
          }, 200)
        }
      } catch (err) {
        console.warn('Smart lookup failed:', err)
      }
    }
  })

  const [search, setSearch] = useState('')
  const [adjustProduct, setAdjustProduct] = useState<Producto | null>(null)
  const [historyProduct, setHistoryProduct] = useState<Producto | null>(null)
  const [adjustReason, setAdjustReason] = useState<AdjustReason>('entry')
  const [adjustQty, setAdjustQty] = useState('')
  const [adjustNote, setAdjustNote] = useState('')
  const [tab, setTab] = useState<'table' | 'history'>('table')

  // Modal to add a new product
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProdName, setNewProdName] = useState('')
  const [newProdSku, setNewProdSku] = useState('')
  const [newProdCategory, setNewProdCategory] = useState('Abarrotes')
  const [newProdCost, setNewProdCost] = useState('')
  const [newProdSale, setNewProdSale] = useState('')
  const [newProdStock, setNewProdStock] = useState('')
  const [newProdIva, setNewProdIva] = useState('19.00')
  const [newProdSupplier, setNewProdSupplier] = useState('')
  const [newProdEsGranel, setNewProdEsGranel] = useState(false)
  const [newProdUnidad, setNewProdUnidad] = useState('kg')
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState('all')
  const [suppliers, setSuppliers] = useState<any[]>([])

  // Granel configuration
  const [habilitarGranel, setHabilitarGranel] = useState(() => {
    return localStorage.getItem('vendora_habilitar_granel') === 'true'
  })
  const [defaultUnidad, setDefaultUnidad] = useState(() => {
    return localStorage.getItem('vendora_unidad_granel_defecto') || 'kg'
  })

  useEffect(() => {
    async function checkGranelConfig() {
      if (!profile?.negocio_id) return
      try {
        const { data } = await supabase
          .from('configuracion_negocio')
          .select('habilitar_granel, unidad_medida_defecto')
          .eq('negocio_id', profile.negocio_id)
          .maybeSingle()
        if (data) {
          setHabilitarGranel(Boolean(data.habilitar_granel))
          setDefaultUnidad(data.unidad_medida_defecto || 'kg')
          setNewProdUnidad(data.unidad_medida_defecto || 'kg')
          localStorage.setItem('vendora_habilitar_granel', String(Boolean(data.habilitar_granel)))
          localStorage.setItem('vendora_unidad_granel_defecto', data.unidad_medida_defecto || 'kg')
        }
      } catch (_) {}
    }
    checkGranelConfig()
  }, [profile])

  const location = useLocation()

  // Handle auto-open when redirected from POS with a missing scan
  useEffect(() => {
    if (location.state && (location.state as any).autoOpenAddModal) {
      const stateObj = location.state as any
      if (stateObj.autoFillSku) {
        const code = stateObj.autoFillSku
        setNewProdSku(code)
        
        // Query 3-tier smart catalog cascade
        smartLookupBarcode(code).then(result => {
          if (result) {
            setNewProdName(result.name)
            setNewProdCategory(result.category)
            setNewProdIva(String(result.default_iva))
            toast('🟢 Producto identificado automáticamente', { type: 'success' })
            setTimeout(() => {
              const costEl = document.getElementById('new-prod-cost')
              if (costEl) (costEl as HTMLInputElement).focus()
            }, 250)
          }
        }).catch(err => console.warn('Missing scan lookup failed:', err))
      }
      setShowAddModal(true)
      // Clear location state window token
      window.history.replaceState({}, document.title)
    }
  }, [location])

  // Load suppliers for dropdown selection
  useEffect(() => {
    async function loadSuppliers() {
      if (!profile?.negocio_id) return
      try {
        const { data } = await supabase
          .from('proveedores')
          .select('id, nombre')
          .eq('negocio_id', profile.negocio_id)
        setSuppliers(data || [])
      } catch (err) {
        console.warn('Error loading suppliers in inventory:', err)
      }
    }
    loadSuppliers()
  }, [profile])

  const getProductStatus = (p: Producto): 'active' | 'low' | 'out' => {
    if (p.stock_actual <= 0) return 'out'
    if (p.stock_actual < p.stock_minimo) return 'low'
    return 'active'
  }

  const filtered = useMemo(() =>
    productos.filter((p) => {
      const matchSearch = search === '' ||
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo_barras.includes(search) ||
        p.categoria.toLowerCase().includes(search.toLowerCase())
      
      const matchSupplier = selectedSupplierFilter === 'all' || p.proveedor_id === selectedSupplierFilter
      
      return matchSearch && matchSupplier
    }),
    [productos, search, selectedSupplierFilter]
  )

  const productMovements = useMemo(() =>
    historyProduct
      ? movimientos.filter((m) => m.producto_id === historyProduct.id).sort((a, b) => b.fecha.localeCompare(a.fecha))
      : [],
    [movimientos, historyProduct]
  )

  const applyAdjustment = async () => {
    if (!adjustProduct || !adjustQty) return
    const qty = parseInt(adjustQty)
    if (isNaN(qty) || qty === 0) return

    const delta = adjustReason === 'entry' ? qty : -Math.abs(qty)
    const tipo = adjustReason === 'entry' ? 'entrada' : adjustReason === 'loss' ? 'merma' : 'ajuste'
    
    const res = await registrarMovimiento({
      producto_id: adjustProduct.id,
      tipo,
      cantidad: delta,
      motivo: adjustNote || REASON_OPTIONS.find((r) => r.key === adjustReason)!.label,
      usuario_id: profile?.nombre || profile?.id || 'Sistema',
    })

    if (res) {
      toast(`Stock actualizado · ${adjustProduct.nombre}`, { type: 'success' })
    }

    setAdjustProduct(null)
    setAdjustQty('')
    setAdjustNote('')
    setAdjustReason('entry')
  }

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProdName || !newProdSku || !newProdSale) return

    const isGranel = habilitarGranel ? newProdEsGranel : false
    const unidad = isGranel ? newProdUnidad : 'UND'

    const res = await addProducto({
      nombre: newProdName,
      codigo_barras: newProdSku,
      categoria: newProdCategory,
      precio_costo: parseFloat(newProdCost) || 0,
      precio_venta: parseFloat(newProdSale) || 0,
      stock_actual: parseFloat(newProdStock) || 0,
      stock_minimo: 10,
      porcentaje_iva: Number.isFinite(parseFloat(newProdIva)) ? parseFloat(newProdIva) : 19.00,
      proveedor_id: newProdSupplier || null,
      es_granel: isGranel,
      unidad_medida: unidad
    } as any)

    if (res) {
      toast('Producto guardado correctamente en el catálogo', { type: 'success' })
      
      // Auto-learn/Save manually added product to global shared master_catalog in background
      indexProductBackground({
        barcode: newProdSku,
        name: newProdName,
        category: newProdCategory,
        default_iva: Number.isFinite(parseFloat(newProdIva)) ? parseFloat(newProdIva) : 19.00
      })
    }

    setShowAddModal(false)
    setNewProdName('')
    setNewProdSku('')
    setNewProdCost('')
    setNewProdSale('')
    setNewProdStock('')
    setNewProdIva('19.00')
    setNewProdSupplier('')
    setNewProdEsGranel(false)
    setNewProdUnidad(defaultUnidad || 'kg')
  }

  if (loading) {
    return (
      <MainLayout title="Inventario">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Inventario">
      <div className="p-5 space-y-4">
        {/* Summary cards */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total productos', value: productos.length, icon: Package },
            { label: 'Stock General', value: productos.reduce((sum, p) => sum + (p.stock_actual || 0), 0), icon: TrendingUp },
            { label: 'Stock bajo', value: productos.filter((p) => getProductStatus(p) === 'low').length, icon: AlertTriangle },
            { label: 'Sin stock', value: productos.filter((p) => getProductStatus(p) === 'out').length, icon: X },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500 uppercase tracking-wide font-medium">{label}</span>
                <Icon size={13} className="text-gray-400" />
              </div>
              <p className="text-2xl font-semibold text-gray-900 mt-1 font-mono">{value}</p>
            </div>
          ))}
        </div>

        {/* Tabs and Add Product Button */}
        <div className="flex justify-between items-end border-b border-gray-200">
          <div className="flex gap-0">
            {(['table', 'history'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={[
                  'px-4 py-2.5 text-[13px] font-medium border-b-2 -mb-px transition-colors',
                  tab === t
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                {t === 'table' ? 'Productos' : 'Historial (Kardex)'}
              </button>
            ))}
          </div>
          {tab === 'table' && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 h-8 mb-2 bg-gray-900 text-white text-[12px] font-medium rounded-md hover:bg-gray-800 transition-colors flex items-center gap-1.5"
            >
              <Plus size={13} />
              Agregar Producto
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-[12px] rounded-lg border border-red-100">
            Error: {error}
          </div>
        )}

        {tab === 'table' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1">
                <div className="relative w-full max-w-xs">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Buscar producto..."
                    className="w-full h-8 pl-8 pr-3 text-[13px] border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-colors"
                  />
                </div>
                <Select
                  value={selectedSupplierFilter}
                  onChange={(e) => setSelectedSupplierFilter(e.target.value)}
                  className="h-8 w-44"
                >
                  <option value="all">Todos los Proveedores</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.nombre}</option>
                  ))}
                </Select>
              </div>
              <span className="text-[12px] text-gray-400">{filtered.length} resultados</span>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['CÓDIGO DE BARRAS', 'Nombre', 'Proveedor', 'Categoría', 'Costo', 'Precio Venta', 'IVA', 'Stock', 'Estado', ''].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[13px] text-gray-400">
                        Cargando productos...
                      </td>
                    </tr>
                  ) : filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-[13px] text-gray-400">
                        Sin productos registrados
                      </td>
                    </tr>
                  ) : (
                    filtered.map((product) => {
                      const status = getProductStatus(product)
                      const st = STATUS_LABELS[status]
                      return (
                        <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-[11px] text-gray-400">{product.codigo_barras}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-medium text-gray-900">{product.nombre}</span>
                              {product.es_granel && (
                                <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[9px] font-bold rounded uppercase flex items-center gap-0.5 border border-blue-200/60 shrink-0">
                                  <Scale size={9} />
                                  <span>{product.unidad_medida || 'kg'}</span>
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[12px] font-medium text-gray-600">
                              {suppliers.find(s => s.id === product.proveedor_id)?.nombre || '—'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[12px] text-gray-500">{product.categoria}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[12px] font-mono text-gray-600">{formatCOP(product.precio_costo)}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[13px] font-semibold font-mono text-gray-900">{formatCOP(product.precio_venta)}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-[12px] font-mono text-gray-600">{(product as any).porcentaje_iva ?? 19}%</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={[
                              'text-[13px] font-mono font-semibold',
                              product.stock_actual === 0 ? 'text-red-600' : product.stock_actual < product.stock_minimo ? 'text-amber-600' : 'text-gray-900'
                            ].join(' ')}>
                              {product.stock_actual}
                            </span>
                            <span className="text-[11px] text-gray-400 ml-1">
                              {product.es_granel ? (product.unidad_medida || 'kg') : 'ud'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${st?.className}`}>
                              {st?.label}
                            </span>
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => setAdjustProduct(product)}
                                className="px-2.5 py-1 text-[11px] font-medium border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
                              >
                                Ajustar
                              </button>
                              <button
                                onClick={() => { setHistoryProduct(product); setTab('history') }}
                                className="px-2.5 py-1 text-[11px] font-medium border border-gray-200 rounded text-gray-600 hover:bg-gray-100 transition-colors"
                              >
                                Kardex
                              </button>
                              {isAdmin && (
                                <button
                                  onClick={async () => {
                                    if (!window.confirm(`¿Eliminar "${product.nombre}" del catálogo? Esta acción no se puede deshacer.`)) return
                                    try {
                                      await deleteProducto(product.id)
                                      toast(`"${product.nombre}" eliminado del catálogo`, { type: 'success' })
                                    } catch (err: any) {
                                      toast(err.message || 'Error al eliminar. Verifique que no tenga ventas o movimientos asociados.', { type: 'error' })
                                    }
                                  }}
                                  title="Eliminar producto"
                                  className="h-7 w-7 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
              {historyProduct ? (
                <>
                  <Package size={14} className="text-gray-400" />
                  <span className="text-[13px] font-medium text-gray-900">{historyProduct.nombre}</span>
                  <button
                    onClick={() => setHistoryProduct(null)}
                    className="ml-auto text-[12px] text-gray-400 hover:text-gray-600 flex items-center gap-1"
                  >
                    <X size={12} /> Cerrar
                  </button>
                </>
              ) : (
                <span className="text-[13px] text-gray-400">Selecciona un producto desde la tabla para ver su Kardex</span>
              )}
            </div>

            {historyProduct && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Fecha', 'Tipo', 'Cantidad', 'Motivo', 'Usuario'].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-gray-400">
                          Cargando historial...
                        </td>
                      </tr>
                    ) : productMovements.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-[13px] text-gray-400">
                          Sin movimientos registrados
                        </td>
                      </tr>
                    ) : (
                      productMovements.map((mov) => {
                        const mt = MOV_TYPE_ICON[mov.tipo] || { icon: RotateCcw, className: 'text-blue-500' }
                        const Icon = mt.icon
                        return (
                          <tr key={mov.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-2.5 font-mono text-[11px] text-gray-400">
                              {new Date(mov.fecha).toLocaleString()}
                            </td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <Icon size={12} className={mt.className} />
                                <span className="text-[12px] capitalize text-gray-600">
                                  {mov.tipo === 'entrada' ? 'Entrada' : mov.tipo === 'salida' ? 'Salida' : mov.tipo === 'merma' ? 'Merma' : 'Ajuste'}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={[
                                'font-mono text-[13px] font-semibold',
                                mov.cantidad > 0 ? 'text-green-600' : 'text-red-600'
                              ].join(' ')}>
                                {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-[12px] text-gray-600">{mov.motivo}</td>
                            <td className="px-4 py-2.5 text-[12px] text-gray-500">{mov.usuario_id}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adjust Modal */}
      {adjustProduct && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Ajustar Stock</p>
                <p className="text-[12px] text-gray-400 mt-0.5 truncate">{adjustProduct.nombre}</p>
              </div>
              <button onClick={() => setAdjustProduct(null)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-2">Motivo del ajuste</label>
                <div className="space-y-1.5">
                  {REASON_OPTIONS.map(({ key, label, icon: Icon }) => (
                    <label key={key} className={[
                       'flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors',
                       adjustReason === key ? 'border-gray-900 bg-gray-50' : 'border-gray-200 hover:border-gray-300'
                    ].join(' ')}>
                      <input
                        type="radio"
                        name="reason"
                        value={key}
                        checked={adjustReason === key}
                        onChange={() => setAdjustReason(key)}
                        className="sr-only"
                      />
                      <Icon size={14} className={adjustReason === key ? 'text-gray-900' : 'text-gray-400'} />
                      <span className="text-[13px] font-medium text-gray-700">{label}</span>
                      {adjustReason === key && (
                        <div className="ml-auto w-4 h-4 rounded-full bg-gray-900 flex items-center justify-center">
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">
                  Cantidad · Stock actual: <span className="text-gray-900">{adjustProduct.stock_actual}</span>
                </label>
                <input
                  type="number"
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="Ej: 12"
                  className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1.5">Nota (opcional)</label>
                <input
                  type="text"
                  value={adjustNote}
                  onChange={(e) => setAdjustNote(e.target.value)}
                  placeholder="Descripción del ajuste..."
                  className="w-full h-9 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
                />
              </div>

              {adjustQty && !isNaN(parseInt(adjustQty)) && (
                <div className="bg-gray-50 rounded-lg px-3 py-2.5 text-[12px] text-gray-600">
                  Nuevo stock estimado:{' '}
                  <span className="font-semibold text-gray-900 font-mono">
                    {Math.max(0, adjustProduct.stock_actual + (adjustReason === 'entry' ? parseInt(adjustQty) : -Math.abs(parseInt(adjustQty))))}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                onClick={() => setAdjustProduct(null)}
                className="flex-1 h-9 border border-gray-200 text-[13px] text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={applyAdjustment}
                disabled={!adjustQty || isNaN(parseInt(adjustQty))}
                className="flex-1 h-9 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                Aplicar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddProduct} className="bg-white rounded-xl border border-gray-200 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-[13px] font-semibold text-gray-900">Agregar Nuevo Producto</p>
                <p className="text-[12px] text-gray-400 mt-0.5">Ingresa los detalles del producto</p>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-1.5 rounded-md text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              {/* Granel type toggle if enabled for store */}
              {habilitarGranel && (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                  <label className="text-[11px] font-semibold text-slate-700 block">Tipo de Producto</label>
                  <div className="grid grid-cols-2 gap-1.5 p-0.5 bg-white border border-slate-200 rounded-md">
                    <button
                      type="button"
                      onClick={() => setNewProdEsGranel(false)}
                      className={[
                        'py-1 text-[11px] font-bold rounded transition-all cursor-pointer',
                        !newProdEsGranel ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                      ].join(' ')}
                    >
                      📦 Por Unidad (UND)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewProdEsGranel(true)}
                      className={[
                        'py-1 text-[11px] font-bold rounded transition-all cursor-pointer flex items-center justify-center gap-1',
                        newProdEsGranel ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-900'
                      ].join(' ')}
                    >
                      <Scale size={12} />
                      <span>A Granel / Peso</span>
                    </button>
                  </div>

                  {newProdEsGranel && (
                    <div className="flex items-center justify-between gap-2 pt-1 animate-in fade-in duration-100">
                      <span className="text-[11px] font-medium text-slate-600">Unidad de Medida:</span>
                      <select
                        value={newProdUnidad}
                        onChange={(e) => setNewProdUnidad(e.target.value)}
                        className="h-7 px-2 text-[11px] font-bold border border-slate-200 rounded-md bg-white focus:outline-none"
                      >
                        <option value="kg">Kilogramos (kg)</option>
                        <option value="lb">Libras (lb)</option>
                        <option value="g">Gramos (g)</option>
                        <option value="L">Litros (L)</option>
                        <option value="m">Metros (m)</option>
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder={newProdEsGranel ? 'Ej: Queso Costeño Fresco' : 'Ej: Leche Lala 1L'}
                  className="w-full h-8 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Código de Barras o PLU</label>
                <input
                  type="text"
                  required
                  value={newProdSku}
                  onChange={(e) => setNewProdSku(e.target.value)}
                  placeholder="Ej: 7501055300897 o 001"
                  className="w-full h-8 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Categoría</label>
                <Select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                >
                  {['Abarrotes', 'Lácteos', 'Bebidas', 'Frutas y Verduras', 'Panadería', 'Limpieza', 'Higiene Personal'].map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Costo ($)</label>
                  <input
                    id="new-prod-cost"
                    type="number"
                    step="0.01"
                    value={newProdCost}
                    onChange={(e) => setNewProdCost(e.target.value)}
                    placeholder="12500"
                    className="w-full h-8 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1 truncate" title={newProdEsGranel ? `Venta ($ / ${newProdUnidad})` : 'Venta ($)'}>
                    {newProdEsGranel ? `Venta (/${newProdUnidad})` : 'Venta ($)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newProdSale}
                    onChange={(e) => setNewProdSale(e.target.value)}
                    placeholder="18000"
                    className="w-full h-8 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">IVA (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newProdIva}
                    onChange={(e) => setNewProdIva(e.target.value)}
                    placeholder="19"
                    className="w-full h-8 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1 truncate" title={newProdEsGranel ? `Stock (${newProdUnidad})` : 'Stock (ud)'}>
                    {newProdEsGranel ? `Stock (${newProdUnidad})` : 'Stock (ud)'}
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    placeholder={newProdEsGranel ? '45.5' : '50'}
                    className="w-full h-8 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-gray-500 uppercase tracking-wide block mb-1">Proveedor</label>
                  <Select
                    value={newProdSupplier}
                    onChange={(e) => setNewProdSupplier(e.target.value)}
                  >
                    <option value="">Selecciona Proveedor</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 px-5 pb-5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 h-9 border border-gray-200 text-[13px] text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 h-9 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Guardar Producto
              </button>
            </div>
          </form>
        </div>
      )}
    </MainLayout>
  )
}
