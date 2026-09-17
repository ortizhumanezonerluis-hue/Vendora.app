import { useState, useEffect } from 'react'
import MainLayout from '../components/layout/MainLayout'
import { HardDrive, Download, Upload, ShieldCheck, QrCode, RefreshCw, CheckCircle2, AlertTriangle, Smartphone } from 'lucide-react'
import { desktopBackup, desktopScanner, desktopSystem, isElectron } from '../lib/electronBridge'
import { toast } from '../components/ui/Toaster'

export default function BackupRestorePage() {
  const [dbPath, setDbPath] = useState<string>('Almacenamiento Local del Sistema')
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [lastExport, setLastExport] = useState<string | null>(() => localStorage.getItem('vendora_last_backup_date'))
  const [lanInfo, setLanInfo] = useState<{ localIp: string; port: number; url: string } | null>(null)

  useEffect(() => {
    if (isElectron) {
      if (desktopSystem) {
        desktopSystem.getDatabasePath().then(setDbPath).catch(console.error)
      }
      if (desktopScanner) {
        desktopScanner.getServerInfo().then(setLanInfo).catch(console.error)
      }
    }
  }, [])

  const handleExport = async () => {
    if (!isElectron || !desktopBackup) {
      toast('La exportación nativa de base de datos SQLite está activa en la app de escritorio Electron', { type: 'info' })
      return
    }

    setExporting(true)
    try {
      const res = await desktopBackup.export()
      if (res.success && res.filePath) {
        const now = new Date().toLocaleString('es-CO')
        setLastExport(now)
        localStorage.setItem('vendora_last_backup_date', now)
        toast(`✓ Respaldo exportado correctamente en: ${res.filePath}`, { type: 'success' })
      } else if (res.error && !res.error.includes('cancelada')) {
        toast(`Error al exportar: ${res.error}`, { type: 'error' })
      }
    } catch (err: any) {
      toast(err.message || 'Error al exportar respaldo', { type: 'error' })
    } finally {
      setExporting(false)
    }
  }

  const handleRestore = async () => {
    if (!isElectron || !desktopBackup) {
      toast('La restauración nativa de base de datos está activa en la app de escritorio Electron', { type: 'info' })
      return
    }

    if (!window.confirm('⚠️ ¿Estás seguro de restaurar una copia de seguridad? Se reemplazarán los datos actuales por los del respaldo.')) {
      return
    }

    setRestoring(true)
    try {
      const res = await desktopBackup.restore()
      if (res.success) {
        toast('✓ Copia de seguridad restaurada con éxito. Reiniciando base de datos...', { type: 'success' })
      } else if (res.error && !res.error.includes('cancelada')) {
        toast(`Error al restaurar: ${res.error}`, { type: 'error' })
      }
    } catch (err: any) {
      toast(err.message || 'Error al restaurar respaldo', { type: 'error' })
    } finally {
      setRestoring(false)
    }
  }

  return (
    <MainLayout title="Centro de Respaldos y Base de Datos Local">
      <div className="p-6 max-w-5xl mx-auto space-y-6">

        {/* Encabezado Principal */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <HardDrive size={22} className="text-gray-800" />
              Base de Datos y Respaldos Locales
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Todos tus datos se guardan de forma 100% segura en el disco duro de este equipo sin servidores externos.
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-emerald-700 text-xs font-semibold">
            <ShieldCheck size={14} />
            <span>Modo Local Offline Activo</span>
          </div>
        </div>

        {/* Ubicación del archivo de base de datos */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ruta de Base de Datos SQLite</p>
            <p className="text-xs font-mono text-gray-800 mt-0.5 break-all">{dbPath}</p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <span className="text-[11px] font-semibold text-gray-500 block">Motor de Almacenamiento</span>
            <span className="text-xs font-bold text-gray-900">SQLite 3 (WAL Mode)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tarjeta Exportar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-3">
                <Download size={20} />
              </div>
              <h2 className="text-base font-bold text-gray-900">Exportar Copia de Seguridad</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Empaqueta todas tus ventas, inventarios, clientes, arqueos y contabilidad en un archivo comprimido <strong className="text-gray-700">.zip</strong> seguro para guardar en una memoria USB o disco externo.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {lastExport && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1.5">
                  <CheckCircle2 size={13} className="text-emerald-500" />
                  Último respaldo: <span className="font-semibold text-gray-700">{lastExport}</span>
                </p>
              )}
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full h-11 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-sm active:scale-98 disabled:opacity-50"
              >
                {exporting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Generando respaldo...
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    Guardar Respaldo en USB / Disco
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Tarjeta Restaurar */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mb-3">
                <Upload size={20} />
              </div>
              <h2 className="text-base font-bold text-gray-900">Restaurar Copia de Seguridad</h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Carga un archivo de respaldo previo (<strong className="text-gray-700">.zip</strong> o <strong className="text-gray-700">.sqlite</strong>) en una computadora nueva o tras un formateo para recuperar todo tu negocio al instante.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div className="p-3 bg-amber-50/60 border border-amber-200/60 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
                <AlertTriangle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                <span>Al restaurar, se creará una copia de seguridad preventiva automática de la base actual antes de reemplazarla.</span>
              </div>
              <button
                onClick={handleRestore}
                disabled={restoring}
                className="w-full h-11 border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
              >
                {restoring ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    Restaurando base de datos...
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    Seleccionar Archivo de Respaldo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tarjeta Escáner Móvil en Red Local (LAN) */}
        {lanInfo && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-950 text-white rounded-2xl p-6 shadow-xl border border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <Smartphone size={18} className="text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Escáner Móvil en Red Wi-Fi Local (Sin Internet)</span>
                </div>
                <h3 className="text-base font-bold text-white">Usa la cámara de tu celular como lector de barras</h3>
                <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                  Conecta tu celular al mismo Wi-Fi de este local y abre el enlace local. Cada código que enfoques se transmitirá en 1 milisegundo al POS y a la Auditoría Física.
                </p>
                <div className="pt-2">
                  <span className="inline-block px-3 py-1.5 bg-white/10 rounded-lg text-xs font-mono text-emerald-300 border border-white/10 select-all">
                    {lanInfo.url}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl shadow-md shrink-0 flex flex-col items-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(lanInfo.url)}`}
                  alt="QR Conexión Local"
                  className="w-28 h-28"
                />
                <span className="text-[10px] font-bold text-gray-700 mt-1">Escanear para Enlazar</span>
              </div>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  )
}
