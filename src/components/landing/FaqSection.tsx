import { useState } from 'react'
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react'

const FAQS = [
  {
    q: '¿Tengo que pagar mensualidades obligatorias para usar Vendora?',
    a: 'No. En Vendora compras la licencia de tu software. Si eliges el pago de contado es tuya para siempre, y si eliges el plan financiado pagas tu cuota mensual durante 10 meses y al terminar el software queda 100% pagado sin cobros sorpresa mensuales.'
  },
  {
    q: '¿Cómo me protege Vendora con el tope de las 3.500 UVT?',
    a: 'En Colombia, si un comerciante factura más de 3.500 UVT en el año (~$174.296.500 COP), la DIAN lo obliga a pasar al Régimen Común (cobrar IVA 19% y facturación electrónica obligatoria). Vendora suma automáticamente tus ventas en tiempo real y te muestra una barra que te avisa con anticipación para que tomes decisiones antes de superar el límite.'
  },
  {
    q: '¿Vienen a mi local comercial a instalar el programa y enseñarme?',
    a: 'Sí. En el departamento de Córdoba (Cereté, Montería, Ciénaga de Oro, Sahagún, Lorica, Planeta Rica) contamos con servicio de instalación y capacitación presencial directa en tu negocio. Para el resto del país brindamos acompañamiento remoto paso a paso.'
  },
  {
    q: '¿Necesito comprar pistolas o lectores de código de barras caros?',
    a: 'No es obligatorio. Vendora incluye un módulo de Escáner Móvil que te permite conectar la cámara de tu celular Android o iPhone para escanear productos y vender a la velocidad de un supermercado.'
  },
  {
    q: '¿Cómo funciona la financiación en 10 cuotas sin bancos?',
    a: 'Es un trato directo entre comerciantes. Das una cuota inicial accesible ($400.000, $700.000 o $800.000 según el plan) y el saldo restante lo pagas en 10 mensualidades fijas. Sin Datacrédito, sin bancos y sin trámites engorrosos.'
  },
  {
    q: '¿Qué pasa si se va el internet en mi local?',
    a: 'Vendora almacena la sesión de trabajo y tus datos de manera segura para que no pierdas información y puedas continuar atendiendo a tus clientes con rapidez.'
  }
]

export default function FaqSection({ onOpenDemoModal }: { onOpenDemoModal: () => void }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (i: number) => {
    setOpenIndex(openIndex === i ? null : i)
  }

  return (
    <section id="preguntas" className="py-20 lg:py-28 bg-white border-b border-slate-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-14">
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200/60">
            Resolvemos tus dudas
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3">
            Preguntas Frecuentes de Comerciantes
          </h2>
          <p className="text-slate-600 text-base sm:text-lg mt-3">
            Todo lo que necesitas saber antes de modernizar la administración de tu negocio.
          </p>
        </div>

        {/* Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div
                key={idx}
                className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 transition-all"
              >
                <button
                  onClick={() => toggle(idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-blue-600 text-[15px] transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    className={`text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-[13px] text-slate-600 leading-relaxed border-t border-slate-100 bg-white animate-in fade-in duration-150">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Extra Support Box */}
        <div className="mt-12 text-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="text-[14px] font-bold text-slate-800">¿Tienes una pregunta específica sobre tu negocio?</p>
          <p className="text-[12px] text-slate-500 mt-1">Escríbenos por WhatsApp y te asesoramos personalmente.</p>
          <a
            href="https://wa.me/573009797523?text=Hola,%20tengo%20una%20pregunta%20sobre%20Vendora"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[13px] font-bold shadow-xs transition-colors"
          >
            <MessageCircle size={16} />
            <span>Hablar con un asesor por WhatsApp</span>
          </a>
        </div>

      </div>
    </section>
  )
}
