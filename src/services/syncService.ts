import { supabase } from '../lib/supabaseClient'
import { offlineDb, QueuedSale } from '../lib/offlineDb'
import { posService } from './posService'

type SyncCallback = (progress: { current: number; total: number; status: 'syncing' | 'success' | 'error' }) => void

class SyncServiceClass {
  private isSyncing = false
  private listeners: SyncCallback[] = []

  subscribe(cb: SyncCallback) {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb)
    }
  }

  private notify(current: number, total: number, status: 'syncing' | 'success' | 'error') {
    this.listeners.forEach(cb => cb({ current, total, status }))
  }

  async syncQueue(): Promise<{ success: boolean; syncedCount: number; failedCount: number }> {
    if (this.isSyncing) return { success: false, syncedCount: 0, failedCount: 0 }
    if (!navigator.onLine) return { success: false, syncedCount: 0, failedCount: 0 }

    this.isSyncing = true
    const queuedSales = await offlineDb.getQueuedSales()
    const total = queuedSales.length

    if (total === 0) {
      this.isSyncing = false
      return { success: true, syncedCount: 0, failedCount: 0 }
    }

    let syncedCount = 0
    let failedCount = 0

    this.notify(0, total, 'syncing')

    for (let i = 0; i < total; i++) {
      const saleItem = queuedSales[i]
      try {
        // Process sale via posService directly to Supabase
        await posService.processSale(saleItem.saleData, saleItem.items)
        await offlineDb.removeQueuedSale(saleItem.id)
        syncedCount++
        this.notify(syncedCount, total, 'syncing')
      } catch (err) {
        console.warn(`Error syncing sale ${saleItem.id}:`, err)
        failedCount++
      }
    }

    this.isSyncing = false
    const finalStatus = failedCount === 0 ? 'success' : 'error'
    this.notify(syncedCount, total, finalStatus)

    return {
      success: failedCount === 0,
      syncedCount,
      failedCount
    }
  }
}

export const syncService = new SyncServiceClass()
