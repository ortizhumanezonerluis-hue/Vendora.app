import { Producto, Venta, ArqueoCaja } from '../types'

export interface QueuedSale {
  id: string
  saleData: Omit<Venta, 'id' | 'fecha'> & { negocio_id?: string | null; consecutivo?: string }
  items: { product: Producto; qty: number }[]
  timestamp: string
  status: 'pending' | 'syncing' | 'error'
  error?: string
}

export interface QueuedProduct {
  id: string
  tempId: string
  productData: Omit<Producto, 'id'> & { id?: string; negocio_id?: string | null }
  action: 'create' | 'update' | 'delete'
  timestamp: string
}

// ─── localStorage keys used as fallback ─────────────────────────────────────
const LS_SALES_QUEUE = 'vendora_offline_sales_queue'
const LS_PRODUCTS_CACHE = 'vendora_offline_products_cache'
const LS_PENDING_PRODUCTS = 'vendora_offline_pending_products'
const LS_CASH_SESSION = 'vendora_offline_cash_session'

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
  },
  getPendingProducts(): QueuedProduct[] {
    try {
      const raw = localStorage.getItem(LS_PENDING_PRODUCTS)
      if (!raw) return []
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  },
  savePendingProducts(items: QueuedProduct[]) {
    try {
      localStorage.setItem(LS_PENDING_PRODUCTS, JSON.stringify(items))
    } catch {}
  },
  getCashSession(): ArqueoCaja | null {
    try {
      const raw = localStorage.getItem(LS_CASH_SESSION)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  },
  saveCashSession(session: ArqueoCaja | null) {
    try {
      if (session) {
        localStorage.setItem(LS_CASH_SESSION, JSON.stringify(session))
      } else {
        localStorage.removeItem(LS_CASH_SESSION)
      }
    } catch {}
  }
}

// ─── IndexedDB helpers (preferred when available) ────────────────────────────
const DB_NAME = 'VendoraOfflineDB'
const DB_VERSION = 2
const STORE_PRODUCTS = 'products_cache'
const STORE_SALES_QUEUE = 'sales_queue'
const STORE_PENDING_PRODUCTS = 'pending_products'
const STORE_CASH_SESSION = 'cash_session'

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
      if (!db.objectStoreNames.contains(STORE_PENDING_PRODUCTS)) {
        db.createObjectStore(STORE_PENDING_PRODUCTS, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORE_CASH_SESSION)) {
        db.createObjectStore(STORE_CASH_SESSION, { keyPath: 'id' })
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

  async addOrUpdateCachedProduct(prod: Producto): Promise<void> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_PRODUCTS, 'readwrite')
      tx.objectStore(STORE_PRODUCTS).put(prod)
    } catch {
      const current = lsQueue.getProducts()
      const filtered = current.filter(p => p.id !== prod.id)
      lsQueue.saveProducts([prod, ...filtered])
    }
  },

  async removeCachedProduct(id: string): Promise<void> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_PRODUCTS, 'readwrite')
      tx.objectStore(STORE_PRODUCTS).delete(id)
    } catch {
      const current = lsQueue.getProducts()
      lsQueue.saveProducts(current.filter(p => p.id !== id))
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
      const products = lsQueue.getProducts()
      const updated = products.map((p) =>
        p.id === productId ? { ...p, stock_actual: Number(((p.stock_actual || 0) - deltaQty).toFixed(3)) } : p
      )
      lsQueue.saveProducts(updated)
    }
  },

  // PENDING PRODUCTS QUEUE
  async queuePendingProduct(item: QueuedProduct): Promise<void> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_PENDING_PRODUCTS, 'readwrite')
      tx.objectStore(STORE_PENDING_PRODUCTS).put(item)
    } catch {
      const current = lsQueue.getPendingProducts()
      lsQueue.savePendingProducts([...current.filter(p => p.id !== item.id), item])
    }
  },

  async getPendingProducts(): Promise<QueuedProduct[]> {
    try {
      const db = await openDB()
      return await new Promise<QueuedProduct[]>((resolve, reject) => {
        const tx = db.transaction(STORE_PENDING_PRODUCTS, 'readonly')
        const req = tx.objectStore(STORE_PENDING_PRODUCTS).getAll()
        req.onsuccess = () => resolve(req.result || [])
        req.onerror = () => reject(req.error)
      })
    } catch {
      return lsQueue.getPendingProducts()
    }
  },

  async removePendingProduct(id: string): Promise<void> {
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_PENDING_PRODUCTS, 'readwrite')
      tx.objectStore(STORE_PENDING_PRODUCTS).delete(id)
    } catch {
      const current = lsQueue.getPendingProducts()
      lsQueue.savePendingProducts(current.filter(p => p.id !== id))
    }
  },

  // CASH SESSIONS CACHE
  async saveActiveCashSession(session: ArqueoCaja | null): Promise<void> {
    lsQueue.saveCashSession(session)
    try {
      const db = await openDB()
      const tx = db.transaction(STORE_CASH_SESSION, 'readwrite')
      const store = tx.objectStore(STORE_CASH_SESSION)
      store.clear()
      if (session) {
        store.put(session)
      }
    } catch (_) {}
  },

  async getActiveCashSession(): Promise<ArqueoCaja | null> {
    try {
      const db = await openDB()
      return await new Promise<ArqueoCaja | null>((resolve) => {
        const tx = db.transaction(STORE_CASH_SESSION, 'readonly')
        const req = tx.objectStore(STORE_CASH_SESSION).getAll()
        req.onsuccess = () => {
          const list = req.result || []
          resolve(list.length > 0 ? (list[0] as ArqueoCaja) : lsQueue.getCashSession())
        }
        req.onerror = () => resolve(lsQueue.getCashSession())
      })
    } catch {
      return lsQueue.getCashSession()
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
      const prods = await this.getPendingProducts()
      return sales.length + prods.length
    } catch {
      return 0
    }
  }
}


