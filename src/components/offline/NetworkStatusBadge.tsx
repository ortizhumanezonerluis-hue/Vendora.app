import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { offlineDb } from '../../lib/offlineDb'
import { syncService } from '../../services/syncService'
import { toast } from '../ui/Toaster'

export default function NetworkStatusBadge() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [pendingCount, setPendingCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)

  const checkQueue = async () => {
    const cnt = await offlineDb.getPendingCount()
    setPendingCount(cnt)
  }

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      checkQueue()
    }
    const handleOffline = () => {
      setIsOnline(false)
      checkQueue()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    checkQueue()
    const interval = setInterval(checkQueue, 3000)

    const unsub = syncService.subscribe((prog) => {
      if (prog.status === 'syncing') setIsSyncing(true)
      else {
        setIsSyncing(false)
        checkQueue()
      }
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
      unsub()
    }
  }, [])

  const triggerSync = async () => {
    if (!isOnline) {
      toast('No hay conexión a internet', { type: 'error' })
      return
    }
    toast('Iniciando sincronización manual...', { type: 'success' })
    await syncService.syncQueue()
    checkQueue()
  }

  return (
    <div className="flex items-center gap-2">
      {!isOnline ? (
        <div className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/80 rounded-full text-[11px] font-medium flex items-center gap-1.5">
          <WifiOff size={12} className="text-amber-600" />
          <span>Modo Offline</span>
        </div>
      ) : pendingCount > 0 ? (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/80 rounded-full text-[11px] font-medium flex items-center gap-1.5 hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
          <span>{pendingCount} venta(s) pendiente(s)</span>
        </button>
      ) : (
        <div className="px-2 py-0.5 text-gray-400 text-[11px] font-medium flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
          <span className="text-gray-500">En línea</span>
        </div>
      )}
    </div>
  )
}

