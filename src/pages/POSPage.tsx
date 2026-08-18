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
                placeholder="Buscar por nombre o código de barras..."
                className="w-full h-8 pl-8 pr-3 text-[13px] border border-gray-200 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
              />
            </div>
            
            <div className="flex gap-1 overflow-x-auto pb-1 select-none">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={[
                    'px-3 py-1 rounded-full text-[11px] font-medium transition-colors shrink-0',
                    category === cat
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/70',
                  ].join(' ')}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-y-auto p-5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                <ShoppingBag size={28} className="mb-2 text-gray-300" />
                <p className="text-[13px] font-medium">No se encontraron productos disponibles</p>
                <p className="text-[11px] mt-0.5">Verifica el stock o el filtro seleccionado</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filtered.map((prod) => {
                  const cartItem = cart.find((c) => c.producto.id === prod.id)
                  const inCart = !!cartItem
                  return (
                    <button
                      key={prod.id}
                      onClick={() => addToCart(prod)}
                      className={[
                        'flex flex-col text-left p-3.5 bg-white rounded-xl hover:shadow-sm transition-all relative group',
                        inCart
                          ? 'border-2 border-gray-900 shadow-sm'
                          : 'border border-gray-200 hover:border-gray-900',
                      ].join(' ')}
                    >
                      {/* Cart quantity badge — only shows when in cart */}
                      {inCart ? (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-gray-900 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                          {cartItem.cantidad}
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 bg-gray-100 text-gray-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {prod.stock_actual} ud
                        </div>
                      )}
                      <div className="flex-1 min-w-0 pr-6 mt-1">
                        <p className="text-[12px] font-semibold text-gray-900 truncate">{prod.nombre}</p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{prod.codigo_barras || 'Sin código'}</p>
                      </div>
                      <p className="text-[13px] font-bold text-gray-900 font-mono mt-3">
                        {formatCOP(prod.precio_venta)}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cart / POS Sidebar */}
        <div className="w-80 shrink-0 border-l border-gray-200 bg-white flex flex-col overflow-hidden">
          <div className="px-4 py-3.5 border-b border-gray-150 flex items-center justify-between shrink-0">
            <div>
              <p className="text-[13px] font-bold text-gray-900">Carrito de Cobro</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{cart.reduce((a, c) => a + c.cantidad, 0)} artículos en lista</p>
            </div>
            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-bold text-red-500 hover:text-red-600 transition-colors"
              >
                Limpiar todo
              </button>
            )}
          </div>

          {/* Cart items */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full p-6 text-center text-gray-400">
                <ShoppingBag size={24} className="mb-2 text-gray-300" />
                <p className="text-[12px] font-medium">El carrito está vacío</p>
                <p className="text-[11px] mt-0.5">Toca o escanea un producto para cargarlo</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.producto.id} className="px-4 py-3 flex items-center gap-3 hover:bg-gray-50/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-gray-900 truncate">{item.producto.nombre}</p>
                    <p className="text-[11px] text-gray-400 font-mono mt-0.5">{formatCOP(item.producto.precio_venta)} c/u</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center border border-gray-200 rounded-md bg-white overflow-hidden h-6">
                      <button
                        onClick={() => updateQty(item.producto.id, -1)}
                        className="px-1.5 hover:bg-gray-50 text-gray-500 h-full flex items-center justify-center"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="w-7 text-center text-[11px] font-bold font-mono text-gray-800">{item.cantidad}</span>
                      <button
                        onClick={() => updateQty(item.producto.id, 1)}
                        disabled={item.cantidad >= item.producto.stock_actual}
                        className="px-1.5 hover:bg-gray-50 text-gray-500 disabled:opacity-30 h-full flex items-center justify-center"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.producto.id)}
                      className="text-[10px] text-gray-400 hover:text-red-500 font-semibold transition-colors flex items-center gap-0.5"
                    >
                      <Trash2 size={10} />
                      Quitar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Pricing calculations & checkout triggers */}
          {cart.length > 0 && checkoutState === 'idle' && (
            <div className="border-t border-gray-100 px-4 py-4 space-y-4 shrink-0">
              <div className="space-y-1.5 text-[12px]">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span className="font-mono">{formatCOP(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>IVA estimado</span>
                  <span className="font-mono">{formatCOP(tax)}</span>
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
              <p className="text-[12px] text-gray-400">Stock actualizado en Supabase</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
