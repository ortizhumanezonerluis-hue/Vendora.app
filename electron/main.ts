import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'path'
import { initDatabase, closeDatabase, getDatabasePath } from './db/database'
import { dbRepositories } from './db/repositories'
import { exportBackup, restoreBackup } from './backup/backupService'
import { startLocalScannerServer, stopLocalScannerServer, getLocalIpAddress } from './server/localScannerServer'

let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: 'Vendora POS - Sistema de Punto de Venta Local',
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
  // Repositorios de base de datos
  ipcMain.handle('db:getProductos', (_event, negocioId) => dbRepositories.getProductos(negocioId))
  ipcMain.handle('db:getProductoById', (_event, id) => dbRepositories.getProductoById(id))
  ipcMain.handle('db:getProductoByBarcode', (_event, barcode) => dbRepositories.getProductoByBarcode(barcode))
  ipcMain.handle('db:saveProducto', (_event, prod) => dbRepositories.saveProducto(prod))
  ipcMain.handle('db:deleteProducto', (_event, id) => dbRepositories.deleteProducto(id))
  ipcMain.handle('db:smartLookupBarcodeOffline', (_event, barcode) => dbRepositories.smartLookupBarcodeOffline(barcode))

  ipcMain.handle('db:registrarVenta', (_event, payload) => dbRepositories.registrarVenta(payload))
  ipcMain.handle('db:getVentas', (_event, limit) => dbRepositories.getVentas(limit))
  ipcMain.handle('db:getDetallesVenta', (_event, ventaId) => dbRepositories.getDetallesVenta(ventaId))

  ipcMain.handle('db:getArqueoActivo', (_event, negocioId) => dbRepositories.getArqueoActivo(negocioId))
  ipcMain.handle('db:getHistorialArqueos', (_event, limit) => dbRepositories.getHistorialArqueos(limit))
  ipcMain.handle('db:abrirCaja', (_event, payload) => dbRepositories.abrirCaja(payload))
  ipcMain.handle('db:cerrarCaja', (_event, payload) => dbRepositories.cerrarCaja(payload))

  ipcMain.handle('db:getProveedores', () => dbRepositories.getProveedores())
  ipcMain.handle('db:saveProveedor', (_event, prov) => dbRepositories.saveProveedor(prov))
  ipcMain.handle('db:deleteProveedor', (_event, id) => dbRepositories.deleteProveedor(id))

  ipcMain.handle('db:getSesionesAuditoria', () => dbRepositories.getSesionesAuditoria())
  ipcMain.handle('db:createSesionAuditoria', (_event, sesion) => dbRepositories.createSesionAuditoria(sesion))
  ipcMain.handle('db:saveDetallesAuditoria', (_event, sesionId, items) => dbRepositories.saveDetallesAuditoria(sesionId, items))
  ipcMain.handle('db:getDetallesAuditoria', (_event, sesionId) => dbRepositories.getDetallesAuditoria(sesionId))

  ipcMain.handle('db:getClientes', () => dbRepositories.getClientes())
  ipcMain.handle('db:saveCliente', (_event, cliente) => dbRepositories.saveCliente(cliente))

  ipcMain.handle('db:getConfiguracion', (_event, negocioId) => dbRepositories.getConfiguracion(negocioId))
  ipcMain.handle('db:saveConfiguracion', (_event, cfg) => dbRepositories.saveConfiguracion(cfg))

  // Respaldo y Restauración
  ipcMain.handle('backup:export', async () => exportBackup())
  ipcMain.handle('backup:restore', async () => {
    const result = await restoreBackup()
    if (result.success && mainWindow) {
      mainWindow.reload()
    }
    return result
  })

  // Escáner LAN
  ipcMain.handle('scanner:getServerInfo', () => ({
    localIp: getLocalIpAddress(),
    port: 4321,
    url: `http://${getLocalIpAddress()}:4321`
  }))

  // Sistema
  ipcMain.handle('system:getDatabasePath', () => getDatabasePath())
}

app.whenReady().then(() => {
  // 1. Inicializar SQLite
  initDatabase()

  // 2. Registrar manejadores IPC
  setupIpcHandlers()

  // 3. Crear ventana
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  stopLocalScannerServer()
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
