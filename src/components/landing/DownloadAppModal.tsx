import { useState } from 'react'
import {
  Monitor, Download, ShieldCheck, WifiOff, CheckCircle2,
  Sparkles, X, ArrowRight, Laptop, FileDown, Zap, HardDrive
} from 'lucide-react'

interface DownloadAppModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function DownloadAppModal({ isOpen, onClose }: DownloadAppModalProps) {
  const [downloading, setDownloading] = useState(false)
  const [downloadStarted, setDownloadStarted] = useState(false)

  if (!isOpen) return null

  const handleDownload = () => {
    setDownloading(true)
    setTimeout(() => {
      setDownloading(false)
      setDownloadStarted(true)
      window.open('https://github.com/ortizhumanezonerluis-hue/Vendora.app/releases/latest/download/Vendora-POS-Setup.exe', '_blank')
    }, 1200)
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 text-slate-900">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-blue-950 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
              <Monitor size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-[16px] font-bold">Descargar Vendora para Windows</h3>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold rounded-full uppercase">
                  v2.4 Oficial
                </span>
              </div>
              <p className="text-[12px] text-slate-300 mt-0.5">Instalador nativo 100% autónomo para PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* Main Download Card */}
          <div className="bg-gradient-to-b from-blue-50/60 to-slate-50 border border-blue-100 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <Laptop size={16} className="text-blue-600" />
                <span className="text-[14px] font-bold text-slate-900">Vendora POS para Windows (.exe)</span>
              </div>
              <p className="text-[12px] text-slate-500">
                Compatible con Windows 10 y Windows 11 (64-bit) · 88.4 MB
              </p>
            </div>

            <button
              onClick={handleDownload}
              disabled={downloading}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-blue-600/20 transition-all hover:translate-y-[-1px] flex items-center justify-center gap-2 shrink-0 cursor-pointer disabled:opacity-75"
            >
              <Download size={16} className={downloading ? 'animate-bounce' : ''} />
              <span>{downloading ? 'Preparando...' : 'Descargar Instalador'}</span>
            </button>
          </div>

          {downloadStarted && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[12px] rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
              <span>Tu descarga ha iniciado. Si no comenzó automáticamente, haz clic nuevamente en el botón.</span>
            </div>
          )}

          {/* Key Advantages Checklist */}
          <div className="space-y-3">
            <h4 className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
              Ventajas de la Aplicación de Escritorio
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px]">
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <WifiOff size={15} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">100% Offline (Sin Internet)</strong>
                  <span className="text-slate-500 text-[11px]">Sigue vendiendo en caja y gestionando stock aunque se caiga la red.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <HardDrive size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Cero Comandos ni Terminal</strong>
                  <span className="text-slate-500 text-[11px]">Todo empaquetado en un solo ejecutable directo (.exe) para tu PC.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <Zap size={15} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Escáner USB y Móvil LAN</strong>
                  <span className="text-slate-500 text-[11px]">Conecta pistolas lectoras de barras e impresoras térmicas al instante.</span>
                </div>
              </div>

              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                <ShieldCheck size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900">Sincronización Automática</strong>
                  <span className="text-slate-500 text-[11px]">Al volver la conexión, tus ventas y caja se respaldan solas en la nube.</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick 3-Step Setup Guide */}
          <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2.5 text-[12px]">
            <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
              Instalación en 3 Simples Pasos
            </span>
            <div className="grid grid-cols-3 gap-3 text-center pt-1">
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] font-bold inline-flex items-center justify-center mb-1">1</span>
                <p className="text-[11px] font-medium text-slate-200">Descarga el .exe</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] font-bold inline-flex items-center justify-center mb-1">2</span>
                <p className="text-[11px] font-medium text-slate-200">Doble Clic & Abrir</p>
              </div>
              <div className="p-2 bg-white/5 rounded-lg border border-white/10">
                <span className="w-5 h-5 bg-blue-500 text-white rounded-full text-[10px] font-bold inline-flex items-center justify-center mb-1">3</span>
                <p className="text-[11px] font-medium text-slate-200">¡Listo para Vender!</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[12px]">
          <span className="text-slate-500 text-[11px]">¿Necesitas ayuda con la instalación? Escríbenos a soporte.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  )
}
