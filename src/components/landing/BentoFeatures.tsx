import {
  Wallet, ShoppingBag, Scale, ScanLine, ShieldAlert,
  TrendingUp, Clock, FileSpreadsheet, Check, ArrowRight, MessageSquare
} from 'lucide-react'

export default function BentoFeatures({ onOpenDemoModal }: { onOpenDemoModal: () => void }) {
  return (
    <section id="beneficios" className="py-20 lg:py-28 bg-white border-y border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Diseñado para Comercios Colombianos
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Solucionamos los 3 dolores de cabeza que quitan el sueño al comerciante
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3.5">
            Deja atrás los cuadernos, las cuentas a mano y la incertidumbre tributaria. Vendora te da la tranquilidad que necesitas para crecer.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Control de Caja & Auditoría */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-7 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-5 group-hover:scale-105 transition-transform">
                <Wallet size={24} />
              </div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Caja Blindada</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Adiós al desorden y faltantes en la caja
              </h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Control estricto de turnos por empleado, arqueos de caja ciegos (el cajero no sabe el total hasta entregar el dinero) y registro de auditoría en tiempo real para que cada peso esté justificado.
              </p>

              <ul className="mt-5 space-y-2 text-[12px] text-slate-700 font-medium border-t border-slate-200/60 pt-4">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Arqueos por turno (Mañana, Tarde, Noche)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Detección automática de descuadres</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Logs de auditoría contra cancelaciones sospechosas</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-[12px] font-bold text-blue-600">
              <span>Control total de empleados</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 2: Reabastecimiento Inteligente */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-7 flex flex-col justify-between hover:shadow-lg hover:border-slate-300 transition-all group">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 mb-5 group-hover:scale-105 transition-transform">
                <ShoppingBag size={24} />
              </div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Compras & Proveedores</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                Reabastecimiento Inteligente en 1 Clic
              </h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                El sistema calcula qué productos están por agotarse según tus ventas y te genera automáticamente la Orden de Compra por proveedor lista para enviar por WhatsApp al vendedor.
              </p>

              <ul className="mt-5 space-y-2 text-[12px] text-slate-700 font-medium border-t border-slate-200/60 pt-4">
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Alertas de stock mínimo y sugerencia de compra</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Directorio de proveedores con días de visita</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Envío directo de orden por WhatsApp con formato formal</span>
                </li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-[12px] font-bold text-indigo-600">
              <span>Cero quiebres de inventario</span>
              <ArrowRight size={14} />
            </div>
          </div>

          {/* Card 3: El Guardián de las 3.500 UVT */}
          <div className="bg-gradient-to-b from-emerald-50/70 to-slate-50 border-2 border-emerald-500/30 rounded-2xl p-7 flex flex-col justify-between hover:shadow-xl hover:border-emerald-500 transition-all group relative overflow-hidden">
            <div className="absolute top-3 right-3 px-2 py-0.5 bg-emerald-600 text-white rounded-full text-[9px] font-bold uppercase tracking-wider">
              Control Fiscal
            </div>

            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 mb-5 group-hover:scale-105 transition-transform">
                <Scale size={24} />
              </div>
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Protección Tributaria</span>
              <h3 className="text-xl font-bold text-slate-900 mt-1 mb-3">
                El Guardián de las 3.500 UVT
              </h3>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Monitorea en tiempo real tus ventas anuales acumuladas frente al límite de <strong>$174.296.500 COP</strong> (Art. 437 E.T.) para que nunca pases al régimen común por descuido ni sufras multas de la DIAN.
              </p>

              <div className="mt-4 p-3 bg-white rounded-xl border border-emerald-200 shadow-xs space-y-1.5">
                <div className="flex justify-between text-[11px] font-bold text-slate-700">
                  <span>Tope Anual 3.500 UVT</span>
                  <span className="text-emerald-700">Zona Segura</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-2/5" />
                </div>
                <p className="text-[10px] text-slate-400 text-right font-mono">$ 48.200.000 / $ 174.296.500 máx.</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-emerald-200 flex items-center justify-between text-[12px] font-bold text-emerald-700">
              <span>Cumple con el Régimen Simplificado</span>
              <ArrowRight size={14} />
            </div>
          </div>

        </div>

        {/* 2 Complementary Feature Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          
          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <ScanLine size={20} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-slate-900">Escáner Móvil desde tu Celular</h4>
              <p className="text-[13px] text-slate-600 mt-1">
                Convierte cualquier smartphone Android o iPhone en un lector de código de barras inalámbrico de alta velocidad sin gastar en lectores externos.
              </p>
            </div>
          </div>

          <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h4 className="text-[15px] font-bold text-slate-900">Libro Fiscal Legal con 1 Clic</h4>
              <p className="text-[13px] text-slate-600 mt-1">
                Genera tu Libro Fiscal diario exigido por el Art. 616-8 del Estatuto Tributario y expórtalo en PDF legal o Excel para tu contador al instante.
              </p>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
