import { Link } from 'react-router-dom'
import { Store, Phone, Mail, MapPin, ShieldCheck, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 text-[13px] py-14 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-900">
          
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Store size={18} />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Vendora</span>
            </div>
            <p className="text-slate-400 text-[13px] max-w-md leading-relaxed">
              El software ERP y POS micro-contable diseñado específicamente para pequeños y medianos comerciantes en Colombia. Cuida tu inventario, asegura tu caja y te protege ante los límites de la DIAN.
            </p>
            <div className="flex items-center gap-2 text-[12px] text-emerald-400 font-medium">
              <ShieldCheck size={16} />
              <span>Optimizado para comercios No Responsables de IVA (Art. 437 E.T.)</span>
            </div>
          </div>

          {/* Col 2: Enlaces Rápidos */}
          <div className="space-y-3">
            <p className="text-[12px] font-bold text-white uppercase tracking-wider">Enlaces Rápidos</p>
            <ul className="space-y-2">
              <li>
                <a href="#beneficios" className="hover:text-white transition-colors">Control de Caja & Auditoría</a>
              </li>
              <li>
                <a href="#contabilidad" className="hover:text-white transition-colors">Guardián 3.500 UVT</a>
              </li>
              <li>
                <a href="#contabilidad" className="hover:text-white transition-colors">Libro Fiscal Diario</a>
              </li>
              <li>
                <a href="#precios" className="hover:text-white transition-colors">Planes y Financiación 10 Meses</a>
              </li>
              <li>
                <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
                  Acceso a la App (Login) →
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Contacto Local */}
          <div className="space-y-3">
            <p className="text-[12px] font-bold text-white uppercase tracking-wider">Soporte & Ventas</p>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2">
                <MapPin size={14} className="text-blue-400 shrink-0" />
                <span>Cereté & Montería, Córdoba - Colombia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={14} className="text-emerald-400 shrink-0" />
                <span>+57 300 979 7523</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={14} className="text-slate-400 shrink-0" />
                <span>contacto@vendora.com.co</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[12px] text-slate-500">
          <p>© {new Date().getFullYear()} Vendora. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            <span>Hecho con dedicación para el comercio de Córdoba y Colombia</span>
          </p>
        </div>

      </div>
    </footer>
  )
}
