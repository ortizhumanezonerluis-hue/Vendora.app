import { supabase } from '../lib/supabaseClient'
import { offlineDb } from '../lib/offlineDb'
import { posService } from './posService'
import { inventoryService } from './inventoryService'
import { toast } from '../components/ui/Toaster'

type SyncCallback = (progress: { current: number; total: number; status: 'syncing' | 'success' | 'error' }) => void

class SyncServiceClass {
  private isSyncing = false
  private listeners: SyncCallback[] = []
  private initialized = false

  initAutoSync() {
    if (this.initialized || typeof window === 'undefined') return
    this.initialized = true

    window.addEventListener('online', () => {
      console.log('[SyncService] Conexión a internet restablecida. Iniciando sincronización automática...')
      setTimeout(() => {
        this.syncQueue(true)
      }, 1500)
    })

    // Interval sync attempt every 30 seconds if online and there are pending items
    setInterval(async () => {
      if (navigator.onLine && !this.isSyncing) {
        const pending = await offlineDb.getPendingCount()
        if (pending > 0) {
          this.syncQueue(false)
        }
      }
    }, 30000)
  }

  subscribe(cb: SyncCallback) {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb)
    }
  }

  private notify(current: number, total: number, status: 'syncing' | 'success' | 'error') {
    this.listeners.forEach(cb => cb({ current, total, status }))
  }

  async syncQueue(showToasts: boolean = false): Promise<{ success: boolean; syncedCount: number; failedCount: number }> {
    if (this.isSyncing) return { success: false, syncedCount: 0, failedCount: 0 }
    if (!navigator.onLine) return { success: false, syncedCount: 0, failedCount: 0 }

    this.isSyncing = true
    const queuedSales = await offlineDb.getQueuedSales()
    const pendingProducts = await offlineDb.getPendingProducts()
    const total = queuedSales.length + pendingProducts.length

    if (total === 0) {
      this.isSyncing = false
      return { success: true, syncedCount: 0, failedCount: 0 }
    }

    if (showToasts) {
      toast(`🔄 Sincronizando ${total} operación(es) pendientes con Supabase...`, { type: 'info' })
    }

    let syncedCount = 0
    let failedCount = 0

    this.notify(0, total, 'syncing')

    // 1. Sincronizar productos creados offline primero (para que las ventas tengan los IDs válidos)
    for (const prodItem of pendingProducts) {
      try {
        if (prodItem.action === 'create') {
          const { id: _, ...payload } = prodItem.productData as any
          const created = await inventoryService.createProducto(payload, 'Sistema (Offline Sync)', payload.negocio_id)
          // Actualizar la caché local reemplazando el ID temporal por el ID de Supabase
          await offlineDb.removeCachedProduct(prodItem.tempId)
          if (created) {
            await offlineDb.addOrUpdateCachedProduct(created)
          }
        } else if (prodItem.action === 'update' && prodItem.productData.id) {
          await inventoryService.updateProducto(prodItem.productData.id, prodItem.productData)
        } else if (prodItem.action === 'delete' && prodItem.productData.id) {
          await inventoryService.deleteProducto(prodItem.productData.id)
        }
        await offlineDb.removePendingProduct(prodItem.id)
        syncedCount++
        this.notify(syncedCount, total, 'syncing')
      } catch (err) {
        console.warn(`[SyncService] Error sincronizando producto ${prodItem.id}:`, err)
        failedCount++
      }
    }

    // 2. Sincronizar ventas encoladas
    for (let i = 0; i < queuedSales.length; i++) {
      const saleItem = queuedSales[i]
      try {
        await posService.processSale(saleItem.saleData, saleItem.items)
        await offlineDb.removeQueuedSale(saleItem.id)
        syncedCount++
        this.notify(syncedCount, total, 'syncing')
      } catch (err) {
        console.warn(`[SyncService] Error sincronizando venta ${saleItem.id}:`, err)
        failedCount++
      }
    }

    // 3. Sincronizar caja activa offline si existe
    try {
      const offlineSession = await offlineDb.getActiveCashSession()
      if (offlineSession && offlineSession.id && offlineSession.id.startsWith('OFFLINE_')) {
        const { data: remoteActive } = await supabase
          .from('arqueos_caja')
          .select('id')
          .eq('usuario_id', offlineSession.usuario_id)
          .eq('estado', 'abierto')
          .maybeSingle()

        if (!remoteActive) {
          const insertPayload = {
            usuario_id: offlineSession.usuario_id,
            monto_inicial: offlineSession.monto_inicial,
            estado: offlineSession.estado || 'abierto',
            fecha_apertura: offlineSession.fecha_apertura || new Date().toISOString(),
            negocio_id: offlineSession.negocio_id
          }
          const { data: created } = await supabase.from('arqueos_caja').insert([insertPayload]).select().single()
          if (created) {
            await offlineDb.saveActiveCashSession(created)
          }
        }
      }
    } catch (e) {
      console.warn('[SyncService] Error sincronizando estado de caja:', e)
    }

    // 4. Refrescar el catálogo local de productos desde Supabase
    try {
      const freshProducts = await inventoryService.getProductos()
      if (freshProducts && freshProducts.length > 0) {
        await offlineDb.saveProductsCache(freshProducts)
      }
    } catch (_) {}

    this.isSyncing = false
    const finalStatus = failedCount === 0 ? 'success' : 'error'
    this.notify(syncedCount, total, finalStatus)

    if (showToasts) {
      if (failedCount === 0) {
        toast(`✅ Sincronización completada. ${syncedCount} operaciones subidas a Supabase.`, { type: 'success' })
      } else {
        toast(`⚠️ Sincronizados ${syncedCount} elementos. (${failedCount} pendientes).`, { type: 'warning' })
      }
    }

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount
    }
  }
}

export const syncService = new SyncServiceClass()
syncService.initAutoSync()

