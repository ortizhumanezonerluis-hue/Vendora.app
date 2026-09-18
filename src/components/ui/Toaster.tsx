import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface ToastItem {
  id: string
  message: string
  description?: string
  type: ToastType
  visible: boolean
}

type Listener = (toast: Omit<ToastItem, 'visible'>) => void
const listeners = new Set<Listener>()

export function toast(message: string, options?: { description?: string; type?: ToastType }) {
  const id = Math.random().toString(36).slice(2, 9)
  listeners.forEach((l) =>
    l({ id, message, description: options?.description, type: options?.type || 'success' })
  )
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    const handle = (t: Omit<ToastItem, 'visible'>) => {
      setToasts((prev) => [...prev, { ...t, visible: true }])
      setTimeout(() => {
        setToasts((prev) => prev.map((x) => x.id === t.id ? { ...x, visible: false } : x))
        setTimeout(() => {
          setToasts((prev) => prev.filter((x) => x.id !== t.id))
        }, 300)
      }, 4000)
    }
    listeners.add(handle)
    return () => { listeners.delete(handle) }
  }, [])

  return { toasts, setToasts }
}

export function Toaster() {
  const { toasts, setToasts } = useToast()

  const dismiss = (id: string) => {
    setToasts((prev) => prev.map((x) => x.id === id ? { ...x, visible: false } : x))
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id))
    }, 300)
  }

  return (
    <div
      aria-live="polite"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 w-[360px] pointer-events-none"
    >
      {toasts.map((t) => {
        return (
          <div
            key={t.id}
            style={{
              transition: 'all 300ms cubic-bezier(0.16, 1, 0.3, 1)',
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)'
            }}
            className="pointer-events-auto w-full bg-white text-gray-900 border border-gray-250/70 rounded-xl shadow-lg p-4 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold tracking-tight text-gray-900">{t.message}</p>
              {t.description && (
                <p className="text-[11px] text-gray-400 mt-1 leading-normal font-medium">{t.description}</p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Optional Undo action style */}
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-[11px] font-semibold text-gray-900 border border-gray-200 rounded-md px-2.5 py-1.5 hover:bg-gray-50 transition-colors"
              >
                Deshacer
              </button>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
