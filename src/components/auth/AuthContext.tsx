import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { authService } from '../../services/authService'

interface UserProfile {
  id: string
  nombre: string
  email: string
  rol: 'admin' | 'empleado'
  estado: 'activo' | 'inactivo'
  negocio_id: string | null
}

interface AuthContextType {
  user: any
  profile: UserProfile | null
  loading: boolean
  error: string | null
  signIn: (e: string, p: string) => Promise<void>
  signUp: (e: string, p: string, n: string, b: string, d: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async (email: string): Promise<UserProfile | null> => {
    const { data } = await supabase
      .from('usuarios')
      .select('*')
      .eq('email', email)
      .maybeSingle()
    return data
  }

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          const prof = await fetchProfile(session.user.email!)
          setProfile(prof)
        }
      } catch (err) {
        console.warn('Fallo al recuperar sesión:', err)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const prof = await fetchProfile(session.user.email!)
        setProfile(prof)
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })

    return () => { subscription.unsubscribe() }
  }, [])

  const signIn = async (e: string, p: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authService.signIn(e, p)
      setUser(res.user)
      setProfile(res.profile as UserProfile)
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (e: string, p: string, n: string, b: string, d: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await authService.signUpAdmin(e, p, n, b, d)
      setUser(res.user)
      setProfile(res.profile as UserProfile)
    } catch (err: any) {
      setError(err.message || 'Error al crear la cuenta')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await authService.signOut()
      setUser(null)
      setProfile(null)
    } catch (err: any) {
      console.error('Error al cerrar sesión:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider')
  }
  return context
}
