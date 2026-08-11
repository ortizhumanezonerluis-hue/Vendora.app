import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../auth/AuthContext'
import { Search, Bell, LogOut, Circle, Smartphone, Copy, Check, X, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

type TopbarProps = {
  title: string
  subtitle?: string
}

interface NotificationAlert {
  id: string
  mensaje: string
  tipo: 'stock' | 'caja' | 'auditoria'
  fecha: string
}

/** Modal that shows a QR code for pairing the mobile scanner without login */
function ScannerQRModal({ negocioId, onClose }: { negocioId: string; onClose: () => void }) {
  const scannerUrl = `${window.location.origin}/scanner-app?negocio_id=${negocioId}`
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(scannerUrl)}&margin=10&color=111827&bgcolor=ffffff`
  const [copied, setCopied] = useState(false)

  const copyLink = () => {
    navigator.clipboard.writeText(scannerUrl).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gray-900 rounded-lg flex items-center justify-center">
              <Smartphone size={14} className="text-white" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-gray-900">Escáner Móvil</p>
              <p className="text-[10px] text-gray-400">Empareja tu celular sin iniciar sesión</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center px-5 py-6 gap-4">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
            <img
              src={qrApiUrl}
              alt="QR Escáner Móvil"
              width={220}
              height={220}
              className="rounded-md"
            />
          </div>

          <div className="text-center space-y-1">
            <p className="text-[12px] font-medium text-gray-700">
              Escanea con la cámara de tu celular
            </p>
            <p className="text-[11px] text-gray-400">
              No necesitas iniciar sesión · Solo abre la cámara y apunta al QR
            </p>
          </div>

          {/* Steps */}
          <ol className="w-full space-y-2 text-left">
            {[
              'Abre la cámara de tu celular',
              'Apunta al código QR de arriba',
              'Toca el enlace que aparece en pantalla',
              '¡Listo! Escanea códigos de barras',
            ].map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-[11px] text-gray-600">
                <span className="w-4 h-4 rounded-full bg-gray-900 text-white flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        {/* Footer Actions */}
        <div className="px-5 pb-5 flex gap-2">
          <button
            onClick={copyLink}
            className="flex-1 h-9 flex items-center justify-center gap-1.5 border border-gray-200 rounded-lg text-[12px] font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {copied ? (
              <><Check size={13} className="text-emerald-500" /><span className="text-emerald-600">Copiado</span></>
            ) : (
              <><Copy size={13} /><span>Copiar enlace</span></>
            )}
          </button>
          <a
            href={scannerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 h-9 flex items-center justify-center gap-1.5 bg-gray-900 rounded-lg text-[12px] font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <ExternalLink size={13} />
            Abrir aquí
          </a>
        </div>
      </div>
    </div>
  )
}

export default function Topbar({ title }: TopbarProps) {
  const { profile, signOut } = useAuth()
  const [online, setOnline] = useState(navigator.onLine)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [alerts, setAlerts] = useState<NotificationAlert[]>([])
  const [searchVal, setSearchVal] = useState('')
  const [showScannerModal, setShowScannerModal] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)
  const notificationsRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Listen to online/offline state
  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault()
        searchInputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Click outside handlers
  useEffect(() => {
    const clickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false)
      }
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', clickOutside)
    return () => document.removeEventListener('mousedown', clickOutside)
  }, [])

  // Fetch notifications based on role
  useEffect(() => {
    async function loadNotifications() {
      if (!profile) return
      try {
        let query = supabase.from('notificaciones').select('*').order('fecha', { ascending: false }).limit(5)
        if (profile.rol === 'empleado') {
          query = query.eq('tipo', 'stock')
        }
        if (profile.negocio_id) {
          query = query.eq('negocio_id', profile.negocio_id)
        }
        const { data } = await query
        if (data) setAlerts(data)
      } catch (_) {
        // Fallback static alerts
        const mockAlerts: NotificationAlert[] = [
          { id: '1', mensaje: 'Leche Deslactosada Lala 1L por debajo del mínimo', tipo: 'stock', fecha: new Date().toISOString() },
          { id: '2', mensaje: 'Arqueo de caja cerrado con discrepancia', tipo: 'caja', fecha: new Date().toISOString() }
        ]
        setAlerts(profile.rol === 'empleado' ? mockAlerts.filter(a => a.tipo === 'stock') : mockAlerts)
      }
    }
    loadNotifications()
    // Poll notifications every 30s
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [profile])

  const initials = profile?.nombre
    ? profile.nombre.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : 'US'

  return (
    <>
      {/* QR Modal rendered at root level to avoid z-index issues */}
      {showScannerModal && profile?.negocio_id && (
        <ScannerQRModal
          negocioId={profile.negocio_id}
          onClose={() => setShowScannerModal(false)}
        />
      )}

      <header className="flex items-center justify-between h-14 px-6 border-b border-gray-200 bg-white shrink-0 z-30 select-none">
        {/* Left side breadcrumbs */}
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-gray-500">
          <span>Vendora</span>
          <span>/</span>
          <span className="text-gray-900 font-semibold">{title}</span>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Búsqueda rápida... (Ctrl+K)"
              className="w-48 h-7 pl-8 pr-3 text-[12px] border border-gray-200 rounded-md bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:bg-white transition-colors"
            />
          </div>

          {/* Scanner Pairing Button — opens QR modal, visible to admin only */}
          {profile?.rol === 'admin' && profile?.negocio_id && (
            <button
              onClick={() => setShowScannerModal(true)}
              title="Conectar escáner móvil"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 text-[12px] font-medium transition-colors"
            >
              <Smartphone size={13} />
              <span>Escáner Móvil</span>
            </button>
          )}

          {/* Connection status */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Circle size={8} fill={online ? '#22C55E' : '#9CA3AF'} className={online ? 'text-green-500' : 'text-gray-400'} />
            <span>{online ? 'Sincronizado' : 'Desconectado'}</span>
          </div>

          {/* Role Badge */}
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 capitalize">
            {profile?.rol === 'admin' ? 'Administrador' : 'Empleado'}
          </span>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <Bell size={15} />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-gray-900 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-gray-900">Notificaciones</span>
                  {alerts.length > 0 && (
                    <button onClick={() => setAlerts([])} className="text-[10px] text-gray-400 hover:text-gray-600">Limpiar</button>
                  )}
                </div>
                <div className="divide-y divide-gray-50 max-h-60 overflow-y-auto">
                  {alerts.length === 0 ? (
                    <div className="px-4 py-6 text-center text-[12px] text-gray-400">
                      Sin notificaciones pendientes
                    </div>
                  ) : (
                    alerts.map((a) => (
                      <div key={a.id} className="px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
                        <p className="text-[12px] text-gray-700 leading-snug font-medium">{a.mensaje}</p>
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {new Date(a.fecha).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Profile Avatar & dropdown menu */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-7 h-7 rounded-full bg-gray-900 hover:bg-gray-800 text-white flex items-center justify-center text-[11px] font-semibold cursor-pointer transition-colors shadow-sm"
            >
              {initials}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl py-1 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-4 py-2 border-b border-gray-100">
                  <p className="text-[12px] font-semibold text-gray-900 truncate">{profile?.nombre || 'Usuario'}</p>
                  <p className="text-[10px] text-gray-400 truncate">{profile?.email || ''}</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false)
                    signOut()
                  }}
                  className="w-full text-left px-4 py-2 text-[12px] text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                >
                  <LogOut size={13} />
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
