import { ShieldAlert, AlertTriangle, WifiOff, Phone, MessageCircle, RefreshCw, LogOut } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { useLicense } from '../../hooks/useLicense'

interface LicenseModalProps {
  isOpen: boolean
  onClose?: () => void
}

export default function LicenseModal({ isOpen, onClose }: LicenseModalProps) {
  const { signOut, profile } = useAuth()
  const { lockReason, cliente, fechaCorte } = useLicense()

  if (!isOpen) return null

  const comercioName = cliente?.nombre_comercio || profile?.nombre || 'Mi Negocio'
  const duenoName = cliente?.nombre_dueno || profile?.nombre || 'Comerciante'

  // Dynamic content based on lock reason
  let badgeText = 'Licencia Inactiva / En Revisión'
  let badgeColor = 'bg-amber-100 text-amber-800'
  let title = 'Acceso Pendiente de Activación'
  let description =
    'Tu negocio aún no tiene una licencia activa asignada o se encuentra en proceso de validación. Para habilitar las operaciones de tu punto de venta, contáctanos directamente.'
  let statusLabel = 'Pendiente de Aprobación'
  let statusColor = 'text-amber-600'
  let IconComponent = ShieldAlert
  let iconBg = 'bg-amber-50 border-amber-200 text-amber-600'

  if (lockReason === 'suspended' || lockReason === 'inactive_user') {
    badgeText = 'Cuenta Suspendida'
    badgeColor = 'bg-rose-100 text-rose-800'
    title = 'Acceso Temporalmente Suspendido'
    description =
      'El acceso a la aplicación ha sido suspendido por el administrador del sistema. Si consideras que se trata de un error o deseas reactivar tu servicio, comunícate con soporte.'
    statusLabel = 'Suspendido / Bloqueado'
    statusColor = 'text-rose-600'
    IconComponent = ShieldAlert
    iconBg = 'bg-rose-50 border-rose-200 text-rose-600'
  } else if (lockReason === 'mora') {
    badgeText = 'Pago Pendiente / Mora'
    badgeColor = 'bg-rose-100 text-rose-800'
    title = 'Suscripción Vencida'
    description =
      'Se ha registrado una cuota mensual pendiente en tu suscripción. Registra tu pago o envía el comprobante para desbloquear las operaciones de inmediato.'
    statusLabel = 'Cuota Pendiente'
    statusColor = 'text-rose-600'
    IconComponent = AlertTriangle
    iconBg = 'bg-rose-50 border-rose-200 text-rose-600'
  } else if (lockReason === 'expired_lease') {
    badgeText = 'Validación Requerida'
    badgeColor = 'bg-blue-100 text-blue-800'
    title = 'Verificación de Licencia Requerida'
    description =
      'Has superado el periodo máximo de uso sin conexión a internet. Conecta tu computador a la red por unos segundos para validar tu suscripción y continuar operando con normalidad.'
    statusLabel = 'Conexión Necesaria'
    statusColor = 'text-blue-600'
    IconComponent = WifiOff
    iconBg = 'bg-blue-50 border-blue-200 text-blue-600'
  }

  const whatsappMsg = encodeURIComponent(
    `Hola Oner, soy ${duenoName} del negocio "${comercioName}". Mi app muestra el estado "${statusLabel}". ¿Me ayudas a habilitarla/reactivarla?`
  )
  const waUrl = `https://wa.me/573009797523?text=${whatsappMsg}`

  return (
    <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 sm:p-7 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mx-auto shadow-sm ${iconBg}`}>
          <IconComponent size={30} />
        </div>

        <div>
          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${badgeColor}`}>
            {badgeText}
          </span>
          <h3 className="text-xl font-extrabold text-slate-900 mt-2 tracking-tight">
            {title}
          </h3>
          <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-[12px] text-slate-700 space-y-1.5 text-left">
          <div className="flex justify-between">
            <span className="text-slate-400">Comercio:</span>
            <span className="font-semibold text-slate-900">{comercioName}</span>
          </div>
          {cliente?.nombre_dueno && (
            <div className="flex justify-between">
              <span className="text-slate-400">Titular:</span>
              <span className="text-slate-700">{cliente.nombre_dueno}</span>
            </div>
          )}
          {fechaCorte && (
            <div className="flex justify-between">
              <span className="text-slate-400">Fecha de Corte:</span>
              <span className="font-mono text-slate-700">{fechaCorte}</span>
            </div>
          )}
          <div className="flex justify-between pt-1 border-t border-slate-200">
            <span className="text-slate-400">Estado del Sistema:</span>
            <span className={`font-bold ${statusColor}`}>{statusLabel}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[13px] rounded-xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle size={16} />
            <span>Contactar a Soporte por WhatsApp</span>
          </a>

          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[12px] rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Reintentar Verificación de Licencia</span>
          </button>

          <button
            onClick={() => signOut()}
            className="w-full py-1.5 text-slate-400 hover:text-rose-600 text-[11px] font-medium transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <LogOut size={12} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </div>
  )
}

