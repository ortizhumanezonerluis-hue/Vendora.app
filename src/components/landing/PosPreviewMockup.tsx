import { useState } from 'react'
import {
  ShoppingCart, Package, Scale, Search, Plus, Minus,
  CheckCircle2, Sparkles, Store, ArrowRight, ShieldAlert,
  Wallet, ChevronRight, User
} from 'lucide-react'

const SAMPLE_PRODUCTS = [
  { id: '1', nombre: 'Leche Alquería Entera 1.1L', categoria: 'Lácteos', precio: 5200, stock: 24, inCart: true, qty: 2 },
  { id: '2', nombre: 'Arroz Diana Tradicional 1kg', categoria: 'Abarrotes', precio: 4600, stock: 48, inCart: true, qty: 1 },
  { id: '3', nombre: 'Agua Cristal Sin Gas 600ml', categoria: 'Bebidas', precio: 2200, stock: 36, inCart: false, qty: 0 },
  { id: '4', nombre: 'Aceite Premier Soya 900ml', categoria: 'Abarrotes', precio: 9800, stock: 15, inCart: true, qty: 1 },
  { id: '5', nombre: 'Detergente Ariel Polvo 1kg', categoria: 'Aseo', precio: 11500, stock: 12, inCart: false, qty: 0 },
  { id: '6', nombre: 'Gaseosa Postobón Manzana 1.5L', categoria: 'Bebidas', precio: 4500, stock: 20, inCart: false, qty: 0 },
]

