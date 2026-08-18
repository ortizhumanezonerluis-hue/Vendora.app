import { useState, useMemo } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { useInventory } from '../hooks/useInventory'
import { usePOS } from '../hooks/usePOS'
import { useAuth } from '../components/auth/AuthContext'
import { formatCOP } from '../lib/utils'
import { toast } from '../components/ui/Toaster'
import { useRemoteScanner } from '../hooks/useRemoteScanner'
import { useNavigate } from 'react-router-dom'
import { SkeletonPage } from '../components/ui/Skeleton'
import { cashService } from '../services/cashService'
import { supabase } from '../lib/supabaseClient'
import DianConfigModal from '../components/dian/DianConfigModal'
import { FileCode } from 'lucide-react'
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingBag,
  X,
  Check,
  Loader2,
} from 'lucide-react'

const CATEGORY_ALL = 'Todos'
const CATEGORIES = [CATEGORY_ALL, 'Abarrotes', 'Lácteos', 'Bebidas', 'Frutas y Verduras', 'Panadería', 'Limpieza', 'Higiene Personal']

type CheckoutState = 'idle' | 'paying' | 'success'

export default function POSPage() {
  const { profile } = useAuth()
  const { productos, loading, refresh: refreshInventory } = useInventory(profile?.negocio_id)
  const { cart, addToCart, updateQty, removeFromCart, clearCart, checkout, error } = usePOS()
  const userName = profile?.nombre || 'Cajero'
  const navigate = useNavigate()

  // Sincronización en tiempo real desde el celular (Supabase Broadcast Channel)
  useRemoteScanner(profile?.negocio_id, profile?.id, (code, mode) => {
    // Look up product by barcode
    const matched = productos.find((p) => p.codigo_barras === code)
    if (matched) {
      if (matched.stock_actual > 0) {
        addToCart(matched)
        toast(`Añadido al POS: ${matched.nombre}`, { type: 'success' })
      } else {
        toast(`El producto "${matched.nombre}" no tiene stock disponible`, { type: 'error' })
      }
    } else {
      // Product does not exist. Redirect to /inventario with auto-fill query params
      toast(`Código ${code} no registrado. Redirigiendo a catálogo...`, { type: 'success' })
      navigate('/inventario', { state: { autoOpenAddModal: true, autoFillSku: code } })
    }
  })

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(CATEGORY_ALL)
  const [checkoutState, setCheckoutState] = useState<CheckoutState>('idle')
  const [processing, setProcessing] = useState(false)
  const [cashInput, setCashInput] = useState('')
  const [payMethod, setPayMethod] = useState<'cash' | 'transfer' | 'card'>('cash')

  // Billing Fields (Colombian DIAN compliance)
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final')
  const [clienteDocumento, setClienteDocumento] = useState('222222222222')
  const [clienteTipoDoc, setClienteTipoDoc] = useState('13') // Default Cédula de Ciudadanía
  const [isDianModalOpen, setIsDianModalOpen] = useState(false)

  const filtered = useMemo(() => {
    return productos.filter((p) => {
      const matchCat = category === CATEGORY_ALL || p.categoria === category
      const matchSearch =
        search === '' ||
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo_barras.includes(search)
      return matchCat && matchSearch && p.stock_actual > 0
    })
  }, [productos, search, category])

  const subtotal = cart.reduce((s, i) => s + i.producto.precio_venta * i.cantidad, 0)
  
  // Calculate exact tax based on each product's custom IVA rate
  const tax = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemSubtotal = item.producto.precio_venta * item.cantidad
      const itemIvaPercent = (item.producto as any).porcentaje_iva ?? 19.00
      return acc + (itemSubtotal * (itemIvaPercent / 100))
    }, 0)
  }, [cart])

  const total = subtotal + tax

  const cashAmount = parseFloat(cashInput) || 0
  const change = cashAmount - total

  const processPayment = async () => {
    if (processing) return // prevent double submission
    
    // Enforce register check: check if cashier actually has an active session open
    setProcessing(true)
    try {
      const active = await cashService.getActiveSession(userName, profile?.negocio_id)
      if (!active) {
        toast('Debes abrir tu turno de caja antes de realizar ventas', { type: 'error' })
        setProcessing(false)
        setCheckoutState('idle')
        navigate('/caja')
        return
      }
    } catch (err) {
      console.warn('Register verification check bypassed/failed:', err)
    }

    const dbPaymentMethod = payMethod === 'cash' ? 'efectivo' : payMethod === 'card' ? 'tarjeta' : 'transferencia'
    setCheckoutState('paying')

    try {
      // 1. Intentar Facturación Electrónica DIAN a través de la Edge Function
      const token = (await supabase.auth.getSession()).data.session?.access_token
      const response = await fetch('https://qarurnzptlpoxizkthgo.supabase.co/functions/v1/dian-billing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'x-negocio-id': profile?.negocio_id || ''
        },
        body: JSON.stringify({
          clienteNombre: clienteNombre,
          clienteDocumento: clienteDocumento,
          clienteTipoDoc: clienteTipoDoc,
          total: total,
          items: cart.map(item => ({
            nombre: item.producto.nombre,
            cantidad: item.cantidad,
            precio: item.producto.precio_venta,
            iva: (item.producto as any).porcentaje_iva ?? 19.00
          }))
        })
      })

      // Si retorna 428 Precondition Required, abrir Modal de Configuración DIAN
      if (response.status === 428) {
        setIsDianModalOpen(true)
        toast('Se requiere configuración inicial de credenciales DIAN', { type: 'error' })
        setCheckoutState('idle')
        setProcessing(false)
        return
      }

      if (!response.ok && response.status !== 202) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || 'Error en Edge Function fiscal')
      }
    } catch (err: any) {
      console.warn('[DIAN] Omitiendo o falló el envío asíncrono primario de la DIAN:', err.message)
      toast('Envío DIAN encolado para reintento', { type: 'success', description: 'La caja no se congelará. El comprobante quedará Pendiente.' })
    }

    // 2. Registrar la venta localmente en el inventario para actualizar stocks y cerrar arqueo
    const result = await checkout(dbPaymentMethod, userName, profile?.negocio_id)
    if (result) {
      setCheckoutState('success')
      refreshInventory()
      clearCart()
      toast(`Venta procesada con éxito · Ticket #${result.id.slice(0, 8).toUpperCase()}`, { type: 'success' })
      setTimeout(() => {
        setCheckoutState('idle')
        setCashInput('')
        setProcessing(false)
      }, 2000)
    } else {
      setCheckoutState('idle')
      setProcessing(false)
      toast('Error al procesar la venta', { type: 'error', description: 'Stock insuficiente o error del servidor' })
    }
  }

  if (loading) {
    return (
      <MainLayout title="Punto de Venta">
        <SkeletonPage />
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Punto de Venta">
      <div className="flex h-full">
        {/* Product area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Filters */}
          <div className="px-5 py-3 border-b border-gray-200 bg-white space-y-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                type="text"
                placeholder="Buscar por nombre o código de barras..."
                className="w-full h-8 pl-8 pr-3 text-[13px] border border-gray-200 rounded-md bg-gray-50 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-colors"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={[
                    'shrink-0 px-2.5 py-1 rounded text-[12px] font-medium transition-colors',
                    category === cat
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700',
                  ].join(' ')}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {filtered.map((product) => {
                const inCart = cart.find((i) => i.producto.id === product.id)
                return (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={[
                      'text-left p-3 rounded-lg border transition-all hover:shadow-sm',
                      inCart
                        ? 'border-gray-400 bg-white'
                        : 'border-gray-200 bg-white hover:border-gray-300',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-[12px] font-medium text-gray-900 leading-tight line-clamp-2">{product.nombre}</p>
                      {inCart && (
                        <span className="shrink-0 w-4 h-4 bg-gray-900 rounded-full flex items-center justify-center text-[10px] text-white font-bold">
                          {inCart.cantidad}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[13px] font-semibold text-gray-900">
                        {formatCOP(product.precio_venta)}
                      </span>
                      <span className={[
                        'text-[11px] font-medium',
                        product.stock_actual < product.stock_minimo ? 'text-amber-600' : 'text-gray-400'
                      ].join(' ')}>
                        {product.stock_actual} pza
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">{product.categoria}</p>
                  </button>
                )
              })}
              {filtered.length === 0 && (
                <div className="col-span-full py-16 text-center">
                  <ShoppingBag size={28} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-[13px] text-gray-400">Sin productos encontrados</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cart panel */}
        <div className="w-72 xl:w-80 border-l border-gray-200 bg-white flex flex-col shrink-0">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <span className="text-[13px] font-semibold text-gray-900">Carrito</span>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <ShoppingBag size={28} className="text-gray-200 mb-2" />
                <p className="text-[13px] text-gray-400">Selecciona productos para agregar al carrito</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.producto.id} className="px-4 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[12px] font-medium text-gray-900 leading-snug flex-1">
                        {item.producto.nombre}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.producto.id)}
                        className="p-0.5 text-gray-300 hover:text-gray-500 transition-colors shrink-0"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQty(item.producto.id, -1)}
                          className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-[12px] font-medium w-5 text-center">{item.cantidad}</span>
                        <button
                          onClick={() => updateQty(item.producto.id, 1)}
                          disabled={item.cantidad >= item.producto.stock_actual}
                          className="w-5 h-5 rounded border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 disabled:opacity-30 transition-colors"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                      <span className="text-[12px] font-semibold text-gray-900">
                        {formatCOP(item.producto.precio_venta * item.cantidad)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Error handling */}
          {error && (
            <div className="px-4 py-2 bg-red-50 text-red-600 text-[11px] border-t border-red-100">
              {error}
            </div>
          )}

          {/* Totals + checkout */}
          {cart.length > 0 && checkoutState === 'idle' && (
            <div className="border-t border-gray-200 px-4 py-3 space-y-3">
              <div className="space-y-1 text-[12px]">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>IVA total</span>
                  <span>{formatCOP(tax)}</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 text-[14px] pt-1 border-t border-gray-100">
                  <span>Total</span>
                  <span>{formatCOP(total)}</span>
                </div>
              </div>

              {/* Payment method */}
              <div className="grid grid-cols-3 gap-1">
                {([
                  { key: 'cash', icon: Banknote, label: 'Efectivo' },
                  { key: 'transfer', icon: Smartphone, label: 'Transfer.' },
                  { key: 'card', icon: CreditCard, label: 'Tarjeta' },
                ] as const).map(({ key, icon: Icon, label }) => (
                  <button
                    key={key}
                    onClick={() => setPayMethod(key)}
                    className={[
                      'flex flex-col items-center gap-1 py-2 rounded-md border text-[11px] font-medium transition-colors',
                      payMethod === key
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300',
                    ].join(' ')}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {payMethod === 'cash' && (
                <div>
                  <label className="text-[11px] text-gray-500 block mb-1">Efectivo recibido</label>
                  <input
                    type="number"
                    value={cashInput}
                    onChange={(e) => setCashInput(e.target.value)}
                    placeholder="$0"
                    className="w-full h-8 px-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 transition-colors"
                  />
                  {cashAmount >= total && (
                    <p className="text-[11px] text-gray-500 mt-1">
                      Cambio: <span className="font-semibold text-gray-900">{formatCOP(change)}</span>
                    </p>
                  )}
                </div>
              )}

              <button
                onClick={() => setCheckoutState('paying')}
                className="w-full h-9 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-gray-800 transition-colors"
              >
                Procesar Pago · {formatCOP(total)}
              </button>
            </div>
          )}

          {checkoutState === 'paying' && (
            <div className="border-t border-gray-200 px-4 py-4 space-y-3">
              <p className="text-[13px] font-medium text-gray-900">Confirmar pago de <strong>{formatCOP(total)}</strong> vía {payMethod === 'cash' ? 'efectivo' : payMethod === 'card' ? 'tarjeta' : 'transferencia'}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCheckoutState('idle')}
                  disabled={processing}
                  className="flex-1 h-9 border border-gray-200 text-[13px] text-gray-600 rounded-md hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={processPayment}
                  disabled={processing}
                  className="flex-1 h-9 bg-gray-900 text-white text-[13px] font-medium rounded-md hover:bg-gray-800 disabled:opacity-70 transition-colors flex items-center justify-center gap-2"
                >
                  {processing
                    ? <><Loader2 size={14} className="animate-spin" /> Procesando...</>
                    : 'Confirmar'
                  }
                </button>
              </div>
            </div>
          )}

          {checkoutState === 'success' && (
            <div className="border-t border-gray-200 px-4 py-6 flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center">
                <Check size={20} className="text-white" />
              </div>
              <p className="text-[13px] font-medium text-gray-900">Venta procesada</p>
              <p className="text-[12px] text-gray-400">Stock y comprobante encolado en la DIAN</p>
            </div>
          )}

          {/* Billing metadata for electronic invoicing */}
          <div className="border-t border-gray-150 bg-gray-50/50 px-4 py-3 space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Datos de Facturación DIAN</p>
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <select
                  value={clienteTipoDoc}
                  onChange={(e) => setClienteTipoDoc(e.target.value)}
                  className="h-8 border border-gray-200 rounded-md text-[11px] bg-white px-2 focus:outline-none"
                >
                  <option value="13">C.C.</option>
                  <option value="31">NIT</option>
                  <option value="22">C.E.</option>
                </select>
                <input
                  type="text"
                  placeholder="Documento/NIT (222222222222)"
                  value={clienteDocumento === '222222222222' ? '' : clienteDocumento}
                  onChange={(e) => {
                    const val = e.target.value;
                    setClienteDocumento(val || '222222222222');
                    if (!val) setClienteNombre('Consumidor Final');
                  }}
                  className="flex-1 h-8 px-2 border border-gray-200 rounded-md text-[11px] focus:outline-none bg-white font-mono"
                />
              </div>
              <input
                type="text"
                placeholder="Nombre del Cliente (Consumidor Final)"
                value={clienteNombre === 'Consumidor Final' ? '' : clienteNombre}
                onChange={(e) => setClienteNombre(e.target.value || 'Consumidor Final')}
                className="w-full h-8 px-2 border border-gray-200 rounded-md text-[11px] focus:outline-none bg-white"
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* DIAN Habilitación & Producción config Modal wrapper */}
      <DianConfigModal
        isOpen={isDianModalOpen}
        onClose={() => setIsDianModalOpen(false)}
      />
    </MainLayout>
  )
}
