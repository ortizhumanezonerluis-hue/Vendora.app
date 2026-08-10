import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'

export interface RemoteScannerEvent {
  code: string
  mode: 'form' | 'continuous'
  timestamp: number
  userId: string
  negocioId: string
}

export function useRemoteScanner(
  negocioId: string | undefined,
  userId: string | undefined,
  onCodeDetected: (code: string, mode: 'form' | 'continuous') => void
) {
  const onCodeDetectedRef = useRef(onCodeDetected)

  useEffect(() => {
    onCodeDetectedRef.current = onCodeDetected
  }, [onCodeDetected])

  useEffect(() => {
    if (!negocioId) return

    // Initialize Supabase Broadcast Channel for real-time mobile sync
    const channel = supabase.channel(`scanner-events:${negocioId}`, {
      config: {
        broadcast: { self: false }
      }
    })

    channel
      .on('broadcast', { event: 'scan' }, (payload) => {
        const { code, mode } = payload.payload as RemoteScannerEvent
        if (code) {
          onCodeDetectedRef.current(code, mode)
        }
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[useRemoteScanner] Suscrito a eventos de escaneo para negocio: ${negocioId}`)
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [negocioId])
}

// Global broadcast function so any mobile client can emit scans to this tenant
export async function sendRemoteScan(negocioId: string, userId: string, code: string, mode: 'form' | 'continuous') {
  const channel = supabase.channel(`scanner-events:${negocioId}`, {
    config: {
      broadcast: { self: true }
    }
  })

  await new Promise<void>((resolve) => {
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.send({
          type: 'broadcast',
          event: 'scan',
          payload: {
            code,
            mode,
            timestamp: Date.now(),
            userId,
            negocioId
          } as RemoteScannerEvent
        })
        supabase.removeChannel(channel)
        resolve()
      }
    })
  })
}
