import { useState, useEffect } from 'react'
import { Check, Loader2, AlertCircle } from 'lucide-react'
import { syncService } from '../../services/syncService'
import { offlineDb } from '../../lib/offlineDb'
import { toast } from '../ui/Toaster'

export default function SyncModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [syncState, setSyncState] = useState<{
    current: number
    total: number
    status: 'syncing' | 'success' | 'error'
  }>({
    current: 0,
    total: 0,
    status: 'syncing'
  })

  useEffect(() => {
    // Subscribe to sync progress updates
    const unsub = syncService.subscribe((prog) => {
      setSyncState(prog)
      if (prog.status === 'syncing') {
        setIsOpen(true)
      } else if (prog.status === 'success') {
        toast(`Sincronización completada (${prog.total} ventas)`, { type: 'success' })
        setTimeout(() => setIsOpen(false), 2500)
      } else if (prog.status === 'error') {
        toast('Algunas ventas no pudieron sincronizarse', { type: 'error' })
      }
    })

    // Automatically trigger sync when reconnected online
    const handleOnline = async () => {
      const pending = await offlineDb.getPendingCount()
      if (pending > 0) {
        setIsOpen(true)
        await syncService.syncQueue()
      }
    }

    window.addEventListener('online', handleOnline)

    return () => {
      unsub()
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  if (!isOpen) return null

  const percent = syncState.total > 0 ? Math.round((syncState.current / syncState.total) * 100) : 0

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-md shadow-2xl p-7 text-center">
        {/* Icon header */}
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
          {syncState.status === 'syncing' ? (
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
              <Loader2 size={32} className="text-blue-600 animate-spin" />
            </div>
          ) : syncState.status === 'success' ? (
            <div className="w-16 h-16 rounded-2xl bg-green-50 border border-green-100 flex items-center justify-center">
              <Check size={32} className="text-green-600" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
              <AlertCircle size={32} className="text-amber-600" />
            </div>
          )}
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-[18px] font-bold text-slate-900">
          {syncState.status === 'syncing'
            ? 'Sincronizando con Supabase...'
            : syncState.status === 'success'
            ? '¡Todo Sincronizado con Éxito!'
            : 'Sincronización con Observaciones'}
        </h3>

        <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
          {syncState.status === 'syncing'
            ? `Guardando venta ${syncState.current} de ${syncState.total} realizadas sin conexión...`
            : syncState.status === 'success'
            ? `Las ${syncState.total} ventas locales ya están registradas en Supabase y el inventario actualizado.`
            : `Se procesaron las ventas, algunas transacciones requirieron reintento.`}
        </p>

        {/* Progress bar */}
        <div className="mt-6 space-y-2">
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-slate-900 rounded-full transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{syncState.current} / {syncState.total} operaciones</span>
            <span>{percent}%</span>
          </div>
        </div>

        {/* Close button only if not syncing */}
        {syncState.status !== 'syncing' && (
          <button
            onClick={() => setIsOpen(false)}
            className="w-full mt-6 h-9 bg-slate-900 text-white text-[13px] font-medium rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Entendido, continuar
          </button>
        )}
      </div>
    </div>
  )
}