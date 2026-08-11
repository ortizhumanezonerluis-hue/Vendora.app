import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../components/auth/AuthContext'
import { sendRemoteScan } from '../hooks/useRemoteScanner'
import { Html5Qrcode } from 'html5-qrcode'
import { Sparkles, ShieldAlert, ArrowLeft } from 'lucide-react'
import { toast } from '../components/ui/Toaster'
import { Link, useSearchParams } from 'react-router-dom'

/**
 * Global CSS injected once to strip all html5-qrcode library UI chrome
 * and make its <video> fill the parent div completely.
 * The library IDs child elements as: {id}__scan_region, {id}__dashboard, {id}__filescan_input
 */
const SCANNER_CSS = `
  /* Make the container fill the screen */
  #camera-reader-view {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    background: transparent !important;
    border: none !important;
  }
  /* Stretch the video to cover the full screen */
  #camera-reader-view video {
    position: absolute !important;
    inset: 0 !important;
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    border: none !important;
    background: #000 !important;
  }
  /* Hide the library's own scan region, dashboard, and shading overlays */
  #camera-reader-view__scan_region,
  #camera-reader-view__dashboard,
  #camera-reader-view__dashboard_section,
  #camera-reader-view__filescan_input,
  #camera-reader-view img {
    display: none !important;
  }
`

