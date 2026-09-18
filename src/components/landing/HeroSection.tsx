import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, ShieldCheck, Zap, Sparkles, CheckCircle2, MapPin, Download, Laptop } from 'lucide-react'
import PosPreviewMockup from './PosPreviewMockup'

export default function HeroSection({
  onOpenDemoModal,
  onOpenDownloadModal
}: {
  onOpenDemoModal: () => void
  onOpenDownloadModal: () => void
}) {
  const whatsappUrl = "https://wa.me/573009797523?text=" + encodeURIComponent("¡Hola! Me interesa conocer más sobre Vendora para mi negocio y agendar una demostración.")

  return (
    <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-white via-slate-50/50 to-slate-100/70">
      
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-blue-100/40 via-emerald-100/30 to-transparent blur-3xl -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        
        {/* Scarcity / Local Offer Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-800 text-[12px] font-semibold mb-6 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-300">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
          <MapPin size={13} className="text-blue-600 shrink-0" />
          <span>Exclusivo para Córdoba: Solo 15 Cupos Disponibles con Instalación Presencial</span>
        </div>

        {/* Powerful Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
          El control total de tu negocio,{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700">
            sin el miedo a la DIAN.
          </span>
        </h1>

        {/* Compelling Subtitle */}
        <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto font-normal leading-relaxed">
          Vendora es el ERP Micro-Contable y Punto de Venta avanzado que cuida tus ganancias, organiza tu inventario y te avisa en tiempo real antes de pasar el tope de las <strong>3.500 UVT</strong> (Régimen Simplificado).
        </p>

        {/* CTA Buttons Group */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-2xl mx-auto">
          <button
            onClick={onOpenDownloadModal}
            className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[14px] rounded-xl shadow-lg shadow-blue-600/25 transition-all hover:translate-y-[-2px] flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <Download size={18} />
            <span>Descargar para PC (Windows)</span>
          </button>

          <button
            onClick={onOpenDemoModal}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-[14px] rounded-xl shadow-xs transition-all hover:translate-y-[-1px] flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ver Demo en Vivo</span>
            <ArrowRight size={15} />
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-bold text-[14px] rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle size={17} className="text-emerald-600" />
            <span>WhatsApp</span>
          </a>
        </div>

        {/* Trust & Guarantee Micro-Pills */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-[12px] font-medium text-slate-500">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            Sin mensualidades obligatorias
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            Instalación presencial en tu local
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
            100% adaptado a la ley colombiana
          </span>
        </div>

        {/* Interactive POS Preview Mockup */}
        <div className="mt-14 lg:mt-16">
          <PosPreviewMockup />
        </div>

      </div>
    </section>
  )
}
