import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'
import { toast } from '../../components/ui/Toaster'
import { ShieldCheck, Lock, Mail, ArrowRight } from 'lucide-react'

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
        toast('Acceso maestro concedido', { type: 'success' })
        navigate('/Block_Id/Admin/Vendora/panel', { replace: true })
        return
      }

      // 2. Direct master verification check
      if (email.trim() === MASTER_EMAIL && password.trim() === 'TuuOnerortiz22*') {
        sessionStorage.setItem('vendora_master_admin_session', 'authenticated_master')
        toast('Acceso maestro verificado', { type: 'success' })
        navigate('/Block_Id/Admin/Vendora/panel', { replace: true })
        return
      }

      // Generic failure without revealing what failed
      toast('Credenciales inválidas o acceso no autorizado', { type: 'error' })
    } catch (err: any) {
      toast('Error al autenticar', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 selection:bg-blue-600 selection:text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-500 flex items-center justify-center mx-auto shadow-inner">
            <ShieldCheck size={26} />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Panel Maestro</h2>
          <p className="text-[12px] text-slate-400">Control Central de Licencias y Operaciones de Vendora</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 text-[13px]">
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 text-[12px]">Correo de Administrador</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="ortizhumanezonerluis@gmail.com"
                className="w-full h-10 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-[13px]"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5 text-[12px]">Contraseña Maestra</label>
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full h-10 pl-9 pr-3 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-600 text-[13px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <span>{loading ? 'Verificando...' : 'Ingresar al Panel'}</span>
            <ArrowRight size={15} />
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500">
            Conexión encriptada · Solo personal autorizado de Vendora
          </p>
        </div>

      </div>
    </div>
  )
}
