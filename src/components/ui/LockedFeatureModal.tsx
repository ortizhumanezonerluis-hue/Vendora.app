import { Lock, Sparkles, X, Check, MessageCircle, ArrowRight } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { PlanType } from '../../services/adminService'

interface LockedFeatureModalProps {
  isOpen: boolean
  onClose: () => void
  featureTitle: string
  featureDesc: string
  requiredPlan: 'pro' | 'max'
  currentPlan: PlanType
}

export default function LockedFeatureModal({
  isOpen,
  onClose,
  featureTitle,
  featureDesc,
  requiredPlan,
  currentPlan
}: LockedFeatureModalProps) {
  const { profile } = useAuth()

  if (!isOpen) return null

  const isUpgradeToMax = requiredPlan === 'max'
  const planTargetName = isUpgradeToMax ? 'Plan Max' : 'Plan Pro'

  const whatsappMsg = encodeURIComponent(
    `Hola Oner, tengo el plan ${currentPlan.toUpperCase()} en mi negocio ${profile?.nombre || ''} y me interesa subirme al ${planTargetName} para desbloquear "${featureTitle}". ¿Cómo podemos hacer el cambio?`
  )
  const waUrl = `https://wa.me/573009797523?text=${whatsappMsg}`

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Lock size={24} />
          </div>
          <div>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase">
              Tu Plan Actual: {currentPlan.toUpperCase()}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              {featureTitle}
            </h3>
          </div>
        </div>

        <p className="text-[13px] text-slate-600 leading-relaxed">
          {featureDesc}
        </p>

        {/* Benefits list */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-700 uppercase tracking-wider">
            <Sparkles size={13} />
            <span>Beneficios al subirte al {planTargetName}</span>
          </div>

          <ul className="space-y-1.5 text-[12px] text-slate-700">
            {isUpgradeToMax ? (
              <>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Guardián del Tope 3.500 UVT en tiempo real</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Libro Fiscal diario automático (Art. 616-8)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Archivo de Facturas Electrónicas PDF/XML</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Conciliación de Nequi, Daviplata y Bancos</span>
                </li>
              </>
            ) : (
              <>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Proveedores y compras ilimitadas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Reabastecimiento Inteligente de Stock Crítico</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Múltiples empleados con roles independientes</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check size={14} className="text-emerald-600 shrink-0" />
                  <span>Historial completo de auditoría y movimientos</span>
                </li>
              </>
            )}
          </ul>
        </div>

        <div className="space-y-2 pt-1">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[13px] rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <MessageCircle size={16} />
            <span>Solicitar Upgrade a {planTargetName}</span>
          </a>

          <button
            onClick={onClose}
            className="w-full py-2 text-slate-500 hover:text-slate-800 text-[12px] font-medium transition-colors"
          >
            Continuar en {currentPlan.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  )
}
