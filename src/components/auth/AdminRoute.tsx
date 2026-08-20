import { ReactNode, useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { supabase } from '../../lib/supabaseClient'

interface AdminRouteProps {
  children: ReactNode
}

// Master Admin allowed email
const MASTER_ADMIN_EMAIL = 'ortizhumanezonerluis@gmail.com'

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    // Check if session belongs to the super admin or if admin bypass session is stored
    const localAdminSession = sessionStorage.getItem('vendora_master_admin_session')
    if (localAdminSession === 'authenticated_master') {
      setIsAdminAuthenticated(true)
      return
    }

    if (!loading) {
      if (user && user.email === MASTER_ADMIN_EMAIL) {
        setIsAdminAuthenticated(true)
      } else {
        setIsAdminAuthenticated(false)
      }
    }
  }, [user, loading])

  if (loading || isAdminAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400 text-[13px] font-mono">
        Verificando credenciales de acceso...
      </div>
    )
  }

  // Silent redirect to home if unauthorized — does not reveal panel exists
  if (!isAdminAuthenticated) {
    return <Navigate to="/Block_Id/Admin/Vendora/login" replace state={{ from: location }} />
  }

  return <>{children}</>
}
