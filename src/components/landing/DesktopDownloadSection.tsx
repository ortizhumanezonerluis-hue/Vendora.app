import { Download, WifiOff, HardDrive, ShieldCheck, Zap, ArrowRight, Laptop, CheckCircle2, Sparkles } from 'lucide-react'
import { triggerDirectDownload } from '../../lib/downloadHelper'

export default function DesktopDownloadSection() {
  return (
    <section id="descargar" className="py-20 lg:py-28 bg-white border-b border-slate-200 text-slate-900 relative overflow-hidden">
      
      {/* Soft ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-6xl h-96 bg-blue-50/60 blur-3xl pointer-events-none rounded-full -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/40 border border-slate-200/90 rounded-3xl p-8 sm:p-12 lg:p-16 shadow-xl shadow-slate-200/50">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            
            {/* Left Column: Info & CTA */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/70 border border-blue-200 text-blue-800 text-[12px] font-bold">
                <Laptop size={14} className="text-blue-600 shrink-0" />
                <span>Aplicación Nativa para Windows</span>
              </div>

              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
                Instala Vendora en tu PC.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Vende con o sin Internet.
                </span>
              </h2>

              <p className="text-slate-600 text-base sm:text-lg max-w-2xl font-normal leading-relaxed">
                Sin configuraciones complicadas ni comandos en terminal. Descarga el instalador directo <strong>.exe</strong>, haz doble clic y empieza a facturar en tu negocio en menos de 1 minuto.
              </p>

              {/* Feature bullets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 text-left">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <WifiOff size={16} />
                  </div>
                  <div>
                    <strong className="block text-[13px] font-semibold text-slate-900">Punto de Venta 100% Offline</strong>
                    <span className="text-[11px] text-slate-500">Cobra y gestiona caja sin depender de red</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <HardDrive size={16} />
                  </div>
                  <div>
                    <strong className="block text-[13px] font-semibold text-slate-900">Instalador Directo (.exe)</strong>
                    <span className="text-[11px] text-slate-500">Todo incluido sin tocar terminal</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                    <Zap size={16} />
                  </div>
                  <div>
                    <strong className="block text-[13px] font-semibold text-slate-900">Lector de Códigos & Ticket</strong>
                    <span className="text-[11px] text-slate-500">Conecta pistolas USB e impresoras</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/80 shadow-xs">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <strong className="block text-[13px] font-semibold text-slate-900">Sincronización Automática</strong>
                    <span className="text-[11px] text-slate-500">Respaldo al volver la conexión</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <button
                  onClick={triggerDirectDownload}
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:translate-y-[-2px] flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <Download size={18} />
                  <span>Descargar Gratis para Windows (.exe)</span>
                </button>

                <a
                  href="#/pos"
                  className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 font-bold text-[14px] rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs"
                >
                  <span>Probar versión Web</span>
                  <ArrowRight size={15} />
                </a>
              </div>

              <p className="text-[12px] text-slate-500 flex items-center justify-center lg:justify-start gap-2">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span>Compatible con Windows 10 y Windows 11 (64 bits) · Descarga segura</span>
              </p>

            </div>

            {/* Right Column: Visual Clean Box */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-5">
                
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black shadow-sm">
                      <Laptop size={20} />
                    </div>
                    <div>
                      <h4 className="text-[15px] font-bold text-slate-900">Vendora Desktop</h4>
                      <p className="text-[12px] text-slate-500">Versión Oficial para PC</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full uppercase">
                    Windows
                  </span>
                </div>

                <div className="space-y-3 text-[12px] text-slate-700">
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Formato:</span>
                    <span className="font-semibold text-slate-900">Instalador Autónomo (.exe)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Compatibilidad:</span>
                    <span className="font-medium text-slate-800">Windows 10 / 11 (x64)</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500">Modo Offline:</span>
                    <span className="text-emerald-600 font-bold">100% Autónomo</span>
                  </div>
                  <div className="flex justify-between py-1.5">
                    <span className="text-slate-500">Sincronización:</span>
                    <span className="text-blue-600 font-semibold">Nube Automática</span>
                  </div>
                </div>

                <button
                  onClick={triggerDirectDownload}
                  className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={16} />
                  <span>Descargar Ahora (.exe)</span>
                </button>

              </div>
            </div>

          </div>

        </div>

      </div>

    </section>
  )
}

