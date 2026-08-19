import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Store, Menu, X, Sparkles } from 'lucide-react'

export default function Navbar({ onOpenDemoModal }: { onOpenDemoModal: () => void }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollTo = (id: string) => {
    setMobileMenuOpen(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo: Clean "Vendora" only */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
            <Store size={18} />
          </div>
          <span className="font-bold text-[18px] tracking-tight text-slate-900 leading-none">Vendora</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-slate-600">
          <button onClick={() => scrollTo('beneficios')} className="hover:text-blue-600 transition-colors">
            Beneficios
          </button>
          <button onClick={() => scrollTo('contabilidad')} className="hover:text-blue-600 transition-colors flex items-center gap-1.5">
            <Sparkles size={13} className="text-emerald-600" />
            <span>Módulo Inteligente</span>
          </button>
          <button onClick={() => scrollTo('precios')} className="hover:text-blue-600 transition-colors">
            Planes y Financiación
          </button>
          <button onClick={() => scrollTo('preguntas')} className="hover:text-blue-600 transition-colors">
            Preguntas Frecuentes
          </button>
        </nav>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            to="/login"
            className="px-3 py-1.5 text-[12px] font-semibold text-slate-700 hover:text-slate-950 hover:bg-slate-100/80 rounded-lg transition-colors"
          >
            Acceder a la App
          </Link>
          <button
            onClick={onOpenDemoModal}
            className="px-3.5 py-1.5 text-[12px] font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:translate-y-[-1px]"
          >
            Agendar Demo Gratis
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
          <button
            onClick={() => scrollTo('beneficios')}
            className="block w-full text-left py-2 text-[14px] font-medium text-slate-700 hover:text-blue-600"
          >
            Beneficios
          </button>
          <button
            onClick={() => scrollTo('contabilidad')}
            className="block w-full text-left py-2 text-[14px] font-medium text-slate-700 hover:text-blue-600"
          >
            Módulo Inteligente
          </button>
          <button
            onClick={() => scrollTo('precios')}
            className="block w-full text-left py-2 text-[14px] font-medium text-slate-700 hover:text-blue-600"
          >
            Planes y Financiación
          </button>
          <button
            onClick={() => scrollTo('preguntas')}
            className="block w-full text-left py-2 text-[14px] font-medium text-slate-700 hover:text-blue-600"
          >
            Preguntas Frecuentes
          </button>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            <Link
              to="/login"
              className="w-full text-center py-2 text-[12px] font-semibold text-slate-700 bg-slate-100 rounded-lg"
            >
              Iniciar Sesión en Vendora
            </Link>
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenDemoModal(); }}
              className="w-full py-2 text-[12px] font-semibold text-white bg-blue-600 rounded-lg shadow-sm"
            >
              Agendar Demostración
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
