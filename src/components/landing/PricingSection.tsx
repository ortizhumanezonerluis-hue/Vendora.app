import { useState } from 'react'
import { Check, X, Lock, Sparkles, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react'

export default function PricingSection({ onOpenDemoModal }: { onOpenDemoModal: () => void }) {
  const [billingMode, setBillingMode] = useState<'financed' | 'upfront'>('financed')

  return (
    <section id="precios" className="py-20 lg:py-28 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Inversión Clara y Transparente
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Planes hechos a la medida de tu negocio
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Sin mensualidades eternas obligatorias. Financiamos directamente tu software con cuotas iniciales cómodas y pagos mensuales sin intermediarios bancarios.
          </p>

          {/* Billing Switch */}
          <div className="mt-8 inline-flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-xs">
            <button
              onClick={() => setBillingMode('financed')}
              className={[
                'px-4 py-2 rounded-lg text-[13px] font-bold transition-all',
                billingMode === 'financed'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              ].join(' ')}
            >
              Financiación 10 Meses (Sin Bancos)
            </button>
            <button
              onClick={() => setBillingMode('upfront')}
              className={[
                'px-4 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center gap-1.5',
                billingMode === 'upfront'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              ].join(' ')}
            >
              <span>Pago de Contado (Licencia Vitalicia)</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] rounded font-bold">Ahorro</span>
            </button>
          </div>
        </div>

        {/* 3 Pricing Cards Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch max-w-7xl mx-auto">
          
          {/* Card 1: STARTER */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-all">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Negocios Pequeños</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Plan Starter</h3>
              <p className="text-[13px] text-slate-500 mt-2 min-h-[38px]">
                Para quioscos y locales pequeños administrados por una sola persona.
              </p>

              {/* Price display */}
              <div className="mt-5 pb-5 border-b border-slate-100">
                {billingMode === 'financed' ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">$ 80.000</span>
                      <span className="text-[13px] font-semibold text-slate-500">/ mes (10 cuotas)</span>
                    </div>
                    <p className="text-[11px] text-blue-600 font-semibold mt-1">Cuota Inicial: $ 400.000 COP</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">$ 1'200.000</span>
                      <span className="text-[13px] font-semibold text-slate-500">COP único</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">Licencia vitalicia sin mensualidades</p>
                  </div>
                )}
              </div>

              {/* Features List */}
              <ul className="mt-6 space-y-3 text-[13px] text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Punto de Venta (POS) rápido</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Control de Inventario (hasta 300 productos)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Arqueo de Caja diario</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-400">
                  <X size={16} className="text-slate-300 shrink-0 mt-0.5" />
                  <span>Máximo 6 proveedores</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-400">
                  <X size={16} className="text-slate-300 shrink-0 mt-0.5" />
                  <span>Sin múltiples roles de empleados</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-400">
                  <X size={16} className="text-slate-300 shrink-0 mt-0.5" />
                  <span>Sin módulo contable 3.500 UVT</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenDemoModal}
              className="mt-8 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-[13px] rounded-xl transition-colors"
            >
              Seleccionar Starter
            </button>
          </div>

          {/* Card 2: PRO (Recommended) */}
          <div className="bg-white border-2 border-blue-600 rounded-2xl p-7 flex flex-col justify-between shadow-xl shadow-blue-500/10 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-blue-600 text-white rounded-full text-[11px] font-bold uppercase tracking-wider shadow-sm">
              El Más Recomendado
            </div>

            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Comercios en Crecimiento</span>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">Plan Pro</h3>
              <p className="text-[13px] text-slate-500 mt-2 min-h-[38px]">
                Control operativo total para tiendas de ropa, graneros medianos, minimarkets y droguerías.
              </p>

              {/* Price display */}
              <div className="mt-5 pb-5 border-b border-slate-100">
                {billingMode === 'financed' ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">$ 160.000</span>
                      <span className="text-[13px] font-semibold text-slate-500">/ mes (10 cuotas)</span>
                    </div>
                    <p className="text-[11px] text-blue-600 font-semibold mt-1">Cuota Inicial: $ 600.000 COP</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-slate-900">$ 2'200.000</span>
                      <span className="text-[13px] font-semibold text-slate-500">COP único</span>
                    </div>
                    <p className="text-[11px] text-emerald-600 font-semibold mt-1">Licencia vitalicia sin mensualidades</p>
                  </div>
                )}
              </div>

              {/* Features List */}
              <ul className="mt-6 space-y-3 text-[13px] text-slate-700">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span className="font-semibold">POS Avanzado e Inventario Ilimitado</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Escáner móvil desde celular (Android/iOS)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Arqueos de caja ciegos y por turnos</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Reabastecimiento y órdenes WhatsApp a proveedores</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Logs de auditoría contra cancelaciones y hurtos</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                  <span>Usuarios y roles de empleados ilimitados</span>
                </li>
                <li className="flex items-start gap-2.5 text-slate-400 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <Lock size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <span className="text-[12px]">Módulo Contable 3.500 UVT bloqueado 🔒</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenDemoModal}
              className="mt-8 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl shadow-md shadow-blue-500/25 transition-all"
            >
              Seleccionar Plan Pro
            </button>
          </div>

          {/* Card 3: MAX (Everything Included) */}
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 text-white border border-slate-800 rounded-2xl p-7 flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl" />

            <div>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Tranquilidad Absoluta</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded border border-emerald-500/30">
                  Full ERP + Fiscal
                </span>
              </div>

              <h3 className="text-2xl font-bold text-white mt-1">Plan Max</h3>
              <p className="text-[13px] text-slate-400 mt-2 min-h-[38px]">
                Control total del negocio + el guardián contable y tributario ante la DIAN.
              </p>

              {/* Price display */}
              <div className="mt-5 pb-5 border-b border-slate-800">
                {billingMode === 'financed' ? (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">$ 240.000</span>
                      <span className="text-[13px] font-semibold text-slate-400">/ mes (10 cuotas)</span>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">Cuota Inicial: $ 800.000 COP</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">$ 3'200.000</span>
                      <span className="text-[13px] font-semibold text-slate-400">COP único</span>
                    </div>
                    <p className="text-[11px] text-emerald-400 font-semibold mt-1">Licencia vitalicia sin mensualidades</p>
                  </div>
                )}
              </div>

              {/* Features List */}
              <ul className="mt-6 space-y-3 text-[13px] text-slate-200">
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-semibold text-emerald-300">TODO lo incluido en el Plan Pro</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span className="font-bold text-white">Guardián del Tope 3.500 UVT en tiempo real</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Libro Fiscal diario automatizado (Art. 616-8 E.T.)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Carpeta de Costos Soportados (PDF y XML de proveedores)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Conciliación de Extractos (Nequi, Daviplata, Bancos)</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Registro de Pagos Menores y Caja Menor</span>
                </li>
                <li className="flex items-start gap-2.5 text-emerald-300 font-semibold bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                  <Sparkles size={15} className="text-emerald-400 shrink-0 mt-0.5" />
                  <span>Instalación y capacitación presencial en tu local (Córdoba)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={onOpenDemoModal}
              className="mt-8 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[13px] rounded-xl shadow-lg shadow-emerald-500/25 transition-all"
            >
              Seleccionar Plan Max Completo
            </button>
          </div>

        </div>

        {/* Local Trust Footer Banner */}
        <div className="mt-12 p-5 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-4 max-w-4xl mx-auto shadow-xs">
          <div className="flex items-center gap-3">
            <ShieldCheck size={28} className="text-blue-600 shrink-0" />
            <div>
              <p className="text-[13px] font-bold text-slate-900">Trato directo entre comerciantes locales</p>
              <p className="text-[11px] text-slate-500">Sin reportes a centrales de riesgo, sin intereses ocultos y con soporte cara a cara.</p>
            </div>
          </div>
          <button
            onClick={onOpenDemoModal}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[12px] font-bold transition-colors shrink-0"
          >
            Consultar Cupo de Financiación
          </button>
        </div>

      </div>
    </section>
  )
}
