import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { authService } from '../../services/authService'
import { isElectron } from '../../lib/electronBridge'

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

const SESSION_CACHE_KEY = 'vendora_auth_session_cache'

function restoreCachedSession(): { user: any; profile: UserProfile | null } | null {
  try {
    const raw = localStorage.getItem(SESSION_CACHE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function cacheSession(u: any, p: UserProfile | null) {
  try {
    if (u && p) {
      localStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ user: u, profile: p }))
    }
  } catch { /* quota full, ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  // Synchronous initialization from cache prevents flashes of unauthenticated/empty state
  const initialCache = restoreCachedSession()
  const [user, setUser] = useState<any>(() => initialCache?.user || null)
  const [profile, setProfile] = useState<UserProfile | null>(() => initialCache?.profile || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = async (email: string): Promise<UserProfile | null> => {
    try {
      const { data } = await supabase
        .from('usuarios')
        .select('*')
        .eq('email', email)
        .maybeSingle()
      return data
    } catch {
      return null
    }
  }


  useEffect(() => {
    async function checkSession() {
      if (!navigator.onLine) {
        const cached = restoreCachedSession()
        if (cached?.user && cached?.profile) {
          setUser(cached.user)
          setProfile(cached.profile)
        }
        setLoading(false)
        return
      }

      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          setUser(session.user)
          const prof = await fetchProfile(session.user.email!)
          if (prof) {
            setProfile(prof)
            cacheSession(session.user, prof)
          } else {
            const cached = restoreCachedSession()
            if (cached?.profile) {
              setProfile(cached.profile)
            }
          }
        } else {
          const cached = restoreCachedSession()
          if (cached?.user && cached?.profile) {
            setUser(cached.user)
            setProfile(cached.profile)
          }
        }
      } catch (err) {
        const cached = restoreCachedSession()
        if (cached?.user && cached?.profile) {
          setUser(cached.user)
          setProfile(cached.profile)
        }
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        const prof = await fetchProfile(session.user.email!)
        if (prof) {
          setProfile(prof)
          cacheSession(session.user, prof)
        } else {
          const cached = restoreCachedSession()
          if (cached?.profile) setProfile(cached.profile)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setProfile(null)
        try { localStorage.removeItem(SESSION_CACHE_KEY) } catch { /* ignore */ }
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
      cacheSession(res.user, res.profile as UserProfile)
    } catch (err: any) {
      if (isElectron || !navigator.onLine) {
        // Fallback offline en escritorio: permitir entrar con sesión local / caché
        const cached = restoreCachedSession()
        const localUser = cached?.user || { id: 'usr-admin-principal', email: e }
        const localProfile: UserProfile = cached?.profile || {
          id: 'usr-admin-principal',
          email: e,
          nombre: e.split('@')[0] || 'Administrador',
          rol: 'admin',
          estado: 'activo',
          negocio_id: 'negocio-local-principal'
        }
        setUser(localUser)
        setProfile(localProfile)
        cacheSession(localUser, localProfile)
        return
      }
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
      cacheSession(res.user, res.profile as UserProfile)
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
      try { localStorage.removeItem(SESSION_CACHE_KEY) } catch { /* ignore */ }
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
