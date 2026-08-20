import { ShieldAlert, Phone, MessageCircle, RefreshCw, LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

interface LicenseModalProps {
  isOpen: boolean
  onClose?: () => void
}

export default function LicenseModal({ isOpen, onClose }: LicenseModalProps) {
  const { signOut, profile } = useAuth()

  if (!isOpen) return null

  const whatsappMsg = encodeURIComponent(
    `Hola Oner, soy ${profile?.nombre || 'un comerciante'} de Vendora. Mi cuenta aparece sin licencia activa / pendiente de activación. ¿Me ayudas a habilitarla?`
  )
  const waUrl = `https://wa.me/573009797523?text=${whatsappMsg}`

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto shadow-sm">
          <ShieldAlert size={30} />
        </div>

        <div>
          <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Licencia Inactiva / En Revisión
          </span>
          <h3 className="text-xl font-bold text-slate-900 mt-2">
            Acceso Pendiente de Activación
          </h3>
          <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
            Tu negocio aún no tiene una licencia activa asignada o se encuentra en proceso de validación. Para habilitar las operaciones de tu punto de venta, contáctanos directamente.
          </p>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-[12px] text-slate-700 space-y-1 text-left">
          <div className="flex justify-between">
            <span className="text-slate-400">Comercio:</span>
            <span className="font-semibold">{profile?.nombre || 'Mi Negocio'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Estado:</span>
            <span className="font-bold text-amber-600">Pendiente de Aprobación</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} />
            <span>Activar Licencia por WhatsApp</span>
          </a>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[12px] rounded-xl transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={13} />
            <span>Verificar Estado Nuevamente</span>
          </button>

          <button
            onClick={() => signOut()}
            className="w-full py-1.5 text-slate-400 hover:text-rose-600 text-[11px] font-medium transition-colors flex items-center justify-center gap-1"
          >
            <LogOut size={12} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}
