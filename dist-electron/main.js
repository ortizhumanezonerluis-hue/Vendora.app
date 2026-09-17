"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const database_1 = require("./db/database");
const repositories_1 = require("./db/repositories");
const backupService_1 = require("./backup/backupService");
const localScannerServer_1 = require("./server/localScannerServer");
let mainWindow = null;
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 680,
        title: 'Vendora POS - Sistema de Punto de Venta Local',
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: false
        },
        autoHideMenuBar: true
    });
    // Cargar URL de Vite en desarrollo o archivo estático compilado en producción
    if (process.env.VITE_DEV_SERVER_URL) {
        mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../dist/index.html'));
    }
    // Inicializar servidor de escáner en red local
    (0, localScannerServer_1.startLocalScannerServer)(mainWindow, 4321);
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
// ---------------- IPC HANDLERS ----------------
function setupIpcHandlers() {
    // Repositorios de base de datos
    electron_1.ipcMain.handle('db:getProductos', (_event, negocioId) => repositories_1.dbRepositories.getProductos(negocioId));
    electron_1.ipcMain.handle('db:getProductoById', (_event, id) => repositories_1.dbRepositories.getProductoById(id));
    electron_1.ipcMain.handle('db:getProductoByBarcode', (_event, barcode) => repositories_1.dbRepositories.getProductoByBarcode(barcode));
    electron_1.ipcMain.handle('db:saveProducto', (_event, prod) => repositories_1.dbRepositories.saveProducto(prod));
    electron_1.ipcMain.handle('db:deleteProducto', (_event, id) => repositories_1.dbRepositories.deleteProducto(id));
    electron_1.ipcMain.handle('db:smartLookupBarcodeOffline', (_event, barcode) => repositories_1.dbRepositories.smartLookupBarcodeOffline(barcode));
    electron_1.ipcMain.handle('db:registrarVenta', (_event, payload) => repositories_1.dbRepositories.registrarVenta(payload));
    electron_1.ipcMain.handle('db:getVentas', (_event, limit) => repositories_1.dbRepositories.getVentas(limit));
    electron_1.ipcMain.handle('db:getDetallesVenta', (_event, ventaId) => repositories_1.dbRepositories.getDetallesVenta(ventaId));
    electron_1.ipcMain.handle('db:getArqueoActivo', (_event, negocioId) => repositories_1.dbRepositories.getArqueoActivo(negocioId));
    electron_1.ipcMain.handle('db:getHistorialArqueos', (_event, limit) => repositories_1.dbRepositories.getHistorialArqueos(limit));
    electron_1.ipcMain.handle('db:abrirCaja', (_event, payload) => repositories_1.dbRepositories.abrirCaja(payload));
    electron_1.ipcMain.handle('db:cerrarCaja', (_event, payload) => repositories_1.dbRepositories.cerrarCaja(payload));
    electron_1.ipcMain.handle('db:getProveedores', () => repositories_1.dbRepositories.getProveedores());
    electron_1.ipcMain.handle('db:saveProveedor', (_event, prov) => repositories_1.dbRepositories.saveProveedor(prov));
    electron_1.ipcMain.handle('db:deleteProveedor', (_event, id) => repositories_1.dbRepositories.deleteProveedor(id));
    electron_1.ipcMain.handle('db:getSesionesAuditoria', () => repositories_1.dbRepositories.getSesionesAuditoria());
    electron_1.ipcMain.handle('db:createSesionAuditoria', (_event, sesion) => repositories_1.dbRepositories.createSesionAuditoria(sesion));
    electron_1.ipcMain.handle('db:saveDetallesAuditoria', (_event, sesionId, items) => repositories_1.dbRepositories.saveDetallesAuditoria(sesionId, items));
    electron_1.ipcMain.handle('db:getDetallesAuditoria', (_event, sesionId) => repositories_1.dbRepositories.getDetallesAuditoria(sesionId));
    electron_1.ipcMain.handle('db:getClientes', () => repositories_1.dbRepositories.getClientes());
    electron_1.ipcMain.handle('db:saveCliente', (_event, cliente) => repositories_1.dbRepositories.saveCliente(cliente));
    electron_1.ipcMain.handle('db:getConfiguracion', (_event, negocioId) => repositories_1.dbRepositories.getConfiguracion(negocioId));
    electron_1.ipcMain.handle('db:saveConfiguracion', (_event, cfg) => repositories_1.dbRepositories.saveConfiguracion(cfg));
    // Respaldo y Restauración
    electron_1.ipcMain.handle('backup:export', async () => (0, backupService_1.exportBackup)());
    electron_1.ipcMain.handle('backup:restore', async () => {
        const result = await (0, backupService_1.restoreBackup)();
        if (result.success && mainWindow) {
            mainWindow.reload();
        }
        return result;
    });
    // Escáner LAN
    electron_1.ipcMain.handle('scanner:getServerInfo', () => ({
        localIp: (0, localScannerServer_1.getLocalIpAddress)(),
        port: 4321,
        url: `http://${(0, localScannerServer_1.getLocalIpAddress)()}:4321`
    }));
    // Sistema
    electron_1.ipcMain.handle('system:getDatabasePath', () => (0, database_1.getDatabasePath)());
}
electron_1.app.whenReady().then(() => {
    // 1. Inicializar SQLite
    (0, database_1.initDatabase)();
    // 2. Registrar manejadores IPC
    setupIpcHandlers();
    // 3. Crear ventana
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    (0, localScannerServer_1.stopLocalScannerServer)();
    (0, database_1.closeDatabase)();
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
