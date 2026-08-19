import { useState } from 'react'
import {
  BookOpen, FileText, FolderCheck, Landmark, Coins,
  Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Download,
  Printer
} from 'lucide-react'

type TabKey = 'libro' | 'rut' | 'costos' | 'extractos' | 'pagos'

export default function AccountingShowcase({ onOpenDemoModal }: { onOpenDemoModal: () => void }) {
  const [activeTab, setActiveTab] = useState<TabKey>('libro')
  const [simulatedSales, setSimulatedSales] = useState(62500000)

  const UVT_LIMIT_COP = 174296500 // 3.500 UVT * ~$49.799
  const percentUsed = Math.min(100, (simulatedSales / UVT_LIMIT_COP) * 100)

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'libro', label: 'Libro Fiscal Diario', icon: BookOpen },
    { key: 'rut', label: 'RUT Digital (Resp. 52)', icon: FileText },
    { key: 'costos', label: 'Costos Soportados', icon: FolderCheck },
    { key: 'extractos', label: 'Extractos Bancarios', icon: Landmark },
    { key: 'pagos', label: 'Pagos Menores', icon: Coins },
  ]

  return (
    <section id="contabilidad" className="py-20 lg:py-28 bg-slate-50 border-y border-slate-200 text-slate-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold uppercase tracking-wider mb-3.5">
            <Sparkles size={13} className="text-emerald-600" />
            <span>Módulo Micro-Contable · Exclusivo en Plan Max</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            La contabilidad simplificada que tu negocio necesita
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3.5 leading-relaxed">
            Cumple con todas las exigencias legales del <strong>Régimen No Responsable de IVA</strong> (Art. 437 E.T.) sin enredarte con programas contables complejos ni pagar asesorías extras.
          </p>
        </div>

        {/* Live Interactive UVT Bar Simulator */}
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 mb-10 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Semáforo Tributario DIAN · Art. 437 E.T.
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1.5">
                Simulador del Guardián 3.500 UVT
              </h3>
              <p className="text-[12px] text-slate-500">
                Mueve la barra para ver cómo Vendora te avisa automáticamente antes de llegar al límite.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <span className="text-[11px] text-slate-400 block">Ventas Anuales Acumuladas</span>
              <span className="text-2xl font-bold font-mono text-emerald-600">
                ${simulatedSales.toLocaleString('es-CO')}
              </span>
              <span className="text-[11px] text-slate-400 block">de $174.296.500 máx. anual</span>
            </div>
          </div>

          {/* Slider & Progress */}
          <div className="mt-5 space-y-2.5">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-600">{percentUsed.toFixed(1)}% del límite anual consumido</span>
              <span className={percentUsed > 85 ? "text-amber-600 font-bold" : "text-emerald-600 font-bold"}>
                {percentUsed > 85 ? "⚠️ Alerta: Cerca del límite" : "🟢 Zona Segura (No responsable de IVA)"}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-300"
                style={{ width: `${percentUsed}%` }}
              />
            </div>

            <input
              type="range"
              min="10000000"
              max="174000000"
              step="2500000"
              value={simulatedSales}
              onChange={(e) => setSimulatedSales(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 mt-2"
            />
          </div>
        </div>

        {/* Tab Navigation (Centered & Unclipped) */}
        <div className="flex items-center justify-center gap-2 flex-wrap max-w-4xl mx-auto mb-4 px-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                'flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all shadow-xs',
                activeTab === key
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              ].join(' ')}
            >
              <Icon size={15} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Display Container */}
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          
          {/* Tab 1: Libro Fiscal */}
          {activeTab === 'libro' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-100">
                <div>
                  <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <BookOpen size={18} className="text-emerald-600" />
                    Libro Fiscal de Registro de Operaciones Diarias
                  </h4>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Conforme al Art. 616-8 del Estatuto Tributario colombiano.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 flex items-center gap-1">
                    <Download size={12} />
                    Exportar Excel
                  </span>
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[11px] font-semibold rounded-lg border border-slate-200 flex items-center gap-1">
                    <Printer size={12} />
                    PDF Legal
                  </span>
                </div>
              </div>

              {/* Sample Rows Preview */}
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-[12px] text-slate-700">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Concepto / Operación</th>
                      <th className="p-3 text-right">Ingreso ($)</th>
                      <th className="p-3 text-right">Egreso ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    <tr className="hover:bg-slate-50/60">
                      <td className="p-3 text-slate-500 font-sans">18 Ago 2026</td>
                      <td className="p-3 font-sans text-slate-900 font-medium">Venta Ticket #593F9058 · 2x Leche, 1x Arroz Diana</td>
                      <td className="p-3 text-right font-bold text-emerald-600">$ 15.000</td>
                      <td className="p-3 text-right text-slate-400">—</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="p-3 text-slate-500 font-sans">18 Ago 2026</td>
                      <td className="p-3 font-sans text-slate-900 font-medium">Venta Ticket #593F9059 · 1x Aceite Premier 900ml</td>
                      <td className="p-3 text-right font-bold text-emerald-600">$ 9.800</td>
                      <td className="p-3 text-right text-slate-400">—</td>
                    </tr>
                    <tr className="hover:bg-slate-50/60">
                      <td className="p-3 text-slate-500 font-sans">17 Ago 2026</td>
                      <td className="p-3 font-sans text-slate-900 font-medium">Compra de Mercancía - Lácteos del Sinú (OC-8821)</td>
                      <td className="p-3 text-right text-slate-400">—</td>
                      <td className="p-3 text-right font-bold text-rose-600">$ 120.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[12px] text-slate-700 flex items-center justify-between">
                <span className="flex items-center gap-2 font-medium">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  Alimentado automáticamente desde las ventas del POS y compras registradas.
                </span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  100% Automático
                </span>
              </div>
            </div>
          )}

          {/* Tab 2: RUT Digital */}
          {activeTab === 'rut' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText size={18} className="text-emerald-600" />
                  Expediente Digital del RUT (Responsabilidad 52)
                </h4>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Ficha técnica oficial para certificar tu condición de No Responsable de IVA ante proveedores y bancos.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Razón Social Registrada</span>
                  <p className="text-[14px] font-bold text-slate-900 mt-1">Variedades y Abarrotes del Norte</p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">NIT: 900.884.210 - 4</p>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Responsabilidad Fiscal</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[11px] font-bold rounded border border-emerald-200">
                      52 - No Responsable de IVA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Actividad CIIU: 4711 Comercio al por menor</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                  <span>Copia oficial del PDF disponible para descarga inmediata.</span>
                </div>
                <span className="px-3 py-1 bg-white text-slate-800 rounded-lg font-bold border border-slate-200 text-[11px] shadow-xs">
                  Descargar PDF RUT
                </span>
              </div>
            </div>
          )}

          {/* Tab 3: Costos Soportados */}
          {activeTab === 'costos' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FolderCheck size={18} className="text-emerald-600" />
                  Carpeta de Costos Soportados (PDF & XML)
                </h4>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Organiza y descarga las facturas electrónicas de tus proveedores para justificar compras.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-[13px] font-bold text-slate-900">Distribuidora Lácteos del Sinú S.A.S.</p>
                  <p className="text-[11px] text-slate-500">Factura FE-9921 · Total: $ 380.000 COP</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-red-50 text-red-700 rounded text-[11px] font-bold border border-red-200">
                    PDF Adjunto
                  </span>
                  <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded text-[11px] font-bold border border-blue-200">
                    XML UBL 2.1
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-[12px] text-slate-700 flex items-center gap-2 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Drag & Drop real: Arrastra tus facturas y el sistema las archiva con descarga en 1 clic.</span>
              </div>
            </div>
          )}

          {/* Tab 4: Extractos Bancarios */}
          {activeTab === 'extractos' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Landmark size={18} className="text-emerald-600" />
                  Extractos Bancarios Conciliados
                </h4>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Cruce automático entre transferencias Nequi, Daviplata y ventas registradas en caja.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Total en Bancos</span>
                  <p className="text-lg font-bold font-mono text-slate-900 mt-1">$ 1.850.000</p>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Cobrado en POS</span>
                  <p className="text-lg font-bold font-mono text-slate-900 mt-1">$ 1.850.000</p>
                </div>
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-[10px] text-emerald-800 uppercase font-bold">Cuadre Exacto</span>
                  <p className="text-lg font-bold font-mono text-emerald-700 mt-1">100% Cuadrado</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Pagos Menores */}
          {activeTab === 'pagos' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              <div className="pb-4 border-b border-slate-100">
                <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Coins size={18} className="text-emerald-600" />
                  Soportes de Pagos Menores (Caja Menor)
                </h4>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Control ágil de acarreos, transportes y reparaciones menores sin factura electrónica.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-[12px]">
                <div>
                  <p className="font-bold text-slate-900">Acarreo de bultos central de abastos</p>
                  <p className="text-slate-500 text-[11px]">Beneficiario: Jorge MotoCarga · Cédula: 1.067.882.110</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-900 text-[14px]">$ 25.000 COP</span>
                  <span className="block text-[10px] text-emerald-700 font-semibold">Recibo Adjunto</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom CTA Inside Showcase */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[14px] font-bold text-slate-900">¿Quieres ver este módulo funcionando en tu negocio?</p>
              <p className="text-[12px] text-slate-500">Te mostramos una demostración guiada sin compromiso.</p>
            </div>
            <button
              onClick={onOpenDemoModal}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl shadow-sm transition-all flex items-center gap-2 shrink-0"
            >
              <span>Solicitar Demostración</span>
              <ArrowRight size={15} />
            </button>
          </div>

        </div>

      </div>
    </section>
  )
}
