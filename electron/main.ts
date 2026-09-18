import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import path from 'path'
import { startLocalScannerServer, stopLocalScannerServer, getLocalIpAddress } from './server/localScannerServer'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'Vendora POS',
    backgroundColor: '#ffffff',
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#ffffff',
      symbolColor: '#111827',
      height: 38
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false
    },
    autoHideMenuBar: true
  })

  // Cargar URL de Vite en desarrollo o archivo estático compilado en producción
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  // Inicializar servidor de escáner en red local
  startLocalScannerServer(mainWindow, 4321)

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ---------------- IPC HANDLERS ----------------
function setupIpcHandlers() {
  // Escáner LAN
  ipcMain.handle('scanner:getServerInfo', () => ({
    localIp: getLocalIpAddress(),
    port: 4321,
    url: `http://${getLocalIpAddress()}:4321`
  }))
}

app.whenReady().then(() => {
  setupIpcHandlers()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopLocalScannerServer()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  stopLocalScannerServer()
})
