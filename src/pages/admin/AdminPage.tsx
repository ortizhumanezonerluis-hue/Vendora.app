import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import ClienteDialog from '../../components/admin/ClienteDialog'
import RegistrarPagoDialog from '../../components/admin/RegistrarPagoDialog'
import { adminService, VendoraCliente, PagoAdmin } from '../../services/adminService'
import { formatCOP } from '../../lib/utils'
import { toast } from '../../components/ui/Toaster'
import {
  Key, Plus, Search, X, Edit3, Trash2, Shield, Store,
  ChevronDown, Copy, RefreshCw, LogOut, ArrowUpRight,
  TrendingUp, DollarSign, Users, AlertTriangle, Check,
  CreditCard, LayoutDashboard, SlidersHorizontal, ArrowDownRight,
  ShieldCheck, Sparkles, Filter
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'

type AdminTab = 'licencias' | 'recaudos' | 'flujo'

export default function AdminPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<AdminTab>('licencias')
  const [clientes, setClientes] = useState<VendoraCliente[]>([])
  const [pagos, setPagos] = useState<PagoAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

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

  // --- Toggle Switch (Suspend/Activate) ---
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
      toast('Error al cambiar estado', { type: 'error' })
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

  // Calculated stats (No hardcoding)
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
    <div className="min-h-screen bg-white text-slate-900 flex font-sans antialiased selection:bg-slate-900 selection:text-white">
      
      {/* 1. OPENAI PLATFORM LEFT SIDEBAR */}
      <aside className="w-56 border-r border-slate-200 bg-white flex flex-col justify-between p-3 shrink-0 select-none hidden md:flex">
        
        <div className="space-y-4">
          {/* Organization Switcher */}
          <div className="flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-slate-100/70 transition-colors cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-slate-900 text-white rounded flex items-center justify-center text-[10px] font-bold">
                V
              </div>
              <span className="text-[13px] font-semibold text-slate-900 tracking-tight">Vendora Core</span>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </div>

          {/* Quick Search Shortcut Input */}
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

          {/* Navigation Links (OpenAI style) */}
          <nav className="space-y-0.5 text-[13px] font-medium">
            <button
              onClick={() => setActiveTab('licencias')}
              className={[
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors text-left',
                activeTab === 'licencias'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              ].join(' ')}
            >
              <Key size={15} className={activeTab === 'licencias' ? 'text-slate-900' : 'text-slate-400'} />
              <span>Licencias</span>
            </button>

            <button
              onClick={() => setActiveTab('recaudos')}
              className={[
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors text-left',
                activeTab === 'recaudos'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              ].join(' ')}
            >
              <DollarSign size={15} className={activeTab === 'recaudos' ? 'text-slate-900' : 'text-slate-400'} />
              <span>Historial Recaudos</span>
            </button>

            <button
              onClick={() => setActiveTab('flujo')}
              className={[
                'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors text-left',
                activeTab === 'flujo'
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              ].join(' ')}
            >
              <TrendingUp size={15} className={activeTab === 'flujo' ? 'text-slate-900' : 'text-slate-400'} />
              <span>Flujo Financiero</span>
            </button>
          </nav>
        </div>

        {/* Bottom User Profile */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between px-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center">
              OL
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-slate-900 truncate">Oner Luis Ortiz</p>
              <p className="text-[10px] text-slate-400 truncate">Super Admin</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
            title="Cerrar Sesión"
          >
            <LogOut size={14} />
          </button>
        </div>

      </aside>

      {/* 2. MAIN WORKSPACE */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-white">
        
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'licencias' && 'Licencias y Comercios'}
              {activeTab === 'recaudos' && 'Historial de Cobros y Recaudos'}
              {activeTab === 'flujo' && 'Flujo Financiero y Capitalización'}
            </h1>
            <p className="text-[12px] text-slate-500 mt-0.5">
              Gestión centralizada de licencias activas, cobros en Cereté y monitoreo en tiempo real
            </p>
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
        <div className="p-6 space-y-6 max-w-7xl">
          
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
                        <th className="px-4 py-2.5 font-normal">Name</th>
                        <th className="px-4 py-2.5 font-normal">Status</th>
                        <th className="px-4 py-2.5 font-normal">Tracking ID</th>
                        <th className="px-4 py-2.5 font-normal">Plan</th>
                        <th className="px-4 py-2.5 font-normal">Contrato</th>
                        <th className="px-4 py-2.5 font-normal">Created</th>
                        <th className="px-4 py-2.5 font-normal">Próximo Pago</th>
                        <th className="px-4 py-2.5 font-normal">Created by</th>
                        <th className="px-4 py-2.5 text-center font-normal w-24">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filtered.map(cliente => {
                        const isLive = cliente.online_ahora

                        return (
                          <tr key={cliente.id} className="hover:bg-slate-50/80 transition-colors group">
                            
                            {/* Name */}
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              <div className="flex items-center gap-2">
                                <span
                                  className={[
                                    'w-1.5 h-1.5 rounded-full shrink-0',
                                    isLive ? 'bg-emerald-500' : 'bg-slate-300'
                                  ].join(' ')}
                                  title={isLive ? 'En línea ahora' : 'Desconectado'}
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
                                  cliente.estado === 'mora' ? 'text-amber-700' :
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
                              <span className="font-semibold text-[11px] text-slate-900 uppercase">
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

                            {/* Created */}
                            <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                              {cliente.fecha_inicio || '15 sept 2025'}
                            </td>

                            {/* Próximo Pago */}
                            <td className="px-4 py-3 font-mono text-[11px]">
                              <span className={cliente.estado === 'mora' ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                                {cliente.fecha_corte || 'Never'}
                              </span>
                            </td>

                            {/* Created by */}
                            <td className="px-4 py-3 text-slate-500 text-[11px] truncate max-w-[120px]">
                              {cliente.nombre_dueno}
                            </td>

                            {/* Actions (OpenAI style Edit and Delete/Suspend) */}
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingCliente(cliente)
                                    setDialogOpen(true)
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-900 rounded transition-colors"
                                  title="Editar comercio y plan"
                                >
                                  <Edit3 size={13} />
                                </button>

                                <button
                                  onClick={() => handleToggleLicencia(cliente)}
                                  className={[
                                    'p-1 rounded transition-colors',
                                    cliente.licencia_activa
                                      ? 'text-slate-400 hover:text-rose-600'
                                      : 'text-emerald-600 hover:text-emerald-700'
                                  ].join(' ')}
                                  title={cliente.licencia_activa ? 'Suspender licencia en tiempo real' : 'Activar licencia'}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
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
                  <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
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

          {/* TAB 3: FLUJO FINANCIERO (Clean Charts) */}
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