export default function ScannerAppPage() {
  const { profile } = useAuth()
  const [searchParams] = useSearchParams()
  const [scanMode, setScanMode] = useState<'form' | 'continuous'>('form')
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null)

  const resolvedNegocioId = searchParams.get('negocio_id') || profile?.negocio_id
  const resolvedUserId = profile?.id || 'anon_scanner_device'

  const scannerRef = useRef<Html5Qrcode | null>(null)
  const lastScannedTimeRef = useRef<number>(0)

  const triggerBeepAndVibrate = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()
      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)
      oscillator.type = 'sine'
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime)
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime)
      oscillator.start()
      oscillator.stop(audioCtx.currentTime + 0.1)
    } catch (_) {}
    if ('vibrate' in navigator) navigator.vibrate([50, 30, 50])
  }

  useEffect(() => {
    startScanner()
    return () => { stopScanner() }
  }, [scanMode, resolvedNegocioId])

  const startScanner = async () => {
    if (!resolvedNegocioId) return

    try {
      const cameras = await Html5Qrcode.getCameras()
      if (cameras && cameras.length > 0) {
        setCameraPermission(true)

        // Prefer physical back/environment camera
        const backCamera = cameras.find(c =>
          c.label.toLowerCase().includes('back') ||
          c.label.toLowerCase().includes('trasera') ||
          c.label.toLowerCase().includes('environment')
        )
        const cameraId = backCamera ? backCamera.id : cameras[cameras.length - 1].id

        const html5QrCode = new Html5Qrcode('camera-reader-view')
        scannerRef.current = html5QrCode

        await html5QrCode.start(
          { deviceId: cameraId },
          {
            fps: 20,
            // qrbox set to 0 disables the library's own shaded scan region UI
            qrbox: (width, height) => ({
              width: Math.round(width * 0.72),
              height: Math.round(height * 0.38)
            }),
            videoConstraints: {
              deviceId: cameraId,
              width: { min: 640, ideal: 1280, max: 1920 },
              height: { min: 480, ideal: 720, max: 1080 },
              facingMode: 'environment',
              // @ts-ignore – non-standard but supported on most Android WebViews
              focusMode: { ideal: 'continuous' },
              // @ts-ignore
              advanced: [{ focusMode: 'continuous' }, { zoom: 1.0 }]
            }
          },
          async (decodedText) => {
            const now = Date.now()
            const cooldown = scanMode === 'form' ? 2000 : 800

            if (now - lastScannedTimeRef.current > cooldown) {
              lastScannedTimeRef.current = now
              setLastScanned(decodedText)
              triggerBeepAndVibrate()

              try {
                await sendRemoteScan(resolvedNegocioId, resolvedUserId, decodedText, scanMode)
                toast(`Código emitido: ${decodedText}`, { type: 'success' })
              } catch (err) {
                console.error('[Scanner] Error enviando broadcast:', err)
              }
            }
          },
          () => { /* suppress verbose per-frame errors */ }
        )
      } else {
        setCameraPermission(false)
        toast('No se detectaron cámaras en el dispositivo', { type: 'error' })
      }
    } catch (err) {
      console.error('[Scanner] Error inicializando cámara:', err)
      setCameraPermission(false)
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try { await scannerRef.current.stop() } catch (_) {}
    }
  }

  /* ─── Unconfigured error screen ─────────────────────────────── */
  if (!resolvedNegocioId) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-amber-500/20 rounded-3xl flex items-center justify-center mb-5 border border-amber-500/30">
          <ShieldAlert size={28} className="text-amber-400" />
        </div>
        <p className="text-[15px] font-bold text-white mb-2">Escáner no configurado</p>
        <p className="text-[12px] text-gray-400 leading-relaxed max-w-xs">
          Este escáner necesita estar vinculado a un negocio. Ábrelo desde el panel de Vendora o pide el enlace al administrador.
        </p>
        <p className="mt-5 text-[11px] font-mono bg-white/10 text-gray-300 px-3 py-2 rounded-lg border border-white/10">
          {window.location.origin}/scanner-app?negocio_id=TU_ID
        </p>
      </div>
    )
  }

  /* ─── Main native fullscreen scanner ────────────────────────── */
  return (
    <div className="fixed inset-0 h-screen w-screen bg-black overflow-hidden select-none">

      {/* Inject CSS to override the html5-qrcode library UI */}
      <style>{SCANNER_CSS}</style>

      {/* ── Layer 0: Camera feed (html5-qrcode mounts <video> here) ── */}
      <div id="camera-reader-view" className="absolute inset-0 z-0" />

      {/* ── Layer 1: Scanner overlay ─────────────────────────────── */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        {/* Dark vignette mask with transparent cutout for scan zone */}
        <div className="absolute inset-0 bg-black/40" />

        {/* Scan zone — transparent window punched through the overlay via box-shadow */}
        <div
          className="relative w-72 h-44 z-10 rounded-lg"
          style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.42)' }}
        >
          {/* ── Corner brackets only, NO red lines, NO animations ── */}
          <div className="absolute top-0 left-0 w-9 h-9 border-t-4 border-l-4 border-white rounded-tl-lg" />
          <div className="absolute top-0 right-0 w-9 h-9 border-t-4 border-r-4 border-white rounded-tr-lg" />
          <div className="absolute bottom-0 left-0 w-9 h-9 border-b-4 border-l-4 border-white rounded-bl-lg" />
          <div className="absolute bottom-0 right-0 w-9 h-9 border-b-4 border-r-4 border-white rounded-br-lg" />
        </div>
      </div>

      {/* ── Layer 2: Floating header ──────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-20 p-4 bg-gradient-to-b from-black/80 to-transparent flex flex-col gap-3 pointer-events-auto">

        {/* Top row — back arrow + status */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-md border border-white/20 hover:bg-white/25 transition-all"
          >
            <ArrowLeft size={17} className="text-white" />
          </Link>

          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[13px] font-bold text-white tracking-tight">Escáner Móvil Activo</span>
            </div>
            <span className="text-[10px] text-gray-300">
              {profile ? `${profile.nombre} · ${profile.negocio_id?.slice(0, 8)}…` : `Sin sesión · ID: ${resolvedNegocioId?.slice(0, 8)}…`}
            </span>
          </div>

          {/* Spacer to keep status centered */}
          <div className="w-9" />
        </div>

        {/* Mode switch pills */}
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setScanMode('form')}
            className={[
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border backdrop-blur-md',
              scanMode === 'form'
                ? 'bg-white/30 border-white/50 text-white shadow-sm'
                : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20 hover:text-white/90'
            ].join(' ')}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400" />
            Modo Formulario
          </button>

          <button
            onClick={() => setScanMode('continuous')}
            className={[
              'flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all border backdrop-blur-md',
              scanMode === 'continuous'
                ? 'bg-white/30 border-white/50 text-white shadow-sm'
                : 'bg-white/10 border-white/20 text-white/60 hover:bg-white/20 hover:text-white/90'
            ].join(' ')}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Modo Rápido / POS
          </button>
        </div>
      </div>

      {/* ── Layer 3: Camera permission error screen ───────────────── */}
      {cameraPermission === false && (
        <div className="absolute inset-0 z-30 bg-black/95 flex flex-col items-center justify-center p-6 text-center gap-4 pointer-events-auto">
          <div className="w-16 h-16 bg-red-500/15 rounded-3xl flex items-center justify-center border border-red-500/30">
            <ShieldAlert size={30} className="text-red-400" />
          </div>
          <div>
            <p className="text-[15px] font-bold text-white mb-1.5">Permiso de Cámara Denegado</p>
            <p className="text-[12px] text-gray-400 leading-relaxed max-w-[260px] mx-auto">
              Concede acceso a la cámara desde la configuración del navegador para poder escanear.
            </p>
          </div>
          <button
            onClick={startScanner}
            className="px-6 py-2.5 bg-white text-gray-900 rounded-xl text-[13px] font-bold hover:bg-gray-100 active:scale-95 transition-all"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* ── Layer 4: Floating footer ──────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center gap-3 pointer-events-none">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold">
          Último Código Leído
        </p>

        {lastScanned ? (
          <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-xl px-5 py-2.5 font-mono text-base tracking-widest flex items-center gap-2">
            <Sparkles size={14} className="text-emerald-400 shrink-0" />
            <span className="truncate max-w-[220px]">{lastScanned}</span>
          </div>
        ) : (
          <p className="text-[12px] text-gray-500 italic">
            Enfoque un código de barras para iniciar
          </p>
        )}
      </div>
    </div>
  )
}
