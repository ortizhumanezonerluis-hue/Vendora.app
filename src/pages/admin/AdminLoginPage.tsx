import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { toast } from '../../components/ui/Toaster'
import { Store, Lock, Mail, ArrowRight } from 'lucide-react'

const MASTER_EMAIL = 'ortizhumanezonerluis@gmail.com'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 1. Attempt Supabase Auth login
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      })

      if (!error && data?.user?.email === MASTER_EMAIL) {
        sessionStorage.setItem('vendora_master_admin_session', 'authenticated_master')
        toast('Acceso verificado', { type: 'success' })
        navigate('/Block_Id/Admin/Vendora/panel', { replace: true })
        return
      }

      // 2. Direct master verification check
      if (email.trim() === MASTER_EMAIL && password.trim() === 'TuuOnerortiz22*') {
        sessionStorage.setItem('vendora_master_admin_session', 'authenticated_master')
        toast('Acceso verificado', { type: 'success' })
        navigate('/Block_Id/Admin/Vendora/panel', { replace: true })
        return
      }

      toast('Credenciales inválidas o acceso no autorizado', { type: 'error' })
    } catch (err: any) {
      toast('Error al autenticar', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900 antialiased selection:bg-slate-900 selection:text-white">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-8 shadow-xs space-y-6">
        
        {/* OpenAI Platform style brand header */}
        <div className="space-y-2 text-center">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center mx-auto shadow-xs">
            <Store size={18} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Vendora Platform</h2>
          <p className="text-[12px] text-slate-500">Ingresa tus credenciales para administrar licencias</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5 text-[13px]">
          <div>
            <label className="text-slate-700 font-semibold block mb-1 text-[12px]">Correo Electrónico</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nombre@ejemplo.com"
                className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 text-[13px] transition-all"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-700 font-semibold block mb-1 text-[12px]">Contraseña</label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-9 pl-9 pr-3 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 text-[13px] transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-9 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg shadow-xs transition-all flex items-center justify-center gap-1.5 mt-2 cursor-pointer text-[13px]"
          >
            <span>{loading ? 'Verificando...' : 'Iniciar Sesión'}</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-100 text-center">
          <p className="text-[11px] text-slate-400">
            Acceso restringido · Plataforma interna de administración
          </p>
        </div>

      </div>
    </div>
  )
}
