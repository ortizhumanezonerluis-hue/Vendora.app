import { Producto, Venta } from '../types'

export interface QueuedSale {
  id: string
  saleData: Omit<Venta, 'id' | 'fecha'> & { negocio_id?: string | null }
  items: { product: Producto; qty: number }[]
  timestamp: string
  status: 'pending' | 'syncing' | 'error'
  error?: string
}

const DB_NAME = 'VendoraOfflineDB'
const DB_VERSION = 1
const STORE_PRODUCTS = 'products_cache'
const STORE_SALES_QUEUE = 'sales_queue'

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDA === 'undefined') {
      return reject(new Error('IndexedDB no soportado'))
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_PRODUCTS)) {
        db.createObjectStore(STORE_PRODUCTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_SALES_QUEUE)) {
        db.createObjectStore(STORE_SALES_QUEUE, { keyPath: 'id' })
      }
    }

    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

export const offlineDb = {
  async saveProductsCache(products: Producto[]): Promise<void> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_PRODUCTS, 'readwrite')
      const store = tx.objectStore(STORE_PRODUCTS)
      store.clear()
      for (const prod of products) {
        store.put(prod)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  async getCachedProducts(): Promise<Producto[]> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_PRODUCTS, 'readonly')
        const store = tx.objectStore(STORE_PRODUCTS)
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })
    } catch {
      return []
    }
  },

  async updateCachedProductStock(productId: string, deltaQty: number): Promise<void> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_PRODUCTS, 'readwrite')
      const store = tx.objectStore(STORE_PRODUCTS)
      const request = store.get(productId)
      request.onsuccess = () => {
        const prod = request.result as Producto
        if (prod) {
          prod.stock_actual = Math.max(0, prod.stock_actual - deltaQty)
          store.put(prod)
        }
      }
    } catch (err) {
      console.warn('Error updating local product stock cache:', err)
    }
  },

  async queueSale(sale: QueuedSale): Promise<void> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SALES_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_SALES_QUEUE)
      store.put(sale)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  async getQueuedSales(): Promise<QueuedSale[]> {
    try {
      const db = await openDB()
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_SALES_QUEUE, 'readonly')
        const store = tx.objectStore(STORE_SALES_QUEUE)
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      })
    } catch {
      return []
    }
  },

  async removeQueuedSale(id: string): Promise<void> {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SALES_QUEUE, 'readwrite')
      const store = tx.objectStore(STORE_SALES_QUEUE)
      store.delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  },

  async getPendingCount(): Promise<number> {
    try {
      const sales = await this.getQueuedSales()
      return sales.length
    } catch {
      return 0
    }
  }
}
