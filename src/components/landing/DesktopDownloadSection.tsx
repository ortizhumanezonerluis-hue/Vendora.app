import { Monitor, Download, WifiOff, HardDrive, ShieldCheck, Zap, ArrowRight, Laptop } from 'lucide-react'

interface DesktopDownloadSectionProps {
  onOpenDownloadModal: () => void
}

export default function DesktopDownloadSection({ onOpenDownloadModal }: DesktopDownloadSectionProps) {
  return (
    <section id="descargar" className="py-16 sm:py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white relative overflow-hidden">
      
      {/* Glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-5xl h-80 bg-blue-600/15 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="bg-gradient-to-br from-slate-800/90 via-slate-900/90 to-blue-950/80 border border-slate-700/80 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-2xl backdrop-blur-md">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Left Column: Info & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-[12px] font-semibold">
                <Laptop size={14} className="text-blue-400" />
                <span>Aplicación Nativa para Computador (Windows)</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Instala Vendora en tu PC.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  Vende con o sin Internet.
                </span>
              </h2>

              <p className="text-slate-300 text-base sm:text-lg max-w-2xl font-normal leading-relaxed">
                Sin configuraciones complicadas ni comandos en terminal. Descarga el archivo ejecutable <strong>.exe</strong>, haz doble clic y empieza a facturar en tu negocio en menos de 1 minuto.
              </p>

              {/* Feature bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-left">
                <div className="flex items-center gap-2.5 text-slate-200 text-[13px] font-medium">
                  <div className="w-6 h-6 rounded-md bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                    <WifiOff size={13} />
                  </div>
                  <span>Punto de Venta 100% Offline</span>
                </div>

                <div className="flex items-center gap-2.5 text-slate-200 text-[13px] font-medium">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                    <HardDrive size={13} />
                  </div>
                  <span>Ejecutable Autónomo (.exe)</span>
                </div>

                <div className="flex items-center gap-2.5 text-slate-200 text-[13px] font-medium">
                  <div className="w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Zap size={13} />
                  </div>
                  <span>Lector de Código de Barras USB</span>
                </div>

                <div className="flex items-center gap-2.5 text-slate-200 text-[13px] font-medium">
                  <div className="w-6 h-6 rounded-md bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={13} />
                  </div>
                  <span>Sincronización Nube DIAN & UVT</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={onOpenDownloadModal}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[14px] rounded-xl shadow-xl shadow-blue-600/30 transition-all hover:translate-y-[-2px] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Download size={18} />
                  <span>Descargar Gratis para Windows (.exe)</span>
                </button>

                <a
                  href="#/pos"
                  className="w-full sm:w-auto px-6 py-4 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600 text-slate-200 font-semibold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <span>Probar versión Web</span>
                  <ArrowRight size={15} />
                </a>
              </div>

              <p className="text-[11px] text-slate-400">
                Compatible con Windows 10 y Windows 11 · 64 bits · Actualizaciones automáticas
              </p>

            </div>

            {/* Right Column: Visual Box */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-slate-950/90 border border-slate-700/60 rounded-2xl p-6 shadow-2xl space-y-5">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                      V
                    </div>
                    <div>
                      <h4 className="text-[14px] font-bold text-white">Vendora Desktop</h4>
                      <p className="text-[11px] text-slate-400">v2.4 Final Release</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded">
                    Windows
                  </span>
                </div>

                <div className="space-y-3 text-[12px] text-slate-300">
                  <div className="flex justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-400">Tamaño de archivo:</span>
                    <span className="font-mono font-bold text-white">88.4 MB</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-400">Tipo de instalación:</span>
                    <span className="text-slate-200">1-Click Autónomo (.exe)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-900">
                    <span className="text-slate-400">Base de datos local:</span>
                    <span className="text-emerald-400 font-semibold">IndexedDB Ultrarrápida</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-400">Licencia:</span>
                    <span className="text-blue-400 font-semibold">Acceso Completo POS</span>
                  </div>
                </div>

                <button
                  onClick={onOpenDownloadModal}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-[13px] font-bold rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={15} />
                  <span>Obtener Archivo Instalador</span>
                </button>

              </div>
            </div>

          </div>

        </div>

      </div>

    </section>
  )
}
