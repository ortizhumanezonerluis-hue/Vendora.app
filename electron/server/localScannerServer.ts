import http from 'http'
import os from 'os'
import { WebSocketServer, WebSocket } from 'ws'
import { BrowserWindow } from 'electron'

let httpServer: http.Server | null = null
let wss: WebSocketServer | null = null
let currentPort = 4321

export function getLocalIpAddress(): string {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name]
    if (ifaceList) {
      for (const iface of ifaceList) {
        // Ignorar IPv6 y localhost (127.0.0.1)
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address
        }
      }
    }
  }
  return '127.0.0.1'
}

const MOBILE_SCANNER_HTML = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Vendora Escáner Móvil Local</title>
  <script src="https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #000; color: #fff; height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
    #header { padding: 12px 16px; background: rgba(0,0,0,0.8); z-index: 10; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); }
    #status { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; animation: pulse 2s infinite; }
    @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.3; } 100% { opacity: 1; } }
    #reader { flex: 1; width: 100%; position: relative; }
    #footer { padding: 16px; background: rgba(0,0,0,0.9); z-index: 10; text-align: center; }
    #last-code { font-family: monospace; font-size: 16px; font-weight: bold; color: #34d399; margin-top: 4px; }
    .badge { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9ca3af; }
  </style>
</head>
<body>
  <div id="header">
    <div id="status"><div class="dot"></div> Vendora LAN Scanner</div>
    <div id="conn-status" style="font-size: 11px; color: #34d399;">Conectado a PC</div>
  </div>
  <div id="reader"></div>
  <div id="footer">
    <div class="badge">Último Código Leído</div>
    <div id="last-code">Apunta la cámara al código</div>
  </div>

  <script>
    let ws;
    let lastScanTime = 0;
    const connStatus = document.getElementById('conn-status');
    const lastCodeEl = document.getElementById('last-code');

    function connectWs() {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(proto + '//' + window.location.host);
      
      ws.onopen = () => {
        connStatus.textContent = '● Enlazado';
        connStatus.style.color = '#34d399';
      };
      
      ws.onclose = () => {
        connStatus.textContent = '○ Reconectando...';
        connStatus.style.color = '#f59e0b';
        setTimeout(connectWs, 2000);
      };
    }

    connectWs();

    const html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 20, qrbox: { width: 260, height: 160 } },
      (decodedText) => {
        const now = Date.now();
        if (now - lastScanTime > 1200) {
          lastScanTime = now;
          lastCodeEl.textContent = decodedText;
          if (navigator.vibrate) navigator.vibrate(80);
          if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'scan', barcode: decodedText }));
          }
        }
      },
      () => {}
    ).catch(err => {
      lastCodeEl.textContent = "Error de cámara: " + err;
    });
  </script>
</body>
</html>`

export function startLocalScannerServer(mainWindow: BrowserWindow, port: number = 4321): { localIp: string; port: number; url: string } {
  if (httpServer) {
    return {
      localIp: getLocalIpAddress(),
      port: currentPort,
      url: `http://${getLocalIpAddress()}:${currentPort}`
    }
  }

  currentPort = port
  const localIp = getLocalIpAddress()

  httpServer = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(MOBILE_SCANNER_HTML)
  })

  wss = new WebSocketServer({ server: httpServer })

  wss.on('connection', (ws: WebSocket) => {
    console.log('[LAN Scanner] Dispositivo móvil conectado al escáner local.')

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString())
        if (data.type === 'scan' && data.barcode) {
          console.log(`[LAN Scanner] Código recibido vía WebSocket local: ${data.barcode}`)
          mainWindow.webContents.send('scanner:code-received', data.barcode)
        }
      } catch (err) {
        console.error('[LAN Scanner] Error parseando mensaje:', err)
      }
    })
  })

  httpServer.listen(currentPort, '0.0.0.0', () => {
    console.log(`[LAN Scanner] Servidor local escuchando en: http://${localIp}:${currentPort}`)
  })

  return {
    localIp,
    port: currentPort,
    url: `http://${localIp}:${currentPort}`
  }
}

export function stopLocalScannerServer(): void {
  if (wss) {
    wss.close()
    wss = null
  }
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
  console.log('[LAN Scanner] Servidor local detenido.')
}
