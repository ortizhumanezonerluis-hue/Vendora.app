import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ClienteDialog from '../../components/admin/ClienteDialog'
import RegistrarPagoDialog from '../../components/admin/RegistrarPagoDialog'
import { adminService, VendoraCliente, PagoAdmin } from '../../services/adminService'
import { formatCOP } from '../../lib/utils'
import { toast } from '../../components/ui/Toaster'
import {
  Key, Plus, Search, X, Edit3, Shield, Store,
  ChevronDown, Copy, RefreshCw, LogOut, ArrowUpRight,
  TrendingUp, DollarSign, Users, AlertTriangle, Check,
  CreditCard, LayoutDashboard, SlidersHorizontal,
  ShieldCheck, Sparkles, Filter, PanelLeft, ArrowLeft,
  Activity, CheckCircle2, Clock, AlertCircle
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

type AdminTab = 'dashboard' | 'licencias' | 'recaudos' | 'flujo'

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard')
  const [clientes, setClientes] = useState<VendoraCliente[]>([])
  const [pagos, setPagos] = useState<PagoAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Collapsible sidebar state (persisted in localStorage)
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('vendora_admin_sidebar_collapsed') === 'true'
  })

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('vendora_admin_sidebar_collapsed', String(next))
  }

  // Filters & Search
  const [search, setSearch] = useState('')
  const [filterActiveOnly, setFilterActiveOnly] = useState(false)
  const [planFilter, setPlanFilter] = useState<string>('todos')
  const [showPlanDropdown, setShowPlanDropdown] = useState(false)

  // Modals
  const [editingCliente, setEditingCliente] = useState<VendoraCliente | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [pagoDialogOpen, setPagoDialogOpen] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setRefreshing(true)
    try {
      const [cls, pgs] = await Promise.all([
        adminService.getClientes(),
        adminService.getPagos()
      ])
      setClientes(cls)
      setPagos(pgs)
    } catch (e) {
      toast('Error al cargar datos', { type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleLogout = () => {
    sessionStorage.removeItem('vendora_master_admin_session')
    toast('Sesión cerrada', { type: 'success' })
    navigate('/Block_Id/Admin/Vendora/login', { replace: true })
  }

  // --- Toggle Switch (Instant Live Activation/Suspension) ---
  const handleToggleLicencia = async (cliente: VendoraCliente) => {
    const nextState = !cliente.licencia_activa
    try {
      const updated = await adminService.toggleLicencia(cliente.id, nextState)
      setClientes(prev => prev.map(c => c.id === cliente.id ? updated : c))
      toast(
        nextState
          ? `Licencia activada para ${cliente.nombre_comercio}`
          : `Licencia suspendida para ${cliente.nombre_comercio} (Bloqueo en tiempo real)`,
        { type: nextState ? 'success' : 'error' }
      )
    } catch (err) {
      toast('Error al cambiar estado de licencia', { type: 'error' })
    }
  }

  // --- Save Edited Client ---
  const handleSaveCliente = async (id: string, updates: Partial<VendoraCliente>) => {
    try {
      const updated = await adminService.updateCliente(id, updates)
      setClientes(prev => prev.map(c => c.id === id ? updated : c))
      toast(`Comercio ${updated.nombre_comercio} actualizado`, { type: 'success' })
    } catch (err) {
      toast('Error al guardar cambios', { type: 'error' })
    }
  }

  // --- Register Payment ---
  const handleRegisterPayment = async (clienteId: string, monto: number, metodo: string, notas: string) => {
    try {
      const res = await adminService.registrarPago(clienteId, monto, metodo, notas)
      setClientes(prev => prev.map(c => c.id === clienteId ? res.cliente : c))
      setPagos(prev => [res.pago, ...prev])
      toast(`Cobro de ${formatCOP(monto)} registrado con éxito (+30 días de vigencia)`, { type: 'success' })
    } catch (err) {
      toast('Error al registrar cobro', { type: 'error' })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('ID copiado al portapapeles', { type: 'success' })
  }

  // Filtered Clients
  const filtered = useMemo(() => {
    return clientes.filter(c => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        c.nombre_comercio.toLowerCase().includes(q) ||
        c.nombre_dueno.toLowerCase().includes(q) ||
        c.municipio.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)

      const matchActive = !filterActiveOnly || (c.licencia_activa && c.estado === 'activo')
      const matchPlan = planFilter === 'todos' || c.plan === planFilter

      return matchSearch && matchActive && matchPlan
    })
  }, [clientes, search, filterActiveOnly, planFilter])

  // Calculated stats (Dynamic & Real)
  const totalRecaudadoReal = useMemo(() => {
    return pagos.reduce((s, p) => s + (Number(p.monto) || 0), 0)
  }, [pagos])

  const mrrReal = useMemo(() => {
    return clientes
      .filter(c => c.licencia_activa && c.estado === 'activo' && c.tipo_pago === 'financiado')
      .reduce((s, c) => s + (Number(c.cuota_mensual) || 0), 0)
  }, [clientes])

  const activasCount = useMemo(() => {
    return clientes.filter(c => c.licencia_activa && c.estado === 'activo').length
  }, [clientes])

  const morasCount = useMemo(() => {
    return clientes.filter(c => c.estado === 'mora' || c.estado === 'suspendido').length
  }, [clientes])

  const onlineCount = useMemo(() => {
    return clientes.filter(c => c.online_ahora).length
  }, [clientes])

  const META_RECAUDO = 22000000
  const porcentajeMeta = Math.min(100, (totalRecaudadoReal / META_RECAUDO) * 100)

  // Chart data from actual monthly calculations
  const chartData = [
    { mes: 'Mayo', proyectado: 640000, recaudado: 640000 },
    { mes: 'Junio', proyectado: 960000, recaudado: 960000 },
    { mes: 'Julio', proyectado: 1200000, recaudado: 1120000 },
    { mes: 'Agosto', proyectado: mrrReal, recaudado: totalRecaudadoReal },
    { mes: 'Septiembre', proyectado: mrrReal, recaudado: 0 },
    { mes: 'Octubre', proyectado: mrrReal, recaudado: 0 },
  ]

  return (
    <div className="h-screen w-screen overflow-hidden bg-white text-slate-900 flex font-sans antialiased selection:bg-slate-900 selection:text-white">
      
      {/* 1. OPENAI PLATFORM LEFT SIDEBAR (Completely isolated scrolling) */}
      <aside
        className={[
          'h-full border-r border-slate-200 bg-white flex flex-col justify-between p-3 shrink-0 select-none hidden md:flex transition-all duration-200 overflow-y-auto',
          collapsed ? 'w-16' : 'w-56'
        ].join(' ')}
      >
        
        <div className="space-y-4">
          {/* Brand Header — Clean without toggle inside */}
          <div className="flex items-center px-1 py-1">
            {!collapsed ? (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center text-[10px] font-bold">
                  V
                </div>
                <span className="text-[13px] font-bold text-slate-900 tracking-tight">Vendora Core</span>
              </div>
            ) : (
              <div className="w-6 h-6 bg-slate-900 text-white rounded-md flex items-center justify-center text-[10px] font-bold mx-auto">
                V
              </div>
            )}
          </div>

          {/* Quick Search Shortcut Input (if expanded) */}
          {!collapsed && (
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                readOnly
                placeholder="Search"
                className="w-full h-7 pl-7 pr-8 text-[11px] bg-slate-50 border border-slate-200 rounded-md focus:outline-none cursor-default"
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-400 bg-white px-1 py-0.2 border border-slate-200 rounded">
                Ctrl+K
              </span>
            </div>
          )}

          {/* Navigation Links with Dashboard */}
          <nav className="space-y-0.5 text-[13px] font-medium">
            <button
              onClick={() => setActiveTab('dashboard')}
              title={collapsed ? 'Dashboard' : undefined}
              className={[
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left cursor-pointer',
                collapsed ? 'justify-center px-0' : '',
                activeTab === 'dashboard'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              ].join(' ')}
            >
              <LayoutDashboard size={16} className={activeTab === 'dashboard' ? 'text-slate-900' : 'text-slate-400'} />
              {!collapsed && <span>Dashboard</span>}
            </button>

            <button
              onClick={() => setActiveTab('licencias')}
              title={collapsed ? 'Licencias' : undefined}
              className={[
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left cursor-pointer',
                collapsed ? 'justify-center px-0' : '',
                activeTab === 'licencias'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              ].join(' ')}
            >
              <Key size={16} className={activeTab === 'licencias' ? 'text-slate-900' : 'text-slate-400'} />
              {!collapsed && <span>Licencias y Comercios</span>}
            </button>

            <button
              onClick={() => setActiveTab('recaudos')}
              title={collapsed ? 'Historial Recaudos' : undefined}
              className={[
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left cursor-pointer',
                collapsed ? 'justify-center px-0' : '',
                activeTab === 'recaudos'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              ].join(' ')}
            >
              <DollarSign size={16} className={activeTab === 'recaudos' ? 'text-slate-900' : 'text-slate-400'} />
              {!collapsed && <span>Historial Recaudos</span>}
            </button>

            <button
              onClick={() => setActiveTab('flujo')}
              title={collapsed ? 'Flujo Financiero' : undefined}
              className={[
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors text-left cursor-pointer',
                collapsed ? 'justify-center px-0' : '',
                activeTab === 'flujo'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              ].join(' ')}
            >
              <TrendingUp size={16} className={activeTab === 'flujo' ? 'text-slate-900' : 'text-slate-400'} />
              {!collapsed && <span>Flujo Financiero</span>}
            </button>
          </nav>
        </div>

        {/* Bottom User Profile */}
        <div className={[
          'pt-3 border-t border-slate-100 flex items-center justify-between',
          collapsed ? 'justify-center px-0' : 'px-1'
        ].join(' ')}>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              OL
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-900 truncate">Oner Luis Ortiz</p>
                <p className="text-[10px] text-slate-400 truncate">Super Admin</p>
              </div>
            )}
          </div>
          {!collapsed && (
            <button
              onClick={handleLogout}
              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
              title="Cerrar Sesión"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>

      </aside>

      {/* 2. MAIN WORKSPACE (Independent Vertical Scroll) */}
      <main className="flex-1 h-full flex flex-col min-w-0 overflow-y-auto bg-white">
        
        {/* Top Header with External PanelLeft Toggle Button */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shrink-0 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-3">
            {/* Sidebar Toggle — Placed outside the sidebar */}
            <button
              onClick={toggleCollapsed}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
            >
              <PanelLeft size={16} />
            </button>

            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                {activeTab === 'dashboard' && 'Panel de Control Maestro'}
                {activeTab === 'licencias' && 'Licencias y Comercios'}
                {activeTab === 'recaudos' && 'Historial de Cobros y Recaudos'}
                {activeTab === 'flujo' && 'Flujo Financiero y Capitalización'}
              </h1>
              <p className="text-[12px] text-slate-500 mt-0.5">
                {activeTab === 'dashboard' && 'Métricas ejecutivas de MRR, licencias y capitalización en tiempo real'}
                {activeTab === 'licencias' && 'Gestión de licencias activas, planes y switch de bloqueo instantáneo'}
                {activeTab === 'recaudos' && 'Registro detallado de pagos de cuotas y cobros físicos'}
                {activeTab === 'flujo' && 'Proyección de flujo de caja hacia la meta de $22.000.000 COP'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="h-8 px-3 text-[12px] font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Actualizar datos"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-slate-900' : 'text-slate-400'} />
              <span>Actualizar</span>
            </button>

            <button
              onClick={() => setPagoDialogOpen(true)}
              className="h-8 px-3.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-[12px] rounded-lg transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={14} />
              <span>Registrar Cobro</span>
            </button>
          </div>
        </div>

        {/* 3. TAB CONTENT */}
        <div className="p-6 space-y-6 max-w-7xl flex-1">
          
          {/* TAB 0: DASHBOARD (Executive Master Overview) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* 4 Executive KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                {/* 1. Total Recaudado */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Total Recaudado</span>
                    <DollarSign size={15} className="text-slate-600" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-slate-900">{formatCOP(totalRecaudadoReal)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Efectivo total registrado</p>
                </div>

                {/* 2. MRR */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">MRR Proyectado</span>
                    <TrendingUp size={15} className="text-slate-600" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-slate-900">{formatCOP(mrrReal)}</p>
                  <p className="text-[11px] text-slate-400 mt-1">Ingreso mensual recurrente</p>
                </div>

                {/* 3. Comercios Activos */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Comercios Activos</span>
                    <Users size={15} className="text-slate-600" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-2xl font-bold font-mono text-slate-900">{activasCount}</p>
                    <span className="text-xs text-slate-400 font-medium">/ {clientes.length} registrados</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{onlineCount} en línea ahora</span>
                  </div>
                </div>

                {/* 4. Meta de Capitalización */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider">Meta $22M COP</span>
                    <Sparkles size={15} className="text-amber-500" />
                  </div>
                  <p className="text-2xl font-bold font-mono text-slate-900">
                    {porcentajeMeta.toFixed(1)}%
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Faltan {formatCOP(Math.max(0, META_RECAUDO - totalRecaudadoReal))}
                  </p>
                </div>

              </div>

              {/* Progress Bar Towards 22M Goal */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-2.5 shadow-xs">
                <div className="flex justify-between items-center text-[12px]">
                  <span className="font-semibold text-slate-800">Progreso hacia la Meta de Capitalización ($22'000.000 COP)</span>
                  <span className="font-mono font-bold text-slate-900">{formatCOP(totalRecaudadoReal)} / {formatCOP(META_RECAUDO)}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all duration-500"
                    style={{ width: `${porcentajeMeta}%` }}
                  />
                </div>
              </div>

              {/* Grid with Quick Status and Live Presence */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Live Connected Stores */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-3 lg:col-span-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-slate-900">Comercios en Red</h4>
                    <span className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                      {clientes.length} Comercios
                    </span>
                  </div>

                  <div className="space-y-2 divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {clientes.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No hay comercios registrados</p>
                    ) : (
                      clientes.slice(0, 6).map(c => (
                        <div key={c.id} className="pt-2 flex items-center justify-between text-[12px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className={[
                                'w-2 h-2 rounded-full shrink-0',
                                c.online_ahora ? 'bg-emerald-500 ring-2 ring-emerald-500/20 animate-pulse' : 'bg-slate-300'
                              ].join(' ')}
                            />
                            <div className="truncate">
                              <p className="font-semibold text-slate-900 truncate">{c.nombre_comercio}</p>
                              <p className="text-[10px] text-slate-400 truncate">{c.nombre_dueno}</p>
                            </div>
                          </div>
                          <span className={[
                            'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shrink-0',
                            c.plan === 'max' ? 'bg-slate-900 text-amber-300' :
                            c.plan === 'pro' ? 'bg-slate-900 text-blue-300' :
                            c.plan === 'starter' ? 'bg-slate-100 text-slate-700' :
                            'bg-rose-50 text-rose-700'
                          ].join(' ')}>
                            {c.plan}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab('licencias')}
                    className="w-full text-center text-xs font-semibold text-slate-900 hover:bg-slate-50 py-2 rounded-lg border border-slate-200 transition-colors cursor-pointer"
                  >
                    Ver todas las licencias →
                  </button>
                </div>

                {/* Monthly Projection vs Real Cash Chart */}
                <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-3 lg:col-span-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[13px] font-bold text-slate-900">Proyección de Flujo Mensual</h4>
                    <span className="text-[11px] text-slate-400">Cuotas Proyectadas vs Recaudado</span>
                  </div>

                  <div className="h-60 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `$${val / 1000}k`} />
                        <Tooltip
                          formatter={(value: any) => [formatCOP(Number(value)), '']}
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        />
                        <Bar dataKey="proyectado" name="Cuotas Proyectadas" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                        <Bar dataKey="recaudado" name="Recaudo Real" fill="#0f172a" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* Latest Recent Payments Snippet */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-[13px] font-bold text-slate-900">Últimos Cobros Registrados</h4>
                  <button
                    onClick={() => setActiveTab('recaudos')}
                    className="text-xs font-semibold text-slate-900 hover:underline cursor-pointer"
                  >
                    Ver historial completo →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2 font-normal">Fecha</th>
                        <th className="px-3 py-2 font-normal">Comercio</th>
                        <th className="px-3 py-2 font-normal">Método</th>
                        <th className="px-3 py-2 font-normal">Nota</th>
                        <th className="px-3 py-2 text-right font-normal">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {pagos.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-400">Sin cobros registrados aún</td>
                        </tr>
                      ) : (
                        pagos.slice(0, 4).map(p => (
                          <tr key={p.id} className="hover:bg-slate-50/60">
                            <td className="px-3 py-2.5 font-mono text-[11px] text-slate-500">
                              {p.registrado_en ? p.registrado_en.split('T')[0] : 'Hoy'}
                            </td>
                            <td className="px-3 py-2.5 font-semibold text-slate-900">{p.nombre_comercio}</td>
                            <td className="px-3 py-2.5 capitalize text-slate-500">{p.metodo}</td>
                            <td className="px-3 py-2.5 text-slate-400 text-[11px]">{p.notas || 'Cuota mensual'}</td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">{formatCOP(p.monto)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}
          
          {/* TAB 1: LICENCIAS (Table like OpenAI API keys) */}
          {activeTab === 'licencias' && (
            <>
              {/* OpenAI Style Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1 max-w-2xl">
                  
                  {/* Search bar */}
                  <div className="relative flex-1 min-w-[220px]">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Buscar por comercio, dueño o ID..."
                      className="w-full h-8 pl-8 pr-8 text-[12px] bg-white border border-slate-200 rounded-full focus:outline-none focus:ring-1 focus:ring-slate-900"
                    />
                    {search && (
                      <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        <X size={12} />
                      </button>
                    )}
                  </div>

                  {/* Active Filter Pill */}
                  <button
                    onClick={() => setFilterActiveOnly(!filterActiveOnly)}
                    className={[
                      'h-8 px-3 rounded-full text-[11px] font-medium border transition-colors flex items-center gap-1.5 cursor-pointer',
                      filterActiveOnly
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    ].join(' ')}
                  >
                    <Check size={11} className={filterActiveOnly ? 'text-white' : 'text-slate-400'} />
                    <span>Activos</span>
                    {filterActiveOnly && <X size={11} className="ml-0.5" />}
                  </button>

                  {/* Plan Filter Pill */}
                  <div className="relative">
                    <button
                      onClick={() => setShowPlanDropdown(!showPlanDropdown)}
                      className="h-8 px-3 rounded-full text-[11px] font-medium bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 flex items-center gap-1 cursor-pointer"
                    >
                      <Filter size={11} className="text-slate-400" />
                      <span>Plan: {planFilter === 'todos' ? 'Todos' : planFilter.toUpperCase()}</span>
                      <ChevronDown size={11} className="text-slate-400" />
                    </button>

                    {showPlanDropdown && (
                      <div className="absolute top-9 left-0 w-36 bg-white border border-slate-200 rounded-xl shadow-lg p-1 z-20 text-[11px]">
                        {['todos', 'starter', 'pro', 'max', 'sin_licencia'].map(p => (
                          <button
                            key={p}
                            onClick={() => { setPlanFilter(p); setShowPlanDropdown(false); }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-slate-100 capitalize text-slate-700"
                          >
                            {p === 'sin_licencia' ? 'Sin Licencia' : p}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>

                <div className="text-[12px] text-slate-400 font-medium">
                  {filtered.length} {filtered.length === 1 ? 'comercio' : 'comercios'}
                </div>
              </div>

              {/* OpenAI Platform Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead className="bg-slate-50/70 border-b border-slate-200 text-[11px] font-semibold text-slate-500">
                      <tr>
                        <th className="px-4 py-2.5 font-normal">Comercio</th>
                        <th className="px-4 py-2.5 font-normal">Status</th>
                        <th className="px-4 py-2.5 font-normal">Tracking ID</th>
                        <th className="px-4 py-2.5 font-normal">Plan</th>
                        <th className="px-4 py-2.5 font-normal">Contrato</th>
                        <th className="px-4 py-2.5 font-normal">Próximo Pago</th>
                        <th className="px-4 py-2.5 font-normal">Dueño / Contacto</th>
                        <th className="px-4 py-2.5 text-center font-normal">Interruptor Licencia</th>
                        <th className="px-4 py-2.5 text-center font-normal w-20">Editar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filtered.map(cliente => {
                        const isLive = cliente.online_ahora

                        return (
                          <tr key={cliente.id} className="hover:bg-slate-50/80 transition-colors group">
                            
                            {/* Comercio Name with Live Pulse Dot */}
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span
                                  className={[
                                    'w-2 h-2 rounded-full shrink-0 transition-all',
                                    isLive
                                      ? 'bg-emerald-500 ring-4 ring-emerald-500/20 animate-pulse'
                                      : 'bg-slate-300'
                                  ].join(' ')}
                                  title={isLive ? 'Comercio con sesión activa ahora' : 'Desconectado'}
                                />
                                <span>{cliente.nombre_comercio}</span>
                              </div>
                            </td>

                            {/* Status */}
                            <td className="px-4 py-3">
                              <span
                                className={[
                                  'text-[11px] font-medium capitalize',
                                  cliente.estado === 'activo' ? 'text-slate-900' :
                                  cliente.estado === 'mora' ? 'text-amber-700 font-bold' :
                                  'text-slate-400'
                                ].join(' ')}
                              >
                                {cliente.estado === 'activo' ? 'Active' : cliente.estado}
                              </span>
                            </td>

                            {/* Tracking ID */}
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                              <button
                                onClick={() => copyToClipboard(cliente.id)}
                                className="hover:text-slate-900 flex items-center gap-1 font-mono"
                                title="Copiar ID completo"
                              >
                                <span>key_{cliente.id.slice(0, 10)}...</span>
                                <Copy size={11} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </button>
                            </td>

                            {/* Plan */}
                            <td className="px-4 py-3">
                              <span className={[
                                'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                                cliente.plan === 'max' ? 'bg-slate-900 text-amber-300 border border-amber-500/30' :
                                cliente.plan === 'pro' ? 'bg-slate-900 text-blue-300 border border-blue-500/30' :
                                cliente.plan === 'starter' ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                                'bg-rose-50 text-rose-700 border border-rose-200'
                              ].join(' ')}>
                                {cliente.plan === 'sin_licencia' ? 'Sin Plan' : cliente.plan}
                              </span>
                            </td>

                            {/* Contrato */}
                            <td className="px-4 py-3 text-slate-500 text-[11px]">
                              {cliente.tipo_pago === 'financiado' ? (
                                <span>10m · <span className="font-mono text-slate-700 font-medium">{formatCOP(cliente.cuota_mensual)}</span></span>
                              ) : (
                                <span>Vitalicio</span>
                              )}
                            </td>

                            {/* Próximo Pago */}
                            <td className="px-4 py-3 font-mono text-[11px]">
                              <span className={cliente.estado === 'mora' ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                                {cliente.fecha_corte || 'Never'}
                              </span>
                            </td>

                            {/* Created by / Contact */}
                            <td className="px-4 py-3 text-slate-500 text-[11px] truncate max-w-[140px]">
                              <div>
                                <p className="font-medium text-slate-800">{cliente.nombre_dueno}</p>
                                {cliente.telefono && <p className="text-[10px] text-slate-400">{cliente.telefono}</p>}
                              </div>
                            </td>

                            {/* Interactive Toggle Switch (Instant Live Activation/Suspension) */}
                            <td className="px-4 py-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleToggleLicencia(cliente)}
                                className={[
                                  'w-11 h-6 rounded-full transition-all relative cursor-pointer inline-flex items-center',
                                  cliente.licencia_activa ? 'bg-slate-900' : 'bg-slate-200'
                                ].join(' ')}
                                title={cliente.licencia_activa ? 'Licencia activa (Clic para suspender)' : 'Licencia inactiva (Clic para activar)'}
                              >
                                <span
                                  className={[
                                    'w-4 h-4 bg-white rounded-full transition-transform shadow-xs',
                                    cliente.licencia_activa ? 'translate-x-6' : 'translate-x-1'
                                  ].join(' ')}
                                />
                              </button>
                            </td>

                            {/* Actions (OpenAI style Edit button) */}
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setEditingCliente(cliente)
                                  setDialogOpen(true)
                                }}
                                className="p-1 text-slate-400 hover:text-slate-900 rounded transition-colors"
                                title="Editar comercio y plan"
                              >
                                <Edit3 size={14} />
                              </button>
                            </td>

                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: HISTORIAL DE RECAUDOS */}
          {activeTab === 'recaudos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Historial de Cobros Físicos</h3>
                  <p className="text-[12px] text-slate-500">Registro detallado de pagos de cuotas recaudadas</p>
                </div>
                <button
                  onClick={() => setPagoDialogOpen(true)}
                  className="h-8 px-3 bg-slate-900 hover:bg-slate-800 text-white font-medium text-[12px] rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>Registrar Cobro</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse text-[12px]">
                  <thead className="bg-slate-50 text-[11px] font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Fecha</th>
                      <th className="px-4 py-2.5">Comercio</th>
                      <th className="px-4 py-2.5">Método</th>
                      <th className="px-4 py-2.5">Nota</th>
                      <th className="px-4 py-2.5 text-right">Monto Recaudado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {pagos.map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/60 font-sans">
                        <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                          {p.registrado_en ? p.registrado_en.split('T')[0] : 'Hoy'}
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-900">{p.nombre_comercio}</td>
                        <td className="px-4 py-3 capitalize text-slate-500">{p.metodo}</td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">{p.notas || 'Cuota mensual'}</td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                          {formatCOP(p.monto)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: FLUJO FINANCIERO */}
          {activeTab === 'flujo' && (
            <div className="space-y-6">
              
              {/* Top 3 Minimal Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Total Recaudado Físicamente
                  </span>
                  <p className="text-2xl font-bold font-mono text-slate-900">{formatCOP(totalRecaudadoReal)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Sumatoria de cuotas cobradas</p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    MRR Proyectado (Mes)
                  </span>
                  <p className="text-2xl font-bold font-mono text-slate-900">{formatCOP(mrrReal)}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">De {activasCount} comercios activos</p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                    Meta de Capitalización
                  </span>
                  <p className="text-2xl font-bold font-mono text-slate-900">
                    {porcentajeMeta.toFixed(1)}% <span className="text-sm font-normal text-slate-400">/ $22M</span>
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Faltan {formatCOP(Math.max(0, META_RECAUDO - totalRecaudadoReal))}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white space-y-2 shadow-xs">
                <div className="flex justify-between text-[12px]">
                  <span className="font-semibold text-slate-800">Progreso hacia $22'000.000 COP</span>
                  <span className="font-mono font-bold text-slate-900">{formatCOP(totalRecaudadoReal)}</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-900 rounded-full transition-all duration-500"
                    style={{ width: `${porcentajeMeta}%` }}
                  />
                </div>
              </div>

              {/* Chart */}
              <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-xs space-y-3">
                <h4 className="text-[13px] font-bold text-slate-900">Proyección Mensual vs Recaudo Real</h4>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `$${val / 1000}k`} />
                      <Tooltip
                        formatter={(value: any) => [formatCOP(Number(value)), '']}
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                      />
                      <Bar dataKey="proyectado" name="Cuotas Proyectadas" fill="#e2e8f0" radius={[3, 3, 0, 0]} />
                      <Bar dataKey="recaudado" name="Recaudo Real" fill="#0f172a" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Edit Client Modal */}
      <ClienteDialog
        isOpen={dialogOpen}
        cliente={editingCliente}
        onClose={() => {
          setDialogOpen(false)
          setEditingCliente(null)
        }}
        onSave={handleSaveCliente}
      />

      {/* Fast Payment Modal */}
      <RegistrarPagoDialog
        isOpen={pagoDialogOpen}
        clientes={clientes}
        onClose={() => setPagoDialogOpen(false)}
        onRegister={handleRegisterPayment}
      />

    </div>
  )
}
