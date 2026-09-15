import { useEffect, useRef } from 'react'

interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void
  minChars?: number
  maxIntervalMs?: number
  enabled?: boolean
}

/**
 * Universal Hardware Barcode Scanner Listener Hook
 * Compatible with all standard USB, Bluetooth, and Wireless 2.4GHz barcode guns (HID Keyboard emulation mode).
 * Automatically intercepts barcode bursts from anywhere in the window without requiring manual input focus.
 */
export function useBarcodeScanner({
  onScan,
  minChars = 3,
  maxIntervalMs = 60,
  enabled = true
}: UseBarcodeScannerOptions) {
  const bufferRef = useRef<string>('')
  const lastTimeRef = useRef<number>(0)
  const onScanRef = useRef(onScan)

  useEffect(() => {
    onScanRef.current = onScan
  }, [onScan])

  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore modifier keys
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(event.key)) {
        return
      }

      const now = Date.now()
      const interval = now - lastTimeRef.current
      lastTimeRef.current = now

      // If key is 'Enter' (standard barcode terminator sent by 99% of scanner guns)
      if (event.key === 'Enter') {
        const barcode = bufferRef.current.trim()

        if (barcode.length >= minChars) {
          event.preventDefault()
          event.stopPropagation()
          onScanRef.current(barcode)
        }

        bufferRef.current = ''
        return
      }

      // If interval between keystrokes is too long (human typing manually in a form), reset buffer
      if (interval > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = ''
      }

      // Only accumulate printable single characters
      if (event.key.length === 1) {
        bufferRef.current += event.key
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [enabled, minChars, maxIntervalMs])
}
