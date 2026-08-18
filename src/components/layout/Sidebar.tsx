import { NavLink, useLocation } from 'react-router-dom'
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
} from 'lucide-react'

const nav = [
  { to: '/pos', icon: ShoppingCart, label: 'Punto de Venta', adminOnly: false },
  { to: '/inventario', icon: Package, label: 'Inventario', adminOnly: false },
  { to: '/escaneo', icon: Scan, label: 'Escáner', adminOnly: false },
  { to: '/caja', icon: Wallet, label: 'Arqueo de Caja', adminOnly: false },
  { to: '/historial-caja', icon: History, label: 'Historial de Cajas', adminOnly: false },
  { to: '/compras', icon: ShoppingBag, label: 'Compras', adminOnly: true },
  { to: '/comprobantes', icon: FileCode, label: 'Comprobantes de Venta', adminOnly: true },
  { to: '/reportes', icon: BarChart3, label: 'Informes', adminOnly: true },
  { to: '/Gestion detallada de inventario', icon: ClipboardList, label: 'Auditoría Física', adminOnly: true },
  { to: '/auditoria', icon: ClipboardList, label: 'Logs del Sistema', adminOnly: true },
]

export default function Sidebar() {
  const location = useLocation()
  const { profile } = useAuth()
  const isAdmin = profile?.rol === 'admin'

  const visibleNav = nav.filter((item) => !item.adminOnly || isAdmin)

  const initials = profile?.nombre
    ? profile.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US'

  return (
    <aside className="flex flex-col w-56 min-h-screen border-r border-gray-200 bg-white shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-gray-200">
        <div className="w-6 h-6 bg-gray-900 rounded flex items-center justify-center">
          <Store size={13} className="text-white" />
        </div>
        <span className="font-semibold text-[13px] tracking-tight text-gray-900">Vendora</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {visibleNav.map(({ to, icon: Icon, label }) => {
          const active = location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={[
                'flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] font-medium transition-colors',
                active
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900',
              ].join(' ')}
            >
              <Icon size={15} className={active ? 'text-gray-900' : 'text-gray-400'} />
              {label}
            </NavLink>
          )
        })}
      </nav>

      {/* Settings at bottom */}
      <div className="px-2 py-3 border-t border-gray-200">
        {isAdmin && (
          <NavLink
            to="/configuracion"
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-2.5 py-2 rounded text-[13px] font-medium transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
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
