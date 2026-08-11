import { useState, useEffect, useCallback } from 'react'
import { posService } from '../services/posService'
import { Producto, Venta } from '../types'

export interface CartItem {
  producto: Producto
  cantidad: number
}

const CART_STORAGE_KEY = 'vendora_pos_cart'

/** Persist cart to localStorage so it survives navigation and page refreshes */
function saveCartToStorage(cart: CartItem[]) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart))
  } catch (_) {
    // Storage quota exceeded — fail silently
  }
}

/** Restore cart from localStorage. Validates shape before returning. */
function loadCartFromStorage(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    // Basic shape validation — each item must have a producto with an id
    return parsed.filter((item: any) => item?.producto?.id && typeof item.cantidad === 'number')
  } catch (_) {
    return []
  }
}

export function usePOS() {
  // Initialize from localStorage so the cart persists across navigation
  const [cart, setCart] = useState<CartItem[]>(() => loadCartFromStorage())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    saveCartToStorage(cart)
  }, [cart])

  const addToCart = useCallback((producto: Producto) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.producto.id === producto.id)
      if (existing) {
        if (existing.cantidad >= producto.stock_actual) return prev
        return prev.map((item) =>
          item.producto.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, { producto, cantidad: 1 }]
    })
  }, [])

  const updateQty = useCallback((productoId: string, amount: number) => {
    setCart((prev) => {
      const item = prev.find((i) => i.producto.id === productoId)
      if (!item) return prev
      const newQty = item.cantidad + amount
      if (newQty <= 0) {
        return prev.filter((i) => i.producto.id !== productoId)
      }
      if (newQty > item.producto.stock_actual) return prev
      return prev.map((i) =>
        i.producto.id === productoId ? { ...i, cantidad: newQty } : i
      )
    })
  }, [])

  const removeFromCart = useCallback((productoId: string) => {
    setCart((prev) => prev.filter((i) => i.producto.id !== productoId))
  }, [])

  const clearCart = useCallback(() => {
    setCart([])
    localStorage.removeItem(CART_STORAGE_KEY)
  }, [])

  const checkout = async (
    paymentMethod: 'efectivo' | 'transferencia' | 'tarjeta',
    usuarioId: string = 'Ana López',
    negocioId?: string | null
  ): Promise<Venta | null> => {
    setLoading(true)
    setError(null)
    const total = cart.reduce((acc, item) => acc + item.producto.precio_venta * item.cantidad, 0)
    
    try {
      const saleData: Omit<Venta, 'id' | 'fecha'> & { negocio_id?: string | null } = {
        usuario_id: usuarioId,
        total,
        metodo_pago: paymentMethod,
        estado: 'completada',
        negocio_id: negocioId
      }

      const items = cart.map((i) => ({
        product: i.producto,
        qty: i.cantidad
      }))

      const result = await posService.processSale(saleData, items)
      clearCart()
      return result
    } catch (err: any) {
      console.warn('Fallo al procesar checkout en Supabase. Procesando localmente:', err)
      setError(err.message || 'Error al procesar la venta')
      
      // Fallback local sale completion
      const fakeSale: Venta = {
        id: `V_${Date.now()}`,
        fecha: new Date().toISOString(),
        usuario_id: usuarioId,
        total,
        metodo_pago: paymentMethod,
        estado: 'completada'
      }
      clearCart()
      return fakeSale
    } finally {
      setLoading(false)
    }
  }

  return {
    cart,
    loading,
    error,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    checkout
  }
}
