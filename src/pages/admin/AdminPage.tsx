import { useState, useEffect, useMemo } from 'react'
import AdminNavbar from '../../components/admin/AdminNavbar'
import ClienteDialog from '../../components/admin/ClienteDialog'
import { adminService, VendoraCliente, PagoAdmin, PlanType } from '../../services/adminService'
import { formatCOP } from '../../lib/utils'
import { toast } from '../../components/ui/Toaster'
import {
  Users, DollarSign, TrendingUp, AlertTriangle, Search,
  Plus, Edit2, ShieldAlert, CheckCircle2, ShieldCheck,
  Calendar, Check, X, Sparkles, ArrowUpRight, Wallet,
  CreditCard, Store, Phone, MapPin, Copy, Clock, Zap
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

export default function AdminPage() {
  const [clientes, setClientes] = useState<VendoraCliente[]>([])
  const [pagos, setPagos] = useState<PagoAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [planFilter, setPlanFilter] = useState<string>('todos')
  const [estadoFilter, setEstadoFilter] = useState<string>('todos')

  // Edit modal
  const [editingCliente, setEditingCliente] = useState<VendoraCliente | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Fast Payment Form
  const [paymentClienteId, setPaymentClienteId] = useState('')
  const [paymentMonto, setPaymentMonto] = useState('160000')
  const [paymentMetodo, setPaymentMetodo] = useState('efectivo')
  const [paymentNotas, setPaymentNotas] = useState('')
  const [registeringPayment, setRegisteringPayment] = useState(false)

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
      if (!paymentClienteId && cls.length > 0) {
        setPaymentClienteId(cls[0].id)
      }
    } catch (e) {
      toast('Error cargando datos del panel', { type: 'error' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // --- Quick Toggle License Switch ---
  const handleToggleLicencia = async (cliente: VendoraCliente) => {
    const nextState = !cliente.licencia_activa
    try {
      const updated = await adminService.toggleLicencia(cliente.id, nextState)
      setClientes(prev => prev.map(c => c.id === cliente.id ? updated : c))
      toast(
        nextState
          ? `Licencia activada para ${cliente.nombre_comercio}`
          : `Licencia suspendida para ${cliente.nombre_comercio} (Bloqueo en tiempo real activado)`,
        { type: nextState ? 'success' : 'error' }
      )
    } catch (err: any) {
      toast('Error al cambiar estado de licencia', { type: 'error' })
    }
  }

  // --- Save Edited Client ---
  const handleSaveCliente = async (id: string, updates: Partial<VendoraCliente>) => {
    try {
      const updated = await adminService.updateCliente(id, updates)
      setClientes(prev => prev.map(c => c.id === id ? updated : c))
      toast(`Datos actualizados para ${updated.nombre_comercio}`, { type: 'success' })
    } catch (err: any) {
      toast('Error al guardar cambios', { type: 'error' })
    }
  }

  // --- Register Rapid Payment ---
  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!paymentClienteId) {
      toast('Selecciona un comercio', { type: 'error' })
      return
    }
    const montoNum = parseFloat(paymentMonto) || 0
    if (montoNum <= 0) {
      toast('El monto debe ser mayor a cero', { type: 'error' })
      return
    }

    setRegisteringPayment(true)
    try {
      const res = await adminService.registrarPago(
        paymentClienteId,
        montoNum,
        paymentMetodo,
        paymentNotas
      )
      setClientes(prev => prev.map(c => c.id === paymentClienteId ? res.cliente : c))
      setPagos(prev => [res.pago, ...prev])
      toast(`Pago de ${formatCOP(montoNum)} registrado con éxito para ${res.cliente.nombre_comercio}. Fecha de corte extendida 30 días.`, { type: 'success' })
      setPaymentNotas('')
    } catch (err: any) {
      toast('Error al registrar cobro', { type: 'error' })
    } finally {
      setRegisteringPayment(false)
    }
  }

  // --- Filtered Clients ---
  const filteredClientes = useMemo(() => {
    return clientes.filter(c => {
      const q = search.toLowerCase()
      const matchSearch =
        !q ||
        c.nombre_comercio.toLowerCase().includes(q) ||
        c.nombre_dueno.toLowerCase().includes(q) ||
        c.municipio.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)

      const matchPlan = planFilter === 'todos' || c.plan === planFilter
      const matchEstado = estadoFilter === 'todos' || c.estado === estadoFilter

      return matchSearch && matchPlan && matchEstado
    })
  }, [clientes, search, planFilter, estadoFilter])

  // --- Financial KPIs ---
  const totalRecaudadoMes = useMemo(() => {
    return pagos.reduce((sum, p) => sum + (Number(p.monto) || 0), 0)
  }, [pagos])

  const mrrMensual = useMemo(() => {
    return clientes
      .filter(c => c.licencia_activa && c.estado === 'activo' && c.tipo_pago === 'financiado')
      .reduce((sum, c) => sum + (Number(c.cuota_mensual) || 0), 0)
  }, [clientes])

  const licenciasActivasCount = useMemo(() => {
    return clientes.filter(c => c.licencia_activa && c.estado === 'activo').length
  }, [clientes])

  const clientesEnMoraCount = useMemo(() => {
    return clientes.filter(c => c.estado === 'mora' || c.estado === 'suspendido').length
  }, [clientes])

  // Goal: $22'000.000 COP
  const META_RECAUDO_TOTAL = 22000000
  const porcentajeMeta = Math.min(100, (totalRecaudadoMes / META_RECAUDO_TOTAL) * 100)

  // Chart data: Projected vs Collected
  const chartData = [
    { mes: 'Mayo', proyectado: 640000, recaudado: 640000 },
    { mes: 'Junio', proyectado: 960000, recaudado: 960000 },
    { mes: 'Julio', proyectado: 1200000, recaudado: 1120000 },
    { mes: 'Agosto', proyectado: 1440000, recaudado: totalRecaudadoMes },
    { mes: 'Septiembre', proyectado: 1680000, recaudado: 0 },
    { mes: 'Octubre', proyectado: 1920000, recaudado: 0 },
  ]

  // Pending new clients without license
  const pendientesActivacion = useMemo(() => {
    return clientes.filter(c => c.plan === 'sin_licencia' || !c.licencia_activa)
  }, [clientes])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast('ID copiado al portapapeles', { type: 'success' })
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20 select-none">
      
      {/* Top Navbar */}
      <AdminNavbar onRefresh={loadData} refreshing={refreshing} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        
        {/* Banner for Pending Stores */}
        {pendientesActivacion.length > 0 && (
          <div className="bg-amber-500 text-slate-950 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-slate-950 text-amber-400 flex items-center justify-center font-bold">
                {pendientesActivacion.length}
              </div>
              <div>
                <p className="font-bold text-[13px] leading-tight">
                  Comercios pendientes de activación o en mora
                </p>
                <p className="text-[11px] opacity-90">
                  {pendientesActivacion.map(c => c.nombre_comercio).join(', ')}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-bold bg-slate-950 text-white px-3 py-1 rounded-lg">
              Revisa la tabla abajo para activar
            </span>
          </div>
        )}

        {/* 1. SECTION: 4 KPI CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Recaudado */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Total Recaudado (Mes)
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold font-mono text-slate-900">{formatCOP(totalRecaudadoMes)}</p>
              <p className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <ArrowUpRight size={13} />
                <span>Cobros físicos y transferencias</span>
              </p>
            </div>
          </div>

          {/* Card 2: MRR */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                MRR (Cuotas Mensuales)
              </span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold font-mono text-blue-600">{formatCOP(mrrMensual)}</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                Ingreso recurrente proyectado
              </p>
            </div>
          </div>

          {/* Card 3: Licencias Activas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Licencias Activas
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold font-mono text-slate-900">
                {licenciasActivasCount} <span className="text-slate-400 text-lg">/ {clientes.length}</span>
              </p>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5">
                {((licenciasActivasCount / (clientes.length || 1)) * 100).toFixed(0)}% del cupo activo
              </p>
            </div>
          </div>

          {/* Card 4: En Mora / Suspendidos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                En Mora / Suspendidos
              </span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold font-mono text-rose-600">{clientesEnMoraCount} comercios</p>
              <p className="text-[11px] text-rose-600 font-semibold mt-0.5">
                Acceso restringido en su local
              </p>
            </div>
          </div>

        </div>

        {/* 2. SECTION: FINANCIAL PROGRESS & FAST CASH PAYMENT FORM */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Cash Flow Chart & Meta $22M (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Proyección de Ingresos y Flujo de Caja</h3>
                <p className="text-[12px] text-slate-400">Recaudo de cuotas ($80.000 / $160.000 / $240.000) mes a mes</p>
              </div>
              <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-lg">
                Meta de Capitalización
              </span>
            </div>

            {/* Goal Progress Bar ($22M COP) */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="font-semibold text-slate-700">Meta Capitalización Vendora</span>
                <span className="font-mono font-bold text-slate-900">
                  {formatCOP(totalRecaudadoMes)} / <span className="text-slate-400">{formatCOP(META_RECAUDO_TOTAL)}</span>
                </span>
              </div>
              <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${porcentajeMeta}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-medium">
                <span>{porcentajeMeta.toFixed(1)}% Alcanzado</span>
                <span>Faltan {formatCOP(Math.max(0, META_RECAUDO_TOTAL - totalRecaudadoMes))} para la meta</span>
              </div>
            </div>

            {/* Recharts Bar Chart */}
            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    formatter={(value: any) => [formatCOP(Number(value)), '']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="proyectado" name="Cuotas Proyectadas" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recaudado" name="Recaudo Físico (Real)" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Fast Payment Form (4 cols) */}
          <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Wallet size={15} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Registrar Cobro Rápido</h3>
                  <p className="text-[11px] text-slate-400">Recaudo en local o Nequi</p>
                </div>
              </div>

              <form onSubmit={handleRegisterPayment} className="mt-4 space-y-3.5 text-[12px]">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Seleccionar Comercio</label>
                  <select
                    value={paymentClienteId}
                    onChange={e => {
                      setPaymentClienteId(e.target.value)
                      const found = clientes.find(c => c.id === e.target.value)
                      if (found && found.cuota_mensual) {
                        setPaymentMonto(String(found.cuota_mensual))
                      }
                    }}
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white font-medium"
                  >
                    {clientes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.nombre_comercio} ({c.municipio}) — Cuota: {formatCOP(c.cuota_mensual)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Monto Cobrado ($ COP)</label>
                  <input
                    type="number"
                    required
                    value={paymentMonto}
                    onChange={e => setPaymentMonto(e.target.value)}
                    className="w-full h-8 px-2.5 font-mono font-bold text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Método de Recaudo</label>
                  <select
                    value={paymentMetodo}
                    onChange={e => setPaymentMetodo(e.target.value)}
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                  >
                    <option value="efectivo">💵 Efectivo en Local Comercial</option>
                    <option value="nequi">📱 Transferencia Nequi</option>
                    <option value="daviplata">📱 Daviplata</option>
                    <option value="bancolombia">🏦 Bancolombia</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Notas / Observación</label>
                  <input
                    type="text"
                    placeholder="Ej: Cobro cuota 4 en persona..."
                    value={paymentNotas}
                    onChange={e => setPaymentNotas(e.target.value)}
                    className="w-full h-8 px-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={registeringPayment}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <CheckCircle2 size={15} />
                  <span>{registeringPayment ? 'Registrando...' : 'Registrar Pago (+30 días)'}</span>
                </button>
              </form>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
              ⚡ Al registrar, el cliente queda activo automáticamente y su fecha de corte se extiende 30 días.
            </div>
          </div>

        </div>

        {/* 3. SECTION: CLIENTS & LICENSES TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">Gestión de Clientes y Licencias</h3>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded-full">
                  {filteredClientes.length} comercios
                </span>
              </div>
              <p className="text-[12px] text-slate-400 mt-0.5">
                Control de acceso en tiempo real, planes y estados de cobro
              </p>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar negocio, dueño o municipio..."
                  className="w-full h-8 pl-8 pr-3 text-[12px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                />
              </div>

              {/* Plan Filter */}
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                className="h-8 px-2.5 border border-slate-200 rounded-lg text-[11px] font-medium bg-white focus:outline-none"
              >
                <option value="todos">Todos los Planes</option>
                <option value="starter">STARTER</option>
                <option value="pro">PRO</option>
                <option value="max">MAX</option>
                <option value="sin_licencia">Sin Licencia</option>
              </select>

              {/* Status Filter */}
              <select
                value={estadoFilter}
                onChange={e => setEstadoFilter(e.target.value)}
                className="h-8 px-2.5 border border-slate-200 rounded-lg text-[11px] font-medium bg-white focus:outline-none"
              >
                <option value="todos">Todos los Estados</option>
                <option value="activo">🟢 Activos</option>
                <option value="mora">🟡 En Mora</option>
                <option value="suspendido">🔴 Suspendidos</option>
                <option value="pendiente">⚪ Pendientes</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">ID Negocio</th>
                  <th className="px-4 py-3">Comercio / Propietario</th>
                  <th className="px-4 py-3">Municipio</th>
                  <th className="px-4 py-3 text-center">Plan Actual</th>
                  <th className="px-4 py-3">Tipo Pago</th>
                  <th className="px-4 py-3 text-right">Cuotas</th>
                  <th className="px-4 py-3">Próximo Corte</th>
                  <th className="px-4 py-3 text-center">Interruptor Licencia</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredClientes.map(cliente => {
                  const isOnline = cliente.online_ahora

                  return (
                    <tr key={cliente.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* ID Negocio */}
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-500">
                        <button
                          onClick={() => copyToClipboard(cliente.id)}
                          className="flex items-center gap-1 hover:text-blue-600 text-left"
                          title="Copiar ID completo"
                        >
                          <span>{cliente.id.slice(0, 8)}...</span>
                          <Copy size={11} className="text-slate-400" />
                        </button>
                      </td>

                      {/* Store & Owner Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className={[
                              'w-2 h-2 rounded-full shrink-0',
                              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                            ].join(' ')}
                            title={isOnline ? 'Conectado ahora' : 'Desconectado'}
                          />
                          <div>
                            <p className="font-bold text-slate-900 leading-snug">{cliente.nombre_comercio}</p>
                            <p className="text-[11px] text-slate-400">{cliente.nombre_dueno} {cliente.telefono && `· ${cliente.telefono}`}</p>
                          </div>
                        </div>
                      </td>

                      {/* City */}
                      <td className="px-4 py-3 text-slate-600 font-medium">{cliente.municipio}</td>

                      {/* Plan Badge */}
                      <td className="px-4 py-3 text-center">
                        <span
                          className={[
                            'px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 shadow-xs',
                            cliente.plan === 'max'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300 font-extrabold'
                              : cliente.plan === 'pro'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200 font-bold'
                              : cliente.plan === 'starter'
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          ].join(' ')}
                        >
                          {cliente.plan === 'max' && <Sparkles size={10} className="text-amber-600" />}
                          {cliente.plan === 'sin_licencia' ? 'Sin Licencia' : cliente.plan.toUpperCase()}
                        </span>
                      </td>

                      {/* Tipo Pago */}
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-slate-600 capitalize">
                          {cliente.tipo_pago === 'financiado' ? 'Financiación 10m' : 'Vitalicio'}
                        </span>
                        {cliente.tipo_pago === 'financiado' && (
                          <span className="block font-mono text-[10px] text-slate-400">
                            {formatCOP(cliente.cuota_mensual)}/mes
                          </span>
                        )}
                      </td>

                      {/* Cuotas */}
                      <td className="px-4 py-3 text-right font-mono">
                        <div>
                          <span className="font-bold text-slate-900">{cliente.cuotas_pagadas}</span>
                          <span className="text-slate-400">/{cliente.cuotas_total}</span>
                        </div>
                        {cliente.saldo_pendiente > 0 && (
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Saldo: {formatCOP(cliente.saldo_pendiente)}
                          </span>
                        )}
                      </td>

                      {/* Próximo Corte */}
                      <td className="px-4 py-3 font-mono text-[11px]">
                        <span className={cliente.estado === 'mora' ? 'text-rose-600 font-bold' : 'text-slate-700'}>
                          {cliente.fecha_corte || '—'}
                        </span>
                      </td>

                      {/* Instant Toggle Switch */}
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleLicencia(cliente)}
                            className={[
                              'w-11 h-6 rounded-full transition-all relative cursor-pointer',
                              cliente.licencia_activa ? 'bg-emerald-600' : 'bg-slate-300'
                            ].join(' ')}
                            title={cliente.licencia_activa ? 'Licencia activa (Clic para suspender)' : 'Licencia suspendida (Clic para activar)'}
                          >
                            <span
                              className={[
                                'w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-xs',
                                cliente.licencia_activa ? 'right-0.5' : 'left-0.5'
                              ].join(' ')}
                            />
                          </button>
                          <span className={[
                            'text-[10px] font-bold uppercase w-14 text-left',
                            cliente.licencia_activa ? 'text-emerald-700' : 'text-slate-400'
                          ].join(' ')}>
                            {cliente.licencia_activa ? 'Activo' : 'Corte'}
                          </span>
                        </div>
                      </td>

                      {/* Edit Button */}
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => {
                            setEditingCliente(cliente)
                            setDialogOpen(true)
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Edit2 size={11} />
                          <span>Editar</span>
                        </button>
                      </td>

                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

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

    </div>
  )
}
