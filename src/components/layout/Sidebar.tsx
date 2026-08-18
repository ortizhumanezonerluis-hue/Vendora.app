import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
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
  Coins
} from 'lucide-react'

// Main App Navigation Items
const mainNav = [
  { to: '/pos', icon: ShoppingCart, label: 'Punto de Venta', adminOnly: false },
  { to: '/inventario', icon: Package, label: 'Inventario', adminOnly: false },
  { to: '/escaneo', icon: Scan, label: 'Escáner', adminOnly: false },
  { to: '/caja', icon: Wallet, label: 'Arqueo de Caja', adminOnly: false },
  { to: '/historial-caja', icon: History, label: 'Historial de Cajas', adminOnly: false },
  { to: '/compras', icon: ShoppingBag, label: 'Compras', adminOnly: true },
  { to: '/comprobantes', icon: FileCode, label: 'Comprobantes de Venta', adminOnly: true },
  { to: '/reportes', icon: BarChart3, label: 'Informes', adminOnly: true },
  { to: '/contabilidad/libro-fiscal', icon: Scale, label: 'Contabilidad', adminOnly: true },
  { to: '/Gestion detallada de inventario', icon: ClipboardList, label: 'Auditoría Física', adminOnly: true },
  { to: '/auditoria', icon: ClipboardList, label: 'Logs del Sistema', adminOnly: true },
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
  const isAdmin = profile?.rol === 'admin'

  const isAccountingMode = location.pathname.startsWith('/contabilidad')
  const visibleMainNav = mainNav.filter((item) => !item.adminOnly || isAdmin)

  const initials = profile?.nombre
    ? profile.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US'

  return (
    <aside className="flex flex-col w-60 min-h-screen border-r border-gray-200 bg-white shrink-0 transition-all duration-300 select-none">
      
      {/* Dynamic Header */}
      {isAccountingMode ? (
        <div className="px-3 h-14 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 animate-in fade-in duration-200">
          <button
            onClick={() => navigate('/pos')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold text-gray-700 hover:text-gray-950 hover:bg-gray-200/60 border border-gray-200 bg-white shadow-xs transition-all"
            title="Regresar a la aplicación principal"
          >
            <ArrowLeft size={13} className="text-gray-600" />
            <span>Volver a la App</span>
          </button>
          <div className="flex items-center gap-1.5 text-gray-800">
            <Scale size={15} className="text-gray-900" />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-200">
          <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
            <Store size={13} className="text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-[13px] tracking-tight text-gray-900 leading-none">Vendora</span>
            <span className="text-[10px] text-gray-400 font-medium mt-0.5">Gestión de Comercio</span>
          </div>
        </div>
      )}

      {/* Mode Sub-header banner when in accounting */}
      {isAccountingMode && (
        <div className="px-4 py-2.5 bg-gray-900 text-white flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold tracking-wide uppercase">Contabilidad</p>
            <p className="text-[9px] text-gray-300 font-medium">Régimen Simplificado</p>
          </div>
          <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded text-[9px] font-bold">
            Resp. 52
          </span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {isAccountingMode ? (
          <div className="space-y-0.5 animate-in fade-in slide-in-from-left-1 duration-200">
            {accountingNav.map(({ to, icon: Icon, label }) => {
              const active = location.pathname === to
              return (
                <NavLink
                  key={to}
                  to={to}
                  className={[
                    'flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[12px] font-medium transition-all',
                    active
                      ? 'bg-gray-900 text-white font-semibold shadow-xs'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  ].join(' ')}
                >
                  <Icon size={14} className={active ? 'text-white' : 'text-gray-400'} />
                  {label}
                </NavLink>
              )
            })}
          </div>
        ) : (
          visibleMainNav.map(({ to, icon: Icon, label }) => {
            const active = location.pathname.startsWith(to) || (label === 'Contabilidad' && location.pathname.startsWith('/contabilidad'))
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
                {label}
              </NavLink>
            )
          })
        )}
      </nav>

      {/* Settings at bottom */}
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
  )
}
