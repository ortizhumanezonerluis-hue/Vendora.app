import { useNavigate } from 'react-router-dom'
import { ShieldCheck, LogOut, RefreshCw, Store } from 'lucide-react'
import { toast } from '../ui/Toaster'

export default function AdminNavbar({ onRefresh, refreshing }: { onRefresh: () => void; refreshing: boolean }) {
  const navigate = useNavigate()

  const handleLogout = () => {
    sessionStorage.removeItem('vendora_master_admin_session')
    toast('Sesión de administrador cerrada', { type: 'success' })
    navigate('/Block_Id/Admin/Vendora/login', { replace: true })
  }

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm">
            <ShieldCheck size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-[15px] tracking-tight text-white">Vendora</span>
              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-[10px] font-bold rounded border border-blue-500/30 uppercase">
                Panel Maestro
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Control de Licencias y Recaudos · Córdoba</p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[12px] font-semibold border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Recargar datos de Supabase"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-800 text-[12px]">
            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-bold text-white">
              OL
            </div>
            <span className="text-slate-300 font-medium">Oner Luis (Admin)</span>
          </div>

          <button
            onClick={handleLogout}
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            title="Cerrar sesión maestra"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>
    </header>
  )
}
