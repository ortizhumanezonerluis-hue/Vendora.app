import { useEffect, useRef } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import MainLayout from '../layout/MainLayout'
import { auditService } from '../../services/auditService'
import { ShieldAlert } from 'lucide-react'

interface ProtectedRouteProps {
  children: JSX.Element
  allowedRoles?: ('admin' | 'empleado')[]
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()
  const location = useLocation()
  const loggedRef = useRef(false) // avoid logging multiple times on re-renders

  const isDenied = !loading && user && profile && allowedRoles && !allowedRoles.includes(profile.rol)

  useEffect(() => {
    if (isDenied && !loggedRef.current) {
      loggedRef.current = true
      // Log restricted access attempt as critical — only admin can see this
      auditService.createAuditLog({
        user: profile!.nombre,
        action: 'Acceso denegado a ruta restringida',
        detail: `El empleado "${profile!.nombre}" intentó acceder a "${location.pathname}" sin los permisos necesarios.`,
        severity: 'critical'
      })
    }
  }, [isDenied])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-[13px]">
        Cargando sesión...
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (isDenied) {
    return (
      <MainLayout title="Acceso Restringido">
        <div className="flex flex-col items-center justify-center p-12 text-center h-[calc(100vh-120px)]">
          <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-full flex items-center justify-center text-red-400 mb-5">
            <ShieldAlert size={24} />
          </div>
          <h2 className="text-[16px] font-semibold text-gray-900">Acceso No Autorizado</h2>
          <p className="text-[13px] text-gray-400 max-w-sm mt-2 mb-6 leading-relaxed">
            Tu cuenta <strong>({profile!.rol === 'admin' ? 'Administrador' : 'Empleado'})</strong> no tiene permisos
            para acceder a <code className="font-mono text-red-500 bg-red-50 px-1.5 py-0.5 rounded text-[12px]">{location.pathname}</code>.
          </p>
          <a
            href="/pos"
            className="px-5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-md text-[13px] font-medium transition-colors"
          >
            Regresar al Punto de Venta
          </a>
        </div>
      </MainLayout>
    )
  }

  return children
}