export default function PosPreviewMockup() {
  const [selectedCat, setSelectedCat] = useState('Todos')
  const [products, setProducts] = useState(SAMPLE_PRODUCTS)

  const toggleCart = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const nextInCart = !p.inCart
        return { ...p, inCart: nextInCart, qty: nextInCart ? 1 : 0 }
      }
      return p
    }))
  }

  const updateQty = (id: string, delta: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        const newQty = Math.max(1, p.qty + delta)
        return { ...p, qty: newQty }
      }
      return p
    }))
  }

  const cartItems = products.filter(p => p.inCart)
  const cartTotal = cartItems.reduce((sum, p) => sum + (p.precio * p.qty), 0)

  const filtered = selectedCat === 'Todos'
    ? products
    : products.filter(p => p.categoria === selectedCat)

  return (
    <div className="relative mx-auto max-w-5xl rounded-2xl border border-slate-200/80 bg-slate-950 p-2 shadow-2xl shadow-blue-500/10 lg:p-3">
      {/* Window Controls Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 rounded-t-xl border-b border-slate-800 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></span>
          </div>
          <span className="ml-2 font-mono text-[10px] text-slate-400">app.vendora.com.co/pos</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[10px]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Caja Abierta: Turno Mañana
          </span>
          <span className="text-slate-500">|</span>
          <span className="font-medium text-slate-300">Cajero: Oner Luis</span>
        </div>
      </div>

      {/* POS App Body */}
      <div className="bg-slate-50 rounded-b-xl overflow-hidden flex flex-col md:flex-row min-h-[480px] text-slate-800 select-none">
        
        {/* Mock Left Mini-Sidebar */}
        <div className="hidden sm:flex flex-col w-16 bg-white border-r border-slate-200 py-3 items-center justify-between shrink-0">
          <div className="space-y-4 flex flex-col items-center">
            <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <Store size={18} />
            </div>
            <div className="w-9 h-9 bg-slate-900 text-white rounded-lg flex items-center justify-center" title="Punto de Venta">
              <ShoppingCart size={17} />
            </div>
            <div className="w-9 h-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors" title="Inventario">
              <Package size={17} />
            </div>
            <div className="w-9 h-9 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg flex items-center justify-center transition-colors" title="Contabilidad 3.500 UVT">
              <Scale size={17} />
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold flex items-center justify-center">
            OL
          </div>
        </div>

        {/* Center: Catalog & Products Grid */}
        <div className="flex-1 flex flex-col bg-slate-50/70 p-4 min-w-0">
          
          {/* Search and Category Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-2.5 justify-between items-start sm:items-center mb-3">
            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                readOnly
                placeholder="Escanear código o buscar..."
                className="w-full h-8 pl-8 pr-3 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {['Todos', 'Abarrotes', 'Lácteos', 'Bebidas', 'Aseo'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={[
                    'px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all shrink-0',
                    selectedCat === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  ].join(' ')}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1 overflow-y-auto">
            {filtered.map(prod => (
              <button
                key={prod.id}
                onClick={() => toggleCart(prod.id)}
                className={[
                  'flex flex-col justify-between p-3 rounded-xl text-left transition-all relative group bg-white',
                  prod.inCart
                    ? 'border-2 border-blue-600 shadow-sm shadow-blue-500/10'
                    : 'border border-slate-200 hover:border-slate-400 hover:shadow-xs'
                ].join(' ')}
              >
                {/* Cart Badge */}
                {prod.inCart && (
                  <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                    {prod.qty}
                  </div>
                )}

                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    {prod.categoria}
                  </span>
                  <p className="text-[12px] font-semibold text-slate-900 leading-snug line-clamp-2">
                    {prod.nombre}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <span className="font-mono font-bold text-[13px] text-slate-900">
                    ${prod.precio.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[9px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {prod.stock} ud
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Quick Stats Bottom Pill */}
          <div className="mt-3 py-1.5 px-3 bg-white rounded-lg border border-slate-200 text-[11px] flex items-center justify-between text-slate-500">
            <span className="flex items-center gap-1.5 font-medium">
              <CheckCircle2 size={13} className="text-emerald-500" />
              Lectura de código de barras activa
            </span>
            <span className="font-mono text-[10px] text-slate-400">Atajo: F2 Cobro Rápido</span>
          </div>

        </div>

        {/* Right: Cart and Checkout Sidebar */}
        <div className="w-full md:w-72 bg-white border-t md:border-t-0 md:border-l border-slate-200 flex flex-col justify-between p-3.5 shrink-0">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div>
                <p className="text-[13px] font-bold text-slate-900">Carrito de Venta</p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {cartItems.reduce((s, p) => s + p.qty, 0)} artículos seleccionados
                </p>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-bold border border-blue-100">
                Ticket #8849
              </span>
            </div>

            {/* Cart Items List */}
            <div className="space-y-2 mt-2.5 max-h-48 overflow-y-auto pr-1">
              {cartItems.map(item => (
                <div key={item.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="min-w-0 flex-1 pr-2">
                    <p className="font-semibold text-slate-800 truncate">{item.nombre}</p>
                    <p className="font-mono text-slate-400 text-[10px]">${item.precio.toLocaleString('es-CO')} c/u</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQty(item.id, -1); }}
                      className="w-5 h-5 bg-white border border-slate-200 hover:bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700"
                    >
                      -
                    </button>
                    <span className="font-bold font-mono text-[11px] w-3 text-center">{item.qty}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); updateQty(item.id, 1); }}
                      className="w-5 h-5 bg-white border border-slate-200 hover:bg-slate-100 rounded flex items-center justify-center font-bold text-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart Bottom Checkout */}
          <div className="pt-3 border-t border-slate-100 space-y-2 mt-2">
            <div className="flex justify-between items-center text-[12px] text-slate-500">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">${cartTotal.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex justify-between items-center text-[14px] font-bold text-slate-900">
              <span>Total a Cobrar:</span>
              <span className="font-mono text-blue-600 text-[16px]">${cartTotal.toLocaleString('es-CO')}</span>
            </div>

            <button
              onClick={() => alert(`Simulación de cobro exitoso por $${cartTotal.toLocaleString('es-CO')} COP en Vendora POS.`)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[12px] font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5"
            >
              <Wallet size={14} />
              <span>Cobrar Venta (Efectivo / Nequi)</span>
            </button>
          </div>

        </div>

      </div>

      {/* Floating Interactive Badge */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full shadow-lg text-[11px] font-semibold flex items-center gap-2">
        <Sparkles size={13} className="text-amber-500 shrink-0" />
        <span>Pruébalo aquí arriba: Selecciona productos y cambia cantidades en tiempo real</span>
      </div>
    </div>
  )
}
