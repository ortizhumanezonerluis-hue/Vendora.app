import { useState, useEffect } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLicense } from '../../hooks/useLicense'
import LockedFeatureModal from '../ui/LockedFeatureModal'
import LicenseModal from '../ui/LicenseModal'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Scan,
  Wallet,
  History,
  BarChart3,
  ShoppingBag,
  ClipboardList,
  Settings,
  Store,
  FileCode,
  Scale,
  ArrowLeft,
  FileText,
  BookOpen,
  FolderCheck,
  Landmark,
  Coins,
  Lock,
  PanelLeft,
  Sparkles
} from 'lucide-react'

// Main App Navigation Items
const mainNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', adminOnly: false, requiredPlan: 'starter' },
  { to: '/pos', icon: ShoppingCart, label: 'Punto de Venta', adminOnly: false, requiredPlan: 'starter' },
  { to: '/inventario', icon: Package, label: 'Inventario', adminOnly: false, requiredPlan: 'starter' },
  { to: '/escaneo', icon: Scan, label: 'Escáner', adminOnly: false, requiredPlan: 'starter' },
  { to: '/caja', icon: Wallet, label: 'Arqueo de Caja', adminOnly: false, requiredPlan: 'starter' },
  { to: '/historial-caja', icon: History, label: 'Historial de Cajas', adminOnly: false, requiredPlan: 'starter' },
  { to: '/compras', icon: ShoppingBag, label: 'Compras', adminOnly: true, requiredPlan: 'pro' },
  { to: '/comprobantes', icon: FileCode, label: 'Comprobantes de Venta', adminOnly: true, requiredPlan: 'starter' },
  { to: '/reportes', icon: BarChart3, label: 'Informes', adminOnly: true, requiredPlan: 'starter' },
  { to: '/contabilidad/libro-fiscal', icon: Scale, label: 'Contabilidad', adminOnly: true, requiredPlan: 'max' },
  { to: '/auditoria', icon: ClipboardList, label: 'Logs del Sistema', adminOnly: true, requiredPlan: 'pro' },
]

// Accounting Context Navigation Items
const accountingNav = [
  { to: '/contabilidad/rut', icon: FileText, label: 'RUT Digital (Resp. 52)' },
  { to: '/contabilidad/libro-fiscal', icon: BookOpen, label: 'Libro Fiscal Diario' },
  { to: '/contabilidad/costos-soportados', icon: FolderCheck, label: 'Costos Soportados' },
  { to: '/contabilidad/extractos-bancarios', icon: Landmark, label: 'Extractos Bancarios' },
  { to: '/contabilidad/pagos-menores', icon: Coins, label: 'Pagos Menores' },
]

