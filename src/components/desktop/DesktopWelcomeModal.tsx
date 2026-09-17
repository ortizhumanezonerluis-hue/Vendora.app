import { useState, useEffect } from 'react'
import { isElectron } from '../../lib/electronBridge'
import { Sparkles, ShieldCheck, HardDrive, WifiOff, Check } from 'lucide-react'

export default function DesktopWelcomeModal() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (isElectron) {
      const alreadyWelcomed = localStorage.getItem('vendora_desktop_welcomed_v1')
      if (!alreadyWelcomed) {
        setShow(true)
      }
    }
  }, [])

  const handleDismiss = () => {
    localStorage.setItem('vendora_desktop_welcomed_v1', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-gray-150 max-w-md w-full p-7 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        
        {/* Icon Header */}
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
          <ShieldCheck size={32} />
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-bold">
            <Sparkles size={12} />
            <span>Versión de Escritorio Nativa</span>
          </div>
          <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
            ¡Bienvenido a Vendora POS Desktop!
          </h2>
          <p className="text-xs text-gray-500 leading-relaxed max-w-xs mx-auto">
            Tu plataforma de punto de venta ahora funciona de forma <strong>100% local, autónoma y segura</strong> en tu computador.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="bg-gray-50 rounded-2xl p-4 text-left space-y-3 border border-gray-100 text-xs text-gray-600">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <WifiOff size={11} />
            </div>
            <div>
              <strong className="text-gray-900 block">100% Offline y sin cuelgues</strong>
              <span>Vende, consulta stock y haz arqueos sin necesidad de conexión a internet.</span>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <HardDrive size={11} />
            </div>
            <div>
              <strong className="text-gray-900 block">Base de Datos SQLite en tu Disco</strong>
              <span>Tus ventas y catálogo se guardan de forma instantánea y privada en tu equipo.</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDismiss}
          className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-98"
        >
          <Check size={14} />
          Comenzar a Vender
        </button>
      </div>
    </div>
  )
}
