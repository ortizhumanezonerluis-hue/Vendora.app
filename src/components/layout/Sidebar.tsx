import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { useLicense } from '../../hooks/useLicense'
import LockedFeatureModal from '../ui/LockedFeatureModal'
import LicenseModal from '../ui/LicenseModal'
import {
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
  Lock
} from 'lucide-react'

// Main App Navigation Items
const mainNav = [
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
      <aside className="flex flex-col w-56 min-h-screen border-r border-gray-200 bg-white shrink-0 transition-all duration-300 select-none">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-3 h-14 border-b border-gray-200 shrink-0">
          {isAccountingMode ? (
            <>
              <button
                onClick={() => navigate('/pos')}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-gray-700 hover:text-gray-950 hover:bg-gray-100 transition-colors"
                title="Regresar a la aplicación principal"
              >
                <ArrowLeft size={14} className="text-gray-500" />
                <span>Volver a la App</span>
              </button>
              <div className="w-7 h-7 bg-gray-100 rounded-lg flex items-center justify-center text-gray-800">
                <Scale size={14} />
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
                  <Store size={13} className="text-white" />
                </div>
                <span className="font-semibold text-[13px] tracking-tight text-gray-900 leading-none">Vendora</span>
              </div>
              <span className={[
                'px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider',
                plan === 'max' ? 'bg-amber-100 text-amber-900 border border-amber-300' :
                plan === 'pro' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                plan === 'starter' ? 'bg-slate-100 text-slate-700 border border-slate-200' :
                'bg-rose-100 text-rose-800'
              ].join(' ')}>
                {plan === 'sin_licencia' ? 'Sin Licencia' : plan.toUpperCase()}
              </span>
            </div>
          )}
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {isAccountingMode ? (
            <div className="space-y-0.5 animate-in fade-in duration-150">
              {accountingNav.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={[
                      'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                      active
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                    ].join(' ')}
                  >
                    <Icon size={15} className={active ? 'text-gray-900' : 'text-gray-400'} />
                    <span>{label}</span>
                  </NavLink>
                )
              })}
            </div>
          ) : (
            <div className="space-y-0.5 animate-in fade-in duration-150">
              {visibleMainNav.map((item) => {
                const { to, icon: Icon, label, requiredPlan } = item
                const active = location.pathname.startsWith(to) || (label === 'Contabilidad' && location.pathname.startsWith('/contabilidad'))
                
                const isLocked =
                  (requiredPlan === 'pro' && !canAccessPurchasing) ||
                  (requiredPlan === 'max' && !canAccessAccounting)

                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={(e) => isLocked && handleLockedClick(e, item)}
                    className={[
                      'flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                      active
                        ? 'bg-gray-100 text-gray-900 font-semibold'
                        : isLocked
                        ? 'text-gray-400 hover:bg-gray-50/80 hover:text-gray-600 cursor-pointer'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon size={15} className={active ? 'text-gray-900' : 'text-gray-400'} />
                      <span className="truncate">{label}</span>
                    </div>

                    {isLocked && (
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
        <div className="px-2 py-3 border-t border-gray-200">
          {isAdmin && (
            <NavLink
              to="/configuracion"
              className={({ isActive }) =>
                [
                  'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                  isActive
                    ? 'bg-gray-100 text-gray-900 font-semibold'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Settings size={15} className={isActive ? 'text-gray-900' : 'text-gray-400'} />
                  Configuración
                </>
              )}
            </NavLink>
          )}

          {/* User info */}
          <div className="mt-3 flex items-center gap-2.5 px-2.5 py-2 bg-gray-50 rounded-lg">
            <div className="w-7 h-7 rounded-full bg-gray-900 flex items-center justify-center text-[10px] font-semibold text-white">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-medium text-gray-900 truncate">{profile?.nombre || 'Usuario'}</p>
              <p className="text-[10px] text-gray-400 truncate capitalize">{profile?.rol === 'admin' ? 'Administrador' : 'Empleado'}</p>
            </div>
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
