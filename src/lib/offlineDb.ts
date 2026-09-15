import { Producto, Venta } from '../types'

export interface QueuedSale {
  id: string
  saleData: Omit<Venta, 'id' | 'fecha'> & { negocio_id?: string | null }
  items: { product: Producto; qty: number }[]
  timestamp: string
  status: 'pending' | 'syncing' | 'error'
  error?: string
}

// ─── localStorage keys used as fallback ─────────────────────────────────────
const LS_SALES_QUEUE = 'vendora_offline_sales_queue'
const LS_PRODUCTS_CACHE = 'vendora_offline_products_cache'

// ─── localStorage-based helpers (universal fallback) ────────────────────────
const lsQueue = {
  getSales(): QueuedSale[] {
    try {
      const raw = localStorage.getItem(LS_SALES_QUEUE)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },
  saveSales(sales: QueuedSale[]) {
    try {
      localStorage.setItem(LS_SALES_QUEUE, JSON.stringify(sales))
    } catch {
      console.warn('[OfflineDB] localStorage quota exceeded')
    }
  },
  addSale(sale: QueuedSale) {
    const current = this.getSales()
    const filtered = current.filter((s) => s.id !== sale.id)
    this.saveSales([...filtered, sale])
  },
  removeSale(id: string) {
    const current = this.getSales()
    this.saveSales(current.filter((s) => s.id !== id))
  },
  getProducts(): Producto[] {
    try {
      const raw = localStorage.getItem(LS_PRODUCTS_CACHE)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },
  saveProducts(products: Producto[]) {
    try {
      localStorage.setItem(LS_PRODUCTS_CACHE, JSON.stringify(products))
    } catch {
      console.warn('[OfflineDB] localStorage quota exceeded for products cache')
    }
  }
}

// ─── IndexedDB helpers (preferred when available) ────────────────────────────
const DB_NAME = 'VendoraOfflineDB'
const DB_VERSION = 1
const STORE_PRODUCTS = 'products_cache'
const STORE_SALES_QUEUE = 'sales_queue'

function isIndexedDBAvailable(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null
  } catch {
    return false
  }
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDBAvailable()) {
      return reject(new Error('IndexedDB not available'))
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

// ─── Public API — tries IndexedDB first, falls back to localStorage ──────────
export const offlineDb = {
  // PRODUCTS CACHE
  async saveProductsCache(products: Producto[]): Promise<void> {
    try {
      const db = await openDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_PRODUCTS, 'readwrite')
        const store = tx.objectStore(STORE_PRODUCTS)
        store.clear()
        for (const prod of products) store.put(prod)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      // Fallback: save to localStorage
      lsQueue.saveProducts(products)
    }
  },

  async getCachedProducts(): Promise<Producto[]> {
    try {
      const db = await openDB()
      return await new Promise<Producto[]>((resolve, reject) => {
        const tx = db.transaction(STORE_PRODUCTS, 'readonly')
        const store = tx.objectStore(STORE_PRODUCTS)
        const req = store.getAll()
        req.onsuccess = () => resolve(req.result || [])
        req.onerror = () => reject(req.error)
      })
    } catch {
      return lsQueue.getProducts()
    }
  },

  async updateCachedProductStock(productId: string, deltaQty: number): Promise<void> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_PRODUCTS, 'readwrite')
      const store = tx.objectStore(STORE_PRODUCTS)
      const req = store.get(productId)
      req.onsuccess = () => {
        const prod = req.result as Producto
        if (prod) {
          prod.stock_actual = Number(((prod.stock_actual || 0) - deltaQty).toFixed(3))
          store.put(prod)
        }
      }
    } catch {
      // Fallback: update in localStorage products cache
      const products = lsQueue.getProducts()
      const updated = products.map((p) =>
        p.id === productId ? { ...p, stock_actual: Number(((p.stock_actual || 0) - deltaQty).toFixed(3)) } : p
      )
      lsQueue.saveProducts(updated)
    }
  },


  // SALES QUEUE
  async queueSale(sale: QueuedSale): Promise<void> {
    try {
      const db = await openDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SALES_QUEUE, 'readwrite')
        const store = tx.objectStore(STORE_SALES_QUEUE)
        store.put(sale)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      // Fallback: save to localStorage
      lsQueue.addSale(sale)
    }
  },

  async getQueuedSales(): Promise<QueuedSale[]> {
    try {
      const db = await openDB()
      return await new Promise<QueuedSale[]>((resolve, reject) => {
        const tx = db.transaction(STORE_SALES_QUEUE, 'readonly')
        const store = tx.objectStore(STORE_SALES_QUEUE)
        const req = store.getAll()
        req.onsuccess = () => resolve(req.result || [])
        req.onerror = () => reject(req.error)
      })
    } catch {
      return lsQueue.getSales()
    }
  },

  async removeQueuedSale(id: string): Promise<void> {
    try {
      const db = await openDB()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_SALES_QUEUE, 'readwrite')
        const store = tx.objectStore(STORE_SALES_QUEUE)
        store.delete(id)
        tx.oncomplete = () => resolve()
        tx.onerror = () => reject(tx.error)
      })
    } catch {
      lsQueue.removeSale(id)
    }
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

