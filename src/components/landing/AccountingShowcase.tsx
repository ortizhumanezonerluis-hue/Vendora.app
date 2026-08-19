import { useState } from 'react'
import {
  BookOpen, FileText, FolderCheck, Landmark, Coins,
  Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Download,
  Printer, TrendingUp, AlertTriangle
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
    <section id="contabilidad" className="py-20 lg:py-28 bg-slate-900 text-white relative overflow-hidden">
      
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold uppercase tracking-wider mb-4">
            <Sparkles size={13} />
            <span>La Joya de la Corona · Exclusivo en Plan Max</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
            La contabilidad simplificada que tu contador va a amar
          </h2>
          <p className="text-slate-400 text-base sm:text-lg mt-4">
            Cumple con todas las exigencias legales del <strong>Régimen No Responsable de IVA</strong> sin contratar sistemas contables costosos ni enredarte con software complejo.
          </p>
        </div>

        {/* Live Interactive UVT Bar Simulator */}
        <div className="max-w-4xl mx-auto bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 mb-12 shadow-xl backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                Semáforo Tributario DIAN · Art. 437 E.T.
              </span>
              <h3 className="text-lg font-bold text-white mt-1.5">
                Simulador del Guardián 3.500 UVT
              </h3>
              <p className="text-[12px] text-slate-400">
                Mueve la barra para ver cómo Vendora te avisa automáticamente antes de llegar al límite.
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Ventas Anuales Acumuladas</span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                ${simulatedSales.toLocaleString('es-CO')}
              </span>
              <span className="text-[11px] text-slate-500 block">de $174.296.500 máx.</span>
            </div>
          </div>

          {/* Slider & Progress */}
          <div className="mt-5 space-y-3">
            <div className="flex justify-between text-[11px] font-bold">
              <span className="text-slate-300">{percentUsed.toFixed(1)}% del límite anual consumido</span>
              <span className={percentUsed > 85 ? "text-amber-400 font-bold" : "text-emerald-400 font-bold"}>
                {percentUsed > 85 ? "⚠️ Alerta: Cerca del límite" : "🟢 Zona Segura (No responsable de IVA)"}
              </span>
            </div>

            <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
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
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 mt-2"
            />
          </div>
        </div>

        {/* Tab Navigation (Shadcn Style) */}
        <div className="flex items-center justify-start sm:justify-center gap-1.5 overflow-x-auto pb-4 max-w-4xl mx-auto">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={[
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all shrink-0',
                activeTab === key
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700'
              ].join(' ')}
            >
              <Icon size={16} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content Display Container */}
        <div className="max-w-4xl mx-auto bg-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 mt-4 shadow-2xl">
          
          {/* Tab 1: Libro Fiscal */}
          {activeTab === 'libro' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 border-b border-slate-800">
                <div>
                  <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <BookOpen size={20} className="text-emerald-400" />
                    Libro Fiscal de Registro de Operaciones Diarias
                  </h4>
                  <p className="text-[13px] text-slate-400 mt-0.5">
                    Conforme al Art. 616-8 del Estatuto Tributario colombiano.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-slate-800 text-emerald-400 text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1">
                    <Download size={12} />
                    Exportar Excel
                  </span>
                  <span className="px-3 py-1 bg-slate-800 text-slate-300 text-[11px] font-bold rounded-lg border border-slate-700 flex items-center gap-1">
                    <Printer size={12} />
                    PDF Legal
                  </span>
                </div>
              </div>

              {/* Sample Rows Preview */}
              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-[12px] text-slate-300">
                  <thead className="bg-slate-900 text-[11px] uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="p-3">Fecha</th>
                      <th className="p-3">Concepto / Operación</th>
                      <th className="p-3 text-right">Ingreso ($)</th>
                      <th className="p-3 text-right">Egreso ($)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-mono">
                    <tr className="bg-slate-950/60">
                      <td className="p-3 text-slate-400">18 Ago 2026</td>
                      <td className="p-3 font-sans text-white">Venta Ticket #593F9058 · 2x Leche, 1x Arroz Diana</td>
                      <td className="p-3 text-right font-bold text-emerald-400">$ 15.000</td>
                      <td className="p-3 text-right text-slate-500">—</td>
                    </tr>
                    <tr className="bg-slate-950/60">
                      <td className="p-3 text-slate-400">18 Ago 2026</td>
                      <td className="p-3 font-sans text-white">Venta Ticket #593F9059 · 1x Aceite Premier 900ml</td>
                      <td className="p-3 text-right font-bold text-emerald-400">$ 9.800</td>
                      <td className="p-3 text-right text-slate-500">—</td>
                    </tr>
                    <tr className="bg-slate-950/60">
                      <td className="p-3 text-slate-400">17 Ago 2026</td>
                      <td className="p-3 font-sans text-white">Compra de Mercancía - Lácteos del Sinú (OC-8821)</td>
                      <td className="p-3 text-right text-slate-500">—</td>
                      <td className="p-3 text-right font-bold text-rose-400">$ 120.000</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[12px] text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-400" />
                  Alimentado automáticamente desde las ventas del POS y órdenes recibidas.
                </span>
                <span className="font-bold text-emerald-400">100% Automático</span>
              </div>
            </div>
          )}

          {/* Tab 2: RUT Digital */}
          {activeTab === 'rut' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-slate-800">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileText size={20} className="text-emerald-400" />
                  Expediente Digital del RUT (Responsabilidad 52)
                </h4>
                <p className="text-[13px] text-slate-400 mt-0.5">
                  Ficha técnica oficial para certificar tu condición de No Responsable de IVA ante proveedores y clientes.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Razón Social Registrada</span>
                  <p className="text-[14px] font-bold text-white mt-1">Variedades y Abarrotes del Norte</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-0.5">NIT: 900.884.210 - 4</p>
                </div>

                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Responsabilidad Fiscal</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[11px] font-bold rounded border border-emerald-500/30">
                      52 - No Responsable de IVA
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Actividad CIIU: 4711 Comercio al por menor</p>
                </div>
              </div>

              <div className="p-4 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2 text-slate-300">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <span>Copia oficial del PDF disponible para descarga con un solo clic.</span>
                </div>
                <span className="px-3 py-1 bg-slate-800 text-white rounded-lg font-bold border border-slate-700 text-[11px]">
                  Descargar PDF RUT
                </span>
              </div>
            </div>
          )}

          {/* Tab 3: Costos Soportados */}
          {activeTab === 'costos' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-slate-800">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  <FolderCheck size={20} className="text-emerald-400" />
                  Carpeta de Costos Soportados (PDF & XML)
                </h4>
                <p className="text-[13px] text-slate-400 mt-0.5">
                  Organiza y descarga las facturas electrónicas de tus proveedores para justificar el costo de tu mercancía.
                </p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <p className="text-[13px] font-bold text-white">Distribuidora Lácteos del Sinú S.A.S.</p>
                  <p className="text-[11px] text-slate-400">Factura FE-9921 · Total: $ 380.000 COP</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-red-500/20 text-red-300 rounded text-[11px] font-bold border border-red-500/30">
                    PDF Adjunto
                  </span>
                  <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 rounded text-[11px] font-bold border border-blue-500/30">
                    XML UBL 2.1
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 text-[12px] text-slate-300 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>Drag & Drop real: Arrastra tus archivos de factura y el sistema los almacena al instante.</span>
              </div>
            </div>
          )}

          {/* Tab 4: Extractos Bancarios */}
          {activeTab === 'extractos' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-slate-800">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  <Landmark size={20} className="text-emerald-400" />
                  Extractos Bancarios Conciliados
                </h4>
                <p className="text-[13px] text-slate-400 mt-0.5">
                  Cruce automático entre lo que entra a tu Nequi/Bancolombia y lo que cobraste en el POS.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Total en Bancos</span>
                  <p className="text-lg font-bold font-mono text-white mt-1">$ 1.850.000</p>
                </div>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Cobrado en POS</span>
                  <p className="text-lg font-bold font-mono text-white mt-1">$ 1.850.000</p>
                </div>
                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">Cuadre Exacto</span>
                  <p className="text-lg font-bold font-mono text-emerald-400 mt-1">100% Cuadrado</p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Pagos Menores */}
          {activeTab === 'pagos' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="pb-4 border-b border-slate-800">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                  <Coins size={20} className="text-emerald-400" />
                  Soportes de Pagos Menores (Caja Menor)
                </h4>
                <p className="text-[13px] text-slate-400 mt-0.5">
                  Lleva el control de acarreos, transportes, reparaciones y gastos que no tienen factura electrónica.
                </p>
              </div>

              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 flex justify-between items-center text-[12px]">
                <div>
                  <p className="font-bold text-white">Acarreo de bultos central de abastos</p>
                  <p className="text-slate-400 text-[11px]">Beneficiario: Jorge MotoCarga · Cédula: 1.067.882.110</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-white text-[14px]">$ 25.000 COP</span>
                  <span className="block text-[10px] text-emerald-400 font-medium">Recibo Adjunto</span>
                </div>
              </div>
            </div>
          )}

          {/* Bottom CTA Inside Showcase */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left">
              <p className="text-[14px] font-bold text-white">¿Quieres ver este módulo en tu propio negocio?</p>
              <p className="text-[12px] text-slate-400">Te visitamos personalmente en tu local comercial para hacer la demostración.</p>
            </div>
            <button
              onClick={onOpenDemoModal}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-[13px] rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 shrink-0"
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
