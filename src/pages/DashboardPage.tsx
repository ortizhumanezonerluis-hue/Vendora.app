import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../components/layout/MainLayout'
import { useAuth } from '../components/auth/AuthContext'
import { useLicense } from '../hooks/useLicense'
import { supabase } from '../lib/supabaseClient'
import { formatCOP } from '../lib/utils'
import {
  ShoppingCart, Package, AlertTriangle, TrendingUp,
  DollarSign, ArrowUpRight, Clock, Plus, BarChart3,
  CheckCircle2, Sparkles, Store, ShieldCheck
} from 'lucide-react'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { plan } = useLicense()

  const [salesToday, setSalesToday] = useState(0)
  const [transactionsCount, setTransactionsCount] = useState(0)
  const [lowStockCount, setLowStockCount] = useState(0)
  const [totalProducts, setTotalProducts] = useState(0)
  const [recentSales, setRecentSales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [profile?.negocio_id])

  async function loadDashboardStats() {
    try {
      // 1. Fetch sales today
      const todayStr = new Date().toISOString().split('T')[0]
      let salesQuery = supabase
        .from('ventas')
        .select('*')
        .gte('creado_en', `${todayStr}T00:00:00`)
        .order('creado_en', { ascending: false })

      if (profile?.negocio_id) {
        salesQuery = salesQuery.eq('negocio_id', profile.negocio_id)
      }

      const { data: sales } = await salesQuery
      if (sales) {
        const total = sales.reduce((acc, s) => acc + (Number(s.total) || 0), 0)
        setSalesToday(total)
        setTransactionsCount(sales.length)
        setRecentSales(sales.slice(0, 5))
      }

      // 2. Fetch inventory products
      let prodQuery = supabase
        .from('productos')
        .select('*')

      if (profile?.negocio_id) {
        prodQuery = prodQuery.eq('negocio_id', profile.negocio_id)
      }

      const { data: products } = await prodQuery
      if (products) {
        setTotalProducts(products.length)
        const low = products.filter(p => (p.stock || 0) <= (p.stock_minimo || 5))
        setLowStockCount(low.length)
      }
    } catch (e) {
      console.warn('Error cargando stats de dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout title="Dashboard General">
      <div className="p-6 max-w-6xl space-y-6">
        
        {/* Welcome Banner */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight">
                ¡Hola, {profile?.nombre || 'Comerciante'}!
              </span>
              <span className={[
                'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
                plan === 'max' ? 'bg-amber-400 text-slate-950' :
                plan === 'pro' ? 'bg-blue-400 text-slate-950' :
                'bg-slate-800 text-slate-300 border border-slate-700'
              ].join(' ')}>
                Plan {plan.toUpperCase()}
              </span>
            </div>
            <p className="text-[13px] text-slate-400">
              Resumen en tiempo real de operaciones, ventas del día y estado de inventario.
            </p>
          </div>

          <button
            onClick={() => navigate('/pos')}
            className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-bold text-[13px] rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <ShoppingCart size={15} />
            <span>Abrir Punto de Venta</span>
          </button>
        </div>

        {/* 4 KPI Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ventas de Hoy</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
              {formatCOP(salesToday)}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Clock size={12} />
              <span>{transactionsCount} transacciones registradas</span>
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Productos en Catálogo</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-slate-900 mt-2">
              {totalProducts} SKU
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Artículos activos en bodega</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Stock Crítico</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-amber-600 mt-2">
              {lowStockCount} alertas
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Requieren reabastecimiento</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado Licencia</span>
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
            </div>
            <p className="text-lg font-bold text-emerald-600 mt-2 flex items-center gap-1.5">
              <CheckCircle2 size={18} />
              <span>Activa y Verificada</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Sincronizada con Vendora Core</p>
          </div>

        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Recent Sales */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-[14px] font-bold text-slate-900">Últimas Ventas Registradas</h3>
              <button
                onClick={() => navigate('/reportes')}
                className="text-[12px] font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Ver todos los informes ↗
              </button>
            </div>

            {recentSales.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-[13px]">
                <ShoppingCart size={28} className="mx-auto mb-2 opacity-40" />
                <p>No se han registrado ventas hoy</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-[12px]">
                {recentSales.map((s, idx) => (
                  <div key={s.id || idx} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">Venta #{s.id?.slice(0, 6) || idx + 1}</p>
                      <p className="text-[11px] text-slate-400">{s.creado_en ? new Date(s.creado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}</p>
                    </div>
                    <span className="font-mono font-bold text-slate-900">{formatCOP(s.total || 0)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Shortcuts */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="text-[14px] font-bold text-slate-900 pb-3 border-b border-slate-100">Accesos Rápidos</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => navigate('/pos')}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <ShoppingCart size={15} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900">Punto de Venta (POS)</p>
                  <p className="text-[10px] text-slate-400">Facturar y cobrar rápido</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/inventario')}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Package size={15} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900">Control de Inventario</p>
                  <p className="text-[10px] text-slate-400">Añadir productos y stock</p>
                </div>
              </button>

              <button
                onClick={() => navigate('/caja')}
                className="w-full p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left flex items-center gap-3 transition-colors cursor-pointer"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <DollarSign size={15} />
                </div>
                <div>
                  <p className="text-[12px] font-bold text-slate-900">Arqueo de Caja</p>
                  <p className="text-[10px] text-slate-400">Cierre y balance de turnos</p>
                </div>
              </button>
            </div>
          </div>

        </div>

      </div>
    </MainLayout>
  )
}
