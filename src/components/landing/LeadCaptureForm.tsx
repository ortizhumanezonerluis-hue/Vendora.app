import { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { toast } from '../ui/Toaster'
import {
  Calendar, CheckCircle2, Store, User, Phone,
  MessageCircle, Sparkles
} from 'lucide-react'

export default function LeadCaptureForm() {
  const [comercio, setComercio] = useState('')
  const [propietario, setPropietario] = useState('')
  const [municipio, setMunicipio] = useState('Cereté')
  const [telefono, setTelefono] = useState('')
  const [tipoNegocio, setTipoNegocio] = useState('Abarrotes / Granero')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comercio || !propietario || !telefono) {
      toast('Por favor completa todos los campos requeridos', { type: 'error' })
      return
    }

    setLoading(true)
    try {
      try {
        await supabase
          .from('leads')
          .insert([{
            nombre_comercio: comercio,
            nombre_propietario: propietario,
            municipio: municipio,
            telefono: telefono,
            tipo_negocio: tipoNegocio,
            creado_en: new Date().toISOString()
          }])
      } catch (err) {
        console.warn('Leads table fallback:', err)
      }

      setSubmitted(true)
      toast('¡Solicitud enviada! Abriendo WhatsApp para coordinar...', { type: 'success' })

      const text = `¡Hola! Me gustaría agendar una demostración gratuita de Vendora para mi negocio.\n\n` +
        `🏬 *Comercio:* ${comercio}\n` +
        `👤 *Propietario:* ${propietario}\n` +
        `📍 *Municipio:* ${municipio}\n` +
        `📱 *WhatsApp:* ${telefono}\n` +
        `🏷️ *Tipo de Negocio:* ${tipoNegocio}\n\n` +
        `¿Qué disponibilidad tienen para la demo?`

      const waUrl = `https://wa.me/573009797523?text=${encodeURIComponent(text)}`
      setTimeout(() => {
        window.open(waUrl, '_blank')
      }, 800)

    } catch (err: any) {
      toast('Ocurrió un error al enviar. Puedes escribirnos directo a WhatsApp.', { type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="demo" className="py-20 lg:py-28 bg-white border-b border-slate-200 relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Clean Light Container */}
        <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8 sm:p-12 lg:p-14 shadow-sm relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
            
            {/* Left: Value Proposition */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200">
                <Calendar size={13} />
                <span>Demostración Gratuita de 20 Minutos</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                No dejes tu negocio a la suerte de una libreta.
              </h2>

              <p className="text-slate-600 text-[14px] leading-relaxed">
                Agenda una demostración guiada en tu local comercial o una sesión virtual interactiva para todo Colombia sin ningún costo.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 text-[13px] text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span>Probamos el software con tus propios productos y precios.</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span>Revisamos tu estado actual frente al tope de las 3.500 UVT.</span>
                </div>
                <div className="flex items-center gap-3 text-[13px] text-slate-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={13} />
                  </div>
                  <span>Sin ningún compromiso de compra.</span>
                </div>
              </div>
            </div>

            {/* Right: Lead Form in White Card */}
            <div className="lg:col-span-6 bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
              
              {!submitted ? (
                <form onSubmit={handleSubmit} className="space-y-4 text-[13px]">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Agendar Demostración</h3>
                    <p className="text-[11px] text-slate-500">Completa tus datos y te contactamos en menos de 1 hora.</p>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 block mb-1">Nombre del Comercio / Local *</label>
                    <div className="relative">
                      <Store size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        required
                        value={comercio}
                        onChange={e => setComercio(e.target.value)}
                        placeholder="Ej: Granero La 14 / Tienda Central"
                        className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Tu Nombre *</label>
                      <div className="relative">
                        <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          required
                          value={propietario}
                          onChange={e => setPropietario(e.target.value)}
                          placeholder="Nombre y Apellido"
                          className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Número de WhatsApp *</label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="tel"
                          required
                          value={telefono}
                          onChange={e => setTelefono(e.target.value)}
                          placeholder="Ej: 300 123 4567"
                          className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Municipio / Ciudad *</label>
                      <select
                        value={municipio}
                        onChange={e => setMunicipio(e.target.value)}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      >
                        <option value="Cereté">Cereté (Córdoba)</option>
                        <option value="Montería">Montería (Córdoba)</option>
                        <option value="Ciénaga de Oro">Ciénaga de Oro</option>
                        <option value="Sahagún">Sahagún</option>
                        <option value="Lorica">Lorica</option>
                        <option value="Planeta Rica">Planeta Rica</option>
                        <option value="Otra Ciudad de Colombia">Otra Ciudad (Virtual)</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-700 block mb-1">Tipo de Comercio</label>
                      <select
                        value={tipoNegocio}
                        onChange={e => setTipoNegocio(e.target.value)}
                        className="w-full h-9 px-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white"
                      >
                        <option value="Abarrotes / Granero">Abarrotes / Granero</option>
                        <option value="Ropa / Calzado">Ropa / Calzado / Boutique</option>
                        <option value="Droguería / Farmacia">Droguería / Farmacia</option>
                        <option value="Ferretería / Repuestos">Ferretería / Repuestos</option>
                        <option value="Minimarket / Supermercado">Minimarket</option>
                        <option value="Otro Comercio">Otro tipo de negocio</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    <MessageCircle size={16} />
                    <span>{loading ? 'Agendando...' : 'Agendar Demostración por WhatsApp'}</span>
                  </button>

                  <p className="text-[10px] text-slate-400 text-center">
                    Tus datos son 100% privados. No compartimos tu información con terceros.
                  </p>
                </form>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">¡Demostración Solicitada!</h3>
                  <p className="text-[13px] text-slate-600 max-w-sm mx-auto">
                    Hemos recibido los datos de <strong>{comercio}</strong>. Nos comunicaremos a tu WhatsApp <strong>{telefono}</strong> de inmediato.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold rounded-lg"
                  >
                    Enviar otra solicitud
                  </button>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