export default function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { plan, canAccessPurchasing, canAccessLogs, canAccessAccounting, isSinLicencia } = useLicense()
  const isAdmin = profile?.rol === 'admin'

  // Collapsed Sidebar State
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('vendora_sidebar_collapsed') === 'true'
  })

  const toggleCollapsed = () => {
    const next = !collapsed
    setCollapsed(next)
    localStorage.setItem('vendora_sidebar_collapsed', String(next))
  }

  const isAccountingMode = location.pathname.startsWith('/contabilidad')
  const visibleMainNav = mainNav.filter((item) => !item.adminOnly || isAdmin)

  // Locked Modal state
  const [lockedModal, setLockedModal] = useState<{
    open: boolean
    title: string
    desc: string
    requiredPlan: 'pro' | 'max'
  }>({
    open: false,
    title: '',
    desc: '',
    requiredPlan: 'pro'
  })

  const initials = profile?.nombre
    ? profile.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US'

  const handleLockedClick = (e: React.MouseEvent, item: typeof mainNav[0]) => {
    if (item.requiredPlan === 'pro' && !canAccessPurchasing) {
      e.preventDefault()
      setLockedModal({
        open: true,
        title: item.label,
        desc: `El módulo de ${item.label} está disponible exclusivamente a partir del Plan PRO en adelante.`,
        requiredPlan: 'pro'
      })
    } else if (item.requiredPlan === 'max' && !canAccessAccounting) {
      e.preventDefault()
      setLockedModal({
        open: true,
        title: 'Módulo de Gestión Contable y Tributaria',
        desc: 'El módulo contable (Libro Fiscal, RUT 52, Costos Soportados, Extractos y Alerta 3.500 UVT) está disponible exclusivamente en el Plan MAX.',
        requiredPlan: 'max'
      })
    }
  }

  return (
    <>
      <aside
        className={[
          'flex flex-col min-h-screen border-r border-slate-200 bg-white shrink-0 transition-all duration-200 select-none z-30',
          collapsed ? 'w-16' : 'w-56'
        ].join(' ')}
      >
        
        {/* Top Header with Collapse Toggle Button */}
        <div className="flex items-center justify-between px-3 h-14 border-b border-slate-200 shrink-0">
          {isAccountingMode ? (
            <>
              {!collapsed ? (
                <button
                  onClick={() => navigate('/pos')}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-[12px] font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100 transition-colors truncate"
                  title="Regresar a la aplicación principal"
                >
                  <ArrowLeft size={14} className="text-slate-500 shrink-0" />
                  <span className="truncate">Volver a App</span>
                </button>
              ) : (
                <button
                  onClick={() => navigate('/pos')}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100 mx-auto"
                  title="Volver a la App"
                >
                  <ArrowLeft size={16} />
                </button>
              )}

              <button
                onClick={toggleCollapsed}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
              >
                <PanelLeft size={16} />
              </button>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              {!collapsed ? (
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-6 h-6 bg-slate-900 rounded-md flex items-center justify-center shrink-0">
                    <Store size={13} className="text-white" />
                  </div>
                  <span className="font-bold text-[13px] tracking-tight text-slate-900 leading-none truncate">
                    Vendora
                  </span>
                  
                  {/* Ultra Premium Plan Badge */}
                  <span className={[
                    'px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shrink-0',
                    plan === 'max' ? 'bg-slate-900 text-amber-300 border border-amber-500/30' :
                    plan === 'pro' ? 'bg-slate-900 text-blue-300 border border-blue-500/30' :
                    plan === 'starter' ? 'bg-slate-100 text-slate-700 border border-slate-300' :
                    'bg-rose-50 text-rose-700 border border-rose-200'
                  ].join(' ')}>
                    {plan === 'sin_licencia' ? 'Sin Licencia' : plan.toUpperCase()}
                  </span>
                </div>
              ) : (
                <div className="w-7 h-7 bg-slate-900 rounded-md flex items-center justify-center mx-auto shrink-0">
                  <Store size={14} className="text-white" />
                </div>
              )}

              {/* Sidebar Collapse Toggle Button (Exact icon from user reference image) */}
              <button
                onClick={toggleCollapsed}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
                title={collapsed ? 'Expandir barra lateral' : 'Contraer barra lateral'}
              >
                <PanelLeft size={16} />
              </button>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {isAccountingMode ? (
            <div className="space-y-0.5">
              {accountingNav.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to
                return (
                  <NavLink
                    key={to}
                    to={to}
                    title={collapsed ? label : undefined}
                    className={[
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                      collapsed ? 'justify-center px-0' : '',
                      active
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                    ].join(' ')}
                  >
                    <Icon size={16} className={active ? 'text-slate-900' : 'text-slate-400'} />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </NavLink>
                )
              })}
            </div>
          ) : (
            <div className="space-y-0.5">
              {visibleMainNav.map((item) => {
                const { to, icon: Icon, label, requiredPlan } = item
                const active = location.pathname === to || (label === 'Contabilidad' && location.pathname.startsWith('/contabilidad'))
                
                const isLocked =
                  (requiredPlan === 'pro' && !canAccessPurchasing) ||
                  (requiredPlan === 'max' && !canAccessAccounting)

                return (
                  <NavLink
                    key={to}
                    to={to}
                    title={collapsed ? `${label} ${isLocked ? '(Bloqueado)' : ''}` : undefined}
                    onClick={(e) => isLocked && handleLockedClick(e, item)}
                    className={[
                      'flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors group',
                      collapsed ? 'justify-center px-0' : '',
                      active
                        ? 'bg-slate-100 text-slate-900 font-semibold'
                        : isLocked
                        ? 'text-slate-400 hover:bg-slate-50/80 hover:text-slate-600 cursor-pointer'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={16} className={active ? 'text-slate-900' : isLocked ? 'text-slate-400' : 'text-slate-400'} />
                      {!collapsed && <span className="truncate">{label}</span>}
                    </div>

                    {!collapsed && isLocked && (
                      <span className="p-0.5 text-amber-500 hover:text-amber-600 shrink-0" title={`Bloqueado para ${plan.toUpperCase()}`}>
                        <Lock size={12} />
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          )}
        </nav>

        {/* Settings and User profile at bottom */}
        <div className="px-2 py-3 border-t border-slate-200">
          {isAdmin && (
            <NavLink
              to="/configuracion"
              title={collapsed ? 'Configuración' : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  collapsed ? 'justify-center px-0' : '',
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-semibold'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Settings size={16} className={isActive ? 'text-slate-900' : 'text-slate-400'} />
                  {!collapsed && <span>Configuración</span>}
                </>
              )}
            </NavLink>
          )}

          {/* User info */}
          <div className={[
            'mt-2.5 flex items-center gap-2.5 bg-slate-50 rounded-lg p-2',
            collapsed ? 'justify-center p-1.5' : ''
          ].join(' ')}>
            <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-[10px] font-semibold text-white shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold text-slate-900 truncate">{profile?.nombre || 'Usuario'}</p>
                <p className="text-[10px] text-slate-400 truncate capitalize">{profile?.rol === 'admin' ? 'Administrador' : 'Empleado'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Locked Feature Modal */}
      <LockedFeatureModal
        isOpen={lockedModal.open}
        onClose={() => setLockedModal({ ...lockedModal, open: false })}
        featureTitle={lockedModal.title}
        featureDesc={lockedModal.desc}
        requiredPlan={lockedModal.requiredPlan}
        currentPlan={plan}
      />

      {/* Unlicensed Business Overlay */}
      {isSinLicencia && !location.pathname.startsWith('/Block_Id/Admin') && (
        <LicenseModal isOpen={true} />
      )}
    </>
  )
}
