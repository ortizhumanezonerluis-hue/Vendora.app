import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../components/auth/AuthContext'
import { sendRemoteScan } from '../hooks/useRemoteScanner'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'
import { Scan, Sparkles, Volume2, ShieldAlert, ArrowLeft } from 'lucide-react'
import { toast } from '../components/ui/Toaster'
import { Link } from 'react-router-dom'

export default function ScannerAppPage() {
  const { profile } = useAuth()
  const [scanMode, setScanMode] = useState<'form' | 'continuous'>('form')
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScannedTimeRef = useRef<number>(0)
  const beepAudioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize audio feedback element
  useEffect(() => {
    // Generate a simple synthesize-like beep using Web Audio API or a tiny base64 audio
    beepAudioRef.current = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAAG')
  }, [])

  const triggerBeepAndVibrate = () => {
    // Web Audio API Beep (reliable fallback)
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime) // A5 note (nice sharp beep)
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.1) // 100ms
    } catch (e) {
      console.warn('Web Audio API not supported or user gesture needed:', e)
    }

    // Vibrate
    if ('vibrate' in navigator) {
      navigator.vibrate(100)
    }
  }

  useEffect(() => {
    // Setup and start camera
    startScanner()

    return () => {
      stopScanner()
    }
  }, [scanMode, profile])

  const startScanner = async () => {
    if (!profile?.negocio_id) return
    setIsScanning(true)
    
    // HTML5 QR Code Setup
    try {
      const cameras = await Html5Qrcode.getCameras()
      if (cameras && cameras.length > 0) {
        setCameraPermission(true)
        // Select back camera if available
        const backCamera = cameras.find(c => c.label.toLowerCase().includes('back') || c.label.toLowerCase().includes('trasera'))
        const cameraId = backCamera ? backCamera.id : cameras[0].id

        const html5QrCode = new Html5Qrcode('camera-reader-view')
        scannerRef.current = html5QrCode

        await html5QrCode.start(
          cameraId,
          {
            fps: 12,
            qrbox: (width, height) => {
              const size = Math.min(width, height) * 0.7
              return { width: size, height: size * 0.5 } // Rectangular guide for barcodes
            },
            aspectRatio: 1.7777778
          },
          async (decodedText) => {
            const now = Date.now()
            const cooldown = scanMode === 'form' ? 2000 : 800 // cooldown to prevent flooding
            
            if (now - lastScannedTimeRef.current > cooldown) {
              lastScannedTimeRef.current = now
              setLastScanned(decodedText)
              triggerBeepAndVibrate()

              // Emit scan event over Supabase Realtime Broadcast channel
              try {
                await sendRemoteScan(profile.negocio_id!, profile.id, decodedText, scanMode)
                toast(`Código emitido: ${decodedText}`, { type: 'success' })
              } catch (err) {
                console.error('Error enviando broadcast de escaneo:', err)
              }
            }
          },
          () => {
            // Verbose error ignored to avoid spamming
          }
        )
      } else {
        setCameraPermission(false)
        toast('No se detectaron cámaras en el dispositivo', { type: 'error' })
      }
    } catch (err) {
      console.error('Error inicializando cámara:', err)
      setCameraPermission(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch (err) {
        console.warn('Error parando scanner:', err)
      }
    }
    setIsScanning(false)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans select-none max-w-md mx-auto relative overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 shrink-0 flex items-center justify-between">
        <Link to="/" className="p-1.5 hover:bg-gray-150 rounded-lg text-gray-500 transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[12px] font-bold text-gray-800 tracking-tight">Escáner Móvil Activo</span>
        </div>
        <div className="w-7 h-7" />
      </header>

      {/* Switch Mode Controls */}
      <div className="p-4 shrink-0 bg-white border-b border-gray-100 flex gap-2">
        <button
          onClick={() => setScanMode('form')}
          className={[
            'flex-1 py-2 px-3 rounded-xl text-[12px] font-semibold transition-all border flex items-center justify-center gap-1.5',
            scanMode === 'form'
              ? 'bg-purple-50 border-purple-200 text-purple-700 shadow-sm font-bold'
              : 'bg-white border-gray-200 text-gray-500'
          ].join(' ')}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
          Modo Formulario
        </button>

        <button
          onClick={() => setScanMode('continuous')}
          className={[
            'flex-1 py-2 px-3 rounded-xl text-[12px] font-semibold transition-all border flex items-center justify-center gap-1.5',
            scanMode === 'continuous'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm font-bold'
              : 'bg-white border-gray-200 text-gray-500'
          ].join(' ')}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Modo Rápido / POS
        </button>
      </div>

      {/* Camera Viewer Screen */}
      <div className="flex-1 flex flex-col justify-center p-5 items-center relative">
        <div className="w-full max-w-xs aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 bg-black relative shadow-lg">
          
          {/* Guide Overlay for camera */}
          <div id="camera-reader-view" className="w-full h-full relative" />

          {/* Guide reticle */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="w-[75%] h-[40%] border-2 border-dashed border-white/60 rounded-xl relative flex items-center justify-center">
              {/* Scanline Animation */}
              <div className="absolute left-0 right-0 h-0.5 bg-red-500 shadow-[0_0_8px_#ef4444] animate-[bounce_2s_infinite]" />
            </div>
          </div>
        </div>

        {cameraPermission === false && (
          <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center p-6 text-center z-20 space-y-3">
            <ShieldAlert size={36} className="text-red-500" />
            <p className="text-[13px] font-bold text-gray-900">Permiso de Cámara Denegado</p>
            <p className="text-[11px] text-gray-500 leading-relaxed max-w-xs">
              Por favor concede acceso a tu cámara desde la configuración del navegador para poder escanear.
            </p>
            <button
              onClick={startScanner}
              className="px-4 py-2 bg-gray-950 text-white rounded-lg text-[12px] font-semibold"
            >
              Reintentar Permiso
            </button>
          </div>
        )}
      </div>

      {/* Display Last Scan Status Bar at Bottom */}
      <div className="p-5 shrink-0 bg-white border-t border-gray-200 text-center space-y-2">
        <div className="text-[11px] text-gray-400 font-semibold uppercase tracking-wider">
          Último Código Leído
        </div>
        <div className="h-10 flex items-center justify-center">
          {lastScanned ? (
            <div className="bg-gray-155 text-gray-900 px-4 py-1.5 rounded-full font-mono text-[13px] font-bold flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-500" />
              {lastScanned}
            </div>
          ) : (
            <span className="text-[12px] text-gray-400 italic">Enfoque un código de barras para iniciar</span>
          )}
        </div>
      </div>
    </div>
  )
}
