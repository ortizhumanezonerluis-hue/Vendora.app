"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const localScannerServer_1 = require("./server/localScannerServer");
let mainWindow = null;
function createWindow() {
    electron_1.Menu.setApplicationMenu(null);
    mainWindow = new electron_1.BrowserWindow({
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
    // Escáner LAN
    electron_1.ipcMain.handle('scanner:getServerInfo', () => ({
        localIp: (0, localScannerServer_1.getLocalIpAddress)(),
        port: 4321,
        url: `http://${(0, localScannerServer_1.getLocalIpAddress)()}:4321`
    }));
}
electron_1.app.whenReady().then(() => {
    setupIpcHandlers();
    createWindow();
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    (0, localScannerServer_1.stopLocalScannerServer)();
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('before-quit', () => {
    (0, localScannerServer_1.stopLocalScannerServer)();
});
